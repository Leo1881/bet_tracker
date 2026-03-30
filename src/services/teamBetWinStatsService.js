/**
 * Your historical win rate for a team in a league (all bet types + breakdown).
 * Double chance & win types align with App.js getTeamBetTypePerformance.
 * Over/Under: one column per tracked line; Over and Under lists can differ.
 */

/** Lines you track for Over bets (Team record columns). */
export const TEAM_RECORD_OVER_LINES = [0.5, 1.5, 2.5];

/** Lines you track for Under bets (Team record columns). */
export const TEAM_RECORD_UNDER_LINES = [3.5, 4.5, 5.5];

const OU_LINE_TOLERANCE = 0.051;

function normalizeLineAgainstList(value, allowedLines) {
  if (value == null || Number.isNaN(value)) return null;
  for (const L of allowedLines) {
    if (Math.abs(value - L) < OU_LINE_TOLERANCE) return L;
  }
  return null;
}

/** @returns {"Over 1.5"|"Under 2.5"|null} */
export function ouLineColumnKey(side, line) {
  const allowed =
    side === "under" ? TEAM_RECORD_UNDER_LINES : TEAM_RECORD_OVER_LINES;
  const L = normalizeLineAgainstList(line, allowed);
  if (L == null) return null;
  const cap = side === "under" ? "Under" : "Over";
  return `${cap} ${formatLineForKey(L)}`;
}

function formatLineForKey(L) {
  if (Number.isInteger(L)) return `${L}`;
  return String(L);
}

/** Full column keys left-to-right for Team record table. */
export function getTeamRecordColumnKeys() {
  const keys = ["Straight Win", "Double Chance", "Double Chance 12"];
  for (const L of TEAM_RECORD_OVER_LINES) {
    keys.push(`Over ${formatLineForKey(L)}`);
  }
  for (const L of TEAM_RECORD_UNDER_LINES) {
    keys.push(`Under ${formatLineForKey(L)}`);
  }
  return keys;
}

export const TEAM_RECORD_COLUMNS = getTeamRecordColumnKeys();

/**
 * Parse side + line from type / selection / team (e.g. TEAM_INCLUDED "Over 1.5").
 * @returns {{ side: "over"|"under", line: number } | null}
 */
export function extractTotalsSideAndLine(bet) {
  const blob = `${bet.BET_TYPE || ""} ${bet.BET_SELECTION || ""} ${bet.TEAM_INCLUDED || ""}`;
  const lower = blob.toLowerCase();

  const m = lower.match(/\b(over|under)\s*(\d+(?:[.,]\d+)?)\b/);
  if (m) {
    return {
      side: m[1].toLowerCase(),
      line: parseFloat(m[2].replace(",", ".")),
    };
  }

  const compact = lower.replace(/\s+/g, "");
  const m2 = compact.match(/\b(o|u)(\d+(?:[.,]\d+)?)\b/);
  if (m2) {
    return {
      side: m2[1] === "u" ? "under" : "over",
      line: parseFloat(m2[2].replace(",", ".")),
    };
  }

  return null;
}

/** @returns {string|null} Type key for a column, or null if not shown in Team record breakdown */
export function classifyBetForTeamRecord(bet) {
  const bt = (bet.BET_TYPE || "").toLowerCase();
  const sel = (bet.BET_SELECTION || "").toLowerCase();

  if (bt.includes("double chance")) {
    const has12 = bt.includes("12") || sel.includes("12");
    if (has12) return "Double Chance 12";
    return "Double Chance";
  }

  const totals = extractTotalsSideAndLine(bet);
  if (totals) {
    const key = ouLineColumnKey(totals.side, totals.line);
    if (key) return key;
    return null;
  }

  const looksLikeTotals =
    bt.includes("over") ||
    bt.includes("under") ||
    sel.includes("over") ||
    sel.includes("under");
  if (looksLikeTotals) {
    return null;
  }

  if (bet.BET_TYPE === "Win" || !bet.BET_TYPE || bet.BET_TYPE === "") {
    return "Straight Win";
  }
  if (
    !bt.includes("double chance") &&
    !bt.includes("over") &&
    !bt.includes("under")
  ) {
    return "Straight Win";
  }
  return null;
}

function countWinsLosses(bets) {
  const wins = bets.filter((b) =>
    b.RESULT.toLowerCase().includes("win"),
  ).length;
  const losses = bets.filter((b) =>
    b.RESULT.toLowerCase().includes("loss"),
  ).length;
  return { wins, losses, total: wins + losses };
}

function pctStat(bets) {
  const { wins, losses, total } = countWinsLosses(bets);
  const pct = total > 0 ? Math.round((wins / total) * 1000) / 10 : null;
  return { wins, losses, total, pct };
}

/**
 * @param {Array} deduplicatedBets - deduplicated bet rows
 * @param {string} teamName - TEAM_INCLUDED must match exactly (same as getTeamBetTypePerformance)
 * @param {string} country
 * @param {string} league
 * @returns {null | { overall: object, byType: Array<{ type: string, wins: number, losses: number, total: number, pct: number|null }> }}
 */
export function getTeamBetWinStats(deduplicatedBets, teamName, country, league) {
  if (!teamName || !deduplicatedBets || deduplicatedBets.length === 0) return null;

  const withResult = deduplicatedBets.filter((b) => {
    const r = (b.RESULT || "").toLowerCase().trim();
    return r && (r.includes("win") || r.includes("loss"));
  });

  const teamBets = withResult.filter(
    (b) =>
      b.TEAM_INCLUDED === teamName &&
      b.COUNTRY === country &&
      b.LEAGUE === league,
  );

  if (teamBets.length === 0) return null;

  const overall = pctStat(teamBets);

  const byTypeMap = {};
  for (const b of teamBets) {
    const type = classifyBetForTeamRecord(b);
    if (type == null) continue;
    if (!byTypeMap[type]) byTypeMap[type] = [];
    byTypeMap[type].push(b);
  }

  const byType = TEAM_RECORD_COLUMNS.map((t) => {
    const arr = byTypeMap[t];
    if (arr?.length)
      return { type: t, ...pctStat(arr) };
    return { type: t, wins: 0, losses: 0, total: 0, pct: null };
  });

  return { overall, byType };
}
