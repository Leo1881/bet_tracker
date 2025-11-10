import React from "react";

const RecommendationsTab = ({ betRecommendations }) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        🎯 Bet Recommendations
      </h3>
      <div className="text-gray-300 mb-6">
        <p>
          Betting recommendations ranked by risk-adjusted confidence scores.
          Each match shows:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            <span className="text-yellow-300">🥇 PRIMARY</span> - Best bet with
            highest confidence
          </li>
          <li>
            <span className="text-gray-300">🥈 SECONDARY</span> - Second best
            option
          </li>
          <li>
            <span className="text-orange-300">🥉 TERTIARY</span> - Third option
            or AVOID if low confidence
          </li>
        </ul>
        <p className="mt-2">
          Run "Fetch & Analyze New Bets" in the Bet Analysis tab to generate
          recommendations.
        </p>
      </div>

      {betRecommendations.length > 0 ? (
        <div className="space-y-6">
          {betRecommendations.map((rec, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-white">{rec.match}</h4>
                  <p className="text-gray-400 text-sm">
                    {rec.country} - {rec.league}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-blue-400 font-medium">
                    Overall Confidence: {rec.confidence.toFixed(1)}/10
                  </span>
                  <p className="text-gray-400 text-sm">Odds: {rec.odds}</p>
                </div>
              </div>

              {/* Recent Form Display */}
              {rec.recentFormData && (
                <div className="mb-4 bg-white/5 rounded-lg p-3 border border-white/10">
                  <h5 className="text-sm font-semibold text-white mb-2">
                    📈 Recent Form (Last 5 Games)
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-300">Home Team:</span>
                      <div className="flex items-center mt-1">
                        <span className="text-green-400 font-medium">
                          {rec.recentFormData.homeWins}W
                        </span>
                        <span className="text-yellow-400 mx-1">
                          {rec.recentFormData.homeDraws}D
                        </span>
                        <span className="text-red-400">
                          {rec.recentFormData.homeLosses}L
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-300">Away Team:</span>
                      <div className="flex items-center mt-1">
                        <span className="text-green-400 font-medium">
                          {rec.recentFormData.awayWins}W
                        </span>
                        <span className="text-yellow-400 mx-1">
                          {rec.recentFormData.awayDraws}D
                        </span>
                        <span className="text-red-400">
                          {rec.recentFormData.awayLosses}L
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Primary Recommendation */}
                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-400/30 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">🥇</span>
                    <span className="text-yellow-300 font-bold">PRIMARY</span>
                  </div>
                  <div className="text-white font-medium mb-1">
                    {rec.primary.type}
                  </div>
                  <div
                    className={`text-sm ${
                      rec.primary.recommendation.bet === "AVOID"
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {rec.primary.recommendation.bet === "AVOID"
                      ? `AVOID (${rec.primary.recommendation.confidence.toFixed(
                          1
                        )}/10)`
                      : `${
                          rec.primary.recommendation.bet
                        } (${rec.primary.recommendation.confidence.toFixed(
                          1
                        )}/10)`}
                  </div>
                  {rec.primary.recommendation.bet === "AVOID" && (
                    <div className="text-red-300 text-xs mt-1">
                      {rec.primary.recommendation.reasoning}
                    </div>
                  )}
                  <div className="text-gray-400 text-xs mt-1">
                    Risk: {rec.primary.riskLevel}
                  </div>
                  {rec.primary.oddsPerformance && (
                    <div
                      className={`text-xs mt-2 px-2 py-1 rounded ${
                        rec.primary.oddsPerformance.type === "warning"
                          ? "bg-red-500/20 border border-red-500/50 text-red-300"
                          : rec.primary.oddsPerformance.type === "no_data"
                          ? "bg-gray-500/20 border border-gray-500/50 text-gray-400"
                          : "bg-blue-500/20 border border-blue-500/50 text-blue-300"
                      }`}
                    >
                      {rec.primary.oddsPerformance.message}
                    </div>
                  )}
                </div>

                {/* Secondary Recommendation */}
                <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-400/30 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">🥈</span>
                    <span className="text-gray-300 font-bold">SECONDARY</span>
                  </div>
                  <div className="text-white font-medium mb-1">
                    {rec.secondary.type}
                  </div>
                  <div
                    className={`text-sm ${
                      rec.secondary.recommendation.bet === "AVOID"
                        ? "text-red-400"
                        : "text-blue-400"
                    }`}
                  >
                    {rec.secondary.recommendation.bet === "AVOID"
                      ? `AVOID (${rec.secondary.recommendation.confidence.toFixed(
                          1
                        )}/10)`
                      : `${
                          rec.secondary.recommendation.bet
                        } (${rec.secondary.recommendation.confidence.toFixed(
                          1
                        )}/10)`}
                  </div>
                  {rec.secondary.recommendation.bet === "AVOID" && (
                    <div className="text-red-300 text-xs mt-1">
                      {rec.secondary.recommendation.reasoning}
                    </div>
                  )}
                  <div className="text-gray-400 text-xs mt-1">
                    Risk: {rec.secondary.riskLevel}
                  </div>
                  {rec.secondary.oddsPerformance && (
                    <div
                      className={`text-xs mt-2 px-2 py-1 rounded ${
                        rec.secondary.oddsPerformance.type === "warning"
                          ? "bg-red-500/20 border border-red-500/50 text-red-300"
                          : rec.secondary.oddsPerformance.type === "no_data"
                          ? "bg-gray-500/20 border border-gray-500/50 text-gray-400"
                          : "bg-blue-500/20 border border-blue-500/50 text-blue-300"
                      }`}
                    >
                      {rec.secondary.oddsPerformance.message}
                    </div>
                  )}
                </div>

                {/* Tertiary Recommendation */}
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-400/30 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">🥉</span>
                    <span className="text-orange-300 font-bold">TERTIARY</span>
                  </div>
                  <div className="text-white font-medium mb-1">
                    {rec.tertiary.type}
                  </div>
                  <div
                    className={`text-sm ${
                      rec.tertiary.recommendation.bet === "AVOID"
                        ? "text-red-400"
                        : "text-orange-400"
                    }`}
                  >
                    {rec.tertiary.recommendation.bet === "AVOID"
                      ? `AVOID (${rec.tertiary.recommendation.confidence.toFixed(
                          1
                        )}/10)`
                      : `${
                          rec.tertiary.recommendation.bet
                        } (${rec.tertiary.recommendation.confidence.toFixed(
                          1
                        )}/10)`}
                  </div>
                  {rec.tertiary.recommendation.bet === "AVOID" && (
                    <div className="text-red-300 text-xs mt-1">
                      {rec.tertiary.recommendation.reasoning}
                    </div>
                  )}
                  <div className="text-gray-400 text-xs mt-1">
                    Risk: {rec.tertiary.riskLevel}
                  </div>
                  {rec.tertiary.oddsPerformance && (
                    <div
                      className={`text-xs mt-2 px-2 py-1 rounded ${
                        rec.tertiary.oddsPerformance.type === "warning"
                          ? "bg-red-500/20 border border-red-500/50 text-red-300"
                          : rec.tertiary.oddsPerformance.type === "no_data"
                          ? "bg-gray-500/20 border border-gray-500/50 text-gray-400"
                          : "bg-blue-500/20 border border-blue-500/50 text-blue-300"
                      }`}
                    >
                      {rec.tertiary.oddsPerformance.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🎯</div>
          <h4 className="text-lg font-semibold text-white mb-2">
            No Recommendations Yet
          </h4>
          <p className="text-gray-300">
            Run "Fetch & Analyze New Bets" in the Bet Analysis tab to generate
            betting recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationsTab;
