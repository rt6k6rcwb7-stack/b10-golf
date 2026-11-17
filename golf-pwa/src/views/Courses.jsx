import { useState } from 'react';
import Modal, { DangerButton, Field, inputCls } from '../components/Modal.jsx';
import { coursePar, num, uid } from '../lib/golf.js';
import { compressImage } from '../lib/holeImages.js';

const defaultHoles = (n) => Array.from({ length: n }, (_, i) => ({ par: 4, si: n === 9 ? i * 2 + 1 : i + 1, len: '', note: '' }));

export default function Courses({ S, save, remove, imgs }) {
  const [edit, setEdit] = useState(null);
  const list = Object.values(S.courses).sort((a, b) => (b.home ? 1 : 0) - (a.home ? 1 : 0) || a.name.localeCompare(b.name));
  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-end justify-between gap-3">
        <div><div className="label">Spielorte</div><h1 className="text-4xl font-black tracking-tight">Plätze</h1></div>
        <button className="btn-primary shrink-0 whitespace-nowrap" onClick={() => setEdit('new')}>+ Platz</button>
      </header>
      <ul className="flex flex-col divide-y-2 divide-neutral-100 border-y-2 border-neutral-100">
        {list.map((c) => {
          const greens = (c.holes || []).filter((h) => h.green && (h.green.center || h.green.front)).length;
          return (
            <li key={c.id}>
              <button className="flex w-full items-center gap-3 py-3 text-left" onClick={() => setEdit(c.id)}>
                <div className="tnum w-12 text-2xl font-black">{(c.holes || []).length}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-bold">{c.name}{c.home && <span className="ml-2 rounded bg-turf-900 px-1.5 py-0.5 align-middle text-xs font-bold uppercase text-white">Heimatplatz</span>}</div>
                  <div className="text-sm text-neutral-600">
                    {c.location ? `${c.location} · ` : ''}Par {coursePar(c)} · {(c.tees || []).map((t) => `${t.name}${t.crM ? ` ${t.crM}/${t.slopeM}` : ''}`).join(', ')}
                  </div>
                  <div className="text-sm text-neutral-600">📍 GPS: {greens}/{(c.holes || []).length} Grüns · 🖼 {imgs?.count(c.id) || 0}/{(c.holes || []).length} Lochbilder</div>
                </div>
                <span className="text-neutral-400">›</span>
              </button>
            </li>
          );
        })}
      </ul>
      {edit && <CourseModal S={S} imgs={imgs} id={edit === 'new' ? null : edit} onClose={() => setEdit(null)}
        onSave={(id, d) => { save('courses', id, d); setEdit(null); }} onDelete={(id) => { remove('courses', id); setEdit(null); }} />}
    </div>
  );
}

function CourseModal({ S, imgs, id, onClose, onSave, onDelete }) {
  const [imgMsg, setImgMsg] = useState(null);
  async function upload(files, firstHole) {
    const list = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    try {
      for (let k = 0; k < list.length && firstHole + k <= f.holes.length; k++) {
        setImgMsg(`Lade Bild ${k + 1} von ${list.length} hoch …`);
        await imgs.setImage(id, firstHole + k, await compressImage(list[k]));
      }
      setImgMsg(list.length > 1 ? `${Math.min(list.length, f.holes.length - firstHole + 1)} Bilder gespeichert (nach Dateiname sortiert ab Loch ${firstHole}).` : 'Bild gespeichert.');
    } catch (e) {
      setImgMsg('Hochladen fehlgeschlagen – Verbindung prüfen und erneut versuchen.');
    }
  }
  const c = id ? S.courses[id] : { name: '', location: '', notes: '', home: false, holes: defaultHoles(18), tees: [{ name: 'Gelb', crM: '', slopeM: '', crW: '', slopeW: '' }] };
  const [f, setF] = useState(() => ({ ...c, holes: c.holes.map((h) => ({ ...h })), tees: (c.tees || []).map((t) => ({ ...t })) }));
  const [armed, setArmed] = useState(false);
  const setHole = (i, k, v) => setF({ ...f, holes: f.holes.map((h, j) => (j === i ? { ...h, [k]: v } : h)) });
  const setTee = (i, k, v) => setF({ ...f, tees: f.tees.map((t, j) => (j === i ? { ...t, [k]: v } : t)) });
  const sis = f.holes.map((h) => h.si).filter((v) => v !== '' && v != null).map(Number);
  const dupSi = sis.length !== new Set(sis).size;
  const usedIn = id && Object.values(S.tournaments).some((t) => (t.rounds || []).some((r) => r.courseId === id));
  // Eigene Feldklasse ohne w-full, damit die festen Breiten greifen
  const small = 'rounded-lg border-2 border-neutral-300 bg-white px-2 py-1.5 text-base tnum focus:border-turf-900 focus:outline-none';
  return (
    <Modal title={id ? 'Platz bearbeiten' : 'Neuer Platz'} onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Ort"><input className={inputCls} value={f.location || ''} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Field label="Löcher">
          <select className={inputCls} value={f.holes.length} onChange={(e) => {
            const n = +e.target.value;
            setF({ ...f, holes: n === 9 ? f.holes.slice(0, 9) : [...f.holes, ...defaultHoles(18).slice(f.holes.length)] });
          }}><option value={18}>18</option><option value={9}>9</option></select>
        </Field>
        <label className="mt-5 flex items-center gap-2 font-bold"><input type="checkbox" className="h-6 w-6 accent-green-800" checked={!!f.home} onChange={(e) => setF({ ...f, home: e.target.checked })} /> Heimatplatz</label>
      </div>
      <Field label="Besonderheiten & Platzregeln"><textarea className={`${inputCls} h-20`} value={f.notes || ''} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>

      <h3 className="text-lg font-black">Abschläge</h3>
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wider text-neutral-600"><th className="p-1">Name</th><th className="p-1">CR H</th><th className="p-1">Slope H</th><th className="p-1">CR D</th><th className="p-1">Slope D</th><th /></tr></thead>
          <tbody>
            {f.tees.map((t, i) => (
              <tr key={i}>
                {['name', 'crM', 'slopeM', 'crW', 'slopeW'].map((k) => (
                  <td key={k} className="p-1"><input className={`${small} ${k === 'name' ? 'w-24' : 'w-[4.5rem]'}`} inputMode={k === 'name' ? 'text' : 'decimal'} value={t[k] ?? ''} onChange={(e) => setTee(i, k, e.target.value.replace(',', '.'))} /></td>
                ))}
                <td><button className="px-2 text-2xl text-neutral-500" onClick={() => setF({ ...f, tees: f.tees.filter((_, j) => j !== i) })} aria-label="Abschlag entfernen">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn self-start" onClick={() => setF({ ...f, tees: [...f.tees, { name: '' }] })}>+ Abschlag</button>

      <h3 className="text-lg font-black">Löcher</h3>
      <p className="-mt-2 text-sm text-neutral-600">HCP = Handicap-Reihenfolge (1 = schwerstes Loch). Par gesamt {f.holes.reduce((s, h) => s + num(h.par, 0), 0)}.{dupSi && <b className="text-red-700"> HCP-Werte doppelt vergeben!</b>}</p>
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wider text-neutral-600"><th className="p-1">#</th><th className="p-1">Par</th><th className="p-1">HCP</th><th className="p-1">Meter</th><th className="p-1">Besonderheit</th><th className="p-1">GPS</th><th className="p-1">Bild</th></tr></thead>
          <tbody>
            {f.holes.map((h, i) => (
              <tr key={i}>
                <td className="p-1 text-center text-lg font-black">{i + 1}</td>
                <td className="p-1"><input className={`${small} w-12 text-center`} inputMode="numeric" value={h.par ?? ''} onChange={(e) => setHole(i, 'par', e.target.value)} /></td>
                <td className="p-1"><input className={`${small} w-12 text-center`} inputMode="numeric" value={h.si ?? ''} onChange={(e) => setHole(i, 'si', e.target.value)} /></td>
                <td className="p-1"><input className={`${small} w-16 text-center`} inputMode="numeric" value={h.len ?? ''} onChange={(e) => setHole(i, 'len', e.target.value)} /></td>
                <td className="p-1"><input className={`${small} w-48`} value={h.note ?? ''} placeholder="z. B. Wasser links" onChange={(e) => setHole(i, 'note', e.target.value)} /></td>
                <td className="p-1 text-center">{h.green?.center || h.green?.front ? '✓' : ''}</td>
                <td className="p-1">
                  {id && imgs && (imgs.imageFor(id, i + 1) ? (
                    <span className="flex items-center gap-1">
                      <img src={imgs.imageFor(id, i + 1)} alt={`Loch ${i + 1}`} className="h-10 w-10 rounded object-cover" />
                      <button className="px-1 text-xl text-neutral-500" aria-label={`Bild Loch ${i + 1} entfernen`} onClick={() => imgs.removeImage(id, i + 1).catch(() => setImgMsg('Löschen fehlgeschlagen.'))}>×</button>
                    </span>
                  ) : (
                    <label className="block cursor-pointer rounded-lg border-2 border-dashed border-neutral-300 px-2 py-1.5 text-center text-lg" aria-label={`Bild für Loch ${i + 1} wählen`}>
                      📷<input type="file" accept="image/*" hidden onChange={(e) => e.target.files.length && upload(e.target.files, i + 1)} />
                    </label>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-neutral-600">GPS-Punkte der Grüns werden in einer Runde über „📍 Grün einmessen“ gesetzt und gelten dann für alle.</p>

      <h3 className="text-lg font-black">Lochbilder</h3>
      {id ? (
        <>
          <p className="-mt-2 text-sm text-neutral-600">
            Erscheinen beim Spielen über dem Loch (antippen = Vollbild) – für alle B10-Spieler. Einzeln über 📷 in der Tabelle,
            oder alle auf einmal: Dateien so benennen, dass sie nach Loch sortiert sind (z. B. „01.jpg“ … „18.jpg“).
            Bitte nur Bilder verwenden, die ihr nutzen dürft (z. B. eigene Fotos der Lochtafeln).
          </p>
          <label className="btn cursor-pointer self-start">
            Mehrere Bilder wählen (ab Loch 1)
            <input type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files.length && upload(e.target.files, 1)} />
          </label>
          {imgMsg && <div className="text-sm font-bold">{imgMsg}</div>}
        </>
      ) : <p className="-mt-2 text-sm text-neutral-600">Platz zuerst speichern, dann können Lochbilder hinzugefügt werden.</p>}

      <div className="flex flex-wrap justify-between gap-2">
        {id ? <DangerButton armed={armed} setArmed={setArmed} confirmText={usedIn ? 'Wird im Turnier genutzt – trotzdem?' : 'Wirklich löschen?'} onConfirm={() => onDelete(id)}>Löschen</DangerButton> : <span />}
        <button className="btn-primary" disabled={!f.name.trim()} onClick={() => onSave(id || uid(), {
          ...f, name: f.name.trim(),
          holes: f.holes.map((h) => ({ ...h, par: num(h.par, 4), si: h.si === '' || h.si == null ? null : num(h.si, null) })),
          tees: f.tees.filter((t) => t.name), createdAt: c.createdAt || Date.now(),
        })}>Speichern</button>
      </div>
    </Modal>
  );
}
