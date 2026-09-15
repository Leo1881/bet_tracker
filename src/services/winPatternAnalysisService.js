/**
 * Win-pattern analysis over settled Sheet1 bets.
 * Same slices as loss patterns, ranked by win rate + lift vs baseline.
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

function categorizeBetType(betType) {
  const t = low(betType);
  if (t.includes("double chance")) return "Double Chance";
  if (t.includes("over") || t.includes("under")) return "Over/Under";
  if (t.includes("win") || !t) return "Straight Win";
  return norm(betType) || "Other";
}

function venueSide(b) {
  if (!b.team) return null;
  if (low(b.team) === low(b.home)) return "Home";
  if (low(b.team) === low(b.away)) return "Away";
  return null;
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
  };
}

function group(decided, keyFn, minN = 1) {
  const m = new Map();
  for (const b of decided) {
    const k = keyFn(b);
    if (k == null || k === "") continue;
    if (!m.has(k)) m.set(k, { key: k, n: 0, wins: 0, loss: 0 });
    const o = m.get(k);
    o.n += 1;
    if (b.result === "win") o.wins += 1;
    else if (b.result === "loss") o.loss += 1;
  }
  return [...m.values()]
    .filter((o) => o.n >= minN)
    .map((o) => ({
      ...o,
      winRate: pct(o.wins, o.n),
      lossRate: pct(o.loss, o.n),
    }));
}

function withLift(rows, baselineWinRate) {
  return rows.map((o) => ({
    ...o,
    lift: +(o.winRate - baselineWinRate).toFixed(1),
  }));
}

const ODDS_ORDER = [
  "<1.40",
  "1.40–1.69",
  "1.70–1.99",
  "2.00–2.49",
  "2.50–3.49",
  "3.50–4.99",
  "5.00+",
];

/**
 * Analyze settled bets for win / success patterns.
 * @param {Array} rawBets
 */
export function analyzeWinPatterns(rawBets) {
  const data = (rawBets || []).map(normalizeBet);
  const decided = data.filter((b) => b.result === "win" || b.result === "loss");
  const wins = decided.filter((b) => b.result === "win");
  const losses = decided.filter((b) => b.result === "loss");

  const overall = {
    total: data.length,
    decided: decided.length,
    wins: wins.length,
    losses: losses.length,
    blank: data.length - decided.length,
    winRate: pct(wins.length, decided.length),
    lossRate: pct(losses.length, decided.length),
  };
  const baseline = overall.winRate;

  const byOdds = withLift(
    group(decided, (b) => oddsBucket(teamOdds(b))).sort(
      (a, b) => ODDS_ORDER.indexOf(a.key) - ODDS_ORDER.indexOf(b.key),
    ),
    baseline,
  );

  const byType = withLift(
    group(decided, (b) => categorizeBetType(b.betType)).sort(
      (a, b) => b.winRate - a.winRate || b.n - a.n,
    ),
    baseline,
  );

  const byHomeAway = withLift(
    group(decided, (b) => {
      const v = venueSide(b);
      if (v === "Home") return "Backed HOME";
      if (v === "Away") return "Backed AWAY";
      return "Other";
    }),
    baseline,
  );

  const bySelection = withLift(
    group(decided, (b) => b.betSel || "Unknown", 20)
      .sort((a, b) => b.winRate - a.winRate || b.n - a.n)
      .slice(0, 12),
    baseline,
  );

  const byCountryRate = withLift(
    group(decided, (b) => b.country, 30)
      .sort((a, b) => b.winRate - a.winRate || b.n - a.n)
      .slice(0, 12),
    baseline,
  );

  const byLeagueRate = withLift(
    group(decided, (b) => `${b.country} — ${b.league}`, 25)
      .sort((a, b) => b.winRate - a.winRate || b.n - a.n)
      .slice(0, 15),
    baseline,
  );

  const byTeamByType = withLift(
    group(
      decided,
      (b) => {
        if (!b.team) return null;
        return `${b.team}\0${categorizeBetType(b.betType)}`;
      },
      8,
    )
      .map((o) => {
        const [team, betType] = o.key.split("\0");
        return { ...o, team, betType, key: `${team} (${betType})` };
      })
      .sort((a, b) => b.winRate - a.winRate || b.n - a.n)
      .slice(0, 25),
    baseline,
  );

  // Winning recipes: venue × odds × market (need volume)
  const recipes = withLift(
    group(
      decided,
      (b) => {
        const venue = venueSide(b);
        const odds = oddsBucket(teamOdds(b));
        const market = categorizeBetType(b.betType);
        if (!venue || !odds) return null;
        return `${venue} · ${market} · ${odds}`;
      },
      40,
    )
      .filter((o) => o.winRate >= baseline)
      .sort((a, b) => b.lift - a.lift || b.winRate - a.winRate || b.n - a.n)
      .slice(0, 20),
    baseline,
  );

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
  const byMonth = withLift(
    group(decided, (b) => {
      const m = (b.date.split("-")[1] || "").slice(0, 3);
      return mOrder.includes(m) ? m : null;
    }).sort((a, b) => mOrder.indexOf(a.key) - mOrder.indexOf(b.key)),
    baseline,
  );

  const bestOdds = [...byOdds].sort((a, b) => b.winRate - a.winRate)[0];
  const bestVenue = [...byHomeAway]
    .filter((r) => r.key !== "Other")
    .sort((a, b) => b.winRate - a.winRate)[0];
  const bestType = byType[0];
  const topRecipe = recipes[0];

  const takeaways = [
    bestVenue
      ? `${bestVenue.key} hits ${bestVenue.winRate}% (lift ${bestVenue.lift >= 0 ? "+" : ""}${bestVenue.lift} vs overall ${baseline}%).`
      : "Check home vs away split once you have venue-tagged legs.",
    bestOdds
      ? `Best odds band: ${bestOdds.key} at ${bestOdds.winRate}% win rate (n=${bestOdds.n.toLocaleString()}).`
      : "Odds bands need backed-team prices to rank cleanly.",
    bestType
      ? `Strongest market type: ${bestType.key} (${bestType.winRate}%, n=${bestType.n.toLocaleString()}).`
      : "Market-type mix is thin.",
    topRecipe
      ? `Top recipe: ${topRecipe.key} — ${topRecipe.winRate}% (lift ${topRecipe.lift >= 0 ? "+" : ""}${topRecipe.lift}, n=${topRecipe.n.toLocaleString()}).`
      : "Need more volume before combo recipes stabilize.",
    "Prefer segments with lift well above baseline and enough legs — not just raw win count.",
  ];

  return {
    overall,
    byOdds,
    byType,
    byHomeAway,
    bySelection,
    byCountryRate,
    byLeagueRate,
    byTeamByType,
    recipes,
    byMonth,
    takeaways,
    analyzedAt: new Date().toISOString(),
  };
}
