// Loch-für-Loch-Eingabe mit GPS-Distanz – für eigene Runden und Turnier-Scorekarten.
import { useState } from 'react';
import Stepper from './Stepper.jsx';
import { useGeolocation } from '../lib/useGeolocation.js';
import { distanceMeters } from '../lib/geo.js';

const GPS_KEY = 'golf.gpsOn.v1';

function scoreStyle(strokes, par) {
  if (strokes == null) return '';
  const d = strokes - par;
  if (d <= -1) return 'border-red-700 bg-red-50 text-red-800';
  if (d === 0) return 'border-neutral-900 bg-white text-neutral-950';
  return 'border-neutral-900 bg-neutral-900 text-white';
}

function Distances({ hole, geo, gpsOn, setGpsOn, onMeasure }) {
  const [measuring, setMeasuring] = useState(false);
  const g = hole.green || {};
  const hasGreen = !!(g.front || g.center || g.back);
  const d = (pt) => (geo.pos && pt ? Math.round(distanceMeters(geo.pos, pt)) : null);
  if (!gpsOn) {
    return <button className="btn w-full py-4" onClick={() => setGpsOn(true)}>📍 GPS-Distanzen einschalten</button>;
  }
  return (
    <div className="rounded-2xl bg-turf-900 p-3 text-white">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-widest text-turf-100">Distanz zum Grün</div>
        <button className="text-sm font-bold text-turf-100 underline" onClick={() => setGpsOn(false)}>GPS aus</button>
      </div>
      <div className="mt-1 grid grid-cols-3 items-end gap-2 text-center">
        {[['Anfang', g.front], ['Mitte', g.center, true], ['Ende', g.back]].map(([k, pt, big]) => {
          const v = d(pt);
          return (
            <div key={k}>
              <div className={`tnum font-black leading-none ${big ? 'text-6xl' : 'text-4xl'}`}>{v ?? '–'}</div>
              <div className="text-sm font-bold text-turf-100">{k}{v != null ? ' m' : ''}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-center text-xs text-turf-100">
        {geo.error ? geo.error : geo.status === 'ok' ? `Genauigkeit ± ${Math.round(geo.accuracy)} m` : 'Suche GPS-Signal …'}
      </div>
      {!hasGreen && !measuring && (
        <div className="mt-2 rounded-xl bg-white/10 p-2 text-center text-sm">
          Für dieses Loch sind noch keine Grün-Punkte gespeichert. Einmal auf dem Grün einmessen – dann stimmen die Distanzen für alle.
        </div>
      )}
      {onMeasure && (measuring ? (
        <div className="mt-3 flex flex-col gap-2 rounded-xl bg-white p-3 text-neutral-950">
          <div className="text-sm font-bold">Stell dich auf den Punkt und tippe:</div>
          <div className="grid grid-cols-3 gap-2">
            {[['front', 'Anfang'], ['center', 'Mitte'], ['back', 'Ende']].map(([k, t]) => (
              <button key={k} disabled={!geo.pos}
                className={`h-14 rounded-xl border-2 text-base font-black ${g[k] ? 'border-turf-900 bg-turf-100' : 'border-neutral-900'}`}
                onClick={() => onMeasure(k, { lat: +geo.pos.lat.toFixed(6), lng: +geo.pos.lng.toFixed(6) })}>
                {g[k] ? '✓ ' : ''}{t} hier
              </button>
            ))}
          </div>
          {geo.accuracy > 15 && <div className="text-sm font-bold text-amber-800">GPS noch ungenau (± {Math.round(geo.accuracy)} m) – kurz warten.</div>}
          <button className="text-sm font-bold underline" onClick={() => setMeasuring(false)}>Fertig</button>
        </div>
      ) : (
        <button className="mt-2 w-full text-center text-sm font-bold text-turf-100 underline" onClick={() => setMeasuring(true)}>📍 Grün einmessen</button>
      ))}
    </div>
  );
}

export default function HoleEntry({ holes, values, onSet, recv, stableford, onMeasure, readOnly, startIdx = 0, footer }) {
  const [idx, setIdx] = useState(Math.min(startIdx, holes.length - 1));
  const [gpsOn, setGpsOnRaw] = useState(() => { try { return localStorage.getItem(GPS_KEY) === '1'; } catch { return false; } });
  const setGpsOn = (v) => { setGpsOnRaw(v); try { localStorage.setItem(GPS_KEY, v ? '1' : '0'); } catch { /* egal */ } };
  const geo = useGeolocation(gpsOn);
  const hole = holes[idx];
  if (!hole) return null;
  const i = idx;
  const strokes = values.strokes?.[i] ?? null;
  const putts = values.putts?.[i] ?? null;
  const fairway = values.fairway?.[i] ?? null;
  const rv = recv?.[i] || 0;
  const set = (patch) => !readOnly && onSet(i, patch);
  const clampS = (v) => (v < 1 ? null : Math.min(v, 15));
  const clampP = (v) => (v < 0 ? null : Math.min(v, strokes ?? 10));
  const gir = strokes > 0 && putts != null && strokes - putts <= hole.par - 2;
  const last = idx === holes.length - 1;

  return (
    <div className="flex flex-col gap-4">
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4" aria-label="Loch wählen">
        {holes.map((h, k) => (
          <button key={h.number} onClick={() => setIdx(k)} aria-current={k === idx}
            className={`tnum h-11 min-w-11 flex-none rounded-xl border-2 text-base font-black ${
              k === idx ? 'border-turf-900 bg-turf-900 text-white' : values.strokes?.[k] > 0 ? 'border-neutral-900' : 'border-neutral-300 text-neutral-500'}`}>
            {h.number}
          </button>
        ))}
      </nav>

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="label">Loch</div>
          <div className="tnum text-6xl font-black leading-none">{hole.number}</div>
        </div>
        <div className="flex gap-4 text-right">
          {recv && <div><div className="label">Vorgabe</div><div className="tnum text-4xl font-black text-turf-800">{rv > 0 ? '●'.repeat(rv) : rv < 0 ? rv : '–'}</div></div>}
          <div><div className="label">Par</div><div className="tnum text-4xl font-black">{hole.par}</div></div>
          <div><div className="label">HCP</div><div className="tnum text-4xl font-black">{hole.si ?? '–'}</div></div>
        </div>
      </div>
      {hole.note && <div className="rounded-xl bg-amber-100 px-3 py-2 font-bold text-amber-950">⚑ {hole.note}</div>}

      <Distances hole={hole} geo={geo} gpsOn={gpsOn} setGpsOn={setGpsOn} onMeasure={onMeasure && ((which, pos) => onMeasure(i, which, pos))} />

      <Stepper label="Schläge" value={strokes} emphasis={scoreStyle(strokes, hole.par)}
        onTap={() => strokes == null && set({ strokes: hole.par })}
        onMinus={() => set({ strokes: clampS((strokes ?? hole.par + 1) - 1) })}
        onPlus={() => set({ strokes: clampS(strokes == null ? hole.par : strokes + 1) })} />
      <Stepper label="Putts" value={putts} emphasis="border-neutral-900"
        onTap={() => putts == null && set({ putts: 2 })}
        onMinus={() => set({ putts: clampP((putts ?? 1) - 1) })}
        onPlus={() => set({ putts: clampP(putts == null ? 1 : putts + 1) })} />

      {hole.par >= 4 ? (
        <div className="flex flex-col gap-2">
          <div className="label">Fairway (Abschlag)</div>
          <div className="grid grid-cols-3 gap-2">
            {[{ v: 'L', t: '← Links' }, { v: 'M', t: 'Mitte ✓' }, { v: 'R', t: 'Rechts →' }].map((o) => (
              <button key={o.v} aria-pressed={fairway === o.v} onClick={() => set({ fairway: fairway === o.v ? null : o.v })}
                className={`h-16 rounded-2xl border-2 text-lg font-black ${fairway === o.v
                  ? o.v === 'M' ? 'border-turf-900 bg-turf-700 text-white' : 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-900 bg-white'}`}>
                {o.t}
              </button>
            ))}
          </div>
        </div>
      ) : <div className="text-sm text-neutral-600">Par 3 – keine Fairway-Wertung.</div>}

      {strokes > 0 && (
        <div className="flex flex-wrap justify-center gap-2 text-center font-bold">
          {putts != null && <span className={`rounded-xl px-3 py-2 ${gir ? 'bg-turf-100 text-turf-900' : 'bg-neutral-100 text-neutral-700'}`}>{gir ? 'Green in Regulation ✓' : 'Kein GIR'}</span>}
          {recv && <span className="rounded-xl bg-neutral-100 px-3 py-2">Netto {strokes - rv}</span>}
          {stableford && <span className="rounded-xl bg-neutral-100 px-3 py-2">{Math.max(0, 2 + hole.par + rv - strokes)} Pkt netto</span>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button className="btn py-4" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>‹ Loch {idx > 0 ? holes[idx - 1].number : ''}</button>
        {last ? (footer || <span />) : (
          <button className="btn-primary py-4" onClick={() => setIdx(idx + 1)}>Loch {holes[idx + 1].number} ›</button>
        )}
      </div>
    </div>
  );
}
