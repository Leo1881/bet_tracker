import React from "react";

const DailyGamesTab = ({ dailyGamesLoading, getProcessedDailyGames }) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">Daily Games</h3>

      {dailyGamesLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-4">
            Loading daily games...
          </div>
        </div>
      ) : getProcessedDailyGames().length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-4">
            No Games with Historical Data
          </div>
          <p className="text-gray-500">
            Upload games to Sheet5 in your Google Spreadsheet to see teams you
            have betting history for.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {getProcessedDailyGames().map((game, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-semibold text-white">
                    {game.home_team} vs {game.away_team}
                  </span>
                  <span className="text-gray-400 text-sm">{game.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400 text-sm">
                    {game.odds1} / {game.odds2}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Team Analysis */}
                <div className="bg-white/5 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-300 font-medium">
                      {game.home_team}
                    </span>
                    {game.homeTeamRank && (
                      <span className="text-yellow-400 text-sm">
                        Top 40: #{game.homeTeamRank}
                      </span>
                    )}
                  </div>
                  {game.homeTeamInHistory && game.homeTeamAnalytics ? (
                    <div className="text-sm space-y-1">
                      <div
                        className={`${
                          parseFloat(game.homeTeamAnalytics.winRate) >= 60
                            ? "text-green-400"
                            : parseFloat(game.homeTeamAnalytics.winRate) >= 40
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        Win Rate: {game.homeTeamAnalytics.winRate}% (
                        {game.homeTeamAnalytics.wins}W,{" "}
                        {game.homeTeamAnalytics.losses}L)
                      </div>
                      <div className="text-gray-300">
                        Total Bets: {game.homeTeamAnalytics.total}
                      </div>
                      <div className="text-blue-300 text-xs">
                        {game.homeCountryLeague?.country} -{" "}
                        {game.homeCountryLeague?.league}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">
                      No historical betting data
                    </div>
                  )}
                </div>

                {/* Away Team Analysis */}
                <div className="bg-white/5 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-300 font-medium">
                      {game.away_team}
                    </span>
                    {game.awayTeamRank && (
                      <span className="text-yellow-400 text-sm">
                        Top 40: #{game.awayTeamRank}
                      </span>
                    )}
                  </div>
                  {game.awayTeamInHistory && game.awayTeamAnalytics ? (
                    <div className="text-sm space-y-1">
                      <div
                        className={`${
                          parseFloat(game.awayTeamAnalytics.winRate) >= 60
                            ? "text-green-400"
                            : parseFloat(game.awayTeamAnalytics.winRate) >= 40
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        Win Rate: {game.awayTeamAnalytics.winRate}% (
                        {game.awayTeamAnalytics.wins}W,{" "}
                        {game.awayTeamAnalytics.losses}L)
                      </div>
                      <div className="text-gray-300">
                        Total Bets: {game.awayTeamAnalytics.total}
                      </div>
                      <div className="text-blue-300 text-xs">
                        {game.awayCountryLeague?.country} -{" "}
                        {game.awayCountryLeague?.league}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">
                      No historical betting data
                    </div>
                  )}
                </div>
              </div>

              {/* Head to Head Data */}
              {game.headToHeadData.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-sm text-blue-400 font-medium mb-2">
                    Previous Matchups:
                  </div>
                  <div className="text-sm text-gray-300">
                    {game.headToHeadData.slice(0, 3).map((matchup, idx) => (
                      <div key={idx} className="mb-1">
                        {matchup.date}: {matchup.result} ({matchup.odds})
                      </div>
                    ))}
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

export default DailyGamesTab;
