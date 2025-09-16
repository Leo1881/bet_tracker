/**
 * Team History Service
 * Handles team performance analysis, confidence calculations, and historical data processing
 */

/**
 * Calculates team confidence based on historical performance
 * @param {string} teamName - Name of the team
 * @param {string} country - Country of the team
 * @param {string} league - League of the team
 * @param {Array} bets - Array of all bets
 * @returns {number} Team confidence score (0-10)
 */
export const calculateTeamConfidence = (teamName, country, league, bets) => {
  if (!teamName || !bets || bets.length === 0) return 5;

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

  if (teamBets.length === 0) return 5;

  const wins = teamBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("win")
  ).length;
  const losses = teamBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("loss")
  ).length;
  const total = wins + losses;

  if (total === 0) return 5;

  const winRate = (wins / total) * 100;

  // Calculate confidence based on win rate and sample size
  let confidence = 5;
  if (winRate >= 80) confidence = 9;
  else if (winRate >= 70) confidence = 8;
  else if (winRate >= 60) confidence = 7;
  else if (winRate >= 50) confidence = 6;
  else if (winRate >= 40) confidence = 4;
  else if (winRate >= 30) confidence = 3;
  else confidence = 2;

  // Adjust for sample size
  if (total < 3) confidence = Math.max(3, confidence - 2);
  else if (total < 5) confidence = Math.max(4, confidence - 1);

  return Math.min(10, Math.max(1, confidence));
};

/**
 * Calculates league confidence based on performance in specific league/country
 * @param {string} country - Country name
 * @param {string} league - League name
 * @param {Array} bets - Array of all bets
 * @returns {number} League confidence score (0-10)
 */
export const calculateLeagueConfidence = (country, league, bets) => {
  if (!country || !league || !bets || bets.length === 0) return 5;

  const leagueBets = bets.filter((bet) => {
    const betCountry = bet.COUNTRY?.toLowerCase() || "";
    const betLeague = bet.LEAGUE?.toLowerCase() || "";
    return (
      betCountry === country.toLowerCase() && betLeague === league.toLowerCase()
    );
  });

  if (leagueBets.length === 0) return 5;

  const wins = leagueBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("win")
  ).length;
  const losses = leagueBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("loss")
  ).length;
  const total = wins + losses;

  if (total === 0) return 5;

  const winRate = (wins / total) * 100;

  let confidence = 5;
  if (winRate >= 75) confidence = 9;
  else if (winRate >= 65) confidence = 8;
  else if (winRate >= 55) confidence = 7;
  else if (winRate >= 45) confidence = 6;
  else if (winRate >= 35) confidence = 4;
  else confidence = 3;

  // Adjust for sample size
  if (total < 5) confidence = Math.max(3, confidence - 1);
  else if (total < 10) confidence = Math.max(4, confidence - 0.5);

  return Math.min(10, Math.max(1, confidence));
};

/**
 * Calculates odds confidence based on betting odds and historical performance
 * @param {number} odds1 - First odds value
 * @param {string} betType - Type of bet
 * @param {string} teamName - Name of the team
 * @param {Array} bets - Array of all bets
 * @returns {number} Odds confidence score (0-10)
 */
export const calculateOddsConfidence = (odds1, betType, teamName, bets) => {
  if (!odds1 || !betType || !teamName || !bets || bets.length === 0) return 5;

  const avgOdds = parseFloat(odds1) || 0;
  if (avgOdds <= 0) return 5;

  // Find similar bets with similar odds
  const similarBets = bets.filter((bet) => {
    const betOdds = parseFloat(bet.ODDS1) || 0;
    const oddsDiff = Math.abs(betOdds - avgOdds);
    return (
      bet.BET_TYPE?.toLowerCase() === betType.toLowerCase() && oddsDiff <= 0.5 // Within 0.5 odds difference
    );
  });

  if (similarBets.length === 0) {
    // No similar bets, use odds-based confidence
    if (avgOdds <= 1.5) return 8; // Very low odds = high confidence
    else if (avgOdds <= 2.0) return 7;
    else if (avgOdds <= 3.0) return 6;
    else if (avgOdds <= 5.0) return 5;
    else return 4; // High odds = lower confidence
  }

  const wins = similarBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("win")
  ).length;
  const losses = similarBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("loss")
  ).length;
  const total = wins + losses;

  if (total === 0) return 5;

  const winRate = (wins / total) * 100;

  let confidence = 5;
  if (winRate >= 70) confidence = 8;
  else if (winRate >= 60) confidence = 7;
  else if (winRate >= 50) confidence = 6;
  else if (winRate >= 40) confidence = 4;
  else confidence = 3;

  return Math.min(10, Math.max(1, confidence));
};

/**
 * Calculates matchup confidence based on head-to-head history
 * @param {string} homeTeam - Home team name
 * @param {string} awayTeam - Away team name
 * @param {string} country - Country name
 * @param {string} league - League name
 * @param {Array} bets - Array of all bets
 * @returns {number} Matchup confidence score (0-10)
 */
export const calculateMatchupConfidence = (
  homeTeam,
  awayTeam,
  country,
  league,
  bets
) => {
  if (!homeTeam || !awayTeam || !bets || bets.length === 0) return 5;

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

  if (matchups.length === 0) return 5;

  const wins = matchups.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("win")
  ).length;
  const losses = matchups.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("loss")
  ).length;
  const total = wins + losses;

  if (total === 0) return 5;

  const winRate = (wins / total) * 100;

  let confidence = 5;
  if (winRate >= 80) confidence = 9;
  else if (winRate >= 70) confidence = 8;
  else if (winRate >= 60) confidence = 7;
  else if (winRate >= 50) confidence = 6;
  else if (winRate >= 40) confidence = 4;
  else confidence = 3;

  // Adjust for sample size
  if (total < 2) confidence = Math.max(3, confidence - 2);
  else if (total < 3) confidence = Math.max(4, confidence - 1);

  return Math.min(10, Math.max(1, confidence));
};

/**
 * Calculates position confidence based on league positions
 * @param {string} homePosition - Home team position
 * @param {string} awayPosition - Away team position
 * @param {string} teamIncluded - Team being bet on
 * @param {string} homeTeam - Home team name
 * @param {string} awayTeam - Away team name
 * @param {Object} betData - Bet data object
 * @returns {number} Position confidence score (0-10)
 */
export const calculatePositionConfidence = (
  homePosition,
  awayPosition,
  teamIncluded,
  homeTeam,
  awayTeam,
  betData
) => {
  if (!homePosition || !awayPosition || !teamIncluded) return 5;

  const homePos = parseInt(homePosition) || 0;
  const awayPos = parseInt(awayPosition) || 0;

  if (homePos === 0 || awayPos === 0) return 5;

  const isBettingOnHomeTeam = teamIncluded
    .toLowerCase()
    .includes(homeTeam?.toLowerCase() || "");
  const isBettingOnAwayTeam = teamIncluded
    .toLowerCase()
    .includes(awayTeam?.toLowerCase() || "");

  let confidence = 5;

  if (isBettingOnHomeTeam) {
    // Betting on home team
    if (homePos <= 3) confidence = 8; // Top 3
    else if (homePos <= 6) confidence = 7; // Top 6
    else if (homePos <= 10) confidence = 6; // Top half
    else if (homePos <= 15) confidence = 4; // Bottom half
    else confidence = 3; // Bottom 3
  } else if (isBettingOnAwayTeam) {
    // Betting on away team
    if (awayPos <= 3) confidence = 8;
    else if (awayPos <= 6) confidence = 7;
    else if (awayPos <= 10) confidence = 6;
    else if (awayPos <= 15) confidence = 4;
    else confidence = 3;
  }

  // Adjust based on opponent position
  const opponentPos = isBettingOnHomeTeam ? awayPos : homePos;
  if (opponentPos <= 3)
    confidence = Math.max(3, confidence - 1); // Strong opponent
  else if (opponentPos >= 15) confidence = Math.min(10, confidence + 1); // Weak opponent

  return Math.min(10, Math.max(1, confidence));
};

/**
 * Calculates home/away confidence based on team performance in home vs away games
 * @param {string} teamName - Name of the team
 * @param {string} country - Country of the team
 * @param {string} league - League of the team
 * @param {boolean} isHomeGame - Whether it's a home game for the team
 * @param {Array} bets - Array of all bets
 * @returns {number} Home/away confidence score (0-10)
 */
export const calculateHomeAwayConfidence = (
  teamName,
  country,
  league,
  isHomeGame,
  bets
) => {
  if (!teamName || !bets || bets.length === 0) return 5;

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

  if (teamBets.length === 0) return 5;

  // Filter by home/away based on team position
  const homeAwayBets = teamBets.filter((bet) => {
    const isBettingOnHomeTeam = bet.TEAM_INCLUDED?.toLowerCase().includes(
      bet.HOME_TEAM?.toLowerCase() || ""
    );
    return isHomeGame ? isBettingOnHomeTeam : !isBettingOnHomeTeam;
  });

  if (homeAwayBets.length === 0) return 5;

  const wins = homeAwayBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("win")
  ).length;
  const losses = homeAwayBets.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("loss")
  ).length;
  const total = wins + losses;

  if (total === 0) return 5;

  const winRate = (wins / total) * 100;

  let confidence = 5;
  if (winRate >= 75) confidence = 8;
  else if (winRate >= 65) confidence = 7;
  else if (winRate >= 55) confidence = 6;
  else if (winRate >= 45) confidence = 5;
  else if (winRate >= 35) confidence = 4;
  else confidence = 3;

  // Adjust for sample size
  if (total < 3) confidence = Math.max(3, confidence - 1);

  return Math.min(10, Math.max(1, confidence));
};

/**
 * Calculates recent form confidence based on last 5 games performance
 * @param {Object} bet - Bet object with last 5 games data
 * @returns {number} Recent form confidence score (0-10)
 */
export const calculateRecentFormConfidence = (bet) => {
  if (!bet) return 5;

  // Determine which team we're betting on
  const isBettingOnHomeTeam =
    bet.team_included &&
    bet.home_team &&
    bet.team_included.toLowerCase().includes(bet.home_team.toLowerCase());

  // Get the last 5 games data for the team we're betting on
  let wins, draws, losses;

  // Debug: Log available properties in bet object
  console.log("Available bet properties:", Object.keys(bet));
  console.log("Recent form data found:", {
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
    console.log("No recent form data available, returning neutral score");
    return 5;
  }

  // Calculate recent form score (wins + 0.5*draws) / totalGames
  const recentFormScore = (wins + 0.5 * draws) / totalGames;

  // Convert to confidence score (0-10 scale)
  let confidence = 5; // Start with neutral

  if (recentFormScore >= 0.8) confidence = 9; // 4+ wins out of 5
  else if (recentFormScore >= 0.7) confidence = 8; // 3.5+ wins out of 5
  else if (recentFormScore >= 0.6) confidence = 7; // 3+ wins out of 5
  else if (recentFormScore >= 0.5) confidence = 6; // 2.5+ wins out of 5
  else if (recentFormScore >= 0.4) confidence = 4; // 2+ wins out of 5
  else if (recentFormScore >= 0.3) confidence = 3; // 1.5+ wins out of 5
  else confidence = 2; // Less than 1.5 wins out of 5

  // Adjust for sample size (if less than 5 games)
  if (totalGames < 5) {
    const sampleSizePenalty = (5 - totalGames) * 0.5;
    confidence = Math.max(3, confidence - sampleSizePenalty);
  }

  console.log(
    `Recent form for ${
      isBettingOnHomeTeam ? bet.home_team : bet.away_team
    }: ${wins}W-${draws}D-${losses}L (${recentFormScore.toFixed(
      2
    )} score, ${confidence}/10 confidence)`
  );

  return Math.min(10, Math.max(1, confidence));
};

/**
 * Calculates overall confidence score from individual components
 * @param {Object} bet - Bet object with all necessary data
 * @returns {number} Overall confidence score (0-10)
 */
export const calculateConfidenceScore = (bet) => {
  console.log(`=== CALCULATING CONFIDENCE FOR: ${bet.team_included} ===`);
  console.log(`Bet object:`, bet);

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

  // Calculate weighted average with recent form included
  const weights = {
    team: 0.2, // Reduced from 0.25 to make room for recent form
    recentForm: 0.2, // New: Recent form gets 20% weight
    league: 0.15, // Reduced from 0.2
    odds: 0.15,
    matchup: 0.15,
    position: 0.1, // Reduced from 0.15
    homeAway: 0.05, // Reduced from 0.1
  };

  const weightedScore =
    teamConfidence * weights.team +
    recentFormConfidence * weights.recentForm +
    leagueConfidence * weights.league +
    oddsConfidence * weights.odds +
    matchupConfidence * weights.matchup +
    positionConfidence * weights.position +
    homeAwayConfidence * weights.homeAway;

  const finalScore = Math.round(weightedScore * 10) / 10;

  console.log(`Confidence breakdown:`, {
    team: teamConfidence,
    recentForm: recentFormConfidence,
    league: leagueConfidence,
    odds: oddsConfidence,
    matchup: matchupConfidence,
    position: positionConfidence,
    homeAway: homeAwayConfidence,
    final: finalScore,
  });

  return Math.min(10, Math.max(1, finalScore));
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

  return {
    team: Math.round(teamConfidence),
    recentForm: Math.round(recentFormConfidence),
    league: Math.round(leagueConfidence),
    odds: Math.round(oddsConfidence),
    matchup: Math.round(matchupConfidence),
    position: Math.round(positionConfidence),
    homeAway: Math.round(homeAwayConfidence),
  };
};

/**
 * Gets confidence label and styling based on confidence score
 * @param {number} confidenceScore - Confidence score (0-10)
 * @returns {Object} Confidence label object with emoji, label, and color
 */
export const getConfidenceLabel = (confidenceScore) => {
  if (confidenceScore >= 8) {
    return {
      emoji: "🔥",
      label: "Very High",
      color: "bg-red-100 text-red-800",
    };
  } else if (confidenceScore >= 7) {
    return {
      emoji: "💪",
      label: "High",
      color: "bg-orange-100 text-orange-800",
    };
  } else if (confidenceScore >= 6) {
    return {
      emoji: "👍",
      label: "Good",
      color: "bg-yellow-100 text-yellow-800",
    };
  } else if (confidenceScore >= 5) {
    return {
      emoji: "🤔",
      label: "Moderate",
      color: "bg-blue-100 text-blue-800",
    };
  } else if (confidenceScore >= 4) {
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
