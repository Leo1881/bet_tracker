import { useCallback } from "react";
import {
  analyzeNewBets as analyzeNewBetsService,
  findPreviousMatchups as findPreviousMatchupsService,
  analyzeScoringPatterns as analyzeScoringPatternsService,
  getScoringRecommendation as getScoringRecommendationService,
  getDeduplicatedNewBets as getDeduplicatedNewBetsService,
} from "../services/betAnalysisService";

/**
 * Custom hook for bet analysis functionality
 * @param {Array} bets - Historical bets data
 * @param {Array} blacklistedTeams - Array of blacklisted teams
 * @param {Function} getDeduplicatedBetsForAnalysis - Function to get deduplicated bets
 * @param {Function} calculateConfidence - Function to calculate confidence score
 * @param {Function} getBreakdown - Function to get confidence breakdown
 * @param {Function} getLabel - Function to get confidence label
 * @param {Function} getRecommendation - Function to get betting recommendation
 * @param {Function} storePredictions - Function to store predictions
 * @param {Function} storeRecommendations - Function to store recommendations
 * @param {Function} setScoringAnalysis - Function to set scoring analysis state
 * @param {Function} setScoringAnalysisLoading - Function to set loading state
 * @returns {Object} Bet analysis functions
 */
export const useBetAnalysis = (
  bets,
  blacklistedTeams,
  getDeduplicatedBetsForAnalysis,
  calculateConfidence,
  getBreakdown,
  getLabel,
  getRecommendation,
  storePredictions,
  storeRecommendations,
  setScoringAnalysis,
  setScoringAnalysisLoading
) => {
  // Memoized analyze new bets function
  const analyzeNewBets = useCallback(
    async (newBets) => {
      return await analyzeNewBetsService(
        newBets,
        bets,
        blacklistedTeams,
        getDeduplicatedBetsForAnalysis,
        calculateConfidence,
        getBreakdown,
        getLabel,
        getRecommendation,
        storePredictions,
        storeRecommendations,
        () =>
          analyzeScoringPatterns(
            bets,
            setScoringAnalysis,
            setScoringAnalysisLoading
          )
      );
    },
    [
      bets,
      blacklistedTeams,
      getDeduplicatedBetsForAnalysis,
      calculateConfidence,
      getBreakdown,
      getLabel,
      getRecommendation,
      storePredictions,
      storeRecommendations,
      setScoringAnalysis,
      setScoringAnalysisLoading,
    ]
  );

  // Memoized find previous matchups function
  const findPreviousMatchups = useCallback(
    (homeTeam, awayTeam, country, league) => {
      return findPreviousMatchupsService(
        homeTeam,
        awayTeam,
        country,
        league,
        getDeduplicatedBetsForAnalysis
      );
    },
    [getDeduplicatedBetsForAnalysis]
  );

  // Memoized analyze scoring patterns function
  const analyzeScoringPatterns = useCallback(async () => {
    return await analyzeScoringPatternsService(
      bets,
      setScoringAnalysis,
      setScoringAnalysisLoading
    );
  }, [bets, setScoringAnalysis, setScoringAnalysisLoading]);

  // Memoized get scoring recommendation function
  const getScoringRecommendation = useCallback(
    (homeTeam, awayTeam, homeLeague, awayLeague, scoringData) => {
      return getScoringRecommendationService(
        homeTeam,
        awayTeam,
        homeLeague,
        awayLeague,
        scoringData
      );
    },
    []
  );

  // Memoized get deduplicated new bets function
  const getDeduplicatedNewBets = useCallback((newBets) => {
    return getDeduplicatedNewBetsService(newBets);
  }, []);

  return {
    analyzeNewBets,
    findPreviousMatchups,
    analyzeScoringPatterns,
    getScoringRecommendation,
    getDeduplicatedNewBets,
  };
};
