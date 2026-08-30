/**
 * Dynamic avoid / blacklist list from settled Sheet1 history.
 *
 * Uses UNIQUE MATCHES (home|away|league), not ticket legs — so the same
 * game on 10 betslips counts once.
 *
 * Qualify (unique matches):
 * - ≥3 matches & ≥40% loss, or
 * - ≥5 matches & ≥30% loss, or
 * - ≥8 matches & ≥25% loss
 * A match counts as a win if any settled leg on that match won.
 */

const norm = (s) => String(s ?? "").trim();
const low = (s) => norm(s).toLowerCase();
const rate = (loss, n) => (n ? +(100 * (loss / n)).toFixed(1) : 0);
const junk = /^(over|under)\s*[\d.]+$/i;

/** @param {number} uniqueN @param {number} uniqueLossRate */
export function qualifiesAvoidTeam(uniqueN, uniqueLossRate) {
  return (
    (uniqueN >= 3 && uniqueLossRate >= 40) ||
    (uniqueN >= 5 && uniqueLossRate >= 30) ||
    (uniqueN >= 8 && uniqueLossRate >= 25)
  );
}

/**
 * @param {Array} rawBets - Sheet1 rows (DATE, TEAM_INCLUDED, RESULT, …)
 * @returns {Array<{
 *   COUNTRY: string,
 *   LEAGUE: string,
 *   TEAM_NAME: string,
 *   lossRate: number,
 *   wins: number,
 *   losses: number,
 *   settled: number,
 *   uniqueMatches: number,
 *   uniqueLossRate: number,
 *   legWins: number,
 *   legLosses: number,
 *   source: 'dynamic'
 * }>}
 */
export function buildDynamicAvoidList(rawBets) {
  const byTeam = new Map();

  for (const raw of rawBets || []) {
    const result = low(raw.RESULT ?? raw.result);
    if (result !== "win" && result !== "loss") continue;

    const team = norm(raw.TEAM_INCLUDED ?? raw.team_included);
    if (!team || junk.test(team)) continue;

    const country = norm(raw.COUNTRY ?? raw.country);
    const league = norm(raw.LEAGUE ?? raw.league);
    if (!country || !league) continue;

    const home = norm(raw.HOME_TEAM ?? raw.home_team);
    const away = norm(raw.AWAY_TEAM ?? raw.away_team);
    const matchKey = `${low(home)}|${low(away)}|${low(league)}`;

    if (!byTeam.has(team)) {
      byTeam.set(team, {
        team,
        legWins: 0,
        legLosses: 0,
        // matchKey → { won: boolean, country, league }
        matches: new Map(),
      });
    }
    const t = byTeam.get(team);
    if (result === "loss") t.legLosses += 1;
    else t.legWins += 1;

    if (!t.matches.has(matchKey)) {
      t.matches.set(matchKey, {
        won: result === "win",
        country,
        league,
      });
    } else if (result === "win") {
      // Any win on this match → count the match as a win
      t.matches.get(matchKey).won = true;
    }
  }

  const rows = [];
  for (const t of byTeam.values()) {
    let uniqueWins = 0;
    let uniqueLosses = 0;
    const ctxCounts = new Map();

    for (const m of t.matches.values()) {
      if (m.won) uniqueWins += 1;
      else uniqueLosses += 1;
      const ck = `${m.country}\0${m.league}`;
      if (!ctxCounts.has(ck)) {
        ctxCounts.set(ck, { country: m.country, league: m.league, n: 0 });
      }
      ctxCounts.get(ck).n += 1;
    }

    const uniqueN = uniqueWins + uniqueLosses;
    const uniqueLossRate = rate(uniqueLosses, uniqueN);
    if (!qualifiesAvoidTeam(uniqueN, uniqueLossRate)) continue;
    if (uniqueLosses < 1) continue;

    let bestCtx = null;
    for (const c of ctxCounts.values()) {
      if (!bestCtx || c.n > bestCtx.n) bestCtx = c;
    }
    if (!bestCtx) continue;

    rows.push({
      COUNTRY: bestCtx.country,
      LEAGUE: bestCtx.league,
      TEAM_NAME: t.team,
      // Primary stats = unique matches (what the list is ranked on)
      lossRate: uniqueLossRate,
      wins: uniqueWins,
      losses: uniqueLosses,
      settled: uniqueN,
      uniqueMatches: uniqueN,
      uniqueLossRate,
      legWins: t.legWins,
      legLosses: t.legLosses,
      source: "dynamic",
    });
  }

  rows.sort(
    (a, b) =>
      b.uniqueLossRate - a.uniqueLossRate ||
      b.losses - a.losses ||
      a.TEAM_NAME.localeCompare(b.TEAM_NAME),
  );
  return rows;
}

/**
 * Merge manual Sheet2 blacklist with dynamic avoid list for recommendation checks.
 * Dynamic entries use TEAM_NAME (and aliases via isTeamNameBlacklisted).
 * @param {Array} manualBlacklist - Sheet2 rows
 * @param {Array} dynamicAvoid - from buildDynamicAvoidList
 */
export function mergeAvoidLists(manualBlacklist, dynamicAvoid) {
  const out = [];
  const seen = new Set();

  for (const entry of manualBlacklist || []) {
    const name = norm(
      typeof entry === "string"
        ? entry
        : entry?.TEAM_NAME || entry?.team_name || "",
    );
    if (!name) continue;
    const key = low(name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...entry,
      TEAM_NAME: name,
      COUNTRY: entry?.COUNTRY ?? entry?.country ?? "",
      LEAGUE: entry?.LEAGUE ?? entry?.league ?? "",
      source: entry?.source || "manual",
    });
  }

  for (const entry of dynamicAvoid || []) {
    const name = norm(entry.TEAM_NAME);
    if (!name) continue;
    const key = low(name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }

  return out;
}
