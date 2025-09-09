import { useCallback } from "react";
import {
  getSortedData,
  getSortedLeagueData,
  getSortedCountryData,
  getSortedBlacklistData,
  getSortedOddsData,
  getSortedAnalysisResults,
  getSortedSlipsData,
  getSortedTeamNotesData,
  getDeduplicatedBets,
  getDeduplicatedFilteredBets,
  hasActiveFilters,
  getUniqueValues,
  toggleOddsRangeExpansion,
  toggleSlipExpansion,
  toggleTeamExpansion,
} from "../services/dataProcessingService";

/**
 * Custom hook for data processing functions
 * @param {Array} bets - Array of all bets
 * @param {Object} filters - Filter object
 * @returns {Object} Data processing functions
 */
export const useDataProcessing = (bets, filters) => {
  // Get deduplicated bets
  const getDeduplicatedBetsData = useCallback(() => {
    return getDeduplicatedBets(bets);
  }, [bets]);

  // Get deduplicated filtered bets
  const getDeduplicatedFilteredBetsData = useCallback(() => {
    const deduplicatedBets = getDeduplicatedBets(bets);
    return getDeduplicatedFilteredBets(deduplicatedBets, filters);
  }, [bets, filters]);

  // Check if filters are active
  const areFiltersActive = useCallback(() => {
    return hasActiveFilters(filters);
  }, [filters]);

  // Get unique values for a field
  const getUniqueValuesForField = useCallback(
    (field, context = {}) => {
      const deduplicatedBets = getDeduplicatedBets(bets);
      return getUniqueValues(deduplicatedBets, field, context);
    },
    [bets]
  );

  // Toggle expansion functions
  const toggleOddsRange = useCallback((expandedOddsRanges, range) => {
    return toggleOddsRangeExpansion(expandedOddsRanges, range);
  }, []);

  const toggleSlip = useCallback((expandedSlips, betId) => {
    return toggleSlipExpansion(expandedSlips, betId);
  }, []);

  const toggleTeam = useCallback((expandedBetTypes, team) => {
    return toggleTeamExpansion(expandedBetTypes, team);
  }, []);

  return {
    getDeduplicatedBetsData,
    getDeduplicatedFilteredBetsData,
    areFiltersActive,
    getUniqueValuesForField,
    toggleOddsRange,
    toggleSlip,
    toggleTeam,
    // Direct service functions
    getSortedData,
    getSortedLeagueData,
    getSortedCountryData,
    getSortedBlacklistData,
    getSortedOddsData,
    getSortedAnalysisResults,
    getSortedSlipsData,
    getSortedTeamNotesData,
  };
};
