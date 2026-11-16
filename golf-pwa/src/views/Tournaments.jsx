// Turniere über mehrere Plätze mit Brutto- und Nettowertung (Zählspiel oder Stableford).
import { useState } from 'react';
import HoleEntry from '../components/HoleEntry.jsx';
import Modal, { DangerButton, Field, inputCls } from '../components/Modal.jsx';
import { coursePar, fmtHcp, fmtToPar, leaderboard, num, playerHi, roundResult, skey, teeOf, tournamentStatus, uid } from '../lib/golf.js';

const fmtDate = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '');
const sortedPlayers = (S) => Object.values(S.players).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

function Mark({ g, par }) {
  if (g == null) return null;
  const d = g - par;
  const c = d <= -2 ? 'rounded-full border-2 border-red-700 text-red-700 outline outline-2 outline-offset-1 outline-red-700'
    : d === -1 ? 'rounded-full border-2 border-red-700 text-red-700'
      : d === 1 ? 'border-2 border-neutral-900' : d >= 2 ? 'border-2 border-neutral-900 outline outline-2 outline-offset-1 outline-neutral-900' : '';
  return <span className={`inline-grid h-7 min-w-7 place-items-center ${c}`}>{g}</span>;
}

export default function Tournaments({ S, save, remove, me, imgs }) {
  const [openId, setOpenId] = useState(null);
  const [mode, setMode] = useState('netto');
  const [scope, setScope] = useState('all');
  const [card, setCard] = useState(null); // { roundId, playerId }
  const [settings, setSettings] = useState(null); // id | 'new'
  const [showCard, setShowCard] = useState(null); // playerId
  const [importOpen, setImportOpen] = useState(false);

  const t = openId && S.tournaments[openId];

  const settingsModal = settings && (
    <TournamentSettings S={S} id={settings === 'new' ? null : settings}
      onClose={() => setSettings(null)}
      onSave={(tid, doc) => { save('tournaments', tid, doc); setSettings(null); setOpenId(tid); }}
      onDelete={(tid) => {
        Object.keys(S.scores).filter((k) => k.startsWith(tid + '__')).forEach((k) => remove('scores', k));
        remove('tournaments', tid); setSettings(null); setOpenId(null);
      }} />
  );

  // ---------- Liste ----------
  if (!t) {
    const list = Object.values(S.tournaments).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return (
      <div className="flex flex-col gap-4 p-4">
        <header className="flex items-end justify-between gap-3">
          <div><div className="label">B10 Golffreunde</div><h1 className="text-4xl font-black tracking-tight">Turniere</h1></div>
          <button className="btn-primary" onClick={() => setSettings('new')}>+ Turnier</button>
        </header>
        {!list.length && (
          <p className="rounded-2xl border-2 border-dashed border-neutral-300 p-4 text-neutral-600">
            Noch kein Turnier. Ein Turnier besteht aus mehreren Runden auf verschiedenen Plätzen – mit Brutto- und Nettowertung.
          </p>
        )}
        <ul className="flex flex-col divide-y-2 divide-neutral-100 border-y-2 border-neutral-100">
          {list.map((x) => {
            const st = tournamentStatus(S, x);
            const names = [...new Set((x.rounds || []).map((r) => S.courses[r.courseId]?.name).filter(Boolean))];
            return (
              <li key={x.id}>
                <button className="flex w-full items-center gap-3 py-3 text-left" onClick={() => { setOpenId(x.id); setScope('all'); }}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-bold">{x.name}</div>
                    <div className="text-sm text-neutral-600">
                      {(x.rounds || []).length} Runden · {(x.playerIds || []).length} Spieler · {x.format === 'stableford' ? 'Stableford' : 'Zählspiel'}{names.length ? ` · ${names.join(', ')}` : ''}
                    </div>
                  </div>
                  <span className={`rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wide ${st.k === 'live' ? 'bg-red-100 text-red-800' : st.k === 'done' ? 'bg-turf-100 text-turf-900' : 'bg-neutral-100 text-neutral-600'}`}>{st.l}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {settingsModal}
      </div>
    );
  }

  const rounds = t.rounds || [];
  const pids = (t.playerIds || []).filter((p) => S.players[p]);

  // ---------- Scorekarte eintragen ----------
  if (card) {
    const r = rounds.find((x) => x.id === card.roundId) || rounds[0];
    const pid = pids.includes(card.playerId) ? card.playerId : pids[0];
    const c = r && S.courses[r.courseId];
    const p = S.players[pid];
    const key = r && skey(t.id, r.id, pid);
    const sc = (key && S.scores[key]) || {};
    const res = r && pid && roundResult(S, t, r, pid);
    const ordered = [...pids].sort((a, b) => (b === me) - (a === me) || (S.players[a].name || '').localeCompare(S.players[b].name || ''));
    const holes = (c?.holes || []).map((h, i) => ({ ...h, number: i + 1 }));
    const setHole = (i, patch) => {
      const cur = S.scores[key] || { tournamentId: t.id, roundId: r.id, playerId: pid };
      const next = { ...cur };
      for (const [k, v] of Object.entries(patch)) {
        const arr = Array.from({ length: holes.length }, (_, j) => (cur[k] || [])[j] ?? null);
        arr[i] = v;
        next[k] = arr;
      }
      next.source = 'app';
      save('scores', key, next);
    };
    const tee = c && teeOf(c, r.tee);
    return (
      <div className="flex flex-col gap-3 p-4">
        <button className="self-start text-lg font-bold text-turf-800" onClick={() => setCard(null)}>‹ {t.name}</button>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {rounds.map((x, i) => (
            <button key={x.id} onClick={() => setCard({ ...card, roundId: x.id })}
              className={`flex-none rounded-full border-2 px-3 py-1.5 text-sm font-bold ${x.id === r.id ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300'}`}>
              R{i + 1} · {S.courses[x.courseId]?.name || '?'}
            </button>
          ))}
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {ordered.map((id) => {
            const rr = roundResult(S, t, r, id);
            return (
              <button key={id} onClick={() => setCard({ ...card, roundId: r.id, playerId: id })}
                className={`flex-none rounded-full border-2 px-3 py-1.5 text-sm font-bold ${id === pid ? 'border-turf-900 bg-turf-900 text-white' : 'border-neutral-300'}`}>
                {S.players[id].name}{rr?.played ? ` · ${rr.complete ? '✓' : rr.played}` : ''}
              </button>
            );
          })}
        </div>
        {!c ? <p className="text-neutral-600">Der Platz dieser Runde fehlt.</p> : (
          <>
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <div className="label">{c.name} · {tee?.name} {r.date ? `· ${fmtDate(r.date)}` : ''}</div>
                <h2 className="truncate text-3xl font-black">{p.name}</h2>
              </div>
              <button className="btn text-base" onClick={() => setImportOpen(true)}>Aus Hole19</button>
            </div>
            <div className="grid grid-cols-4 gap-2 rounded-2xl border-2 border-neutral-200 p-2 text-center">
              {[['Index', fmtHcp(res.hi)], ['Course HCP', res.ch], ['Vorgabe', res.ph], [t.format === 'stableford' ? 'Pkt netto' : 'Netto', res.played ? (t.format === 'stableford' ? res.sfN : `${res.net} (${fmtToPar(res.toParN)})`) : '–']].map(([k, v]) => (
                <div key={k}><div className="label text-[10px]">{k}</div><div className="tnum text-xl font-black">{v}</div></div>
              ))}
            </div>
            {c.notes && <div className="rounded-xl bg-neutral-100 px-3 py-2 text-sm"><b>Platz:</b> {c.notes}</div>}
            <HoleEntry key={key} holes={holes} recv={res.recv} stableford={t.format === 'stableford'}
              values={{ strokes: sc.strokes || [], putts: sc.putts || [], fairway: sc.fairway || [] }}
              startIdx={Math.max(0, (sc.strokes || []).findIndex((x) => !(x > 0)))}
              onSet={setHole}
              imageFor={(i) => imgs?.imageFor(c.id, i + 1)}
              onMeasure={(i, which, pos) => save('courses', c.id, { ...c, holes: c.holes.map((h, j) => (j === i ? { ...h, green: { ...(h.green || {}), [which]: pos } } : h)) })}
              footer={<button className="btn-primary py-4" onClick={() => setCard(null)}>Fertig</button>} />
            {importOpen && <ImportModal n={holes.length} player={p} onClose={() => setImportOpen(false)}
              onApply={(arr) => { save('scores', key, { ...(S.scores[key] || { tournamentId: t.id, roundId: r.id, playerId: pid }), strokes: arr, source: 'hole19' }); setImportOpen(false); }} />}
          </>
        )}
      </div>
    );
  }

  // ---------- Leaderboard ----------
  const sc = scope !== 'all' && !rounds.find((r) => r.id === scope) ? 'all' : scope;
  const lb = leaderboard(S, t, sc, mode);
  const multi = lb.rounds.length > 1;
  const sf = lb.sf;
  return (
    <div className="flex flex-col gap-4 p-4">
      <button className="self-start text-lg font-bold text-turf-800" onClick={() => setOpenId(null)}>‹ Alle Turniere</button>
      <div>
        <div className="label">{sf ? 'Stableford' : 'Zählspiel'} · Vorgabe {num(t.allowance, 100)} %{t.maxScore === 'ndb' ? ' · max. Netto-Doppelbogey' : ''}{num(t.countBest, 0) ? ` · beste ${t.countBest} Runden` : ''}</div>
        <h1 className="text-3xl font-black">{t.name}</h1>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn" onClick={() => setSettings(t.id)}>Einstellungen</button>
        <button className="btn-primary" disabled={!rounds.length || !pids.length}
          onClick={() => setCard({ roundId: sc !== 'all' ? sc : rounds[0]?.id, playerId: pids.includes(me) ? me : pids[0] })}>Scores eintragen</button>
      </div>
      {!rounds.length || !pids.length ? (
        <p className="rounded-2xl border-2 border-dashed border-neutral-300 p-4 text-neutral-600">Unter „Einstellungen“ Spieler auswählen und Runden auf euren Plätzen hinzufügen.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-neutral-100 p-1">
              {['brutto', 'netto'].map((m) => (
                <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
                  className={`rounded-lg px-4 py-2 text-base font-bold capitalize ${mode === m ? 'bg-white shadow' : 'text-neutral-600'}`}>{m}</button>
              ))}
            </div>
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
            {[{ id: 'all', t: 'Gesamt' }, ...rounds.map((r, i) => ({ id: r.id, t: `R${i + 1} · ${S.courses[r.courseId]?.name || '?'}` }))].map((x) => (
              <button key={x.id} onClick={() => setScope(x.id)}
                className={`flex-none rounded-full border-2 px-3 py-1.5 text-sm font-bold ${sc === x.id ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300'}`}>{x.t}</button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-2xl border-2 border-neutral-200">
            <table className="tnum w-full border-collapse">
              <thead>
                <tr className="text-right text-xs font-bold uppercase tracking-wider text-neutral-600">
                  <th className="px-2 py-2 text-center">Pos</th><th className="px-2 py-2 text-left">Spieler</th>
                  {!sf && <th className="px-2 py-2">Par</th>}
                  <th className="px-2 py-2">{sf ? 'Pkt' : mode === 'brutto' ? 'Schl.' : 'Netto'}</th>
                  {multi ? lb.rounds.map((r) => <th key={r.id} className="px-2 py-2">R{rounds.indexOf(r) + 1}</th>) : <th className="px-2 py-2">Loch</th>}
                </tr>
              </thead>
              <tbody>
                {lb.rows.map((row, i) => {
                  const p = S.players[row.pid];
                  const phs = row.per.map((x) => x.res?.ph).filter((v) => v != null);
                  return (
                    <tr key={row.pid} className="cursor-pointer border-t-2 border-neutral-100 text-right active:bg-neutral-50" onClick={() => setShowCard(row.pid)}>
                      <td className={`px-2 py-2 text-center text-xl font-black ${i === 0 && row.metric != null ? 'text-turf-800' : 'text-neutral-500'}`}>{row.posLabel}</td>
                      <td className="min-w-32 px-2 py-2 text-left">
                        <div className="font-bold">{p.name}{row.pid === me && <span className="ml-1 rounded bg-neutral-200 px-1 text-xs">Du</span>}</div>
                        <div className="text-xs text-neutral-600">HCP {fmtHcp(playerHi(t, p))}{mode === 'netto' && phs.length ? ` · Vorg. ${phs.join('/')}` : ''}</div>
                      </td>
                      {!sf && <td className={`px-2 py-2 text-2xl font-black ${row.metric < 0 ? 'text-red-700' : ''}`}>{row.metric == null ? '–' : fmtToPar(row.metric)}</td>}
                      <td className={`px-2 py-2 ${sf ? 'text-2xl font-black' : ''}`}>{row.metric == null ? '–' : sf ? row.metric : row.strokes}</td>
                      {multi ? row.per.map((x) => {
                        const v = lb.metricOf(x.res);
                        const shown = v == null ? '–' : sf ? v : mode === 'brutto' ? x.res.gross : x.res.net;
                        return <td key={x.r.id} className={`px-2 py-2 ${x.dropped ? 'text-neutral-400 line-through' : ''}`}>{shown}{x.res?.played && !x.res.complete ? <span className="text-xs text-neutral-500"> ({x.res.played})</span> : ''}</td>;
                      }) : <td className="px-2 py-2 text-neutral-600">{row.played === row.total ? 'F' : row.played || '–'}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-neutral-600">
            {sf ? 'Stableford: 2 + Par − Schläge je Loch (netto mit Vorgabeschlägen); höchste Punktzahl gewinnt.' : 'Zählspiel: Wertung nach Schlägen zu Par über alle gespielten Löcher; rot = unter Par.'} Zeile antippen = Scorekarte.
          </p>
          <h2 className="text-xl font-black">Runden</h2>
          <ul className="flex flex-col divide-y-2 divide-neutral-100 border-y-2 border-neutral-100">
            {rounds.map((r, i) => {
              const c = S.courses[r.courseId] || {};
              const tee = teeOf(c, r.tee);
              return (
                <li key={r.id}>
                  <button className="flex w-full items-center gap-3 py-3 text-left" onClick={() => setCard({ roundId: r.id, playerId: pids.includes(me) ? me : pids[0] })}>
                    <div className="tnum w-10 text-2xl font-black">R{i + 1}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold">{c.name || 'Platz fehlt'}</div>
                      <div className="text-sm text-neutral-600">{r.date ? `${fmtDate(r.date)} · ` : ''}{tee.name} · Par {coursePar(c) || '–'}{tee.crM ? ` · CR ${tee.crM} / Slope ${tee.slopeM}` : ''}</div>
                    </div>
                    <span className="font-bold text-turf-800">Eintragen ›</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {showCard && <ScorecardModal S={S} t={t} pid={showCard} scope={sc} onClose={() => setShowCard(null)}
        onEdit={(rid) => { setShowCard(null); setCard({ roundId: rid, playerId: showCard }); }} />}
      {settingsModal}
    </div>
  );
}

function ScorecardModal({ S, t, pid, scope, onClose, onEdit }) {
  const rounds = (t.rounds || []).filter((r) => scope === 'all' || r.id === scope);
  const cell = 'border border-neutral-200 px-1 py-1 text-center min-w-8';
  return (
    <Modal title={S.players[pid].name} onClose={onClose}>
      {rounds.map((r) => {
        const c = S.courses[r.courseId];
        if (!c) return null;
        const res = roundResult(S, t, r, pid);
        const sc = S.scores[skey(t.id, r.id, pid)] || {};
        const holes = c.holes || [];
        return (
          <div key={r.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">R{t.rounds.indexOf(r) + 1} · {c.name}</h3>
              <button className="font-bold text-turf-800" onClick={() => onEdit(r.id)}>Bearbeiten</button>
            </div>
            <div className="overflow-x-auto">
              <table className="tnum border-collapse text-sm">
                <tbody>
                  <tr className="bg-neutral-100 font-bold"><td className={`${cell} text-left`}>Loch</td>{holes.map((_, i) => <td key={i} className={cell}>{i + 1}</td>)}<td className={cell}>Σ</td></tr>
                  <tr className="text-neutral-600"><td className={`${cell} text-left`}>Par</td>{holes.map((h, i) => <td key={i} className={cell}>{h.par}</td>)}<td className={cell}>{coursePar(c)}</td></tr>
                  <tr className="text-turf-800"><td className={`${cell} text-left`}>Vorgabe</td>{res.recv.map((v, i) => <td key={i} className={cell}>{v > 0 ? '●'.repeat(v) : v || ''}</td>)}<td className={cell}>{res.ph}</td></tr>
                  <tr className="font-bold"><td className={`${cell} text-left`}>Brutto</td>{res.g.map((g, i) => <td key={i} className={cell}><Mark g={g} par={holes[i].par} /></td>)}<td className={cell}>{res.played ? res.gross : '–'}</td></tr>
                  <tr><td className={`${cell} text-left`}>Netto</td>{res.g.map((g, i) => <td key={i} className={cell}>{g == null ? '' : g - res.recv[i]}</td>)}<td className={cell}>{res.played ? res.net : '–'}</td></tr>
                  <tr><td className={`${cell} text-left`}>Pkt n.</td>{res.g.map((g, i) => <td key={i} className={cell}>{g == null ? '' : Math.max(0, 2 + holes[i].par + res.recv[i] - g)}</td>)}<td className={cell}>{res.played ? res.sfN : '–'}</td></tr>
                  <tr className="text-neutral-600"><td className={`${cell} text-left`}>Putts</td>{holes.map((_, i) => <td key={i} className={cell}>{sc.putts?.[i] ?? ''}</td>)}<td className={cell}>{(sc.putts || []).reduce((a, b) => a + (b || 0), 0) || ''}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      <p className="text-sm text-neutral-600">Kreis = Birdie, Doppelkreis = Eagle oder besser, Quadrat = Bogey, Doppelquadrat = Doppelbogey oder schlechter.</p>
    </Modal>
  );
}

function ImportModal({ n, player, onApply, onClose }) {
  const [text, setText] = useState('');
  const t = text.trim();
  const arr = /^\d+$/.test(t) && t.length === n ? t.split('').map(Number) : (t.match(/\d+/g) || []).map(Number).filter((x) => x >= 1 && x <= 20);
  const ok = arr.length === n;
  return (
    <Modal title="Aus Hole19 übernehmen" onClose={onClose}>
      <p className="text-neutral-700">
        Öffne in Hole19 die Runde von {player.name} und tippe die Schläge pro Loch ab – durch Leerzeichen getrennt
        (bei lauter einstelligen Werten auch ohne). Hole19 bietet keine Schnittstelle zum direkten Import.
      </p>
      <textarea className={`${inputCls} h-28 font-mono`} value={text} onChange={(e) => setText(e.target.value)} placeholder="5 4 6 3 5 4 4 6 5  4 5 3 5 6 4 4 5 5" />
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className="tnum min-w-9 rounded-lg border-2 border-neutral-200 px-1 py-0.5 text-center">
            <span className="block text-[10px] text-neutral-500">{i + 1}</span>{arr[i] ?? '–'}
          </span>
        ))}
      </div>
      <div className="text-sm font-bold">{ok ? `Summe ${arr.reduce((a, b) => a + b, 0)} – bitte prüfen.` : `${arr.length} von ${n} Zahlen erkannt.`}</div>
      <button className="btn-primary py-4" disabled={!ok} onClick={() => onApply(arr)}>In Scorekarte übernehmen</button>
    </Modal>
  );
}

function TournamentSettings({ S, id, onClose, onSave, onDelete }) {
  const init = id ? S.tournaments[id] : { name: '', format: 'stroke', allowance: 100, maxScore: 'none', countBest: 0, playerIds: Object.keys(S.players), hcp: {}, rounds: [] };
  const [f, setF] = useState(() => ({ ...init, hcp: { ...(init.hcp || {}) }, rounds: [...(init.rounds || [])], playerIds: [...(init.playerIds || [])] }));
  const [armed, setArmed] = useState(false);
  const courses = Object.values(S.courses).sort((a, b) => a.name.localeCompare(b.name));
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const setRound = (i, patch) => set({ rounds: f.rounds.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  return (
    <Modal title={id ? 'Turnier-Einstellungen' : 'Neues Turnier'} onClose={onClose}>
      <Field label="Name"><input className={inputCls} value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="z. B. B10 Trophy" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Spielform">
          <select className={inputCls} value={f.format} onChange={(e) => set({ format: e.target.value })}><option value="stroke">Zählspiel</option><option value="stableford">Stableford</option></select>
        </Field>
        <Field label="Handicap-Anteil %"><input className={inputCls} inputMode="numeric" value={f.allowance} onChange={(e) => set({ allowance: e.target.value })} /></Field>
        <Field label="Max. Score je Loch">
          <select className={inputCls} value={f.maxScore} onChange={(e) => set({ maxScore: e.target.value })}><option value="none">Kein Limit</option><option value="ndb">Netto-Doppelbogey</option></select>
        </Field>
        <Field label="Gewertete Runden">
          <select className={inputCls} value={f.countBest} onChange={(e) => set({ countBest: +e.target.value })}>
            <option value={0}>Alle</option>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>Beste {n}</option>)}
          </select>
        </Field>
      </div>
      <p className="text-sm text-neutral-600">Brutto und Netto werden immer beide gewertet. Spielvorgabe = Course Handicap (Index, CR, Slope, Par) × Anteil; WHS empfiehlt 95 % im Einzel.</p>

      <h3 className="text-lg font-black">Runden & Plätze</h3>
      {!courses.length && <p className="text-neutral-600">Bitte zuerst unter „Plätze“ einen Platz anlegen.</p>}
      {f.rounds.map((r, i) => {
        const c = S.courses[r.courseId] || courses[0];
        return (
          <div key={r.id} className="grid grid-cols-2 gap-2 border-b-2 border-neutral-100 pb-3">
            <Field label={`Runde ${i + 1} · Platz`}>
              <select className={inputCls} value={r.courseId} onChange={(e) => setRound(i, { courseId: e.target.value, tee: S.courses[e.target.value]?.tees?.[0]?.name || '' })}>
                {courses.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </Field>
            <Field label="Abschlag">
              <select className={inputCls} value={r.tee} onChange={(e) => setRound(i, { tee: e.target.value })}>
                {(c?.tees || []).map((x) => <option key={x.name}>{x.name}</option>)}
              </select>
            </Field>
            <Field label="Datum"><input type="date" className={inputCls} value={r.date || ''} onChange={(e) => setRound(i, { date: e.target.value })} /></Field>
            <button type="button" className="self-end rounded-xl border-2 border-red-700 px-3 py-2.5 font-bold text-red-700" onClick={() => set({ rounds: f.rounds.filter((_, k) => k !== i) })}>Entfernen</button>
          </div>
        );
      })}
      {courses.length > 0 && (
        <button className="btn self-start" onClick={() => set({ rounds: [...f.rounds, { id: uid(), courseId: courses[0].id, tee: courses[0].tees?.[0]?.name || '', date: '' }] })}>+ Runde</button>
      )}

      <h3 className="text-lg font-black">Teilnehmer</h3>
      <p className="-mt-2 text-sm text-neutral-600">Handicap-Index für dieses Turnier – leer = aktueller Index des Spielers.</p>
      <div className="flex flex-col">
        {sortedPlayers(S).map((p) => (
          <label key={p.id} className="flex items-center gap-3 border-b border-neutral-100 py-2">
            <input type="checkbox" className="h-6 w-6 accent-green-800" checked={f.playerIds.includes(p.id)}
              onChange={(e) => set({ playerIds: e.target.checked ? [...f.playerIds, p.id] : f.playerIds.filter((x) => x !== p.id) })} />
            <span className="min-w-0 flex-1 font-bold">{p.name} <span className="font-normal text-neutral-500">({fmtHcp(p.hcp)})</span></span>
            <input className={`${inputCls} w-24`} inputMode="decimal" placeholder={p.hcp ?? ''} value={f.hcp[p.id] ?? ''} aria-label={`Turnier-HCP ${p.name}`}
              onChange={(e) => { const h = { ...f.hcp }; if (e.target.value === '') delete h[p.id]; else h[p.id] = e.target.value; set({ hcp: h }); }} />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        {id ? <DangerButton armed={armed} setArmed={setArmed} confirmText="Inkl. Scores löschen?" onConfirm={() => onDelete(id)}>Turnier löschen</DangerButton> : <span />}
        <button className="btn-primary" disabled={!f.name.trim()} onClick={() => {
          const hcp = Object.fromEntries(Object.entries(f.hcp).map(([k, v]) => [k, num(String(v).replace('+', '-'), null)]).filter(([, v]) => v != null));
          onSave(id || uid(), { ...f, name: f.name.trim(), allowance: num(f.allowance, 100), countBest: num(f.countBest, 0), hcp, createdAt: f.createdAt || Date.now() });
        }}>Speichern</button>
      </div>
    </Modal>
  );
}
