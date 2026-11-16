// Kennzahlen einer Runde und über alle Runden.
export const played = (h) => h.strokes > 0;

// Green in Regulation: Grün mit Par − 2 Schlägen erreicht (Schläge − Putts ≤ Par − 2).
export const isGIR = (h) => played(h) && h.putts != null && h.strokes - h.putts <= h.par - 2;

export function roundStats(round) {
  const holes = round.holes.filter(played);
  const strokes = holes.reduce((s, h) => s + h.strokes, 0);
  const par = holes.reduce((s, h) => s + h.par, 0);
  const withPutts = holes.filter((h) => h.putts != null);
  const putts = withPutts.reduce((s, h) => s + h.putts, 0);
  const gir = holes.filter(isGIR).length;
  const fwHoles = holes.filter((h) => h.par >= 4 && h.fairway);
  const fwHit = fwHoles.filter((h) => h.fairway === 'M').length;
  return {
    holesPlayed: holes.length,
    holesTotal: round.holes.length,
    strokes,
    par,
    toPar: strokes - par,
    putts: withPutts.length ? putts : null,
    gir,
    girPct: holes.length ? Math.round((gir / holes.length) * 100) : null,
    fairways: fwHoles.length ? `${fwHit}/${fwHoles.length}` : null,
    fairwayPct: fwHoles.length ? Math.round((fwHit / fwHoles.length) * 100) : null,
  };
}

export function overallStats(rounds) {
  const done = rounds.filter((r) => r.finished).map(roundStats).filter((s) => s.holesPlayed > 0);
  if (!done.length) return null;
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const full18 = done.filter((s) => s.holesPlayed === 18);
  return {
    rounds: done.length,
    avgScore18: avg(full18.map((s) => s.strokes)),
    best18: full18.length ? Math.min(...full18.map((s) => s.strokes)) : null,
    avgPutts: avg(done.filter((s) => s.putts != null).map((s) => s.putts)),
    puttsPerHole: avg(done.filter((s) => s.putts != null).map((s) => s.putts / s.holesPlayed)),
    girPct: avg(done.filter((s) => s.girPct != null).map((s) => s.girPct)),
    fairwayPct: avg(done.filter((s) => s.fairwayPct != null).map((s) => s.fairwayPct)),
  };
}

export const fmtToPar = (v) => (v === 0 ? 'E' : v > 0 ? `+${v}` : `${v}`);
