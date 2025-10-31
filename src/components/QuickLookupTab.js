import React, { useState } from "react";

const QuickLookupTab = ({ teamAnalytics, scoringAnalysis, bets }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  /**
   * Calculate Wilson Score for confidence interval
   */
  const calculateWilsonScore = (successes, total) => {
    if (total === 0) return 0;
    const n = total;
    const p = successes / total;
    const z = 1.96; // 95% confidence
    const denominator = 1 + (z * z) / n;
    const center = (p + (z * z) / (2 * n)) / denominator;
    const margin =
      (z *
        Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) /
      denominator;
    return Math.max(0, Math.min(1, center - margin));
  };

  /**
   * Calculate Wilson rate for Over/Under percentages
   */
  const calculateWilsonRate = (rate, games) => {
    const successes = Math.round((rate / 100) * games);
    return calculateWilsonScore(successes, games) * 100;
  };

  /**
   * Get confidence level based on number of games
   */
  const getConfidenceLevel = (games) => {
    if (games >= 20) return { level: "High", color: "text-green-400" };
    if (games >= 10) return { level: "Medium", color: "text-yellow-400" };
    return { level: "Low", color: "text-red-400" };
  };

  /**
   * Generate recommendations for a team based on historical data
   */
  const generateRecommendations = (teamData, scoringData) => {
    const recommendations = [];

    // Straight Win recommendation
    if (teamData) {
      const winRate = parseFloat(teamData.winRate || 0);
      const wilsonWinRate = parseFloat(teamData.wilsonWinRate || 0);
      const confidence = getConfidenceLevel(teamData.totalBets || 0);

      if (winRate >= 70 || wilsonWinRate >= 65) {
        recommendations.push({
          type: "Straight Win",
          confidence: confidence.level,
          confidenceColor: confidence.color,
          winRate: winRate.toFixed(1),
          wilsonWinRate: wilsonWinRate.toFixed(1),
          games: teamData.totalBets || 0,
          reasoning: `Strong win rate of ${winRate.toFixed(1)}% (${wilsonWinRate.toFixed(1)}% Wilson) based on ${teamData.totalBets || 0} games`,
        });
      } else if (winRate >= 60 || wilsonWinRate >= 55) {
        recommendations.push({
          type: "Straight Win",
          confidence: confidence.level,
          confidenceColor: confidence.color,
          winRate: winRate.toFixed(1),
          wilsonWinRate: wilsonWinRate.toFixed(1),
          games: teamData.totalBets || 0,
          reasoning: `Moderate win rate of ${winRate.toFixed(1)}% (${wilsonWinRate.toFixed(1)}% Wilson) based on ${teamData.totalBets || 0} games`,
        });
      }
    }

    // Over 1.5 recommendation
    if (scoringData) {
      const over1_5Rate = parseFloat(scoringData.over1_5Rate || 0);
      const totalGames = parseInt(scoringData.totalGames || 0);
      const wilsonOver1_5 = calculateWilsonRate(over1_5Rate, totalGames);
      const confidence = getConfidenceLevel(totalGames);

      if (over1_5Rate >= 85 || wilsonOver1_5 >= 80) {
        recommendations.push({
          type: "Over 1.5",
          confidence: confidence.level,
          confidenceColor: confidence.color,
          rate: over1_5Rate.toFixed(1),
          wilsonRate: wilsonOver1_5.toFixed(1),
          games: totalGames,
          reasoning: `Strong Over 1.5 rate of ${over1_5Rate.toFixed(1)}% (${wilsonOver1_5.toFixed(1)}% Wilson) based on ${totalGames} games`,
        });
      } else if (over1_5Rate >= 75 || wilsonOver1_5 >= 70) {
        recommendations.push({
          type: "Over 1.5",
          confidence: confidence.level,
          confidenceColor: confidence.color,
          rate: over1_5Rate.toFixed(1),
          wilsonRate: wilsonOver1_5.toFixed(1),
          games: totalGames,
          reasoning: `Moderate Over 1.5 rate of ${over1_5Rate.toFixed(1)}% (${wilsonOver1_5.toFixed(1)}% Wilson) based on ${totalGames} games`,
        });
      }
    }

    // Over 2.5 recommendation
    if (scoringData) {
      const over2_5Rate = parseFloat(scoringData.over2_5Rate || 0);
      const totalGames = parseInt(scoringData.totalGames || 0);
      const wilsonOver2_5 = calculateWilsonRate(over2_5Rate, totalGames);
      const confidence = getConfidenceLevel(totalGames);

      if (over2_5Rate >= 70 || wilsonOver2_5 >= 65) {
        recommendations.push({
          type: "Over 2.5",
          confidence: confidence.level,
          confidenceColor: confidence.color,
          rate: over2_5Rate.toFixed(1),
          wilsonRate: wilsonOver2_5.toFixed(1),
          games: totalGames,
          reasoning: `Strong Over 2.5 rate of ${over2_5Rate.toFixed(1)}% (${wilsonOver2_5.toFixed(1)}% Wilson) based on ${totalGames} games`,
        });
      } else if (over2_5Rate >= 60 || wilsonOver2_5 >= 55) {
        recommendations.push({
          type: "Over 2.5",
          confidence: confidence.level,
          confidenceColor: confidence.color,
          rate: over2_5Rate.toFixed(1),
          wilsonRate: wilsonOver2_5.toFixed(1),
          games: totalGames,
          reasoning: `Moderate Over 2.5 rate of ${over2_5Rate.toFixed(1)}% (${wilsonOver2_5.toFixed(1)}% Wilson) based on ${totalGames} games`,
        });
      }
    }

    return recommendations;
  };

  /**
   * Search for teams
   */
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();

    // Helper function to check if team name matches search term exactly (no partial matches)
    const matchesSearch = (teamName, searchTerm) => {
      const nameLower = teamName.toLowerCase().trim();
      // Only exact match - this prevents "Real Madrid Women" from matching "real madrid"
      return nameLower === searchTerm;
    };

    // Search in team analytics
    const analyticsMatches = (teamAnalytics || []).filter((team) => {
      const teamName = (team.teamName || team.team || "").toLowerCase();
      return matchesSearch(teamName, searchLower);
    });

    // Search in scoring analysis
    const scoringMatches = (scoringAnalysis || []).filter((team) => {
      const teamName = (team.team || "").toLowerCase();
      return matchesSearch(teamName, searchLower);
    });

    // Also search directly in bets data to find all leagues (teamAnalytics may be filtered to top 100)
    const allLeaguesFromBets = new Map();
    if (bets && Array.isArray(bets)) {
      bets.forEach((bet) => {
        const teamIncluded = (bet.TEAM_INCLUDED || "").toLowerCase();
        const homeTeam = (bet.HOME_TEAM || "").toLowerCase();
        const awayTeam = (bet.AWAY_TEAM || "").toLowerCase();
        const country = bet.COUNTRY || "";
        const league = bet.LEAGUE || "";

        // Check if this bet involves the searched team (in any position) - exact match only
        let matchedTeamName = null;
        const matchesSearchInBets = (name) => {
          const nameLower = name.toLowerCase().trim();
          // Exact match only - prevents "Real Madrid Women" matching "real madrid"
          return nameLower === searchLower;
        };
        
        if (matchesSearchInBets(teamIncluded)) {
          matchedTeamName = bet.TEAM_INCLUDED;
        } else if (matchesSearchInBets(homeTeam)) {
          matchedTeamName = bet.HOME_TEAM;
        } else if (matchesSearchInBets(awayTeam)) {
          matchedTeamName = bet.AWAY_TEAM;
        }

        if (matchedTeamName && country && league) {
          // Use the matched team name (preserve original casing)
          const key = `${matchedTeamName.toLowerCase().trim()}_${country.toLowerCase().trim()}_${league.toLowerCase().trim()}`;
          if (!allLeaguesFromBets.has(key)) {
            allLeaguesFromBets.set(key, {
              teamName: matchedTeamName.trim(),
              country: country.trim(),
              league: league.trim(),
              fromBets: true,
            });
          }
        }
      });
    }

    console.log(`Found ${allLeaguesFromBets.size} unique league combinations in raw bets data`);

    console.log(`Found ${analyticsMatches.length} analytics matches for "${searchTerm}"`);
    console.log(`Found ${scoringMatches.length} scoring matches for "${searchTerm}"`);
    if (analyticsMatches.length > 0) {
      console.log("Analytics matches:", analyticsMatches.map(t => ({
        team: t.teamName || t.team,
        country: t.country,
        league: t.league
      })));
    }
    if (scoringMatches.length > 0) {
      console.log("Scoring matches:", scoringMatches.map(t => ({
        team: t.team || t.teamName,
        country: t.country,
        league: t.league
      })));
    }

    // Group by team name + country + league combination (unique key for each league)
    const teamMap = new Map();

    // First, add ALL analytics matches (each unique team+country+league gets its own entry)
    analyticsMatches.forEach((team) => {
      const teamName = (team.teamName || team.team || "").trim();
      const country = (team.country || "").trim();
      const league = (team.league || "").trim();
      
      // Create unique key: team_country_league (normalize for matching)
      const key = `${teamName.toLowerCase()}_${country.toLowerCase()}_${league.toLowerCase()}`;
      
      console.log(`Analytics: Adding key "${key}" for ${teamName} - ${country} - ${league}`);
      
      if (!teamMap.has(key)) {
        teamMap.set(key, {
          teamName: teamName,
          country: country,
          league: league,
          analytics: team,
          scoring: null,
        });
      } else {
        // Update existing entry with analytics data (shouldn't happen, but just in case)
        console.log(`Analytics: Key "${key}" already exists, updating analytics data`);
        teamMap.get(key).analytics = team;
      }
    });

    // Add all leagues found in raw bets data (even if not in teamAnalytics top 100)
    allLeaguesFromBets.forEach((betInfo, key) => {
      if (!teamMap.has(key)) {
        // This league combination wasn't in teamAnalytics - create entry from bets
        teamMap.set(key, {
          teamName: betInfo.teamName,
          country: betInfo.country,
          league: betInfo.league,
          analytics: null,
          scoring: null,
          fromBets: true,
        });
        console.log(`Bets: Adding key "${key}" for ${betInfo.teamName} - ${betInfo.country} - ${betInfo.league}`);
      }
    });

    // Then, add ALL scoring matches (each unique team+country+league gets its own entry or matches existing)
    scoringMatches.forEach((team) => {
      const teamName = (team.team || "").trim();
      const country = (team.country || "").trim();
      const league = (team.league || "").trim();
      
      // Create unique key: team_country_league (normalize for matching)
      const key = `${teamName.toLowerCase()}_${country.toLowerCase()}_${league.toLowerCase()}`;
      
      console.log(`Scoring: Checking key "${key}" for ${teamName} - ${country} - ${league}`);
      
      if (!teamMap.has(key)) {
        // New league combination - create new entry
        console.log(`Scoring: Key "${key}" is NEW, creating entry`);
        teamMap.set(key, {
          teamName: teamName,
          country: country,
          league: league,
          analytics: null,
          scoring: team,
        });
      } else {
        // Match found - add scoring data to existing entry
        console.log(`Scoring: Key "${key}" exists, adding scoring data`);
        teamMap.get(key).scoring = team;
      }
    });
    
    console.log(`TeamMap size after processing: ${teamMap.size}`);
    console.log("TeamMap keys:", Array.from(teamMap.keys()));

    // Helper function to calculate stats from bets data
    const calculateStatsFromBets = (teamName, country, league) => {
      if (!bets || !Array.isArray(bets)) return null;

      const teamNameLower = teamName.toLowerCase().trim();
      const countryLower = country.toLowerCase().trim();
      const leagueLower = league.toLowerCase().trim();

      // First filter by country and league (strict matching)
      const leagueBets = bets.filter((bet) => {
        const betCountry = (bet.COUNTRY || "").toLowerCase().trim();
        const betLeague = (bet.LEAGUE || "").toLowerCase().trim();
        return betCountry === countryLower && betLeague === leagueLower;
      });

      // Then find bets where this team appears
      const teamBets = leagueBets.filter((bet) => {
        const betTeamIncluded = (bet.TEAM_INCLUDED || "").toLowerCase().trim();
        const betHomeTeam = (bet.HOME_TEAM || "").toLowerCase().trim();
        const betAwayTeam = (bet.AWAY_TEAM || "").toLowerCase().trim();
        
        // Check if team matches in any position (exact match only)
        return (
          betTeamIncluded === teamNameLower ||
          betHomeTeam === teamNameLower ||
          betAwayTeam === teamNameLower
        );
      });

      if (teamBets.length === 0) return null;

      // Deduplicate games (same date + teams = same game)
      const uniqueGames = new Map();
      teamBets.forEach((bet) => {
        const homeTeam = (bet.HOME_TEAM || "").toLowerCase().trim();
        const awayTeam = (bet.AWAY_TEAM || "").toLowerCase().trim();
        const date = bet.DATE || "";
        const gameKey = `${date}_${homeTeam}_${awayTeam}`;
        
        if (!uniqueGames.has(gameKey)) {
          uniqueGames.set(gameKey, bet);
        }
      });

      const deduplicatedBets = Array.from(uniqueGames.values());

      const wins = deduplicatedBets.filter((bet) => bet.RESULT?.toLowerCase().includes("win")).length;
      const losses = deduplicatedBets.filter((bet) => bet.RESULT?.toLowerCase().includes("loss")).length;
      const totalBets = wins + losses;
      const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
      const wilsonWinRate = totalBets > 0 ? calculateWilsonScore(wins, totalBets) * 100 : 0;

      // Calculate Over/Under from games with scores (deduplicated)
      const gamesWithScores = deduplicatedBets.filter(
        (bet) =>
          bet.HOME_SCORE !== null &&
          bet.HOME_SCORE !== undefined &&
          bet.AWAY_SCORE !== null &&
          bet.AWAY_SCORE !== undefined &&
          !isNaN(parseFloat(bet.HOME_SCORE)) &&
          !isNaN(parseFloat(bet.AWAY_SCORE))
      );

      let over1_5Count = 0;
      let over2_5Count = 0;
      let totalGoals = 0;

      gamesWithScores.forEach((bet) => {
        const homeScore = parseFloat(bet.HOME_SCORE || 0);
        const awayScore = parseFloat(bet.AWAY_SCORE || 0);
        const gameTotal = homeScore + awayScore;
        totalGoals += gameTotal;
        if (gameTotal > 1) over1_5Count++;
        if (gameTotal > 2) over2_5Count++;
      });

      const totalGames = gamesWithScores.length;
      const over1_5Rate = totalGames > 0 ? (over1_5Count / totalGames) * 100 : 0;
      const over2_5Rate = totalGames > 0 ? (over2_5Count / totalGames) * 100 : 0;
      const avgGoals = totalGames > 0 ? totalGoals / totalGames : 0;

      // Calculate Home/Away splits
      const homeGames = deduplicatedBets.filter((bet) => {
        const betHomeTeam = (bet.HOME_TEAM || "").toLowerCase().trim();
        return betHomeTeam === teamNameLower;
      });
      const awayGames = deduplicatedBets.filter((bet) => {
        const betAwayTeam = (bet.AWAY_TEAM || "").toLowerCase().trim();
        return betAwayTeam === teamNameLower;
      });

      const homeWins = homeGames.filter((bet) => bet.RESULT?.toLowerCase().includes("win")).length;
      const homeLosses = homeGames.filter((bet) => bet.RESULT?.toLowerCase().includes("loss")).length;
      const homeTotal = homeWins + homeLosses;
      const homeWinRate = homeTotal > 0 ? (homeWins / homeTotal) * 100 : 0;

      const awayWins = awayGames.filter((bet) => bet.RESULT?.toLowerCase().includes("win")).length;
      const awayLosses = awayGames.filter((bet) => bet.RESULT?.toLowerCase().includes("loss")).length;
      const awayTotal = awayWins + awayLosses;
      const awayWinRate = awayTotal > 0 ? (awayWins / awayTotal) * 100 : 0;

      // Calculate average goals from games with scores (for display)
      const avgGoalsDisplay = avgGoals;

      console.log(`calculateStatsFromBets for ${teamName} - ${country} - ${league}:`);
      console.log(`  Filtered to ${leagueBets.length} bets in this league`);
      console.log(`  Found ${teamBets.length} bets with this team`);
      console.log(`  Deduplicated to ${deduplicatedBets.length} unique games`);
      console.log(`  Games with scores: ${totalGames}`);
      console.log(`  Home games: ${homeTotal} (${homeWins}W/${homeLosses}L)`);
      console.log(`  Away games: ${awayTotal} (${awayWins}W/${awayLosses}L)`);

      return {
        totalBets,
        wins,
        losses,
        winRate,
        wilsonWinRate,
        totalGames,
        over1_5Rate,
        over2_5Rate,
        avgGoals: avgGoalsDisplay,
        homeWinRate,
        awayWinRate,
        homeTotal,
        awayTotal,
      };
    };

    // Convert to array, calculate stats from bets if needed, and generate recommendations
    const resultsArray = Array.from(teamMap.values())
      .map((result) => {
        // Always calculate from bets to get home/away splits and ensure we have all stats
        // This supplements analytics/scoring data which might not have home/away breakdown
        let calculatedStats = null;
        if (bets) {
          calculatedStats = calculateStatsFromBets(result.teamName, result.country, result.league);
        }

        const recommendations = generateRecommendations(
          result.analytics || calculatedStats,
          result.scoring || calculatedStats
        );
        
        return {
          ...result,
          calculatedStats, // Store calculated stats for display
          recommendations,
        };
      })
      .sort((a, b) => {
        // Sort by country, then league, then team name
        if (a.country !== b.country) {
          return (a.country || "").localeCompare(b.country || "");
        }
        if (a.league !== b.league) {
          return (a.league || "").localeCompare(b.league || "");
        }
        return (a.teamName || "").localeCompare(b.teamName || "");
      });

    // Group results by team name to create total view
    const teamGroups = new Map();
    resultsArray.forEach((result) => {
      const teamName = result.teamName;
      if (!teamGroups.has(teamName)) {
        teamGroups.set(teamName, []);
      }
      teamGroups.get(teamName).push(result);
    });

    // Create total view for each team and merge with league-specific results
    const finalResults = [];
    teamGroups.forEach((leagueResults, teamName) => {
      if (leagueResults.length === 0) return;

      // Calculate total stats across all leagues
      let totalWins = 0;
      let totalLosses = 0;
      let totalBets = 0;
      let totalGamesWithScores = 0;
      let totalOver1_5Count = 0;
      let totalOver2_5Count = 0;
      let totalGoals = 0;
      let totalHomeWins = 0;
      let totalHomeLosses = 0;
      let totalHomeGames = 0;
      let totalAwayWins = 0;
      let totalAwayLosses = 0;
      let totalAwayGames = 0;

      leagueResults.forEach((result) => {
        if (result.calculatedStats) {
          totalWins += result.calculatedStats.wins || 0;
          totalLosses += result.calculatedStats.losses || 0;
          totalBets += result.calculatedStats.totalBets || 0;
          totalGamesWithScores += result.calculatedStats.totalGames || 0;

          // Calculate Over/Under from calculated stats
          const over1_5Games = Math.round((result.calculatedStats.over1_5Rate / 100) * (result.calculatedStats.totalGames || 0));
          const over2_5Games = Math.round((result.calculatedStats.over2_5Rate / 100) * (result.calculatedStats.totalGames || 0));
          totalOver1_5Count += over1_5Games;
          totalOver2_5Count += over2_5Games;
          totalGoals += (result.calculatedStats.avgGoals || 0) * (result.calculatedStats.totalGames || 0);

          // Home/Away totals - calculate wins from bets directly for accuracy
          // We need to recalculate home/away from bets to get accurate totals
          // For now, use win rate calculation but we'll improve this if needed
          const homeGames = result.calculatedStats.homeTotal || 0;
          const homeWins = Math.round((result.calculatedStats.homeWinRate / 100) * homeGames);
          const homeLosses = homeGames - homeWins;
          
          const awayGames = result.calculatedStats.awayTotal || 0;
          const awayWins = Math.round((result.calculatedStats.awayWinRate / 100) * awayGames);
          const awayLosses = awayGames - awayWins;
          
          totalHomeWins += homeWins;
          totalHomeGames += homeGames;
          totalHomeLosses += homeLosses;
          
          totalAwayWins += awayWins;
          totalAwayGames += awayGames;
          totalAwayLosses += awayLosses;
        } else if (result.analytics) {
          totalWins += result.analytics.wins || 0;
          totalLosses += result.analytics.losses || 0;
          totalBets += result.analytics.totalBets || 0;
        }
      });

      // Create total stats object
      const totalWinRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;
      const totalWilsonWinRate = totalBets > 0 ? calculateWilsonScore(totalWins, totalBets) * 100 : 0;
      const totalOver1_5Rate = totalGamesWithScores > 0 ? (totalOver1_5Count / totalGamesWithScores) * 100 : 0;
      const totalOver2_5Rate = totalGamesWithScores > 0 ? (totalOver2_5Count / totalGamesWithScores) * 100 : 0;
      const totalAvgGoals = totalGamesWithScores > 0 ? totalGoals / totalGamesWithScores : 0;
      const totalHomeWinRate = totalHomeGames > 0 ? (totalHomeWins / totalHomeGames) * 100 : 0;
      const totalAwayWinRate = totalAwayGames > 0 ? (totalAwayWins / totalAwayGames) * 100 : 0;

      const totalStats = {
        teamName,
        isTotalView: true,
        leagues: leagueResults.map(r => `${r.country} - ${r.league}`).join(", "),
        calculatedStats: {
          wins: totalWins,
          losses: totalLosses,
          totalBets,
          winRate: totalWinRate,
          wilsonWinRate: totalWilsonWinRate,
          totalGames: totalGamesWithScores,
          over1_5Rate: totalOver1_5Rate,
          over2_5Rate: totalOver2_5Rate,
          avgGoals: totalAvgGoals,
          homeWinRate: totalHomeWinRate,
          awayWinRate: totalAwayWinRate,
          homeTotal: totalHomeGames,
          awayTotal: totalAwayGames,
        },
      };

      // Add total view first, then league-specific results
      finalResults.push(totalStats);
      finalResults.push(...leagueResults);
    });

    console.log(`Total unique league combinations found: ${finalResults.length}`);
    console.log("Results:", finalResults.map(r => r.isTotalView ? `TOTAL: ${r.teamName}` : `${r.teamName} - ${r.country} - ${r.league}`));

    setSearchResults(finalResults);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Quick Team Lookup</h2>
        <p className="text-gray-400 mb-4">
          Search for a team to view complete performance overview and historical statistics
        </p>

        {/* Search Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter team name..."
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3982db] focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-[#3982db] text-white rounded-lg hover:bg-[#2d6fc7] transition-colors font-semibold"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className={`backdrop-blur-sm rounded-lg p-6 ${
                result.isTotalView
                  ? "bg-[#3982db]/20 border-2 border-[#3982db]"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              {/* Team Header */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">
                  {result.teamName}
                </h3>
                {result.isTotalView ? (
                  <p className="text-gray-400 text-sm">
                    Total View - All Leagues ({result.leagues})
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm">
                    {result.country} - {result.league}
                  </p>
                )}
              </div>

              {/* Performance Overview */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Performance Overview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Win Rate */}
                  {(result.analytics || result.calculatedStats) && (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Win Rate</p>
                        <p className="text-white font-semibold text-lg">
                          {((result.analytics?.winRate || result.calculatedStats?.winRate) || 0).toFixed(1)}%
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          ({(result.analytics?.wilsonWinRate || result.calculatedStats?.wilsonWinRate || 0).toFixed(1)}% Wilson)
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Total Games</p>
                        <p className="text-white font-semibold text-lg">
                          {result.analytics?.totalBets || result.calculatedStats?.totalBets || 0}
                        </p>
                        {(result.analytics || result.calculatedStats) && (
                          <p className="text-gray-500 text-xs mt-1">
                            {result.analytics?.wins || result.calculatedStats?.wins || 0}W / {result.analytics?.losses || result.calculatedStats?.losses || 0}L
                          </p>
                        )}
                      </div>
                    </>
                  )}
                  
                  {/* Home/Away Win Rates - Always show if calculated stats available */}
                  {result.calculatedStats && (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Home Win %</p>
                        <p className="text-white font-semibold text-lg">
                          {(result.calculatedStats?.homeWinRate || 0).toFixed(1)}%
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {result.calculatedStats?.homeTotal || 0} games
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Away Win %</p>
                        <p className="text-white font-semibold text-lg">
                          {(result.calculatedStats?.awayWinRate || 0).toFixed(1)}%
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {result.calculatedStats?.awayTotal || 0} games
                        </p>
                      </div>
                    </>
                  )}
                  
                  {/* Over/Under Stats */}
                  {(result.scoring || result.calculatedStats) && (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Over 1.5</p>
                        <p className="text-white font-semibold text-lg">
                          {parseFloat(result.scoring?.over1_5Rate || result.calculatedStats?.over1_5Rate || 0).toFixed(1)}%
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {result.scoring?.totalGames || result.calculatedStats?.totalGames || 0} games
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Over 2.5</p>
                        <p className="text-white font-semibold text-lg">
                          {parseFloat(result.scoring?.over2_5Rate || result.calculatedStats?.over2_5Rate || 0).toFixed(1)}%
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {result.scoring?.totalGames || result.calculatedStats?.totalGames || 0} games
                        </p>
                      </div>
                    </>
                  )}

                  {/* Average Goals */}
                  {(result.scoring || result.calculatedStats) && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Avg Goals</p>
                      <p className="text-white font-semibold text-lg">
                        {parseFloat(result.scoring?.avgGoals || result.calculatedStats?.avgGoals || 0).toFixed(2)}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Per game
                      </p>
                    </div>
                  )}
                  
                  {/* Show message if no data available */}
                  {!result.analytics && !result.scoring && !result.calculatedStats && (
                    <div className="col-span-full bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                      <p className="text-yellow-300 text-sm">
                        Limited data available for this team/league combination. Historical data may be incomplete.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {searchResults.length === 0 && searchTerm && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 text-center">
          <p className="text-gray-400">No teams found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default QuickLookupTab;

