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
- **Scorecard**: Platz wählen, 18 Löcher, Front 9 oder Back 9; pro Loch Schläge, Putts und Fairway (Links/Mitte/Rechts)
  über große, kontrastreiche Buttons. Leeres Schlag-Feld antippen = Par.
- **GPS-Distanz**: Live-Meter zu Grün-Anfang, -Mitte und -Ende (Geolocation-API, `watchPosition`, hohe Genauigkeit).
- **Speicherung**: alle Runden im LocalStorage (`golf.rounds.v1`); eine laufende Runde wird beim Öffnen fortgesetzt.
- **Statistik**: Score und zu Par, Putts pro Runde, Greens in Regulation (Schläge − Putts ≤ Par − 2), Fairway-Quote.

## Eigene Plätze ergänzen
Datei `src/data/courses.json`, Liste `courses`. Pro Loch:
```json
{ "number": 1, "par": 4, "hcp": 7,
  "tee":   { "lat": 52.43, "lng": 13.18 },
  "green": { "front":  { "lat": 52.4331, "lng": 13.18 },
             "center": { "lat": 52.4332, "lng": 13.18 },
             "back":   { "lat": 52.4333, "lng": 13.18 } } }
```
Koordinaten bekommst du z. B. in Google Maps (Satellit): Punkt lange drücken → Koordinaten kopieren.
`placeholderCoordinates: true` entfernen, sobald echte Werte drin sind. Der mitgelieferte **Beispielplatz** hat nur
Platzhalter-Koordinaten.

## Aufbau
- `src/App.jsx` – Navigation und Rundenverwaltung
- `src/components/` – Home (Statistik, Runden), NewRound, Play (Loch-Eingabe + GPS), RoundDetail (Scorekarte)
- `src/lib/` – LocalStorage, GPS-Hook, Entfernung (Haversine), Statistik

## Veröffentlichung (GitHub Pages)
Der Workflow `.github/workflows/pages.yml` baut die App bei jedem Push auf `main` (Änderungen in `golf-pwa/`)
und veröffentlicht sie unter `https://rt6k6rcwb7-stack.github.io/b10-golf/`.
Einmalig nötig: Repository → *Settings* → *Pages* → *Build and deployment* → Source **GitHub Actions**.
Manuell starten: *Actions* → „Golf-PWA auf GitHub Pages“ → *Run workflow*.
