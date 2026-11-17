import { useState } from 'react';
import Modal, { Field, inputCls } from '../components/Modal.jsx';
import { inviteLink, isStandalone, parseInvite, testConfig } from '../lib/cloud.js';

export default function Settings({ S, shared, me, setMe, onClose }) {
  const { cfg, connect, status, sync } = shared;
  const [f, setF] = useState(() => cfg || { url: '', key: '', code: '' });
  const [invite, setInvite] = useState('');
  const [manual, setManual] = useState(false);
  const [msg, setMsg] = useState(null);
  const [link, setLink] = useState(null);
  const players = Object.values(S.players).sort((a, b) => a.name.localeCompare(b.name));

  async function tryConnect(c) {
    setMsg('Prüfe Verbindung …');
    try {
      await testConfig(c);
      connect(c);
      setMsg('Verbunden.');
    } catch (e) {
      setMsg(e.status === 401 || e.status === 403 || e.status === 404 ? 'Abgelehnt – Adresse, Schlüssel oder Tabelle prüfen.' : 'Keine Verbindung – Internet prüfen oder später erneut versuchen.');
    }
  }
  function connectInvite(text) {
    const c = parseInvite(text);
    if (!c) { setMsg('Das ist keine gültige Einladung. Bitte den ganzen Link oder Code einfügen.'); return; }
    tryConnect(c);
  }
  async function pasteInvite() {
    try {
      const t = await navigator.clipboard.readText();
      setInvite(t);
      connectInvite(t);
    } catch {
      setMsg('Einfügen nicht erlaubt – bitte lange ins Feld tippen und „Einsetzen“ wählen.');
    }
  }
  async function share() {
    const l = inviteLink(cfg);
    if (navigator.share) {
      try { await navigator.share({ title: 'B10 Golf', text: 'Einladung zur B10-Golf-App – Link antippen, dann bist du verbunden:', url: l }); return; } catch (e) { if (e?.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(l); setLink('kopiert'); } catch { setLink(l); }
  }
  async function copyLink() {
    const l = inviteLink(cfg);
    try { await navigator.clipboard.writeText(l); setLink('kopiert'); } catch { setLink(l); }
  }

  return (
    <Modal title="Einstellungen" onClose={onClose}>
      <Field label="Ich bin … (für Statistik und Vorauswahl)">
        <select className={inputCls} value={me || ''} onChange={(e) => setMe(e.target.value || null)}>
          <option value="">– bitte wählen –</option>
          {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>

      <h3 className="text-lg font-black">B10-Gruppe (gemeinsame Daten)</h3>
      <div className={`rounded-xl px-3 py-2 text-sm font-bold ${status.state === 'online' ? 'bg-turf-100 text-turf-900' : status.state === 'local' ? 'bg-neutral-100' : 'bg-amber-100 text-amber-950'}`}>
        {status.state === 'online' && `Verbunden · zuletzt abgeglichen ${new Date(status.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`}
        {status.state === 'syncing' && 'Gleiche ab …'}
        {status.state === 'local' && 'Nicht verbunden – Daten liegen nur auf diesem Gerät.'}
        {status.state === 'offline' && (status.error || 'Offline')}
        {status.pending > 0 && ` · ${status.pending} Änderung(en) warten auf Upload`}
      </div>

      {cfg ? (
        <div className="flex flex-col gap-2">
          <button className="btn-primary" onClick={share}>Einladung an Freunde senden</button>
          <button className="btn" onClick={copyLink}>Einladungslink kopieren</button>
          {link === 'kopiert' && <div className="text-sm font-bold text-turf-800">Kopiert. Zum Einfügen in der App vom Home-Bildschirm: ⚙︎ → „Einladung einfügen“.</div>}
          {link && link !== 'kopiert' && <textarea readOnly className={`${inputCls} h-24 font-mono text-xs`} value={link} onFocus={(e) => e.target.select()} />}
          <p className="text-sm text-neutral-600">Die Einladung enthält den Gruppen-Code – nur an die B10 schicken.</p>
          <button className="btn" onClick={sync}>Jetzt abgleichen</button>
          <button className="text-sm font-bold text-red-700 underline" onClick={() => { connect(null); setF({ url: '', key: '', code: '' }); setMsg(null); }}>Verbindung auf diesem Gerät trennen</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {isStandalone() && (
            <p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-950">
              Die App auf dem Home-Bildschirm hat ihren eigenen Speicher. Einmal die Einladung einfügen – dann bleibt sie verbunden.
            </p>
          )}
          <Field label="Einladung einfügen (Link oder Code)">
            <textarea className={`${inputCls} h-24 font-mono text-xs`} value={invite} onChange={(e) => setInvite(e.target.value)}
              placeholder="https://…/b10-golf/#setup=…" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn" onClick={pasteInvite}>Aus Zwischenablage</button>
            <button className="btn-primary" disabled={!invite.trim()} onClick={() => connectInvite(invite)}>Verbinden</button>
          </div>
          {msg && <div className="text-sm font-bold">{msg}</div>}
          <button className="self-start text-sm font-bold text-turf-800 underline" onClick={() => setManual(!manual)}>
            {manual ? 'Manuelle Eingabe ausblenden' : 'Ohne Einladung: Supabase-Daten manuell eintragen'}
          </button>
          {manual && (
            <div className="flex flex-col gap-2">
              <Field label="Supabase-URL"><input className={inputCls} value={f.url} placeholder="https://xyz.supabase.co" onChange={(e) => setF({ ...f, url: e.target.value })} /></Field>
              <Field label="Anon-Key"><input className={inputCls} value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })} /></Field>
              <Field label="Gruppen-Code"><input className={inputCls} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>
              <button className="btn-primary" disabled={!f.url || !f.key || !f.code} onClick={() => tryConnect({ url: f.url.trim(), key: f.key.trim(), code: f.code.trim() })}>Verbinden</button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
