import React from "react";

const TopTeamsTab = ({ getTopTeams }) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        Top 100 Teams Ranking
      </h3>
      <div className="text-gray-300 mb-6">
        <p>
          Teams ranked by composite score: Win Rate (50%), Total Wins (30%),
          Recent Performance (20%)
        </p>
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
              <th className="px-4 py-2 text-left text-white font-semibold">
                Win Rate
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Total Bets
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Wins/Losses
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Recent Performance
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
            {getTopTeams().map((team, index) => (
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
                  <div className="font-medium text-white">{team.teamName}</div>
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
                      {team.recentWinRate.toFixed(1)}% ({team.recentBets} bets)
                    </span>
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
