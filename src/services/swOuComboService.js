/**
 * Teams strong on a primary market (SW or DC) AND Over/Under —
 * combo candidates from Sheet1 unique-match history.
 *
 * Same fixture on many slips = once. Match wins if any settled leg won.
 */

const DEFAULT_LIMIT = 35;

const calculateWilsonScore = (wins, total) => {
  if (!total || total <= 0) return 0;
  const z = 1.96;
  const p = wins / total;
  const denom = 1 + (z * z) / total;
  const centre = p + (z * z) / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return (centre - margin) / denom;
};

const isJunkTeam = (t) => {
  const s = String(t || "")
    .trim()
    .toLowerCase();
  return (
    !s ||
    /^(over|under)\s*[\d.]*$/.test(s) ||
    s === "draw" ||
    s === "yes" ||
    s === "no" ||
    /^\d/.test(s)
  );
};

/** @returns {"SW"|"DC"|"OU"|null} */
const marketOf = (betType) => {
  const t = String(betType || "").toLowerCase();
  if (t.includes("double chance")) return "DC";
  if (t.includes("over") || t.includes("under")) return "OU";
  if (t.includes("win") || !t) return "SW";
  return null;
};

const ouSide = (bet) => {
  const blob =
    `${bet.BET_TYPE || ""} ${bet.BET_SELECTION || ""} ${bet.TEAM_INCLUDED || ""}`.toLowerCase();
  if (blob.includes("over")) return "Over";
  if (blob.includes("under")) return "Under";
  return "OU";
};

const matchKeyOf = (bet) => {
  const date = String(bet.DATE || "")
    .trim()
    .toLowerCase();
  const home = String(bet.HOME_TEAM || "")
    .trim()
    .toLowerCase();
  const away = String(bet.AWAY_TEAM || "")
    .trim()
    .toLowerCase();
  const country = String(bet.COUNTRY || "")
    .trim()
    .toLowerCase();
  const league = String(bet.LEAGUE || "")
    .trim()
    .toLowerCase();
  return `${date}|${home}|${away}|${country}|${league}`;
};

const recordMatch = (map, matchKey, won) => {
  if (!map.has(matchKey)) {
    map.set(matchKey, won);
    return;
  }
  if (won) map.set(matchKey, true);
};

const tallyMatches = (map) => {
  let wins = 0;
  let total = 0;
  for (const won of map.values()) {
    total += 1;
    if (won) wins += 1;
  }
  return { wins, total };
};

const pickBestOu = (ou, over, under) => {
  let bestOuLabel = "Over/Under";
  let bestOuWins = ou.wins;
  let bestOuTotal = ou.total;
  let bestOuWilson = calculateWilsonScore(ou.wins, ou.total);

  if (over.total >= 5 && under.total >= 5) {
    const overW = calculateWilsonScore(over.wins, over.total);
    const underW = calculateWilsonScore(under.wins, under.total);
    if (overW >= underW) {
      bestOuLabel = "Over";
      bestOuWins = over.wins;
      bestOuTotal = over.total;
      bestOuWilson = overW;
    } else {
      bestOuLabel = "Under";
      bestOuWins = under.wins;
      bestOuTotal = under.total;
      bestOuWilson = underW;
    }
  } else if (over.total >= 5) {
    bestOuLabel = "Over";
    bestOuWins = over.wins;
    bestOuTotal = over.total;
    bestOuWilson = calculateWilsonScore(over.wins, over.total);
  } else if (under.total >= 5) {
    bestOuLabel = "Under";
    bestOuWins = under.wins;
    bestOuTotal = under.total;
    bestOuWilson = calculateWilsonScore(under.wins, under.total);
  }

  return { bestOuLabel, bestOuWins, bestOuTotal, bestOuWilson };
};

/**
 * @param {Array} bets
 * @param {"SW"|"DC"} primaryMarket
 * @param {{
 *   minPrimary?: number,
 *   minOu?: number,
 *   minRate?: number,
 *   limit?: number,
 * }} [opts]
 */
export function buildMarketOuComboList(
  bets,
  primaryMarket,
  {
    minPrimary = 6,
    minOu = 6,
    minRate = 0.65,
    limit = DEFAULT_LIMIT,
  } = {},
) {
  if (primaryMarket !== "SW" && primaryMarket !== "DC") {
    return [];
  }

  /** @type {Map<string, object>} */
  const stats = new Map();

  for (const bet of bets || []) {
    const result = String(bet.RESULT || "").toLowerCase();
    if (!result.includes("win") && !result.includes("loss")) continue;
    const won = result.includes("win");
    const market = marketOf(bet.BET_TYPE);
    if (!market) continue;
    if (market !== primaryMarket && market !== "OU") continue;

    const team = String(bet.TEAM_INCLUDED || "").trim();
    if (isJunkTeam(team)) continue;

    const country = String(bet.COUNTRY || "").trim();
    const league = String(bet.LEAGUE || "").trim();
    if (!country || !league) continue;

    const teamKey = `${team.toLowerCase()}||${country.toLowerCase()}||${league.toLowerCase()}`;
    if (!stats.has(teamKey)) {
      stats.set(teamKey, {
        teamName: team,
        country,
        league,
        primaryMatches: new Map(),
        ouMatches: new Map(),
        overMatches: new Map(),
        underMatches: new Map(),
      });
    }
    const s = stats.get(teamKey);
    const matchKey = matchKeyOf(bet);

    if (market === primaryMarket) {
      recordMatch(s.primaryMatches, matchKey, won);
    } else {
      recordMatch(s.ouMatches, matchKey, won);
      const side = ouSide(bet);
      if (side === "Over") recordMatch(s.overMatches, matchKey, won);
      else if (side === "Under") recordMatch(s.underMatches, matchKey, won);
    }
  }

  const rows = [];
  for (const s of stats.values()) {
    const primary = tallyMatches(s.primaryMatches);
    const ou = tallyMatches(s.ouMatches);
    if (primary.total < minPrimary || ou.total < minOu) continue;

    const primaryRate = primary.total > 0 ? primary.wins / primary.total : 0;
    const ouRate = ou.total > 0 ? ou.wins / ou.total : 0;
    if (primaryRate < minRate || ouRate < minRate) continue;

    const primaryWilson = calculateWilsonScore(primary.wins, primary.total);
    const over = tallyMatches(s.overMatches);
    const under = tallyMatches(s.underMatches);
    const {
      bestOuLabel,
      bestOuWins,
      bestOuTotal,
      bestOuWilson,
    } = pickBestOu(ou, over, under);

    const harmonic =
      primaryWilson + bestOuWilson > 0
        ? (2 * primaryWilson * bestOuWilson) / (primaryWilson + bestOuWilson)
        : 0;
    const score =
      harmonic * 100 + Math.log10(primary.total + ou.total) * 3;

    rows.push({
      teamName: s.teamName,
      country: s.country,
      league: s.league,
      primaryMarket,
      primaryWins: primary.wins,
      primaryLosses: primary.total - primary.wins,
      primaryTotal: primary.total,
      primaryRate: primaryRate * 100,
      primaryWilson: primaryWilson * 100,
      // Back-compat aliases used by SW tab
      swWins: primary.wins,
      swLosses: primary.total - primary.wins,
      swTotal: primary.total,
      swRate: primaryRate * 100,
      swWilson: primaryWilson * 100,
      ouWins: ou.wins,
      ouLosses: ou.total - ou.wins,
      ouTotal: ou.total,
      ouRate: ouRate * 100,
      bestOuLabel,
      bestOuWins,
      bestOuLosses: bestOuTotal - bestOuWins,
      bestOuTotal,
      bestOuRate: bestOuTotal > 0 ? (bestOuWins / bestOuTotal) * 100 : 0,
      bestOuWilson: bestOuWilson * 100,
      comboScore: score,
    });
  }

  rows.sort((a, b) => b.comboScore - a.comboScore);
  return limit > 0 ? rows.slice(0, limit) : rows;
}

/** @deprecated Prefer buildMarketOuComboList(bets, "SW", opts) */
export function buildSwOuComboList(bets, opts = {}) {
  return buildMarketOuComboList(bets, "SW", {
    minPrimary: opts.minSw ?? opts.minPrimary,
    minOu: opts.minOu,
    minRate: opts.minRate,
    limit: opts.limit,
  });
}

export function buildDcOuComboList(bets, opts = {}) {
  return buildMarketOuComboList(bets, "DC", {
    minPrimary: opts.minDc ?? opts.minPrimary,
    minOu: opts.minOu,
    minRate: opts.minRate,
    limit: opts.limit,
  });
}
