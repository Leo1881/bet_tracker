import React, { useState, useEffect } from "react";

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

  // Fetch available betslips from database on component mount
  useEffect(() => {
    const fetchAvailableBetslips = async () => {
      try {
        const response = await fetch("/api/recommendations");
        if (response.ok) {
          const recommendations = await response.json();
          // Get unique bet_ids from the recommendations
          const uniqueBetIds = [
            ...new Set(
              recommendations.map((rec) => rec.bet_id).filter(Boolean)
            ),
          ];
          setAvailableBetslips(uniqueBetIds.sort());
        }
      } catch (error) {
        console.error("Error fetching available betslips:", error);
      }
    };

    fetchAvailableBetslips();
  }, []);

  // Fetch stored results for selected betslip
  useEffect(() => {
    const fetchStoredResults = async () => {
      if (!selectedBetslip) {
        setStoredResults(null);
        return;
      }

      try {
        const response = await fetch(
          `/api/recommendations?betId=${selectedBetslip}`
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
          }

          // Convert stored recommendations to the format expected by the UI
          const matched = recommendations.map((rec) => {
            // Debug each record
            console.log("Processing recommendation:", {
              bet_id: rec.bet_id,
              prediction_accurate: rec.prediction_accurate,
              actual_result: rec.actual_result,
              recommendation: rec.recommendation,
            });

            // Determine if the prediction was correct
            // Handle cases where prediction_accurate might be null, string, or boolean
            let isCorrect = false;
            if (
              rec.prediction_accurate === true ||
              rec.prediction_accurate === "true"
            ) {
              isCorrect = true;
            } else if (
              rec.prediction_accurate === false ||
              rec.prediction_accurate === "false"
            ) {
              isCorrect = false;
            } else if (rec.actual_result && rec.actual_result.trim() !== "") {
              // If we have an actual result but no prediction_accurate, we can infer it
              // This is a fallback - ideally prediction_accurate should be set during comparison
              isCorrect =
                rec.actual_result.toLowerCase().includes("win") &&
                rec.recommendation.toLowerCase().includes("win");
            }

            // Generate detailed failure analysis
            let failureReason = "";
            let confidenceAnalysis = {};

            if (
              !isCorrect &&
              rec.actual_result &&
              rec.actual_result.trim() !== ""
            ) {
              const prediction = rec.recommendation.toLowerCase();
              const result = rec.actual_result.toLowerCase();

              // Basic failure reason
              if (prediction.includes("win")) {
                failureReason = "Predicted win but got loss/draw";
              } else if (prediction.includes("avoid")) {
                failureReason = "Predicted avoid but team won";
              } else if (prediction.includes("double chance")) {
                failureReason = "Predicted double chance but got loss";
              } else {
                failureReason = "Prediction did not match actual result";
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
              confidence_score: rec.confidence_score,
              actual_result: rec.actual_result,
              prediction_accurate: rec.prediction_accurate,
              analysis: {
                isCorrect: isCorrect,
                failureReason: failureReason || null,
                confidenceAnalysis: confidenceAnalysis,
              },
            };
          });

          setStoredResults({
            matched: matched,
            unmatched: [],
            analysis: {
              total: matched.length,
              correct: matched.filter((m) => m.analysis.isCorrect).length,
              wrong: matched.filter((m) => !m.analysis.isCorrect).length,
              pending: 0,
            },
          });
        }
      } catch (error) {
        console.error("Error fetching stored results:", error);
      }
    };

    fetchStoredResults();
  }, [selectedBetslip]);

  const handleCompare = async () => {
    try {
      const results = await compareRecommendationsWithResults();
      setComparisonResults(results);

      // Refresh stored results after comparison to get updated data
      if (selectedBetslip) {
        console.log("Refreshing stored results after comparison...");
        const response = await fetch(
          `/api/recommendations?betId=${encodeURIComponent(selectedBetslip)}`
        );
        if (response.ok) {
          const recommendations = await response.json();
          console.log("Refreshed recommendations:", recommendations.length);

          // Convert stored recommendations to the format expected by the UI
          const matched = recommendations.map((rec) => {
            console.log(
              `Processing recommendation: ${rec.home_team} vs ${rec.away_team}, actual_result: "${rec.actual_result}"`
            );
            // Determine if the prediction was correct
            let isCorrect = false;
            if (
              rec.prediction_accurate === true ||
              rec.prediction_accurate === "true"
            ) {
              isCorrect = true;
            } else if (
              rec.prediction_accurate === false ||
              rec.prediction_accurate === "false"
            ) {
              isCorrect = false;
            } else if (rec.actual_result && rec.actual_result.trim() !== "") {
              // If we have an actual result but no prediction_accurate, we can infer it
              isCorrect =
                rec.actual_result.toLowerCase().includes("win") &&
                rec.recommendation.toLowerCase().includes("win");
            }

            // Generate detailed failure analysis
            let failureReason = "";
            let confidenceAnalysis = {};

            if (
              !isCorrect &&
              rec.actual_result &&
              rec.actual_result.trim() !== ""
            ) {
              const prediction = rec.recommendation.toLowerCase();
              const result = rec.actual_result.toLowerCase();

              // Basic failure reason
              if (prediction.includes("win")) {
                failureReason = "Predicted win but got loss/draw";
              } else if (prediction.includes("avoid")) {
                failureReason = "Predicted avoid but team won";
              } else if (prediction.includes("double chance")) {
                failureReason = "Predicted double chance but got loss";
              } else {
                failureReason = "Prediction did not match actual result";
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
              confidence_score: rec.confidence_score,
              actual_result: rec.actual_result,
              prediction_accurate: rec.prediction_accurate,
              analysis: {
                isCorrect: isCorrect,
                failureReason: failureReason || null,
                confidenceAnalysis: confidenceAnalysis,
              },
            };
          });

          setStoredResults({
            matched: matched,
            unmatched: [],
            analysis: {
              totalRecommendations: matched.length,
              correctPredictions: matched.filter((m) => m.analysis.isCorrect)
                .length,
              incorrectPredictions: matched.filter((m) => !m.analysis.isCorrect)
                .length,
              accuracy:
                matched.length > 0
                  ? (matched.filter((m) => m.analysis.isCorrect).length /
                      matched.length) *
                    100
                  : 0,
            },
          });
        }
      }
    } catch (error) {
      console.error("Comparison failed:", error);
      alert(`❌ Error comparing recommendations: ${error.message}`);
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
        filtered = filtered.filter((match) => !match.analysis.isCorrect);
      } else if (selectedFilter === "pending") {
        filtered = resultsToFilter.unmatched || [];
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
          disabled={isComparing || !selectedBetslip || isBetslipAnalyzed()}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            isComparing || !selectedBetslip || isBetslipAnalyzed()
              ? "bg-gray-500 text-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isComparing
            ? "🔄 Comparing..."
            : !selectedBetslip
            ? "🔍 Select a betslip first"
            : isBetslipAnalyzed()
            ? "✅ Already analyzed"
            : "🔍 Compare Recommendations vs Results"}
        </button>
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
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    Prediction
                  </th>
                  <th className="text-left py-3 px-2 text-white font-medium">
                    Actual
                  </th>
                  <th className="text-center py-3 px-2 text-white font-medium">
                    Result
                  </th>
                  <th className="text-center py-3 px-2 text-white font-medium">
                    Confidence
                  </th>
                  <th className="text-left py-3 px-2 text-white font-medium">
                    Failure Reason
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
                      {match.recommendation}
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
                          match.analysis?.isCorrect
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {match.analysis?.isCorrect ? "✅" : "❌"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-gray-300">
                      {match.confidence_score}/10
                    </td>
                    <td className="py-3 px-2 text-gray-300 text-xs">
                      {match.analysis && !match.analysis.isCorrect ? (
                        <div>
                          <div className="text-red-400 font-medium mb-1">
                            {match.analysis.failureReason}
                          </div>
                          {match.analysis.confidenceAnalysis &&
                            Object.entries(
                              match.analysis.confidenceAnalysis
                            ).map(([factor, analysis]) => (
                              <div key={factor} className="text-orange-300">
                                <strong>{factor}:</strong> {analysis.issue}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <span className="text-green-400">
                          Correct prediction
                        </span>
                      )}
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

      {/* Initial State */}
      {!comparisonResults && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <h4 className="text-lg font-semibold text-white mb-2">
            Ready to Analyze
          </h4>
          <p className="text-gray-300">
            Click "Compare Recommendations vs Results" to analyze your stored
            recommendations against actual game results.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationAnalysisTab;
