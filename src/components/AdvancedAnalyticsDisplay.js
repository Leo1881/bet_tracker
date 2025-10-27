import React from "react";

const AdvancedAnalyticsDisplay = ({ analytics }) => {
  console.log("AdvancedAnalyticsDisplay received:", analytics);

  if (!analytics) {
    console.log("No analytics data provided");
    return null;
  }

  const { confidenceInterval, riskAssessment, display } = analytics;
  console.log("Extracted data:", {
    confidenceInterval,
    riskAssessment,
    display,
  });

  return (
    <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
      <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center">
        📊 Advanced Analytics
      </h4>

      {/* Debug info */}
      <div className="mb-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs text-yellow-300">
        Debug: Component is rendering with data
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Confidence Interval */}
        <div className="bg-gray-700/50 p-2 rounded">
          <div className="text-gray-300 font-medium mb-1">Confidence Range</div>
          <div className="text-white">
            {display.score} {display.interval}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-gray-700/50 p-2 rounded">
          <div className="text-gray-300 font-medium mb-1">Risk Level</div>
          <div
            className={`font-semibold ${
              riskAssessment?.riskLevel === "Low"
                ? "text-green-400"
                : riskAssessment?.riskLevel === "Medium"
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {display.riskLevel} Risk
          </div>
        </div>

        {/* Profit Probability */}
        <div className="bg-gray-700/50 p-2 rounded">
          <div className="text-gray-300 font-medium mb-1">
            Profit Probability
          </div>
          <div className="text-white font-semibold">
            {display.profitProbability}
          </div>
        </div>

        {/* Statistical Significance */}
        <div className="bg-gray-700/50 p-2 rounded">
          <div className="text-gray-300 font-medium mb-1">
            Trend Significance
          </div>
          <div className="text-white font-semibold">{display.significance}</div>
        </div>
      </div>

      {/* Monte Carlo Results */}
      {riskAssessment?.monteCarlo && (
        <div className="mt-3 p-2 bg-gray-700/30 rounded text-xs">
          <div className="text-gray-300 font-medium mb-1">
            Monte Carlo Analysis (100 bets)
          </div>
          <div className="grid grid-cols-2 gap-2 text-gray-200">
            <div>Avg ROI: {riskAssessment.monteCarlo.avgROI.toFixed(1)}%</div>
            <div>
              Break-even:{" "}
              {Math.round(riskAssessment.monteCarlo.breakEvenProbability * 100)}
              %
            </div>
          </div>
        </div>
      )}

      {/* Risk Factors */}
      {riskAssessment?.factors && (
        <div className="mt-2 text-xs text-gray-400">
          <div className="font-medium mb-1">Risk Factors:</div>
          <div className="space-y-1">
            <div>Sample Size: {riskAssessment.factors.sampleSize} bets</div>
            <div>
              Confidence Range: ±{(confidenceInterval?.margin || 0).toFixed(1)}
            </div>
            <div>
              Statistical Significance:{" "}
              {Math.round(riskAssessment.factors.significance)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalyticsDisplay;
