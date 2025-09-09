/**
 * Analysis Service
 * Handles bet analysis and recommendation functions
 */

/**
 * Generate bet recommendations from analysis results
 * @param {Array} analysisResults - Analysis results
 * @returns {Array} Sorted recommendations
 */
export const generateBetRecommendations = (analysisResults) => {
  if (!analysisResults || analysisResults.length === 0) return [];

  // Include all bets (including "Avoid" ones) and sort by confidence
  const recommendations = analysisResults
    .map((result) => ({
      ...result,
      confidenceScore: result.confidenceScore || 0,
    }))
    .sort((a, b) => b.confidenceScore - a.confidenceScore);

  return recommendations;
};

/**
 * Analyze straight win bet
 * @param {string} homeTeam - Home team name
 * @param {string} awayTeam - Away team name
 * @param {string} country - Country name
 * @param {string} league - League name
 * @param {Object} betData - Bet data object
 * @param {Array} bets - Array of all bets
 * @returns {Object} Analysis result
 */
export const analyzeStraightWin = (
  homeTeam,
  awayTeam,
  country,
  league,
  betData,
  bets
) => {
  // Check if this is an "Avoid" bet
  if (betData.recommendation && betData.recommendation.includes("Avoid")) {
    return {
      recommendation: "Avoid",
      reasoning: betData.recommendation,
      confidence: betData.confidenceScore || 1,
    };
  }

  // Get historical data for both teams
  const homeTeamBets = (bets || []).filter(
    (b) =>
      b.TEAM_INCLUDED === homeTeam &&
      b.COUNTRY === country &&
      b.LEAGUE === league &&
      b.RESULT !== "" &&
      b.RESULT !== "pending"
  );

  const awayTeamBets = (bets || []).filter(
    (b) =>
      b.TEAM_INCLUDED === awayTeam &&
      b.COUNTRY === country &&
      b.LEAGUE === league &&
      b.RESULT !== "" &&
      b.RESULT !== "pending"
  );

  const homeWins = homeTeamBets.filter((b) => b.RESULT === "win").length;
  const awayWins = awayTeamBets.filter((b) => b.RESULT === "win").length;

  const homeWinRate =
    homeTeamBets.length > 0 ? (homeWins / homeTeamBets.length) * 100 : 0;
  const awayWinRate =
    awayTeamBets.length > 0 ? (awayWins / awayTeamBets.length) * 100 : 0;

  // Determine recommendation based on win rates and sample sizes
  if (homeWinRate > awayWinRate && homeTeamBets.length >= 3) {
    return {
      recommendation: "Home Win",
      reasoning: `Home team has ${homeWinRate.toFixed(
        1
      )}% win rate vs away team's ${awayWinRate.toFixed(1)}%`,
      confidence: Math.min(8, Math.max(4, homeWinRate / 10)),
    };
  } else if (awayWinRate > homeWinRate && awayTeamBets.length >= 3) {
    return {
      recommendation: "Away Win",
      reasoning: `Away team has ${awayWinRate.toFixed(
        1
      )}% win rate vs home team's ${homeWinRate.toFixed(1)}%`,
      confidence: Math.min(8, Math.max(4, awayWinRate / 10)),
    };
  } else {
    return {
      recommendation: "Insufficient Data",
      reasoning:
        "Not enough historical data to make a confident recommendation",
      confidence: 3,
    };
  }
};

/**
 * Analyze double chance bet
 * @param {string} homeTeam - Home team name
 * @param {string} awayTeam - Away team name
 * @param {string} country - Country name
 * @param {string} league - League name
 * @param {Object} betData - Bet data object
 * @param {Array} bets - Array of all bets
 * @returns {Object} Analysis result
 */
export const analyzeDoubleChance = (
  homeTeam,
  awayTeam,
  country,
  league,
  betData,
  bets
) => {
  // Check if this is an "Avoid" bet
  if (betData.recommendation && betData.recommendation.includes("Avoid")) {
    return {
      recommendation: "Avoid",
      reasoning: betData.recommendation,
      confidence: betData.confidenceScore || 1,
    };
  }

  // Get all historical matches between these teams or in this league to calculate draw rate
  const allMatches = (bets || []).filter(
    (b) =>
      ((b.HOME_TEAM === homeTeam && b.AWAY_TEAM === awayTeam) ||
        (b.HOME_TEAM === awayTeam && b.AWAY_TEAM === homeTeam)) &&
      b.COUNTRY === country &&
      b.LEAGUE === league &&
      b.RESULT !== "" &&
      b.RESULT !== "pending"
  );

  if (allMatches.length === 0) {
    return {
      recommendation: "Insufficient Data",
      reasoning: "No historical matches found between these teams",
      confidence: 3,
    };
  }

  const draws = allMatches.filter((b) => b.RESULT === "draw").length;
  const drawRate = (draws / allMatches.length) * 100;

  // Get team performance data
  const homeTeamBets = (bets || []).filter(
    (b) =>
      b.TEAM_INCLUDED === homeTeam &&
      b.COUNTRY === country &&
      b.LEAGUE === league &&
      b.RESULT !== "" &&
      b.RESULT !== "pending"
  );

  const awayTeamBets = (bets || []).filter(
    (b) =>
      b.TEAM_INCLUDED === awayTeam &&
      b.COUNTRY === country &&
      b.LEAGUE === league &&
      b.RESULT !== "" &&
      b.RESULT !== "pending"
  );

  const homeWinRate =
    homeTeamBets.length > 0
      ? (homeTeamBets.filter((b) => b.RESULT === "win").length /
          homeTeamBets.length) *
        100
      : 0;
  const awayWinRate =
    awayTeamBets.length > 0
      ? (awayTeamBets.filter((b) => b.RESULT === "win").length /
          awayTeamBets.length) *
        100
      : 0;

  // Calculate double chance probabilities
  const homeDoubleChance = homeWinRate + drawRate;
  const awayDoubleChance = awayWinRate + drawRate;

  if (homeDoubleChance > awayDoubleChance) {
    return {
      recommendation: "Double Chance Home/Draw",
      reasoning: `Home team has ${homeDoubleChance.toFixed(
        1
      )}% double chance probability (${homeWinRate.toFixed(
        1
      )}% win + ${drawRate.toFixed(1)}% draw)`,
      confidence: Math.min(8, Math.max(4, homeDoubleChance / 10)),
    };
  } else if (awayDoubleChance > homeDoubleChance) {
    return {
      recommendation: "Double Chance Away/Draw",
      reasoning: `Away team has ${awayDoubleChance.toFixed(
        1
      )}% double chance probability (${awayWinRate.toFixed(
        1
      )}% win + ${drawRate.toFixed(1)}% draw)`,
      confidence: Math.min(8, Math.max(4, awayDoubleChance / 10)),
    };
  } else {
    return {
      recommendation: "Even Matchup",
      reasoning: "Both teams have similar double chance probabilities",
      confidence: 5,
    };
  }
};

/**
 * Analyze over/under bet
 * @param {string} homeTeam - Home team name
 * @param {string} awayTeam - Away team name
 * @param {string} country - Country name
 * @param {string} league - League name
 * @param {Object} betData - Bet data object
 * @param {Array} bets - Array of all bets
 * @returns {Object} Analysis result
 */
export const analyzeOverUnder = (
  homeTeam,
  awayTeam,
  country,
  league,
  betData,
  bets
) => {
  // Check if this is an "Avoid" bet
  if (betData.recommendation && betData.recommendation.includes("Avoid")) {
    return {
      recommendation: "Avoid",
      reasoning: betData.recommendation,
      confidence: betData.confidenceScore || 1,
    };
  }

  // Get scoring data for both teams
  const homeTeamGames = (bets || []).filter(
    (b) =>
      (b.HOME_TEAM === homeTeam || b.AWAY_TEAM === homeTeam) &&
      b.COUNTRY === country &&
      b.LEAGUE === league &&
      b.RESULT !== "" &&
      b.RESULT !== "pending"
  );

  const awayTeamGames = (bets || []).filter(
    (b) =>
      (b.HOME_TEAM === awayTeam || b.AWAY_TEAM === awayTeam) &&
      b.COUNTRY === country &&
      b.LEAGUE === league &&
      b.RESULT !== "" &&
      b.RESULT !== "pending"
  );

  // Calculate average goals per game for each team
  const homeAvgGoals =
    homeTeamGames.length > 0
      ? homeTeamGames.reduce((sum, game) => {
          const homeGoals = parseInt(game.HOME_GOALS) || 0;
          const awayGoals = parseInt(game.AWAY_GOALS) || 0;
          return sum + (game.HOME_TEAM === homeTeam ? homeGoals : awayGoals);
        }, 0) / homeTeamGames.length
      : 0;

  const awayAvgGoals =
    awayTeamGames.length > 0
      ? awayTeamGames.reduce((sum, game) => {
          const homeGoals = parseInt(game.HOME_GOALS) || 0;
          const awayGoals = parseInt(game.AWAY_GOALS) || 0;
          return sum + (game.HOME_TEAM === awayTeam ? homeGoals : awayGoals);
        }, 0) / awayTeamGames.length
      : 0;

  // Calculate combined average
  const combinedAvgGoals = (homeAvgGoals + awayAvgGoals) / 2;
  const totalGames = homeTeamGames.length + awayTeamGames.length;

  // If no data, return no clear trend
  if (totalGames < 3) {
    return {
      recommendation: "Insufficient Data",
      reasoning: "Not enough historical data to analyze scoring patterns",
      confidence: 3,
    };
  }

  // Determine recommendation based on combined average
  if (combinedAvgGoals >= 2.5) {
    return {
      recommendation: "Over 2.5 Goals",
      reasoning: `Combined average: ${combinedAvgGoals.toFixed(
        1
      )} goals per game (${totalGames} games analyzed)`,
      confidence: Math.min(8, Math.max(4, combinedAvgGoals * 2)),
    };
  } else if (combinedAvgGoals <= 1.5) {
    return {
      recommendation: "Under 2.5 Goals",
      reasoning: `Combined average: ${combinedAvgGoals.toFixed(
        1
      )} goals per game (${totalGames} games analyzed)`,
      confidence: Math.min(8, Math.max(4, (3 - combinedAvgGoals) * 2)),
    };
  } else {
    return {
      recommendation: "Close Call",
      reasoning: `Combined average: ${combinedAvgGoals.toFixed(
        1
      )} goals per game - could go either way`,
      confidence: 5,
    };
  }
};
