import React, { useState, useMemo } from "react";
import BetTypeChart from "./BetTypeChart";

const TeamAnalyticsTab = ({
  getTeamBetTypeAnalytics,
  expandedBetTypes,
  toggleTeamExpansion,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Get all data and unique leagues for filters
  const allData = getTeamBetTypeAnalytics();
  const leagues = [
    ...new Set(
      allData
        .flatMap(
          (team) => team.leagueBreakdown?.map((league) => league.league) || []
        )
        .filter(Boolean)
    ),
  ].sort();

  // Filter and search functionality
  const filteredData = useMemo(() => {
    let filtered = allData;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((team) =>
        team.team?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // League filter
    if (selectedLeague) {
      filtered = filtered.filter((team) =>
        team.leagueBreakdown?.some((league) => league.league === selectedLeague)
      );
    }

    return filtered;
  }, [allData, searchTerm, selectedLeague]);

  // Sorting functionality
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle numeric fields
      if (
        sortConfig.key === "winRate" ||
        sortConfig.key === "compositeScore" ||
        sortConfig.key === "total" ||
        sortConfig.key === "wins" ||
        sortConfig.key === "losses" ||
        sortConfig.key === "avgOdds"
      ) {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">Team Analytics</h3>
      <div className="text-gray-300 mb-6">
        <p>
          Teams ranked by composite score: Win Rate (60%) + Sample Size Bonus
          (40%). Higher sample sizes = more reliable performance data.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Leagues</option>
              {leagues.map((league) => (
                <option key={league} value={league} className="bg-gray-800">
                  {league}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || selectedLeague) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedLeague("");
              }}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-400">
          Showing {filteredData.length} of {allData.length} teams
        </div>
      </div>

      {sortedData.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-4">
            📊 No Team Data Found
          </div>
          <p className="text-gray-500">
            Add some bets to see your performance by team.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/20">
              <tr>
                <th className="px-4 py-2 text-left text-white font-semibold">
                  Team
                </th>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleSort("winRate")}
                >
                  <div className="flex items-center justify-between">
                    <span>Win Rate</span>
                    {sortConfig.key === "winRate" && (
                      <span className="ml-2">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleSort("total")}
                >
                  <div className="flex items-center justify-between">
                    <span>Total Bets</span>
                    {sortConfig.key === "total" && (
                      <span className="ml-2">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleSort("wins")}
                >
                  <div className="flex items-center justify-between">
                    <span>Wins/Losses</span>
                    {sortConfig.key === "wins" && (
                      <span className="ml-2">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleSort("avgOdds")}
                >
                  <div className="flex items-center justify-between">
                    <span>Avg Odds</span>
                    {sortConfig.key === "avgOdds" && (
                      <span className="ml-2">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-2 text-left text-white font-semibold">
                  Bet Type Charts
                </th>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleSort("compositeScore")}
                >
                  <div className="flex items-center justify-between">
                    <span>Score</span>
                    {sortConfig.key === "compositeScore" && (
                      <span className="ml-2">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
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
              {sortedData.map((team) => (
                <React.Fragment key={team.team}>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2 text-gray-200 font-medium">
                      {team.team}
                    </td>
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
                    <td className="px-4 py-2 text-gray-200">{team.total}</td>
                    <td className="px-4 py-2 text-gray-200">
                      <div className="text-sm">
                        <span className="text-green-400">{team.wins}W</span>
                        <span className="text-gray-400"> / </span>
                        <span className="text-red-400">{team.losses}L</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-200">{team.avgOdds}</td>
                    <td className="px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="flex flex-col items-center">
                          <div className="text-xs text-gray-400 mb-1">Win</div>
                          <BetTypeChart
                            teamBets={team.recentBets || []}
                            betType="Win"
                            teamName={team.team}
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="text-xs text-gray-400 mb-1">DC</div>
                          <BetTypeChart
                            teamBets={team.recentBets || []}
                            betType="Double Chance"
                            teamName={team.team}
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="text-xs text-gray-400 mb-1">Over</div>
                          <BetTypeChart
                            teamBets={team.recentBets || []}
                            betType="Over"
                            teamName={team.team}
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="text-xs text-gray-400 mb-1">
                            Under
                          </div>
                          <BetTypeChart
                            teamBets={team.recentBets || []}
                            betType="Under"
                            teamName={team.team}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-200">
                      <span className="font-medium text-blue-400">
                        {team.compositeScore?.toFixed(1) || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => toggleTeamExpansion(team.team)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {expandedBetTypes.has(team.team) ? "▼" : "▶"}
                      </button>
                    </td>
                  </tr>

                  {expandedBetTypes.has(team.team) && (
                    <tr>
                      <td colSpan="8" className="px-4 py-2 bg-white/5">
                        <div className="ml-4 space-y-4">
                          {/* Bet Type Breakdown */}
                          {team.betTypeBreakdown.length > 0 && (
                            <div>
                              <h4 className="text-white font-medium mb-2">
                                Bet Type Performance:
                              </h4>
                              <div className="space-y-1">
                                {team.betTypeBreakdown.map((betType, idx) => (
                                  <div
                                    key={idx}
                                    className="text-sm text-gray-300 ml-4"
                                  >
                                    • {betType.betType}: {betType.wins}W,{" "}
                                    {betType.losses}L ({betType.winRate}%) -{" "}
                                    {betType.total} bets (Avg Odds:{" "}
                                    {betType.avgOdds})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* League Breakdown */}
                          {team.leagueBreakdown.length > 0 && (
                            <div>
                              <h4 className="text-white font-medium mb-2">
                                League Performance:
                              </h4>
                              <div className="space-y-1">
                                {team.leagueBreakdown.map((league, idx) => (
                                  <div
                                    key={idx}
                                    className="text-sm text-gray-300 ml-4"
                                  >
                                    • {league.league}: {league.wins}W,{" "}
                                    {league.losses}L ({league.winRate}%) -{" "}
                                    {league.total} bets
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recent Performance */}
                          {team.recentTotal > 0 && (
                            <div>
                              <h4 className="text-white font-medium mb-2">
                                Recent Performance:
                              </h4>
                              <div className="text-sm text-gray-300 ml-4">
                                • Last {team.recentTotal} bets:{" "}
                                {team.recentWins}W, {team.recentLosses}L (
                                {team.recentWinRate}%)
                              </div>
                            </div>
                          )}

                          {/* Score Breakdown */}
                          <div>
                            <h4 className="text-white font-medium mb-2">
                              Score Breakdown:
                            </h4>
                            <div className="text-sm text-gray-300 ml-4 space-y-1">
                              <div>
                                • Win Rate Score:{" "}
                                {(parseFloat(team.winRate) * 0.6).toFixed(1)}{" "}
                                (60% of {team.winRate}%)
                              </div>
                              <div>
                                • Sample Size Bonus: {team.sampleSizeScore}{" "}
                                (based on {team.total} bets)
                              </div>
                              <div>
                                • Composite Score:{" "}
                                {team.compositeScore?.toFixed(1) || "N/A"}
                              </div>
                            </div>
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
      )}
    </div>
  );
};

export default TeamAnalyticsTab;
