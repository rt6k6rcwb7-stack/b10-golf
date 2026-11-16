import { useEffect, useMemo, useState } from 'react';
import data from './data/courses.json';
import Home from './components/Home.jsx';
import NewRound from './components/NewRound.jsx';
import Play from './components/Play.jsx';
import RoundDetail from './components/RoundDetail.jsx';
import { loadActiveId, loadRounds, saveActiveId, saveRounds } from './lib/storage.js';

const courses = data.courses;
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export default function App() {
  const [rounds, setRounds] = useState(loadRounds);
  const [activeId, setActiveId] = useState(loadActiveId);
  const [view, setView] = useState(() => (loadActiveId() ? 'play' : 'home'));
  const [detailId, setDetailId] = useState(null);
  const [gpsOn, setGpsOn] = useState(false);

  useEffect(() => saveRounds(rounds), [rounds]);
  useEffect(() => saveActiveId(activeId), [activeId]);

  const activeRound = useMemo(() => rounds.find((r) => r.id === activeId) || null, [rounds, activeId]);
  const detailRound = rounds.find((r) => r.id === detailId);

  function startRound(course, mode) {
    const holes = course.holes
      .filter((h) => (mode === 'front9' ? h.number <= 9 : mode === 'back9' ? h.number >= 10 : true))
      .map((h) => ({ number: h.number, par: h.par, hcp: h.hcp, green: h.green, strokes: null, putts: null, fairway: null }));
    const round = { id: newId(), courseId: course.id, courseName: course.name, mode, startedAt: Date.now(), finished: false, holes };
    setRounds((rs) => [...rs, round]);
    setActiveId(round.id);
    setView('play');
  }
  function updateHole(i, patch) {
    setRounds((rs) => rs.map((r) => (r.id !== activeId ? r : { ...r, holes: r.holes.map((h, k) => (k === i ? { ...h, ...patch } : h)) })));
  }
  function finish() {
    setRounds((rs) => rs.map((r) => (r.id === activeId ? { ...r, finished: true, finishedAt: Date.now() } : r)));
    setDetailId(activeId);
    setActiveId(null);
    setGpsOn(false);
    setView('detail');
  }
  function resume(id) {
    setActiveId(id);
    setView('play');
  }

  return (
    <div className="mx-auto max-w-xl">
      {view === 'play' && activeRound ? (
        <Play
          key={activeRound.id}
          round={activeRound}
          onUpdateHole={updateHole}
          onFinish={finish}
          onExit={() => { setGpsOn(false); setView('home'); }}
          gpsOn={gpsOn}
          setGpsOn={setGpsOn}
        />
      ) : view === 'new' ? (
        <NewRound courses={courses} onStart={startRound} onCancel={() => setView('home')} />
      ) : view === 'detail' && detailRound ? (
        <RoundDetail
          round={detailRound}
          onBack={() => setView('home')}
          onResume={() => resume(detailRound.id)}
          onDelete={() => {
            setRounds((rs) => rs.filter((r) => r.id !== detailRound.id));
            if (activeId === detailRound.id) setActiveId(null);
            setView('home');
          }}
        />
      ) : (
        <Home
          rounds={rounds}
          activeRound={activeRound}
          onNew={() => setView('new')}
          onResume={() => setView('play')}
          onOpen={(id) => { setDetailId(id); setView('detail'); }}
        />
      )}
    </div>
  );
}
