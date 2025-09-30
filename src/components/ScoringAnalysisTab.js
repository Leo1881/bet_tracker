import React, { useState } from "react";

const ScoringAnalysisTab = ({
  analyzeScoringPatterns,
  scoringAnalysisLoading,
  scoringAnalysis,
  bets,
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: "over2_5Rate",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");

  const handleSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    if (!scoringAnalysis || scoringAnalysis.length === 0) return [];

    let filtered = scoringAnalysis.filter((stat) => stat.totalGames >= 3);

    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (stat) =>
          stat.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stat.league.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stat.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered
      .sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig.key) {
          case "totalGames":
            aValue = a.totalGames;
            bValue = b.totalGames;
            break;
          case "avgGoals":
            aValue = parseFloat(a.avgGoals);
            bValue = parseFloat(b.avgGoals);
            break;
          case "over1_5Rate":
            aValue = parseFloat(a.over1_5Rate);
            bValue = parseFloat(b.over1_5Rate);
            break;
          case "over2_5Rate":
            aValue = parseFloat(a.over2_5Rate);
            bValue = parseFloat(b.over2_5Rate);
            break;
          case "over3_5Rate":
            aValue = parseFloat(a.over3_5Rate);
            bValue = parseFloat(b.over3_5Rate);
            break;
          default:
            return 0;
        }

        if (sortConfig.direction === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      })
      .slice(0, 50);
  };
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Scoring Analysis</h3>
        <button
          onClick={analyzeScoringPatterns}
          disabled={scoringAnalysisLoading}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            scoringAnalysisLoading
              ? "bg-gray-500 text-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {scoringAnalysisLoading
            ? "🔄 Analyzing..."
            : "📊 Analyze Scoring Patterns"}
        </button>
      </div>

      {scoringAnalysis && scoringAnalysis.length > 0 ? (
        <div className="space-y-4">
          <div className="text-gray-300 mb-4">
            <p>
              📈 Team scoring patterns based on{" "}
              {bets
                ? bets.filter((bet) => bet.HOME_SCORE && bet.AWAY_SCORE).length
                : 0}{" "}
              games with scores
            </p>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search teams, leagues, or countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-400 mt-2">
                Showing {getSortedData().length} results for "{searchTerm}"
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/20">
                <tr>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    Team
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    League
                  </th>
                  <th
                    className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("totalGames")}
                  >
                    <div className="flex items-center justify-between">
                      <span>Games</span>
                      {sortConfig.key === "totalGames" && (
                        <span className="ml-2">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("avgGoals")}
                  >
                    <div className="flex items-center justify-between">
                      <span>Avg Goals</span>
                      {sortConfig.key === "avgGoals" && (
                        <span className="ml-2">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("over1_5Rate")}
                  >
                    <div className="flex items-center justify-between">
                      <span>Over 1.5</span>
                      {sortConfig.key === "over1_5Rate" && (
                        <span className="ml-2">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("over2_5Rate")}
                  >
                    <div className="flex items-center justify-between">
                      <span>Over 2.5</span>
                      {sortConfig.key === "over2_5Rate" && (
                        <span className="ml-2">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("over3_5Rate")}
                  >
                    <div className="flex items-center justify-between">
                      <span>Over 3.5</span>
                      {sortConfig.key === "over3_5Rate" && (
                        <span className="ml-2">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {getSortedData().map((stat, index) => (
                  <tr
                    key={index}
                    className={`${
                      index % 2 === 0 ? "bg-white/5" : "bg-white/10"
                    }`}
                  >
                    <td className="px-4 py-3 text-white font-medium">
                      {stat.team}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {stat.country} - {stat.league}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {stat.totalGames}
                    </td>
                    <td className="px-4 py-3 text-blue-300 font-mono">
                      {stat.avgGoals}
                    </td>
                    <td className="px-4 py-3 text-green-300 font-mono">
                      {stat.over1_5Rate}%
                    </td>
                    <td className="px-4 py-3 text-yellow-300 font-mono">
                      {stat.over2_5Rate}%
                    </td>
                    <td className="px-4 py-3 text-orange-300 font-mono">
                      {stat.over3_5Rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-4">
            📊 No Scoring Analysis Available
          </div>
          <p className="text-gray-500">
            Click "Analyze Scoring Patterns" to generate scoring analysis based
            on your historical data.
          </p>
        </div>
      )}
    </div>
  );
};

export default ScoringAnalysisTab;
