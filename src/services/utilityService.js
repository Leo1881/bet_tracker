/**
 * Utility Service
 * Handles helper functions and utility operations
 */

/**
 * Get status color class based on status
 * @param {string} status - Status string
 * @returns {string} CSS class for status color
 */
export const getStatusColor = (status) => {
  if (!status) return "bg-gray-100 text-gray-800";
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes("win")) return "bg-green-100 text-green-800";
  if (lowerStatus.includes("loss")) return "bg-red-100 text-red-800";
  if (lowerStatus.includes("pending")) return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-800";
};

/**
 * Format date string
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (error) {
    return dateString;
  }
};

/**
 * Calculate win percentage from bet list
 * @param {Array} betList - Array of bets
 * @returns {string} Win percentage as formatted string
 */
export const calculateWinPercentage = (betList = []) => {
  const wins = betList.filter((bet) =>
    bet.RESULT?.toLowerCase().includes("win")
  ).length;
  const total = betList.filter(
    (bet) => bet.RESULT && bet.RESULT.trim() !== ""
  ).length;
  return total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
};

/**
 * Check if team is blacklisted
 * @param {string} teamName - Team name to check
 * @param {Array} blacklistedTeams - Array of blacklisted teams
 * @returns {boolean} True if team is blacklisted
 */
export const isTeamBlacklisted = (teamName, blacklistedTeams) => {
  if (!teamName || !blacklistedTeams.length) return false;
  const normalizedTeamName = teamName.toLowerCase().trim();
  return blacklistedTeams.some(
    (team) => team.toLowerCase().trim() === normalizedTeamName
  );
};

/**
 * Get bets for specific odds range
 * @param {Array} deduplicatedBets - Array of deduplicated bets
 * @param {string} range - Odds range (e.g., "1.0-1.5")
 * @returns {Array} Bets within the specified odds range
 */
export const getBetsForOddsRange = (deduplicatedBets, range) => {
  const [min, max] = range.split("-").map(Number);

  return deduplicatedBets.filter((bet) => {
    const odds1 = parseFloat(bet.ODDS1) || 0;
    const odds2 = parseFloat(bet.ODDS2) || 0;

    return (odds1 >= min && odds1 < max) || (odds2 >= min && odds2 < max);
  });
};

/**
 * Store predictions in localStorage
 * @param {Array} analysisResults - Analysis results to store
 * @returns {Promise<void>}
 */
export const storePredictions = async (analysisResults) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const predictions = {
      id: `pred_${Date.now()}`,
      date: today,
      results: analysisResults,
      timestamp: new Date().toISOString(),
    };

    // Get existing predictions
    const existing = JSON.parse(
      localStorage.getItem("storedPredictions") || "[]"
    );

    // Remove any existing predictions for today
    const filtered = existing.filter((p) => p.date !== today);

    // Add new predictions
    const updated = [...filtered, predictions];

    // Store back to localStorage
    localStorage.setItem("storedPredictions", JSON.stringify(updated));

    console.log(`Stored ${analysisResults.length} predictions for ${today}`);
  } catch (error) {
    console.error("Error storing predictions:", error);
  }
};

/**
 * Get today's stored predictions
 * @param {Array} storedPredictions - Array of stored predictions
 * @returns {Object|null} Today's predictions or null
 */
export const getTodayPredictions = (storedPredictions) => {
  const today = new Date().toISOString().split("T")[0];
  return storedPredictions.find((p) => p.date === today) || null;
};

/**
 * Store recommendations for accuracy tracking
 * @param {Array} analysisResults - Analysis results to store
 * @returns {Promise<void>}
 */
export const storeRecommendations = async (analysisResults) => {
  try {
    // For now, we'll store recommendations in localStorage
    // In a full implementation, this would update Google Sheets

    const today = new Date().toISOString().split("T")[0];
    const recommendations = {
      id: `rec_${Date.now()}`,
      date: today,
      results: analysisResults,
      timestamp: new Date().toISOString(),
    };

    // Get existing recommendations
    const existing = JSON.parse(
      localStorage.getItem("storedRecommendations") || "[]"
    );

    // Remove any existing recommendations for today
    const filtered = existing.filter((r) => r.date !== today);

    // Add new recommendations
    const updated = [...filtered, recommendations];

    // Store back to localStorage
    localStorage.setItem("storedRecommendations", JSON.stringify(updated));

    console.log(
      `Stored ${analysisResults.length} recommendations for ${today}`
    );
  } catch (error) {
    console.error("Error storing recommendations:", error);
  }
};

/**
 * Check if betslip matches analysis
 * @param {Array} betslipGames - Games in betslip
 * @param {Array} analysisGames - Games in analysis
 * @returns {Object} Match analysis result
 */
export const checkBetslipMatch = (betslipGames, analysisGames) => {
  const betslipSet = new Set(
    betslipGames.map(
      (game) =>
        `${game.homeTeam}-${game.awayTeam}-${game.country}-${game.league}`
    )
  );

  const analysisSet = new Set(
    analysisGames.map(
      (game) =>
        `${game.homeTeam}-${game.awayTeam}-${game.country}-${game.league}`
    )
  );

  const matches = [...betslipSet].filter((game) => analysisSet.has(game));
  const betslipOnly = [...betslipSet].filter((game) => !analysisSet.has(game));
  const analysisOnly = [...analysisSet].filter((game) => !betslipSet.has(game));

  return {
    matches: matches.length,
    betslipOnly: betslipOnly.length,
    analysisOnly: analysisOnly.length,
    totalBetslip: betslipGames.length,
    totalAnalysis: analysisGames.length,
    matchPercentage:
      betslipGames.length > 0
        ? (matches.length / betslipGames.length) * 100
        : 0,
  };
};
