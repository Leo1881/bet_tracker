/**
 * Hard loss-pattern rules + odds-band stake policy for ranking markets.
 * Distilled from Sheet1 loss analysis (~23k settled legs).
 */

export const LOSS_ODDS_SOFT = 1.4;
export const LOSS_ODDS_HARD = 1.7;
export const LOSS_ODDS_VERY_HARD = 2.0;

/** Odds-band policy (point 3): short / mid / long price cutoffs. */
export const ODDS_BAND_SHORT = 1.4;
export const ODDS_BAND_LONG = 1.7;

/** Countries with elevated personal loss rate (n large enough to matter). */
export const TRAP_COUNTRIES = [
  "poland",
  "austria",
  "qatar",
  "ireland",
  "azerbaijan",
  "japan",
  "ukraine",
  "brazil",
];

/** Specific leagues with very high personal loss rate. */
export const TRAP_LEAGUES = [
  ["poland", "1 liga"],
  ["poland", "ekstraklasa"],
  ["austria", "bundesliga"],
  ["scotland", "championship"],
  ["ireland", "first division"],
  ["qatar", "stars league"],
  ["south africa", "mtn 8"],
  ["brazil", "brasiliero"],
  ["greece", "football league"],
];

const low = (s) => String(s ?? "").trim().toLowerCase();

export function isTrapCountry(country) {
  const c = low(country);
  return TRAP_COUNTRIES.some((x) => c.includes(x));
}

export function isTrapLeague(country, league) {
  const c = low(country);
  const l = low(league);
  return TRAP_LEAGUES.some(([cc, ll]) => c.includes(cc) && l.includes(ll));
}

/**
 * Odds on the team being backed for this market (home ODDS1 / away ODDS2).
 */
export function getBackedTeamOdds(bet, teamForBet, homeTeam, awayTeam) {
  if (!teamForBet) {
    const o1 = parseFloat(bet?.ODDS1);
    return Number.isFinite(o1) ? o1 : null;
  }
  const t = low(teamForBet);
  const h = low(homeTeam);
  const a = low(awayTeam);
  if (h && (t === h || t.includes(h) || h.includes(t))) {
    const o = parseFloat(bet?.ODDS1);
    return Number.isFinite(o) ? o : null;
  }
  if (a && (t === a || t.includes(a) || a.includes(t))) {
    const o = parseFloat(bet?.ODDS2);
    return Number.isFinite(o) ? o : null;
  }
  const o1 = parseFloat(bet?.ODDS1);
  return Number.isFinite(o1) ? o1 : null;
}

function isBackingAway(teamForBet, homeTeam, awayTeam) {
  if (!teamForBet) return false;
  const t = low(teamForBet);
  const h = low(homeTeam);
  const a = low(awayTeam);
  if (!a) return false;
  if (h && (t === h || t.includes(h) || h.includes(t))) return false;
  return t === a || t.includes(a) || a.includes(t);
}

/**
 * Adjust a market's ranking score using personal loss patterns.
 * @returns {{ adjustedScore: number, notes: string[] }}
 */
export function applyLossPatternScoreAdjustments({
  type,
  recommendation,
  adjustedScore,
  teamForBet,
  bet,
  homeTeam,
  awayTeam,
  country,
  league,
  isBlacklistedTeam = false,
}) {
  let score = adjustedScore;
  const notes = [];
  const betText = recommendation?.bet ?? "";
  if (betText === "AVOID" || betText === "No clear winner") {
    return { adjustedScore: score, notes };
  }

  const trapLeague = isTrapLeague(country, league);
  const trapCountry = !trapLeague && isTrapCountry(country);
  const awayBacked = isBackingAway(teamForBet, homeTeam, awayTeam);

  // Odds ceiling lives in applyOddsBandScoreAdjustments (stake policy).
  // Here: trap leagues / countries, away SW, blacklist.

  // 1) Trap leagues / countries — deprioritize aggressive markets
  if (trapLeague) {
    if (type === "Straight Win") {
      score *= 0.7;
      notes.push(
        `Trap league (${country} · ${league}): Straight Win deprioritized`
      );
    } else if (type === "Double Chance") {
      score *= 1.1;
      notes.push(
        `Trap league (${country} · ${league}): Double Chance preferred`
      );
    } else if (type === "Double Chance 12") {
      score *= 0.85;
      notes.push(
        `Trap league (${country} · ${league}): DC 12 reduced (draw risk)`
      );
    } else {
      score *= 0.92;
    }
  } else if (trapCountry) {
    if (type === "Straight Win") {
      score *= 0.82;
      notes.push(`Trap country (${country}): Straight Win deprioritized`);
    } else if (type === "Double Chance") {
      score *= 1.06;
    }
  }

  // 2) Away straight wins historically lose more for this user
  if (type === "Straight Win" && awayBacked) {
    score *= 0.9;
    notes.push("Away Straight Win cut: away backs lose more often for you");
  }

  // 3) Blacklisted team — keep markets but crush Straight Win ranking
  if (isBlacklistedTeam) {
    if (type === "Straight Win") {
      score *= 0.5;
      notes.push("Blacklisted team: Straight Win heavily deprioritized");
    } else if (type === "Double Chance") {
      score *= 0.95;
      notes.push("Blacklisted team: prefer caution / skip if unsure");
    }
  }

  return { adjustedScore: score, notes };
}

/**
 * True when form is strong enough to allow Straight Win in the 1.40–1.70 band.
 * Needs clear favorite form + high SW confidence.
 */
export function isOverwhelmingStraightWinCase({
  teamForBet,
  homeTeam,
  recentFormData,
  straightWinConfidence,
}) {
  if (!teamForBet || !recentFormData) return false;
  const conf = Number(straightWinConfidence) || 0;
  if (conf < 85) return false;

  const favoredWins =
    low(teamForBet) === low(homeTeam) ||
    low(homeTeam).includes(low(teamForBet)) ||
    low(teamForBet).includes(low(homeTeam))
      ? recentFormData.homeWins || 0
      : recentFormData.awayWins || 0;
  const opponentWins =
    low(teamForBet) === low(homeTeam) ||
    low(homeTeam).includes(low(teamForBet)) ||
    low(teamForBet).includes(low(homeTeam))
      ? recentFormData.awayWins || 0
      : recentFormData.homeWins || 0;

  // Very strong form: 4+ wins in last 5, opponent at most 1
  if (favoredWins >= 4 && opponentWins <= 1) return true;
  // Or 3+ wins vs 0, still high confidence
  if (favoredWins >= 3 && opponentWins === 0 && conf >= 90) return true;
  return false;
}

/**
 * Odds-band policy for stake ranking:
 * - < 1.40 → Straight Win allowed
 * - 1.40–1.70 → prefer Double Chance unless form is overwhelming
 * - ≥ 1.70 → Double Chance preferred; Straight Win crushed (skip if no safer market)
 */
export function applyOddsBandScoreAdjustments({
  type,
  recommendation,
  adjustedScore,
  teamForBet,
  bet,
  homeTeam,
  awayTeam,
  recentFormData,
}) {
  let score = adjustedScore;
  const notes = [];
  const betText = recommendation?.bet ?? "";
  if (betText === "AVOID" || betText === "No clear winner") {
    return { adjustedScore: score, notes };
  }

  const backedOdds = getBackedTeamOdds(bet, teamForBet, homeTeam, awayTeam);
  if (backedOdds == null) return { adjustedScore: score, notes };

  const swConf =
    recommendation?.confidence ?? recommendation?.wilsonWinRate ?? 0;
  const overwhelming = isOverwhelmingStraightWinCase({
    teamForBet,
    homeTeam,
    recentFormData,
    straightWinConfidence: swConf,
  });

  if (type === "Straight Win") {
    if (backedOdds >= ODDS_BAND_LONG) {
      score *= 0.35;
      notes.push(
        `Odds band: Straight Win not used as stake pick at ${backedOdds.toFixed(2)} (≥ ${ODDS_BAND_LONG}) — use Double Chance or skip`
      );
    } else if (backedOdds >= ODDS_BAND_SHORT) {
      if (!overwhelming) {
        score *= 0.55;
        notes.push(
          `Odds band: prefer Double Chance at ${backedOdds.toFixed(2)} (1.40–1.70) unless form is overwhelming`
        );
      } else {
        notes.push(
          `Odds band: Straight Win allowed at ${backedOdds.toFixed(2)} — overwhelming form`
        );
      }
    }
  } else if (type === "Double Chance") {
    if (backedOdds >= ODDS_BAND_LONG) {
      score *= 1.22;
      notes.push(
        `Odds band: Double Chance preferred at ${backedOdds.toFixed(2)} (≥ ${ODDS_BAND_LONG})`
      );
    } else if (backedOdds >= ODDS_BAND_SHORT) {
      score *= 1.12;
      notes.push(
        `Odds band: Double Chance preferred at ${backedOdds.toFixed(2)} (1.40–1.70)`
      );
    }
  }

  return { adjustedScore: score, notes };
}

/**
 * After scoring, force stake pick off Straight Win when odds band forbids it.
 * Prefers Double Chance; if none usable, returns a skip-style stake pick.
 */
export function enforceOddsBandStakePick({
  stakePick,
  rankedOptions,
  bet,
  homeTeam,
  awayTeam,
  recentFormData,
}) {
  if (!stakePick || stakePick.type !== "Straight Win") {
    return { stakePick, notes: [] };
  }
  const betText = stakePick.recommendation?.bet ?? "";
  if (betText === "AVOID" || betText === "No clear winner") {
    return { stakePick, notes: [] };
  }

  const backedOdds = getBackedTeamOdds(
    bet,
    stakePick.teamForBet,
    homeTeam,
    awayTeam
  );
  if (backedOdds == null) return { stakePick, notes: [] };

  const swConf =
    stakePick.recommendation?.confidence ??
    stakePick.recommendation?.wilsonWinRate ??
    0;
  const overwhelming = isOverwhelmingStraightWinCase({
    teamForBet: stakePick.teamForBet,
    homeTeam,
    recentFormData,
    straightWinConfidence: swConf,
  });

  const forbidSw =
    backedOdds >= ODDS_BAND_LONG ||
    (backedOdds >= ODDS_BAND_SHORT && !overwhelming);
  if (!forbidSw) return { stakePick, notes: [] };

  const dc = (rankedOptions || []).find(
    (o) =>
      o.type === "Double Chance" &&
      o.recommendation?.bet &&
      o.recommendation.bet !== "AVOID" &&
      o.recommendation.bet !== "No clear winner"
  );

  if (dc) {
    return {
      stakePick: dc,
      notes: [
        backedOdds >= ODDS_BAND_LONG
          ? `Odds band: switched stake pick to Double Chance (odds ${backedOdds.toFixed(2)} ≥ ${ODDS_BAND_LONG})`
          : `Odds band: switched stake pick to Double Chance (odds ${backedOdds.toFixed(2)} in 1.40–1.70, form not overwhelming)`,
      ],
    };
  }

  // No usable DC → skip rather than stake Straight Win at long/mid price
  return {
    stakePick: {
      ...stakePick,
      type: "Straight Win",
      riskLevel: "High",
      recommendation: {
        ...stakePick.recommendation,
        bet: "AVOID",
        reasoning:
          backedOdds >= ODDS_BAND_LONG
            ? `Odds band skip: Straight Win at ${backedOdds.toFixed(2)} (≥ ${ODDS_BAND_LONG}) with no safe Double Chance alternative`
            : `Odds band skip: Straight Win at ${backedOdds.toFixed(2)} (1.40–1.70) with no safe Double Chance alternative`,
      },
    },
    notes: [
      `Odds band: no stake pick — skip at odds ${backedOdds.toFixed(2)} (no Double Chance alternative)`,
    ],
  };
}
