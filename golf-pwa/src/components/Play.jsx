import { useState } from 'react';
import Stepper from './Stepper.jsx';
import { useGeolocation } from '../lib/useGeolocation.js';
import { distanceMeters } from '../lib/geo.js';
import { fmtToPar, isGIR, roundStats } from '../lib/stats.js';

function scoreStyle(strokes, par) {
  if (strokes == null) return '';
  const d = strokes - par;
  if (d <= -1) return 'border-red-700 bg-red-50 text-red-800';
  if (d === 0) return 'border-neutral-900 bg-white text-neutral-950';
  return 'border-neutral-900 bg-neutral-900 text-white';
}

function Distances({ hole, green, geo, gpsOn, setGpsOn, onMeasure }) {
  const [measuring, setMeasuring] = useState(false);
  const g = green || {};
  const hasGreen = !!(g.front || g.center || g.back);
  const d = (pt) => (geo.pos && pt ? Math.round(distanceMeters(geo.pos, pt)) : null);
  const cells = [
    { k: 'Anfang', v: d(g.front) },
    { k: 'Mitte', v: d(g.center), big: true },
    { k: 'Ende', v: d(g.back) },
  ];
  if (!gpsOn) {
    return (
      <button className="btn w-full py-4" onClick={() => setGpsOn(true)}>
        📍 GPS-Distanzen einschalten
      </button>
    );
  }
  return (
    <div className="rounded-2xl bg-turf-900 p-3 text-white">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-widest text-turf-100">Distanz zum Grün</div>
        <button className="text-sm font-bold text-turf-100 underline" onClick={() => setGpsOn(false)}>GPS aus</button>
      </div>
      <div className="mt-1 grid grid-cols-3 items-end gap-2 text-center">
        {cells.map((c) => (
          <div key={c.k}>
            <div className={`tnum font-black leading-none ${c.big ? 'text-6xl' : 'text-4xl'}`}>{c.v ?? '–'}</div>
            <div className="text-sm font-bold text-turf-100">{c.k}{c.v != null ? ' m' : ''}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-center text-xs text-turf-100">
        {geo.error
          ? geo.error
          : geo.status === 'ok'
            ? `Genauigkeit ± ${Math.round(geo.accuracy)} m`
            : 'Suche GPS-Signal …'}
      </div>
      {!hasGreen && !measuring && (
        <div className="mt-2 rounded-xl bg-white/10 p-2 text-center text-sm">
          Für dieses Loch sind noch keine Grün-Punkte gespeichert. Auf dem Grün einmal einmessen – danach stimmen die Distanzen.
        </div>
      )}
      {measuring ? (
        <div className="mt-3 flex flex-col gap-2 rounded-xl bg-white p-3 text-neutral-950">
          <div className="text-sm font-bold">Stell dich auf den Punkt und tippe:</div>
          <div className="grid grid-cols-3 gap-2">
            {[['front', 'Anfang'], ['center', 'Mitte'], ['back', 'Ende']].map(([k, t]) => (
              <button
                key={k}
                className={`h-14 rounded-xl border-2 text-base font-black ${g[k] ? 'border-turf-900 bg-turf-100' : 'border-neutral-900'}`}
                disabled={!geo.pos}
                onClick={() => onMeasure(hole.number, k, { lat: +geo.pos.lat.toFixed(6), lng: +geo.pos.lng.toFixed(6) })}
              >
                {g[k] ? '✓ ' : ''}{t} hier
              </button>
            ))}
          </div>
          {geo.accuracy > 15 && <div className="text-sm font-bold text-amber-800">GPS noch ungenau (± {Math.round(geo.accuracy)} m) – kurz warten.</div>}
          <button className="text-sm font-bold underline" onClick={() => setMeasuring(false)}>Fertig</button>
        </div>
      ) : (
        <button className="mt-2 w-full text-center text-sm font-bold text-turf-100 underline" onClick={() => setMeasuring(true)}>
          📍 Grün einmessen
        </button>
      )}
    </div>
  );
}

export default function Play({ round, onUpdateHole, onFinish, onExit, gpsOn, setGpsOn, greenFor, onMeasure }) {
  const [idx, setIdx] = useState(() => {
    const firstOpen = round.holes.findIndex((h) => !(h.strokes > 0));
    return firstOpen === -1 ? 0 : firstOpen;
  });
  const geo = useGeolocation(gpsOn);
  const hole = round.holes[idx];
  const stats = roundStats(round);
  const set = (patch) => onUpdateHole(idx, patch);
  const clampStrokes = (v) => (v < 1 ? null : Math.min(v, 15));
  const clampPutts = (v) => (v < 0 ? null : Math.min(v, Math.max((hole.strokes ?? 10) , 0)));
  const last = idx === round.holes.length - 1;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b-2 border-neutral-200 bg-white px-4 py-2">
        <button className="text-lg font-bold text-turf-800" onClick={onExit}>‹ Übersicht</button>
        <div className="tnum text-right">
          <div className="text-xs font-bold uppercase tracking-widest text-neutral-600">{round.courseName}</div>
          <div className="text-lg font-black">
            {stats.holesPlayed ? `${stats.strokes} (${fmtToPar(stats.toPar)})` : '–'} · {stats.holesPlayed}/{round.holes.length}
          </div>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto px-4 py-2" aria-label="Loch wählen">
        {round.holes.map((h, i) => (
          <button
            key={h.number}
            onClick={() => setIdx(i)}
            aria-current={i === idx}
            className={`tnum h-11 min-w-11 flex-none rounded-xl border-2 text-base font-black ${
              i === idx ? 'border-turf-900 bg-turf-900 text-white' : h.strokes > 0 ? 'border-neutral-900' : 'border-neutral-300 text-neutral-500'
            }`}
          >
            {h.number}
          </button>
        ))}
      </nav>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="label">Loch</div>
            <div className="tnum text-6xl font-black leading-none">{hole.number}</div>
          </div>
          <div className="flex gap-4 text-right">
            <div><div className="label">Par</div><div className="tnum text-4xl font-black">{hole.par}</div></div>
            <div><div className="label">HCP</div><div className="tnum text-4xl font-black">{hole.hcp}</div></div>
          </div>
        </div>

        <Distances hole={hole} green={greenFor(hole)} geo={geo} gpsOn={gpsOn} setGpsOn={setGpsOn} onMeasure={onMeasure} />

        <Stepper
          label="Schläge"
          value={hole.strokes}
          emphasis={scoreStyle(hole.strokes, hole.par)}
          onTap={() => hole.strokes == null && set({ strokes: hole.par })}
          onMinus={() => set({ strokes: clampStrokes((hole.strokes ?? hole.par + 1) - 1) })}
          onPlus={() => set({ strokes: clampStrokes(hole.strokes == null ? hole.par : hole.strokes + 1) })}
        />
        <Stepper
          label="Putts"
          value={hole.putts}
          emphasis="border-neutral-900"
          onTap={() => hole.putts == null && set({ putts: 2 })}
          onMinus={() => set({ putts: clampPutts((hole.putts ?? 1) - 1) })}
          onPlus={() => set({ putts: clampPutts(hole.putts == null ? 1 : hole.putts + 1) })}
        />

        {hole.par >= 4 ? (
          <div className="flex flex-col gap-2">
            <div className="label">Fairway (Abschlag)</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'L', t: '← Links' },
                { v: 'M', t: 'Mitte ✓' },
                { v: 'R', t: 'Rechts →' },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => set({ fairway: hole.fairway === o.v ? null : o.v })}
                  aria-pressed={hole.fairway === o.v}
                  className={`h-16 rounded-2xl border-2 text-lg font-black ${
                    hole.fairway === o.v
                      ? o.v === 'M' ? 'border-turf-900 bg-turf-700 text-white' : 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-900 bg-white'
                  }`}
                >
                  {o.t}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-neutral-600">Par 3 – keine Fairway-Wertung.</div>
        )}

        {hole.strokes > 0 && hole.putts != null && (
          <div className={`rounded-xl px-3 py-2 text-center font-bold ${isGIR(hole) ? 'bg-turf-100 text-turf-900' : 'bg-neutral-100 text-neutral-700'}`}>
            {isGIR(hole) ? 'Green in Regulation ✓' : 'Grün nicht in Regulation'}
          </div>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          <button className="btn py-4" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>‹ Loch {hole.number - 1 || ''}</button>
          {last ? (
            <button className="btn-primary py-4" onClick={onFinish}>Runde beenden</button>
          ) : (
            <button className="btn-primary py-4" onClick={() => setIdx(idx + 1)}>Loch {round.holes[idx + 1].number} ›</button>
          )}
        </div>
      </main>
    </div>
  );
}
