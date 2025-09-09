import React from "react";

const HeadToHeadTab = ({ analysisResults, formatDate }) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        Head to Head Analysis
      </h3>
      <div className="text-gray-300 mb-6">
        <p>
          This tab shows matchups found in your new bet analysis. Click "Fetch &
          Analyze New Bets" in the Bet Analysis tab to populate this data.
        </p>
      </div>

      {analysisResults.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white mb-4">
            📋 Matchups Found in New Bets (
            {
              analysisResults.filter((r) => r.previousMatchups.length > 0)
                .length
            }{" "}
            matchups)
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/20">
                <tr>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    New Bet
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    Country
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    League
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    Teams
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    Previous Bets
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {analysisResults
                  .filter((result) => result.previousMatchups.length > 0)
                  .map((result, index) => {
                    const wins = result.previousMatchups.filter((m) =>
                      m.result?.toLowerCase().includes("win")
                    ).length;
                    const losses = result.previousMatchups.filter((m) =>
                      m.result?.toLowerCase().includes("loss")
                    ).length;
                    const total = wins + losses;
                    const winRate =
                      total > 0 ? ((wins / total) * 100).toFixed(1) : 0;

                    return (
                      <tr key={index} className="hover:bg-white/5">
                        <td className="px-4 py-2 text-gray-300">
                          <div className="text-sm">
                            <div className="font-medium text-purple-300">
                              {result.TEAM_INCLUDED}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatDate(result.DATE)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-gray-300">
                          {result.COUNTRY}
                        </td>
                        <td className="px-4 py-2 text-gray-300">
                          {result.LEAGUE}
                        </td>
                        <td className="px-4 py-2 text-gray-300">
                          <div className="text-sm">
                            <div>
                              {result.HOME_TEAM} vs {result.AWAY_TEAM}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-gray-300">
                          <div className="text-sm">
                            <div className="text-blue-400 font-medium mb-1">
                              {result.previousMatchups.length} previous bet
                              {result.previousMatchups.length > 1 ? "s" : ""}
                            </div>
                            {result.previousMatchups
                              .slice(0, 3)
                              .map((matchup, idx) => (
                                <div key={idx} className="text-xs mb-1">
                                  <div className="text-gray-400">
                                    {formatDate(matchup.date)}:{" "}
                                    {matchup.betType} - {matchup.betSelection}
                                  </div>
                                  <div
                                    className={`text-xs ${
                                      matchup.result
                                        ?.toLowerCase()
                                        .includes("win")
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {matchup.result} • {matchup.teamIncluded}
                                  </div>
                                </div>
                              ))}
                            {result.previousMatchups.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{result.previousMatchups.length - 3} more...
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm">
                            <div className="text-gray-300">
                              {wins}W - {losses}L
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium mt-1 inline-block ${
                                parseFloat(winRate) >= 70
                                  ? "bg-green-100 text-green-800"
                                  : parseFloat(winRate) >= 50
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {winRate}% win rate
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-4">No Matchups Found</div>
          <p className="text-gray-500">
            No previous matchups found in your new bets. Click "Fetch & Analyze
            New Bets" in the Bet Analysis tab to populate this data.
          </p>
        </div>
      )}
    </div>
  );
};

export default HeadToHeadTab;
