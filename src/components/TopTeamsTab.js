import React, { useState, useMemo, useCallback } from "react";

const TopTeamsTab = ({ getTopTeams, blacklistedTeams, isTeamBlacklisted }) => {
  const [sortConfig, setSortConfig] = useState({
    key: null, // null means default composite score sort
    direction: 'desc'
  });
  const [selectedBetType, setSelectedBetType] = useState('All');

  // Helper function to check if a bet matches a bet type
  const matchesBetType = (bet, betType) => {
    if (betType === 'All') return true;
    
    const betTypeLower = betType.toLowerCase();
    const betSelection = (bet.BET_SELECTION || bet.bet_selection || "").toLowerCase();
    const betTypeField = (bet.BET_TYPE || bet.bet_type || bet.betType || "").toLowerCase();

    if (betTypeLower === "win") {
      return betSelection.includes("win") || betTypeField.includes("win");
    } else if (betTypeLower === "double chance") {
      return betSelection.includes("x") || betTypeField.includes("double chance");
    } else if (betTypeLower === "over") {
      return betSelection.includes("over") || betTypeField.includes("over");
    } else if (betTypeLower === "under") {
      return betSelection.includes("under") || betTypeField.includes("under");
    }
    return false;
  };

  // Calculate composite score for a bet type (same formula as overall)
  const calculateBetTypeCompositeScore = (betTypeData, recentWinRate, recentBets) => {
    const winRate = parseFloat(betTypeData.winRate) || 0;
    const wins = betTypeData.wins || 0;
    const totalBets = betTypeData.totalWithResult || 0;

    // Win Rate Score (50%)
    const winRateScore = winRate * 0.5;

    // Total Wins Score (30%) - normalized to 0-30
    const totalWinsScore = Math.min(30, (wins / 10) * 30);

    // Recent Performance Score (20%)
    const recentPerformanceScore = (recentWinRate || 0) * 0.2;

    // Bet Type Specialization Bonus (max 5 points)
    let betTypeBonus = 0;
    if (totalBets >= 10) {
      betTypeBonus = Math.min(5, (totalBets - 10) / 10); // 0.5 points per 10 bets above 10
    }

    // Volume Bonus (max 5 points)
    let volumeBonus = 0;
    if (totalBets >= 20) {
      volumeBonus = Math.min(5, (totalBets - 20) / 20); // 0.25 points per 20 bets above 20
    }

    return winRateScore + totalWinsScore + recentPerformanceScore + betTypeBonus + volumeBonus;
  };

  // Calculate recent performance for a specific bet type (last 10 settled bets only)
  const calculateRecentPerformance = useCallback((individualBets, betType) => {
    if (!individualBets || individualBets.length === 0) return { recentWinRate: 0, recentBets: 0 };

    const filteredByType = individualBets.filter(bet => matchesBetType(bet, betType));
    const settledOnly = filteredByType.filter(
      (bet) => {
        const result = (bet.RESULT || bet.result || "").toLowerCase();
        return result.includes("win") || result.includes("loss");
      }
    );
    const last10Settled = settledOnly
      .sort((a, b) => new Date(b.DATE || b.date) - new Date(a.DATE || a.date))
      .slice(0, 10);

    let recentWins = 0;
    last10Settled.forEach((bet) => {
      const result = (bet.RESULT || bet.result || "").toLowerCase();
      if (result.includes("win")) recentWins++;
    });

    const recentBets = last10Settled.length;
    const recentWinRate = recentBets > 0 ? (recentWins / recentBets) * 100 : 0;

    return { recentWinRate, recentBets };
  }, []);

  const teams = useMemo(() => {
    // Helper function to sort teams (defined inside useMemo to access sortConfig)
    const sortTeams = (teamsToSort) => {
      if (!sortConfig.key) {
        return teamsToSort;
      }

      return [...teamsToSort].sort((a, b) => {
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
    };

    const allTeams = getTopTeams();
    // Exclude blacklisted teams from the list entirely
    const teamsExcludingBlacklist = allTeams.filter(
      (team) => !isTeamBlacklisted(team.teamName)
    );

    // If "All" is selected, use teams as-is (minus blacklisted)
    if (selectedBetType === 'All') {
      return sortTeams(teamsExcludingBlacklist);
    }

    // Filter teams that have the selected bet type with at least 3 bets
    const filteredTeams = teamsExcludingBlacklist
      .map(team => {
        // Find the bet type in breakdown
        const betTypeData = team.betTypeBreakdown?.find(bt => {
          const btLower = bt.betType.toLowerCase();
          const selectedLower = selectedBetType.toLowerCase();
          
          if (selectedLower === "win") {
            return btLower.includes("win") && !btLower.includes("double chance");
          } else if (selectedLower === "double chance") {
            return btLower.includes("double chance") || btLower.includes("x");
          } else if (selectedLower === "over") {
            return btLower.includes("over");
          } else if (selectedLower === "under") {
            return btLower.includes("under");
          }
          return false;
        });

        // Must have at least 3 bets for this bet type
        if (!betTypeData || betTypeData.totalWithResult < 3) {
          return null;
        }

        // Calculate recent performance for this bet type
        const recent = calculateRecentPerformance(team.individualBets || [], selectedBetType);

        // Calculate composite score for this bet type
        const compositeScore = calculateBetTypeCompositeScore(
          betTypeData,
          recent.recentWinRate,
          recent.recentBets
        );

        // Return team with bet type-specific stats
        return {
          ...team,
          winRate: parseFloat(betTypeData.winRate) || 0,
          totalBets: betTypeData.totalWithResult,
          wins: betTypeData.wins,
          losses: betTypeData.losses,
          recentWinRate: recent.recentWinRate,
          recentBets: recent.recentBets,
          compositeScore: compositeScore
        };
      })
      .filter(team => team !== null)
      .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
      .slice(0, 100); // Top 100

    return sortTeams(filteredTeams);
  }, [getTopTeams, sortConfig, selectedBetType, calculateRecentPerformance, isTeamBlacklisted]);

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
      {/* Bet Type Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Filter by Bet Type:
        </label>
        <select
          value={selectedBetType}
          onChange={(e) => {
            setSelectedBetType(e.target.value);
            setSortConfig({ key: null, direction: 'desc' }); // Reset sort when changing filter
          }}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All" className="bg-gray-800">All Bet Types</option>
          <option value="Win" className="bg-gray-800">Win</option>
          <option value="Double Chance" className="bg-gray-800">Double Chance</option>
          <option value="Over" className="bg-gray-800">Over</option>
          <option value="Under" className="bg-gray-800">Under</option>
        </select>
      </div>

      <div className="text-gray-300 mb-6">
        <p>
          {selectedBetType === 'All' 
            ? 'Teams ranked by composite score: Win Rate (50%), Total Wins (30%), Recent Performance (20%) + Bet Type Specialization Bonus'
            : `Teams ranked by ${selectedBetType} bet type performance (minimum 3 bets). Same composite score formula applied.`
          }
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
            {teams.map((team, index) => (
                <tr key={index} className="hover:bg-white/5">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopTeamsTab;
