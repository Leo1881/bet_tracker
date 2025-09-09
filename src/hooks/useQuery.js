import { useCallback } from "react";
import {
  getAvailableFields,
  getFieldValues,
  getAvailableMetrics,
  getAvailableOperators,
  addQueryFilter,
  removeQueryFilter,
  updateQueryFilter,
  executeQuery,
  clearQuery,
} from "../services/queryService";

/**
 * Custom hook for query system functions
 * @param {Array} deduplicatedBets - Array of deduplicated bets
 * @param {Array} teamAnalytics - Array of team analytics data
 * @param {Array} queryFilters - Current query filters
 * @param {Function} setQueryFilters - Function to update query filters
 * @param {Function} setQueryResults - Function to set query results
 * @param {Function} setIsQuerying - Function to set querying state
 * @returns {Object} Query functions
 */
export const useQuery = (
  deduplicatedBets,
  teamAnalytics,
  queryFilters,
  setQueryFilters,
  setQueryResults,
  setIsQuerying
) => {
  // Get available fields
  const getAvailableFieldsData = useCallback(() => {
    return getAvailableFields();
  }, []);

  // Get field values
  const getFieldValuesData = useCallback(
    (field) => {
      return getFieldValues(field, deduplicatedBets);
    },
    [deduplicatedBets]
  );

  // Get available metrics
  const getAvailableMetricsData = useCallback(() => {
    return getAvailableMetrics();
  }, []);

  // Get available operators
  const getAvailableOperatorsData = useCallback(() => {
    return getAvailableOperators();
  }, []);

  // Add query filter
  const addQueryFilterData = useCallback(() => {
    return addQueryFilter(queryFilters, setQueryFilters);
  }, [queryFilters, setQueryFilters]);

  // Remove query filter
  const removeQueryFilterData = useCallback(
    (index) => {
      return removeQueryFilter(index, queryFilters, setQueryFilters);
    },
    [queryFilters, setQueryFilters]
  );

  // Update query filter
  const updateQueryFilterData = useCallback(
    (index, field, value) => {
      return updateQueryFilter(
        index,
        field,
        value,
        queryFilters,
        setQueryFilters
      );
    },
    [queryFilters, setQueryFilters]
  );

  // Execute query
  const executeQueryData = useCallback(async () => {
    return await executeQuery(
      queryFilters,
      deduplicatedBets,
      teamAnalytics,
      setQueryResults,
      setIsQuerying
    );
  }, [
    queryFilters,
    deduplicatedBets,
    teamAnalytics,
    setQueryResults,
    setIsQuerying,
  ]);

  // Clear query
  const clearQueryData = useCallback(() => {
    return clearQuery(setQueryFilters, setQueryResults);
  }, [setQueryFilters, setQueryResults]);

  return {
    getAvailableFields: getAvailableFieldsData,
    getFieldValues: getFieldValuesData,
    getAvailableMetrics: getAvailableMetricsData,
    getAvailableOperators: getAvailableOperatorsData,
    addQueryFilter: addQueryFilterData,
    removeQueryFilter: removeQueryFilterData,
    updateQueryFilter: updateQueryFilterData,
    executeQuery: executeQueryData,
    clearQuery: clearQueryData,
  };
};
