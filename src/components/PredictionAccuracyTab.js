import React, { useState, useEffect } from "react";

const PredictionAccuracyTab = ({ getPredictionAccuracyMetrics }) => {
  const [metrics, setMetrics] = useState({
    totalPredictions: 0,
    correctPredictions: 0,
    overallAccuracy: 0,
    byConfidence: {},
    byBetType: {},
    byRecommendationType: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getPredictionAccuracyMetrics();
        setMetrics(result);
      } catch (err) {
        console.error("Error fetching metrics:", err);
        setError("Failed to load prediction accuracy data");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [getPredictionAccuracyMetrics]);

  // Force refresh when component mounts or when refresh button is clicked
  const forceRefresh = () => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getPredictionAccuracyMetrics();
        setMetrics(result);
      } catch (err) {
        console.error("Error fetching metrics:", err);
        setError("Failed to load prediction accuracy data");
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Prediction Accuracy Dashboard
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-300">Loading prediction accuracy data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Prediction Accuracy Dashboard
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        Prediction Accuracy Dashboard
      </h3>
      <div className="text-gray-300 mb-6">
        <p>
          Track how accurate the system's predictions are compared to actual
          results. Data is sourced from database recommendations with analyzed
          prediction accuracy.
        </p>
      </div>

      {(() => {
        return (
          <div className="space-y-6">
            {/* Overall Performance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">
                  {metrics.totalPredictions}
                </div>
                <div className="text-gray-300 text-sm">Total Predictions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold text-blue-400">
                  {metrics.overallAccuracy.toFixed(1)}%
                </div>
                <div className="text-gray-300 text-sm">Overall Accuracy</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold text-green-400">
                  {metrics.correctPredictions}
                </div>
                <div className="text-gray-300 text-sm">Correct Predictions</div>
              </div>
            </div>

            {/* Accuracy by Bet Type */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <h4 className="text-lg font-semibold text-white mb-4">
                Accuracy by System Recommendation Type
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(metrics.byBetType).map(([betType, data]) => (
                  <div key={betType} className="text-center">
                    <div className="text-xl font-bold text-purple-400">
                      {data.accuracy?.toFixed(1) || 0}%
                    </div>
                    <div className="text-gray-300 text-sm">
                      {betType} ({data.total || 0} total)
                    </div>
                    <div className="text-yellow-400 text-xs">
                      {data.pending || 0} pending
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {metrics.totalPredictions === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  No Prediction Data Yet
                </h4>
                <p className="text-gray-300">
                  Run "Fetch & Analyze New Bets" to generate predictions and
                  track their accuracy.
                </p>
              </div>
            )}

            {/* Refresh Button */}
            <div className="text-center pt-4">
              <button
                onClick={forceRefresh}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🔄 Refresh Data
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PredictionAccuracyTab;
