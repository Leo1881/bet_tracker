import { useCallback } from "react";
import {
  generateBetRecommendations,
  analyzeStraightWin,
  analyzeDoubleChance,
  analyzeOverUnder,
} from "../services/analysisService";

/**
 * Custom hook for analysis functions
 * @param {Array} bets - Array of all bets
 * @returns {Object} Analysis functions
 */
export const useAnalysis = (bets) => {
  // Generate bet recommendations
  const generateRecommendations = useCallback((analysisResults) => {
    return generateBetRecommendations(analysisResults);
  }, []);

  // Analyze straight win
  const analyzeStraightWinBet = useCallback(
    (homeTeam, awayTeam, country, league, betData) => {
      return analyzeStraightWin(
        homeTeam,
        awayTeam,
        country,
        league,
        betData,
        bets
      );
    },
    [bets]
  );

  // Analyze double chance
  const analyzeDoubleChanceBet = useCallback(
    (homeTeam, awayTeam, country, league, betData) => {
      return analyzeDoubleChance(
        homeTeam,
        awayTeam,
        country,
        league,
        betData,
        bets
      );
    },
    [bets]
  );

  // Analyze over/under
  const analyzeOverUnderBet = useCallback(
    (homeTeam, awayTeam, country, league, betData) => {
      return analyzeOverUnder(
        homeTeam,
        awayTeam,
        country,
        league,
        betData,
        bets
      );
    },
    [bets]
  );

  return {
    generateRecommendations,
    analyzeStraightWinBet,
    analyzeDoubleChanceBet,
    analyzeOverUnderBet,
  };
};
