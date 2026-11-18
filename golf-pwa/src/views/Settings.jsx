import { useState } from 'react';
import Modal, { Field, inputCls } from '../components/Modal.jsx';
import { hasBuiltinServer, isStandalone, parseInvite, testConfig, withDefaults } from '../lib/cloud.js';
import { authErrorText, getSession, sendLoginCode, signOut, verifyLoginCode } from '../lib/auth.js';

const APP_URL = () => `${location.origin}${location.pathname}`;

export default function Settings({ S, shared, me, setMe, onClose }) {
  const { cfg, connect, status, sync, queueLocalChanges } = shared;
  const session = getSession();
  const [email, setEmail] = useState(() => session?.email || localStorage.getItem('golf.lastEmail') || '');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // email | code
  const [busy, setBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [groupCode, setGroupCode] = useState('');
  const [codeMsg, setCodeMsg] = useState(null);
  const [shareMsg, setShareMsg] = useState(null);
  const players = Object.values(S.players).sort((a, b) => a.name.localeCompare(b.name));

  async function requestCode() {
    setBusy(true); setAuthMsg(null);
    try {
      await sendLoginCode(email);
      try { localStorage.setItem('golf.lastEmail', email.trim()); } catch { /* egal */ }
      setStep('code');
      setAuthMsg('Code verschickt – bitte E-Mail öffnen (auch im Spam-Ordner schauen) und den 6-stelligen Code eingeben.');
    } catch (e) { setAuthMsg(authErrorText(e)); } finally { setBusy(false); }
  }
  async function login() {
    setBusy(true); setAuthMsg(null);
    try {
      queueLocalChanges();
      await verifyLoginCode(email, otp);
      setOtp(''); setStep('email'); setAuthMsg('Angemeldet.');
      sync();
    } catch (e) { setAuthMsg(authErrorText(e)); } finally { setBusy(false); }
  }

  // Übergang: Gruppen-Code (bis „Übergang beenden“)
  async function connectCode() {
    const parsed = parseInvite(groupCode);
    const c = parsed || withDefaults({ code: groupCode });
    setCodeMsg('Prüfe …');
    try {
      const rows = await testConfig(c);
      if (!rows || !rows.length) { setCodeMsg('Gruppen-Code falsch oder nicht mehr gültig – bitte mit E-Mail anmelden.'); return; }
      connect(c);
      setCodeMsg('Verbunden.');
    } catch {
      setCodeMsg('Keine Verbindung – Internet prüfen oder später erneut versuchen.');
    }
  }

  async function shareApp() {
    const text = `B10 Golf: ${APP_URL()} – in Safari öffnen → Teilen → „Zum Home-Bildschirm“ → App starten → mit deiner E-Mail anmelden (Code kommt per Mail).`;
    if (navigator.share) {
      try { await navigator.share({ title: 'B10 Golf', text }); return; } catch (e) { if (e?.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(text); setShareMsg('Text kopiert.'); } catch { setShareMsg(text); }
  }

  return (
    <Modal title="Einstellungen" onClose={onClose}>
      <Field label="Ich bin … (für Statistik und Vorauswahl)">
        <select className={inputCls} value={me || ''} onChange={(e) => setMe(e.target.value || null)}>
          <option value="">– bitte wählen –</option>
          {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>

      <h3 className="text-lg font-black">B10-Gruppe</h3>
      <div className={`rounded-xl px-3 py-2 text-sm font-bold ${status.state === 'online' ? 'bg-turf-100 text-turf-900' : status.state === 'local' ? 'bg-neutral-100' : 'bg-amber-100 text-amber-950'}`}>
        {status.state === 'online' && `Verbunden · zuletzt abgeglichen ${new Date(status.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`}
        {status.state === 'syncing' && 'Gleiche ab …'}
        {status.state === 'local' && 'Nicht verbunden – Daten liegen nur auf diesem Gerät.'}
        {status.state === 'offline' && (status.error || 'Offline')}
        {status.pending > 0 && ` · ${status.pending} Änderung(en) warten auf Upload`}
      </div>

      {session ? (
        <div className="flex flex-col gap-2">
          <div className="rounded-xl border-2 border-turf-900 p-3">
            <div className="label">Angemeldet als</div>
            <div className="break-all text-lg font-bold">{session.email}</div>
          </div>
          <button className="btn" onClick={shareApp}>App an Freunde schicken</button>
          {shareMsg && <div className="text-sm">{shareMsg}</div>}
          <p className="text-sm text-neutral-600">Anmelden können sich nur eingeladene E-Mail-Adressen (Supabase → Authentication → Users → „Invite user“).</p>
          <button className="btn" onClick={sync}>Jetzt abgleichen</button>
          <button className="text-sm font-bold text-red-700 underline" onClick={() => { signOut(); setAuthMsg(null); }}>Abmelden</button>
        </div>
      ) : hasBuiltinServer ? (
        <div className="flex flex-col gap-2">
          {isStandalone() && !enabledByCode(cfg) && (
            <p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-950">Die App auf dem Home-Bildschirm hat ihren eigenen Speicher – hier einmal anmelden, dann bleibst du angemeldet.</p>
          )}
          {enabledByCode(cfg) && (
            <p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-950">Übergangsweise mit Gruppen-Code verbunden. Bitte jetzt mit deiner E-Mail anmelden – der Gruppen-Code wird bald abgeschaltet.</p>
          )}
          {step === 'email' ? (
            <>
              <Field label="E-Mail-Adresse">
                <input className={`${inputCls} text-lg`} type="email" inputMode="email" autoComplete="email" autoCapitalize="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@beispiel.de" />
              </Field>
              <button className="btn-primary" disabled={busy || !/.+@.+\..+/.test(email.trim())} onClick={requestCode}>{busy ? 'Sende …' : 'Code per E-Mail senden'}</button>
            </>
          ) : (
            <>
              <Field label={`Code aus der E-Mail an ${email.trim()}`}>
                <input className={`${inputCls} tnum text-center text-3xl tracking-[0.4em]`} inputMode="numeric" autoComplete="one-time-code" maxLength={10}
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="••••••" />
              </Field>
              <button className="btn-primary" disabled={busy || otp.length < 6} onClick={login}>{busy ? 'Prüfe …' : 'Anmelden'}</button>
              <div className="flex justify-between text-sm font-bold text-turf-800">
                <button className="underline" onClick={() => { setStep('email'); setOtp(''); setAuthMsg(null); }}>Andere E-Mail</button>
                <button className="underline" disabled={busy} onClick={requestCode}>Code neu senden</button>
              </div>
            </>
          )}
          {authMsg && <div className="text-sm font-bold">{authMsg}</div>}

          {!enabledByCode(cfg) && (
            <>
              <button className="mt-2 self-start text-sm font-bold text-neutral-600 underline" onClick={() => setShowCode(!showCode)}>
                {showCode ? 'Gruppen-Code ausblenden' : 'Übergangsweise: mit Gruppen-Code verbinden'}
              </button>
              {showCode && (
                <div className="flex flex-col gap-2">
                  <Field label="Gruppen-Code oder Einladungslink">
                    <input className={inputCls} value={groupCode} onChange={(e) => setGroupCode(e.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
                  </Field>
                  <button className="btn" disabled={groupCode.trim().length < 4} onClick={connectCode}>Mit Code verbinden</button>
                  {codeMsg && <div className="text-sm font-bold">{codeMsg}</div>}
                </div>
              )}
            </>
          )}
          {enabledByCode(cfg) && (
            <button className="self-start text-sm font-bold text-red-700 underline" onClick={() => connect(null)}>Gruppen-Code-Verbindung trennen</button>
          )}
        </div>
      ) : (
        <p className="text-sm text-neutral-600">In dieser App-Version ist keine Datenbank hinterlegt (src/config.js).</p>
      )}
    </Modal>
  );
}

const enabledByCode = (cfg) => !!(cfg && cfg.code && !cfg.auth);
