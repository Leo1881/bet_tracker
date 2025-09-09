import { useCallback, useMemo } from "react";
import { getDeduplicatedBets } from "../services/dataProcessingService";
import { getTopTeams } from "../services/analyticsService";

/**
 * Custom hook for analytics data
 * @param {Array} bets - Array of all bets
 * @param {Object} analyticsSortConfig - Analytics sort configuration
 * @returns {Object} Analytics data and functions
 */
export const useAnalytics = (bets, analyticsSortConfig) => {
  // Get deduplicated bets for analysis
  const deduplicatedBets = useMemo(() => {
    return getDeduplicatedBets(bets);
  }, [bets]);

  // Get team analytics
  const teamAnalytics = useMemo(() => {
    return getTopTeams(deduplicatedBets);
  }, [deduplicatedBets]);

  // Get sorted analytics data
  const getSortedAnalyticsData = useCallback(() => {
    // Apply sorting if sort config is provided
    if (analyticsSortConfig && analyticsSortConfig.key) {
      return [...teamAnalytics].sort((a, b) => {
        const aValue = a[analyticsSortConfig.key];
        const bValue = b[analyticsSortConfig.key];

        if (analyticsSortConfig.direction === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return teamAnalytics;
  }, [teamAnalytics, analyticsSortConfig]);

  return {
    deduplicatedBets,
    teamAnalytics,
    getSortedAnalyticsData,
  };
};
