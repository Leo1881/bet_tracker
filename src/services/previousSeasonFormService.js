/**
 * Previous-season match form from Sheet1 history.
 * Used when Sheet3 LAST_5_* form is empty (early season).
 *
 * Season = Aug 1 → Jul 31 (European football calendar).
 */

const MONTH_MAP = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const norm = (s) => String(s ?? "").trim();
const low = (s) => norm(s).toLowerCase();

/** Normalize team name for matching (lowercase, drop trailing FC/CF). */
export function normalizeTeamName(name) {
  return low(name)
    .replace(/\s+fc\.?\s*$/i, "")
    .replace(/\s+cf\.?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function teamsMatch(a, b) {
  const na = normalizeTeamName(a);
  const nb = normalizeTeamName(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/**
 * Parse a bet into a Date. Prefers BET_ID year when DATE is DD-MMM.
 * @returns {Date|null}
 */
export function parseBetDate(bet) {
  const dateStr = norm(bet?.DATE ?? bet?.date);
  const betId = norm(bet?.BET_ID ?? bet?.bet_id);

  if (!dateStr && !betId) return null;

  // ISO / YYYY-MM-DD
  if (dateStr.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // BET_ID like "2026/05/01 - 534"
  const idMatch = betId.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (idMatch) {
    const d = new Date(
      Number(idMatch[1]),
      Number(idMatch[2]) - 1,
      Number(idMatch[3]),
      12
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // DD-MMM (e.g. 06-Jul)
  const m = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})$/);
  if (m) {
    const day = Number(m[1]);
    const month = MONTH_MAP[m[2]];
    if (month == null) return null;
    // Prefer year from BET_ID if present elsewhere in the string
    const yearFromId = betId.match(/(20\d{2})/);
    const year = yearFromId
      ? Number(yearFromId[1])
      : inferYearForMonthDay(month, day);
    const d = new Date(year, month, day, 12);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const fallback = new Date(dateStr);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/** Infer calendar year for a month/day using football-season context around "today". */
function inferYearForMonthDay(monthIndex, day) {
  const now = new Date();
  const y = now.getFullYear();
  // Build candidate in current and previous year; pick closest past-or-near date
  const candidates = [y, y - 1, y + 1].map(
    (yr) => new Date(yr, monthIndex, day, 12)
  );
  candidates.sort(
    (a, b) => Math.abs(a - now) - Math.abs(b - now)
  );
  return candidates[0].getFullYear();
}

/** Season start year for a date (Aug–Jul). Aug 2025 → 2025; Mar 2026 → 2025. */
export function getSeasonStartYear(date) {
  if (!date || Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-based
  return m >= 7 ? y : y - 1;
}

/** Inclusive previous-season window for a fixture date. */
export function getPreviousSeasonRange(fixtureDate) {
  const currentStart = getSeasonStartYear(fixtureDate);
  if (currentStart == null) return null;
  const prevStart = currentStart - 1;
  return {
    start: new Date(prevStart, 7, 1, 0, 0, 0), // Aug 1
    end: new Date(currentStart, 6, 31, 23, 59, 59), // Jul 31
    seasonLabel: `${prevStart}/${String(currentStart).slice(2)}`,
  };
}

function hasSheetForm(bet, side) {
  if (side === "home") {
    const seq =
      bet.LAST_5_RESULT_HOME ||
      bet.LAST_4_RESULT_HOME ||
      bet.LAST_3_RESULT_HOME ||
      bet.LAST_2_RESULT_HOME ||
      bet.LAST_1_RESULT_HOME;
    if (seq) return true;
    const w = parseInt(bet.LAST_5_WINS_HOME, 10) || 0;
    const d = parseInt(bet.LAST_5_DRAWS_HOME, 10) || 0;
    const l = parseInt(bet.LAST_5_LOSSES_HOME, 10) || 0;
    return w + d + l > 0;
  }
  const seq =
    bet.LAST_5_RESULT_AWAY ||
    bet.LAST_4_RESULT_AWAY ||
    bet.LAST_3_RESULT_AWAY ||
    bet.LAST_2_RESULT_AWAY ||
    bet.LAST_1_RESULT_AWAY;
  if (seq) return true;
  const w = parseInt(bet.LAST_5_WINS_AWAY, 10) || 0;
  const d = parseInt(bet.LAST_5_DRAWS_AWAY, 10) || 0;
  const l = parseInt(bet.LAST_5_LOSSES_AWAY, 10) || 0;
  return w + d + l > 0;
}

export function betHasAnyForm(bet) {
  return hasSheetForm(bet, "home") || hasSheetForm(bet, "away");
}

/**
 * Build unique finished games (with scores) from historical Sheet1 bets.
 */
export function buildUniqueGames(historyBets) {
  const map = new Map();
  for (const bet of historyBets || []) {
    const homeTeam = norm(bet.HOME_TEAM);
    const awayTeam = norm(bet.AWAY_TEAM);
    const country = norm(bet.COUNTRY);
    const league = norm(bet.LEAGUE);
    const hs = parseInt(bet.HOME_SCORE, 10);
    const as = parseInt(bet.AWAY_SCORE, 10);
    if (!homeTeam || !awayTeam || Number.isNaN(hs) || Number.isNaN(as)) continue;
    const date = parseBetDate(bet);
    if (!date) continue;
    const key = `${date.toISOString().slice(0, 10)}_${low(homeTeam)}_${low(awayTeam)}_${low(country)}_${low(league)}`;
    if (map.has(key)) continue;
    map.set(key, {
      homeTeam,
      awayTeam,
      country,
      league,
      homeScore: hs,
      awayScore: as,
      date,
    });
  }
  return [...map.values()];
}

/**
 * Last N match results for a team within a date range.
 * Prefer same country when available.
 */
export function getTeamResultsInRange(games, teamName, country, range, limit = 5) {
  if (!range || !teamName) return [];
  const countryLow = low(country);

  const played = games
    .filter((g) => {
      if (g.date < range.start || g.date > range.end) return false;
      return teamsMatch(g.homeTeam, teamName) || teamsMatch(g.awayTeam, teamName);
    })
    .map((g) => {
      const isHome = teamsMatch(g.homeTeam, teamName);
      let result = "D";
      if (g.homeScore > g.awayScore) result = isHome ? "W" : "L";
      else if (g.awayScore > g.homeScore) result = isHome ? "L" : "W";
      const sameCountry = countryLow && low(g.country) === countryLow;
      return { ...g, result, sameCountry };
    });

  // Prefer same-country matches, but fall back to all
  const sameCountry = played.filter((g) => g.sameCountry);
  const pool = sameCountry.length >= Math.min(3, limit) ? sameCountry : played;

  pool.sort((a, b) => b.date - a.date);
  return pool.slice(0, limit);
}

function resultsToFormFields(results, side) {
  // results are newest-first; sheet sequence LAST_5 = oldest of the 5, LAST_1 = most recent
  const newestFirst = results.map((r) => r.result);
  const oldestFirst = [...newestFirst].reverse();
  const wins = newestFirst.filter((r) => r === "W").length;
  const draws = newestFirst.filter((r) => r === "D").length;
  const losses = newestFirst.filter((r) => r === "L").length;

  // Pad to 5 slots from the left (oldest) with empty if fewer than 5
  const padded = [...oldestFirst];
  while (padded.length < 5) padded.unshift("");

  if (side === "home") {
    return {
      LAST_5_RESULT_HOME: padded[0] || "",
      LAST_4_RESULT_HOME: padded[1] || "",
      LAST_3_RESULT_HOME: padded[2] || "",
      LAST_2_RESULT_HOME: padded[3] || "",
      LAST_1_RESULT_HOME: padded[4] || "",
      LAST_5_WINS_HOME: String(wins),
      LAST_5_DRAWS_HOME: String(draws),
      LAST_5_LOSSES_HOME: String(losses),
    };
  }
  return {
    LAST_5_RESULT_AWAY: padded[0] || "",
    LAST_4_RESULT_AWAY: padded[1] || "",
    LAST_3_RESULT_AWAY: padded[2] || "",
    LAST_2_RESULT_AWAY: padded[3] || "",
    LAST_1_RESULT_AWAY: padded[4] || "",
    LAST_5_WINS_AWAY: String(wins),
    LAST_5_DRAWS_AWAY: String(draws),
    LAST_5_LOSSES_AWAY: String(losses),
  };
}

/**
 * Enrich a single analysis/new-bet row with previous-season form when Sheet3 form is missing.
 * @returns {{ bet: Object, filled: boolean, seasonLabel: string|null }}
 */
export function enrichBetWithPreviousSeasonForm(bet, uniqueGames) {
  const needHome = !hasSheetForm(bet, "home");
  const needAway = !hasSheetForm(bet, "away");
  if (!needHome && !needAway) {
    return { bet, filled: false, seasonLabel: null };
  }

  const fixtureDate = parseBetDate(bet) || new Date();
  const range = getPreviousSeasonRange(fixtureDate);
  if (!range) return { bet, filled: false, seasonLabel: null };

  let patch = {};
  let filled = false;

  if (needHome) {
    const homeResults = getTeamResultsInRange(
      uniqueGames,
      bet.HOME_TEAM,
      bet.COUNTRY,
      range,
      5
    );
    if (homeResults.length > 0) {
      patch = { ...patch, ...resultsToFormFields(homeResults, "home") };
      filled = true;
    }
  }

  if (needAway) {
    const awayResults = getTeamResultsInRange(
      uniqueGames,
      bet.AWAY_TEAM,
      bet.COUNTRY,
      range,
      5
    );
    if (awayResults.length > 0) {
      patch = { ...patch, ...resultsToFormFields(awayResults, "away") };
      filled = true;
    }
  }

  if (!filled) return { bet, filled: false, seasonLabel: null };

  return {
    bet: {
      ...bet,
      ...patch,
      formSource: "previous_season",
      formSeasonLabel: range.seasonLabel,
    },
    filled: true,
    seasonLabel: range.seasonLabel,
  };
}

/**
 * Enrich all analysis results that lack form, using previous-season Sheet1 games.
 */
export function enrichAnalysisWithPreviousSeasonForm(analysisResults, historyBets) {
  if (!analysisResults?.length) return { results: analysisResults || [], filledCount: 0 };
  const uniqueGames = buildUniqueGames(historyBets);
  let filledCount = 0;
  const results = analysisResults.map((bet) => {
    if (betHasAnyForm(bet) && hasSheetForm(bet, "home") && hasSheetForm(bet, "away")) {
      return bet;
    }
    // Still try if either side missing
    const { bet: enriched, filled } = enrichBetWithPreviousSeasonForm(bet, uniqueGames);
    if (filled) filledCount += 1;
    return enriched;
  });
  return { results, filledCount, seasonGames: uniqueGames.length };
}
