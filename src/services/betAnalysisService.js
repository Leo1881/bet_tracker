import { calculateProbabilities } from "../utils/mathUtils";

/**
 * Analyze new bets and generate recommendations
 * @param {Array} newBets - Array of new bets to analyze
 * @param {Array} bets - Historical bets data
 * @param {Array} blacklistedTeams - Array of blacklisted teams
 * @param {Function} getDeduplicatedBetsForAnalysis - Function to get deduplicated bets
 * @param {Function} calculateConfidence - Function to calculate confidence score
 * @param {Function} getBreakdown - Function to get confidence breakdown
 * @param {Function} getLabel - Function to get confidence label
 * @param {Function} getRecommendation - Function to get betting recommendation
 * @param {Function} generateBetRecommendations - Function to generate bet recommendations
 * @param {Function} storePredictions - Function to store predictions
 * @param {Function} storeRecommendations - Function to store recommendations
 * @param {Function} analyzeScoringPatterns - Function to analyze scoring patterns
 * @returns {Object} Analysis results and recommendations
 */
export const analyzeNewBets = async (
  newBets,
  bets,
  blacklistedTeams,
  getDeduplicatedBetsForAnalysis,
  calculateConfidence,
  getBreakdown,
  getLabel,
  getRecommendation,
  generateBetRecommendations,
  storePredictions,
  storeRecommendations,
  analyzeScoringPatterns
) => {
  console.log("=== STARTING BET ANALYSIS ===");
  try {
    // First, run scoring analysis to get historical scoring patterns
    console.log("About to call analyzeScoringPatterns...");
    let scoringData = [];
    try {
      scoringData = await analyzeScoringPatterns();
      console.log("analyzeScoringPatterns completed successfully");
      console.log("Scoring data returned:", scoringData.length, "teams");
    } catch (scoringError) {
      console.error("Error in analyzeScoringPatterns:", scoringError);
    }

    if (!newBets || newBets.length === 0) {
      console.log("No new bets found or fetch failed");
      return { results: [], recommendations: [] };
    }

    // Deduplicate new bets to avoid counting multiple tickets for the same game
    const deduplicatedNewBets = getDeduplicatedNewBets(newBets);
    console.log(
      `Original new bets: ${newBets.length}, Deduplicated: ${deduplicatedNewBets.length}`
    );

    // Analyze each deduplicated new bet
    const results = deduplicatedNewBets.map((newBet) => {
      // Debug: Check if BET_ID is in the newBet object
      if (deduplicatedNewBets.indexOf(newBet) === 0) {
        console.log("First newBet object:", newBet);
        console.log("BET_ID in newBet:", newBet.BET_ID);
      }

      const teamName = newBet.TEAM_INCLUDED;
      const country = newBet.COUNTRY;
      const league = newBet.LEAGUE;

      // Check if team is blacklisted (any country/league)
      const isBlacklisted = (blacklistedTeams || []).some(
        (blacklistedTeam) =>
          (
            blacklistedTeam.TEAM_NAME || blacklistedTeam.team_name
          )?.toLowerCase() === (teamName || "").toLowerCase()
      );

      // Get historical performance for this team (EXACT country + league match only)
      // Use deduplicated bets to avoid counting multiple tickets for the same game
      const deduplicatedBets = getDeduplicatedBetsForAnalysis;
      const teamHistory = deduplicatedBets.filter((bet) => {
        const betTeamIncluded = bet.TEAM_INCLUDED?.toLowerCase() || "";
        const betCountry = bet.COUNTRY?.toLowerCase() || "";
        const betLeague = bet.LEAGUE?.toLowerCase() || "";

        // Match by exact team name, country, and league
        return (
          betTeamIncluded === (teamName || "").toLowerCase() &&
          betCountry === (country || "").toLowerCase() &&
          betLeague === (league || "").toLowerCase()
        );
      });

      // Calculate historical stats with detailed bet information
      const wins = teamHistory.filter((bet) =>
        bet.RESULT?.toLowerCase().includes("win")
      );
      const losses = teamHistory.filter((bet) =>
        bet.RESULT?.toLowerCase().includes("loss")
      );
      const total = wins.length + losses.length;
      const winRate = total > 0 ? ((wins.length / total) * 100).toFixed(1) : 0;

      // Create detailed history strings with competition context
      // Deduplicate win/loss details to avoid showing multiple tickets for the same bet type
      const uniqueWinDetails = new Set();
      wins.forEach((bet) => {
        const betType = bet.BET_TYPE || "Unknown";
        const betSelection = bet.BET_SELECTION || "Unknown";
        const competition = `${bet.COUNTRY} ${bet.LEAGUE}`;
        const detail = `${betType}: ${betSelection} (${competition})`;
        uniqueWinDetails.add(detail);
      });

      const uniqueLossDetails = new Set();
      losses.forEach((bet) => {
        const betType = bet.BET_TYPE || "Unknown";
        const betSelection = bet.BET_SELECTION || "Unknown";
        const competition = `${bet.COUNTRY} ${bet.LEAGUE}`;
        const detail = `${betType}: ${betSelection} (${competition})`;
        uniqueLossDetails.add(detail);
      });

      const winDetails = Array.from(uniqueWinDetails);
      const lossDetails = Array.from(uniqueLossDetails);

      // Determine which odds to use based on the team you bet on
      let betOdds = 0;
      const homeTeam = newBet.HOME_TEAM;
      const awayTeam = newBet.AWAY_TEAM;

      // If you bet on the home team, use odds1
      if (
        (teamName || "").toLowerCase().includes((homeTeam || "").toLowerCase())
      ) {
        betOdds = parseFloat(newBet.ODDS1) || 0;
      }
      // If you bet on the away team, use odds2
      else if (
        (teamName || "").toLowerCase().includes((awayTeam || "").toLowerCase())
      ) {
        betOdds = parseFloat(newBet.ODDS2) || 0;
      }
      // Fallback: use the higher odds
      else {
        betOdds = Math.max(
          parseFloat(newBet.ODDS1) || 0,
          parseFloat(newBet.ODDS2) || 0
        );
      }

      // Check for previous matchups (same two teams)
      const previousMatchups = findPreviousMatchups(
        newBet.HOME_TEAM || "",
        newBet.AWAY_TEAM || "",
        newBet.COUNTRY || "",
        newBet.LEAGUE || "",
        getDeduplicatedBetsForAnalysis
      );

      // Calculate confidence score
      console.log("ABOUT TO CALL calculateConfidenceScore for:", teamName);
      const confidenceScore = calculateConfidence({
        team_included: teamName || "",
        country: country || "",
        league: league || "",
        odds1: parseFloat(newBet.ODDS1) || 0,
        bet_type: newBet.BET_TYPE || "",
        home_team: newBet.HOME_TEAM || "",
        away_team: newBet.AWAY_TEAM || "",
        home_team_position: newBet.HOME_TEAM_POSITION || "",
        away_team_position: newBet.AWAY_TEAM_POSITION || "",
        HOME_TEAM_POSITION_NUMBER: newBet.HOME_TEAM_POSITION_NUMBER || "",
        AWAY_TEAM_POSITION_NUMBER: newBet.AWAY_TEAM_POSITION_NUMBER || "",
        HOME_TEAM_POINTS_FROM_TOP: newBet.HOME_TEAM_POINTS_FROM_TOP || "",
        AWAY_TEAM_POINTS_FROM_TOP: newBet.AWAY_TEAM_POINTS_FROM_TOP || "",
        HOME_TEAM_POINTS_FROM_BOTTOM: newBet.HOME_TEAM_POINTS_FROM_BOTTOM || "",
        AWAY_TEAM_POINTS_FROM_BOTTOM: newBet.AWAY_TEAM_POINTS_FROM_BOTTOM || "",
        TOTAL_TEAMS_IN_LEAGUE: newBet.TOTAL_TEAMS_IN_LEAGUE || "",
        HOME_TEAM_GAMES_PLAYED: newBet.HOME_TEAM_GAMES_PLAYED || "",
        AWAY_TEAM_GAMES_PLAYED: newBet.AWAY_TEAM_GAMES_PLAYED || "",
        LEAGUE: newBet.LEAGUE || "",
      });

      const confidenceBreakdown = getBreakdown({
        team_included: teamName || "",
        country: country || "",
        league: league || "",
        odds1: parseFloat(newBet.ODDS1) || 0,
        bet_type: newBet.BET_TYPE || "",
        home_team: newBet.HOME_TEAM || "",
        away_team: newBet.AWAY_TEAM || "",
        home_team_position: newBet.HOME_TEAM_POSITION || "",
        away_team_position: newBet.AWAY_TEAM_POSITION || "",
        HOME_TEAM_POSITION_NUMBER: newBet.HOME_TEAM_POSITION_NUMBER || "",
        AWAY_TEAM_POSITION_NUMBER: newBet.AWAY_TEAM_POSITION_NUMBER || "",
        HOME_TEAM_POINTS_FROM_TOP: newBet.HOME_TEAM_POINTS_FROM_TOP || "",
        AWAY_TEAM_POINTS_FROM_TOP: newBet.AWAY_TEAM_POINTS_FROM_TOP || "",
        HOME_TEAM_POINTS_FROM_BOTTOM: newBet.HOME_TEAM_POINTS_FROM_BOTTOM || "",
        AWAY_TEAM_POINTS_FROM_BOTTOM: newBet.AWAY_TEAM_POINTS_FROM_BOTTOM || "",
        TOTAL_TEAMS_IN_LEAGUE: newBet.TOTAL_TEAMS_IN_LEAGUE || "",
        HOME_TEAM_GAMES_PLAYED: newBet.HOME_TEAM_GAMES_PLAYED || "",
        AWAY_TEAM_GAMES_PLAYED: newBet.AWAY_TEAM_GAMES_PLAYED || "",
        LEAGUE: newBet.LEAGUE || "",
        bets: bets || [], // Add the bets array for momentum calculation
      });

      const confidenceLabel = getLabel(confidenceScore);

      // Determine recommendation based on confidence score
      let recommendation = "BET";
      let recommendationColor = "text-green-400";

      if (isBlacklisted) {
        recommendation = "AVOID (Blacklisted)";
        recommendationColor = "text-red-400";
      } else {
        recommendation = getRecommendation(
          confidenceScore,
          teamName,
          newBet.HOME_TEAM,
          newBet.AWAY_TEAM,
          confidenceBreakdown,
          newBet
        );

        // Set color based on recommendation
        if (recommendation.includes("Win")) {
          recommendationColor = "text-green-400";
        } else if (recommendation.includes("Double Chance")) {
          recommendationColor = "text-yellow-400";
        } else if (recommendation.includes("Avoid")) {
          recommendationColor = "text-red-400";
        }
      }

      // Debug logging
      console.log(
        `Bet: ${teamName} - Confidence: ${confidenceScore} - Recommendation: ${recommendation}`
      );

      // Get unique competitions where this team has history
      const competitions = [
        ...new Set(teamHistory.map((bet) => `${bet.COUNTRY} ${bet.LEAGUE}`)),
      ];

      // Calculate probabilities using the new ODDSX column
      const probabilities = calculateProbabilities(
        parseFloat(newBet.ODDS1) || 0,
        parseFloat(newBet.ODDSX) || 0,
        parseFloat(newBet.ODDS2) || 0
      );

      // Get scoring recommendation
      const scoringRecommendation = getScoringRecommendation(
        newBet.HOME_TEAM || "",
        newBet.AWAY_TEAM || "",
        newBet.LEAGUE || "",
        newBet.LEAGUE || "",
        scoringData
      );

      return {
        ...newBet,
        betOdds,
        isBlacklisted,
        historicalBets: total,
        historicalWins: wins.length,
        historicalLosses: losses.length,
        winRate,
        recommendation,
        recommendationColor,
        winDetails,
        lossDetails,
        previousMatchups,
        hasHistory: total > 0,
        competitions: competitions,
        confidenceScore,
        confidenceBreakdown,
        confidenceLabel,
        probabilities,
        scoringRecommendation,
      };
    });

    // Automatically store predictions
    if (results.length > 0) {
      storePredictions(results);
    }

    // Store recommendations for accuracy tracking
    await storeRecommendations(results);

    return { results };
  } catch (error) {
    console.error("Error analyzing new bets:", error);
    return { results: [] };
  }
};

/**
 * Find previous matchups between two teams
 * @param {string} homeTeam - Home team name
 * @param {string} awayTeam - Away team name
 * @param {string} country - Country name
 * @param {string} league - League name
 * @param {Function} getDeduplicatedBetsForAnalysis - Function to get deduplicated bets
 * @returns {Array} Array of previous matchups
 */
export const findPreviousMatchups = (
  homeTeam,
  awayTeam,
  country,
  league,
  getDeduplicatedBetsForAnalysis
) => {
  // Create a normalized matchup key (alphabetical order of teams)
  const team1 = homeTeam.toLowerCase();
  const team2 = awayTeam.toLowerCase();
  const sortedTeams = [team1, team2].sort();
  const matchupKey = `${sortedTeams[0]}-${sortedTeams[1]}`;

  // Find all bets involving these two teams in the same country and league
  // Use deduplicated bets to avoid counting multiple tickets for the same game
  const deduplicatedBets = getDeduplicatedBetsForAnalysis;
  const matchups = deduplicatedBets.filter((bet) => {
    const betCountry = bet.COUNTRY?.toLowerCase() || "";
    const betLeague = bet.LEAGUE?.toLowerCase() || "";
    const betHomeTeam = bet.HOME_TEAM?.toLowerCase() || "";
    const betAwayTeam = bet.AWAY_TEAM?.toLowerCase() || "";
    const betResult = bet.RESULT?.toLowerCase() || "";

    // Check if it's the same country and league
    if (
      betCountry !== country.toLowerCase() ||
      betLeague !== league.toLowerCase()
    ) {
      return false;
    }

    // Check if it involves the same two teams (regardless of home/away)
    const betSortedTeams = [betHomeTeam, betAwayTeam].sort();
    const betMatchupKey = `${betSortedTeams[0]}-${betSortedTeams[1]}`;

    // Only include bets with actual results (Win or Loss)
    const hasResult = betResult.includes("win") || betResult.includes("loss");

    return betMatchupKey === matchupKey && hasResult;
  });

  return matchups.map((bet) => ({
    date: bet.DATE,
    homeTeam: bet.HOME_TEAM,
    awayTeam: bet.AWAY_TEAM,
    betType: bet.BET_TYPE,
    betSelection: bet.BET_SELECTION,
    teamIncluded: bet.TEAM_INCLUDED,
    result: bet.RESULT,
    odds1: bet.ODDS1,
    odds2: bet.ODDS2,
  }));
};

/**
 * Analyze scoring patterns from historical data
 * @param {Array} bets - Historical bets data
 * @param {Function} setScoringAnalysis - Function to set scoring analysis state
 * @param {Function} setScoringAnalysisLoading - Function to set loading state
 * @returns {Array} Scoring analysis results
 */
export const analyzeScoringPatterns = async (
  bets,
  setScoringAnalysis,
  setScoringAnalysisLoading
) => {
  console.log("=== STARTING SCORING ANALYSIS ===");
  try {
    setScoringAnalysisLoading(true);

    // Get completed historical bets with scores and results
    const completedBetsWithScores = (bets || []).filter(
      (bet) =>
        bet.HOME_SCORE !== null &&
        bet.HOME_SCORE !== undefined &&
        bet.AWAY_SCORE !== null &&
        bet.AWAY_SCORE !== undefined &&
        bet.RESULT &&
        bet.RESULT.trim() !== "" &&
        (bet.RESULT.toLowerCase().includes("win") ||
          bet.RESULT.toLowerCase().includes("loss"))
    );

    console.log("Total bets:", (bets || []).length);
    console.log("Sample bet fields:", Object.keys((bets || [])[0] || {}));
    console.log(
      "Sample bet with result:",
      (bets || []).find((bet) => bet.RESULT && bet.RESULT.trim() !== "")
    );
    console.log("Completed bets with scores:", completedBetsWithScores.length);
    console.log("Sample completed bet:", completedBetsWithScores[0]);

    if (completedBetsWithScores.length === 0) {
      console.log("No completed bets with scores found!");
      setScoringAnalysis([]);
      return [];
    }

    // Deduplicate games first (same teams, same date = same game)
    const uniqueGames = new Map();
    completedBetsWithScores.forEach((bet) => {
      const homeTeam = bet.HOME_TEAM?.trim();
      const awayTeam = bet.AWAY_TEAM?.trim();
      const date = bet.DATE?.trim();
      const league = bet.LEAGUE?.trim();
      const country = bet.COUNTRY?.trim();
      const homeScore = parseInt(bet.HOME_SCORE);
      const awayScore = parseInt(bet.AWAY_SCORE);

      if (
        !homeTeam ||
        !awayTeam ||
        !date ||
        !league ||
        !country ||
        isNaN(homeScore) ||
        isNaN(awayScore)
      ) {
        return;
      }

      // Create unique game key: DATE + HOME_TEAM + AWAY_TEAM + COUNTRY + LEAGUE
      const gameKey = `${date}_${homeTeam}_${awayTeam}_${country}_${league}`;

      // Only add if this unique game doesn't exist yet
      if (!uniqueGames.has(gameKey)) {
        uniqueGames.set(gameKey, {
          homeTeam,
          awayTeam,
          date,
          league,
          country,
          homeScore,
          awayScore,
        });
      }
    });

    console.log(
      "Unique games found:",
      uniqueGames.size,
      "out of",
      completedBetsWithScores.length,
      "bets"
    );

    // Analyze by team and league using unique games only
    const teamLeagueMap = new Map();

    uniqueGames.forEach((game) => {
      const homeTeam = game.homeTeam;
      const awayTeam = game.awayTeam;
      const league = game.league;
      const country = game.country;
      const homeScore = game.homeScore;
      const awayScore = game.awayScore;

      // No need to validate again - already validated when creating unique games

      const totalGoals = homeScore + awayScore;
      const hasOver1_5 = totalGoals > 1;
      const hasOver2_5 = totalGoals > 2;
      const hasOver3_5 = totalGoals > 3;

      // Analyze home team
      const homeKey = `${homeTeam}-${country}-${league}`;
      if (!teamLeagueMap.has(homeKey)) {
        teamLeagueMap.set(homeKey, {
          team: homeTeam,
          country: country,
          league: league,
          totalGames: 0,
          totalGoals: 0,
          avgGoals: 0,
          totalGoalsScored: 0,
          avgGoalsScored: 0,
          totalGoalsConceded: 0,
          avgGoalsConceded: 0,
          over1_5Count: 0,
          over2_5Count: 0,
          over3_5Count: 0,
          over1_5Rate: 0,
          over2_5Rate: 0,
          over3_5Rate: 0,
          homeGames: 0,
          awayGames: 0,
          homeGoalsScored: 0,
          awayGoalsScored: 0,
          homeGoalsConceded: 0,
          awayGoalsConceded: 0,
        });
      }
      const homeStats = teamLeagueMap.get(homeKey);
      homeStats.totalGames++;
      homeStats.totalGoals += totalGoals;
      homeStats.totalGoalsScored += homeScore; // Home team's own goals scored
      homeStats.homeGoalsScored += homeScore;
      homeStats.totalGoalsConceded += awayScore; // Home team concedes away team's goals
      homeStats.homeGoalsConceded += awayScore;
      homeStats.over1_5Count += hasOver1_5 ? 1 : 0;
      homeStats.over2_5Count += hasOver2_5 ? 1 : 0;
      homeStats.over3_5Count += hasOver3_5 ? 1 : 0;
      homeStats.homeGames++;

      // Analyze away team
      const awayKey = `${awayTeam}-${country}-${league}`;
      if (!teamLeagueMap.has(awayKey)) {
        teamLeagueMap.set(awayKey, {
          team: awayTeam,
          country: country,
          league: league,
          totalGames: 0,
          totalGoals: 0,
          avgGoals: 0,
          totalGoalsScored: 0,
          avgGoalsScored: 0,
          totalGoalsConceded: 0,
          avgGoalsConceded: 0,
          over1_5Count: 0,
          over2_5Count: 0,
          over3_5Count: 0,
          over1_5Rate: 0,
          over2_5Rate: 0,
          over3_5Rate: 0,
          homeGames: 0,
          awayGames: 0,
          homeGoalsScored: 0,
          awayGoalsScored: 0,
          homeGoalsConceded: 0,
          awayGoalsConceded: 0,
        });
      }
      const awayStats = teamLeagueMap.get(awayKey);
      awayStats.totalGames++;
      awayStats.totalGoals += totalGoals;
      awayStats.totalGoalsScored += awayScore; // Away team's own goals scored
      awayStats.awayGoalsScored += awayScore;
      awayStats.totalGoalsConceded += homeScore; // Away team concedes home team's goals
      awayStats.awayGoalsConceded += homeScore;
      awayStats.over1_5Count += hasOver1_5 ? 1 : 0;
      awayStats.over2_5Count += hasOver2_5 ? 1 : 0;
      awayStats.over3_5Count += hasOver3_5 ? 1 : 0;
      awayStats.awayGames++;
    });

    // Calculate averages and rates
    const analysisResults = Array.from(teamLeagueMap.values())
      .map((stats) => ({
        ...stats,
        avgGoals:
          stats.totalGames > 0
            ? (stats.totalGoals / stats.totalGames).toFixed(2)
            : 0,
        avgGoalsScored:
          stats.totalGames > 0
            ? (stats.totalGoalsScored / stats.totalGames).toFixed(2)
            : 0,
        homeAvgGoalsScored:
          stats.homeGames > 0
            ? (stats.homeGoalsScored / stats.homeGames).toFixed(2)
            : 0,
        awayAvgGoalsScored:
          stats.awayGames > 0
            ? (stats.awayGoalsScored / stats.awayGames).toFixed(2)
            : 0,
        avgGoalsConceded:
          stats.totalGames > 0
            ? (stats.totalGoalsConceded / stats.totalGames).toFixed(2)
            : 0,
        homeAvgGoalsConceded:
          stats.homeGames > 0
            ? (stats.homeGoalsConceded / stats.homeGames).toFixed(2)
            : 0,
        awayAvgGoalsConceded:
          stats.awayGames > 0
            ? (stats.awayGoalsConceded / stats.awayGames).toFixed(2)
            : 0,
        over1_5Rate:
          stats.totalGames > 0
            ? ((stats.over1_5Count / stats.totalGames) * 100).toFixed(1)
            : 0,
        over2_5Rate:
          stats.totalGames > 0
            ? ((stats.over2_5Count / stats.totalGames) * 100).toFixed(1)
            : 0,
        over3_5Rate:
          stats.totalGames > 0
            ? ((stats.over3_5Count / stats.totalGames) * 100).toFixed(1)
            : 0,
      }))
      .sort((a, b) => parseFloat(b.avgGoals) - parseFloat(a.avgGoals)); // Sort by average goals descending

    console.log("Scoring analysis results:", analysisResults);
    console.log("Sample team stats:", analysisResults[0]);

    setScoringAnalysis(analysisResults);
    console.log("=== SCORING ANALYSIS COMPLETE ===");
    return analysisResults; // Return the results directly
  } catch (error) {
    console.error("Error analyzing scoring patterns:", error);
    return []; // Return empty array on error
  } finally {
    setScoringAnalysisLoading(false);
  }
};

/**
 * Get scoring recommendation for a match
 * @param {string} homeTeam - Home team name
 * @param {string} awayTeam - Away team name
 * @param {string} homeLeague - Home team league
 * @param {string} awayLeague - Away team league
 * @param {Array} scoringData - Scoring analysis data
 * @returns {Object|null} Scoring recommendation
 */
export const getScoringRecommendation = (
  homeTeam,
  awayTeam,
  homeLeague,
  awayLeague,
  scoringData = []
) => {
  if (!homeTeam || !awayTeam) return null;

  console.log(
    `Getting scoring recommendation for ${homeTeam} vs ${awayTeam} in ${homeLeague}`
  );
  console.log("Available scoring analysis:", scoringData.length, "teams");

  const homeStats = scoringData.find(
    (stat) =>
      stat.team.toLowerCase() === homeTeam.toLowerCase() &&
      stat.league.toLowerCase() === homeLeague.toLowerCase()
  );

  const awayStats = scoringData.find(
    (stat) =>
      stat.team.toLowerCase() === awayTeam.toLowerCase() &&
      stat.league.toLowerCase() === awayLeague.toLowerCase()
  );

  // Get league averages as fallback
  const homeLeagueStats = scoringData.filter(
    (stat) => stat.league.toLowerCase() === homeLeague.toLowerCase()
  );
  const awayLeagueStats = scoringData.filter(
    (stat) => stat.league.toLowerCase() === awayLeague.toLowerCase()
  );

  const homeLeagueAvg =
    homeLeagueStats.length > 0
      ? homeLeagueStats.reduce(
          (sum, stat) => sum + parseFloat(stat.over2_5Rate),
          0
        ) / homeLeagueStats.length
      : 0;
  const awayLeagueAvg =
    awayLeagueStats.length > 0
      ? awayLeagueStats.reduce(
          (sum, stat) => sum + parseFloat(stat.over2_5Rate),
          0
        ) / awayLeagueStats.length
      : 0;

  // Calculate recommendation
  let homeRate = homeStats ? parseFloat(homeStats.over2_5Rate) : homeLeagueAvg;
  let awayRate = awayStats ? parseFloat(awayStats.over2_5Rate) : awayLeagueAvg;

  // If both teams have data, average them
  if (homeStats && awayStats) {
    const avgRate = (homeRate + awayRate) / 2;
    console.log(
      `Both teams found: ${homeTeam} (${homeRate}%), ${awayTeam} (${awayRate}%), Avg: ${avgRate}%`
    );
    if (avgRate >= 70)
      return { type: "Strong Over 1.5", confidence: "high", rate: avgRate };
    if (avgRate >= 55)
      return {
        type: "Moderate Over 1.5",
        confidence: "medium",
        rate: avgRate,
      };
    if (avgRate >= 40)
      return { type: "Consider Over 0.5", confidence: "low", rate: avgRate };
    return { type: "Low Scoring Expected", confidence: "low", rate: avgRate };
  }

  // If only one team has data, use that + league average
  if (homeStats || awayStats) {
    const availableRate = homeStats ? homeRate : awayRate;
    const leagueAvg = homeStats ? awayLeagueAvg : homeLeagueAvg;
    const avgRate = (availableRate + leagueAvg) / 2;

    if (avgRate >= 70)
      return { type: "Strong Over 1.5", confidence: "medium", rate: avgRate };
    if (avgRate >= 55)
      return {
        type: "Moderate Over 1.5",
        confidence: "medium",
        rate: avgRate,
      };
    if (avgRate >= 40)
      return { type: "Consider Over 0.5", confidence: "low", rate: avgRate };
    return { type: "Low Scoring Expected", confidence: "low", rate: avgRate };
  }

  // If neither team has data, use league average
  const leagueAvg = (homeLeagueAvg + awayLeagueAvg) / 2;
  console.log(
    `No team data found. League averages: ${homeLeague} (${homeLeagueAvg}%), ${awayLeague} (${awayLeagueAvg}%), Avg: ${leagueAvg}%`
  );
  if (leagueAvg >= 70)
    return { type: "Strong Over 1.5", confidence: "low", rate: leagueAvg };
  if (leagueAvg >= 55)
    return { type: "Moderate Over 1.5", confidence: "low", rate: leagueAvg };
  if (leagueAvg >= 40)
    return { type: "Consider Over 0.5", confidence: "low", rate: leagueAvg };
  return { type: "Low Scoring Expected", confidence: "low", rate: leagueAvg };
};

/**
 * Deduplicate new bets to avoid counting multiple tickets for the same game
 * @param {Array} newBets - Array of new bets
 * @returns {Array} Deduplicated bets
 */
export const getDeduplicatedNewBets = (newBets) => {
  const uniqueBets = new Map();

  newBets.forEach((bet) => {
    // Create a unique key based on the game details (excluding BET_ID)
    const key = `${bet.DATE}_${bet.HOME_TEAM}_${bet.AWAY_TEAM}_${bet.COUNTRY}_${bet.LEAGUE}_${bet.BET_TYPE}_${bet.BET_SELECTION}_${bet.TEAM_INCLUDED}`;

    if (!uniqueBets.has(key)) {
      uniqueBets.set(key, bet);
    }
  });

  return Array.from(uniqueBets.values());
};
