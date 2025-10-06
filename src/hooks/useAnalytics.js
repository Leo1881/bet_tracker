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

  // Get sorted analytics data with multi-column support
  const getSortedAnalyticsData = useCallback(() => {
    // Apply sorting if sort config is provided
    if (analyticsSortConfig && analyticsSortConfig.key) {
      return [...teamAnalytics].sort((a, b) => {
        // Primary sort
        let aValue = a[analyticsSortConfig.key];
        let bValue = b[analyticsSortConfig.key];

        // Handle numeric fields
        if (
          analyticsSortConfig.key === "winRate" ||
          analyticsSortConfig.key === "totalBets" ||
          analyticsSortConfig.key === "wins" ||
          analyticsSortConfig.key === "losses"
        ) {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        }

        let comparison = 0;
        if (aValue !== bValue) {
          comparison = aValue < bValue ? -1 : 1;
          if (analyticsSortConfig.direction === "desc") {
            comparison = -comparison;
          }
        }

        // Secondary sort if primary values are equal
        if (comparison === 0 && analyticsSortConfig.secondaryKey) {
          let aSecondary = a[analyticsSortConfig.secondaryKey];
          let bSecondary = b[analyticsSortConfig.secondaryKey];

          // Handle numeric secondary fields
          if (
            analyticsSortConfig.secondaryKey === "winRate" ||
            analyticsSortConfig.secondaryKey === "totalBets" ||
            analyticsSortConfig.secondaryKey === "wins" ||
            analyticsSortConfig.secondaryKey === "losses"
          ) {
            aSecondary = parseFloat(aSecondary) || 0;
            bSecondary = parseFloat(bSecondary) || 0;
          }

          if (aSecondary !== bSecondary) {
            comparison = aSecondary < bSecondary ? -1 : 1;
            if (analyticsSortConfig.secondaryDirection === "desc") {
              comparison = -comparison;
            }
          }
        }

        return comparison;
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
