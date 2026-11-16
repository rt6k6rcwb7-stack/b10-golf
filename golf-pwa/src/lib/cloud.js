// Gemeinsame Daten der B10 (Spieler, Plätze, Turniere, Scorekarten).
// Mit Verbindung: Supabase-Tabelle "docs" (collection, id, data) über die REST-API.
// Ohne Verbindung: alles im LocalStorage dieses Geräts.
// Änderungen landen sofort lokal und werden im Hintergrund hochgeladen
// (auch wenn auf dem Platz gerade kein Netz ist).
import { useCallback, useEffect, useRef, useState } from 'react';

export const COLLECTIONS = ['players', 'courses', 'tournaments', 'scores'];
const CFG_KEY = 'golf.cloud.v1';
const CACHE_KEY = 'golf.shared.v1';
const QUEUE_KEY = 'golf.outbox.v1';
export const SEEDED_KEY = 'golf.seededAt.v1';
const POLL_MS = 15000;

const read = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* Speicher voll */ } };

export const loadConfig = () => read(CFG_KEY, null);
export const saveConfig = (c) => (c ? write(CFG_KEY, c) : localStorage.removeItem(CFG_KEY));
const enabled = (c) => !!(c && c.url && c.key && c.code);

// Einladungslink: …/#setup=<base64(JSON)> richtet die Verbindung mit einem Tipp ein.
export function readSetupFromHash() {
  const m = location.hash.match(/^#setup=(.+)$/);
  if (!m) return null;
  try {
    const cfg = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    history.replaceState(null, '', location.pathname + location.search);
    return enabled(cfg) ? cfg : null;
  } catch {
    return null;
  }
}
export function inviteLink(cfg) {
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify({ url: cfg.url, key: cfg.key, code: cfg.code }))));
  return `${location.origin}${location.pathname}#setup=${b64}`;
}

function api(cfg, path, opts = {}) {
  return fetch(`${cfg.url.replace(/\/$/, '')}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'x-b10-code': cfg.code,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  }).then(async (r) => {
    if (!r.ok) {
      const e = new Error(`Supabase ${r.status}`);
      e.status = r.status;
      throw e;
    }
    return r.status === 204 || r.headers.get('content-length') === '0' ? null : r.json().catch(() => null);
  });
}

// Verbindung prüfen: Lesen muss gehen; mit falschem Gruppen-Code liefert die Tabelle nichts.
export async function testConfig(cfg) {
  const rows = await api(cfg, 'docs?select=id&collection=eq.players&limit=1');
  return Array.isArray(rows);
}

async function pullAll(cfg) {
  const rows = await api(cfg, 'docs?select=collection,id,data');
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

  const connect = useCallback((c) => {
    // Bisher nur lokal erfasste Daten beim ersten Verbinden mit hochladen
    if (c && !enabled(cfg)) {
      const local = read(CACHE_KEY, {});
      const ops = [];
      // Nur selbst Angelegtes/Geändertes hochladen, nicht die mitgelieferten Startdaten
      const seededAt = read(SEEDED_KEY, 0);
      for (const col of COLLECTIONS) for (const [id, d] of Object.entries(local[col] || {})) if ((d.updatedAt || 0) > seededAt) ops.push({ type: 'set', col, id, data: d });
      queue.current = ops;
      write(QUEUE_KEY, ops);
    }
    saveConfig(c);
    setCfg(c);
  }, [cfg]);

  return { data, save, remove, status, cfg, connect, sync, seed };
}
