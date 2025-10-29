import React, { useState, useEffect } from 'react';
import { fetchSheetData } from '../utils/fetchSheetData';

const TeamUploadTab = ({ 
  scoringAnalysis = [], 
  teamAnalytics = [], 
  blacklistedTeams = [],
  isTeamBlacklisted 
}) => {
  const [uploadedTeams, setUploadedTeams] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate Wilson Score for confidence
  const calculateWilsonScore = (wins, total) => {
    if (total === 0) return 0;
    const n = total;
    const p = wins / total;
    const z = 1.96; // 95% confidence level
    return (
      (p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) /
      (1 + (z * z) / n)
    );
  };

  // Get confidence level based on sample size
  const getConfidenceLevel = (games) => {
    if (games >= 20) return { level: "High", color: "text-green-400", bg: "bg-green-500/20" };
    if (games >= 10) return { level: "Medium", color: "text-yellow-400", bg: "bg-yellow-500/20" };
    return { level: "Low", color: "text-red-400", bg: "bg-red-500/20" };
  };

  // Find team data in scoring analysis
  const findScoringData = (teamName, country, league) => {
    const normalizedTeamName = teamName.toLowerCase().trim();
    const normalizedCountry = country.toLowerCase().trim();
    const normalizedLeague = league.toLowerCase().trim();

    return scoringAnalysis.find(stat => {
      const statTeam = stat.team.toLowerCase().trim();
      const statCountry = stat.country.toLowerCase().trim();
      const statLeague = stat.league.toLowerCase().trim();

      return (
        statTeam.includes(normalizedTeamName) ||
        normalizedTeamName.includes(statTeam)
      ) && (
        statCountry.includes(normalizedCountry) ||
        normalizedCountry.includes(statCountry)
      ) && (
        statLeague.includes(normalizedLeague) ||
        normalizedLeague.includes(statLeague)
      );
    });
  };

  // Find team data in team analytics
  const findTeamAnalyticsData = (teamName, country, league) => {
    const normalizedTeamName = teamName.toLowerCase().trim();
    const normalizedCountry = country.toLowerCase().trim();
    const normalizedLeague = league.toLowerCase().trim();

    return teamAnalytics.find(stat => {
      const statTeam = stat.teamName.toLowerCase().trim();
      const statCountry = stat.country.toLowerCase().trim();
      const statLeague = stat.league.toLowerCase().trim();

      return (
        statTeam.includes(normalizedTeamName) ||
        normalizedTeamName.includes(statTeam)
      ) && (
        statCountry.includes(normalizedCountry) ||
        normalizedCountry.includes(statCountry)
      ) && (
        statLeague.includes(normalizedLeague) ||
        normalizedLeague.includes(statLeague)
      );
    });
  };

  // Analyze uploaded teams
  const analyzeTeams = (teams) => {
    const results = {
      straightWin: [],
      over1_5: [],
      over2_5: [],
      avoid: []
    };

    teams.forEach(team => {
      const scoringData = findScoringData(team.TEAM, team.COUNTRY, team.LEAGUE);
      const teamAnalyticsData = findTeamAnalyticsData(team.TEAM, team.COUNTRY, team.LEAGUE);
      
      if (!scoringData && !teamAnalyticsData) {
        // No data found - add to avoid list
        results.avoid.push({
          ...team,
          reason: "No historical data found",
          confidence: "N/A"
        });
        return;
      }

      const isBlacklisted = isTeamBlacklisted(scoringData?.team || teamAnalyticsData?.teamName);
      const totalGames = scoringData?.totalGames || teamAnalyticsData?.totalBets || 0;
      const confidence = getConfidenceLevel(totalGames);
      
      // Get win rate from team analytics
      const wins = teamAnalyticsData?.wins || 0;
      const losses = teamAnalyticsData?.losses || 0;
      const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
      const wilsonWinRate = (wins + losses) > 0 ? calculateWilsonScore(wins, wins + losses) * 100 : 0;
      
      // Get Over/Under data from scoring analysis
      const over1_5Rate = scoringData ? parseFloat(scoringData.over1_5Rate) : 0;
      const over2_5Rate = scoringData ? parseFloat(scoringData.over2_5Rate) : 0;
      const avgGoals = scoringData ? parseFloat(scoringData.avgGoals) : 0;
      
      const over1_5Games = scoringData ? Math.round((over1_5Rate / 100) * scoringData.totalGames) : 0;
      const wilsonOver1_5 = scoringData && scoringData.totalGames > 0 ? calculateWilsonScore(over1_5Games, scoringData.totalGames) * 100 : 0;
      
      const over2_5Games = scoringData ? Math.round((over2_5Rate / 100) * scoringData.totalGames) : 0;
      const wilsonOver2_5 = scoringData && scoringData.totalGames > 0 ? calculateWilsonScore(over2_5Games, scoringData.totalGames) * 100 : 0;

      const teamAnalysis = {
        ...team,
        scoringData,
        teamAnalyticsData,
        isBlacklisted,
        confidence,
        winRate: winRate.toFixed(1),
        wilsonWinRate: wilsonWinRate.toFixed(1),
        over1_5Rate: over1_5Rate.toFixed(1),
        wilsonOver1_5: wilsonOver1_5.toFixed(1),
        over2_5Rate: over2_5Rate.toFixed(1),
        wilsonOver2_5: wilsonOver2_5.toFixed(1),
        totalGames: totalGames,
        avgGoals: avgGoals.toFixed(1)
      };

      // Categorize teams - simplified for team discovery
      if (isBlacklisted) {
        results.avoid.push({
          ...teamAnalysis,
          reason: "Team is blacklisted",
          category: "blacklisted"
        });
      } else if (winRate >= 50 && totalGames >= 3) {
        results.straightWin.push({
          ...teamAnalysis,
          reason: `Good win rate (${winRate.toFixed(1)}%) with ${totalGames} games`,
          category: "straight_win"
        });
      } else if (over1_5Rate >= 60 && totalGames >= 3) {
        results.over1_5.push({
          ...teamAnalysis,
          reason: `Good Over 1.5 rate (${over1_5Rate.toFixed(1)}%) with ${totalGames} games`,
          category: "over_1_5"
        });
      } else if (over2_5Rate >= 50 && totalGames >= 3) {
        results.over2_5.push({
          ...teamAnalysis,
          reason: `Good Over 2.5 rate (${over2_5Rate.toFixed(1)}%) with ${totalGames} games`,
          category: "over_2_5"
        });
      } else if (over1_5Rate >= 100 || over2_5Rate >= 100) {
        // Perfect rates regardless of sample size
        if (over1_5Rate >= 100) {
          results.over1_5.push({
            ...teamAnalysis,
            reason: `Perfect Over 1.5 rate (${over1_5Rate.toFixed(1)}%) with ${totalGames} games`,
            category: "over_1_5"
          });
        }
        if (over2_5Rate >= 100) {
          results.over2_5.push({
            ...teamAnalysis,
            reason: `Perfect Over 2.5 rate (${over2_5Rate.toFixed(1)}%) with ${totalGames} games`,
            category: "over_2_5"
          });
        }
      } else if (totalGames < 3) {
        results.avoid.push({
          ...teamAnalysis,
          reason: `Insufficient data (${totalGames} games)`,
          category: "insufficient_data"
        });
      } else {
        results.avoid.push({
          ...teamAnalysis,
          reason: `Below threshold performance`,
          category: "poor_performance"
        });
      }
    });

    // Sort each category by Wilson Score
    results.straightWin.sort((a, b) => parseFloat(b.wilsonWinRate) - parseFloat(a.wilsonWinRate));
    results.over1_5.sort((a, b) => parseFloat(b.wilsonOver1_5) - parseFloat(a.wilsonOver1_5));
    results.over2_5.sort((a, b) => parseFloat(b.wilsonOver2_5) - parseFloat(a.wilsonOver2_5));

    return results;
  };

  // Handle Google Sheet upload
  const handleUpload = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchSheetData('Sheet7');
      
      if (!data || data.length === 0) {
        throw new Error('No data found in Sheet7');
      }

      // Validate required columns
      const requiredColumns = ['COUNTRY', 'LEAGUE', 'TEAM', 'LOCATION'];
      const actualColumns = data[0] ? Object.keys(data[0]) : [];
      console.log('Actual columns found:', actualColumns);
      console.log('Required columns:', requiredColumns);
      
      const hasAllColumns = requiredColumns.every(col => 
        data[0] && data[0].hasOwnProperty(col)
      );

      if (!hasAllColumns) {
        throw new Error(`Sheet7 must have columns: COUNTRY, LEAGUE, TEAM, LOCATION. Found: ${actualColumns.join(', ')}`);
      }

      setUploadedTeams(data);
      const analysis = analyzeTeams(data);
      setAnalysisResults(analysis);
      
    } catch (err) {
      setError(err.message);
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render team card
  const renderTeamCard = (team, index) => (
    <div key={index} className={`bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors ${
      team.isBlacklisted ? 'border-l-4 border-red-500 bg-red-900/20' : ''
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-medium text-white text-sm">
            {team.TEAM}
            {team.isBlacklisted && (
              <span className="ml-2 px-2 py-1 text-xs font-bold bg-red-600 text-white rounded-full">
                BLACKLISTED
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {team.COUNTRY} - {team.LEAGUE} ({team.LOCATION})
          </div>
        </div>
        <div className={`px-2 py-1 text-xs rounded-full ${team.confidence.bg}`}>
          <span className={team.confidence.color}>{team.confidence.level}</span>
        </div>
      </div>
      
      <div className="text-xs text-gray-300 mb-2">
        {team.reason}
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-400">Games:</span> {team.totalGames}
        </div>
        <div>
          <span className="text-gray-400">Avg Goals:</span> {team.avgGoals}
        </div>
        {team.wilsonWinRate && (
          <div>
            <span className="text-gray-400">Win Rate:</span> {team.winRate}% ({team.wilsonWinRate}% Wilson)
          </div>
        )}
        {team.wilsonOver1_5 && (
          <div>
            <span className="text-gray-400">Over 1.5:</span> {team.over1_5Rate}% ({team.wilsonOver1_5}% Wilson)
          </div>
        )}
        {team.wilsonOver2_5 && (
          <div>
            <span className="text-gray-400">Over 2.5:</span> {team.over2_5Rate}% ({team.wilsonOver2_5}% Wilson)
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Team Upload</h2>
        <p className="text-gray-400">
          Upload teams from Google Sheet and get data-driven recommendations for betting
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Upload Teams</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Analyzing...' : 'Load from Sheet7'}
          </button>
          {uploadedTeams.length > 0 && (
            <span className="text-gray-400">
              {uploadedTeams.length} teams uploaded
            </span>
          )}
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Analysis Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{analysisResults.straightWin.length}</div>
                <div className="text-gray-400">Straight Win</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{analysisResults.over1_5.length}</div>
                <div className="text-gray-400">Over 1.5</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{analysisResults.over2_5.length}</div>
                <div className="text-gray-400">Over 2.5</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{analysisResults.avoid.length}</div>
                <div className="text-gray-400">Avoid</div>
              </div>
            </div>
          </div>

          {/* Straight Win Recommendations */}
          {analysisResults.straightWin.length > 0 && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-300 mb-3 flex items-center">
                🎯 Straight Win Recommendations ({analysisResults.straightWin.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysisResults.straightWin.map((team, index) => renderTeamCard(team, index))}
              </div>
            </div>
          )}

          {/* Over 1.5 Recommendations */}
          {analysisResults.over1_5.length > 0 && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
                ⚽ Over 1.5 Recommendations ({analysisResults.over1_5.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysisResults.over1_5.map((team, index) => renderTeamCard(team, index))}
              </div>
            </div>
          )}

          {/* Over 2.5 Recommendations */}
          {analysisResults.over2_5.length > 0 && (
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-purple-300 mb-3 flex items-center">
                🔥 Over 2.5 Recommendations ({analysisResults.over2_5.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysisResults.over2_5.map((team, index) => renderTeamCard(team, index))}
              </div>
            </div>
          )}

          {/* Teams to Avoid */}
          {analysisResults.avoid.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-red-300 mb-3 flex items-center">
                🚫 Teams to Avoid ({analysisResults.avoid.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysisResults.avoid.map((team, index) => renderTeamCard(team, index))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamUploadTab;
