import { useCallback } from "react";
import {
  getStatusColor,
  formatDate,
  calculateWinPercentage,
  isTeamBlacklisted,
  getBetsForOddsRange,
  storePredictions,
  getTodayPredictions,
  storeRecommendations,
  checkBetslipMatch,
} from "../services/utilityService";

/**
 * Custom hook for utility functions
 * @param {Array} bets - Array of all bets
 * @param {Array} blacklistedTeams - Array of blacklisted teams
 * @param {Array} storedPredictions - Array of stored predictions
 * @returns {Object} Utility functions
 */
export const useUtility = (bets, blacklistedTeams, storedPredictions) => {
  // Get status color
  const getStatusColorClass = useCallback((status) => {
    return getStatusColor(status);
  }, []);

  // Format date
  const formatDateString = useCallback((dateString) => {
    return formatDate(dateString);
  }, []);

  // Calculate win percentage
  const calculateWinPercentageForBets = useCallback(
    (betList = bets) => {
      return calculateWinPercentage(betList);
    },
    [bets]
  );

  // Check if team is blacklisted
  const isTeamBlacklistedCheck = useCallback(
    (teamName) => {
      return isTeamBlacklisted(teamName, blacklistedTeams);
    },
    [blacklistedTeams]
  );

  // Get bets for odds range
  const getBetsForOddsRangeData = useCallback((deduplicatedBets, range) => {
    return getBetsForOddsRange(deduplicatedBets, range);
  }, []);

  // Store predictions
  const storePredictionsData = useCallback(async (analysisResults) => {
    return await storePredictions(analysisResults);
  }, []);

  // Get today's predictions
  const getTodayPredictionsData = useCallback(() => {
    return getTodayPredictions(storedPredictions);
  }, [storedPredictions]);

  // Store recommendations
  const storeRecommendationsData = useCallback(async (analysisResults) => {
    return await storeRecommendations(analysisResults);
  }, []);

  // Check betslip match
  const checkBetslipMatchData = useCallback((betslipGames, analysisGames) => {
    return checkBetslipMatch(betslipGames, analysisGames);
  }, []);

  return {
    getStatusColorClass,
    formatDateString,
    calculateWinPercentageForBets,
    isTeamBlacklistedCheck,
    getBetsForOddsRangeData,
    storePredictionsData,
    getTodayPredictionsData,
    storeRecommendationsData,
    checkBetslipMatchData,
  };
};
