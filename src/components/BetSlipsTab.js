import React from "react";

const BetSlipsTab = ({
  showCompletedSlips,
  setShowCompletedSlips,
  getBetSlipsSummary,
  handleSlipsSort,
  slipsSortConfig,
  getSortedSlipsData,
  expandedSlips,
  toggleSlipExpansion,
  formatDate,
  attachedPredictions,
  getTodayPredictions,
  checkBetslipMatch,
  attachPredictionsToBetslip,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Bet Slips Performance</h3>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showCompletedSlips"
            checked={showCompletedSlips}
            onChange={(e) => setShowCompletedSlips(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="showCompletedSlips" className="text-gray-300 text-sm">
            Show completed slips
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      {(() => {
        const summary = getBetSlipsSummary();
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-white">
                {summary.totalSlips}
              </div>
              <div className="text-gray-300 text-sm">Total Slips</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-blue-400">
                {summary.overallSuccessRate.toFixed(1)}%
              </div>
              <div className="text-gray-300 text-sm">Overall Success Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-yellow-400">
                {summary.averageBetsPerSlip.toFixed(1)}
              </div>
              <div className="text-gray-300 text-sm">Avg Bets per Slip</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-green-400">
                {summary.bestPerformingSlip
                  ? summary.bestPerformingSlip.winRate.toFixed(1) + "%"
                  : "N/A"}
              </div>
              <div className="text-gray-300 text-sm">
                Best Slip Success Rate
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-green-400">
                {summary.averageWins.toFixed(1)}
              </div>
              <div className="text-gray-300 text-sm">Avg Wins per Slip</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-red-400">
                {summary.averageLosses.toFixed(1)}
              </div>
              <div className="text-gray-300 text-sm">Avg Losses per Slip</div>
            </div>
          </div>
        );
      })()}

      {/* Slips Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/20">
            <tr>
              <th className="px-4 py-2 text-left text-white font-semibold w-8"></th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                onClick={() => handleSlipsSort("betId")}
              >
                <div className="flex items-center">
                  Bet Slip ID
                  {slipsSortConfig.key === "betId" && (
                    <span className="ml-1">
                      {slipsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                onClick={() => handleSlipsSort("date")}
              >
                <div className="flex items-center">
                  Date
                  {slipsSortConfig.key === "date" && (
                    <span className="ml-1">
                      {slipsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                onClick={() => handleSlipsSort("totalBets")}
              >
                <div className="flex items-center">
                  Bets
                  {slipsSortConfig.key === "totalBets" && (
                    <span className="ml-1">
                      {slipsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Wins/Losses
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                onClick={() => handleSlipsSort("winRate")}
              >
                <div className="flex items-center">
                  Success Rate
                  {slipsSortConfig.key === "winRate" && (
                    <span className="ml-1">
                      {slipsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                onClick={() => handleSlipsSort("status")}
              >
                <div className="flex items-center">
                  Status
                  {slipsSortConfig.key === "status" && (
                    <span className="ml-1">
                      {slipsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {getSortedSlipsData().map((slip, index) => (
              <React.Fragment key={index}>
                <tr
                  className="hover:bg-white/5 cursor-pointer"
                  onClick={() => toggleSlipExpansion(slip.betId)}
                >
                  <td className="px-4 py-2 text-gray-300">
                    <div className="flex items-center justify-center">
                      <span
                        className={`transform transition-transform duration-200 ${
                          expandedSlips.has(slip.betId) ? "rotate-90" : ""
                        }`}
                      >
                        ▶
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-300">
                    <div className="font-medium text-white">{slip.betId}</div>
                  </td>
                  <td className="px-4 py-2 text-gray-300">
                    {formatDate(slip.date)}
                  </td>
                  <td className="px-4 py-2 text-gray-300">{slip.totalBets}</td>
                  <td className="px-4 py-2 text-gray-300">
                    <div className="text-sm">
                      <span className="text-green-400">{slip.wins}W</span>
                      <span className="text-gray-400"> / </span>
                      <span className="text-red-400">{slip.losses}L</span>
                      {slip.pending > 0 && (
                        <>
                          <span className="text-gray-400"> / </span>
                          <span className="text-yellow-400">
                            {slip.pending}P
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-300">
                    <span
                      className={`inline-block w-16 text-center px-2 py-1 rounded-full text-xs font-medium ${
                        slip.winRate >= 70
                          ? "bg-green-100 text-green-800"
                          : slip.winRate >= 50
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {slip.winRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-300">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        slip.status === "Complete"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {slip.status}
                    </span>
                  </td>
                </tr>
                {expandedSlips.has(slip.betId) && (
                  <tr className="bg-white/5">
                    <td colSpan="7" className="px-4 py-3">
                      <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-3">
                          Individual Bets:
                        </h4>
                        <div className="grid gap-2">
                          {slip.bets.map((bet, betIndex) => {
                            const hasAttachedPredictions =
                              attachedPredictions[slip.betId];
                            const prediction =
                              hasAttachedPredictions?.games.find(
                                (p) =>
                                  p.home_team?.toLowerCase() ===
                                    bet.HOME_TEAM?.toLowerCase() &&
                                  p.away_team?.toLowerCase() ===
                                    bet.AWAY_TEAM?.toLowerCase()
                              );

                            return (
                              <div
                                key={betIndex}
                                className="bg-white/5 rounded p-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="text-white font-medium">
                                      {bet.TEAM_INCLUDED}
                                    </div>
                                    <div className="text-gray-400 text-sm">
                                      {bet.COUNTRY} - {bet.LEAGUE}
                                    </div>
                                    <div className="text-gray-400 text-sm">
                                      {bet.BET_TYPE} {bet.BET_SELECTION}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div
                                      className={`inline-block w-20 text-center px-2 py-1 rounded-full text-xs font-medium ${
                                        bet.RESULT?.toLowerCase().includes(
                                          "win"
                                        )
                                          ? "bg-green-100 text-green-800"
                                          : bet.RESULT?.toLowerCase().includes(
                                              "loss"
                                            )
                                          ? "bg-red-100 text-red-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {bet.RESULT || "Pending"}
                                    </div>
                                    <div className="text-gray-400 text-xs mt-1">
                                      {bet.ODDS1 && bet.ODDS2
                                        ? `Odds: ${bet.ODDS1}/${bet.ODDS2}`
                                        : "Odds: N/A"}
                                    </div>
                                    {(bet.HOME_SCORE || bet.AWAY_SCORE) && (
                                      <div className="text-purple-300 text-xs mt-1 font-mono">
                                        {bet.HOME_SCORE || "?"}-
                                        {bet.AWAY_SCORE || "?"}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Prediction Data */}
                                {prediction && (
                                  <div className="mt-2 pt-2 border-t border-white/10">
                                    <div className="text-gray-400 mb-1">
                                      🎯 Recommendation:
                                    </div>
                                    <div className="text-green-300 font-medium text-sm">
                                      {prediction.recommendation}
                                    </div>
                                    <div className="text-blue-300 text-xs mt-1">
                                      Confidence: {prediction.confidenceScore}
                                      /10
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Attach Recent Analysis Button */}
                          {(() => {
                            const todayPredictions = getTodayPredictions();
                            const hasAttachedPredictions =
                              attachedPredictions[slip.betId];

                            if (todayPredictions && !hasAttachedPredictions) {
                              const matchResult = checkBetslipMatch(
                                slip.bets,
                                todayPredictions.games
                              );

                              return (
                                <div className="mt-4 pt-4 border-t border-white/20">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-white font-semibold">
                                      📊 Attach Recent Analysis
                                    </h5>
                                    <button
                                      onClick={() =>
                                        attachPredictionsToBetslip(
                                          slip.betId,
                                          todayPredictions
                                        )
                                      }
                                      disabled={!matchResult.isPerfectMatch}
                                      className={`px-3 py-1 rounded text-xs font-medium ${
                                        matchResult.isPerfectMatch
                                          ? "bg-blue-500 text-white hover:bg-blue-600"
                                          : "bg-gray-500 text-gray-300 cursor-not-allowed"
                                      }`}
                                    >
                                      Attach Predictions
                                    </button>
                                  </div>

                                  <div className="text-sm text-gray-300 mb-2">
                                    <span className="text-green-400">
                                      ✅ {matchResult.matches}
                                    </span>{" "}
                                    of {matchResult.total} games match
                                  </div>

                                  {!matchResult.isPerfectMatch && (
                                    <div className="text-xs text-red-300">
                                      {matchResult.missingFromBetslip.length >
                                        0 && (
                                        <div className="mb-1">
                                          ❌ Missing from betslip:{" "}
                                          {matchResult.missingFromBetslip
                                            .map(
                                              (game) =>
                                                `${game.home_team} vs ${game.away_team}`
                                            )
                                            .join(", ")}
                                        </div>
                                      )}
                                      {matchResult.extraInBetslip.length >
                                        0 && (
                                        <div>
                                          ❌ Extra in betslip:{" "}
                                          {matchResult.extraInBetslip
                                            .map(
                                              (game) =>
                                                `${game.HOME_TEAM} vs ${game.AWAY_TEAM}`
                                            )
                                            .join(", ")}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            return null;
                          })()}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {getSortedSlipsData().length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">
            No bet slips found. Add BET_ID values to your data to see slip
            performance.
          </p>
        </div>
      )}
    </div>
  );
};

export default BetSlipsTab;
