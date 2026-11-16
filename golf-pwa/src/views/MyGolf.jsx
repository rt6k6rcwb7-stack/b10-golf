// Eigene Runden (nur auf diesem Gerät) + persönliche Statistik inkl. eigener Turnier-Scorekarten.
import { useEffect, useMemo, useState } from 'react';
import HoleEntry from '../components/HoleEntry.jsx';
import Modal, { DangerButton } from '../components/Modal.jsx';
import { fmtToPar, overallStats, roundStats, isGIR } from '../lib/stats.js';
import { coursePar, uid } from '../lib/golf.js';

const ROUNDS_KEY = 'golf.rounds.v1';
const ACTIVE_KEY = 'golf.activeRoundId.v1';
const read = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* voll */ } };

function Kpi({ label, value, sub }) {
  return (
    <div className="rounded-2xl border-2 border-neutral-200 p-3">
      <div className="label">{label}</div>
      <div className="tnum text-3xl font-black">{value ?? '–'}</div>
      {sub && <div className="text-sm text-neutral-600">{sub}</div>}
    </div>
  );
}

// Turnier-Scorekarten des eigenen Spielers in das Runden-Format bringen (für die Statistik)
function tournamentRoundsOf(S, me) {
  if (!me) return [];
  return Object.values(S.scores || {}).filter((sc) => sc.playerId === me).map((sc) => {
    const t = S.tournaments[sc.tournamentId];
    const r = t?.rounds?.find((x) => x.id === sc.roundId);
    const c = r && S.courses[r.courseId];
    if (!c) return null;
    const holes = c.holes.map((h, i) => ({ number: i + 1, par: h.par, strokes: sc.strokes?.[i] ?? null, putts: sc.putts?.[i] ?? null, fairway: sc.fairway?.[i] ?? null }));
    return { id: 'T:' + sc.id, courseName: c.name, tournament: t.name, startedAt: r.date ? Date.parse(r.date) : sc.updatedAt, finished: holes.every((h) => h.strokes > 0), holes };
  }).filter(Boolean);
}

export default function MyGolf({ S, save, me }) {
  const [rounds, setRounds] = useState(() => read(ROUNDS_KEY, []));
  const [activeId, setActiveId] = useState(() => read(ACTIVE_KEY, null));
  const [view, setView] = useState(() => (read(ACTIVE_KEY, null) ? 'play' : 'home'));
  const [detailId, setDetailId] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  useEffect(() => write(ROUNDS_KEY, rounds), [rounds]);
  useEffect(() => write(ACTIVE_KEY, activeId), [activeId]);

  const courses = useMemo(() => Object.values(S.courses).sort((a, b) => (b.home ? 1 : 0) - (a.home ? 1 : 0) || a.name.localeCompare(b.name)), [S.courses]);
  const active = rounds.find((r) => r.id === activeId) || null;
  const tRounds = useMemo(() => tournamentRoundsOf(S, me), [S, me]);
  const stats = overallStats([...rounds, ...tRounds]);

  function start(course, mode) {
    const holes = course.holes.map((h, i) => ({ ...h, number: i + 1 }))
      .filter((h) => (mode === 'front9' ? h.number <= 9 : mode === 'back9' ? h.number >= 10 : true))
      .map((h) => ({ number: h.number, par: h.par, si: h.si, strokes: null, putts: null, fairway: null }));
    const r = { id: uid(), courseId: course.id, courseName: course.name, mode, startedAt: Date.now(), finished: false, holes };
    setRounds((rs) => [...rs, r]);
    setActiveId(r.id);
    setNewOpen(false);
    setView('play');
  }
  const updateHole = (i, patch) => setRounds((rs) => rs.map((r) => (r.id !== activeId ? r : { ...r, holes: r.holes.map((h, k) => (k === i ? { ...h, ...patch } : h)) })));
  function measure(round, i, which, pos) {
    const c = S.courses[round.courseId];
    if (!c) return;
    const k = round.holes[i].number - 1;
    const holes = c.holes.map((h, j) => (j === k ? { ...h, green: { ...(h.green || {}), [which]: pos } } : h));
    save('courses', c.id, { ...c, holes });
  }

  if (view === 'play' && active) {
    const c = S.courses[active.courseId];
    const holes = active.holes.map((h) => ({ ...h, si: h.si ?? h.hcp, note: c?.holes?.[h.number - 1]?.note, green: c?.holes?.[h.number - 1]?.green }));
    const st = roundStats(active);
    const values = { strokes: active.holes.map((h) => h.strokes), putts: active.holes.map((h) => h.putts), fairway: active.holes.map((h) => h.fairway) };
    const first = active.holes.findIndex((h) => !(h.strokes > 0));
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <button className="text-lg font-bold text-turf-800" onClick={() => setView('home')}>‹ Übersicht</button>
          <div className="tnum text-right">
            <div className="label">{active.courseName}</div>
            <div className="text-lg font-black">{st.holesPlayed ? `${st.strokes} (${fmtToPar(st.toPar)})` : '–'} · {st.holesPlayed}/{active.holes.length}</div>
          </div>
        </div>
        <HoleEntry holes={holes} values={values} onSet={updateHole} startIdx={first === -1 ? 0 : first}
          onMeasure={c ? (i, w, p) => measure(active, i, w, p) : null}
          footer={<button className="btn-primary py-4" onClick={() => {
            setRounds((rs) => rs.map((r) => (r.id === activeId ? { ...r, finished: true, finishedAt: Date.now() } : r)));
            setDetailId(activeId); setActiveId(null); setView('detail');
          }}>Runde beenden</button>} />
      </div>
    );
  }

  const detail = rounds.find((r) => r.id === detailId);
  if (view === 'detail' && detail) {
    const s = roundStats(detail);
    const cell = 'border border-neutral-300 px-2 py-1 text-center';
    return (
      <div className="flex flex-col gap-4 p-4">
        <button className="self-start text-lg font-bold text-turf-800" onClick={() => { setArmed(false); setView('home'); }}>‹ Übersicht</button>
        <div>
          <div className="label">{new Date(detail.startedAt).toLocaleDateString('de-DE')}</div>
          <h1 className="text-3xl font-black">{detail.courseName}</h1>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Kpi label="Score" value={s.holesPlayed ? `${s.strokes} (${fmtToPar(s.toPar)})` : null} />
          <Kpi label="Putts" value={s.putts} />
          <Kpi label="GIR" value={`${s.gir}/${s.holesPlayed}`} sub={s.girPct != null ? `${s.girPct} %` : null} />
          <Kpi label="Fairways" value={s.fairways} />
        </div>
        <div className="overflow-x-auto">
          <table className="tnum w-full border-collapse text-base">
            <thead><tr className="bg-neutral-100">{['Loch', 'Par', 'HCP', 'Schl.', 'Putts', 'FW', 'GIR'].map((h) => <th key={h} className={cell}>{h}</th>)}</tr></thead>
            <tbody>
              {detail.holes.map((h) => (
                <tr key={h.number}>
                  <td className={`${cell} font-bold`}>{h.number}</td><td className={cell}>{h.par}</td><td className={cell}>{h.si ?? h.hcp}</td>
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
          <button className="btn" onClick={() => { setActiveId(detail.id); setView('play'); }}>{detail.finished ? 'Bearbeiten' : 'Weiterspielen'}</button>
          <DangerButton armed={armed} setArmed={setArmed} onConfirm={() => {
            setRounds((rs) => rs.filter((r) => r.id !== detail.id));
            if (activeId === detail.id) setActiveId(null);
            setArmed(false); setView('home');
          }}>Runde löschen</DangerButton>
        </div>
      </div>
    );
  }

  const list = [...rounds, ...tRounds].sort((a, b) => b.startedAt - a.startedAt);
  return (
    <div className="flex flex-col gap-5 p-4">
      <header className="flex items-end justify-between gap-3">
        <div><div className="label">Persönlich</div><h1 className="text-4xl font-black tracking-tight">Meine Runden</h1></div>
        <button className="btn-primary" onClick={() => setNewOpen(true)}>+ Runde</button>
      </header>

      {active && (
        <button className="rounded-2xl border-2 border-turf-900 bg-turf-50 p-4 text-left" onClick={() => setView('play')}>
          <div className="label text-turf-800">Laufende Runde</div>
          <div className="text-xl font-bold">{active.courseName}</div>
          <div className="text-neutral-700">{roundStats(active).holesPlayed} von {active.holes.length} Löchern · weiterspielen ›</div>
        </button>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-black">Statistik</h2>
        {stats ? (
          <div className="grid grid-cols-2 gap-2">
            <Kpi label="Runden" value={stats.rounds} sub={me ? 'inkl. Turnierrunden' : null} />
            <Kpi label="Ø Score (18)" value={stats.avgScore18?.toFixed(1)} sub={stats.best18 ? `Beste: ${stats.best18}` : 'noch keine 18er-Runde'} />
            <Kpi label="Ø Putts / Runde" value={stats.avgPutts?.toFixed(1)} sub={stats.puttsPerHole ? `${stats.puttsPerHole.toFixed(2)} pro Loch` : null} />
            <Kpi label="Greens in Regulation" value={stats.girPct != null ? `${Math.round(stats.girPct)} %` : null} />
            <Kpi label="Fairways getroffen" value={stats.fairwayPct != null ? `${Math.round(stats.fairwayPct)} %` : null} sub="Par 4 und 5" />
          </div>
        ) : (
          <p className="rounded-2xl border-2 border-dashed border-neutral-300 p-4 text-neutral-600">
            Nach deiner ersten beendeten Runde siehst du hier Ø-Score, Putts, Greens in Regulation und Fairway-Quote.
            {!me && ' Unter Einstellungen „Ich bin …“ wählen, dann zählen auch deine Turnierrunden mit.'}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-black">Runden</h2>
        {!list.length && <p className="text-neutral-600">Noch keine Runden gespeichert.</p>}
        <ul className="flex flex-col divide-y-2 divide-neutral-100 border-y-2 border-neutral-100">
          {list.map((r) => {
            const s = roundStats(r);
            const isT = String(r.id).startsWith('T:');
            return (
              <li key={r.id}>
                <button className="flex w-full items-center gap-3 py-3 text-left disabled:cursor-default" disabled={isT} onClick={() => { setDetailId(r.id); setView('detail'); }}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{r.courseName}{isT && <span className="ml-2 rounded-md bg-neutral-200 px-1.5 py-0.5 text-xs font-bold uppercase">Turnier</span>}</div>
                    <div className="text-sm text-neutral-600">
                      {new Date(r.startedAt).toLocaleDateString('de-DE')} · {r.holes.length} Löcher{s.putts != null ? ` · ${s.putts} Putts` : ''} · GIR {s.gir}{!r.finished ? ' · läuft' : ''}{isT ? ` · ${r.tournament}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tnum text-2xl font-black">{s.holesPlayed ? s.strokes : '–'}</div>
                    <div className={`tnum text-sm font-bold ${s.toPar < 0 ? 'text-red-700' : 'text-neutral-600'}`}>{s.holesPlayed ? fmtToPar(s.toPar) : ''}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {newOpen && <NewRoundModal courses={courses} onStart={start} onClose={() => setNewOpen(false)} />}
    </div>
  );
}

function NewRoundModal({ courses, onStart, onClose }) {
  const [courseId, setCourseId] = useState(courses[0]?.id);
  const [mode, setMode] = useState('18');
  const course = courses.find((c) => c.id === courseId);
  const n = course?.holes?.length || 18;
  return (
    <Modal title="Neue Runde" onClose={onClose}>
      {!courses.length && <p className="text-neutral-600">Noch keine Plätze. Lege unter „Plätze“ einen an.</p>}
      <div className="flex flex-col gap-2">
        {courses.map((c) => (
          <button key={c.id} onClick={() => setCourseId(c.id)}
            className={`rounded-2xl border-2 p-3 text-left ${c.id === courseId ? 'border-turf-900 bg-turf-50' : 'border-neutral-300'}`}>
            <div className="text-lg font-bold">{c.name}{c.home && <span className="ml-2 rounded-md bg-turf-900 px-2 py-0.5 align-middle text-xs font-bold uppercase text-white">Heimatplatz</span>}</div>
            <div className="text-sm text-neutral-600">{c.location ? `${c.location} · ` : ''}Par {coursePar(c)}</div>
          </button>
        ))}
      </div>
      {n === 18 && (
        <div className="grid grid-cols-3 gap-2">
          {[['18', '18 Löcher'], ['front9', 'Front 9'], ['back9', 'Back 9']].map(([id, t]) => (
            <button key={id} onClick={() => setMode(id)}
              className={`rounded-2xl border-2 px-2 py-3 font-bold ${id === mode ? 'border-turf-900 bg-turf-900 text-white' : 'border-neutral-300'}`}>{t}</button>
          ))}
        </div>
      )}
      <button className="btn-primary py-4 text-xl" disabled={!course} onClick={() => onStart(course, n === 18 ? mode : '18')}>Runde starten</button>
    </Modal>
  );
}
