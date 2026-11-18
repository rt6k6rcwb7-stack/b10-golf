// Anmeldung per E-Mail-Code (Supabase Auth, ohne Bibliothek über die REST-API).
// Bewusst mit 6-stelligem Code statt Link: Auf dem iPhone öffnet ein Link Safari,
// nicht die App vom Home-Bildschirm (die hat einen eigenen Speicher).
// create_user: false – neue Konten entstehen hier nie; nur eingeladene E-Mails können sich anmelden.
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config.js';

const KEY = 'golf.session.v1';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
let session = read();
const listeners = new Set();

export const getSession = () => session;
export const onAuthChange = (f) => { listeners.add(f); return () => listeners.delete(f); };
function setSession(s) {
  session = s;
  try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch { /* egal */ }
  listeners.forEach((f) => f(s));
}

const base = () => SUPABASE_URL.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');

async function authCall(path, body, token) {
  const r = await fetch(`${base()}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body || {}),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(data.msg || data.error_description || data.message || `Auth ${r.status}`);
    e.status = r.status;
    e.code = data.error_code || data.code;
    throw e;
  }
  return data;
}

const fromResponse = (d) => ({
  access_token: d.access_token,
  refresh_token: d.refresh_token,
  expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600),
  email: d.user?.email || session?.email || '',
  userId: d.user?.id || session?.userId || '',
});

const normEmail = (email) => String(email || '').trim().toLowerCase();

export async function sendLoginCode(email) {
  await authCall('otp', { email: normEmail(email), create_user: false });
}

export async function verifyLoginCode(email, token) {
  const d = await authCall('verify', { type: 'email', email: normEmail(email), token: String(token).replace(/\s+/g, '') });
  setSession(fromResponse(d));
  return session;
}

let refreshing = null;
async function refresh() {
  if (!session?.refresh_token) return;
  if (!refreshing) {
    refreshing = authCall('token?grant_type=refresh_token', { refresh_token: session.refresh_token })
      .then((d) => setSession(fromResponse(d)))
      .catch((e) => { if (e.status === 400 || e.status === 401 || e.status === 403) setSession(null); /* sonst offline: alte Sitzung behalten */ })
      .finally(() => { refreshing = null; });
  }
  await refreshing;
}

// Gültiges Token liefern (kurz vor Ablauf erneuern)
export async function accessToken({ force = false } = {}) {
  if (!session) return null;
  if (force || session.expires_at * 1000 - Date.now() < 60_000) await refresh();
  return session?.access_token || null;
}

export function signOut() {
  const t = session?.access_token;
  setSession(null);
  if (t) authCall('logout', {}, t).catch(() => {});
}

// Verständliche Meldungen für die häufigsten Fehler
export function authErrorText(e) {
  const m = `${e?.code || ''} ${e?.message || ''}`.toLowerCase();
  if (e?.status === 429 || m.includes('rate') || m.includes('security purposes')) return 'Zu viele Versuche – bitte ein paar Minuten warten.';
  if (m.includes('signup') || m.includes('not found') || m.includes('otp_disabled') || m.includes('not allowed')) return 'Diese E-Mail ist nicht eingeladen. Bitte beim B10-Admin melden.';
  if (m.includes('expired') || m.includes('invalid') || m.includes('token')) return 'Code falsch oder abgelaufen – bitte neuen Code anfordern.';
  if (m.includes('email') && m.includes('send')) return 'E-Mail konnte nicht verschickt werden (E-Mail-Versand in Supabase prüfen).';
  if (e instanceof TypeError) return 'Keine Verbindung – Internet prüfen.';
  return `Anmeldung fehlgeschlagen (${e?.message || 'unbekannt'}).`;
}
