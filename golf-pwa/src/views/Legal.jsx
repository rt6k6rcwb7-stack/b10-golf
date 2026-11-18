// Impressum und Datenschutzerklärung. Inhalte beschreiben, was die App tatsächlich tut.
import Modal from '../components/Modal.jsx';
import { hasPlaceholders, LEGAL_UPDATED, OPERATOR, SERVICES } from '../legal.js';

const H = ({ children }) => <h3 className="text-lg font-black">{children}</h3>;
const P = ({ children }) => <p className="text-[15px] leading-relaxed text-neutral-800">{children}</p>;
const L = ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="break-words font-bold text-turf-800 underline">{children}</a>;

function PlaceholderNote() {
  if (!hasPlaceholders()) return null;
  return (
    <div className="rounded-xl bg-red-100 p-3 text-sm font-bold text-red-900">
      Entwurf: Name, Anschrift und E-Mail des Verantwortlichen fehlen noch (src/legal.js).
    </div>
  );
}

function Address() {
  return (
    <P>
      {OPERATOR.name}<br />{OPERATOR.street}<br />{OPERATOR.city}<br />
      E-Mail: {OPERATOR.email}
    </P>
  );
}

export function Impressum({ onClose, onOther }) {
  return (
    <Modal title="Impressum" onClose={onClose}>
      <PlaceholderNote />
      <H>Angaben gemäß § 5 DDG</H>
      <Address />
      <H>Hinweis</H>
      <P>
        B10 Golf ist eine private, nicht kommerzielle App für eine Golfgruppe von Freunden. Sie wird nicht öffentlich
        beworben, ist kostenlos und enthält keine Werbung.
      </P>
      <button className="self-start font-bold text-turf-800 underline" onClick={onOther}>Zur Datenschutzerklärung</button>
    </Modal>
  );
}

export function Datenschutz({ onClose, onOther }) {
  const { hosting, database, email } = SERVICES;
  return (
    <Modal title="Datenschutz" onClose={onClose}>
      <PlaceholderNote />
      <P>Stand: {LEGAL_UPDATED}</P>

      <H>1. Verantwortlicher</H>
      <Address />

      <H>2. Worum es geht</H>
      <P>
        B10 Golf ist eine private App für eine Golfgruppe von Freunden: Turniere mit Brutto- und Nettowertung,
        Scorekarten und persönliche Statistik. Es gibt keine Werbung, kein Tracking, keine Analyse-Werkzeuge,
        keine Cookies und keine Schriften oder Inhalte von Drittanbietern.
      </P>

      <H>3. Bereitstellung der App ({hosting.name})</H>
      <P>
        Die App wird über {hosting.name} ausgeliefert ({hosting.company}). Beim Aufruf verarbeitet der Anbieter
        technisch notwendige Verbindungsdaten, insbesondere die IP-Adresse, Datum und Uhrzeit sowie Angaben zum Browser,
        um die Seite auszuliefern und die Sicherheit des Dienstes zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1
        lit. f DSGVO (berechtigtes Interesse an einer sicheren, funktionsfähigen Bereitstellung). Dabei können Daten in die
        USA übermittelt werden; GitHub ist nach dem EU-US Data Privacy Framework zertifiziert.
        Mehr: <L href={hosting.privacy}>Datenschutzerklärung von GitHub</L>.
      </P>

      <H>4. Gemeinsame Daten der Gruppe ({database.name})</H>
      <P>
        Damit alle Mitglieder Turniere und Ergebnisse sehen und eintragen können, werden folgende Daten in einer
        Datenbank bei {database.company} gespeichert, {database.region}:
      </P>
      <ul className="list-disc pl-5 text-[15px] leading-relaxed text-neutral-800">
        <li>Spieler: Name oder Spitzname, Handicap-Index, Abschlag (Herren/Damen), optional der Name in der App Hole19</li>
        <li>Turniere und Scorekarten: Schläge, Putts und Fairway-Treffer je Loch, Handicap im Turnier, Zeitpunkt der letzten Änderung</li>
        <li>Plätze: Par, Handicap-Reihenfolge, Besonderheiten, Lochbilder und GPS-Punkte der Grüns (Platzdaten ohne Personenbezug)</li>
        <li>Anmeldung: E-Mail-Adresse, Zeitpunkte von Anmeldungen sowie technische Protokolle des Anbieters (u. a. IP-Adresse)</li>
      </ul>
      <P>
        Alle angemeldeten Mitglieder der Gruppe können diese gemeinsamen Daten sehen und bearbeiten. Zweck ist die
        Durchführung und Auswertung der gemeinsamen Turniere. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO
        (berechtigtes Interesse der Gruppe an einer gemeinsamen Turnierverwaltung) sowie für die Anmeldung
        Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung des Zugangs). Der Anbieter verarbeitet die Daten in unserem Auftrag
        (Auftragsverarbeitung nach Art. 28 DSGVO); für mögliche Zugriffe aus den USA gelten die
        EU-Standardvertragsklauseln. Mehr: <L href={database.privacy}>Datenschutzerklärung von Supabase</L>.
      </P>

      <H>5. Anmelde-E-Mails ({email.name})</H>
      <P>
        Für die Anmeldung erhältst du einen Code per E-Mail. Für den Versand wird deine E-Mail-Adresse an
        {' '}{email.company} übermittelt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
        Mehr: <L href={email.privacy}>Datenschutzerklärung von Brevo</L>.
      </P>

      <H>6. Daten nur auf deinem Gerät</H>
      <P>
        Eigene Runden (ohne Turnier), Einstellungen wie „Ich bin …“, die Anmeldung und ein Zwischenspeicher der
        gemeinsamen Daten für die Nutzung ohne Netz liegen nur im Speicher deines Browsers (Local Storage, IndexedDB).
        Das ist für die Funktion der App unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Du kannst diese Daten jederzeit
        löschen, indem du die App vom Home-Bildschirm entfernst bzw. die Website-Daten im Browser löschst.
      </P>
      <P>
        <b>Standort:</b> Wenn du die GPS-Distanzen einschaltest, fragt dein Gerät um Erlaubnis. Dein Standort wird nur auf
        deinem Gerät zur Berechnung der Entfernung zum Grün verwendet und nicht übertragen oder gespeichert. Ausnahme:
        Tippst du auf „Grün einmessen“, wird die aktuelle Position als Punkt des Grüns im Platz gespeichert – ohne Bezug
        zu deiner Person.
      </P>

      <H>7. Speicherdauer</H>
      <P>
        Gemeinsame Daten bleiben gespeichert, solange die Gruppe die App nutzt. Wer die Gruppe verlässt, kann die
        Löschung seines Zugangs und seiner Spielerdaten verlangen; Ergebnisse in abgeschlossenen Turnieren können auf
        Wunsch anonymisiert werden. Protokolle der Anbieter werden nach deren Fristen gelöscht.
      </P>

      <H>8. Deine Rechte</H>
      <P>
        Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der
        Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage
        berechtigter Interessen (Art. 21). Eine formlose Nachricht an die oben genannte E-Mail-Adresse genügt.
        Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO).
      </P>

      <button className="self-start font-bold text-turf-800 underline" onClick={onOther}>Zum Impressum</button>
    </Modal>
  );
}
