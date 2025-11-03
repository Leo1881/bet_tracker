import React, { useState, useMemo } from "react";

const TopTeamsTab = ({ getTopTeams, blacklistedTeams, isTeamBlacklisted }) => {
  const [sortConfig, setSortConfig] = useState({
    key: null, // null means default composite score sort
    direction: 'desc'
  });

  const teams = useMemo(() => {
    const allTeams = getTopTeams();
    
    // If no sort is active, return default sorted teams
    if (!sortConfig.key) {
      return allTeams;
    }

    // Create a sorted copy
    const sorted = [...allTeams].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'winRate':
          aValue = a.winRate || 0;
          bValue = b.winRate || 0;
          break;
        case 'totalBets':
          aValue = a.totalBets || 0;
          bValue = b.totalBets || 0;
          break;
        case 'winsLosses':
          // Sort by total wins
          aValue = a.wins || 0;
          bValue = b.wins || 0;
          break;
        case 'recentPerformance':
          aValue = a.recentWinRate || 0;
          bValue = b.recentWinRate || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [getTopTeams, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      // If clicking the same column, toggle direction
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      // Otherwise, set new column with descending as default
      return {
        key,
        direction: 'desc'
      };
    });
  };

  const handleReset = () => {
    setSortConfig({ key: null, direction: 'desc' });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-gray-400 text-xs">↕</span>; // Neutral icon when not sorted
    }
    return (
      <span className={sortConfig.direction === 'asc' ? 'text-blue-400' : 'text-blue-400'}>
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">
          Top 100 Teams Ranking
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
      <div className="text-gray-300 mb-6">
        <p>
          Teams ranked by composite score: Win Rate (50%), Total Wins (30%),
          Recent Performance (20%) + Bet Type Specialization Bonus
        </p>
        {sortConfig.key && (
          <p className="text-sm text-yellow-400 mt-2">
            Currently sorted by: {sortConfig.key === 'winRate' ? 'Win Rate' : 
                                   sortConfig.key === 'totalBets' ? 'Total Bets' :
                                   sortConfig.key === 'winsLosses' ? 'Wins/Losses' :
                                   sortConfig.key === 'recentPerformance' ? 'Recent Performance' : ''} 
            ({sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'})
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
                onClick={() => handleSort('winRate')}
              >
                <div className="flex items-center gap-2">
                  Win Rate
                  {getSortIcon('winRate')}
                </div>
              </th>
              <th 
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleSort('totalBets')}
              >
                <div className="flex items-center gap-2">
                  Total Bets
                  {getSortIcon('totalBets')}
                </div>
              </th>
              <th 
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleSort('winsLosses')}
              >
                <div className="flex items-center gap-2">
                  Wins/Losses
                  {getSortIcon('winsLosses')}
                </div>
              </th>
              <th 
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleSort('recentPerformance')}
              >
                <div className="flex items-center gap-2">
                  Recent Performance
                  {getSortIcon('recentPerformance')}
                </div>
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Best Bet Type
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Countries
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Leagues
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {teams.map((team, index) => {
              const isBlacklisted = isTeamBlacklisted(team.teamName);
              return (
                <tr
                  key={index}
                  className={`hover:bg-white/5 ${
                    isBlacklisted
                      ? "bg-red-900/20 border-l-4 border-red-500"
                      : ""
                  }`}
                >
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
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-white">
                        {team.teamName}
                      </div>
                      {isBlacklisted && (
                        <span className="px-2 py-1 text-xs font-bold bg-red-600 text-white rounded-full">
                          BLACKLISTED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-300">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        team.winRate >= 70
                          ? "bg-green-100 text-green-800"
                          : team.winRate >= 50
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {team.winRate.toFixed(1)}%
                    </span>
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
                    <div className="text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          team.recentWinRate >= 70
                            ? "bg-green-100 text-green-800"
                            : team.recentWinRate >= 50
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {team.recentWinRate.toFixed(1)}% ({team.recentBets}{" "}
                        bets)
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-300">
                    <div className="text-sm">
                      {team.betTypeBreakdown &&
                      team.betTypeBreakdown.length > 0 ? (
                        <div>
                          <span className="text-blue-400 font-medium">
                            {team.betTypeBreakdown[0].betType}
                          </span>
                          <div className="text-xs text-gray-400">
                            {team.betTypeBreakdown[0].winRate}% (
                            {team.betTypeBreakdown[0].totalWithResult} bets)
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No data</span>
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
                      {team.compositeScore.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopTeamsTab;
