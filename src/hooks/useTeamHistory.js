import { useCallback } from "react";
import {
  calculateConfidenceScore,
  getConfidenceBreakdown,
  getConfidenceLabel,
} from "../services/teamHistoryService";
import { getConfidenceRecommendation } from "../services/confidenceService";

/**
 * Custom hook for team history and confidence calculations
 * @param {Array} bets - Array of all bets
 * @returns {Object} Team history functions
 */
export const useTeamHistory = (bets) => {
  // Calculate confidence score with bets context
  const calculateConfidence = useCallback(
    (bet) => {
      return calculateConfidenceScore({
        ...bet,
        bets: bets || [],
      });
    },
    [bets]
  );

  // Get confidence breakdown with bets context
  const getBreakdown = useCallback(
    (bet) => {
      return getConfidenceBreakdown({
        ...bet,
        bets: bets || [],
      });
    },
    [bets]
  );

  // Get confidence label
  const getLabel = useCallback((confidenceScore) => {
    return getConfidenceLabel(confidenceScore);
  }, []);

  // Get confidence recommendation with bets context
  const getRecommendation = useCallback(
    (
      confidenceScore,
      teamIncluded,
      homeTeam,
      awayTeam,
      confidenceBreakdown = null,
      betData = null
    ) => {
      return getConfidenceRecommendation(
        confidenceScore,
        teamIncluded,
        homeTeam,
        awayTeam,
        confidenceBreakdown,
        betData,
        bets || []
      );
    },
    [bets]
  );

  return {
    calculateConfidence,
    getBreakdown,
    getLabel,
    getRecommendation,
  };
};
