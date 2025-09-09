import React from "react";

const ScoringAnalysisTab = ({
  analyzeScoringPatterns,
  scoringAnalysisLoading,
  scoringAnalysis,
  bets,
}) => {
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
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    Games
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    Avg Goals
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    Over 1.5
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    Over 2.5
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    Over 3.5
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {scoringAnalysis
                  .filter((stat) => stat.totalGames >= 3) // Only show teams with 3+ games
                  .sort(
                    (a, b) =>
                      parseFloat(b.over2_5Rate) - parseFloat(a.over2_5Rate)
                  )
                  .slice(0, 50) // Show top 50 teams
                  .map((stat, index) => (
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
