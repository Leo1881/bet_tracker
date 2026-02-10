import React, { useState, useEffect } from "react";
import { fetchSheetData } from "../utils/fetchSheetData";

const RecommendationAnalysisTab = ({
  compareRecommendationsWithResults,
  isComparing,
  comparisonResults,
  setComparisonResults,
}) => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedBetslip, setSelectedBetslip] = useState("");
  const [availableBetslips, setAvailableBetslips] = useState([]);
  const [storedResults, setStoredResults] = useState(null);
  const [comparingLocal, setComparingLocal] = useState(false);

  // Fetch available betslips from new API (betslip_recommendations)
  useEffect(() => {
    const fetchAvailableBetslips = async () => {
      try {
        const response = await fetch("/api/betslip-recommendations/bet-ids");
        if (response.ok) {
          const betIds = await response.json();
          setAvailableBetslips(Array.isArray(betIds) ? betIds : []);
        }
      } catch (error) {
        console.error("Error fetching available betslips:", error);
      }
    };

    fetchAvailableBetslips();
  }, []);

  // Fetch games for selected betslip from new API (betslip_recommendations)
  useEffect(() => {
    const fetchStoredResults = async () => {
      if (!selectedBetslip) {
        setStoredResults(null);
        return;
      }

      try {
        const response = await fetch(
          `/api/betslip-recommendations?bet_id=${encodeURIComponent(selectedBetslip)}`
        );
        if (response.ok) {
          const recommendations = await response.json();

          // Debug: Log what we got from the database
          console.log("Fetched recommendations for betslip:", selectedBetslip);
          console.log("Number of recommendations:", recommendations.length);
          if (recommendations.length > 0) {
            console.log("First recommendation:", recommendations[0]);
            console.log(
              "prediction_accurate:",
              recommendations[0].prediction_accurate
            );
            console.log("actual_result:", recommendations[0].actual_result);
            console.log("bet_type from API:", recommendations[0].bet_type);
          }

          // Map betslip_recommendations rows to the format expected by the UI
          const matched = (Array.isArray(recommendations) ? recommendations : []).map((rec) => {
            const hasResult = rec.actual_result && String(rec.actual_result).trim() !== "";
            const isPending = !hasResult;
            const resultLower = hasResult ? String(rec.actual_result).toLowerCase() : "";
            const recLower = (rec.recommendation || "").toLowerCase();
            let isCorrect = false;
            if (hasResult) {
              if (rec.prediction_accurate === true || rec.prediction_accurate === "true") {
                isCorrect = true;
              } else if (rec.analysis_type === "Both Correct" || rec.analysis_type === "System Right, You Lost") {
                isCorrect = true;
              } else {
                isCorrect = (resultLower.includes("win") && recLower.includes("win")) || (resultLower.includes("loss") && (recLower.includes("avoid") || recLower.includes("loss")));
              }
            }
            let failureReason = "";
            const confidenceAnalysis = rec.confidence_breakdown && typeof rec.confidence_breakdown === "object" ? rec.confidence_breakdown : {};
            if (!isCorrect && hasResult && rec.recommendation) {
              failureReason = `Recommendation: ${rec.recommendation}. Result: ${rec.actual_result}`;
            }
            return {
              bet_id: rec.bet_id,
              game_id: rec.game_id,
              date: rec.date,
              home_team: rec.home_team,
              away_team: rec.away_team,
              recommendation: rec.recommendation,
              primary_recommendation: rec.primary_recommendation || rec.recommendation,
              secondary_recommendation: rec.secondary_recommendation,
              tertiary_recommendation: rec.tertiary_recommendation,
              bet_type: rec.bet_type,
              bet_selection: rec.bet_selection,
              confidence_score: rec.confidence_score,
              actual_result: rec.actual_result,
              prediction_accurate: rec.prediction_accurate,
              your_bet_won: rec.your_bet_won,
              analysis_type: rec.analysis_type,
              insight: rec.insight,
              analysis: {
                isCorrect,
                isPending,
                failureReason: failureReason || null,
                confidenceAnalysis: typeof confidenceAnalysis === "object" ? confidenceAnalysis : {},
                analysisType: rec.analysis_type || "",
                insight: rec.insight || "",
              },
            };
          });

          const analysis = {
            total: matched.length,
            correct: matched.filter((m) => m.analysis.isCorrect).length,
            wrong: matched.filter(
              (m) => !m.analysis.isCorrect && !m.analysis.isPending
            ).length,
            pending: matched.filter((m) => m.analysis.isPending).length,
          };

          console.log("Final analysis counts:", analysis);
          console.log(
            "Sample matches:",
            matched.slice(0, 3).map((m) => ({
              game: `${m.home_team} vs ${m.away_team}`,
              isCorrect: m.analysis.isCorrect,
              isPending: m.analysis.isPending,
              actual_result: m.actual_result,
            }))
          );

          setStoredResults({
            matched: matched,
            unmatched: [],
            analysis: analysis,
          });
        }
      } catch (error) {
        console.error("Error fetching stored results:", error);
      }
    };

    fetchStoredResults();
  }, [selectedBetslip]);

  const handleCompare = async () => {
    if (!selectedBetslip) return;
    setComparingLocal(true);
    try {
      const sheetRows = await fetchSheetData("Sheet1");
      const key = Object.keys(sheetRows[0] || {}).find((k) => k.toUpperCase() === "BET_ID") || "BET_ID";
      const rowsForBet = (sheetRows || []).filter(
        (row) => (row[key] || row.BET_ID || "").toString().trim() === selectedBetslip
      );
      if (rowsForBet.length === 0) {
        alert(`No rows on Sheet1 with BET_ID "${selectedBetslip}". Add results on Sheet1 first.`);
        setComparingLocal(false);
        return;
      }
      const res = await fetch("/api/betslip-recommendations/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bet_id: selectedBetslip,
          results: rowsForBet.map((row) => ({
            country: row.COUNTRY ?? row.country,
            league: row.LEAGUE ?? row.league,
            bet_type: row.BET_TYPE ?? row.bet_type,
            bet_selection: row.BET_SELECTION ?? row.bet_selection,
            team_included: row.TEAM_INCLUDED ?? row.team_included,
            result: row.RESULT ?? row.result,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Compare failed");
      }
      const data = await res.json();
      alert(`Updated ${data.updated} of ${data.total} games with results from Sheet1.`);

      // Refresh stored results after comparison
      const response = await fetch(
        `/api/betslip-recommendations?bet_id=${encodeURIComponent(selectedBetslip)}`
      );
      if (response.ok) {
        const recommendations = await response.json();

          // Convert stored recommendations to the format expected by the UI
          const matched = recommendations.map((rec) => {
            console.log(
              `Processing recommendation: ${rec.home_team} vs ${rec.away_team}, actual_result: "${rec.actual_result}"`
            );
            // Determine if the prediction was correct
            let isCorrect = false;
            let isPending = false;

            // Check if this is a pending result (no actual_result entered yet)
            if (!rec.actual_result || rec.actual_result.trim() === "") {
              isPending = true;
              isCorrect = false; // Pending results are neither correct nor wrong
              console.log(
                `Game: ${rec.home_team} vs ${rec.away_team} - PENDING (no actual_result)`
              );
            } else if (
              rec.prediction_accurate === true ||
              rec.prediction_accurate === "true"
            ) {
              isCorrect = true;
              isPending = false;
            } else if (
              rec.prediction_accurate === false ||
              rec.prediction_accurate === "false"
            ) {
              isCorrect = false;
              isPending = false;
            } else if (rec.actual_result && rec.actual_result.trim() !== "") {
              // If we have an actual result but no prediction_accurate, we can infer it
              isCorrect =
                rec.actual_result.toLowerCase().includes("win") &&
                rec.recommendation.toLowerCase().includes("win");
              isPending = false;
            }

            // Generate detailed failure analysis
            let failureReason = "";
            let confidenceAnalysis = {};

            if (
              !isCorrect &&
              rec.actual_result &&
              rec.actual_result.trim() !== ""
            ) {
              const betType = rec.bet_type?.toLowerCase() || "";
              const recommendedTeam = rec.recommendation;

              // Basic failure reason based on bet type
              if (betType.includes("win")) {
                failureReason = `Predicted ${recommendedTeam} to win but they lost`;
              } else if (betType.includes("double chance")) {
                failureReason = "Predicted double chance but got loss";
              } else if (
                betType.includes("over/under") ||
                betType.includes("over") ||
                betType.includes("under")
              ) {
                failureReason = `Predicted ${rec.bet_selection} but got loss`;
              } else if (betType.includes("avoid")) {
                failureReason = `Predicted to avoid ${recommendedTeam} but they won`;
              } else {
                failureReason = `Predicted ${rec.bet_selection} but got loss`;
              }

              // Add detailed confidence analysis
              const breakdown = rec.confidence_breakdown || {};

              if (breakdown.team >= 7) {
                confidenceAnalysis.team = {
                  wasHigh: true,
                  issue:
                    "High team confidence but team lost - possibly poor recent form not captured",
                };
              }

              if (breakdown.homeAway >= 7) {
                confidenceAnalysis.homeAway = {
                  wasHigh: true,
                  issue:
                    "High home/away confidence but advantage didn't matter",
                };
              }

              if (breakdown.league >= 7) {
                confidenceAnalysis.league = {
                  wasHigh: true,
                  issue:
                    "High league confidence but league trends didn't apply",
                };
              }

              if (breakdown.odds >= 7) {
                confidenceAnalysis.odds = {
                  wasHigh: true,
                  issue: "High odds confidence but market was wrong",
                };
              }
            }

            return {
              bet_id: rec.bet_id,
              game_id: rec.game_id,
              date: rec.date,
              home_team: rec.home_team,
              away_team: rec.away_team,
              recommendation: rec.recommendation,
              primary_recommendation: rec.primary_recommendation,
              secondary_recommendation: rec.secondary_recommendation,
              tertiary_recommendation: rec.tertiary_recommendation,
              bet_type: rec.bet_type,
              bet_selection: rec.bet_selection,
              confidence_score: rec.confidence_score,
              actual_result: rec.actual_result,
              prediction_accurate: rec.prediction_accurate,
              your_bet_won: rec.your_bet_won,
              analysis_type: rec.analysis_type,
              insight: rec.insight,
              analysis: {
                isCorrect: isCorrect,
                isPending: isPending,
                failureReason: failureReason || null,
                confidenceAnalysis: confidenceAnalysis,
                analysisType: rec.analysis_type || "",
                insight: rec.insight || "",
              },
            };
          });

          setStoredResults({
            matched: matched,
            unmatched: [],
            analysis: {
              total: matched.length,
              correct: matched.filter((m) => m.analysis.isCorrect).length,
              wrong: matched.filter(
                (m) => !m.analysis.isCorrect && !m.analysis.isPending
              ).length,
              pending: matched.filter((m) => m.analysis.isPending).length,
            },
          });
        }
    } catch (error) {
      console.error("Comparison failed:", error);
      alert(`❌ Error comparing recommendations: ${error.message}`);
    } finally {
      setComparingLocal(false);
    }
  };

  const getFilteredResults = () => {
    // Use stored results if available (for already analyzed betslips)
    const resultsToFilter = storedResults || comparisonResults;

    if (resultsToFilter && resultsToFilter.matched) {
      let filtered = resultsToFilter.matched;

      // Filter by bet ID (original BET_ID from Google Sheets)
      if (selectedBetslip) {
        filtered = filtered.filter((match) => match.bet_id === selectedBetslip);
      }

      // Filter by result type
      if (selectedFilter === "correct") {
        filtered = filtered.filter((match) => match.analysis.isCorrect);
      } else if (selectedFilter === "wrong") {
        filtered = filtered.filter((match) => !match.analysis.isCorrect && !match.analysis.isPending);
      } else if (selectedFilter === "pending") {
        filtered = filtered.filter((match) => match.analysis.isPending);
      }

      return filtered;
    }

    return [];
  };

  const filteredResults = getFilteredResults();

  // Check if the selected betslip has already been analyzed
  const isBetslipAnalyzed = () => {
    if (!selectedBetslip) return false;

    // Check if we have stored results for this betslip AND they have actual results
    if (
      storedResults &&
      storedResults.matched &&
      storedResults.matched.length > 0
    ) {
      // Check if any of the results have actual_result populated (not null)
      const hasActualResults = storedResults.matched.some(
        (match) => match.actual_result && match.actual_result.trim() !== ""
      );
      console.log(`isBetslipAnalyzed: hasActualResults = ${hasActualResults}`);
      console.log(`storedResults.matched sample:`, storedResults.matched[0]);
      console.log(
        `actual_result value:`,
        storedResults.matched[0].actual_result
      );
      console.log(
        `actual_result type:`,
        typeof storedResults.matched[0].actual_result
      );
      console.log(
        `actual_result === null:`,
        storedResults.matched[0].actual_result === null
      );

      // Check all records to see which ones have actual_result
      console.log(`Checking all ${storedResults.matched.length} records:`);
      storedResults.matched.forEach((match, index) => {
        console.log(
          `Record ${index}: actual_result = "${
            match.actual_result
          }" (type: ${typeof match.actual_result})`
        );
      });

      return hasActualResults;
    }

    // Check if we have comparison results for this betslip
    if (comparisonResults && comparisonResults.matched) {
      return comparisonResults.matched.some(
        (match) => match.bet_id === selectedBetslip
      );
    }

    return false;
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        Recommendation Analysis Dashboard
      </h3>

      <div className="text-gray-300 mb-6">
        <p>
          Compare your stored recommendations with actual results to identify
          where your algorithm missed the mark and improve future predictions.
        </p>
      </div>

      {/* Bet Slip Selection */}
      <div className="mb-6">
        <label className="text-white text-sm font-medium mb-2 block">
          Select Bet Slip to Analyze:
        </label>
        <select
          value={selectedBetslip}
          onChange={(e) => setSelectedBetslip(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 w-full max-w-md"
        >
          <option value="">Choose a betslip...</option>
          {availableBetslips.map((betId) => (
            <option key={betId} value={betId}>
              {betId}
            </option>
          ))}
        </select>
      </div>

      {/* Comparison Button */}
      <div className="mb-6">
        <button
          onClick={handleCompare}
          disabled={comparingLocal || !selectedBetslip}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            comparingLocal || !selectedBetslip
              ? "bg-gray-500 text-gray-300 cursor-not-allowed"
              : isBetslipAnalyzed()
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {comparingLocal
            ? "🔄 Comparing..."
            : !selectedBetslip
            ? "🔍 Select a betslip first"
            : isBetslipAnalyzed()
            ? "🔄 Re-analyze Recommendations"
            : "🔍 Compare Recommendations vs Results"}
        </button>
        {isBetslipAnalyzed() && (
          <p className="text-sm text-gray-400 mt-2">
            This betslip has been analyzed before. Click to re-analyze with
            updated logic.
          </p>
        )}
      </div>

      {/* Filters */}
      {comparisonResults && (
        <div className="mb-6 flex gap-4 items-center flex-wrap">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Show:
            </label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20"
            >
              <option value="all">All Results</option>
              <option value="correct">✅ Correct Only</option>
              <option value="wrong">❌ Wrong Only</option>
              <option value="pending">⏳ Pending Only</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {((storedResults && storedResults.analysis) ||
        (comparisonResults && comparisonResults.analysis)) &&
        selectedBetslip && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-white">
                {
                  (storedResults?.analysis || comparisonResults?.analysis)
                    ?.total
                }
              </div>
              <div className="text-gray-300 text-sm">Total Recommendations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-green-400">
                {
                  (storedResults?.analysis || comparisonResults?.analysis)
                    ?.correct
                }
              </div>
              <div className="text-gray-300 text-sm">✅ Correct</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-red-400">
                {
                  (storedResults?.analysis || comparisonResults?.analysis)
                    ?.wrong
                }
              </div>
              <div className="text-gray-300 text-sm">❌ Wrong</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-yellow-400">
                {
                  (storedResults?.analysis || comparisonResults?.analysis)
                    ?.pending
                }
              </div>
              <div className="text-gray-300 text-sm">⏳ Pending</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(
                  ((storedResults?.analysis || comparisonResults?.analysis)
                    ?.correct /
                    (storedResults?.analysis || comparisonResults?.analysis)
                      ?.total) *
                    100
                ) || 0}
                %
              </div>
              <div className="text-gray-300 text-sm">Overall Accuracy</div>
            </div>
          </div>
        )}

      {/* Confidence Factor Analysis */}
      {comparisonResults &&
        comparisonResults.analysis &&
        comparisonResults.analysis.confidenceFailures &&
        selectedBetslip && (
          <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h4 className="text-lg font-semibold text-white mb-4">
              Confidence Factor Failures
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(
                comparisonResults.analysis.confidenceFailures
              ).map(([factor, count]) => (
                <div key={factor} className="text-center">
                  <div className="text-xl font-bold text-orange-400">
                    {count}
                  </div>
                  <div className="text-gray-300 text-sm capitalize">
                    {factor.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Detailed Results */}
      {filteredResults.length > 0 && selectedBetslip && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <h4 className="text-lg font-semibold text-white mb-4">
            Detailed Analysis ({filteredResults.length} results)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-2 text-white font-medium">
                    Game
                  </th>
                  <th className="text-left py-3 px-2 text-white font-medium">
                    Date
                  </th>
                  <th className="text-left py-3 px-2 text-white font-medium">
                    Recommendations (Primary/Secondary/Tertiary)
                  </th>
                  <th className="text-left py-3 px-2 text-white font-medium">
                    Your Bet
                  </th>
                  <th className="text-left py-3 px-2 text-white font-medium">
                    Actual Result
                  </th>
                  <th className="text-center py-3 px-2 text-white font-medium">
                    System Result
                  </th>
                  <th className="text-center py-3 px-2 text-white font-medium">
                    Analysis
                  </th>
                  <th className="text-center py-3 px-2 text-white font-medium">
                    Confidence
                  </th>
                  <th className="text-left py-3 px-2 text-white font-medium">
                    Insight
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((match, index) => (
                  <tr
                    key={index}
                    className={`border-b border-white/10 ${
                      match.analysis?.isCorrect
                        ? "bg-green-500/5"
                        : "bg-red-500/5"
                    }`}
                  >
                    <td className="py-3 px-2 text-white font-medium">
                      {match.home_team} vs {match.away_team}
                    </td>
                    <td className="py-3 px-2 text-gray-300">
                      {new Date(match.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-white">
                      <div className="space-y-1">
                        <div className="text-green-400 font-medium">
                          🥇 Primary:{" "}
                          {match.primary_recommendation || match.recommendation}
                        </div>
                        <div className="text-yellow-400 text-sm">
                          🥈 Secondary:{" "}
                          {match.secondary_recommendation || "N/A"}
                        </div>
                        <div className="text-orange-400 text-sm">
                          🥉 Tertiary: {match.tertiary_recommendation || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-blue-300 font-medium">
                      {match.bet_selection || "N/A"}
                    </td>
                    <td className="py-3 px-2 text-white font-bold">
                      {match.actual_result === "Win"
                        ? "✅ WIN"
                        : match.actual_result === "Loss"
                        ? "❌ LOSS"
                        : match.actual_result || "⏳ PENDING"}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`text-lg ${
                          match.prediction_accurate
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {match.prediction_accurate ? "✅" : "❌"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          match.analysis_type === "Both Correct"
                            ? "bg-green-500/20 text-green-300"
                            : match.analysis_type === "You Won, System Wrong"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : match.analysis_type === "System Right, You Lost"
                            ? "bg-orange-500/20 text-orange-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {match.analysis_type || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-gray-300">
                      {match.confidence_score}%
                    </td>
                    <td className="py-3 px-2 text-gray-300 text-xs">
                      <div>
                        {match.insight || "N/A"}
                        {match.analysis &&
                          match.analysis.confidenceAnalysis &&
                          Object.keys(match.analysis.confidenceAnalysis)
                            .length > 0 && (
                            <div className="mt-2 space-y-1">
                              {Object.entries(
                                match.analysis.confidenceAnalysis
                              ).map(([factor, analysis]) => (
                                <div
                                  key={factor}
                                  className="text-orange-300 text-xs"
                                >
                                  <strong>{factor}:</strong> {analysis.issue}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {comparisonResults && filteredResults.length === 0 && selectedBetslip && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h4 className="text-lg font-semibold text-white mb-2">
            No Results Found
          </h4>
          <p className="text-gray-300">
            {selectedFilter === "pending"
              ? "No pending recommendations found."
              : "No recommendations match the current filters."}
          </p>
        </div>
      )}

      {/* Initial State - only when no betslip selected or no games loaded */}
      {!selectedBetslip && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <h4 className="text-lg font-semibold text-white mb-2">
            Select a betslip
          </h4>
          <p className="text-gray-300">
            Choose a betslip from the dropdown above to view its games and compare with Sheet1 results.
          </p>
        </div>
      )}
      {selectedBetslip && (!storedResults || !storedResults.matched || storedResults.matched.length === 0) && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📋</div>
          <h4 className="text-lg font-semibold text-white mb-2">
            No games for this betslip
          </h4>
          <p className="text-gray-300">
            No saved games found for this betslip. Upload this betslip from Bet Analysis first.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationAnalysisTab;
