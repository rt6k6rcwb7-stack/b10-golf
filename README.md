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

## Gemeinsame Daten (Supabase)
Spieler, Plätze, Turniere, Scorekarten und Lochbilder liegen in einer kostenlosen Supabase-Datenbank.
Adresse und *anon key* stehen in [`golf-pwa/src/config.js`](golf-pwa/src/config.js) – sie dürfen öffentlich sein,
denn Lesen und Schreiben erlaubt die Datenbank nur mit dem **Gruppen-Code**. Der steht nie im Repository.

**Jedes Gerät einmal verbinden:** App öffnen → Gruppen-Code eingeben → **Verbinden**. Danach bleibt es verbunden.
(Alternativ den Einladungslink aus ⚙︎ → „Einladung an Freunde senden“ öffnen.)

Neue Datenbank einrichten (nur einmal, schon erledigt): Supabase-Projekt anlegen, im **SQL Editor**
[`golf-pwa/supabase/setup.sql`](golf-pwa/supabase/setup.sql) ausführen (vorher `GRUPPEN-CODE` ersetzen), dann
*Project URL* und *anon public key* in `golf-pwa/src/config.js` eintragen.

## Auf dem iPhone installieren
1. https://rt6k6rcwb7-stack.github.io/b10-golf/ in **Safari** öffnen → Teilen → **Zum Home-Bildschirm**.
2. Die App vom Home-Bildschirm starten und den **Gruppen-Code** eingeben. (Die Home-Bildschirm-App hat einen eigenen
   Speicher – deshalb dort verbinden, nicht in Safari.)

## Ordner
- `golf-pwa/` – die App (React, Vite, Tailwind), siehe `golf-pwa/README.md`
- `archiv/` – frühere Turnier-App als Claude-Artifact (abgelöst)
- `logo-wannsee.png` – Logo des GLC Berlin-Wannsee
