/**
 * Advanced Analytics Service
 * Provides statistical confidence intervals, Monte Carlo simulations, and risk analysis
 */

/**
 * Calculate confidence intervals for win rates using Wilson Score method
 * @param {number} wins - Number of wins
 * @param {number} total - Total number of games
 * @param {number} confidenceLevel - Confidence level (default 0.95 for 95%)
 * @returns {Object} Confidence interval object
 */
export const calculateConfidenceIntervals = (wins, total, confidenceLevel = 0.95) => {
  if (total === 0) {
    return {
      winRate: 0,
      lowerBound: 0,
      upperBound: 0,
      margin: 0,
      confidenceLevel: confidenceLevel
    };
  }

  const winRate = wins / total;
  const z = getZScore(confidenceLevel);
  const n = total;
  
  // Wilson Score confidence interval
  const p = winRate;
  const z2 = z * z;
  const nz2 = n + z2;
  
  const center = (p * n + z2 / 2) / nz2;
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
  
  const lowerBound = Math.max(0, center - margin);
  const upperBound = Math.min(1, center + margin);
  
  return {
    winRate: winRate,
    lowerBound: lowerBound,
    upperBound: upperBound,
    margin: margin,
    confidenceLevel: confidenceLevel,
    range: upperBound - lowerBound
  };
};

/**
 * Get Z-score for given confidence level
 * @param {number} confidenceLevel - Confidence level (0.95 for 95%)
 * @returns {number} Z-score
 */
const getZScore = (confidenceLevel) => {
  const zScores = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576
  };
  return zScores[confidenceLevel] || 1.96;
};

/**
 * Run Monte Carlo simulation for betting performance
 * @param {number} winRate - Historical win rate
 * @param {number} numBets - Number of bets to simulate
 * @param {number} numSimulations - Number of simulations to run
 * @param {number} avgOdds - Average odds for bets
 * @returns {Object} Monte Carlo results
 */
export const runMonteCarloSimulation = (winRate, numBets, numSimulations = 10000, avgOdds = 2.0) => {
  const results = [];
  
  for (let i = 0; i < numSimulations; i++) {
    let totalReturn = 0;
    let wins = 0;
    
    for (let j = 0; j < numBets; j++) {
      const isWin = Math.random() < winRate;
      if (isWin) {
        wins++;
        totalReturn += (avgOdds - 1); // Profit from winning bet
      } else {
        totalReturn -= 1; // Loss from losing bet
      }
    }
    
    const winRateSim = wins / numBets;
    const roi = (totalReturn / numBets) * 100;
    
    results.push({
      wins: wins,
      losses: numBets - wins,
      winRate: winRateSim,
      roi: roi,
      totalReturn: totalReturn
    });
  }
  
  // Calculate statistics
  const rois = results.map(r => r.roi);
  const winRates = results.map(r => r.winRate);
  
  const avgROI = rois.reduce((sum, roi) => sum + roi, 0) / rois.length;
  const medianROI = rois.sort((a, b) => a - b)[Math.floor(rois.length / 2)];
  const profitProbability = rois.filter(roi => roi > 0).length / rois.length;
  const breakEvenProbability = rois.filter(roi => roi >= 0).length / rois.length;
  
  const roiPercentiles = {
    p10: rois.sort((a, b) => a - b)[Math.floor(rois.length * 0.1)],
    p25: rois.sort((a, b) => a - b)[Math.floor(rois.length * 0.25)],
    p75: rois.sort((a, b) => a - b)[Math.floor(rois.length * 0.75)],
    p90: rois.sort((a, b) => a - b)[Math.floor(rois.length * 0.9)]
  };
  
  return {
    numSimulations: numSimulations,
    numBets: numBets,
    winRate: winRate,
    avgOdds: avgOdds,
    avgROI: avgROI,
    medianROI: medianROI,
    profitProbability: profitProbability,
    breakEvenProbability: breakEvenProbability,
    roiPercentiles: roiPercentiles,
    results: results
  };
};

/**
 * Calculate statistical significance of performance trends
 * @param {number} wins - Number of wins
 * @param {number} total - Total number of games
 * @param {number} expectedWinRate - Expected win rate (default 0.5)
 * @returns {Object} Statistical significance results
 */
export const calculateStatisticalSignificance = (wins, total, expectedWinRate = 0.5) => {
  if (total === 0) {
    return {
      isSignificant: false,
      pValue: 1,
      significance: 0,
      zScore: 0
    };
  }
  
  const observedWinRate = wins / total;
  const expectedWins = total * expectedWinRate;
  const variance = total * expectedWinRate * (1 - expectedWinRate);
  const standardError = Math.sqrt(variance);
  
  // Z-score calculation
  const zScore = (wins - expectedWins) / standardError;
  
  // P-value approximation (two-tailed test)
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  
  // Significance level
  const significance = Math.max(0, Math.min(1, (1 - pValue) * 100));
  
  return {
    isSignificant: pValue < 0.05,
    pValue: pValue,
    significance: significance,
    zScore: zScore,
    observedWinRate: observedWinRate,
    expectedWinRate: expectedWinRate
  };
};

/**
 * Normal CDF approximation
 * @param {number} x - Input value
 * @returns {number} Cumulative distribution function value
 */
const normalCDF = (x) => {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
};

/**
 * Error function approximation
 * @param {number} x - Input value
 * @returns {number} Error function value
 */
const erf = (x) => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
};

/**
 * Calculate risk assessment for a betting recommendation
 * @param {Object} confidenceBreakdown - Individual confidence scores
 * @param {number} winRate - Historical win rate
 * @param {number} totalBets - Total number of historical bets
 * @param {number} avgOdds - Average odds
 * @returns {Object} Risk assessment
 */
export const calculateRiskAssessment = (confidenceBreakdown, winRate, totalBets, avgOdds = 2.0) => {
  // Calculate confidence intervals
  const confidenceInterval = calculateConfidenceIntervals(
    Math.round(winRate * totalBets), 
    totalBets
  );
  
  // Run Monte Carlo simulation
  const monteCarlo = runMonteCarloSimulation(winRate, 100, 10000, avgOdds);
  
  // Calculate statistical significance for overall performance
  const significance = calculateStatisticalSignificance(
    Math.round(winRate * totalBets), 
    totalBets
  );
  
  // Determine risk level based on multiple factors
  let riskLevel = 'Medium';
  let riskScore = 0;
  
  // Factor 1: Confidence interval width (narrower = lower risk)
  const intervalWidth = confidenceInterval.range;
  if (intervalWidth < 0.1) riskScore += 2;
  else if (intervalWidth < 0.2) riskScore += 1;
  else if (intervalWidth > 0.4) riskScore -= 2;
  
  // Factor 2: Sample size (larger = lower risk)
  if (totalBets >= 50) riskScore += 2;
  else if (totalBets >= 20) riskScore += 1;
  else if (totalBets < 10) riskScore -= 2;
  
  // Factor 3: Statistical significance (higher = lower risk)
  if (significance.significance >= 90) riskScore += 2;
  else if (significance.significance >= 70) riskScore += 1;
  else if (significance.significance < 50) riskScore -= 1;
  
  // Factor 4: Monte Carlo profit probability
  if (monteCarlo.profitProbability >= 0.8) riskScore += 2;
  else if (monteCarlo.profitProbability >= 0.6) riskScore += 1;
  else if (monteCarlo.profitProbability < 0.4) riskScore -= 2;
  
  // Determine risk level
  if (riskScore >= 4) riskLevel = 'Low';
  else if (riskScore >= 1) riskLevel = 'Medium';
  else riskLevel = 'High';
  
  return {
    riskLevel: riskLevel,
    riskScore: riskScore,
    confidenceInterval: confidenceInterval,
    monteCarlo: monteCarlo,
    significance: significance,
    factors: {
      intervalWidth: intervalWidth,
      sampleSize: totalBets,
      significance: significance.significance,
      profitProbability: monteCarlo.profitProbability
    }
  };
};

/**
 * Generate enhanced confidence display with intervals and risk analysis
 * @param {number} confidenceScore - Base confidence score (0-10)
 * @param {Object} confidenceBreakdown - Individual confidence scores
 * @param {number} winRate - Historical win rate
 * @param {number} totalBets - Total number of historical bets
 * @param {number} avgOdds - Average odds
 * @returns {Object} Enhanced confidence display object
 */
export const generateEnhancedConfidenceDisplay = (confidenceScore, confidenceBreakdown, winRate, totalBets, avgOdds = 2.0) => {
  // Calculate risk assessment
  const riskAssessment = calculateRiskAssessment(confidenceBreakdown, winRate, totalBets, avgOdds);
  
  // Calculate confidence intervals for the main score
  const confidenceInterval = calculateConfidenceIntervals(
    Math.round(confidenceScore * totalBets / 10), 
    totalBets
  );
  
  // Convert to 0-10 scale
  const lowerBound = confidenceInterval.lowerBound * 10;
  const upperBound = confidenceInterval.upperBound * 10;
  const margin = confidenceInterval.margin * 10;
  
  return {
    baseScore: confidenceScore,
    confidenceInterval: {
      lower: lowerBound,
      upper: upperBound,
      margin: margin,
      range: upperBound - lowerBound
    },
    riskAssessment: riskAssessment,
    display: {
      score: `${confidenceScore.toFixed(1)}/10`,
      interval: `±${margin.toFixed(1)} (${lowerBound.toFixed(1)}-${upperBound.toFixed(1)})`,
      riskLevel: riskAssessment.riskLevel,
      profitProbability: `${Math.round(riskAssessment.monteCarlo.profitProbability * 100)}%`,
      significance: `${Math.round(riskAssessment.significance.significance)}%`
    }
  };
};





