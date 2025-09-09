import React from "react";

const PerformanceTab = ({
  handleLeagueSort,
  leagueSortConfig,
  getSortedLeagueData,
  handleCountrySort,
  countrySortConfig,
  getSortedCountryData,
}) => {
  return (
    <div className="space-y-6">
      {/* League Performance Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          League Performance Analytics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/20">
              <tr>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleLeagueSort("leagueDisplay")}
                >
                  <div className="flex items-center justify-between">
                    <span>League</span>
                    {leagueSortConfig.key === "leagueDisplay" && (
                      <span className="ml-2">
                        {leagueSortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleLeagueSort("total")}
                >
                  <div className="flex items-center justify-between">
                    <span>Bets</span>
                    {leagueSortConfig.key === "total" && (
                      <span className="ml-2">
                        {leagueSortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleLeagueSort("wins")}
                >
                  <div className="flex items-center justify-between">
                    <span>Wins</span>
                    {leagueSortConfig.key === "wins" && (
                      <span className="ml-2">
                        {leagueSortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleLeagueSort("losses")}
                >
                  <div className="flex items-center justify-between">
                    <span>Losses</span>
                    {leagueSortConfig.key === "losses" && (
                      <span className="ml-2">
                        {leagueSortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleLeagueSort("winRate")}
                >
                  <div className="flex items-center justify-between">
                    <span>Win Rate</span>
                    {leagueSortConfig.key === "winRate" && (
                      <span className="ml-2">
                        {leagueSortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {getSortedLeagueData().map((league, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-2 text-gray-200 font-medium">
                    {league.leagueDisplay}
                  </td>
                  <td className="px-4 py-2 text-gray-200">{league.total}</td>
                  <td className="px-4 py-2 text-green-400">{league.wins}</td>
                  <td className="px-4 py-2 text-red-400">{league.losses}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        parseFloat(league.winRate) >= 70
                          ? "bg-green-100 text-green-800"
                          : parseFloat(league.winRate) >= 50
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {league.winRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Country Performance Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          🌍 Country Performance Analytics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/20">
              <tr>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleCountrySort("country")}
                >
                  <div className="flex items-center justify-between">
                    <span>Country</span>
                    {countrySortConfig.key === "country" && (
                      <span className="ml-2">
                        {countrySortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleCountrySort("total")}
                >
                  <div className="flex items-center justify-between">
                    <span>Bets</span>
                    {countrySortConfig.key === "total" && (
                      <span className="ml-2">
                        {countrySortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleCountrySort("wins")}
                >
                  <div className="flex items-center justify-between">
                    <span>Wins</span>
                    {countrySortConfig.key === "wins" && (
                      <span className="ml-2">
                        {countrySortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleCountrySort("losses")}
                >
                  <div className="flex items-center justify-between">
                    <span>Losses</span>
                    {countrySortConfig.key === "losses" && (
                      <span className="ml-2">
                        {countrySortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleCountrySort("winRate")}
                >
                  <div className="flex items-center justify-between">
                    <span>Win Rate</span>
                    {countrySortConfig.key === "winRate" && (
                      <span className="ml-2">
                        {countrySortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {getSortedCountryData().map((country, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-2 text-gray-200 font-medium">
                    {country.country}
                  </td>
                  <td className="px-4 py-2 text-gray-200">{country.total}</td>
                  <td className="px-4 py-2 text-green-400">{country.wins}</td>
                  <td className="px-4 py-2 text-red-400">{country.losses}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        parseFloat(country.winRate) >= 70
                          ? "bg-green-100 text-green-800"
                          : parseFloat(country.winRate) >= 50
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {country.winRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTab;
