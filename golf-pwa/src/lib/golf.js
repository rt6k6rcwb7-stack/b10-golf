// Handicap- und Wertungsrechnung (World Handicap System).
export const num = (v, d) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : d;
};
const sum = (a) => a.reduce((x, y) => x + (Number(y) || 0), 0);

export const skey = (tid, rid, pid) => `${tid}__${rid}__${pid}`;
export const teeOf = (course, name) => (course?.tees || []).find((t) => t.name === name) || (course?.tees || [])[0] || {};
export const coursePar = (course) => sum((course?.holes || []).map((h) => h.par));
export const fmtHcp = (v) => (v == null || v === '' ? '–' : v < 0 ? `+${String(-v).replace('.', ',')}` : String(v).replace('.', ','));
export const fmtToPar = (v) => (v == null ? '–' : v === 0 ? 'E' : v > 0 ? `+${v}` : `${v}`);

// Course Handicap = HI × Slope/113 + (CR − Par); 9-Loch-Plätze mit halbem Index
export function courseHcp(hi, course, tee, sex) {
  const n = (course.holes || []).length || 18;
  const w = sex === 'w';
  const cr = num(w && tee.crW ? tee.crW : tee.crM, null);
  const slope = num(w && tee.slopeW ? tee.slopeW : tee.slopeM, null);
  const h = n === 9 ? hi / 2 : hi;
  if (cr == null || slope == null) return Math.round(h);
  return Math.round((h * slope) / 113 + (cr - coursePar(course)));
}

// Vorgabeschläge je Loch nach Handicap-Reihenfolge (SI); Plus-Handicap gibt auf den leichtesten Löchern zurück
export function strokeAlloc(ph, holes) {
  const n = holes.length;
  if (!n) return [];
  const order = holes.map((h, i) => ({ i, si: num(h.si, 99) })).sort((a, b) => a.si - b.si || a.i - b.i);
  const rank = [];
  order.forEach((o, r) => (rank[o.i] = r + 1));
  const p = Math.abs(ph), base = Math.floor(p / n), rem = p % n;
  return holes.map((_, i) => (ph >= 0 ? base + (rank[i] <= rem ? 1 : 0) : -(base + (rank[i] > n - rem ? 1 : 0))));
}

export function playerHi(t, player) {
  const o = t.hcp && t.hcp[player?.id];
  return num(o, num(player?.hcp, 54));
}

export function roundResult(S, t, r, pid) {
  const course = S.courses[r.courseId];
  if (!course) return null;
  const holes = course.holes || [];
  const n = holes.length;
  const tee = teeOf(course, r.tee);
  const p = S.players[pid] || {};
  const hi = playerHi(t, p);
  const ch = courseHcp(hi, course, tee, p.sex);
  const ph = Math.round((ch * num(t.allowance, 100)) / 100);
  const recv = strokeAlloc(ph, holes);
  const st = (S.scores[skey(t.id, r.id, pid)] || {}).strokes || [];
  const o = { n, hi, ch, ph, recv, played: 0, gross: 0, net: 0, par: 0, sfG: 0, sfN: 0, g: [] };
  holes.forEach((h, i) => {
    let g = st[i];
    const par = num(h.par, 4);
    if (!(g > 0)) { o.g.push(null); return; }
    if (t.maxScore === 'ndb') g = Math.min(g, par + 2 + recv[i]);
    o.played++; o.gross += g; o.net += g - recv[i]; o.par += par;
    o.sfG += Math.max(0, 2 + par - g);
    o.sfN += Math.max(0, 2 + par + recv[i] - g);
    o.g.push(g);
  });
  o.toParG = o.gross - o.par;
  o.toParN = o.net - o.par;
  o.complete = n > 0 && o.played === n;
  return o;
}

export function leaderboard(S, t, scope, mode) {
  const sf = t.format === 'stableford';
  const rounds = (t.rounds || []).filter((r) => scope === 'all' || r.id === scope);
  const metricOf = (res) => (!res || !res.played ? null : sf ? (mode === 'brutto' ? res.sfG : res.sfN) : mode === 'brutto' ? res.toParG : res.toParN);
  const better = (a, b) => (sf ? b - a : a - b);
  const rows = (t.playerIds || []).filter((pid) => S.players[pid]).map((pid) => {
    const per = rounds.map((r) => ({ r, res: roundResult(S, t, r, pid), dropped: false }));
    let counted = per.filter((x) => metricOf(x.res) != null);
    const best = num(t.countBest, 0);
    if (scope === 'all' && best > 0 && counted.length > best) {
      const sorted = [...counted].sort((a, b) => better(metricOf(a.res), metricOf(b.res)));
      const keep = new Set(sorted.slice(0, best));
      counted.forEach((x) => (x.dropped = !keep.has(x)));
      counted = sorted.slice(0, best);
    }
    return {
      pid,
      per,
      metric: counted.length ? sum(counted.map((x) => metricOf(x.res))) : null,
      strokes: sum(counted.map((x) => (mode === 'brutto' ? x.res.gross : x.res.net))),
      played: sum(per.map((x) => (x.res ? x.res.played : 0))),
      total: sum(per.map((x) => (x.res ? x.res.n : 0))),
    };
  });
  rows.sort(
    (a, b) =>
      (a.metric == null) - (b.metric == null) ||
      (a.metric != null && better(a.metric, b.metric)) ||
      b.played - a.played ||
      (S.players[a.pid].name || '').localeCompare(S.players[b.pid].name || '')
  );
  rows.forEach((r, i) => { r.pos = r.metric == null ? null : i > 0 && rows[i - 1].metric === r.metric ? rows[i - 1].pos : i + 1; });
  const counts = {};
  rows.forEach((r) => (counts[r.pos] = (counts[r.pos] || 0) + 1));
  rows.forEach((r) => (r.posLabel = r.pos == null ? '–' : (counts[r.pos] > 1 ? 'T' : '') + r.pos));
  return { rows, rounds, sf, metricOf };
}

export function tournamentStatus(S, t) {
  const rs = t.rounds || [];
  if (!rs.length) return { k: 'plan', l: 'In Planung' };
  let played = 0, total = 0;
  rs.forEach((r) => (t.playerIds || []).forEach((pid) => {
    const x = roundResult(S, t, r, pid);
    if (x) { played += x.played; total += x.n; }
  }));
  if (total && played === total) return { k: 'done', l: 'Beendet' };
  if (played > 0) return { k: 'live', l: 'Läuft' };
  return { k: 'plan', l: 'Geplant' };
}

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
