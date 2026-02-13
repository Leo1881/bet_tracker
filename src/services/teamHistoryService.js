/**
 * Team History Service
 * Handles team performance analysis, confidence calculations, and historical data processing
 */
import { debugLog } from "../utils/debug";

/**
 * Calculates team confidence based on historical performance using statistical confidence intervals
 * @param {string} teamName - Name of the team
 * @param {string} country - Country of the team
 * @param {string} league - League of the team
 * @param {Array} bets - Array of all bets
 * @returns {number} Team confidence probability (0-100%)
 */
export const calculateTeamConfidence = (teamName, country, league, bets) => {
  if (!teamName || !bets || bets.length === 0) return 50;

  const teamBets = bets.filter((bet) => {
    const betTeamIncluded = bet.TEAM_INCLUDED?.toLowerCase() || "";
    const betCountry = bet.COUNTRY?.toLowerCase() || "";
    const betLeague = bet.LEAGUE?.toLowerCase() || "";

    return (
      betTeamIncluded === teamName.toLowerCase() &&
      betCountry === (country || "").toLowerCase() &&
      betLeague === (league || "").toLowerCase()
    );
  });

  if (teamBets.length === 0) return 50;

  const wins = teamBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("win")
  ).length;
  const losses = teamBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("loss")
  ).length;
  const total = wins + losses;

  if (total === 0) return 50;

  // Use Wilson Score confidence interval for statistical rigor
  const confidence = calculateStatisticalConfidence(wins, total);

  return Math.min(100, Math.max(10, confidence));
};

/**
 * Calculates statistical confidence using Wilson Score confidence interval
 * @param {number} wins - Number of wins
 * @param {number} total - Total number of games
 * @returns {number} Confidence probability (0-100%)
 */
const calculateStatisticalConfidence = (wins, total) => {
  if (total === 0) return 50;

  const z = 1.96; // 95% confidence level
  const n = total;
  const p = wins / total;

  // Wilson Score confidence interval
  const lowerBound =
    (p +
      (z * z) / (2 * n) -
      z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) /
    (1 + (z * z) / n);
  // upperBound available for alternative confidence strategies

  // Use lower bound for conservative estimate, but adjust for sample size uncertainty
  const uncertainty = Math.sqrt((p * (1 - p)) / n);
  const adjustedConfidence = Math.max(0, lowerBound - uncertainty * 0.5);

  // Convert to percentage (0-100%)
  return Math.min(100, Math.max(10, adjustedConfidence * 100));
};

/**
 * Calculates league confidence based on performance in specific league/country using statistical confidence intervals
 * @param {string} country - Country name
 * @param {string} league - League name
 * @param {Array} bets - Array of all bets
 * @returns {number} League confidence probability (0-100%)
 */
export const calculateLeagueConfidence = (country, league, bets) => {
  if (!country || !league || !bets || bets.length === 0) return 50;

  const leagueBets = bets.filter((bet) => {
    const betCountry = bet.COUNTRY?.toLowerCase() || "";
    const betLeague = bet.LEAGUE?.toLowerCase() || "";
    return (
      betCountry === country.toLowerCase() && betLeague === league.toLowerCase()
    );
  });

  if (leagueBets.length === 0) return 50;

  const wins = leagueBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("win")
  ).length;
  const losses = leagueBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("loss")
  ).length;
  const total = wins + losses;

  if (total === 0) return 50;

  // Use statistical confidence calculation
  const confidence = calculateStatisticalConfidence(wins, total);

  return Math.min(100, Math.max(10, confidence));
};

/**
 * Calculates odds confidence based on betting odds and historical performance
 * @param {number} odds1 - First odds value
 * @param {string} betType - Type of bet
 * @param {string} teamName - Name of the team
 * @param {Array} bets - Array of all bets
 * @returns {number} Odds confidence probability (0-100%)
 */
export const calculateOddsConfidence = (odds1, betType, teamName, bets) => {
  if (!odds1 || !betType || !teamName || !bets || bets.length === 0) return 50;

  const avgOdds = parseFloat(odds1) || 0;
  if (avgOdds <= 0) return 50;

  // Find similar bets with similar odds
  const similarBets = bets.filter((bet) => {
    const betOdds = parseFloat(bet.ODDS1) || 0;
    const oddsDiff = Math.abs(betOdds - avgOdds);
    return (
      bet.BET_TYPE?.toLowerCase() === betType.toLowerCase() && oddsDiff <= 0.5 // Within 0.5 odds difference
    );
  });

  if (similarBets.length === 0) {
    // No similar bets, use odds-based confidence (convert implied probability to confidence)
    // Low odds = high implied probability = high confidence
    const impliedProbability = 1 / avgOdds;
    return Math.min(100, Math.max(10, impliedProbability * 100));
  }

  const wins = similarBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("win")
  ).length;
  const losses = similarBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("loss")
  ).length;
  const total = wins + losses;

  if (total === 0) return 50;

  // Use Wilson Score for more accurate probability estimate
  const confidence = calculateStatisticalConfidence(wins, total);

  return Math.min(100, Math.max(10, confidence));
};

/**
 * Calculates matchup confidence based on head-to-head history using statistical confidence intervals
 * @param {string} homeTeam - Home team name
 * @param {string} awayTeam - Away team name
 * @param {string} country - Country name
 * @param {string} league - League name
 * @param {Array} bets - Array of all bets
 * @returns {number} Matchup confidence probability (0-100%)
 */
export const calculateMatchupConfidence = (
  homeTeam,
  awayTeam,
  country,
  league,
  bets
) => {
  if (!homeTeam || !awayTeam || !bets || bets.length === 0) return 50;

  const matchups = bets.filter((bet) => {
    const betHomeTeam = bet.HOME_TEAM?.toLowerCase() || "";
    const betAwayTeam = bet.AWAY_TEAM?.toLowerCase() || "";
    const betCountry = bet.COUNTRY?.toLowerCase() || "";
    const betLeague = bet.LEAGUE?.toLowerCase() || "";

    return (
      ((betHomeTeam === homeTeam.toLowerCase() &&
        betAwayTeam === awayTeam.toLowerCase()) ||
        (betHomeTeam === awayTeam.toLowerCase() &&
          betAwayTeam === homeTeam.toLowerCase())) &&
      betCountry === (country || "").toLowerCase() &&
      betLeague === (league || "").toLowerCase()
    );
  });

  if (matchups.length === 0) return 50;

  const wins = matchups.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("win")
  ).length;
  const losses = matchups.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("loss")
  ).length;
  const total = wins + losses;

  if (total === 0) return 50;

  // Use statistical confidence calculation
  const confidence = calculateStatisticalConfidence(wins, total);

  return Math.min(100, Math.max(10, confidence));
};

/**
 * Calculates position confidence based on league positions
 * @param {string} homePosition - Home team position
 * @param {string} awayPosition - Away team position
 * @param {string} teamIncluded - Team being bet on
 * @param {string} homeTeam - Home team name
 * @param {string} awayTeam - Away team name
 * @param {Object} betData - Bet data object
 * @returns {number} Position confidence probability (0-100%)
 */
export const calculatePositionConfidence = (
  homePosition,
  awayPosition,
  teamIncluded,
  homeTeam,
  awayTeam,
  betData
) => {
  if (!homePosition || !awayPosition || !teamIncluded) return 50;

  const homePos = parseInt(homePosition) || 0;
  const awayPos = parseInt(awayPosition) || 0;

  if (homePos === 0 || awayPos === 0) return 50;

  const isBettingOnHomeTeam = teamIncluded
    .toLowerCase()
    .includes(homeTeam?.toLowerCase() || "");
  const isBettingOnAwayTeam = teamIncluded
    .toLowerCase()
    .includes(awayTeam?.toLowerCase() || "");

  let confidence = 50;

  if (isBettingOnHomeTeam) {
    // Betting on home team - convert position to probability estimate
    if (homePos <= 3) confidence = 80; // Top 3
    else if (homePos <= 6) confidence = 70; // Top 6
    else if (homePos <= 10) confidence = 60; // Top half
    else if (homePos <= 15) confidence = 40; // Bottom half
    else confidence = 30; // Bottom 3
  } else if (isBettingOnAwayTeam) {
    // Betting on away team
    if (awayPos <= 3) confidence = 80;
    else if (awayPos <= 6) confidence = 70;
    else if (awayPos <= 10) confidence = 60;
    else if (awayPos <= 15) confidence = 40;
    else confidence = 30;
  }

  // Adjust based on opponent position
  const opponentPos = isBettingOnHomeTeam ? awayPos : homePos;
  if (opponentPos <= 3)
    confidence = Math.max(30, confidence - 10); // Strong opponent
  else if (opponentPos >= 15) confidence = Math.min(100, confidence + 10); // Weak opponent

  return Math.min(100, Math.max(10, confidence));
};

/**
 * Returns a position gap indicator between home and away team (considering league size).
 * @param {string|number} homePosition - Home team league position
 * @param {string|number} awayPosition - Away team league position
 * @param {string|number} totalTeamsInLeague - Number of teams in the league (optional; defaults to 20)
 * @returns {{ gapLabel: string, relativeGap: number } | null} - 'Large' | 'Moderate' | 'Close', and 0-1 relative gap; null if positions missing
 */
export const getPositionGapIndicator = (
  homePosition,
  awayPosition,
  totalTeamsInLeague
) => {
  const homePos = parseInt(homePosition, 10);
  const awayPos = parseInt(awayPosition, 10);
  if (!Number.isFinite(homePos) || !Number.isFinite(awayPos)) return null;

  const totalTeams = parseInt(totalTeamsInLeague, 10);
  const n = Number.isFinite(totalTeams) && totalTeams > 0 ? totalTeams : 20;
  const rawGap = Math.abs(homePos - awayPos);
  const relativeGap = rawGap / n;

  let gapLabel = "Close";
  if (relativeGap >= 0.4) gapLabel = "Large";
  else if (relativeGap >= 0.2) gapLabel = "Moderate";

  return { gapLabel, relativeGap };
};

/**
 * Calculates home/away confidence based on team performance in home vs away games
 * @param {string} teamName - Name of the team
 * @param {string} country - Country of the team
 * @param {string} league - League of the team
 * @param {boolean} isHomeGame - Whether it's a home game for the team
 * @param {Array} bets - Array of all bets
 * @returns {number} Home/away confidence probability (0-100%)
 */
export const calculateHomeAwayConfidence = (
  teamName,
  country,
  league,
  isHomeGame,
  bets
) => {
  if (!teamName || !bets || bets.length === 0) return 50;

  const teamBets = bets.filter((bet) => {
    const betTeamIncluded = bet.TEAM_INCLUDED?.toLowerCase() || "";
    const betCountry = bet.COUNTRY?.toLowerCase() || "";
    const betLeague = bet.LEAGUE?.toLowerCase() || "";

    return (
      betTeamIncluded === teamName.toLowerCase() &&
      betCountry === (country || "").toLowerCase() &&
      betLeague === (league || "").toLowerCase()
    );
  });

  if (teamBets.length === 0) return 50;

  // Filter by home/away based on team position
  const homeAwayBets = teamBets.filter((bet) => {
    const isBettingOnHomeTeam = bet.TEAM_INCLUDED?.toLowerCase().includes(
      bet.HOME_TEAM?.toLowerCase() || ""
    );
    return isHomeGame ? isBettingOnHomeTeam : !isBettingOnHomeTeam;
  });

  if (homeAwayBets.length === 0) return 50;

  const wins = homeAwayBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("win")
  ).length;
  const losses = homeAwayBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("loss")
  ).length;
  const total = wins + losses;

  if (total === 0) return 50;

  // Use Wilson Score for probability estimate
  const confidence = calculateStatisticalConfidence(wins, total);

  // Adjust for sample size
  if (total < 3) {
    const adjustedConfidence = confidence * 0.9; // Reduce confidence for small samples
    return Math.min(100, Math.max(10, adjustedConfidence));
  }

  return Math.min(100, Math.max(10, confidence));
};

/**
 * Calculates recent form confidence based on last 5 games performance
 * @param {Object} bet - Bet object with last 5 games data
 * @returns {number} Recent form confidence probability (0-100%)
 */
export const calculateRecentFormConfidence = (bet) => {
  if (!bet) return 50;

  // Determine which team we're betting on
  const isBettingOnHomeTeam =
    bet.team_included &&
    bet.home_team &&
    bet.team_included.toLowerCase().includes(bet.home_team.toLowerCase());

  // Get the last 5 games data for the team we're betting on
  let wins, draws, losses;

  // Debug: Log available properties in bet object
  debugLog("Available bet properties:", Object.keys(bet));
  debugLog("Recent form data found:", {
    LAST_5_WINS_HOME: bet.LAST_5_WINS_HOME,
    LAST_5_DRAWS_HOME: bet.LAST_5_DRAWS_HOME,
    LAST_5_LOSSES_HOME: bet.LAST_5_LOSSES_HOME,
    LAST_5_WINS_AWAY: bet.LAST_5_WINS_AWAY,
    LAST_5_DRAWS_AWAY: bet.LAST_5_DRAWS_AWAY,
    LAST_5_LOSSES_AWAY: bet.LAST_5_LOSSES_AWAY,
  });

  if (isBettingOnHomeTeam) {
    wins = parseInt(bet.LAST_5_WINS_HOME) || 0;
    draws = parseInt(bet.LAST_5_DRAWS_HOME) || 0;
    losses = parseInt(bet.LAST_5_LOSSES_HOME) || 0;
  } else {
    wins = parseInt(bet.LAST_5_WINS_AWAY) || 0;
    draws = parseInt(bet.LAST_5_DRAWS_AWAY) || 0;
    losses = parseInt(bet.LAST_5_LOSSES_AWAY) || 0;
  }

  const totalGames = wins + draws + losses;

  // If no recent form data available, return neutral score
  if (totalGames === 0) {
    debugLog("No recent form data available, returning neutral score");
    return 50;
  }

  // Calculate recent form score (wins + 0.5*draws) / totalGames
  // This is already a probability (0-1), convert to percentage
  const recentFormScore = (wins + 0.5 * draws) / totalGames;
  let confidence = recentFormScore * 100; // Convert to percentage

  // Adjust for sample size (if less than 5 games) - reduce confidence
  if (totalGames < 5) {
    const sampleSizePenalty = (5 - totalGames) * 5; // 5% penalty per missing game
    confidence = Math.max(30, confidence - sampleSizePenalty);
  }

  debugLog(
    `Recent form for ${
      isBettingOnHomeTeam ? bet.home_team : bet.away_team
    }: ${wins}W-${draws}D-${losses}L (${recentFormScore.toFixed(
      2
    )} score, ${confidence.toFixed(1)}% confidence)`
  );

  return Math.min(100, Math.max(10, confidence));
};

/**
 * Calculates team momentum confidence based on performance trend over last 10 games
 * @param {string} teamName - Name of the team
 * @param {Array} bets - Array of all bets
 * @returns {number} Momentum confidence probability (0-100%)
 */
export const calculateMomentumConfidence = (teamName, bets) => {
  if (!teamName || !bets || bets.length === 0) return 50;

  // Get last 10 games for the team, sorted by date (newest first)
  const teamBets = bets
    .filter((bet) => bet.TEAM_INCLUDED === teamName)
    .sort((a, b) => new Date(b.DATE) - new Date(a.DATE))
    .slice(0, 10); // Last 10 games

  if (teamBets.length === 0) return 50;

  let momentum = 0;
  let totalWeight = 0;

  teamBets.forEach((bet, index) => {
    // Weight recent games more heavily (exponential decay)
    const weight = Math.pow(0.8, index);
    totalWeight += weight;

    if (bet.RESULT?.toLowerCase().includes("win")) {
      momentum += weight; // Positive momentum for wins
    } else if (bet.RESULT?.toLowerCase().includes("loss")) {
      momentum -= weight; // Negative momentum for losses
    }
    // Draws don't affect momentum (neutral)
  });

  // Normalize momentum to -1 to +1 range
  const normalizedMomentum = totalWeight > 0 ? momentum / totalWeight : 0;

  // Convert to probability (0-100%)
  // -1 (all losses) = 10%, 0 (neutral) = 50%, +1 (all wins) = 100%
  const momentumConfidence = Math.min(
    100,
    Math.max(10, (normalizedMomentum + 1) * 45 + 10)
  );

  debugLog(
    `Momentum calculation for ${teamName}: raw=${momentum.toFixed(
      2
    )}, normalized=${normalizedMomentum.toFixed(2)} → ${momentumConfidence.toFixed(1)}%`
  );

  return momentumConfidence;
};

/**
 * Calculates dynamic weights based on confidence scores and bet type
 * @param {Object} confidenceBreakdown - Individual confidence scores
 * @param {string} betType - Type of bet (e.g., "Over/Under", "Win/Loss")
 * @returns {Object} Dynamic weight distribution
 */
const calculateDynamicWeights = (confidenceBreakdown, betType) => {
  // Base weights (starting point)
  const baseWeights = {
    team: 0.2,
    recentForm: 0.15,
    momentum: 0.15,
    league: 0.15,
    odds: 0.15,
    matchup: 0.15,
    position: 0.1,
    homeAway: 0.05,
  };

  // Adjust weights based on confidence scores (now 0-100% scale)
  if (confidenceBreakdown.team < 30) {
    // Poor team data - reduce team weight, increase others
    baseWeights.team *= 0.5;
    baseWeights.league *= 1.3;
    baseWeights.odds *= 1.2;
  }

  if (confidenceBreakdown.recentForm < 30) {
    // Poor recent form data - reduce recent form weight
    baseWeights.recentForm *= 0.6;
    baseWeights.team *= 1.2;
    baseWeights.league *= 1.1;
  }

  if (confidenceBreakdown.momentum < 30) {
    // Poor momentum data - reduce momentum weight
    baseWeights.momentum *= 0.6;
    baseWeights.team *= 1.1;
    baseWeights.recentForm *= 1.1;
  }

  if (confidenceBreakdown.league < 30) {
    // Poor league data - reduce league weight
    baseWeights.league *= 0.6;
    baseWeights.team *= 1.3;
    baseWeights.odds *= 1.2;
  }

  if (confidenceBreakdown.odds < 30) {
    // Poor odds data - reduce odds weight
    baseWeights.odds *= 0.6;
    baseWeights.team *= 1.2;
    baseWeights.league *= 1.2;
  }

  if (confidenceBreakdown.matchup < 30) {
    // Poor matchup data - reduce matchup weight
    baseWeights.matchup *= 0.6;
    baseWeights.team *= 1.1;
    baseWeights.league *= 1.1;
  }

  // Adjust weights based on bet type
  if (
    (betType && betType.toLowerCase().includes("over")) ||
    (betType && betType.toLowerCase().includes("under"))
  ) {
    // For Over/Under bets, increase odds and league weights
    baseWeights.odds *= 1.3;
    baseWeights.league *= 1.2;
    baseWeights.team *= 0.8;
  }

  // Normalize weights to sum to 1
  const totalWeight = Object.values(baseWeights).reduce((sum, w) => sum + w, 0);
  Object.keys(baseWeights).forEach((key) => {
    baseWeights[key] /= totalWeight;
  });

  return baseWeights;
};

/**
 * Calculates overall confidence score from individual components using dynamic weights
 * @param {Object} bet - Bet object with all necessary data
 * @returns {number} Overall confidence probability (0-100%)
 */
export const calculateConfidenceScore = (bet) => {
  debugLog(`=== CALCULATING CONFIDENCE FOR: ${bet.team_included} ===`);
  debugLog(`Bet object:`, bet);

  const teamConfidence = calculateTeamConfidence(
    bet.team_included,
    bet.country,
    bet.league,
    bet.bets || []
  );
  const leagueConfidence = calculateLeagueConfidence(
    bet.country,
    bet.league,
    bet.bets || []
  );
  const oddsConfidence = calculateOddsConfidence(
    bet.odds1,
    bet.bet_type,
    bet.team_included,
    bet.bets || []
  );
  const matchupConfidence = calculateMatchupConfidence(
    bet.home_team,
    bet.away_team,
    bet.country,
    bet.league,
    bet.bets || []
  );
  const positionConfidence = calculatePositionConfidence(
    bet.home_team_position,
    bet.away_team_position,
    bet.team_included,
    bet.home_team,
    bet.away_team,
    bet
  );

  // Determine if this is a home or away game for the team being bet on
  const isBettingOnHomeTeam =
    bet.team_included &&
    bet.home_team &&
    bet.team_included.toLowerCase().includes(bet.home_team.toLowerCase());
  const isHomeGame = isBettingOnHomeTeam;

  const homeAwayConfidence = calculateHomeAwayConfidence(
    bet.team_included,
    bet.country,
    bet.league,
    isHomeGame,
    bet.bets || []
  );

  // Calculate recent form confidence
  const recentFormConfidence = calculateRecentFormConfidence(bet);

  // Calculate momentum confidence
  const momentumConfidence = calculateMomentumConfidence(
    bet.team_included,
    bet.bets || []
  );

  // Create confidence breakdown for dynamic weight calculation
  const confidenceBreakdown = {
    team: teamConfidence,
    recentForm: recentFormConfidence,
    momentum: momentumConfidence,
    league: leagueConfidence,
    odds: oddsConfidence,
    matchup: matchupConfidence,
    position: positionConfidence,
    homeAway: homeAwayConfidence,
  };

  // Calculate dynamic weights based on confidence scores and bet type
  const weights = calculateDynamicWeights(confidenceBreakdown, bet.bet_type);

  const weightedScore =
    teamConfidence * weights.team +
    recentFormConfidence * weights.recentForm +
    momentumConfidence * weights.momentum +
    leagueConfidence * weights.league +
    oddsConfidence * weights.odds +
    matchupConfidence * weights.matchup +
    positionConfidence * weights.position +
    homeAwayConfidence * weights.homeAway;

  const finalScore = Math.round(weightedScore * 10) / 10;

  debugLog(`Confidence breakdown:`, {
    team: teamConfidence.toFixed(1) + '%',
    recentForm: recentFormConfidence.toFixed(1) + '%',
    momentum: momentumConfidence.toFixed(1) + '%',
    league: leagueConfidence.toFixed(1) + '%',
    odds: oddsConfidence.toFixed(1) + '%',
    matchup: matchupConfidence.toFixed(1) + '%',
    position: positionConfidence.toFixed(1) + '%',
    homeAway: homeAwayConfidence.toFixed(1) + '%',
    final: finalScore.toFixed(1) + '%',
  });

  debugLog(`Dynamic weights applied:`, weights);

  return Math.min(100, Math.max(10, finalScore));
};

/**
 * Gets confidence breakdown for detailed analysis
 * @param {Object} bet - Bet object with all necessary data
 * @returns {Object} Confidence breakdown object
 */
export const getConfidenceBreakdown = (bet) => {
  const teamConfidence = calculateTeamConfidence(
    bet.team_included,
    bet.country,
    bet.league,
    bet.bets || []
  );
  const leagueConfidence = calculateLeagueConfidence(
    bet.country,
    bet.league,
    bet.bets || []
  );
  const oddsConfidence = calculateOddsConfidence(
    bet.odds1,
    bet.bet_type,
    bet.team_included,
    bet.bets || []
  );
  const matchupConfidence = calculateMatchupConfidence(
    bet.home_team,
    bet.away_team,
    bet.country,
    bet.league,
    bet.bets || []
  );
  const positionConfidence = calculatePositionConfidence(
    bet.home_team_position,
    bet.away_team_position,
    bet.team_included,
    bet.home_team,
    bet.away_team,
    bet
  );

  const isBettingOnHomeTeam =
    bet.team_included &&
    bet.home_team &&
    bet.team_included.toLowerCase().includes(bet.home_team.toLowerCase());
  const isHomeGame = isBettingOnHomeTeam;

  const homeAwayConfidence = calculateHomeAwayConfidence(
    bet.team_included,
    bet.country,
    bet.league,
    isHomeGame,
    bet.bets || []
  );

  const recentFormConfidence = calculateRecentFormConfidence(bet);
  const momentumConfidence = calculateMomentumConfidence(
    bet.team_included,
    bet.bets || []
  );

  return {
    team: Math.round(teamConfidence),
    recentForm: Math.round(recentFormConfidence),
    momentum: Math.round(momentumConfidence),
    league: Math.round(leagueConfidence),
    odds: Math.round(oddsConfidence),
    matchup: Math.round(matchupConfidence),
    position: Math.round(positionConfidence),
    homeAway: Math.round(homeAwayConfidence),
  };
};

/**
 * Gets confidence label and styling based on confidence probability
 * @param {number} confidenceScore - Confidence probability (0-100%)
 * @returns {Object} Confidence label object with emoji, label, and color
 */
export const getConfidenceLabel = (confidenceScore) => {
  // Handle both old 1-10 scale (for backward compatibility) and new 0-100% scale
  const percentage = confidenceScore > 10 ? confidenceScore : confidenceScore * 10;
  
  if (percentage >= 80) {
    return {
      emoji: "🔥",
      label: "Very High",
      color: "bg-red-100 text-red-800",
    };
  } else if (percentage >= 70) {
    return {
      emoji: "💪",
      label: "High",
      color: "bg-orange-100 text-orange-800",
    };
  } else if (percentage >= 60) {
    return {
      emoji: "👍",
      label: "Good",
      color: "bg-yellow-100 text-yellow-800",
    };
  } else if (percentage >= 50) {
    return {
      emoji: "🤔",
      label: "Moderate",
      color: "bg-blue-100 text-blue-800",
    };
  } else if (percentage >= 40) {
    return {
      emoji: "⚠️",
      label: "Low",
      color: "bg-purple-100 text-purple-800",
    };
  } else {
    return {
      emoji: "❌",
      label: "Very Low",
      color: "bg-gray-100 text-gray-800",
    };
  }
};
