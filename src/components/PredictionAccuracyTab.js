import React from "react";

const PredictionAccuracyTab = ({ getPredictionAccuracyMetrics }) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        Prediction Accuracy Dashboard
      </h3>
      <div className="text-gray-300 mb-6">
        <p>
          Track how accurate the system's predictions are compared to actual
          results.
        </p>
      </div>

      {(() => {
        const metrics = getPredictionAccuracyMetrics();
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

            {/* Accuracy by Confidence */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <h4 className="text-lg font-semibold text-white mb-4">
                Accuracy by Confidence Level
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-400">
                    {metrics.byConfidence["4-6"]?.toFixed(1) || 0}%
                  </div>
                  <div className="text-gray-300 text-sm">
                    Low Confidence (4-6)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-400">
                    {metrics.byConfidence["6-8"]?.toFixed(1) || 0}%
                  </div>
                  <div className="text-gray-300 text-sm">
                    Medium Confidence (6-8)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-400">
                    {metrics.byConfidence["8-10"]?.toFixed(1) || 0}%
                  </div>
                  <div className="text-gray-300 text-sm">
                    High Confidence (8-10)
                  </div>
                </div>
              </div>
            </div>

            {/* Accuracy by Bet Type */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <h4 className="text-lg font-semibold text-white mb-4">
                Accuracy by Bet Type
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(metrics.byBetType).map(
                  ([betType, accuracy]) => (
                    <div key={betType} className="text-center">
                      <div className="text-xl font-bold text-purple-400">
                        {accuracy.toFixed(1)}%
                      </div>
                      <div className="text-gray-300 text-sm">{betType}</div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Accuracy by Recommendation Type */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <h4 className="text-lg font-semibold text-white mb-4">
                Accuracy by Recommendation Type
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(metrics.byRecommendationType).map(
                  ([recType, accuracy]) => (
                    <div key={recType} className="text-center">
                      <div
                        className={`text-xl font-bold ${
                          recType === "AVOID"
                            ? "text-red-400"
                            : recType === "WIN"
                            ? "text-green-400"
                            : recType === "OVER"
                            ? "text-blue-400"
                            : "text-gray-400"
                        }`}
                      >
                        {accuracy.toFixed(1)}%
                      </div>
                      <div className="text-gray-300 text-sm">{recType}</div>
                    </div>
                  )
                )}
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
          </div>
        );
      })()}
    </div>
  );
};

export default PredictionAccuracyTab;
