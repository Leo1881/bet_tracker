import { calculateProbabilities } from "../utils/mathUtils";
import { getPositionGapIndicator } from "./teamHistoryService";
import { debugLog } from "../utils/debug";

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
  debugLog("=== STARTING BET ANALYSIS ===");
  try {
    // First, run scoring analysis to get historical scoring patterns
    debugLog("About to call analyzeScoringPatterns...");
    let scoringData = [];
    try {
      scoringData = await analyzeScoringPatterns();
      debugLog("analyzeScoringPatterns completed successfully");
      debugLog("Scoring data returned:", scoringData.length, "teams");
    } catch (scoringError) {
      console.error("Error in analyzeScoringPatterns:", scoringError);
    }

    if (!newBets || newBets.length === 0) {
      debugLog("No new bets found or fetch failed");
      return { results: [], recommendations: [] };
    }

    // Deduplicate new bets to avoid counting multiple tickets for the same game
    const deduplicatedNewBets = getDeduplicatedNewBets(newBets);
    debugLog(
      `Original new bets: ${newBets.length}, Deduplicated: ${deduplicatedNewBets.length}`
    );

    // Analyze each deduplicated new bet
    const results = deduplicatedNewBets.map((newBet) => {
      // Debug: Check if BET_ID is in the newBet object
      if (deduplicatedNewBets.indexOf(newBet) === 0) {
        debugLog("First newBet object:", newBet);
        debugLog("BET_ID in newBet:", newBet.BET_ID);
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
      debugLog("ABOUT TO CALL calculateConfidenceScore for:", teamName);
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
      debugLog(
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

      // Position gap (home vs away in table, relative to league size)
      const positionGap = getPositionGapIndicator(
        newBet.HOME_TEAM_POSITION_NUMBER,
        newBet.AWAY_TEAM_POSITION_NUMBER,
        newBet.TOTAL_TEAMS_IN_LEAGUE
      );

      return {
        ...newBet,
        betOdds,
        isBlacklisted,
        positionGap,
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
  debugLog("=== STARTING SCORING ANALYSIS ===");
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

    debugLog("Total bets:", (bets || []).length);
    debugLog("Sample bet fields:", Object.keys((bets || [])[0] || {}));
    debugLog(
      "Sample bet with result:",
      (bets || []).find((bet) => bet.RESULT && bet.RESULT.trim() !== "")
    );
    debugLog("Completed bets with scores:", completedBetsWithScores.length);
    debugLog("Sample completed bet:", completedBetsWithScores[0]);

    if (completedBetsWithScores.length === 0) {
      debugLog("No completed bets with scores found!");
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

    debugLog(
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

    debugLog("Scoring analysis results:", analysisResults);
    debugLog("Sample team stats:", analysisResults[0]);

    setScoringAnalysis(analysisResults);
    debugLog("=== SCORING ANALYSIS COMPLETE ===");
    return analysisResults; // Return the results directly
  } catch (error) {
    console.error("Error analyzing scoring patterns:", error);
    return []; // Return empty array on error
  } finally {
    setScoringAnalysisLoading(false);
  }
};

/**
 * Calculate Wilson Score confidence interval
 * @param {number} wins - Number of wins
 * @param {number} total - Total number of games
 * @returns {number} Wilson Score (0-1)
 */
const calculateWilsonScore = (wins, total) => {
  if (total === 0) return 0;

  const n = total;
  const p = wins / total;
  const z = 1.96; // 95% confidence level

  return (
    (p +
      (z * z) / (2 * n) -
      z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) /
    (1 + (z * z) / n)
  );
};

/**
 * Get confidence level based on sample size
 * @param {number} games - Number of games
 * @returns {Object} Confidence level info
 */
const getConfidenceLevel = (games) => {
  if (games >= 20) return { level: "High", multiplier: 1.0 };
  if (games >= 10) return { level: "Medium", multiplier: 0.8 };
  return { level: "Low", multiplier: 0.6 };
};

/**
 * Get scoring recommendation for a match using advanced scoring data
 * @param {string} homeTeam - Home team name
 * @param {string} awayTeam - Away team name
 * @param {string} homeLeague - Home team league
 * @param {string} awayLeague - Away team league
 * @param {Array} scoringData - Advanced scoring analysis data
 * @returns {Object|null} Comprehensive scoring recommendation
 */
export const getScoringRecommendation = (
  homeTeam,
  awayTeam,
  homeLeague,
  awayLeague,
  scoringData = []
) => {
  if (!homeTeam || !awayTeam) return null;

  debugLog(
    `Getting ADVANCED scoring recommendation for ${homeTeam} vs ${awayTeam} in ${homeLeague}`
  );
  debugLog(
    "Available advanced scoring analysis:",
    scoringData.length,
    "teams"
  );
  
  // Debug: Log if teams are found
  if (scoringData.length > 0) {
    debugLog("Sample scoring data structure:", scoringData[0]);
    debugLog("Looking for home team:", homeTeam, "in league:", homeLeague);
    debugLog("Looking for away team:", awayTeam, "in league:", awayLeague);
  }

  // Find team stats with exact matching
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

  // Get league context for both teams
  const homeLeagueStats = scoringData.filter(
    (stat) => stat.league.toLowerCase() === homeLeague.toLowerCase()
  );
  const awayLeagueStats = scoringData.filter(
    (stat) => stat.league.toLowerCase() === awayLeague.toLowerCase()
  );

  // Calculate league averages for multiple metrics
  const calculateLeagueAvg = (stats, metric) => {
    if (stats.length === 0) return 0;
    return (
      stats.reduce((sum, stat) => sum + parseFloat(stat[metric] || 0), 0) /
      stats.length
    );
  };

  const homeLeagueAvg = {
    over1_5: calculateLeagueAvg(homeLeagueStats, "over1_5Rate"),
    over2_5: calculateLeagueAvg(homeLeagueStats, "over2_5Rate"),
    over3_5: calculateLeagueAvg(homeLeagueStats, "over3_5Rate"),
    avgGoals: calculateLeagueAvg(homeLeagueStats, "avgGoals"),
    avgGoalsScored: calculateLeagueAvg(homeLeagueStats, "avgGoalsScored"),
    avgGoalsConceded: calculateLeagueAvg(homeLeagueStats, "avgGoalsConceded"),
  };

  const awayLeagueAvg = {
    over1_5: calculateLeagueAvg(awayLeagueStats, "over1_5Rate"),
    over2_5: calculateLeagueAvg(awayLeagueStats, "over2_5Rate"),
    over3_5: calculateLeagueAvg(awayLeagueStats, "over3_5Rate"),
    avgGoals: calculateLeagueAvg(awayLeagueStats, "avgGoals"),
    avgGoalsScored: calculateLeagueAvg(awayLeagueStats, "avgGoalsScored"),
    avgGoalsConceded: calculateLeagueAvg(awayLeagueStats, "avgGoalsConceded"),
  };

  // Extract team data with fallbacks
  const getTeamData = (stats, leagueAvg) => {
    if (!stats) {
      // When using league averages, provide defaults for missing fields
      return {
        over1_5: leagueAvg.over1_5 || 0,
        over2_5: leagueAvg.over2_5 || 0,
        over3_5: leagueAvg.over3_5 || 0,
        avgGoals: leagueAvg.avgGoals || 0,
        avgGoalsScored: leagueAvg.avgGoalsScored || 0,
        avgGoalsConceded: leagueAvg.avgGoalsConceded || 0,
        totalGames: 0, // League average doesn't have game count
        homeGames: 0,
        awayGames: 0,
        homeOver1_5: leagueAvg.over1_5 || 0, // Use league average as fallback
        awayOver1_5: leagueAvg.over1_5 || 0,
        homeOver2_5: leagueAvg.over2_5 || 0,
        awayOver2_5: leagueAvg.over2_5 || 0,
        homeAvgGoals: leagueAvg.avgGoals || 0,
        awayAvgGoals: leagueAvg.avgGoals || 0,
        homeAvgGoalsScored: leagueAvg.avgGoalsScored || 0,
        awayAvgGoalsScored: leagueAvg.avgGoalsScored || 0,
        homeAvgGoalsConceded: leagueAvg.avgGoalsConceded || 0,
        awayAvgGoalsConceded: leagueAvg.avgGoalsConceded || 0,
      };
    }

    return {
      over1_5: parseFloat(stats.over1_5Rate || 0),
      over2_5: parseFloat(stats.over2_5Rate || 0),
      over3_5: parseFloat(stats.over3_5Rate || 0),
      avgGoals: parseFloat(stats.avgGoals || 0),
      avgGoalsScored: parseFloat(stats.avgGoalsScored || 0),
      avgGoalsConceded: parseFloat(stats.avgGoalsConceded || 0),
      totalGames: parseInt(stats.totalGames || 0),
      homeGames: parseInt(stats.homeGames || 0),
      awayGames: parseInt(stats.awayGames || 0),
      homeOver1_5: parseFloat(stats.homeOver1_5Rate || 0),
      awayOver1_5: parseFloat(stats.awayOver1_5Rate || 0),
      homeOver2_5: parseFloat(stats.homeOver2_5Rate || 0),
      awayOver2_5: parseFloat(stats.awayOver2_5Rate || 0),
      homeAvgGoals: parseFloat(stats.homeAvgGoals || 0),
      awayAvgGoals: parseFloat(stats.awayAvgGoals || 0),
      homeAvgGoalsScored: parseFloat(stats.homeAvgGoalsScored || 0),
      awayAvgGoalsScored: parseFloat(stats.awayAvgGoalsScored || 0),
      homeAvgGoalsConceded: parseFloat(stats.homeAvgGoalsConceded || 0),
      awayAvgGoalsConceded: parseFloat(stats.awayAvgGoalsConceded || 0),
    };
  };

  const homeData = getTeamData(homeStats, homeLeagueAvg);
  const awayData = getTeamData(awayStats, awayLeagueAvg);
  
  // Debug: Log what data we have
  debugLog("Home team data:", {
    found: !!homeStats,
    totalGames: homeData.totalGames,
    avgGoalsScored: homeData.avgGoalsScored,
    avgGoals: homeData.avgGoals
  });
  debugLog("Away team data:", {
    found: !!awayStats,
    totalGames: awayData.totalGames,
    avgGoalsScored: awayData.avgGoalsScored,
    avgGoals: awayData.avgGoals
  });

  // Calculate Wilson Scores for reliability
  const calculateWilsonRate = (rate, games) => {
    const wins = Math.round((rate / 100) * games);
    return calculateWilsonScore(wins, games) * 100;
  };

  // Get confidence levels
  const homeConfidence = getConfidenceLevel(homeData.totalGames);
  const awayConfidence = getConfidenceLevel(awayData.totalGames);

  // Calculate combined metrics with Wilson Score adjustment
  const combined = {
    over1_5: {
      home: homeData.over1_5,
      away: awayData.over1_5,
      homeWilson: calculateWilsonRate(homeData.over1_5, homeData.totalGames),
      awayWilson: calculateWilsonRate(awayData.over1_5, awayData.totalGames),
      avg: (homeData.over1_5 + awayData.over1_5) / 2,
      avgWilson:
        (calculateWilsonRate(homeData.over1_5, homeData.totalGames) +
          calculateWilsonRate(awayData.over1_5, awayData.totalGames)) /
        2,
    },
    over2_5: {
      home: homeData.over2_5,
      away: awayData.over2_5,
      homeWilson: calculateWilsonRate(homeData.over2_5, homeData.totalGames),
      awayWilson: calculateWilsonRate(awayData.over2_5, awayData.totalGames),
      avg: (homeData.over2_5 + awayData.over2_5) / 2,
      avgWilson:
        (calculateWilsonRate(homeData.over2_5, homeData.totalGames) +
          calculateWilsonRate(awayData.over2_5, awayData.totalGames)) /
        2,
    },
    over3_5: {
      home: homeData.over3_5,
      away: awayData.over3_5,
      homeWilson: calculateWilsonRate(homeData.over3_5, homeData.totalGames),
      awayWilson: calculateWilsonRate(awayData.over3_5, awayData.totalGames),
      avg: (homeData.over3_5 + awayData.over3_5) / 2,
      avgWilson:
        (calculateWilsonRate(homeData.over3_5, homeData.totalGames) +
          calculateWilsonRate(awayData.over3_5, awayData.totalGames)) /
        2,
    },
    goals: {
      // Expected total goals in this match = home team's avg goals scored + away team's avg goals scored
      // This gives us the expected total goals for THIS specific matchup
      // Fallback to avgGoals if avgGoalsScored is 0 (for backward compatibility)
      total: (homeData.avgGoalsScored || homeData.avgGoals || 0) + (awayData.avgGoalsScored || awayData.avgGoals || 0),
      scored: ((homeData.avgGoalsScored || homeData.avgGoals || 0) + (awayData.avgGoalsScored || awayData.avgGoals || 0)) / 2,
      conceded: (homeData.avgGoalsConceded + awayData.avgGoalsConceded) / 2,
    },
  };

  // Generate comprehensive recommendations
  const recommendations = [];

  // Over 1.5 Analysis (Most reliable)
  if (combined.over1_5.avgWilson >= 85) {
    recommendations.push({
      type: "Strong Over 1.5",
      confidence: "high",
      rate: combined.over1_5.avgWilson,
      reasoning: `Both teams average ${combined.over1_5.avgWilson.toFixed(
        1
      )}% Over 1.5 (Wilson Score)`,
      riskLevel: "Low",
    });
  } else if (combined.over1_5.avgWilson >= 70) {
    recommendations.push({
      type: "Moderate Over 1.5",
      confidence: "medium",
      rate: combined.over1_5.avgWilson,
      reasoning: `Combined Over 1.5 rate: ${combined.over1_5.avgWilson.toFixed(
        1
      )}% (Wilson Score)`,
      riskLevel: "Medium",
    });
  }

  // Over 2.5 Analysis
  if (combined.over2_5.avgWilson >= 75) {
    recommendations.push({
      type: "Strong Over 2.5",
      confidence: "high",
      rate: combined.over2_5.avgWilson,
      reasoning: `Both teams average ${combined.over2_5.avgWilson.toFixed(
        1
      )}% Over 2.5 (Wilson Score)`,
      riskLevel: "Medium",
    });
  } else if (combined.over2_5.avgWilson >= 60) {
    recommendations.push({
      type: "Consider Over 2.5",
      confidence: "medium",
      rate: combined.over2_5.avgWilson,
      reasoning: `Combined Over 2.5 rate: ${combined.over2_5.avgWilson.toFixed(
        1
      )}% (Wilson Score)`,
      riskLevel: "High",
    });
  }

  // Over 3.5 Analysis
  if (combined.over3_5.avgWilson >= 50) {
    recommendations.push({
      type: "High-Scoring Game (Over 3.5)",
      confidence: "medium",
      rate: combined.over3_5.avgWilson,
      reasoning: `Both teams average ${combined.over3_5.avgWilson.toFixed(
        1
      )}% Over 3.5 (Wilson Score)`,
      riskLevel: "High",
    });
  }

  // Goals Analysis
  if (combined.goals.total >= 3.0) {
    recommendations.push({
      type: "High Total Goals Expected",
      confidence: "medium",
      rate: combined.goals.total,
      reasoning: `Expected total goals: ${combined.goals.total.toFixed(
        1
      )} per game`,
      riskLevel: "Medium",
    });
  }

  // Low Scoring Analysis - uses Over/Under rates which are more reliable than raw goal averages
  // Only show "Low Scoring Teams" if Over 2.5 rate is very low (indicating low-scoring matches)
  // This is more accurate for betting purposes than using raw goal averages
  if (combined.over2_5 && combined.over2_5.avgWilson !== undefined && combined.over2_5.avgWilson < 30) {
    // Use Over 2.5 rate if available and indicates low scoring
    if (combined.goals.total <= 2.5) {
      recommendations.push({
        type: "Low Scoring Teams",
        confidence: "medium",
        rate: combined.over2_5.avgWilson,
        reasoning: `Low scoring pattern: ${combined.over2_5.avgWilson.toFixed(
          1
        )}% Over 2.5 rate, expected ${combined.goals.total.toFixed(1)} total goals`,
        riskLevel: "Medium",
      });
    }
  } else if (combined.goals.total <= 2.0 && homeData.totalGames >= 3 && awayData.totalGames >= 3) {
    // Fallback: use goal averages if Over/Under data not available or not low enough
    // Only if we have sufficient data (at least 3 games per team)
    recommendations.push({
      type: "Low Scoring Teams",
      confidence: "low",
      rate: combined.goals.total,
      reasoning: `Expected total goals: ${combined.goals.total.toFixed(
        1
      )} (Home scores: ${homeData.avgGoalsScored.toFixed(1)}/game, Away scores: ${awayData.avgGoalsScored.toFixed(1)}/game)`,
      riskLevel: "Medium",
    });
  }

  // Home vs Away Analysis
  if (homeData.homeOver1_5 >= 80 && awayData.awayOver1_5 >= 80) {
    recommendations.push({
      type: "Strong Home/Away Over 1.5",
      confidence: "high",
      rate: (homeData.homeOver1_5 + awayData.awayOver1_5) / 2,
      reasoning: `Home team ${homeData.homeOver1_5.toFixed(
        1
      )}% Over 1.5 at home, Away team ${awayData.awayOver1_5.toFixed(
        1
      )}% Over 1.5 away`,
      riskLevel: "Low",
    });
  }

  // Return the best recommendation or a summary
  if (recommendations.length === 0) {
    // If no specific recommendations match, provide a general summary based on available data
    // Check if we have any goal data (either team-specific or league averages)
    const hasGoalData = 
      (homeData.avgGoalsScored > 0 || awayData.avgGoalsScored > 0) ||
      (homeData.totalGames >= 3 || awayData.totalGames >= 3) ||
      (scoringData.length > 0); // At least some scoring data exists
    
    if (hasGoalData && combined.goals.total > 0) {
      // We have some data, provide a general recommendation
      const expectedTotal = combined.goals.total;
      let generalType = "Moderate Scoring";
      let generalConfidence = "low";
      
      if (expectedTotal >= 3.5) {
        generalType = "High Scoring Expected";
        generalConfidence = "medium";
      } else if (expectedTotal <= 2.0) {
        generalType = "Low Scoring Expected";
        generalConfidence = "medium";
      }
      
      return {
        type: generalType,
        confidence: generalConfidence,
        rate: expectedTotal,
        reasoning: `Expected total goals: ${expectedTotal.toFixed(1)} (Home: ${homeData.avgGoalsScored.toFixed(1)}, Away: ${awayData.avgGoalsScored.toFixed(1)})`,
        riskLevel: "Medium",
        details: {
          homeGames: homeData.totalGames,
          awayGames: awayData.totalGames,
          homeConfidence: homeConfidence.level,
          awayConfidence: awayConfidence.level,
        },
      };
    }
    
    // Truly insufficient data
    return {
      type: "Insufficient Data",
      confidence: "low",
      rate: 0,
      reasoning: "Not enough reliable data for scoring analysis",
      riskLevel: "High",
      details: {
        homeGames: homeData.totalGames,
        awayGames: awayData.totalGames,
        homeConfidence: homeConfidence.level,
        awayConfidence: awayConfidence.level,
      },
    };
  }

  // Sort by confidence and rate, return the best
  const bestRecommendation = recommendations.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    if (confidenceOrder[a.confidence] !== confidenceOrder[b.confidence]) {
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    }
    return b.rate - a.rate;
  })[0];

  // Add additional context
  bestRecommendation.details = {
    homeTeam: {
      games: homeData.totalGames,
      confidence: homeConfidence.level,
      over1_5: homeData.over1_5,
      over2_5: homeData.over2_5,
      avgGoals: homeData.avgGoals,
    },
    awayTeam: {
      games: awayData.totalGames,
      confidence: awayConfidence.level,
      over1_5: awayData.over1_5,
      over2_5: awayData.over2_5,
      avgGoals: awayData.avgGoals,
    },
    leagueContext: {
      homeLeagueAvg: homeLeagueAvg.over1_5,
      awayLeagueAvg: awayLeagueAvg.over1_5,
    },
    allRecommendations: recommendations,
  };

  debugLog("Advanced scoring recommendation:", bestRecommendation);
  return bestRecommendation;
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
