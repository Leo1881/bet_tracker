import { useCallback } from "react";
import {
  getPredictionAccuracyMetrics,
  calculatePredictionAccuracy,
  getPredictionAccuracyByPeriod,
  getPredictionAccuracyByBetType,
  getPredictionAccuracyByLeague,
} from "../services/predictionService";

/**
 * Custom hook for prediction functions
 * @param {Array} bets - Array of all bets
 * @returns {Object} Prediction functions
 */
export const usePrediction = (bets) => {
  // Get prediction accuracy metrics
  const getAccuracyMetrics = useCallback(() => {
    return getPredictionAccuracyMetrics(bets);
  }, [bets]);

  // Calculate prediction accuracy for a bet
  const calculateAccuracy = useCallback((bet) => {
    return calculatePredictionAccuracy(bet);
  }, []);

  // Get prediction accuracy by period
  const getAccuracyByPeriod = useCallback(
    (period = "month") => {
      return getPredictionAccuracyByPeriod(bets, period);
    },
    [bets]
  );

  // Get prediction accuracy by bet type
  const getAccuracyByBetType = useCallback(() => {
    return getPredictionAccuracyByBetType(bets);
  }, [bets]);

  // Get prediction accuracy by league
  const getAccuracyByLeague = useCallback(() => {
    return getPredictionAccuracyByLeague(bets);
  }, [bets]);

  return {
    getAccuracyMetrics,
    calculateAccuracy,
    getAccuracyByPeriod,
    getAccuracyByBetType,
    getAccuracyByLeague,
  };
};
