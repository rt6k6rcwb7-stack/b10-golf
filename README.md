# B10 Golf

Golfrunden mit Freunden.

Turnier-App für die B10-Golffreunde – veröffentlicht als Claude-Artifact mit gemeinsamer Datenbank:
https://claude.ai/artifact/3vS3KSimJz4AjiTkVnc69Y

## Funktionen
- **Spieler**: Name, Handicap-Index (auch Plus-HCP), Herren/Damen-Abschlag, Hole19-Name, „Das bin ich“.
- **Plätze**: 9 oder 18 Löcher mit Par, Handicap-Reihenfolge (SI), Metern und Besonderheit je Loch;
  Abschläge mit Course Rating und Slope (Herren/Damen); Platzregeln. Scorecard per Foto/Text von Claude auslesen lassen.
- **Turniere** über mehrere Runden auf verschiedenen Plätzen: Zählspiel oder Stableford, Handicap-Anteil (%),
  optional Max. Netto-Doppelbogey, optional nur die besten N Runden werten.
- **Brutto- und Nettowertung** gesamt und je Runde (WHS: Course HCP = Index × Slope/113 + (CR − Par), Vorgabeschläge nach SI).
- **Eingabe durch alle Spieler**, live für alle sichtbar: Loch für Loch mit −/+, oder **Hole19-Runde übernehmen**
  (Screenshot der Hole19-Scorekarte oder kopierter Text wird von Claude ausgelesen, alternativ Zahlenreihe eintippen).
- Scorekarten mit Birdie-Kreis / Bogey-Quadrat, „erfasst von“.

## Zugriff für die Freunde
Im Artifact über **Teilen** die Freunde einladen. Damit sie eintragen können, brauchen sie mindestens die Stufe
*Mitwirkende/r (Contributor)* bzw. *Bearbeiter/in*; Betrachter können nur lesen.
Außerhalb von Claude geöffnet (z. B. lokal) speichert die App nur auf dem Gerät.

## Dateien
- `index.html` – die komplette App (eine Datei; Quelle des Artifacts)
- `logo-wannsee.png` – Logo des GLC Berlin-Wannsee (in `index.html` eingebettet)
- `golf-pwa/` – persönliche Golf-PWA (React, Vite, Tailwind): Scorecard, GPS-Distanzen, Statistik – siehe `golf-pwa/README.md`
