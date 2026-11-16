# Golf-PWA (persönlich)

Progressive Web App mit React, Vite und Tailwind CSS: Scorecard, GPS-Distanzmesser und Statistik.

## Start
```bash
cd golf-pwa
npm install
npm run dev        # Entwicklungsserver auf http://localhost:5173
npm run build      # Produktions-Build nach dist/ (inkl. Service Worker)
npm run preview    # Build lokal ansehen
```
GPS funktioniert im Browser nur über **https** oder **localhost**. Zum Testen auf dem Handy also den Build
über https hosten (z. B. GitHub Pages, Netlify) und dort „Zum Home-Bildschirm“ wählen.

## Funktionen
Vier Bereiche (Tabs): **Runden** (eigene Runden + Statistik), **Turniere** (Leaderboard Brutto/Netto, Scorekarten),
**Spieler**, **Plätze**. ⚙︎ oben rechts: „Ich bin …“, Verbindung zur B10-Gruppe, Einladungslink.

Datenhaltung:
- Eigene Runden: nur auf dem Gerät (`golf.rounds.v1`).
- Spieler, Plätze, Turniere, Scorekarten: Supabase-Tabelle `docs` (`src/lib/cloud.js`), lokal zwischengespeichert;
  Änderungen gehen erst in eine Warteschlange und werden hochgeladen, sobald Netz da ist (Abgleich alle 15 s).
- Ohne Verbindung startet die App mit den B10-Startdaten aus `src/data/seed.json`.

## Grüns auf dem Platz einmessen
Fehlen für ein Loch Grün-Koordinaten (z. B. beim Heimatplatz GLC Berlin-Wannsee), in der Runde
**GPS einschalten → „Grün einmessen“**, auf Grün-Anfang, -Mitte und -Ende stellen und jeweils „… hier“ tippen.
Die Punkte werden direkt im Platz gespeichert und gelten nach dem Abgleich für alle B10-Spieler.

## Lochbilder
Unter **Plätze → Platz bearbeiten → Lochbilder**: einzeln über 📷 in der Löcher-Tabelle oder mehrere auf einmal
(nach Dateiname sortiert, z. B. `01.jpg` … `18.jpg`, ab Loch 1). Die App verkleinert die Bilder (max. 1200 px, JPEG)
und speichert sie in der Sammlung `holeimages` (eigene Einträge `<platzId>__<loch>`). Geräte laden ein Bild nur einmal
und halten es in IndexedDB vor; abgeglichen wird beim Start und alle 5 Minuten. Beim Spielen erscheint das Bild über
dem Loch, antippen = Vollbild.

## Plätze ergänzen
Am einfachsten in der App unter **Plätze**. Format eines Platzes (z. B. für `src/data/seed.json`), pro Loch:
```json
{ "par": 4, "si": 7, "len": "350", "note": "Wasser links",
  "green": { "front":  { "lat": 52.4331, "lng": 13.18 },
             "center": { "lat": 52.4332, "lng": 13.18 },
             "back":   { "lat": 52.4333, "lng": 13.18 } } }
```
Koordinaten bekommst du z. B. in Google Maps (Satellit): Punkt lange drücken → Koordinaten kopieren.

## Aufbau
- `src/App.jsx` – Kopfzeile, Tabs, Startdaten, Einladungslink
- `src/views/` – MyGolf (Runden + Statistik), Tournaments, Players, Courses, Settings
- `src/components/` – HoleEntry (Loch-Eingabe + GPS), Stepper, Modal
- `src/lib/` – cloud (Supabase + Offline-Warteschlange), golf (WHS-Rechnung, Leaderboard), stats, GPS-Hook, Entfernung
- `supabase/setup.sql` – Tabelle, Zugriffsregeln mit Gruppen-Code, Startdaten

## Veröffentlichung (GitHub Pages)
Der Workflow `.github/workflows/pages.yml` baut die App bei jedem Push auf `main` (Änderungen in `golf-pwa/`)
und veröffentlicht sie unter `https://rt6k6rcwb7-stack.github.io/b10-golf/`.
Einmalig nötig: Repository → *Settings* → *Pages* → *Build and deployment* → Source **GitHub Actions**.
Manuell starten: *Actions* → „Golf-PWA auf GitHub Pages“ → *Run workflow*.
