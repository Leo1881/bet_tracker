/**
 * Odds Analytics Service
 * Handles odds analysis and calculations
 */

/**
 * Analyzes odds patterns and ranges
 * @param {Array} deduplicatedBets - Array of deduplicated bets
 * @returns {Array} Odds analytics data
 */
export const getOddsAnalytics = (deduplicatedBets) => {
  if (!deduplicatedBets || deduplicatedBets.length === 0) {
    return [];
  }

  console.log("Total deduplicated bets to analyze:", deduplicatedBets.length);

  // Look specifically for Algeria record
  const algeriaBet = deduplicatedBets.find(
    (bet) =>
      bet.HOME_TEAM?.includes("Algeria") ||
      bet.AWAY_TEAM?.includes("Algeria") ||
      bet.TEAM_INCLUDED?.includes("Algeria")
  );
  console.log("Algeria bet found:", algeriaBet);

  if (algeriaBet) {
    console.log("Algeria bet ODDS1:", algeriaBet.ODDS1);
    console.log("Algeria bet ODDS2:", algeriaBet.ODDS2);

    // Test the odds calculation for Algeria
    const algeriaOdds1 = parseFloat(algeriaBet.ODDS1) || 0;
    const algeriaOdds2 = parseFloat(algeriaBet.ODDS2) || 0;
    const algeriaAvgOdds =
      algeriaOdds1 > 0 && algeriaOdds2 > 0
        ? (algeriaOdds1 + algeriaOdds2) / 2
        : Math.max(algeriaOdds1, algeriaOdds2);
    console.log("Algeria average odds:", algeriaAvgOdds);
  }

  const oddsRanges = {};

  deduplicatedBets.forEach((bet) => {
    const odds1 = parseFloat(bet.ODDS1) || 0;
    const odds2 = parseFloat(bet.ODDS2) || 0;
    const avgOdds =
      odds1 > 0 && odds2 > 0 ? (odds1 + odds2) / 2 : Math.max(odds1, odds2);

    if (avgOdds <= 0) return;

    // Define odds ranges
    let range;
    if (avgOdds < 1.5) range = "1.0-1.49";
    else if (avgOdds < 2.0) range = "1.5-1.99";
    else if (avgOdds < 2.5) range = "2.0-2.49";
    else if (avgOdds < 3.0) range = "2.5-2.99";
    else if (avgOdds < 4.0) range = "3.0-3.99";
    else if (avgOdds < 5.0) range = "4.0-4.99";
    else if (avgOdds < 6.0) range = "5.0-5.99";
    else if (avgOdds < 8.0) range = "6.0-7.99";
    else if (avgOdds < 10.0) range = "8.0-9.99";
    else range = "10.0+";

    if (!oddsRanges[range]) {
      oddsRanges[range] = {
        range,
        total: 0,
        wins: 0,
        losses: 0,
        pending: 0,
        totalOdds: 0,
        betCount: 0,
      };
    }

    oddsRanges[range].total++;
    oddsRanges[range].totalOdds += avgOdds;

    if (bet.RESULT === "Win") {
      oddsRanges[range].wins++;
    } else if (bet.RESULT === "Loss") {
      oddsRanges[range].losses++;
    } else {
      oddsRanges[range].pending++;
    }
  });

  const result = Object.entries(oddsRanges)
    .map(([range, stats]) => ({
      ...stats,
      winRate:
        stats.wins + stats.losses > 0
          ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
          : 0,
      avgOdds: stats.total > 0 ? (stats.totalOdds / stats.total).toFixed(2) : 0,
    }))
    .sort((a, b) => parseFloat(a.avgOdds) - parseFloat(b.avgOdds));

  console.log("Odds analytics result:", result);
  return result;
};

/**
 * Gets filtered odds analytics based on bet type filters
 * Uses team-specific odds (ODDS1 for home team, ODDS2 for away team) instead of average
 * @param {Array} bets - Array of bets (can be filtered or deduplicated)
 * @returns {Array} Filtered odds analytics data
 */
export const getFilteredOddsAnalytics = (bets) => {
  if (!bets || bets.length === 0) {
    return [];
  }

  const oddsRanges = {
    "1.0-1.5": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
    "1.5-2.0": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
    "2.0-3.0": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
    "3.0-5.0": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
    "5.0+": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
  };

  bets.forEach((bet) => {
    // Filter out specific bet types for odds analytics only
    const betType = bet.BET_TYPE?.toLowerCase() || "";
    const betSelection = bet.BET_SELECTION?.toLowerCase() || "";
    const teamIncluded = bet.TEAM_INCLUDED?.toLowerCase() || "";

    if (
      betType.includes("over 1.5") ||
      betType.includes("over 0.5") ||
      betType.includes("both") ||
      betSelection.includes("over 1.5") ||
      betSelection.includes("over 0.5") ||
      betSelection.includes("both") ||
      teamIncluded.includes("over 1.5") ||
      teamIncluded.includes("over 0.5") ||
      teamIncluded.includes("both")
    ) {
      return;
    }

    const odds1 = parseFloat(bet.ODDS1) || 0;
    const odds2 = parseFloat(bet.ODDS2) || 0;

    // Determine which odds to use based on the team you bet on
    let betOdds = 0;
    const teamBet = bet.TEAM_INCLUDED;
    const homeTeam = bet.HOME_TEAM;
    const awayTeam = bet.AWAY_TEAM;

    // If you bet on the home team, use odds1
    if (
      teamBet &&
      homeTeam &&
      teamBet.toLowerCase().includes(homeTeam.toLowerCase())
    ) {
      betOdds = odds1;
    }
    // If you bet on the away team, use odds2
    else if (
      teamBet &&
      awayTeam &&
      teamBet.toLowerCase().includes(awayTeam.toLowerCase())
    ) {
      betOdds = odds2;
    }
    // Fallback: use the higher odds (assuming you bet on the underdog)
    else {
      betOdds = Math.max(odds1, odds2);
    }

    if (betOdds <= 0) {
      return; // Skip bets without odds
    }

    let range;
    if (betOdds <= 1.5) range = "1.0-1.5";
    else if (betOdds <= 2.0) range = "1.5-2.0";
    else if (betOdds <= 3.0) range = "2.0-3.0";
    else if (betOdds <= 5.0) range = "3.0-5.0";
    else range = "5.0+";

    oddsRanges[range].bets++;
    oddsRanges[range].totalOdds += betOdds;

    if (bet.RESULT?.toLowerCase().includes("win")) {
      oddsRanges[range].wins++;
    } else if (bet.RESULT?.toLowerCase().includes("loss")) {
      oddsRanges[range].losses++;
    } else if (bet.RESULT?.toLowerCase().includes("pending")) {
      oddsRanges[range].pending++;
    }
  });

  const result = Object.entries(oddsRanges)
    .map(([range, stats]) => ({
      range,
      ...stats,
      total: stats.wins + stats.losses + stats.pending,
      winRate:
        stats.wins + stats.losses > 0
          ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
          : 0,
      avgOdds: stats.bets > 0 ? (stats.totalOdds / stats.bets).toFixed(2) : 0,
    }))
    .filter((item) => item.bets > 0) // Only show ranges with bets
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

  return result;
};

/**
 * Gets bets for a specific odds range
 * Uses team-specific odds matching logic
 * @param {Array} deduplicatedBets - Array of deduplicated bets
 * @param {string} range - Odds range (e.g., "1.0-1.5", "1.5-2.0", etc.)
 * @returns {Array} Array of bets in the specified range
 */
export const getBetsForOddsRange = (deduplicatedBets, range) => {
  if (!deduplicatedBets || deduplicatedBets.length === 0) {
    return [];
  }

  const filteredBets = deduplicatedBets.filter((bet) => {
    // Filter out specific bet types for odds analytics only
    const betType = bet.BET_TYPE?.toLowerCase() || "";
    const betSelection = bet.BET_SELECTION?.toLowerCase() || "";
    const teamIncluded = bet.TEAM_INCLUDED?.toLowerCase() || "";

    if (
      betType.includes("over 1.5") ||
      betType.includes("over 0.5") ||
      betType.includes("both") ||
      betSelection.includes("over 1.5") ||
      betSelection.includes("over 0.5") ||
      betSelection.includes("both") ||
      teamIncluded.includes("over 1.5") ||
      teamIncluded.includes("over 0.5") ||
      teamIncluded.includes("both")
    ) {
      return false;
    }

    const odds1 = parseFloat(bet.ODDS1) || 0;
    const odds2 = parseFloat(bet.ODDS2) || 0;

    // Determine which odds to use based on the team you bet on
    let betOdds = 0;
    const teamBet = bet.TEAM_INCLUDED;
    const homeTeam = bet.HOME_TEAM;
    const awayTeam = bet.AWAY_TEAM;

    // If you bet on the home team, use odds1
    if (
      teamBet &&
      homeTeam &&
      teamBet.toLowerCase().includes(homeTeam.toLowerCase())
    ) {
      betOdds = odds1;
    }
    // If you bet on the away team, use odds2
    else if (
      teamBet &&
      awayTeam &&
      teamBet.toLowerCase().includes(awayTeam.toLowerCase())
    ) {
      betOdds = odds2;
    }
    // Fallback: use the higher odds (assuming you bet on the underdog)
    else {
      betOdds = Math.max(odds1, odds2);
    }

    if (betOdds <= 0) return false;

    let betRange;
    if (betOdds <= 1.5) betRange = "1.0-1.5";
    else if (betOdds <= 2.0) betRange = "1.5-2.0";
    else if (betOdds <= 3.0) betRange = "2.0-3.0";
    else if (betOdds <= 5.0) betRange = "3.0-5.0";
    else betRange = "5.0+";

    return betRange === range;
  });

  // Additional deduplication step for the expanded view
  const uniqueBets = new Map();
  filteredBets.forEach((bet) => {
    const uniqueKey = `${bet.DATE}_${bet.HOME_TEAM}_${bet.AWAY_TEAM}_${bet.LEAGUE}_${bet.BET_TYPE}_${bet.TEAM_INCLUDED}`;
    if (!uniqueBets.has(uniqueKey)) {
      uniqueBets.set(uniqueKey, bet);
    }
  });

  return Array.from(uniqueBets.values());
};

/**
 * Gets team-specific odds analytics
 * Shows which odds ranges each team is successful at
 * @param {Array} bets - Array of bets (can be filtered or deduplicated)
 * @returns {Array} Team odds analytics data with outlier detection
 */
export const getTeamOddsAnalytics = (bets) => {
  if (!bets || bets.length === 0) {
    return [];
  }

  const teamStats = new Map();

  bets.forEach((bet) => {
    // Filter out specific bet types for odds analytics only
    const betType = bet.BET_TYPE?.toLowerCase() || "";
    const betSelection = bet.BET_SELECTION?.toLowerCase() || "";
    const teamIncluded = bet.TEAM_INCLUDED?.toLowerCase() || "";

    if (
      betType.includes("over 1.5") ||
      betType.includes("over 0.5") ||
      betType.includes("both") ||
      betSelection.includes("over 1.5") ||
      betSelection.includes("over 0.5") ||
      betSelection.includes("both") ||
      teamIncluded.includes("over 1.5") ||
      teamIncluded.includes("over 0.5") ||
      teamIncluded.includes("both")
    ) {
      return;
    }

    const teamName = bet.TEAM_INCLUDED;
    if (!teamName) return;

    const odds1 = parseFloat(bet.ODDS1) || 0;
    const odds2 = parseFloat(bet.ODDS2) || 0;
    const homeTeam = bet.HOME_TEAM;
    const awayTeam = bet.AWAY_TEAM;

    // Determine which odds to use based on the team you bet on
    let betOdds = 0;
    if (
      teamName &&
      homeTeam &&
      teamName.toLowerCase().includes(homeTeam.toLowerCase())
    ) {
      betOdds = odds1;
    } else if (
      teamName &&
      awayTeam &&
      teamName.toLowerCase().includes(awayTeam.toLowerCase())
    ) {
      betOdds = odds2;
    } else {
      betOdds = Math.max(odds1, odds2);
    }

    if (betOdds <= 0) return;

    let range;
    if (betOdds <= 1.5) range = "1.0-1.5";
    else if (betOdds <= 2.0) range = "1.5-2.0";
    else if (betOdds <= 3.0) range = "2.0-3.0";
    else if (betOdds <= 5.0) range = "3.0-5.0";
    else range = "5.0+";

    // Initialize team if not exists
    if (!teamStats.has(teamName)) {
      teamStats.set(teamName, {
        teamName,
        country: bet.COUNTRY || "",
        league: bet.LEAGUE || "",
        oddsRanges: {
          "1.0-1.5": {
            bets: 0,
            wins: 0,
            losses: 0,
            pending: 0,
            betTypes: { wins: {}, losses: {} },
          },
          "1.5-2.0": {
            bets: 0,
            wins: 0,
            losses: 0,
            pending: 0,
            betTypes: { wins: {}, losses: {} },
          },
          "2.0-3.0": {
            bets: 0,
            wins: 0,
            losses: 0,
            pending: 0,
            betTypes: { wins: {}, losses: {} },
          },
          "3.0-5.0": {
            bets: 0,
            wins: 0,
            losses: 0,
            pending: 0,
            betTypes: { wins: {}, losses: {} },
          },
          "5.0+": {
            bets: 0,
            wins: 0,
            losses: 0,
            pending: 0,
            betTypes: { wins: {}, losses: {} },
          },
        },
        totalBets: 0,
        totalWins: 0,
        totalLosses: 0,
      });
    }

    const team = teamStats.get(teamName);
    const rangeData = team.oddsRanges[range];
    rangeData.bets++;
    team.totalBets++;

    // Get bet type for tracking (use BET_TYPE or BET_SELECTION, keep original case)
    const betTypeForTracking = bet.BET_TYPE || bet.BET_SELECTION || "Unknown";

    if (bet.RESULT?.toLowerCase().includes("win")) {
      rangeData.wins++;
      team.totalWins++;
      // Track bet type for wins
      if (!rangeData.betTypes.wins[betTypeForTracking]) {
        rangeData.betTypes.wins[betTypeForTracking] = 0;
      }
      rangeData.betTypes.wins[betTypeForTracking]++;
    } else if (bet.RESULT?.toLowerCase().includes("loss")) {
      rangeData.losses++;
      team.totalLosses++;
      // Track bet type for losses
      if (!rangeData.betTypes.losses[betTypeForTracking]) {
        rangeData.betTypes.losses[betTypeForTracking] = 0;
      }
      rangeData.betTypes.losses[betTypeForTracking]++;
    } else {
      rangeData.pending++;
    }
  });

  // Convert to array and calculate win rates, identify outliers
  const result = Array.from(teamStats.values())
    .map((team) => {
      const overallWinRate =
        team.totalWins + team.totalLosses > 0
          ? (team.totalWins / (team.totalWins + team.totalLosses)) * 100
          : 0;

      // Find the most common odds range (where most bets are placed)
      const rangeStats = Object.entries(team.oddsRanges)
        .map(([range, stats]) => ({
          range,
          bets: stats.bets,
          wins: stats.wins,
          losses: stats.losses,
          pending: stats.pending,
          betTypes: stats.betTypes,
          winRate:
            stats.wins + stats.losses > 0
              ? (stats.wins / (stats.wins + stats.losses)) * 100
              : 0,
          totalWithResult: stats.wins + stats.losses,
        }))
        .filter((r) => r.bets > 0);

      // Find the range with most bets (normal range)
      const mostCommonRange = rangeStats.reduce(
        (max, r) => (r.bets > max.bets ? r : max),
        rangeStats[0] || { range: "", bets: 0 }
      );

      // Identify outlier ranges (ranges with losses where the team normally wins)
      const outlierRanges = rangeStats
        .map((rangeStat) => {
          // A range is an outlier if:
          // 1. It has losses
          // 2. The team's win rate at this range is significantly lower than overall
          // 3. OR it's not the most common range and has losses
          const isOutlier =
            rangeStat.losses > 0 &&
            (rangeStat.range !== mostCommonRange.range ||
              rangeStat.winRate < overallWinRate - 20);

          return {
            ...rangeStat,
            isOutlier,
          };
        })
        .filter((r) => r.isOutlier);

      return {
        teamName: team.teamName,
        country: team.country,
        league: team.league,
        totalBets: team.totalBets,
        totalWins: team.totalWins,
        totalLosses: team.totalLosses,
        overallWinRate: overallWinRate.toFixed(1),
        oddsRanges: rangeStats.map((r) => ({
          ...r,
          winRate: r.winRate.toFixed(1),
        })),
        mostCommonRange: mostCommonRange.range,
        hasOutliers: outlierRanges.length > 0,
        outlierRanges: outlierRanges.map((r) => ({
          ...r,
          winRate: r.winRate.toFixed(1),
        })),
      };
    })
    .filter((team) => team.totalBets > 0)
    .sort((a, b) => {
      // Sort by total bets descending, then by win rate
      if (b.totalBets !== a.totalBets) {
        return b.totalBets - a.totalBets;
      }
      return parseFloat(b.overallWinRate) - parseFloat(a.overallWinRate);
    });

  return result;
};
