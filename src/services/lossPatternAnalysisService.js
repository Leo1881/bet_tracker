/**
 * Loss-pattern analysis over settled Sheet1 bets.
 * Pure functions — call after fetching fresh sheet data.
 */

const norm = (s) => String(s ?? "").trim();
const low = (s) => norm(s).toLowerCase();
const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const pct = (a, b) => (b > 0 ? +(100 * (a / b)).toFixed(1) : 0);

function teamOdds(b) {
  if (b.team && b.home && low(b.team) === low(b.home)) return b.odds1;
  if (b.team && b.away && low(b.team) === low(b.away)) return b.odds2;
  return null;
}

function oddsBucket(o) {
  if (o == null) return null;
  if (o < 1.4) return "<1.40";
  if (o < 1.7) return "1.40–1.69";
  if (o < 2.0) return "1.70–1.99";
  if (o < 2.5) return "2.00–2.49";
  if (o < 3.5) return "2.50–3.49";
  if (o < 5) return "3.50–4.99";
  return "5.00+";
}

/** Collapse Sheet1 BET_TYPE into SW / DC / O-U / Other */
function categorizeBetType(betType) {
  const t = low(betType);
  if (t.includes("double chance")) return "Double Chance";
  if (t.includes("over") || t.includes("under")) return "Over/Under";
  if (t.includes("win") || !t) return "Straight Win";
  return norm(betType) || "Other";
}

function normalizeBet(raw) {
  return {
    date: norm(raw.DATE ?? raw.date),
    country: norm(raw.COUNTRY ?? raw.country),
    league: norm(raw.LEAGUE ?? raw.league),
    home: norm(raw.HOME_TEAM ?? raw.home_team),
    away: norm(raw.AWAY_TEAM ?? raw.away_team),
    odds1: num(raw.ODDS1 ?? raw.odds1 ?? raw.odds_1),
    odds2: num(raw.ODDS2 ?? raw.odds2 ?? raw.odds_2),
    betType: norm(raw.BET_TYPE ?? raw.bet_type),
    betSel: norm(raw.BET_SELECTION ?? raw.bet_selection),
    team: norm(raw.TEAM_INCLUDED ?? raw.team_included ?? raw.team_bet),
    hs: num(raw.HOME_SCORE ?? raw.home_score),
    as: num(raw.AWAY_SCORE ?? raw.away_score),
    result: low(raw.RESULT ?? raw.result),
    reason: norm(raw.REASON ?? raw.reason),
  };
}

function group(decided, keyFn, minN = 1) {
  const m = new Map();
  for (const b of decided) {
    const k = keyFn(b);
    if (k == null || k === "") continue;
    if (!m.has(k)) m.set(k, { key: k, n: 0, loss: 0 });
    const o = m.get(k);
    o.n += 1;
    if (b.result === "loss") o.loss += 1;
  }
  return [...m.values()]
    .filter((o) => o.n >= minN)
    .map((o) => ({ ...o, lossRate: pct(o.loss, o.n) }));
}

/**
 * Analyze settled bets for loss patterns.
 * @param {Array} rawBets - rows from Sheet1 / fetchSheetData
 * @returns {Object} structured analysis for the Loss Patterns tab
 */
export function analyzeLossPatterns(rawBets) {
  const data = (rawBets || []).map(normalizeBet);
  const decided = data.filter((b) => b.result === "win" || b.result === "loss");
  const losses = decided.filter((b) => b.result === "loss");
  const wins = decided.filter((b) => b.result === "win");

  const overall = {
    total: data.length,
    decided: decided.length,
    wins: wins.length,
    losses: losses.length,
    blank: data.length - decided.length,
    winRate: pct(wins.length, decided.length),
    lossRate: pct(losses.length, decided.length),
  };

  const oddsOrder = [
    "<1.40",
    "1.40–1.69",
    "1.70–1.99",
    "2.00–2.49",
    "2.50–3.49",
    "3.50–4.99",
    "5.00+",
  ];
  const byOdds = group(decided, (b) => oddsBucket(teamOdds(b))).sort(
    (a, b) => oddsOrder.indexOf(a.key) - oddsOrder.indexOf(b.key)
  );

  const byType = group(decided, (b) => b.betType || "Unknown").sort(
    (a, b) => b.loss - a.loss
  );

  const bySelection = group(decided, (b) => b.betSel || "Unknown")
    .sort((a, b) => b.loss - a.loss)
    .slice(0, 12);

  const byHomeAway = group(decided, (b) => {
    if (!b.team) return null;
    if (low(b.team) === low(b.home)) return "Backed HOME";
    if (low(b.team) === low(b.away)) return "Backed AWAY";
    return "Other";
  });

  const byCountryRate = group(decided, (b) => b.country, 30)
    .sort((a, b) => b.lossRate - a.lossRate)
    .slice(0, 12);

  const byLeagueRate = group(
    decided,
    (b) => `${b.country} — ${b.league}`,
    25
  )
    .sort((a, b) => b.lossRate - a.lossRate)
    .slice(0, 15);

  const byTeamRate = group(decided, (b) => b.team, 8)
    .sort((a, b) => b.lossRate - a.lossRate || b.loss - a.loss)
    .slice(0, 20);

  // Team × bet type (SW loss ≠ DC loss on the same club)
  const byTeamByType = group(
    decided,
    (b) => {
      if (!b.team) return null;
      return `${b.team}\0${categorizeBetType(b.betType)}`;
    },
    5
  )
    .map((o) => {
      const [team, betType] = o.key.split("\0");
      return { ...o, team, betType, key: `${team} (${betType})` };
    })
    .sort((a, b) => b.lossRate - a.lossRate || b.loss - a.loss)
    .slice(0, 30);

  const byTeamVol = group(decided, (b) => b.team)
    .sort((a, b) => b.loss - a.loss)
    .slice(0, 15);

  const lossScored = losses.filter((b) => b.hs != null && b.as != null);
  let margin1 = 0;
  let drawWhenNeeded = 0;
  let totalGoalsSum = 0;
  const scoreMap = new Map();
  for (const b of lossScored) {
    const tot = b.hs + b.as;
    totalGoalsSum += tot;
    const key = `${b.hs}-${b.as}`;
    scoreMap.set(key, (scoreMap.get(key) || 0) + 1);
    if (Math.abs(b.hs - b.as) === 1) margin1 += 1;
    if (b.hs === b.as) drawWhenNeeded += 1;
  }
  const topScores = [...scoreMap.entries()]
    .map(([key, n]) => ({ key, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 10);

  const mOrder = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const byMonth = group(decided, (b) => {
    const m = (b.date.split("-")[1] || "").slice(0, 3);
    return mOrder.includes(m) ? m : null;
  }).sort((a, b) => mOrder.indexOf(a.key) - mOrder.indexOf(b.key));

  const takeaways = [
    "Stay under ~1.70 on the backed team — loss rate roughly doubles above it.",
    "Prefer double chance / over-under over straight wins when the edge is thin.",
    "Treat draws as the main threat: in tight games, take the double chance.",
    "Be careful in trap leagues/countries and with high loss-rate teams.",
    "Tighten selection in weaker months (often Nov and spring run-in).",
  ];

  return {
    overall,
    byOdds,
    byType,
    bySelection,
    byHomeAway,
    byCountryRate,
    byLeagueRate,
    byTeamRate,
    byTeamByType,
    byTeamVol,
    lossScoreStats: {
      scored: lossScored.length,
      lostByOneGoal: margin1,
      lostByOneGoalPct: pct(margin1, lossScored.length),
      drawResults: drawWhenNeeded,
      drawPct: pct(drawWhenNeeded, lossScored.length),
      avgTotalGoals: +(totalGoalsSum / (lossScored.length || 1)).toFixed(2),
      topScores,
    },
    byMonth,
    takeaways,
    analyzedAt: new Date().toISOString(),
  };
}
