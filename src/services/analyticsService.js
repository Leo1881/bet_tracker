/**
 * Analytics Service
 * Handles analytics functions for league, country, and team performance analysis
 */

/**
 * Get league analytics from betting data
 * @param {Array} deduplicatedBets - Array of deduplicated bets
 * @returns {Array} Array of league analytics data
 */
export const getLeagueAnalytics = (deduplicatedBets) => {
  const leagues = {};
  deduplicatedBets.forEach((bet) => {
    const leagueName = bet.LEAGUE;
    const countryName = bet.COUNTRY;
    if (!leagueName) return;

    // Skip header row data
    const lowerLeagueName = leagueName.toLowerCase();
    if (lowerLeagueName === "league" || lowerLeagueName === "leagues") {
      return;
    }

    // Create a unique key combining league and country
    const leagueKey = `${leagueName} (${countryName || "Unknown"})`;

    if (!leagues[leagueKey]) {
      leagues[leagueKey] = {
        league: leagueName,
        country: countryName || "Unknown",
        wins: 0,
        losses: 0,
        pending: 0,
        totalOdds: 0,
        betCount: 0,
      };
    }

    if (bet.RESULT?.toLowerCase().includes("win")) leagues[leagueKey].wins++;
    else if (bet.RESULT?.toLowerCase().includes("loss"))
      leagues[leagueKey].losses++;
    else if (bet.RESULT?.toLowerCase().includes("pending"))
      leagues[leagueKey].pending++;

    // Calculate average odds
    const odds1 = parseFloat(bet.ODDS_1) || 0;
    const odds2 = parseFloat(bet.ODDS_2) || 0;
    const oddsX = parseFloat(bet.ODDS_X) || 0;
    if (odds1 > 0 || odds2 > 0 || oddsX > 0) {
      const validOdds = [odds1, odds2, oddsX].filter((odds) => odds > 0);
      leagues[leagueKey].totalOdds +=
        validOdds.reduce((sum, odds) => sum + odds, 0) / validOdds.length;
      leagues[leagueKey].betCount++;
    }
  });

  return Object.entries(leagues)
    .map(([leagueKey, stats]) => ({
      league: stats.league,
      country: stats.country,
      leagueDisplay: leagueKey, // Full display name
      ...stats,
      total: stats.wins + stats.losses + stats.pending,
      winRate:
        stats.wins + stats.losses > 0
          ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
          : 0,
      avgOdds:
        stats.betCount > 0 ? (stats.totalOdds / stats.betCount).toFixed(2) : 0,
    }))
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
};

/**
 * Get country analytics from betting data
 * @param {Array} deduplicatedBets - Array of deduplicated bets
 * @returns {Array} Array of country analytics data
 */
export const getCountryAnalytics = (deduplicatedBets) => {
  const countries = {};
  deduplicatedBets.forEach((bet) => {
    const countryName = bet.COUNTRY;
    if (!countryName) return;

    // Skip header row data
    const lowerCountryName = countryName.toLowerCase();
    if (lowerCountryName === "country" || lowerCountryName === "countries") {
      return;
    }

    if (!countries[countryName]) {
      countries[countryName] = {
        wins: 0,
        losses: 0,
        pending: 0,
        totalOdds: 0,
        betCount: 0,
      };
    }

    if (bet.RESULT?.toLowerCase().includes("win"))
      countries[countryName].wins++;
    else if (bet.RESULT?.toLowerCase().includes("loss"))
      countries[countryName].losses++;
    else if (bet.RESULT?.toLowerCase().includes("pending"))
      countries[countryName].pending++;

    // Calculate average odds
    const odds1 = parseFloat(bet.ODDS_1) || 0;
    const odds2 = parseFloat(bet.ODDS_2) || 0;
    const oddsX = parseFloat(bet.ODDS_X) || 0;
    if (odds1 > 0 || odds2 > 0 || oddsX > 0) {
      const validOdds = [odds1, odds2, oddsX].filter((odds) => odds > 0);
      countries[countryName].totalOdds +=
        validOdds.reduce((sum, odds) => sum + odds, 0) / validOdds.length;
      countries[countryName].betCount++;
    }
  });

  return Object.entries(countries)
    .map(([country, stats]) => ({
      country,
      ...stats,
      total: stats.wins + stats.losses + stats.pending,
      winRate:
        stats.wins + stats.losses > 0
          ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
          : 0,
      avgOdds:
        stats.betCount > 0 ? (stats.totalOdds / stats.betCount).toFixed(2) : 0,
    }))
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
};

/**
 * Get best performers across leagues and countries
 * @param {Array} leagueAnalytics - Array of league analytics data
 * @param {Array} countryAnalytics - Array of country analytics data
 * @returns {Object} Object containing best and worst performers
 */
export const getBestPerformers = (leagueAnalytics, countryAnalytics) => {
  // Define major leagues for priority consideration
  const majorLeagues = [
    "Premier League",
    "La Liga",
    "Bundesliga",
    "Serie A",
    "Ligue 1",
    "Champions League",
    "Europa League",
    "Conference League",
  ];

  // Find best league - prioritize major leagues with good performance
  const bestLeague =
    leagueAnalytics
      .filter((league) => league.total >= 3) // Minimum 3 bets for "best" consideration
      .sort((a, b) => {
        // Check if leagues are major leagues
        const aIsMajor = majorLeagues.some((major) =>
          a.league.toLowerCase().includes(major.toLowerCase())
        );
        const bIsMajor = majorLeagues.some((major) =>
          b.league.toLowerCase().includes(major.toLowerCase())
        );

        // Major leagues get priority if they have decent win rates
        if (aIsMajor && !bIsMajor && parseFloat(a.winRate) >= 50) return -1;
        if (!aIsMajor && bIsMajor && parseFloat(b.winRate) >= 50) return 1;

        // If both are major or both are minor, sort by win rate
        const winRateDiff = parseFloat(b.winRate) - parseFloat(a.winRate);
        if (Math.abs(winRateDiff) > 5) return winRateDiff;

        // If win rates are close, prefer major leagues, then more bets
        if (aIsMajor && !bIsMajor) return -1;
        if (!aIsMajor && bIsMajor) return 1;
        return b.total - a.total;
      })[0] ||
    leagueAnalytics[0] ||
    {};

  // Find worst league - prioritize leagues with poor performance and enough bets
  const worstLeague =
    leagueAnalytics
      .filter((league) => league.total >= 3) // Minimum 3 bets for "worst" consideration
      .sort((a, b) => {
        // Sort by win rate (ascending - lowest first)
        const winRateDiff = parseFloat(a.winRate) - parseFloat(b.winRate);
        if (Math.abs(winRateDiff) > 5) return winRateDiff;

        // If win rates are close, prefer leagues with more bets (more significant)
        return b.total - a.total;
      })[0] ||
    leagueAnalytics[leagueAnalytics.length - 1] ||
    {};

  // Find best country - prioritize countries with consistent performance across multiple leagues
  const bestCountry =
    countryAnalytics
      .filter((country) => country.total >= 5) // Higher threshold for countries (more bets needed)
      .sort((a, b) => {
        // First sort by win rate (descending)
        const winRateDiff = parseFloat(b.winRate) - parseFloat(a.winRate);
        if (Math.abs(winRateDiff) > 10) return winRateDiff; // Higher threshold for countries

        // If win rates are close, prefer countries with more bets (more diverse betting)
        return b.total - a.total;
      })[0] ||
    countryAnalytics[0] ||
    {};

  const worstCountry = countryAnalytics[countryAnalytics.length - 1] || {};

  // Find league with most bets
  const mostBetsLeague = leagueAnalytics.reduce(
    (max, current) => (current.total > max.total ? current : max),
    { total: 0 }
  );

  // Find highest average odds
  const highestOddsLeague = leagueAnalytics.reduce(
    (max, current) =>
      parseFloat(current.avgOdds) > parseFloat(max.avgOdds) ? current : max,
    { avgOdds: 0 }
  );

  return {
    bestLeague,
    worstLeague,
    bestCountry,
    worstCountry,
    mostBetsLeague,
    highestOddsLeague,
  };
};

/**
 * Get head-to-head data between teams
 * @param {Array} deduplicatedBets - Array of deduplicated bets
 * @returns {Array} Array of head-to-head matchup data
 */
export const getHeadToHeadData = (deduplicatedBets) => {
  const headToHeadMap = new Map();

  // Process all bets to find matchups
  // Use deduplicated bets to avoid counting multiple tickets for the same game
  deduplicatedBets.forEach((bet) => {
    const country = bet.COUNTRY?.toLowerCase() || "";
    const league = bet.LEAGUE?.toLowerCase() || "";
    const homeTeam = bet.HOME_TEAM?.toLowerCase() || "";
    const awayTeam = bet.AWAY_TEAM?.toLowerCase() || "";
    const result = bet.RESULT?.toLowerCase() || "";

    if (!homeTeam || !awayTeam) return;

    // Only include bets with actual results (Win or Loss)
    const hasResult = result.includes("win") || result.includes("loss");
    if (!hasResult) return;

    // Create matchup key
    const sortedTeams = [homeTeam, awayTeam].sort();
    const matchupKey = `${country}-${league}-${sortedTeams[0]}-${sortedTeams[1]}`;

    if (!headToHeadMap.has(matchupKey)) {
      headToHeadMap.set(matchupKey, {
        country: bet.COUNTRY,
        league: bet.LEAGUE,
        team1: sortedTeams[0],
        team2: sortedTeams[1],
        bets: [],
        totalBets: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
      });
    }

    const matchup = headToHeadMap.get(matchupKey);
    matchup.bets.push({
      date: bet.DATE,
      homeTeam: bet.HOME_TEAM,
      awayTeam: bet.AWAY_TEAM,
      betType: bet.BET_TYPE,
      betSelection: bet.BET_SELECTION,
      teamIncluded: bet.TEAM_INCLUDED,
      result: bet.RESULT,
      odds1: bet.ODDS1,
      odds2: bet.ODDS2,
    });

    matchup.totalBets++;
    if (result.includes("win")) {
      matchup.wins++;
    } else if (result.includes("loss")) {
      matchup.losses++;
    }

    matchup.winRate =
      matchup.wins + matchup.losses > 0
        ? ((matchup.wins / (matchup.wins + matchup.losses)) * 100).toFixed(1)
        : 0;
  });

  // Convert to array and filter out matchups with only one bet
  return Array.from(headToHeadMap.values())
    .filter((matchup) => matchup.totalBets > 1)
    .sort((a, b) => b.totalBets - a.totalBets);
};

/**
 * Get top performing teams
 * @param {Array} deduplicatedBets - Array of deduplicated bets
 * @returns {Array} Array of top performing teams
 */
export const getTopTeams = (deduplicatedBets) => {
  const teamStats = new Map();
  const teamBets = new Map(); // Store all bets for each team to sort by date

  // First pass: collect all bets for each team
  deduplicatedBets.forEach((bet) => {
    const teamIncluded = bet.TEAM_INCLUDED;
    const homeTeam = bet.HOME_TEAM;
    const awayTeam = bet.AWAY_TEAM;
    const country = bet.COUNTRY;
    const league = bet.LEAGUE;

    // Use TEAM_INCLUDED if available, otherwise use HOME_TEAM or AWAY_TEAM
    const teamToAnalyze = teamIncluded || homeTeam || awayTeam;

    if (!teamToAnalyze || !country || !league) return;

    // Exclude teams named "Over 1.5" and "Over 0.5"
    if (teamToAnalyze === "Over 1.5" || teamToAnalyze === "Over 0.5") {
      return;
    }

    // Create unique key for team + country + league combination
    const teamKey = `${teamToAnalyze.toLowerCase()}_${country.toLowerCase()}_${league.toLowerCase()}`;

    // Initialize team stats
    if (!teamStats.has(teamKey)) {
      teamStats.set(teamKey, {
        teamName: teamToAnalyze,
        country: country,
        league: league,
        totalBets: 0,
        wins: 0,
        losses: 0,
        recentWins: 0,
        recentBets: 0,
        winRate: 0,
        recentWinRate: 0,
        lastBetDate: null,
      });
    }

    // Store bet for later sorting
    if (!teamBets.has(teamKey)) {
      teamBets.set(teamKey, []);
    }
    teamBets.get(teamKey).push(bet);

    const team = teamStats.get(teamKey);
    team.totalBets++;

    if (bet.RESULT?.toLowerCase().includes("win")) {
      team.wins++;
    } else if (bet.RESULT?.toLowerCase().includes("loss")) {
      team.losses++;
    }

    // Track last bet date
    const betDate = new Date(bet.DATE);
    if (!team.lastBetDate || betDate > team.lastBetDate) {
      team.lastBetDate = betDate;
    }
  });

  // Second pass: calculate recent performance from last 10 bets by date
  teamBets.forEach((bets, teamKey) => {
    const team = teamStats.get(teamKey);
    if (!team) return;

    // Sort bets by date (newest first) and take last 10
    const sortedBets = bets
      .sort((a, b) => new Date(b.DATE) - new Date(a.DATE))
      .slice(0, 10);

    // Calculate recent performance from last 10 bets
    let recentWins = 0;
    let recentBets = 0;

    sortedBets.forEach((bet) => {
      recentBets++;
      if (bet.RESULT?.toLowerCase().includes("win")) {
        recentWins++;
      }
    });

    team.recentBets = recentBets;
    team.recentWins = recentWins;

    // Calculate win rates
    const totalBetsWithResult = team.wins + team.losses;
    team.winRate =
      totalBetsWithResult > 0 ? (team.wins / totalBetsWithResult) * 100 : 0;
    team.recentWinRate =
      team.recentBets > 0 ? (team.recentWins / team.recentBets) * 100 : 0;
  });

  // Convert to array and calculate composite score
  const teamsArray = Array.from(teamStats.values() || [])
    .filter((team) => team && team.totalBets >= 2) // Only teams with at least 2 bets
    .map((team) => {
      // Calculate composite score (win rate 50%, total wins 30%, recent performance 20%)
      const winRateScore = (team.winRate || 0) * 0.5;
      const totalWinsScore = Math.min((team.wins || 0) * 2, 100) * 0.3; // Cap at 50 wins
      const recentPerformanceScore = (team.recentWinRate || 0) * 0.2;

      const compositeScore =
        winRateScore + totalWinsScore + recentPerformanceScore;

      return {
        ...team,
        team: team.teamName, // Map teamName to team for compatibility
        total: team.totalBets, // Map totalBets to total for compatibility
        compositeScore,
      };
    })
    .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
    .slice(0, 70); // Top 70 teams

  return teamsArray || [];
};
