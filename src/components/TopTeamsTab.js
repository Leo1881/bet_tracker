import React, { useState, useMemo } from "react";

const TopTeamsTab = ({ getTopTeams, isTeamBlacklisted }) => {
  const [sortConfig, setSortConfig] = useState({
    key: null, // null means default composite score sort
    direction: "desc",
  });
  const [selectedBetType, setSelectedBetType] = useState("All");

  const teams = useMemo(() => {
    const sortByColumn = (teamsToSort) => {
      if (!sortConfig.key) {
        return [...teamsToSort].sort(
          (a, b) => (b.compositeScore || 0) - (a.compositeScore || 0),
        );
      }

      return [...teamsToSort].sort((a, b) => {
        let aValue;
        let bValue;

        switch (sortConfig.key) {
          case "winRate":
            aValue = a.displayWinRate ?? a.winRate ?? 0;
            bValue = b.displayWinRate ?? b.winRate ?? 0;
            break;
          case "totalBets":
            aValue = a.totalBets || 0;
            bValue = b.totalBets || 0;
            break;
          case "winsLosses":
            aValue = a.wins || 0;
            bValue = b.wins || 0;
            break;
          case "recentPerformance":
            aValue = a.recentWinRate || 0;
            bValue = b.recentWinRate || 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    };

    const allTeams = getTopTeams(selectedBetType);
    const teamsExcludingBlacklist = allTeams.filter(
      (team) => !isTeamBlacklisted(team.teamName),
    );

    const withDisplay = teamsExcludingBlacklist.map((team) => ({
      ...team,
      displayWinRate: team.weightedWinRate ?? team.winRate,
      rawWinRate: team.winRate,
    }));

    return sortByColumn(withDisplay).slice(0, 60);
  }, [getTopTeams, sortConfig, selectedBetType, isTeamBlacklisted]);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        key,
        direction: "desc",
      };
    });
  };

  const handleReset = () => {
    setSortConfig({ key: null, direction: "desc" });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-gray-400 text-xs">↕</span>;
    }
    return (
      <span className="text-blue-400">
        {sortConfig.direction === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">
          Top 60 Teams (best market)
        </h3>
        {sortConfig.key && (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Reset to Default Sort
          </button>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Filter by Bet Type:
        </label>
        <select
          value={selectedBetType}
          onChange={(e) => {
            setSelectedBetType(e.target.value);
            setSortConfig({ key: null, direction: "desc" });
          }}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All" className="bg-gray-800">
            Best market (default)
          </option>
          <option value="Win" className="bg-gray-800">
            Straight Win only
          </option>
          <option value="Double Chance" className="bg-gray-800">
            Double Chance only
          </option>
          <option value="Over" className="bg-gray-800">
            Over/Under only
          </option>
        </select>
      </div>

      <div className="text-gray-300 mb-6">
        <p>
          {selectedBetType === "All"
            ? "Each team appears once, ranked by their strongest market (Straight Win, Double Chance, or Over/Under). Score uses recency-weighted Wilson win rate (50%), win volume (30%), last-10 games (20%). Min 10 settled legs in that market, and at least one settled bet in the last 90 days (vs newest slip). Top 60 only."
            : `Ranked by ${selectedBetType === "Over" ? "Over/Under" : selectedBetType} only (min 10 settled legs of that type, active within 90 days). Same score formula. Top 60.`}
        </p>
        {sortConfig.key && (
          <p className="text-sm text-yellow-400 mt-2">
            Currently sorted by:{" "}
            {sortConfig.key === "winRate"
              ? "Win Rate"
              : sortConfig.key === "totalBets"
                ? "Total Bets"
                : sortConfig.key === "winsLosses"
                  ? "Wins/Losses"
                  : sortConfig.key === "recentPerformance"
                    ? "Recent Performance"
                    : ""}{" "}
            ({sortConfig.direction === "asc" ? "Ascending" : "Descending"})
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/20">
            <tr>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Rank
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Team
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleSort("winRate")}
              >
                <div className="flex items-center gap-2">
                  Win Rate (wtd)
                  {getSortIcon("winRate")}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleSort("totalBets")}
              >
                <div className="flex items-center gap-2">
                  Total Bets
                  {getSortIcon("totalBets")}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleSort("winsLosses")}
              >
                <div className="flex items-center gap-2">
                  Wins/Losses
                  {getSortIcon("winsLosses")}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleSort("recentPerformance")}
              >
                <div className="flex items-center gap-2">
                  Recent Performance
                  {getSortIcon("recentPerformance")}
                </div>
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Best Market
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Country
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                League
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {teams.map((team, index) => (
              <tr key={`${team.teamKey || team.teamName}-${index}`} className="hover:bg-white/5">
                <td className="px-4 py-2 text-gray-300">
                  <div className="flex items-center">
                    <span
                      className={`text-lg font-bold ${
                        index === 0
                          ? "text-yellow-400"
                          : index === 1
                            ? "text-gray-300"
                            : index === 2
                              ? "text-amber-600"
                              : "text-gray-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-300">
                  <div className="font-medium text-white">{team.teamName}</div>
                </td>
                <td className="px-4 py-2 text-gray-300">
                  <div className="flex flex-col gap-0.5">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
                        (team.displayWinRate ?? team.winRate) >= 70
                          ? "bg-green-100 text-green-800"
                          : (team.displayWinRate ?? team.winRate) >= 50
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {(team.displayWinRate ?? team.winRate).toFixed(1)}%
                    </span>
                    {team.rawWinRate != null &&
                      Math.abs(
                        (team.displayWinRate ?? team.winRate) - team.rawWinRate,
                      ) >= 0.5 && (
                        <span className="text-[10px] text-gray-500">
                          raw {team.rawWinRate.toFixed(1)}%
                        </span>
                      )}
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-300">{team.totalBets}</td>
                <td className="px-4 py-2 text-gray-300">
                  <div className="text-sm">
                    <span className="text-green-400">{team.wins}W</span>
                    <span className="text-gray-400"> / </span>
                    <span className="text-red-400">{team.losses}L</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-300">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      team.recentWinRate >= 70
                        ? "bg-green-100 text-green-800"
                        : team.recentWinRate >= 50
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {team.recentWinRate.toFixed(1)}% ({team.recentBets} games)
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-300">
                  <div className="text-sm">
                    <span className="text-blue-400 font-medium">
                      {team.bestMarket || "—"}
                    </span>
                    {selectedBetType === "All" && team.bestMarket && (
                      <div className="text-xs text-gray-400">
                        market that earned this rank
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-300">
                  <div className="text-xs">{team.country || "N/A"}</div>
                </td>
                <td className="px-4 py-2 text-gray-300">
                  <div className="text-xs">{team.league || "N/A"}</div>
                </td>
                <td className="px-4 py-2 text-gray-300">
                  <span className="font-medium text-blue-400">
                    {(team.compositeScore || 0).toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopTeamsTab;
