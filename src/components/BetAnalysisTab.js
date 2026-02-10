import React from "react";

const BetAnalysisTab = ({
  analyzeNewBets,
  isAnalyzing,
  generatePDFReport,
  saveBetslipToDb,
  isSavingBetslip,
  analysisResults,
  handleAnalysisSort,
  analysisSortConfig,
  getSortedAnalysisResults,
  formatDate,
  getStatusColor,
  getPositionBadge,
  isTeamInTop40,
  getTop40Ranking,
  getBetTypeAnalyticsForTeam,
  getTeamNotesForTeam,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-bold text-white">Bet Analysis</h3>
        <div className="relative ml-2 group">
          <button className="text-blue-400 hover:text-blue-300 text-sm bg-blue-500/20 hover:bg-blue-500/30 rounded-full w-6 h-6 flex items-center justify-center transition-colors">
            ?
          </button>
          <div className="absolute left-0 top-8 w-96 bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
            <div className="mb-3">
              <strong className="text-white">Confidence Score (0-100%):</strong>
              <br />
              🏆 Team Performance: Historical win rate and betting experience
              <br />
              📈 Recent Form: Team's performance in last 5 games
              <br />
              🚀 Team Momentum: Recent trend (improving/declining)
              <br />
              🏛️ League Experience: Your success rate in this league/country
              <br />
              💰 Odds Value: Risk assessment based on betting odds
              <br />
              ⚔️ Head-to-Head: Previous results when these teams met
              <br />
              📊 League Position: Team strength based on league position
              (Top/Mid/Bottom)
              <br />
              🏠 Home/Away: Team performance in home vs away games
            </div>
            <div>
              <strong className="text-white">📊 Probability Calculator:</strong>
              <br />
              🏠 Home/Draw/Away: Mathematical probabilities from odds
              <br />
              📈 Expected Goals: Poisson distribution modeling
              <br />
              🎯 Top Scorelines: Most likely final scores
            </div>
          </div>
        </div>
      </div>

      {/* Fetch and Analyze Button */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={analyzeNewBets}
          disabled={isAnalyzing}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            isAnalyzing
              ? "bg-gray-500 text-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isAnalyzing ? "🔄 Analyzing..." : "Fetch & Analyze New Bets"}
        </button>
        <button
          onClick={generatePDFReport}
          disabled={!analysisResults || analysisResults.length === 0}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            !analysisResults || analysisResults.length === 0
              ? "bg-gray-500 text-gray-300 cursor-not-allowed"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          📄 Generate PDF Report
        </button>
        <button
          onClick={saveBetslipToDb}
          disabled={
            !analysisResults ||
            analysisResults.length === 0 ||
            isSavingBetslip
          }
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            !analysisResults ||
            analysisResults.length === 0 ||
            isSavingBetslip
              ? "bg-gray-500 text-gray-300 cursor-not-allowed"
              : "bg-indigo-500 text-white hover:bg-indigo-600"
          }`}
        >
          {isSavingBetslip ? "💾 Uploading..." : "💾 Upload To DB"}
        </button>
      </div>

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white mb-4">
            📋 Analysis Results ({analysisResults.length} bets)
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/20">
                <tr>
                  <th className="px-4 py-2 text-left text-white font-semibold w-40">
                    Match
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold w-24">
                    Bet On
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold w-16">
                    Odds
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold w-80">
                    Confidence
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold w-80">
                    Probability
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold w-80">
                    History
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold w-32">
                    Previous Matchups
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold w-32">
                    Recommendation
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold w-40">
                    Scoring
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {getSortedAnalysisResults().map((result, index) => (
                  <tr
                    key={index}
                    className={`${
                      index % 2 === 0 ? "bg-white/5" : "bg-white/10"
                    }`}
                  >
                    <td className="px-4 py-6 text-gray-300">
                      <div className="text-sm">
                        <div className="font-medium text-white">
                          {(() => {
                            const homeBadge = getPositionBadge(
                              result.HOME_TEAM_POSITION
                            );
                            const awayBadge = getPositionBadge(
                              result.AWAY_TEAM_POSITION
                            );
                            return (
                              <>
                                {result.HOME_TEAM || "N/A"}
                                {homeBadge && (
                                  <span
                                    className={`ml-2 text-xs ${
                                      homeBadge.color || "text-gray-400"
                                    }`}
                                  >
                                    ({homeBadge.text})
                                  </span>
                                )}{" "}
                                vs{" "}
                                {result.AWAY_TEAM || "N/A"}
                                {awayBadge && (
                                  <span
                                    className={`ml-2 text-xs ${
                                      awayBadge.color || "text-gray-400"
                                    }`}
                                  >
                                    ({awayBadge.text})
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        {result.positionGap && (
                          <div className="mt-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                result.positionGap.gapLabel === "Large"
                                  ? "bg-amber-500/30 text-amber-200"
                                  : result.positionGap.gapLabel === "Moderate"
                                    ? "bg-blue-500/20 text-blue-200"
                                    : "bg-white/10 text-gray-400"
                              }`}
                              title={`Position gap: ${result.positionGap.gapLabel} (${(result.positionGap.relativeGap * 100).toFixed(0)}% of table)`}
                            >
                              Position gap: {result.positionGap.gapLabel}
                            </span>
                          </div>
                        )}
                        <div className="text-gray-400">
                          {result.COUNTRY || "N/A"} - {result.LEAGUE || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-purple-300 font-medium">
                      <div>
                        {result.TEAM_INCLUDED || "N/A"}
                        {isTeamInTop40(result.TEAM_INCLUDED) && (
                          <div className="text-xs text-yellow-400 mt-1">
                            Top 40: #{getTop40Ranking(result.TEAM_INCLUDED)}
                          </div>
                        )}
                        {result.isBlacklisted && (
                          <div className="text-xs text-red-400 mt-1 font-medium">
                            🚫 Blacklisted
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-6 text-yellow-400 font-mono">
                      {result.betOdds || "N/A"}
                    </td>
                    <td className="px-4 py-6">
                      <div className="text-sm">
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              result.confidenceLabel?.color ||
                              "bg-gray-100 text-gray-800"
                            } cursor-help`}
                            title={`${result.confidenceLabel?.label || "N/A"}
🏆 Team Performance: ${result.confidenceBreakdown?.team || 0}%
📈 Recent Form: ${result.confidenceBreakdown?.recentForm || 0}%
🚀 Team Momentum: ${result.confidenceBreakdown?.momentum || 0}%
🏛️ League Experience: ${result.confidenceBreakdown?.league || 0}%
💰 Odds Value: ${result.confidenceBreakdown?.odds || 0}%
⚔️ Head-to-Head: ${result.confidenceBreakdown?.matchup || 0}%
📊 League Position: ${result.confidenceBreakdown?.position || 0}%
🏠 Home/Away: ${result.confidenceBreakdown?.homeAway || 0}%`}
                          >
                            {result.confidenceLabel?.emoji || "❓"}{" "}
                            {result.confidenceScore || 0}%
                          </span>
                          <span className="text-xs text-gray-400">
                            {result.confidenceLabel?.label || "N/A"}
                          </span>
                        </div>

                        {/* Bet Type Suggestions */}
                        {(() => {
                          const betTypeAnalytics = getBetTypeAnalyticsForTeam(
                            result.TEAM_INCLUDED,
                            result.COUNTRY,
                            result.LEAGUE
                          );

                          if (betTypeAnalytics && betTypeAnalytics.length > 0) {
                            const topBetTypes = betTypeAnalytics.slice(0, 3);
                            return (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <div className="text-xs text-blue-400 font-medium mb-2">
                                  💡 Bet Type Tips for {result.TEAM_INCLUDED}:
                                </div>
                                {topBetTypes.map((betType, idx) => {
                                  const isGood =
                                    parseFloat(betType.winRate) >= 60;
                                  const isAverage =
                                    parseFloat(betType.winRate) >= 40;
                                  const icon = isGood
                                    ? "✅"
                                    : isAverage
                                    ? "⚠️"
                                    : "❌";
                                  const color = isGood
                                    ? "text-green-300"
                                    : isAverage
                                    ? "text-yellow-300"
                                    : "text-red-300";

                                  return (
                                    <div
                                      key={idx}
                                      className={`text-xs ${color} mb-1`}
                                    >
                                      {icon} {betType.betType}:{" "}
                                      {betType.winRate}% ({betType.wins}/
                                      {betType.total})
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Team Notes Display */}
                        {(() => {
                          const homeTeamNotes = getTeamNotesForTeam(
                            result.HOME_TEAM,
                            result.COUNTRY,
                            result.LEAGUE
                          );
                          const awayTeamNotes = getTeamNotesForTeam(
                            result.AWAY_TEAM,
                            result.COUNTRY,
                            result.LEAGUE
                          );

                          if (
                            homeTeamNotes.length > 0 ||
                            awayTeamNotes.length > 0
                          ) {
                            return (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <div className="text-xs text-orange-400 font-medium mb-2">
                                  📝 Team Notes:
                                </div>
                                {homeTeamNotes.map((note, idx) => (
                                  <div
                                    key={`home-${idx}`}
                                    className="text-xs text-orange-300 mb-1"
                                  >
                                    <span className="font-medium">
                                      {result.HOME_TEAM}:
                                    </span>{" "}
                                    {note.NOTE}
                                    <span className="text-gray-400 ml-1">
                                      ({note.DATE_ADDED})
                                    </span>
                                  </div>
                                ))}
                                {awayTeamNotes.map((note, idx) => (
                                  <div
                                    key={`away-${idx}`}
                                    className="text-xs text-orange-300 mb-1"
                                  >
                                    <span className="font-medium">
                                      {result.AWAY_TEAM}:
                                    </span>{" "}
                                    {note.NOTE}
                                    <span className="text-gray-400 ml-1">
                                      ({note.DATE_ADDED})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      {result.probabilities ? (
                        <div className="text-sm">
                          <div className="mb-2">
                            <div className="text-xs text-gray-400 mb-1">
                              Win Probabilities:
                            </div>
                            <div className="flex space-x-2 text-xs">
                              <span className="text-blue-300">
                                🏠 {result.probabilities?.probs?.home || "N/A"}%
                              </span>
                              <span className="text-yellow-300">
                                🤝 {result.probabilities?.probs?.draw || "N/A"}%
                              </span>
                              <span className="text-red-300">
                                ✈️ {result.probabilities?.probs?.away || "N/A"}%
                              </span>
                            </div>
                          </div>
                          <div className="mb-2">
                            <div className="text-xs text-gray-400 mb-1">
                              Expected Goals per team:
                            </div>
                            <div className="text-xs text-purple-300">
                              🏠 {result.probabilities?.lambda?.home || "N/A"} | ✈️{" "}
                              {result.probabilities?.lambda?.away || "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 mb-1">
                              Top Scorelines:
                            </div>
                            {result.probabilities?.topScores
                              ?.slice(0, 3)
                              ?.map((score, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-green-300"
                                >
                                  {score.score} ({score.prob}%)
                                </div>
                              )) || (
                              <div className="text-xs text-gray-400">
                                No data
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          No odds data
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-6 text-gray-300">
                      {result.hasHistory ? (
                        <div className="text-sm">
                          <div>
                            {result.historicalWins}W - {result.historicalLosses}
                            L
                          </div>
                          <div className="text-xs mt-2">
                            {result.winRate}% win rate
                          </div>
                          {result.competitions &&
                            result.competitions.length > 0 && (
                              <div className="mt-1">
                                <div className="text-xs text-blue-400 font-medium">
                                  Competitions:
                                </div>
                                {result.competitions.map((comp, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs text-blue-300"
                                  >
                                    • {comp}
                                  </div>
                                ))}
                              </div>
                            )}
                          {result.winDetails &&
                            result.winDetails.length > 0 && (
                              <div className="mt-1">
                                <div className="text-xs text-green-400 font-medium">
                                  Wins:
                                </div>
                                {result.winDetails.map((detail, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs text-green-300"
                                  >
                                    • {detail}
                                  </div>
                                ))}
                              </div>
                            )}
                          {result.lossDetails &&
                            result.lossDetails.length > 0 && (
                              <div className="mt-1">
                                <div className="text-xs text-red-400 font-medium">
                                  Losses:
                                </div>
                                {result.lossDetails.map((detail, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs text-red-300"
                                  >
                                    • {detail}
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          No history
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-6 text-gray-300">
                      {result.previousMatchups &&
                      result.previousMatchups.length > 0 ? (
                        <div className="text-sm">
                          <div className="text-blue-400 font-medium mb-1">
                            🔄 {result.previousMatchups.length} previous matchup
                            {result.previousMatchups.length > 1 ? "s" : ""}
                          </div>
                          {(() => {
                            const wins = result.previousMatchups.filter((m) =>
                              m.result?.toLowerCase().includes("win")
                            ).length;
                            const losses = result.previousMatchups.filter((m) =>
                              m.result?.toLowerCase().includes("loss")
                            ).length;
                            const total = wins + losses;
                            const winRate =
                              total > 0 ? ((wins / total) * 100).toFixed(1) : 0;

                            return (
                              <div className="text-xs">
                                <div className="text-gray-300 mb-1">
                                  {wins}W - {losses}L
                                </div>
                                <span
                                  className={`px-1 py-0.5 rounded text-xs font-medium mt-2 ${
                                    parseFloat(winRate) >= 70
                                      ? "bg-green-100 text-green-800"
                                      : parseFloat(winRate) >= 50
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {winRate}% win rate
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          No previous matchups
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-6">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${result.recommendationColor}`}
                      >
                        {result.recommendation}
                      </span>
                    </td>
                    <td className="px-4 py-6">
                      {result.scoringRecommendation ? (
                        <div className="text-sm">
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              result.scoringRecommendation.confidence === "high"
                                ? "bg-green-100 text-green-800"
                                : result.scoringRecommendation.confidence ===
                                  "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {result.scoringRecommendation.type}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {result.scoringRecommendation.rate.toFixed(1)}% rate
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No data</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <h5 className="text-white font-semibold mb-3">📊 Summary</h5>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Total Bets</div>
                <div className="text-white font-medium">
                  {analysisResults.length}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Blacklisted</div>
                <div className="text-red-400 font-medium">
                  {analysisResults.filter((r) => r.isBlacklisted).length}
                </div>
              </div>
              <div>
                <div className="text-gray-400">High Confidence</div>
                <div className="text-green-400 font-medium">
                  {
                    analysisResults.filter(
                      (r) =>
                        r.recommendation.includes("Win") ||
                        r.recommendation === "Home Win" ||
                        r.recommendation === "Away Win"
                    ).length
                  }
                </div>
              </div>
              <div>
                <div className="text-gray-400">Double Chance</div>
                <div className="text-yellow-400 font-medium">
                  {
                    analysisResults.filter((r) =>
                      r.recommendation.includes("Double Chance")
                    ).length
                  }
                </div>
              </div>
              <div>
                <div className="text-gray-400">Avoid</div>
                <div className="text-red-400 font-medium">
                  {
                    analysisResults.filter((r) =>
                      r.recommendation.includes("Avoid")
                    ).length
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No results message */}
      {analysisResults.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h4 className="text-lg font-semibold text-white mb-2">
            No Analysis Results Yet
          </h4>
          <p className="text-gray-300">
            Click "Fetch & Analyze New Bets" to get started with bet analysis.
          </p>
        </div>
      )}
    </div>
  );
};

export default BetAnalysisTab;
