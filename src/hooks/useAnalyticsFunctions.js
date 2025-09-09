import { useCallback } from "react";
import {
  getLeagueAnalytics,
  getCountryAnalytics,
  getBestPerformers,
  getHeadToHeadData,
  getTopTeams,
} from "../services/analyticsService";

/**
 * Custom hook for analytics functions
 * @param {Array} deduplicatedBets - Array of deduplicated bets
 * @returns {Object} Analytics functions
 */
export const useAnalyticsFunctions = (deduplicatedBets) => {
  // Get league analytics
  const getLeagueAnalyticsData = useCallback(() => {
    return getLeagueAnalytics(deduplicatedBets);
  }, [deduplicatedBets]);

  // Get country analytics
  const getCountryAnalyticsData = useCallback(() => {
    return getCountryAnalytics(deduplicatedBets);
  }, [deduplicatedBets]);

  // Get best performers
  const getBestPerformersData = useCallback(() => {
    const leagueAnalytics = getLeagueAnalytics(deduplicatedBets);
    const countryAnalytics = getCountryAnalytics(deduplicatedBets);
    return getBestPerformers(leagueAnalytics, countryAnalytics);
  }, [deduplicatedBets]);

  // Get head-to-head data
  const getHeadToHeadDataData = useCallback(() => {
    return getHeadToHeadData(deduplicatedBets);
  }, [deduplicatedBets]);

  // Get top teams
  const getTopTeamsData = useCallback(() => {
    return getTopTeams(deduplicatedBets);
  }, [deduplicatedBets]);

  return {
    getLeagueAnalytics: getLeagueAnalyticsData,
    getCountryAnalytics: getCountryAnalyticsData,
    getBestPerformers: getBestPerformersData,
    getHeadToHeadData: getHeadToHeadDataData,
    getTopTeams: getTopTeamsData,
  };
};
