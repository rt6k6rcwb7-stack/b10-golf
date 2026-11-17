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
Spieler, Plätze, Turniere und Scorekarten liegen in einer kostenlosen Supabase-Datenbank. Einrichtung einmalig:
1. https://supabase.com → kostenloses Konto → **New project** (Region Frankfurt, Passwort egal merken).
2. **SQL Editor** → Inhalt von [`golf-pwa/supabase/setup.sql`](golf-pwa/supabase/setup.sql) einfügen, `GRUPPEN-CODE` durch einen eigenen Code ersetzen → **Run**.
3. **Project Settings → API**: *Project URL* und *anon public key* kopieren.
4. In der App: ⚙︎ oben rechts → „Ohne Einladung: Supabase-Daten manuell eintragen“ → URL, Key und Gruppen-Code → **Verbinden**.
5. ⚙︎ → **Einladung an Freunde senden** (öffnet das Teilen-Menü, z. B. WhatsApp).

## Auf dem iPhone installieren
1. Einladungslink in Safari öffnen (oder die App-Adresse) → Teilen → **Zum Home-Bildschirm**.
2. Die App vom Home-Bildschirm starten. Sie hat ihren **eigenen Speicher** – deshalb einmal ⚙︎ → **Einladung einfügen**
   (Link vorher kopieren, dann „Aus Zwischenablage“) → verbunden. Danach bleibt sie verbunden.

Der Gruppen-Code steht nur im Einladungslink und in der Datenbank – nie im Repository.

## Ordner
- `golf-pwa/` – die App (React, Vite, Tailwind), siehe `golf-pwa/README.md`
- `archiv/` – frühere Turnier-App als Claude-Artifact (abgelöst)
- `logo-wannsee.png` – Logo des GLC Berlin-Wannsee
