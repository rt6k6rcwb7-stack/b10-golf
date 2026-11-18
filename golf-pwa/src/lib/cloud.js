// Gemeinsame Daten der B10 (Spieler, Plätze, Turniere, Scorekarten).
// Mit Verbindung: Supabase-Tabelle "docs" (collection, id, data) über die REST-API.
// Ohne Verbindung: alles im LocalStorage dieses Geräts.
// Änderungen landen sofort lokal und werden im Hintergrund hochgeladen
// (auch wenn auf dem Platz gerade kein Netz ist).
import { useCallback, useEffect, useRef, useState } from 'react';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config.js';
import { accessToken, getSession, onAuthChange } from './auth.js';

export const COLLECTIONS = ['players', 'courses', 'tournaments', 'scores'];
const CFG_KEY = 'golf.cloud.v1';
const CACHE_KEY = 'golf.shared.v1';
const QUEUE_KEY = 'golf.outbox.v1';
export const SEEDED_KEY = 'golf.seededAt.v1';
const POLL_MS = 15000;

const read = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* Speicher voll */ } };

// Adresse/Schlüssel sind in der App hinterlegt – pro Gerät wird nur der Gruppen-Code gespeichert
export const hasBuiltinServer = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const withDefaults = (c) => (c && c.code ? { url: c.url || SUPABASE_URL, key: c.key || SUPABASE_ANON_KEY, code: String(c.code).trim() } : null);
const isDefault = (c) => baseUrl(c.url) === baseUrl(SUPABASE_URL) && c.key === SUPABASE_ANON_KEY;
// Verbindung = angemeldet (bevorzugt) oder übergangsweise Gruppen-Code
export const loadConfig = () => {
  const stored = withDefaults(read(CFG_KEY, null));
  if (getSession() && hasBuiltinServer) return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY, code: stored?.code || null, auth: true };
  return stored;
};
export const saveConfig = (c) => (c ? write(CFG_KEY, isDefault(c) ? { code: c.code } : c) : localStorage.removeItem(CFG_KEY));
export const enabled = (c) => !!(c && c.url && c.key && (c.code || c.auth));

// Einladung: Link …/#setup=<code> oder nur der <code>.
// Der Code ist base64url ohne "="-Auffüllung – Messenger (WhatsApp usw.) schneiden sonst das Linkende ab.
const toB64Url = (str) => btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function fromB64Url(code) {
  let b = code.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  return decodeURIComponent(escape(atob(b)));
}

// Akzeptiert den ganzen Link, nur den Code, auch wenn ein Messenger Zeichen kodiert oder Text drumherum steht
export function parseInvite(text) {
  if (!text) return null;
  // Zuerst wie eingefügt, dann ohne Leerzeichen/Zeilenumbrüche (Messenger brechen lange Codes um)
  return parseInviteOnce(text) || parseInviteOnce(String(text).replace(/\s+/g, ''));
}
function parseInviteOnce(text) {
  let t = String(text).trim();
  try { t = decodeURIComponent(t); } catch { /* bleibt */ }
  const m = t.match(/setup=([A-Za-z0-9+/_=-]+)/);
  const code = m ? m[1] : t.match(/^[A-Za-z0-9+/_=-]{8,}$/) ? t : null;
  if (!code) return null;
  try {
    const cfg = withDefaults(JSON.parse(fromB64Url(code.replace(/=+$/, ''))));
    return enabled(cfg) ? cfg : null;
  } catch {
    return null;
  }
}

export function readSetupFromHash() {
  if (!location.hash.includes('setup=')) return null;
  const cfg = parseInvite(location.hash);
  history.replaceState(null, '', location.pathname + location.search);
  return cfg;
}
export const inviteCode = (cfg) => toB64Url(JSON.stringify(isDefault(cfg) ? { code: cfg.code } : { url: cfg.url, key: cfg.key, code: cfg.code }));
export const inviteLink = (cfg) => `${location.origin}${location.pathname}#setup=${inviteCode(cfg)}`;

// Läuft die App vom Home-Bildschirm (eigener Speicher, startet immer ohne Einladung)?
export const isStandalone = () => window.navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;

// Adresse vereinheitlichen: angehängtes /rest/v1 und Schrägstriche entfernen
export const baseUrl = (url) => String(url || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '').replace(/\/+$/, '');

// Angemeldet: Anmelde-Token (Regeln „mitglieder …“). Sonst übergangsweise Gruppen-Code (Regeln „uebergang …“).
export async function api(cfg, path, opts = {}, retried = false) {
  const token = cfg.auth ? await accessToken({ force: retried }) : null;
  const r = await fetch(`${baseUrl(cfg.url)}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${token || cfg.key}`,
      ...(!token && cfg.code ? { 'x-b10-code': cfg.code } : {}),
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (r.status === 401 && token && !retried) return api(cfg, path, opts, true); // Token abgelaufen → erneuern, einmal wiederholen
  if (!r.ok) {
    const e = new Error(`Supabase ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return r.status === 204 || r.headers.get('content-length') === '0' ? null : r.json().catch(() => null);
}

// Verbindung prüfen: Lesen muss gehen; mit falschem Gruppen-Code liefert die Tabelle nichts.
export async function testConfig(cfg) {
  const rows = await api(cfg, 'docs?select=id&collection=eq.players&limit=1');
  return Array.isArray(rows) ? rows : null; // [] = Code falsch oder Gruppe noch leer
}

async function pullAll(cfg) {
  const rows = await api(cfg, 'docs?select=collection,id,data&collection=neq.holeimages');
  const out = Object.fromEntries(COLLECTIONS.map((c) => [c, {}]));
  for (const r of rows || []) if (out[r.collection]) out[r.collection][r.id] = r.data;
  return out;
}
function pushOne(cfg, op) {
  if (op.type === 'delete') {
    return api(cfg, `docs?collection=eq.${encodeURIComponent(op.col)}&id=eq.${encodeURIComponent(op.id)}`, { method: 'DELETE' });
  }
  return api(cfg, 'docs', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ collection: op.col, id: op.id, data: op.data, updated_at: new Date().toISOString() }),
  });
}

export function useShared() {
  const [cfg, setCfg] = useState(loadConfig);
  useEffect(() => onAuthChange(() => setCfg(loadConfig())), []);
  const [data, setData] = useState(() => ({ ...Object.fromEntries(COLLECTIONS.map((c) => [c, {}])), ...read(CACHE_KEY, {}) }));
  const [status, setStatus] = useState({ state: enabled(loadConfig()) ? 'syncing' : 'local', pending: read(QUEUE_KEY, []).length, at: null, error: null });
  const queue = useRef(read(QUEUE_KEY, []));
  const busy = useRef(false);

  const persist = (d) => write(CACHE_KEY, d);

  const sync = useCallback(async () => {
    if (!enabled(cfg) || busy.current) return;
    busy.current = true;
    try {
      while (queue.current.length) {
        await pushOne(cfg, queue.current[0]);
        queue.current = queue.current.slice(1);
        write(QUEUE_KEY, queue.current);
      }
      const remote = await pullAll(cfg);
      // Noch nicht hochgeladene eigene Änderungen behalten
      for (const op of queue.current) {
        if (op.type === 'delete') delete remote[op.col][op.id];
        else remote[op.col][op.id] = op.data;
      }
      setData(remote);
      persist(remote);
      setStatus({ state: 'online', pending: queue.current.length, at: Date.now(), error: null });
    } catch (e) {
      setStatus({
        state: 'offline',
        pending: queue.current.length,
        at: null,
        error: e.status === 401 || e.status === 403 ? 'Zugang abgelehnt – Gruppen-Code oder Schlüssel prüfen.' : 'Keine Verbindung – Änderungen werden später hochgeladen.',
      });
    } finally {
      busy.current = false;
    }
  }, [cfg]);

  useEffect(() => {
    if (!enabled(cfg)) { setStatus((s) => ({ ...s, state: 'local' })); return undefined; }
    sync();
    const t = setInterval(sync, POLL_MS);
    const onVis = () => document.visibilityState === 'visible' && sync();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', sync);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('online', sync); };
  }, [cfg, sync]);

  const enqueue = (op) => {
    if (!enabled(cfg)) return;
    // Ältere Änderungen am selben Dokument ersetzen
    queue.current = [...queue.current.filter((o) => !(o.col === op.col && o.id === op.id)), op];
    write(QUEUE_KEY, queue.current);
    setStatus((s) => ({ ...s, pending: queue.current.length }));
    clearTimeout(enqueue.t);
    enqueue.t = setTimeout(sync, 400);
  };

  const save = useCallback((col, id, doc) => {
    const full = { ...doc, id, updatedAt: Date.now() };
    setData((d) => { const n = { ...d, [col]: { ...d[col], [id]: full } }; persist(n); return n; });
    enqueue({ type: 'set', col, id, data: full });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, sync]);

  const remove = useCallback((col, id) => {
    setData((d) => { const m = { ...d[col] }; delete m[id]; const n = { ...d, [col]: m }; persist(n); return n; });
    enqueue({ type: 'delete', col, id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, sync]);

  // Startdaten (B10-Spieler, Plätze, Turnier) einmalig lokal einspielen, solange nichts verbunden ist
  const seed = useCallback((seedData) => {
    setData((d) => {
      if (COLLECTIONS.some((col) => Object.keys(d[col] || {}).length)) return d;
      write(SEEDED_KEY, Date.now());
      const n = { ...d, ...seedData };
      persist(n);
      return n;
    });
  }, []);

  // Bisher nur lokal erfasste Daten beim ersten Verbinden/Anmelden mit hochladen
  const queueLocalChanges = useCallback(() => {
    if (enabled(cfg)) return;
    {
      const local = read(CACHE_KEY, {});
      const ops = [];
      // Nur selbst Angelegtes/Geändertes hochladen, nicht die mitgelieferten Startdaten
      const seededAt = read(SEEDED_KEY, 0);
      for (const col of COLLECTIONS) for (const [id, d] of Object.entries(local[col] || {})) if ((d.updatedAt || 0) > seededAt) ops.push({ type: 'set', col, id, data: d });
      queue.current = ops;
      write(QUEUE_KEY, ops);
    }
  }, [cfg]);

  const connect = useCallback((raw) => {
    const c = raw ? withDefaults(raw) : null;
    if (c) queueLocalChanges();
    saveConfig(c);
    setCfg(loadConfig());
  }, [queueLocalChanges]);

  return { data, save, remove, status, cfg, connect, sync, seed, queueLocalChanges };
}
