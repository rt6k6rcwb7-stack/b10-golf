# B10 Golf

Golfrunden mit Freunden.

**App:** https://rt6k6rcwb7-stack.github.io/b10-golf/ (Progressive Web App – auf dem iPhone in Safari öffnen → Teilen → „Zum Home-Bildschirm“)

## Funktionen
- **Runden**: eigene Runden mit Schlägen, Putts und Fairway pro Loch, GPS-Distanz zu Grün-Anfang/-Mitte/-Ende, Statistik
  (Ø-Score, Putts, Greens in Regulation, Fairway-Quote – inkl. der eigenen Turnierrunden).
- **Turniere** über mehrere Plätze: Zählspiel oder Stableford, Brutto- und Nettowertung nach WHS (Course Handicap aus Index,
  Course Rating, Slope und Par; Vorgabeschläge nach Handicap-Reihenfolge), Handicap-Anteil, max. Netto-Doppelbogey, „beste N Runden“.
  Alle Spieler tragen live ein; Hole19-Runden per Zahlenreihe übernehmen.
- **Spieler** und **Plätze** (Par, HCP, Besonderheiten je Loch, Abschläge mit CR/Slope, GPS-Punkte der Grüns – auf dem Platz einmessbar, Lochbilder).
- Funktioniert offline; Änderungen werden hochgeladen, sobald wieder Netz da ist.

## Gemeinsame Daten (Supabase) und Anmeldung
Spieler, Plätze, Turniere, Scorekarten und Lochbilder liegen in einer Supabase-Datenbank (Adresse und öffentlicher
*anon key* in [`golf-pwa/src/config.js`](golf-pwa/src/config.js)).

**Zugang:** Anmeldung mit E-Mail-Adresse und 6-stelligem Code aus der E-Mail. Nur eingeladene Adressen können sich
anmelden (die App legt nie Konten an). Lesen und Schreiben erlauben die Datenbank-Regeln „mitglieder …“ nur
angemeldeten Mitgliedern. **Übergangsweise** funktioniert noch der Gruppen-Code (Regeln „uebergang …“), bis alle
umgestellt sind.

Einrichtung in Supabase (einmalig):
1. **Authentication → Sign In / Providers**: „Allow new users to sign up“ **aus**.
2. **Eigener E-Mail-Versand (SMTP)** unter *Authentication → Emails → SMTP Settings* – der eingebaute Versand stellt
   nur an Mitglieder des Supabase-Teams zu (und max. wenige Mails pro Stunde).
3. **Authentication → Emails → Magic Link**: Vorlage so ändern, dass sie den Code `{{ .Token }}` enthält.
4. **Authentication → Users → Invite user**: alle B10-Mitglieder einladen.

## Auf dem iPhone installieren
1. https://rt6k6rcwb7-stack.github.io/b10-golf/ in **Safari** öffnen → Teilen → **Zum Home-Bildschirm**.
2. Die App vom Home-Bildschirm starten → E-Mail eingeben → Code aus der Mail eintippen. (Die Home-Bildschirm-App hat
   einen eigenen Speicher – deshalb dort anmelden, nicht in Safari.)

## Ordner
- `golf-pwa/` – die App (React, Vite, Tailwind), siehe `golf-pwa/README.md`
- `archiv/` – frühere Turnier-App als Claude-Artifact (abgelöst)
- `logo-wannsee.png` – Logo des GLC Berlin-Wannsee
