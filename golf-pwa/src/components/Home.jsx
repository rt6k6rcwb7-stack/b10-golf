import { fmtToPar, overallStats, roundStats } from '../lib/stats.js';

function Kpi({ label, value, sub }) {
  return (
    <div className="rounded-2xl border-2 border-neutral-200 p-3">
      <div className="label">{label}</div>
      <div className="tnum text-3xl font-black">{value ?? '–'}</div>
      {sub && <div className="text-sm text-neutral-600">{sub}</div>}
    </div>
  );
}

export default function Home({ rounds, activeRound, onNew, onResume, onOpen }) {
  const o = overallStats(rounds);
  const list = [...rounds].sort((a, b) => b.startedAt - a.startedAt);
  return (
    <div className="flex flex-col gap-5 p-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <div className="label">Persönliche Golf-App</div>
          <h1 className="text-4xl font-black tracking-tight">Golf</h1>
        </div>
        <button className="btn-primary" onClick={onNew}>+ Neue Runde</button>
      </header>

      {activeRound && (
        <button className="rounded-2xl border-2 border-turf-900 bg-turf-50 p-4 text-left" onClick={onResume}>
          <div className="label text-turf-800">Laufende Runde</div>
          <div className="text-xl font-bold">{activeRound.courseName}</div>
          <div className="text-neutral-700">
            {roundStats(activeRound).holesPlayed} von {activeRound.holes.length} Löchern gespielt · weiterspielen ›
          </div>
        </button>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-black">Statistik</h2>
        {o ? (
          <div className="grid grid-cols-2 gap-2">
            <Kpi label="Runden" value={o.rounds} />
            <Kpi label="Ø Score (18)" value={o.avgScore18?.toFixed(1)} sub={o.best18 ? `Beste: ${o.best18}` : 'noch keine 18er-Runde'} />
            <Kpi label="Ø Putts / Runde" value={o.avgPutts?.toFixed(1)} sub={o.puttsPerHole ? `${o.puttsPerHole.toFixed(2)} pro Loch` : null} />
            <Kpi label="Greens in Regulation" value={o.girPct != null ? `${Math.round(o.girPct)} %` : null} />
            <Kpi label="Fairways getroffen" value={o.fairwayPct != null ? `${Math.round(o.fairwayPct)} %` : null} sub="Par 4 und 5" />
          </div>
        ) : (
          <p className="rounded-2xl border-2 border-dashed border-neutral-300 p-4 text-neutral-600">
            Nach deiner ersten beendeten Runde siehst du hier Ø-Score, Putts, Greens in Regulation und Fairway-Quote.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-black">Runden</h2>
        {!list.length && <p className="text-neutral-600">Noch keine Runden gespeichert.</p>}
        <ul className="flex flex-col divide-y-2 divide-neutral-100 border-y-2 border-neutral-100">
          {list.map((r) => {
            const s = roundStats(r);
            return (
              <li key={r.id}>
                <button className="flex w-full items-center gap-3 py-3 text-left" onClick={() => onOpen(r.id)}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{r.courseName}</div>
                    <div className="text-sm text-neutral-600">
                      {new Date(r.startedAt).toLocaleDateString('de-DE')} · {r.holes.length} Löcher
                      {s.putts != null ? ` · ${s.putts} Putts` : ''} · GIR {s.gir}
                      {!r.finished ? ' · läuft' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tnum text-2xl font-black">{s.holesPlayed ? s.strokes : '–'}</div>
                    <div className={`tnum text-sm font-bold ${s.toPar < 0 ? 'text-red-700' : 'text-neutral-600'}`}>
                      {s.holesPlayed ? fmtToPar(s.toPar) : ''}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
