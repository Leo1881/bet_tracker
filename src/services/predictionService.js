/**
 * Prediction Service
 * Handles prediction accuracy and metrics calculations
 */

/**
 * Get prediction accuracy metrics
 * @param {Array} bets - Array of all bets
 * @returns {Object} Prediction accuracy metrics
 */
export const getPredictionAccuracyMetrics = (bets) => {
  const betsWithResults = bets.filter(
    (bet) => bet.RESULT && bet.RESULT.trim() !== ""
  );

  const accuracyData = betsWithResults
    .map((bet) => {
      const recommendation = bet.SYSTEM_RECOMMENDATION;
      const result = bet.RESULT.toLowerCase();

      if (!recommendation) return null;

      // Parse recommendation to determine if it was correct
      let isCorrect = false;

      if (recommendation.includes("Win")) {
        isCorrect = result.includes("win");
      } else if (recommendation.includes("Avoid")) {
        isCorrect = result.includes("loss");
      } else if (recommendation.includes("Double Chance")) {
        isCorrect = result.includes("win") || result.includes("draw");
      } else if (recommendation.includes("Over")) {
        // For over/under bets, we'd need to check actual goals vs predicted
        // For now, we'll use a simplified approach
        isCorrect = result.includes("win");
      } else if (recommendation.includes("Under")) {
        isCorrect = result.includes("win");
      }

      return {
        betId: bet.BET_ID || bet.DATE,
        recommendation,
        result,
        isCorrect: isCorrect ? "Yes" : "No",
        confidence: bet.CONFIDENCE_SCORE || 0,
        date: bet.DATE,
      };
    })
    .filter(Boolean);

  // Group by confidence ranges
  const confidenceGroups = {
    "High (8-10)": accuracyData.filter((acc) => acc.confidence >= 8),
    "Medium (6-7)": accuracyData.filter(
      (acc) => acc.confidence >= 6 && acc.confidence < 8
    ),
    "Low (4-5)": accuracyData.filter(
      (acc) => acc.confidence >= 4 && acc.confidence < 6
    ),
    "Very Low (1-3)": accuracyData.filter((acc) => acc.confidence < 4),
  };

  // Calculate accuracy for each group
  const calculateGroupAccuracy = (group) => {
    const correct = group.filter((acc) => acc.isCorrect === "Yes").length;
    return group.length > 0 ? (correct / group.length) * 100 : 0;
  };

  const accuracyMetrics = {
    overall: {
      total: accuracyData.length,
      correct: accuracyData.filter((acc) => acc.isCorrect === "Yes").length,
      accuracy: calculateGroupAccuracy(accuracyData),
    },
    byConfidence: {
      "High (8-10)": {
        total: confidenceGroups["High (8-10)"].length,
        correct: confidenceGroups["High (8-10)"].filter(
          (acc) => acc.isCorrect === "Yes"
        ).length,
        accuracy: calculateGroupAccuracy(confidenceGroups["High (8-10)"]),
      },
      "Medium (6-7)": {
        total: confidenceGroups["Medium (6-7)"].length,
        correct: confidenceGroups["Medium (6-7)"].filter(
          (acc) => acc.isCorrect === "Yes"
        ).length,
        accuracy: calculateGroupAccuracy(confidenceGroups["Medium (6-7)"]),
      },
      "Low (4-5)": {
        total: confidenceGroups["Low (4-5)"].length,
        correct: confidenceGroups["Low (4-5)"].filter(
          (acc) => acc.isCorrect === "Yes"
        ).length,
        accuracy: calculateGroupAccuracy(confidenceGroups["Low (4-5)"]),
      },
      "Very Low (1-3)": {
        total: confidenceGroups["Very Low (1-3)"].length,
        correct: confidenceGroups["Very Low (1-3)"].filter(
          (acc) => acc.isCorrect === "Yes"
        ).length,
        accuracy: calculateGroupAccuracy(confidenceGroups["Very Low (1-3)"]),
      },
    },
  };

  return accuracyMetrics;
};

/**
 * Calculate prediction accuracy for a specific bet
 * @param {Object} bet - Bet object
 * @returns {string} Accuracy result
 */
export const calculatePredictionAccuracy = (bet) => {
  if (!bet.SYSTEM_RECOMMENDATION || !bet.RESULT) {
    return "Pending";
  }

  const recommendation = bet.SYSTEM_RECOMMENDATION;
  const result = bet.RESULT.toLowerCase();

  if (recommendation.includes("Win")) {
    return result.includes("win") ? "Correct" : "Incorrect";
  } else if (recommendation.includes("Avoid")) {
    return result.includes("loss") ? "Correct" : "Incorrect";
  } else if (recommendation.includes("Double Chance")) {
    return result.includes("win") || result.includes("draw")
      ? "Correct"
      : "Incorrect";
  } else if (
    recommendation.includes("Over") ||
    recommendation.includes("Under")
  ) {
    // For over/under bets, we'd need to check actual goals vs predicted
    // For now, we'll use a simplified approach
    return result.includes("win") ? "Correct" : "Incorrect";
  }

  return "Unknown";
};

/**
 * Get prediction accuracy by time period
 * @param {Array} bets - Array of all bets
 * @param {string} period - Time period ("week", "month", "quarter", "year")
 * @returns {Object} Accuracy metrics for the period
 */
export const getPredictionAccuracyByPeriod = (bets, period = "month") => {
  const now = new Date();
  let startDate;

  switch (period) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "quarter":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "year":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const periodBets = bets.filter((bet) => {
    const betDate = new Date(bet.DATE);
    return betDate >= startDate && betDate <= now;
  });

  return getPredictionAccuracyMetrics(periodBets);
};

/**
 * Get prediction accuracy by bet type
 * @param {Array} bets - Array of all bets
 * @returns {Object} Accuracy metrics by bet type
 */
export const getPredictionAccuracyByBetType = (bets) => {
  const betTypes = [...new Set(bets.map((bet) => bet.BET_TYPE))];

  const accuracyByType = {};

  betTypes.forEach((betType) => {
    const typeBets = bets.filter((bet) => bet.BET_TYPE === betType);
    accuracyByType[betType] = getPredictionAccuracyMetrics(typeBets);
  });

  return accuracyByType;
};

/**
 * Get prediction accuracy by league
 * @param {Array} bets - Array of all bets
 * @returns {Object} Accuracy metrics by league
 */
export const getPredictionAccuracyByLeague = (bets) => {
  const leagues = [
    ...new Set(bets.map((bet) => `${bet.COUNTRY} - ${bet.LEAGUE}`)),
  ];

  const accuracyByLeague = {};

  leagues.forEach((league) => {
    const [country, leagueName] = league.split(" - ");
    const leagueBets = bets.filter(
      (bet) => bet.COUNTRY === country && bet.LEAGUE === leagueName
    );
    accuracyByLeague[league] = getPredictionAccuracyMetrics(leagueBets);
  });

  return accuracyByLeague;
};
