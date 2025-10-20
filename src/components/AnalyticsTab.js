import React, { useState, useMemo } from "react";
import BetTypeChart from "./BetTypeChart";

const AnalyticsTab = ({
  handleAnalyticsSort,
  handleAnalyticsMultiSort,
  analyticsSortConfig,
  getSortedAnalyticsData,
  expandedAnalyticsTeams,
  toggleAnalyticsTeamExpansion,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");

  // Get all unique countries and leagues for filters
  const allData = getSortedAnalyticsData();
  const countries = [
    ...new Set(allData.map((team) => team.country).filter(Boolean)),
  ].sort();
  const leagues = [
    ...new Set(allData.map((team) => team.league).filter(Boolean)),
  ].sort();

  // Filter and search functionality
  const filteredData = useMemo(() => {
    let filtered = allData;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (team) =>
          team.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.team?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Country filter
    if (selectedCountry) {
      filtered = filtered.filter((team) => team.country === selectedCountry);
    }

    // League filter
    if (selectedLeague) {
      filtered = filtered.filter((team) => team.league === selectedLeague);
    }

    return filtered;
  }, [allData, searchTerm, selectedCountry, selectedLeague]);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        Team Performance Analytics
      </h3>

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
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country} className="bg-gray-800">
                  {country}
                </option>
              ))}
            </select>
          </div>

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
          {(searchTerm || selectedCountry || selectedLeague) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCountry("");
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
                onClick={() => handleAnalyticsMultiSort("totalBets")}
                title="Sort by Total Bets (with Win Rate as secondary)"
              >
                <div className="flex items-center justify-between">
                  <span>Total Bets</span>
                  {analyticsSortConfig.key === "totalBets" && (
                    <span className="ml-2">
                      {analyticsSortConfig.direction === "asc" ? "↑" : "↓"}
                      {analyticsSortConfig.secondaryKey && (
                        <span
                          className="text-xs ml-1"
                          title={`Secondary: ${analyticsSortConfig.secondaryKey}`}
                        >
                          *
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleAnalyticsMultiSort("wins")}
                title="Sort by Wins (with Win Rate as secondary)"
              >
                <div className="flex items-center justify-between">
                  <span>Wins</span>
                  {analyticsSortConfig.key === "wins" && (
                    <span className="ml-2">
                      {analyticsSortConfig.direction === "asc" ? "↑" : "↓"}
                      {analyticsSortConfig.secondaryKey && (
                        <span
                          className="text-xs ml-1"
                          title={`Secondary: ${analyticsSortConfig.secondaryKey}`}
                        >
                          *
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleAnalyticsMultiSort("losses")}
                title="Sort by Losses (with Win Rate as secondary)"
              >
                <div className="flex items-center justify-between">
                  <span>Losses</span>
                  {analyticsSortConfig.key === "losses" && (
                    <span className="ml-2">
                      {analyticsSortConfig.direction === "asc" ? "↑" : "↓"}
                      {analyticsSortConfig.secondaryKey && (
                        <span
                          className="text-xs ml-1"
                          title={`Secondary: ${analyticsSortConfig.secondaryKey}`}
                        >
                          *
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleAnalyticsMultiSort("winRate")}
                title="Sort by Win Rate (with Total Bets as secondary)"
              >
                <div className="flex items-center justify-between">
                  <span>Win Rate</span>
                  {analyticsSortConfig.key === "winRate" && (
                    <span className="ml-2">
                      {analyticsSortConfig.direction === "asc" ? "↑" : "↓"}
                      {analyticsSortConfig.secondaryKey && (
                        <span
                          className="text-xs ml-1"
                          title={`Secondary: ${analyticsSortConfig.secondaryKey}`}
                        >
                          *
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Bet Type Charts
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredData.map((team, index) => (
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
                    <div className="flex space-x-1">
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-400 mb-1">Win</div>
                        <BetTypeChart
                          teamBets={team.individualBets || []}
                          betType="Win"
                          teamName={team.teamName || team.team}
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-400 mb-1">DC</div>
                        <BetTypeChart
                          teamBets={team.individualBets || []}
                          betType="Double Chance"
                          teamName={team.teamName || team.team}
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-400 mb-1">Over</div>
                        <BetTypeChart
                          teamBets={team.individualBets || []}
                          betType="Over"
                          teamName={team.teamName || team.team}
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-400 mb-1">Under</div>
                        <BetTypeChart
                          teamBets={team.individualBets || []}
                          betType="Under"
                          teamName={team.teamName || team.team}
                        />
                      </div>
                    </div>
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
                    <td colSpan="9" className="px-4 py-2 bg-white/5">
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
