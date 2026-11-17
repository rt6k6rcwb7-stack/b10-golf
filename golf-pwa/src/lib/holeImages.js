// Lochbilder: eigene Sammlung "holeimages" (id = <platzId>__<lochNr>), Daten als komprimiertes JPEG (data-URL).
// Auf dem Gerät in IndexedDB zwischengespeichert; vom Server wird nur geladen, was neu oder geändert ist.
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, enabled } from './cloud.js';

const COL = 'holeimages';
export const imageId = (courseId, number) => `${courseId}__${number}`;

// ---------- IndexedDB ----------
let dbp;
function idb() {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open('golf-images', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('img');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  return dbp;
}
async function tx(mode, fn) {
  const db = await idb();
  return new Promise((res, rej) => {
    const t = db.transaction('img', mode);
    const out = fn(t.objectStore('img'));
    t.oncomplete = () => res(out && 'result' in out ? out.result : out);
    t.onerror = () => rej(t.error);
  });
}
const idbAll = () => tx('readonly', (s) => {
  const out = {};
  const req = s.openCursor();
  req.onsuccess = () => { const c = req.result; if (c) { out[c.key] = c.value; c.continue(); } };
  return { get result() { return out; } };
});
const idbSet = (k, v) => tx('readwrite', (s) => s.put(v, k));
const idbDel = (k) => tx('readwrite', (s) => s.delete(k));

// ---------- Bild verkleinern (lange Seite max. 1200 px, JPEG) ----------
export function compressImage(file, maxSide = 1200, quality = 0.72) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Bild konnte nicht gelesen werden.')); };
    img.src = url;
  });
}

export function useHoleImages(cfg) {
  const [images, setImages] = useState({}); // id -> { data, at }
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  useEffect(() => { idbAll().then(setImages).catch(() => {}); }, []);

  const sync = useCallback(async () => {
    if (!enabled(cfg) || running.current) return;
    running.current = true;
    try {
      const list = await api(cfg, `docs?select=id,updated_at&collection=eq.${COL}`);
      const local = await idbAll();
      const remote = Object.fromEntries((list || []).map((r) => [r.id, Date.parse(r.updated_at)]));
      for (const id of Object.keys(local)) if (!(id in remote)) await idbDel(id);
      for (const [id, at] of Object.entries(remote)) {
        if (local[id] && local[id].at >= at) continue;
        const rows = await api(cfg, `docs?select=data&collection=eq.${COL}&id=eq.${encodeURIComponent(id)}`);
        const d = rows?.[0]?.data;
        if (d?.image) await idbSet(id, { data: d.image, at });
      }
      setImages(await idbAll());
    } catch {
      /* offline – Zwischenspeicher bleibt */
    } finally {
      running.current = false;
    }
  }, [cfg]);

  useEffect(() => {
    sync();
    const t = setInterval(sync, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [sync]);

  const setImage = useCallback(async (courseId, number, dataUrl) => {
    const id = imageId(courseId, number);
    setBusy(true);
    try {
      if (enabled(cfg)) {
        await api(cfg, 'docs', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({ collection: COL, id, data: { image: dataUrl, courseId, number }, updated_at: new Date().toISOString() }),
        });
      }
      await idbSet(id, { data: dataUrl, at: Date.now() });
      setImages(await idbAll());
    } finally {
      setBusy(false);
    }
  }, [cfg]);

  const removeImage = useCallback(async (courseId, number) => {
    const id = imageId(courseId, number);
    if (enabled(cfg)) await api(cfg, `docs?collection=eq.${COL}&id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    await idbDel(id);
    setImages(await idbAll());
  }, [cfg]);

  const imageFor = useCallback((courseId, number) => images[imageId(courseId, number)]?.data || null, [images]);

  return { imageFor, setImage, removeImage, busy, sync, count: (courseId) => Object.keys(images).filter((k) => k.startsWith(courseId + '__')).length };
}
