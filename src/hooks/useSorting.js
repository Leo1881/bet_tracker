import { useCallback } from "react";
import {
  createSortHandlers,
  sortData,
  sortSlipsData,
} from "../services/sortingService";

/**
 * Custom hook for sorting functionality
 * @param {Object} sortConfigs - All sort configurations
 * @param {Object} setters - All setter functions for sort configs
 * @returns {Object} Sort handlers and utility functions
 */
export const useSorting = (sortConfigs, setters) => {
  // Create all sort handlers
  const sortHandlers = createSortHandlers(sortConfigs, setters);

  // Generic sort function
  const sortDataGeneric = useCallback(
    (data, sortConfig, numericFields = [], dateFields = []) => {
      return sortData(data, sortConfig, numericFields, dateFields);
    },
    []
  );

  // Special sort function for slips
  const sortSlipsDataGeneric = useCallback((slipsData, sortConfig) => {
    return sortSlipsData(slipsData, sortConfig);
  }, []);

  return {
    ...sortHandlers,
    sortData: sortDataGeneric,
    sortSlipsData: sortSlipsDataGeneric,
  };
};
