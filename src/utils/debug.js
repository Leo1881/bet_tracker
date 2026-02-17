/**
 * Debug utilities for recommendation and odds flow.
 * Set DEBUG_RECOMMENDATIONS to true for verbose logging during development.
 * Set DEBUG_VERDICT to true to log agree/disagree comparison details.
 */
export const DEBUG_RECOMMENDATIONS = false;
export const DEBUG_VERDICT = true; // Set to false when done debugging verdict mismatches

export const debugLog = (...args) => {
  if (DEBUG_RECOMMENDATIONS) {
    console.log(...args);
  }
};

export const debugVerdictLog = (...args) => {
  if (DEBUG_VERDICT) {
    console.log("[Verdict]", ...args);
  }
};
