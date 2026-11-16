import { useState } from 'react';
import { fmtToPar, isGIR, roundStats } from '../lib/stats.js';

export default function RoundDetail({ round, onBack, onResume, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  const s = roundStats(round);
  const cell = 'border border-neutral-300 px-2 py-1 text-center';
  return (
    <div className="flex flex-col gap-4 p-4">
      <button className="self-start text-lg font-bold text-turf-800" onClick={onBack}>‹ Übersicht</button>
      <div>
        <div className="label">{new Date(round.startedAt).toLocaleDateString('de-DE')}</div>
        <h1 className="text-3xl font-black">{round.courseName}</h1>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          ['Score', s.holesPlayed ? `${s.strokes} (${fmtToPar(s.toPar)})` : '–'],
          ['Putts', s.putts ?? '–'],
          ['GIR', `${s.gir}/${s.holesPlayed}${s.girPct != null ? ` · ${s.girPct} %` : ''}`],
          ['Fairways', s.fairways ?? '–'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border-2 border-neutral-200 p-3">
            <div className="label">{k}</div>
            <div className="tnum text-2xl font-black">{v}</div>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="tnum w-full border-collapse text-base">
          <thead>
            <tr className="bg-neutral-100">
              <th className={cell}>Loch</th><th className={cell}>Par</th><th className={cell}>HCP</th>
              <th className={cell}>Schl.</th><th className={cell}>Putts</th><th className={cell}>FW</th><th className={cell}>GIR</th>
            </tr>
          </thead>
          <tbody>
            {round.holes.map((h) => (
              <tr key={h.number}>
                <td className={`${cell} font-bold`}>{h.number}</td>
                <td className={cell}>{h.par}</td>
                <td className={cell}>{h.hcp}</td>
                <td className={`${cell} font-black ${h.strokes && h.strokes < h.par ? 'text-red-700' : ''}`}>{h.strokes ?? '–'}</td>
                <td className={cell}>{h.putts ?? '–'}</td>
                <td className={cell}>{h.par >= 4 ? ({ L: '←', M: '✓', R: '→' }[h.fairway] ?? '–') : ''}</td>
                <td className={cell}>{isGIR(h) ? '✓' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn" onClick={onResume}>{round.finished ? 'Bearbeiten' : 'Weiterspielen'}</button>
        <button
          className={`rounded-2xl border-2 px-4 py-3 text-lg font-bold ${confirm ? 'border-red-700 bg-red-700 text-white' : 'border-red-700 text-red-700'}`}
          onClick={() => (confirm ? onDelete() : setConfirm(true))}
        >
          {confirm ? 'Wirklich löschen?' : 'Runde löschen'}
        </button>
      </div>
    </div>
  );
}
