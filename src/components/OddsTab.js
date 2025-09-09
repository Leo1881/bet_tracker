import React from "react";

const OddsTab = ({
  handleOddsSort,
  oddsSortConfig,
  getSortedOddsData,
  getFilteredOddsAnalytics,
  expandedOddsRanges,
  toggleOddsRangeExpansion,
  getBetsForOddsRange,
  formatDate,
  getStatusColor,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        Odds Range Performance Analytics
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/20">
            <tr>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleOddsSort("range")}
              >
                <div className="flex items-center justify-between">
                  <span>Odds Range</span>
                  {oddsSortConfig.key === "range" && (
                    <span className="ml-2">
                      {oddsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleOddsSort("bets")}
              >
                <div className="flex items-center justify-between">
                  <span>Bets</span>
                  {oddsSortConfig.key === "bets" && (
                    <span className="ml-2">
                      {oddsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleOddsSort("wins")}
              >
                <div className="flex items-center justify-between">
                  <span>Wins</span>
                  {oddsSortConfig.key === "wins" && (
                    <span className="ml-2">
                      {oddsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleOddsSort("losses")}
              >
                <div className="flex items-center justify-between">
                  <span>Losses</span>
                  {oddsSortConfig.key === "losses" && (
                    <span className="ml-2">
                      {oddsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleOddsSort("winRate")}
              >
                <div className="flex items-center justify-between">
                  <span>Win Rate</span>
                  {oddsSortConfig.key === "winRate" && (
                    <span className="ml-2">
                      {oddsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleOddsSort("avgOdds")}
              >
                <div className="flex items-center justify-between">
                  <span>Avg Odds</span>
                  {oddsSortConfig.key === "avgOdds" && (
                    <span className="ml-2">
                      {oddsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {getSortedOddsData().length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center">
                  <p className="text-gray-300 text-lg">No odds data found</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Add bets with odds data to see odds range analytics
                  </p>
                </td>
              </tr>
            ) : (
              getFilteredOddsAnalytics().map((odds, index) => {
                const isExpanded = expandedOddsRanges.has(odds.range);
                const rangeBets = getBetsForOddsRange(odds.range);

                return (
                  <React.Fragment key={index}>
                    <tr
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => toggleOddsRangeExpansion(odds.range)}
                    >
                      <td className="px-4 py-2 text-gray-200 font-medium">
                        <div className="flex items-center">
                          <span className="mr-2">{isExpanded ? "▼" : "▶"}</span>
                          {odds.range}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-200">{odds.bets}</td>
                      <td className="px-4 py-2 text-green-400">{odds.wins}</td>
                      <td className="px-4 py-2 text-red-400">{odds.losses}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            parseFloat(odds.winRate) >= 70
                              ? "bg-green-100 text-green-800"
                              : parseFloat(odds.winRate) >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {odds.winRate}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-blue-300">
                        {odds.avgOdds}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-white/5">
                        <td colSpan="6" className="px-4 py-4">
                          <div className="space-y-3">
                            <h4 className="text-white font-semibold mb-3">
                              📊 Individual Bets in {odds.range} Range (
                              {rangeBets.length} bets)
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-white/10">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-white font-medium">
                                      Date
                                    </th>
                                    <th className="px-3 py-2 text-left text-white font-medium">
                                      Country
                                    </th>
                                    <th className="px-3 py-2 text-left text-white font-medium">
                                      League
                                    </th>
                                    <th className="px-3 py-2 text-left text-white font-medium">
                                      Teams
                                    </th>
                                    <th className="px-3 py-2 text-left text-white font-medium">
                                      Bet On
                                    </th>
                                    <th className="px-3 py-2 text-left text-white font-medium">
                                      Odds
                                    </th>
                                    <th className="px-3 py-2 text-left text-white font-medium">
                                      Result
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                  {rangeBets.map((bet, betIndex) => {
                                    const odds1 = parseFloat(bet.ODDS1) || 0;
                                    const odds2 = parseFloat(bet.ODDS2) || 0;
                                    const teamBet = bet.TEAM_INCLUDED;
                                    const homeTeam = bet.HOME_TEAM;
                                    const awayTeam = bet.AWAY_TEAM;

                                    // Determine which odds to use
                                    let betOdds = 0;
                                    if (
                                      teamBet &&
                                      homeTeam &&
                                      teamBet
                                        .toLowerCase()
                                        .includes(homeTeam.toLowerCase())
                                    ) {
                                      betOdds = odds1;
                                    } else if (
                                      teamBet &&
                                      awayTeam &&
                                      teamBet
                                        .toLowerCase()
                                        .includes(awayTeam.toLowerCase())
                                    ) {
                                      betOdds = odds2;
                                    } else {
                                      betOdds = Math.max(odds1, odds2);
                                    }

                                    return (
                                      <tr
                                        key={betIndex}
                                        className="hover:bg-white/5"
                                      >
                                        <td className="px-3 py-2 text-gray-300">
                                          {formatDate(bet.DATE)}
                                        </td>
                                        <td className="px-3 py-2 text-gray-300">
                                          {bet.COUNTRY || "-"}
                                        </td>
                                        <td className="px-3 py-2 text-gray-300">
                                          {bet.LEAGUE || "-"}
                                        </td>
                                        <td className="px-3 py-2 text-gray-300">
                                          <div className="text-xs">
                                            <div>{bet.HOME_TEAM || "-"}</div>
                                            <div className="text-gray-400">
                                              vs
                                            </div>
                                            <div>{bet.AWAY_TEAM || "-"}</div>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2 text-purple-300 font-medium">
                                          {teamBet || "-"}
                                        </td>
                                        <td className="px-3 py-2 text-yellow-400 font-mono">
                                          {betOdds.toFixed(2)}
                                        </td>
                                        <td className="px-3 py-2">
                                          <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                              bet.RESULT
                                            )}`}
                                          >
                                            {bet.RESULT || "Unknown"}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-gray-400 text-sm">
        <p>
          💡 Tip: Focus on odds ranges with higher win rates for better
          profitability
        </p>
      </div>
    </div>
  );
};

export default OddsTab;
