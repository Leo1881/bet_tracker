import React from "react";

const TeamAnalyticsTab = ({
  getTeamBetTypeAnalytics,
  expandedBetTypes,
  toggleTeamExpansion,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">Team Analytics</h3>
      <div className="text-gray-300 mb-6">
        <p>
          Teams ranked by composite score: Win Rate (60%) + Sample Size Bonus
          (40%). Higher sample sizes = more reliable performance data.
        </p>
      </div>

      {getTeamBetTypeAnalytics().length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-4">
            📊 No Team Data Found
          </div>
          <p className="text-gray-500">
            Add some bets to see your performance by team.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {getTeamBetTypeAnalytics().map((team) => (
            <div key={team.team} className="bg-white/5 rounded-lg p-4">
              <button
                onClick={() => toggleTeamExpansion(team.team)}
                className="w-full text-left flex items-center justify-between hover:bg-white/5 p-2 rounded transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-semibold text-white">
                    {team.team}
                  </span>
                  <span className="text-green-400 font-medium">
                    {team.winRate}% ({team.wins}W, {team.losses}L)
                  </span>
                  <span className="text-yellow-400 text-sm">
                    Avg Odds: {team.avgOdds}
                  </span>
                  <span className="text-blue-400 text-sm font-medium">
                    Score: {team.compositeScore?.toFixed(1) || "N/A"}
                  </span>
                </div>
                <span className="text-gray-400">
                  {expandedBetTypes.has(team.team) ? "▼" : "▶"}
                </span>
              </button>

              {expandedBetTypes.has(team.team) && (
                <div className="mt-4 space-y-4">
                  {/* Bet Type Breakdown */}
                  {team.betTypeBreakdown.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-2">
                        Bet Type Performance:
                      </h4>
                      <div className="space-y-1">
                        {team.betTypeBreakdown.map((betType, idx) => (
                          <div key={idx} className="text-sm text-gray-300 ml-4">
                            • {betType.betType}: {betType.wins}W,{" "}
                            {betType.losses}L ({betType.winRate}%) -{" "}
                            {betType.total} bets (Avg Odds: {betType.avgOdds})
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
                          <div key={idx} className="text-sm text-gray-300 ml-4">
                            • {league.league}: {league.wins}W, {league.losses}L
                            ({league.winRate}%) - {league.total} bets
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
                        • Last {team.recentTotal} bets: {team.recentWins}W,{" "}
                        {team.recentLosses}L ({team.recentWinRate}%)
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
                        {(parseFloat(team.winRate) * 0.6).toFixed(1)} (60% of{" "}
                        {team.winRate}%)
                      </div>
                      <div>
                        • Sample Size Bonus: {team.sampleSizeScore} (based on{" "}
                        {team.total} bets)
                      </div>
                      <div>
                        • Composite Score:{" "}
                        {team.compositeScore?.toFixed(1) || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamAnalyticsTab;
