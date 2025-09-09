/**
 * Confidence Service
 * Handles confidence-based recommendations and reasoning
 */

/**
 * Generates detailed reasoning for why a bet should be avoided
 * @param {Object} bet - Bet data object
 * @param {Object} confidenceBreakdown - Confidence breakdown object
 * @param {Array} bets - Array of all bets for analysis
 * @returns {string} Avoid reasoning text
 */
export const getAvoidReasoning = (bet, confidenceBreakdown, bets) => {
  const reasons = [];

  // Team confidence reasoning
  if (confidenceBreakdown.team < 4) {
    const teamBets = bets.filter(
      (b) =>
        b.TEAM_INCLUDED === bet.team_included &&
        b.COUNTRY === bet.country &&
        b.LEAGUE === bet.league
    );
    const teamWins = teamBets.filter((b) =>
      b.RESULT?.toLowerCase().includes("win")
    ).length;
    const teamTotal = teamBets.filter(
      (b) =>
        b.RESULT?.toLowerCase().includes("win") ||
        b.RESULT?.toLowerCase().includes("loss")
    ).length;
    const teamWinRate =
      teamTotal > 0 ? ((teamWins / teamTotal) * 100).toFixed(1) : 0;
    reasons.push(`Poor team performance (${teamWinRate}% win rate)`);
  }

  // League confidence reasoning
  if (confidenceBreakdown.league < 4) {
    const leagueBets = bets.filter(
      (b) => b.COUNTRY === bet.country && b.LEAGUE === bet.league
    );
    const leagueWins = leagueBets.filter((b) =>
      b.RESULT?.toLowerCase().includes("win")
    ).length;
    const leagueTotal = leagueBets.filter(
      (b) =>
        b.RESULT?.toLowerCase().includes("win") ||
        b.RESULT?.toLowerCase().includes("loss")
    ).length;
    const leagueWinRate =
      leagueTotal > 0 ? ((leagueWins / leagueTotal) * 100).toFixed(1) : 0;
    reasons.push(`Poor league performance (${leagueWinRate}% win rate)`);
  }

  // Odds confidence reasoning
  if (confidenceBreakdown.odds < 4) {
    const similarBets = bets.filter(
      (b) =>
        b.BET_TYPE === bet.bet_type &&
        Math.abs((parseFloat(b.ODDS1) || 0) - (parseFloat(bet.odds1) || 0)) <=
          0.5
    );
    const oddsWins = similarBets.filter((b) =>
      b.RESULT?.toLowerCase().includes("win")
    ).length;
    const oddsTotal = similarBets.filter(
      (b) =>
        b.RESULT?.toLowerCase().includes("win") ||
        b.RESULT?.toLowerCase().includes("loss")
    ).length;
    const oddsWinRate =
      oddsTotal > 0 ? ((oddsWins / oddsTotal) * 100).toFixed(1) : 0;
    reasons.push(`Poor odds performance (${oddsWinRate}% win rate)`);
  }

  // Matchup confidence reasoning
  if (confidenceBreakdown.matchup < 4) {
    const matchups = bets.filter(
      (b) =>
        ((b.HOME_TEAM === bet.home_team && b.AWAY_TEAM === bet.away_team) ||
          (b.HOME_TEAM === bet.away_team && b.AWAY_TEAM === bet.home_team)) &&
        b.COUNTRY === bet.country &&
        b.LEAGUE === bet.league
    );
    const matchupWins = matchups.filter((b) =>
      b.RESULT?.toLowerCase().includes("win")
    ).length;
    const matchupTotal = matchups.filter(
      (b) =>
        b.RESULT?.toLowerCase().includes("win") ||
        b.RESULT?.toLowerCase().includes("loss")
    ).length;
    const matchupWinRate =
      matchupTotal > 0 ? ((matchupWins / matchupTotal) * 100).toFixed(1) : 0;
    reasons.push(`Poor head-to-head record (${matchupWinRate}% win rate)`);
  }

  // Position confidence reasoning
  if (confidenceBreakdown.position < 4 && bet.LEAGUE !== "CUP") {
    if (bet.HOME_TEAM_POSITION_NUMBER && bet.AWAY_TEAM_POSITION_NUMBER) {
      const homePos = parseInt(bet.HOME_TEAM_POSITION_NUMBER);
      const awayPos = parseInt(bet.AWAY_TEAM_POSITION_NUMBER);
      const isBettingOnHomeTeam = (bet.team_included || "")
        .toLowerCase()
        .includes((bet.home_team || "").toLowerCase());

      if (isBettingOnHomeTeam && homePos > 10) {
        reasons.push(`Home team in poor league position (${homePos}th)`);
      } else if (!isBettingOnHomeTeam && awayPos > 10) {
        reasons.push(`Away team in poor league position (${awayPos}th)`);
      }
    }
  }

  // Home/Away confidence reasoning
  if (confidenceBreakdown.homeAway < 4) {
    const isBettingOnHomeTeam = (bet.team_included || "")
      .toLowerCase()
      .includes((bet.home_team || "").toLowerCase());
    const gameType = isBettingOnHomeTeam ? "home" : "away";
    reasons.push(`Poor ${gameType} game performance`);
  }

  return reasons.length > 0
    ? reasons.join(", ")
    : "Low confidence across multiple factors";
};

/**
 * Converts confidence score to betting recommendation
 * @param {number} confidenceScore - Confidence score (0-10)
 * @param {string} teamIncluded - Team being bet on
 * @param {string} homeTeam - Home team name
 * @param {string} awayTeam - Away team name
 * @param {Object} confidenceBreakdown - Confidence breakdown object
 * @param {Object} betData - Bet data object
 * @param {Array} bets - Array of all bets for analysis
 * @returns {string} Betting recommendation
 */
export const getConfidenceRecommendation = (
  confidenceScore,
  teamIncluded,
  homeTeam,
  awayTeam,
  confidenceBreakdown = null,
  betData = null,
  bets = []
) => {
  // Add safety checks for undefined values
  const safeTeamIncluded = teamIncluded || "";
  const safeHomeTeam = homeTeam || "";
  const safeAwayTeam = awayTeam || "";

  if (confidenceScore >= 7) {
    if (safeTeamIncluded.toLowerCase().includes(safeHomeTeam.toLowerCase())) {
      return "Home Win";
    } else if (
      safeTeamIncluded.toLowerCase().includes(safeAwayTeam.toLowerCase())
    ) {
      return "Away Win";
    } else {
      return "Win";
    }
  } else if (confidenceScore >= 4) {
    if (safeTeamIncluded.toLowerCase().includes(safeHomeTeam.toLowerCase())) {
      return "Double Chance Home/Draw";
    } else if (
      safeTeamIncluded.toLowerCase().includes(safeAwayTeam.toLowerCase())
    ) {
      return "Double Chance Away/Draw";
    } else {
      return "Double Chance";
    }
  } else {
    return confidenceBreakdown && betData
      ? `Avoid (${getAvoidReasoning(betData, confidenceBreakdown, bets)})`
      : "Avoid";
  }
};
