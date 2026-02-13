/**
 * Debug utilities for recommendation and odds flow.
 * Set DEBUG_RECOMMENDATIONS to true for verbose logging during development.
 */
export const DEBUG_RECOMMENDATIONS = false;

export const debugLog = (...args) => {
  if (DEBUG_RECOMMENDATIONS) {
    console.log(...args);
  }
};
