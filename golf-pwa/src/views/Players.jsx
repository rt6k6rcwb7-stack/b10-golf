import { useState } from 'react';
import Modal, { DangerButton, Field, inputCls } from '../components/Modal.jsx';
import { fmtHcp, num, uid } from '../lib/golf.js';

export default function Players({ S, save, remove, me, setMe }) {
  const [edit, setEdit] = useState(null); // id | 'new'
  const list = Object.values(S.players).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-end justify-between gap-3">
        <div><div className="label">B10</div><h1 className="text-4xl font-black tracking-tight">Spieler</h1></div>
        <button className="btn-primary shrink-0 whitespace-nowrap" onClick={() => setEdit('new')}>+ Spieler</button>
      </header>
      {!list.length && <p className="rounded-2xl border-2 border-dashed border-neutral-300 p-4 text-neutral-600">Noch keine Spieler. Legt alle mit ihrem Handicap-Index an – das ist die Basis der Nettowertung.</p>}
      <ul className="flex flex-col divide-y-2 divide-neutral-100 border-y-2 border-neutral-100">
        {list.map((p) => (
          <li key={p.id}>
            <button className="flex w-full items-center gap-3 py-3 text-left" onClick={() => setEdit(p.id)}>
              <div className="tnum w-16 text-2xl font-black">{fmtHcp(p.hcp)}</div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold">{p.name}{p.id === me && <span className="ml-2 rounded bg-turf-900 px-1.5 py-0.5 text-xs font-bold text-white">DU</span>}</div>
                <div className="text-sm text-neutral-600">{p.sex === 'w' ? 'Damen' : 'Herren'}-Abschlag{p.hole19 ? ` · Hole19: ${p.hole19}` : ''}</div>
              </div>
              <span className="text-neutral-400">›</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-sm text-neutral-600">Erste Spalte = Handicap-Index. Pro Turnier kann er eingefroren oder angepasst werden.</p>
      {edit && <PlayerModal S={S} id={edit === 'new' ? null : edit} me={me} setMe={setMe} onClose={() => setEdit(null)}
        onSave={(id, d) => { save('players', id, d); setEdit(null); }} onDelete={(id) => { remove('players', id); setEdit(null); }} />}
    </div>
  );
}

function PlayerModal({ S, id, me, setMe, onClose, onSave, onDelete }) {
  const p = id ? S.players[id] : { name: '', hcp: '', sex: 'm', hole19: '' };
  const [f, setF] = useState({ ...p, hcp: p.hcp ?? '' });
  const [armed, setArmed] = useState(false);
  return (
    <Modal title={id ? 'Spieler bearbeiten' : 'Neuer Spieler'} onClose={onClose}>
      <Field label="Name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Handicap-Index"><input className={inputCls} inputMode="decimal" value={f.hcp} placeholder="z. B. 14,3" onChange={(e) => setF({ ...f, hcp: e.target.value })} /></Field>
        <Field label="Abschlag">
          <select className={inputCls} value={f.sex} onChange={(e) => setF({ ...f, sex: e.target.value })}><option value="m">Herren</option><option value="w">Damen</option></select>
        </Field>
      </div>
      <Field label="Hole19-Name (optional)"><input className={inputCls} value={f.hole19 || ''} onChange={(e) => setF({ ...f, hole19: e.target.value })} /></Field>
      {id && (
        <button className={`btn ${id === me ? 'bg-turf-100' : ''}`} onClick={() => setMe(id === me ? null : id)}>
          {id === me ? '✓ Das bin ich (auf diesem Gerät)' : 'Das bin ich'}
        </button>
      )}
      <div className="flex flex-wrap justify-between gap-2">
        {id ? <DangerButton armed={armed} setArmed={setArmed} onConfirm={() => onDelete(id)}>Löschen</DangerButton> : <span />}
        <button className="btn-primary" disabled={!f.name.trim()} onClick={() => onSave(id || uid(), {
          ...f, name: f.name.trim(), hcp: f.hcp === '' ? null : num(String(f.hcp).replace('+', '-'), null), createdAt: p.createdAt || Date.now(),
        })}>Speichern</button>
      </div>
    </Modal>
  );
}
