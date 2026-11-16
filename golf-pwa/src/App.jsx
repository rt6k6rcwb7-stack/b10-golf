import { useEffect, useState } from 'react';
import { readSetupFromHash, useShared } from './lib/cloud.js';
import seedData from './data/seed.json';
import MyGolf from './views/MyGolf.jsx';
import Tournaments from './views/Tournaments.jsx';
import Players from './views/Players.jsx';
import Courses from './views/Courses.jsx';
import Settings from './views/Settings.jsx';

const ME_KEY = 'golf.me.v1';
const TAB_KEY = 'golf.tab.v1';
const TABS = [
  { id: 'runden', t: 'Runden' },
  { id: 'turniere', t: 'Turniere' },
  { id: 'spieler', t: 'Spieler' },
  { id: 'plaetze', t: 'Plätze' },
];
const read = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* egal */ } };

export default function App() {
  const shared = useShared();
  const { data: S, save, remove, status, cfg } = shared;
  const [tab, setTab] = useState(() => read(TAB_KEY, 'runden'));
  const [me, setMeRaw] = useState(() => read(ME_KEY, null));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const setMe = (id) => { setMeRaw(id); write(ME_KEY, id); };
  useEffect(() => write(TAB_KEY, tab), [tab]);

  // Einladungslink (#setup=…) übernehmen
  useEffect(() => {
    const check = () => {
      const c = readSetupFromHash();
      if (c) { shared.connect(c); setSettingsOpen(true); }
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ohne Gruppe: mit den B10-Startdaten beginnen
  useEffect(() => { if (!cfg) shared.seed(seedData); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [cfg]);

  // Früher nur lokal eingemessene Grüns (ältere App-Version) in die Plätze übernehmen
  useEffect(() => {
    const old = read('golf.greens.v1', null);
    if (!old || !Object.keys(S.courses).length) return;
    for (const [cid, holes] of Object.entries(old)) {
      const c = S.courses[cid];
      if (!c) continue;
      save('courses', cid, { ...c, holes: c.holes.map((h, i) => (holes[i + 1] ? { ...h, green: { ...(h.green || {}), ...holes[i + 1] } } : h)) });
    }
    try { localStorage.removeItem('golf.greens.v1'); } catch { /* egal */ }
  }, [S.courses, save]);

  const pill = status.state === 'online' ? (status.pending ? `↑ ${status.pending}` : '● Live')
    : status.state === 'syncing' ? '…' : status.state === 'offline' ? `Offline${status.pending ? ` · ${status.pending}` : ''}` : 'Lokal';

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-turf-900 px-4 py-2 text-white">
        <img src={`${import.meta.env.BASE_URL}logo-wannsee.png`} alt="GLC Berlin-Wannsee" className="h-10 w-10 rounded-full ring-2 ring-white/80" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-xl font-black tracking-tight">B10 Golf</div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-turf-100">GLC Berlin-Wannsee</div>
        </div>
        <button onClick={() => setSettingsOpen(true)} aria-label="Einstellungen und Verbindung"
          className={`rounded-full px-3 py-1.5 text-sm font-bold ${status.state === 'online' ? 'bg-white/15' : 'bg-amber-300 text-amber-950'}`}>
          {pill} ⚙︎
        </button>
      </header>

      {!cfg && tab !== 'runden' && (
        <button className="m-4 mb-0 rounded-2xl bg-amber-100 p-3 text-left text-sm text-amber-950" onClick={() => setSettingsOpen(true)}>
          <b>Nicht mit der B10-Gruppe verbunden.</b> Änderungen sieht nur dieses Gerät. Tippen, um zu verbinden.
        </button>
      )}

      <main className="flex-1 pb-24">
        {tab === 'runden' && <MyGolf S={S} save={save} me={me} />}
        {tab === 'turniere' && <Tournaments S={S} save={save} remove={remove} me={me} />}
        {tab === 'spieler' && <Players S={S} save={save} remove={remove} me={me} setMe={setMe} />}
        {tab === 'plaetze' && <Courses S={S} save={save} remove={remove} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          {TABS.map((x) => (
            <button key={x.id} onClick={() => { setTab(x.id); window.scrollTo(0, 0); }} aria-current={tab === x.id}
              className={`py-4 text-sm font-black uppercase tracking-wider ${tab === x.id ? 'text-turf-900 shadow-[inset_0_3px_0_#14532d]' : 'text-neutral-500'}`}>
              {x.t}
            </button>
          ))}
        </div>
      </nav>

      {settingsOpen && <Settings S={S} shared={shared} me={me} setMe={setMe} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
