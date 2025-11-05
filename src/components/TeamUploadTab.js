import React, { useState, useEffect } from 'react';
import { fetchSheetData } from '../utils/fetchSheetData';

const TeamUploadTab = ({ 
  scoringAnalysis = [], 
  teamAnalytics = [], 
  blacklistedTeams = [],
  isTeamBlacklisted,
  bets = [],
  analyzeScoringPatterns
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

  // Find team data in scoring analysis or calculate from bets
  const findScoringData = (teamName, country, league) => {
    // First try to find in pre-calculated scoring analysis
    if (scoringAnalysis && Array.isArray(scoringAnalysis) && scoringAnalysis.length > 0) {
      const normalizedTeamName = teamName.toLowerCase().trim();
      const normalizedCountry = country.toLowerCase().trim();
      const normalizedLeague = league.toLowerCase().trim();

      const found = scoringAnalysis.find(stat => {
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
      
      if (found) return found;
    }
    
    // If not found in scoring analysis, calculate from bets data
    if (bets && Array.isArray(bets)) {
      const normalizedTeamName = teamName.toLowerCase().trim();
      const normalizedCountry = country.toLowerCase().trim();
      const normalizedLeague = league.toLowerCase().trim();

      const teamBets = bets.filter(bet => {
        const betTeam = (bet.TEAM || bet.team || '').toLowerCase().trim();
        const betCountry = (bet.COUNTRY || bet.country || '').toLowerCase().trim();
        const betLeague = (bet.LEAGUE || bet.league || '').toLowerCase().trim();

        return (
          betTeam.includes(normalizedTeamName) ||
          normalizedTeamName.includes(betTeam)
        ) && (
          betCountry.includes(normalizedCountry) ||
          normalizedCountry.includes(betCountry)
        ) && (
          betLeague.includes(normalizedLeague) ||
          normalizedLeague.includes(betLeague)
        );
      });

      if (teamBets.length === 0) return null;

      // Calculate scoring stats from bets (same logic as ScoringAnalysisTab)
      const totalGames = teamBets.length;
      
      // Debug: Check what fields are available in the betting data
      if (teamBets.length > 0) {
        console.log(`Sample bet data for ${teamName}:`, Object.keys(teamBets[0]));
        console.log(`Sample bet:`, teamBets[0]);
      }
      
      const over1_5Games = teamBets.filter(bet => {
        const totalGoals = parseFloat(bet.TOTAL_GOALS || bet.totalGoals || bet.TOTAL_GOAL || bet.total_goals || 0);
        return totalGoals > 1.5;
      }).length;
      const over2_5Games = teamBets.filter(bet => {
        const totalGoals = parseFloat(bet.TOTAL_GOALS || bet.totalGoals || bet.TOTAL_GOAL || bet.total_goals || 0);
        return totalGoals > 2.5;
      }).length;
      const over3_5Games = teamBets.filter(bet => {
        const totalGoals = parseFloat(bet.TOTAL_GOALS || bet.totalGoals || bet.TOTAL_GOAL || bet.total_goals || 0);
        return totalGoals > 3.5;
      }).length;

      const totalGoals = teamBets.reduce((sum, bet) => {
        return sum + parseFloat(bet.TOTAL_GOALS || bet.totalGoals || bet.TOTAL_GOAL || bet.total_goals || 0);
      }, 0);

      return {
        team: teamName,
        country: country,
        league: league,
        totalGames: totalGames,
        over1_5Rate: totalGames > 0 ? ((over1_5Games / totalGames) * 100).toFixed(1) : '0.0',
        over2_5Rate: totalGames > 0 ? ((over2_5Games / totalGames) * 100).toFixed(1) : '0.0',
        over3_5Rate: totalGames > 0 ? ((over3_5Games / totalGames) * 100).toFixed(1) : '0.0',
        avgGoals: totalGames > 0 ? (totalGoals / totalGames).toFixed(1) : '0.0'
      };
    }
    
    return null;
  };

  // Find team data in team analytics
  const findTeamAnalyticsData = (teamName, country, league) => {
    if (!teamAnalytics || !Array.isArray(teamAnalytics)) {
      return null;
    }
    
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

  // Find team data in main bets data
  const findBetsData = (teamName, country, league) => {
    if (!bets || !Array.isArray(bets)) {
      console.log(`Bets data not available: ${!bets ? 'bets is null/undefined' : 'not an array'}`);
      return null;
    }
    
    const normalizedTeamName = teamName.toLowerCase().trim();
    const normalizedCountry = country.toLowerCase().trim();
    const normalizedLeague = league.toLowerCase().trim();

    console.log(`Looking for: "${normalizedTeamName}" | "${normalizedCountry}" | "${normalizedLeague}"`);

    // Show some sample team names from bets for Wales
    const walesBets = bets.filter(bet => {
      const betCountry = (bet.COUNTRY || bet.country || '').toLowerCase().trim();
      return betCountry.includes('wales') || betCountry.includes('cymru');
    });
    
    if (walesBets.length > 0) {
      console.log(`Wales teams in bets: ${walesBets.slice(0, 3).map(bet => bet.TEAM || bet.team || bet.TEAM_INCLUDED || bet.team_included).join(', ')}`);
    }

    // Check both TEAM_INCLUDED and HOME_TEAM/AWAY_TEAM for matching
    const teamBets = bets.filter(bet => {
      const betTeam = (bet.TEAM_INCLUDED || bet.team_included || bet.TEAM || bet.team || '').toLowerCase().trim();
      const betHomeTeam = (bet.HOME_TEAM || bet.home_team || '').toLowerCase().trim();
      const betAwayTeam = (bet.AWAY_TEAM || bet.away_team || '').toLowerCase().trim();
      const betCountry = (bet.COUNTRY || bet.country || '').toLowerCase().trim();
      const betLeague = (bet.LEAGUE || bet.league || '').toLowerCase().trim();

      const teamMatches = (
        betTeam.includes(normalizedTeamName) ||
        normalizedTeamName.includes(betTeam) ||
        betHomeTeam.includes(normalizedTeamName) ||
        normalizedTeamName.includes(betHomeTeam) ||
        betAwayTeam.includes(normalizedTeamName) ||
        normalizedTeamName.includes(betAwayTeam)
      );

      return teamMatches && (
        betCountry.includes(normalizedCountry) ||
        normalizedCountry.includes(betCountry)
      ) && (
        betLeague.includes(normalizedLeague) ||
        normalizedLeague.includes(betLeague)
      );
    });

    console.log(`Found ${teamBets.length} matching bets for ${teamName}`);
    if (teamBets.length === 0) return null;

    // Calculate basic stats from bets
    const wins = teamBets.filter(bet => {
      const result = (bet.RESULT || bet.result || '').toUpperCase();
      return result === 'W' || result.includes('WIN');
    }).length;
    
    const losses = teamBets.filter(bet => {
      const result = (bet.RESULT || bet.result || '').toUpperCase();
      return result === 'L' || result.includes('LOSS');
    }).length;
    
    // Calculate draws (when HOME_SCORE === AWAY_SCORE or RESULT === 'D')
    const draws = teamBets.filter(bet => {
      const homeScore = parseFloat(bet.HOME_SCORE || bet.home_score || 0);
      const awayScore = parseFloat(bet.AWAY_SCORE || bet.away_score || 0);
      const result = (bet.RESULT || bet.result || '').toUpperCase();
      return (homeScore === awayScore && homeScore > 0) || result === 'D' || result.includes('DRAW');
    }).length;
    
    const totalBets = wins + losses + draws;

    // Calculate double chance stats
    // For each bet, determine if team was home or away based on HOME_TEAM/AWAY_TEAM
    const homeBets = teamBets.filter(bet => {
      const betHomeTeam = (bet.HOME_TEAM || bet.home_team || '').toLowerCase().trim();
      return betHomeTeam.includes(normalizedTeamName) || normalizedTeamName.includes(betHomeTeam);
    });

    const awayBets = teamBets.filter(bet => {
      const betAwayTeam = (bet.AWAY_TEAM || bet.away_team || '').toLowerCase().trim();
      return betAwayTeam.includes(normalizedTeamName) || normalizedTeamName.includes(betAwayTeam);
    });

    // Calculate 1X (home win or draw) for home games
    const homeWins = homeBets.filter(bet => {
      const homeScore = parseFloat(bet.HOME_SCORE || bet.home_score || 0);
      const awayScore = parseFloat(bet.AWAY_SCORE || bet.away_score || 0);
      // Home team wins if homeScore > awayScore and scores are valid
      return homeScore > awayScore && homeScore > 0;
    }).length;
    
    const homeDraws = homeBets.filter(bet => {
      const homeScore = parseFloat(bet.HOME_SCORE || bet.home_score || 0);
      const awayScore = parseFloat(bet.AWAY_SCORE || bet.away_score || 0);
      const result = (bet.RESULT || bet.result || '').toUpperCase();
      return (homeScore === awayScore && homeScore > 0) || result === 'D' || result.includes('DRAW');
    }).length;
    
    const doubleChance1X = homeBets.length > 0 ? ((homeWins + homeDraws) / homeBets.length) * 100 : 0;

    // Calculate X2 (draw or away win) for away games
    const awayWins = awayBets.filter(bet => {
      const homeScore = parseFloat(bet.HOME_SCORE || bet.home_score || 0);
      const awayScore = parseFloat(bet.AWAY_SCORE || bet.away_score || 0);
      // Away team wins if awayScore > homeScore and scores are valid
      return awayScore > homeScore && awayScore > 0;
    }).length;
    
    const awayDraws = awayBets.filter(bet => {
      const homeScore = parseFloat(bet.HOME_SCORE || bet.home_score || 0);
      const awayScore = parseFloat(bet.AWAY_SCORE || bet.away_score || 0);
      const result = (bet.RESULT || bet.result || '').toUpperCase();
      return (homeScore === awayScore && homeScore > 0) || result === 'D' || result.includes('DRAW');
    }).length;
    
    const doubleChanceX2 = awayBets.length > 0 ? ((awayWins + awayDraws) / awayBets.length) * 100 : 0;

    // Overall double chance (wins + draws / total)
    const doubleChanceOverall = totalBets > 0 ? ((wins + draws) / totalBets) * 100 : 0;

    return {
      teamName: teamName,
      country: country,
      league: league,
      totalBets: totalBets,
      wins: wins,
      losses: losses,
      draws: draws,
      doubleChance1X: homeBets.length > 0 ? doubleChance1X : doubleChanceOverall, // Use overall if no home games
      doubleChanceX2: awayBets.length > 0 ? doubleChanceX2 : doubleChanceOverall, // Use overall if no away games
      doubleChanceOverall: doubleChanceOverall,
      bets: teamBets
    };
  };

  // Analyze uploaded teams
  const analyzeTeams = async (teams) => {
    const results = {
      straightWin: [],
      over1_5: [],
      doubleChance: [],
      avoid: []
    };

    // Get fresh scoring data using the same function as Scoring Analysis tab
    let freshScoringData = [];
    if (analyzeScoringPatterns) {
      try {
        freshScoringData = await analyzeScoringPatterns();
        console.log(`Fresh scoring data loaded: ${freshScoringData.length} teams`);
      } catch (error) {
        console.error('Error loading scoring data:', error);
      }
    }

    teams.forEach(team => {
      console.log(`=== Analyzing team: ${team.TEAM} (${team.COUNTRY} - ${team.LEAGUE}) ===`);
      
      // Try to find in fresh scoring data first, then fallback to other sources
      let scoringData = null;
      if (freshScoringData && freshScoringData.length > 0) {
        scoringData = freshScoringData.find(stat => {
          const statTeam = stat.team.toLowerCase().trim();
          const statCountry = stat.country.toLowerCase().trim();
          const statLeague = stat.league.toLowerCase().trim();
          const teamName = team.TEAM.toLowerCase().trim();
          const country = team.COUNTRY.toLowerCase().trim();
          const league = team.LEAGUE.toLowerCase().trim();

          return (
            statTeam.includes(teamName) || teamName.includes(statTeam)
          ) && (
            statCountry.includes(country) || country.includes(statCountry)
          ) && (
            statLeague.includes(league) || league.includes(statLeague)
          );
        });
      }
      
      // Fallback to other methods if not found in fresh data
      if (!scoringData) {
        scoringData = findScoringData(team.TEAM, team.COUNTRY, team.LEAGUE);
      }
      
      const teamAnalyticsData = findTeamAnalyticsData(team.TEAM, team.COUNTRY, team.LEAGUE);
      const betsData = findBetsData(team.TEAM, team.COUNTRY, team.LEAGUE);
      
      console.log(`Scoring data found: ${scoringData ? 'YES' : 'NO'}`);
      console.log(`Team analytics data found: ${teamAnalyticsData ? 'YES' : 'NO'}`);
      console.log(`Bets data found: ${betsData ? 'YES' : 'NO'}`);
      
      if (!scoringData && !teamAnalyticsData && !betsData) {
        // No data found - add to avoid list
        console.log(`No data found for ${team.TEAM}`);
        results.avoid.push({
          ...team,
          reason: "No historical data found",
          confidence: "N/A"
        });
        return;
      }

      const isBlacklisted = isTeamBlacklisted ? isTeamBlacklisted(scoringData?.team || teamAnalyticsData?.teamName || betsData?.teamName) : false;
      const totalGames = scoringData?.totalGames || teamAnalyticsData?.totalBets || betsData?.totalBets || 0;
      const confidence = getConfidenceLevel(totalGames);
      
      // Get win rate from team analytics or bets data
      const wins = teamAnalyticsData?.wins || betsData?.wins || 0;
      const losses = teamAnalyticsData?.losses || betsData?.losses || 0;
      const draws = betsData?.draws || 0;
      const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
      const wilsonWinRate = (wins + losses) > 0 ? calculateWilsonScore(wins, wins + losses) * 100 : 0;
      
      // Get Over/Under data from scoring analysis (now calculated from bets if needed)
      const over1_5Rate = scoringData ? parseFloat(scoringData.over1_5Rate) : 0;
      const over2_5Rate = scoringData ? parseFloat(scoringData.over2_5Rate) : 0;
      const avgGoals = scoringData ? parseFloat(scoringData.avgGoals) : 0;
      
      // Calculate Wilson scores for Over/Under rates
      const over1_5Games = Math.round((over1_5Rate / 100) * totalGames);
      const wilsonOver1_5 = totalGames > 0 ? calculateWilsonScore(over1_5Games, totalGames) * 100 : 0;
      
      const over2_5Games = Math.round((over2_5Rate / 100) * totalGames);
      const wilsonOver2_5 = totalGames > 0 ? calculateWilsonScore(over2_5Games, totalGames) * 100 : 0;

      // Get double chance data from bets data
      const doubleChanceOverall = betsData?.doubleChanceOverall || 0;
      const doubleChance1X = betsData?.doubleChance1X || doubleChanceOverall;
      const doubleChanceX2 = betsData?.doubleChanceX2 || doubleChanceOverall;
      
      // Calculate Wilson scores for double chance
      const doubleChanceSuccesses = Math.round((doubleChanceOverall / 100) * totalGames);
      const wilsonDoubleChance = totalGames > 0 ? calculateWilsonScore(doubleChanceSuccesses, totalGames) * 100 : 0;

      console.log(`Team ${team.TEAM}: Win Rate: ${winRate.toFixed(1)}%, Over 1.5: ${over1_5Rate.toFixed(1)}%, Over 2.5: ${over2_5Rate.toFixed(1)}%, Double Chance: ${doubleChanceOverall.toFixed(1)}%, Avg Goals: ${avgGoals.toFixed(1)}, Total Games: ${totalGames}`);

      // Determine all categories this team qualifies for
      const qualifyingCategories = [];
      
      if (winRate >= 50 && totalGames >= 3) {
        qualifyingCategories.push('straightWin');
      }
      if (over1_5Rate >= 60 && totalGames >= 3) {
        qualifyingCategories.push('over1_5');
      }
      if (doubleChanceOverall >= 70 && totalGames >= 3) {
        qualifyingCategories.push('doubleChance');
      }
      
      // Check for perfect rates (regardless of sample size)
      if (over1_5Rate >= 100 && !qualifyingCategories.includes('over1_5')) {
        qualifyingCategories.push('over1_5');
      }
      if (doubleChanceOverall >= 100 && !qualifyingCategories.includes('doubleChance')) {
        qualifyingCategories.push('doubleChance');
      }

      // Determine primary category (priority order: straightWin > over1_5 > doubleChance)
      let primaryCategory = null;
      let primaryReason = '';
      
      if (isBlacklisted) {
        primaryCategory = 'avoid';
        primaryReason = "Team is blacklisted";
      } else if (qualifyingCategories.length > 0) {
        // Use priority order to determine primary category
        if (qualifyingCategories.includes('straightWin')) {
          primaryCategory = 'straightWin';
          primaryReason = `Good win rate (${winRate.toFixed(1)}%) with ${totalGames} games`;
        } else if (qualifyingCategories.includes('over1_5')) {
          primaryCategory = 'over1_5';
          primaryReason = over1_5Rate >= 100 
            ? `Perfect Over 1.5 rate (${over1_5Rate.toFixed(1)}%) with ${totalGames} games`
            : `Good Over 1.5 rate (${over1_5Rate.toFixed(1)}%) with ${totalGames} games`;
        } else if (qualifyingCategories.includes('doubleChance')) {
          primaryCategory = 'doubleChance';
          primaryReason = doubleChanceOverall >= 100
            ? `Perfect Double Chance rate (${doubleChanceOverall.toFixed(1)}%) with ${totalGames} games`
            : `Good Double Chance rate (${doubleChanceOverall.toFixed(1)}%) with ${totalGames} games`;
        }
      } else if (totalGames < 3) {
        primaryCategory = 'avoid';
        primaryReason = `Insufficient data (${totalGames} games)`;
      } else {
        primaryCategory = 'avoid';
        primaryReason = `Below threshold performance`;
      }

      // Get other categories (excluding primary and over2_5)
      const otherCategories = qualifyingCategories.filter(cat => cat !== primaryCategory && cat !== 'over2_5');

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
        doubleChanceOverall: doubleChanceOverall.toFixed(1),
        doubleChance1X: doubleChance1X.toFixed(1),
        doubleChanceX2: doubleChanceX2.toFixed(1),
        wilsonDoubleChance: wilsonDoubleChance.toFixed(1),
        draws: draws,
        totalGames: totalGames,
        avgGoals: avgGoals.toFixed(1),
        primaryCategory: primaryCategory,
        otherCategories: otherCategories,
        allCategories: qualifyingCategories
      };

      // Add team to only its primary category
      results[primaryCategory].push({
        ...teamAnalysis,
        reason: primaryReason,
        category: primaryCategory
      });
    });

    // Sort each category by Wilson Score
    results.straightWin.sort((a, b) => parseFloat(b.wilsonWinRate) - parseFloat(a.wilsonWinRate));
    results.over1_5.sort((a, b) => parseFloat(b.wilsonOver1_5) - parseFloat(a.wilsonOver1_5));
    results.doubleChance.sort((a, b) => parseFloat(b.wilsonDoubleChance) - parseFloat(a.wilsonDoubleChance));

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
      const analysis = await analyzeTeams(data);
      setAnalysisResults(analysis);
      
    } catch (err) {
      setError(err.message);
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get badge styling for category
  const getCategoryBadge = (category) => {
    const badges = {
      'straightWin': { label: 'Win', color: 'bg-green-600', textColor: 'text-white' },
      'over1_5': { label: 'O1.5', color: 'bg-blue-600', textColor: 'text-white' },
      'doubleChance': { label: 'DC', color: 'bg-yellow-600', textColor: 'text-white' }
    };
    return badges[category] || { label: category, color: 'bg-gray-600', textColor: 'text-white' };
  };

  // Render team card
  const renderTeamCard = (team, index) => (
    <div key={index} className={`bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors ${
      team.isBlacklisted ? 'border-l-4 border-red-500 bg-red-900/20' : ''
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="font-medium text-white text-sm flex items-center gap-2 flex-wrap">
            {team.TEAM}
            {team.isBlacklisted && (
              <span className="px-2 py-1 text-xs font-bold bg-red-600 text-white rounded-full">
                BLACKLISTED
              </span>
            )}
            {/* Show badges for other categories */}
            {team.otherCategories && team.otherCategories.filter(cat => cat !== 'over2_5').length > 0 && (
              <>
                {team.otherCategories.filter(cat => cat !== 'over2_5').map((cat, idx) => {
                  const badge = getCategoryBadge(cat);
                  return (
                    <span 
                      key={idx} 
                      className={`px-2 py-1 text-xs font-semibold ${badge.color} ${badge.textColor} rounded-full`}
                      title={`Also qualifies for ${badge.label}`}
                    >
                      {badge.label}
                    </span>
                  );
                })}
              </>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
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
          <span className="text-gray-400">Games:</span> <span className="text-gray-300">{team.totalGames}</span>
        </div>
        <div>
          <span className="text-gray-400">Avg Goals:</span> <span className="text-gray-300">{team.avgGoals}</span>
        </div>
        {team.wilsonWinRate && (
          <div>
            <span className="text-gray-400">Win Rate:</span> <span className="text-gray-300">{team.winRate}% ({team.wilsonWinRate}% Wilson)</span>
          </div>
        )}
        {team.wilsonOver1_5 && (
          <div>
            <span className="text-gray-400">Over 1.5:</span> <span className="text-gray-300">{team.over1_5Rate}% ({team.wilsonOver1_5}% Wilson)</span>
          </div>
        )}
        {team.wilsonDoubleChance && (
          <div>
            <span className="text-gray-400">Double Chance:</span> <span className="text-gray-300">{team.doubleChanceOverall}% ({team.wilsonDoubleChance}% Wilson)</span>
          </div>
        )}
        {team.doubleChance1X && team.doubleChance1X !== team.doubleChanceOverall && (
          <div>
            <span className="text-gray-400">1X (Home):</span> <span className="text-gray-300">{team.doubleChance1X}%</span>
          </div>
        )}
        {team.doubleChanceX2 && team.doubleChanceX2 !== team.doubleChanceOverall && (
          <div>
            <span className="text-gray-400">X2 (Away):</span> <span className="text-gray-300">{team.doubleChanceX2}%</span>
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
                <div className="text-2xl font-bold text-yellow-400">{analysisResults.doubleChance.length}</div>
                <div className="text-gray-400">Double Chance</div>
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

          {/* Double Chance Recommendations */}
          {analysisResults.doubleChance.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center">
                🎲 Double Chance Recommendations ({analysisResults.doubleChance.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysisResults.doubleChance.map((team, index) => renderTeamCard(team, index))}
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
