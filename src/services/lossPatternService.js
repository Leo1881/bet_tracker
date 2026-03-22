/**
 * Loss Pattern Service
 * Checks past betting performance to warn when a bet matches a pattern of past failures.
 * Used as a preventative measure before placing bets.
 */

const MIN_BETS_TO_WARN = 5; // Need at least 5 past bets to show warning
const RISKY_WIN_RATE_THRESHOLD = 0.85; // Warn if win rate below 85%

/**
 * Map recommendation type to bet type patterns for matching past bets
 */
const betTypePatterns = {
  "Straight Win": ["win", "straight win"],
  "Double Chance": ["double chance", "1x", "12", "2x", "x"],
  "Double Chance 12": ["double chance", "12"],
  "Over/Under": ["over", "under"],
};

/**
 * Check if a past bet matches the given bet type
 */
const matchesBetType = (bet, recBetType) => {
  const patterns = betTypePatterns[recBetType];
  if (!patterns) return true; // Unknown type - match all

  const bt = (bet.BET_TYPE ?? bet.bet_type ?? "").toLowerCase();
  const sel = (bet.BET_SELECTION ?? bet.bet_selection ?? "").toLowerCase();
  const combined = `${bt} ${sel}`;

  return patterns.some(
    (p) => bt.includes(p) || sel.includes(p) || combined.includes(p)
  );
};

/**
 * Get loss warning for a proposed bet based on past performance.
 * @param {Array} settledBets - Array of settled bets (win/loss only)
 * @param {Object} context - Proposed bet context
 * @param {string} context.team - Team being bet on (TEAM_INCLUDED equivalent)
 * @param {string} context.country - Country
 * @param {string} context.league - League
 * @param {string} [context.betType] - Recommendation type (Straight Win, Double Chance, etc.)
 * @returns {Object|null} { isRisky, winRate, wins, losses, total, message } or null if no warning
 */
export const getLossWarning = (settledBets, context) => {
  if (!settledBets || settledBets.length === 0) return null;
  if (!context?.team && !context?.country && !context?.league) return null;

  const { team, country, league, betType } = context;

  // Filter to settled bets only
  const settled = settledBets.filter((b) => {
    const r = (b.RESULT ?? b.result ?? "").toLowerCase();
    return r.includes("win") || r.includes("loss");
  });

  // Match by team + country + league (strict match)
  // For team: TEAM_INCLUDED, or HOME_TEAM/AWAY_TEAM for Over/Under
  const teamLower = (team || "").toLowerCase();
  const countryLower = (country || "").toLowerCase();
  const leagueLower = (league || "").toLowerCase();

  const matchingBets = settled.filter((b) => {
    const bCountry = (b.COUNTRY ?? b.country ?? "").toLowerCase();
    const bLeague = (b.LEAGUE ?? b.league ?? "").toLowerCase();
    if (bCountry !== countryLower || bLeague !== leagueLower) return false;

    // Team match: TEAM_INCLUDED or HOME_TEAM or AWAY_TEAM
    const bTeamIncluded = (b.TEAM_INCLUDED ?? b.team_included ?? "").toLowerCase();
    const bHome = (b.HOME_TEAM ?? b.home_team ?? "").toLowerCase();
    const bAway = (b.AWAY_TEAM ?? b.away_team ?? "").toLowerCase();

    const teamMatches =
      (teamLower && (bTeamIncluded.includes(teamLower) || teamLower.includes(bTeamIncluded))) ||
      (teamLower && (bHome.includes(teamLower) || teamLower.includes(bHome))) ||
      (teamLower && (bAway.includes(teamLower) || teamLower.includes(bAway)));

    if (!teamMatches && teamLower) return false;

    // Bet type match (optional - if we have a specific type)
    if (betType && !matchesBetType(b, betType)) return false;

    return true;
  });

  if (matchingBets.length < MIN_BETS_TO_WARN) return null;

  const wins = matchingBets.filter((b) =>
    (b.RESULT ?? b.result ?? "").toLowerCase().includes("win")
  ).length;
  const losses = matchingBets.length - wins;
  const winRate = matchingBets.length > 0 ? wins / matchingBets.length : 0;

  if (winRate >= RISKY_WIN_RATE_THRESHOLD) return null;

  const teamLabel = team || "this team";
  const contextLabel = [teamLabel, country, league].filter(Boolean).join(" · ");
  const message = `Your record betting on ${contextLabel}: ${(winRate * 100).toFixed(0)}% (${wins}W-${losses}L). Past performance here has been poor.`;

  return {
    isRisky: true,
    winRate,
    wins,
    losses,
    total: matchingBets.length,
    message,
  };
};

/**
 * Get loss info (always returns record when 3+ bets, for display/debugging).
 * Use this to show record even when not "risky" - helps verify the feature works.
 * @returns {Object|null} { winRate, wins, losses, total, isRisky, message } or null
 */
export const getLossInfo = (settledBets, context) => {
  if (!settledBets || settledBets.length === 0) return null;
  if (!context?.team && !context?.country && !context?.league) return null;

  const { team, country, league, betType } = context;
  const settled = settledBets.filter((b) => {
    const r = (b.RESULT ?? b.result ?? "").toLowerCase();
    return r.includes("win") || r.includes("loss");
  });

  const teamLower = (team || "").toLowerCase();
  const countryLower = (country || "").toLowerCase();
  const leagueLower = (league || "").toLowerCase();

  const matchingBets = settled.filter((b) => {
    const bCountry = (b.COUNTRY ?? b.country ?? "").toLowerCase();
    const bLeague = (b.LEAGUE ?? b.league ?? "").toLowerCase();
    if (bCountry !== countryLower || bLeague !== leagueLower) return false;

    const bTeamIncluded = (b.TEAM_INCLUDED ?? b.team_included ?? "").toLowerCase();
    const bHome = (b.HOME_TEAM ?? b.home_team ?? "").toLowerCase();
    const bAway = (b.AWAY_TEAM ?? b.away_team ?? "").toLowerCase();

    const teamMatches =
      (teamLower && (bTeamIncluded.includes(teamLower) || teamLower.includes(bTeamIncluded))) ||
      (teamLower && (bHome.includes(teamLower) || teamLower.includes(bHome))) ||
      (teamLower && (bAway.includes(teamLower) || teamLower.includes(bAway)));

    if (!teamMatches && teamLower) return false;
    if (betType && !matchesBetType(b, betType)) return false;
    return true;
  });

  if (matchingBets.length < 3) return null;

  const wins = matchingBets.filter((b) =>
    (b.RESULT ?? b.result ?? "").toLowerCase().includes("win")
  ).length;
  const losses = matchingBets.length - wins;
  const winRate = wins / matchingBets.length;
  const isRisky = winRate < RISKY_WIN_RATE_THRESHOLD;
  const teamLabel = team || "this team";
  const contextLabel = [teamLabel, country, league].filter(Boolean).join(" · ");
  const message = isRisky
    ? `Your record betting on ${contextLabel}: ${(winRate * 100).toFixed(0)}% (${wins}W-${losses}L). Past performance here has been poor.`
    : `Your record betting on ${contextLabel}: ${(winRate * 100).toFixed(0)}% (${wins}W-${losses}L)`;

  return {
    winRate,
    wins,
    losses,
    total: matchingBets.length,
    isRisky,
    message,
  };
};
