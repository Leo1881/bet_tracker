import React from "react";

const AnalyticsTab = ({
  handleAnalyticsSort,
  analyticsSortConfig,
  getSortedAnalyticsData,
  expandedAnalyticsTeams,
  toggleAnalyticsTeamExpansion,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        Team Performance Analytics
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/20">
            <tr>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleAnalyticsSort("team")}
              >
                <div className="flex items-center justify-between">
                  <span>Team</span>
                  {analyticsSortConfig.key === "team" && (
                    <span className="ml-2">
                      {analyticsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleAnalyticsSort("country")}
              >
                <div className="flex items-center justify-between">
                  <span>Country</span>
                  {analyticsSortConfig.key === "country" && (
                    <span className="ml-2">
                      {analyticsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleAnalyticsSort("league")}
              >
                <div className="flex items-center justify-between">
                  <span>League</span>
                  {analyticsSortConfig.key === "league" && (
                    <span className="ml-2">
                      {analyticsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleAnalyticsSort("total")}
              >
                <div className="flex items-center justify-between">
                  <span>Total Bets</span>
                  {analyticsSortConfig.key === "total" && (
                    <span className="ml-2">
                      {analyticsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleAnalyticsSort("wins")}
              >
                <div className="flex items-center justify-between">
                  <span>Wins</span>
                  {analyticsSortConfig.key === "wins" && (
                    <span className="ml-2">
                      {analyticsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleAnalyticsSort("losses")}
              >
                <div className="flex items-center justify-between">
                  <span>Losses</span>
                  {analyticsSortConfig.key === "losses" && (
                    <span className="ml-2">
                      {analyticsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleAnalyticsSort("winRate")}
              >
                <div className="flex items-center justify-between">
                  <span>Win Rate</span>
                  {analyticsSortConfig.key === "winRate" && (
                    <span className="ml-2">
                      {analyticsSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {getSortedAnalyticsData().map((team, index) => (
              <React.Fragment key={index}>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-2 text-gray-200">{team.team}</td>
                  <td className="px-4 py-2 text-gray-200">{team.country}</td>
                  <td className="px-4 py-2 text-gray-200">{team.league}</td>
                  <td className="px-4 py-2 text-gray-200">{team.total}</td>
                  <td className="px-4 py-2 text-green-400">{team.wins}</td>
                  <td className="px-4 py-2 text-red-400">{team.losses}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        parseFloat(team.winRate) >= 70
                          ? "bg-green-100 text-green-800"
                          : parseFloat(team.winRate) >= 50
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {team.winRate}%
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => toggleAnalyticsTeamExpansion(team.team)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {expandedAnalyticsTeams.has(team.team) ? "▼" : "▶"}
                    </button>
                  </td>
                </tr>
                {expandedAnalyticsTeams.has(team.team) && (
                  <tr>
                    <td colSpan="8" className="px-4 py-2 bg-white/5">
                      <div className="ml-4">
                        {team.betTypeBreakdown &&
                        team.betTypeBreakdown.length > 0 ? (
                          <>
                            <h4 className="text-white font-medium mb-2">
                              Bet Type Breakdown:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {team.betTypeBreakdown.map((betType, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm bg-white/10 rounded p-2"
                                >
                                  <div className="font-medium text-gray-200">
                                    {betType.betType}
                                  </div>
                                  <div className="text-green-400">
                                    {betType.wins}W
                                  </div>
                                  <div className="text-red-400">
                                    {betType.losses}L
                                  </div>
                                  <div className="text-gray-300">
                                    {betType.winRate}% (
                                    {betType.totalWithResult} completed,{" "}
                                    {betType.total} total)
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-400 text-sm">
                            No detailed bet type breakdown available for this
                            team.
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsTab;
