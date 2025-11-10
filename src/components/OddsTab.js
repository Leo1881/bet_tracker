import React, { useState, useMemo } from "react";

const OddsTab = ({
  handleOddsSort,
  oddsSortConfig,
  getSortedOddsData,
  getFilteredOddsAnalytics,
  expandedOddsRanges,
  toggleOddsRangeExpansion,
  getBetsForOddsRange,
  getTeamOddsAnalytics,
  formatDate,
  getStatusColor,
}) => {
  const [viewMode, setViewMode] = useState("ranges"); // "ranges" or "teams"
  const [teamSearch, setTeamSearch] = useState("");
  const [expandedTeamRanges, setExpandedTeamRanges] = useState(new Set());

  const teamOddsData = useMemo(() => {
    return getTeamOddsAnalytics();
  }, [getTeamOddsAnalytics]);

  const filteredTeams = useMemo(() => {
    if (!teamSearch.trim()) {
      return teamOddsData;
    }
    const searchLower = teamSearch.toLowerCase();
    return teamOddsData.filter(
      (team) =>
        team.teamName.toLowerCase().includes(searchLower) ||
        team.country?.toLowerCase().includes(searchLower) ||
        team.league?.toLowerCase().includes(searchLower)
    );
  }, [teamOddsData, teamSearch]);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">
          {viewMode === "ranges"
            ? "Odds Range Performance Analytics"
            : "Team Odds Performance Analytics"}
        </h3>
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode("ranges")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "ranges"
                  ? "bg-[#3982db] text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              By Range
            </button>
            <button
              onClick={() => setViewMode("teams")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "teams"
                  ? "bg-[#3982db] text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              By Team
            </button>
          </div>
        </div>
      </div>

      {/* Team Search Filter */}
      {viewMode === "teams" && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search teams, country, or league..."
            value={teamSearch}
            onChange={(e) => setTeamSearch(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3982db] focus:border-transparent"
          />
        </div>
      )}

      {viewMode === "ranges" ? (
        // Original Range View
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
      ) : (
        // Team View
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/20">
              <tr>
                <th className="px-4 py-2 text-left text-white font-semibold">
                  Team
                </th>
                <th className="px-4 py-2 text-left text-white font-semibold">
                  Overall
                </th>
                <th className="px-4 py-2 text-left text-white font-semibold">
                  Odds Ranges Performance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-8 text-center">
                    <p className="text-gray-300 text-lg">
                      {teamSearch
                        ? "No teams found matching your search"
                        : "No team odds data found"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-white font-medium">
                          {team.teamName}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {team.country} • {team.league}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="text-gray-200 text-sm">
                          {team.totalBets} bets
                        </div>
                        <div className="text-sm">
                          <span className="text-green-400">{team.totalWins}W</span>
                          <span className="text-gray-400"> / </span>
                          <span className="text-red-400">{team.totalLosses}L</span>
                        </div>
                        <div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              parseFloat(team.overallWinRate) >= 70
                                ? "bg-green-100 text-green-800"
                                : parseFloat(team.overallWinRate) >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {team.overallWinRate}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-3">
                        {team.oddsRanges.map((range) => {
                          const isOutlier = team.outlierRanges.some(
                            (or) => or.range === range.range
                          );
                          const isMostCommon = range.range === team.mostCommonRange;
                          const rangeKey = `${team.teamName}_${range.range}`;
                          const isExpanded = expandedTeamRanges.has(rangeKey);
                          const hasLosses = range.losses > 0;
                          const lossBetTypes = range.betTypes?.losses || {};
                          const winBetTypes = range.betTypes?.wins || {};

                          return (
                            <div
                              key={range.range}
                              className={`rounded-lg border text-sm ${
                                isOutlier
                                  ? "bg-red-500/20 border-red-500/50"
                                  : isMostCommon
                                  ? "bg-blue-500/20 border-blue-500/50"
                                  : "bg-white/10 border-white/20"
                              }`}
                            >
                              <div
                                className={`px-3 py-2 ${
                                  hasLosses ? "cursor-pointer" : ""
                                }`}
                                onClick={() => {
                                  if (hasLosses) {
                                    const newExpanded = new Set(expandedTeamRanges);
                                    if (newExpanded.has(rangeKey)) {
                                      newExpanded.delete(rangeKey);
                                    } else {
                                      newExpanded.add(rangeKey);
                                    }
                                    setExpandedTeamRanges(newExpanded);
                                  }
                                }}
                              >
                                <div className="font-medium text-white mb-1 flex items-center justify-between">
                                  <span>
                                    {range.range}
                                    {isOutlier && (
                                      <span
                                        className="ml-1 text-red-400"
                                        title="Outlier: Losses at non-normal odds"
                                      >
                                        ⚠️
                                      </span>
                                    )}
                                    {isMostCommon && (
                                      <span
                                        className="ml-1 text-blue-400"
                                        title="Most common odds range"
                                      >
                                        📍
                                      </span>
                                    )}
                                  </span>
                                  {hasLosses && (
                                    <span className="text-gray-400 text-xs">
                                      {isExpanded ? "▼" : "▶"}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs space-y-0.5">
                                  <div className="text-gray-300">
                                    {range.bets} bet{range.bets !== 1 ? "s" : ""}
                                  </div>
                                  <div>
                                    <span className="text-green-400">
                                      {range.wins}W
                                    </span>
                                    {range.losses > 0 && (
                                      <>
                                        <span className="text-gray-400"> / </span>
                                        <span className="text-red-400">
                                          {range.losses}L
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {range.totalWithResult > 0 && (
                                    <div
                                      className={`text-xs font-medium ${
                                        parseFloat(range.winRate) >= 70
                                          ? "text-green-400"
                                          : parseFloat(range.winRate) >= 50
                                          ? "text-yellow-400"
                                          : "text-red-400"
                                      }`}
                                    >
                                      {range.winRate}% win rate
                                    </div>
                                  )}
                                </div>
                              </div>
                              {isExpanded && hasLosses && (
                                <div className="px-3 pb-2 pt-1 border-t border-white/10">
                                  <div className="text-xs space-y-2">
                                    {/* Most Losses Warning */}
                                    {Object.entries(lossBetTypes).length > 0 && (
                                      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 mb-2">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="text-red-300 font-semibold text-xs mb-0.5">
                                              ⚠️ Most Losses:
                                            </div>
                                            <div className="text-white font-medium">
                                              {(() => {
                                                const sortedLosses = Object.entries(
                                                  lossBetTypes
                                                ).sort((a, b) => b[1] - a[1]);
                                                const topLoss = sortedLosses[0];
                                                const totalLosses = range.losses;
                                                const percentage = (
                                                  (topLoss[1] / totalLosses) *
                                                  100
                                                ).toFixed(0);
                                                return `${topLoss[0]} (${topLoss[1]}L - ${percentage}% of losses)`;
                                              })()}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-red-400 font-medium mb-1">
                                        Losses by Bet Type:
                                      </div>
                                      <div className="space-y-1">
                                        {Object.entries(lossBetTypes).length >
                                        0 ? (
                                          Object.entries(lossBetTypes)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([betType, count], index) => {
                                              const isTopLoss =
                                                index === 0 &&
                                                count ===
                                                  Math.max(
                                                    ...Object.values(lossBetTypes)
                                                  );
                                              return (
                                                <div
                                                  key={betType}
                                                  className={`flex items-center justify-between px-2 py-1 rounded ${
                                                    isTopLoss
                                                      ? "bg-red-500/20 border border-red-500/50"
                                                      : "bg-red-500/10"
                                                  }`}
                                                >
                                                  <span className="text-gray-300">
                                                    {betType}
                                                    {isTopLoss && (
                                                      <span className="ml-1 text-red-400">
                                                        🔴
                                                      </span>
                                                    )}
                                                  </span>
                                                  <span className="text-red-400 font-medium">
                                                    {count}L
                                                  </span>
                                                </div>
                                              );
                                            })
                                        ) : (
                                          <div className="text-gray-400">
                                            No bet type data
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {Object.keys(winBetTypes).length > 0 && (
                                      <div>
                                        <div className="text-green-400 font-medium mb-1">
                                          Wins by Bet Type:
                                        </div>
                                        <div className="space-y-1">
                                          {Object.entries(winBetTypes).map(
                                            ([betType, count]) => (
                                              <div
                                                key={betType}
                                                className="flex items-center justify-between bg-green-500/10 px-2 py-1 rounded"
                                              >
                                                <span className="text-gray-300">
                                                  {betType}
                                                </span>
                                                <span className="text-green-400 font-medium">
                                                  {count}W
                                                </span>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-gray-400 text-sm">
        <p>
          {viewMode === "ranges" ? (
            <>
              💡 Tip: Focus on odds ranges with higher win rates for better
              profitability
            </>
          ) : (
            <>
              💡 Tip: Look for teams with consistent performance at specific odds
              ranges. Outlier ranges (⚠️) indicate losses at odds that are not
              the norm for that team.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default OddsTab;
