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
 * @param {Array} deduplicatedBets - Array of deduplicated bets
 * @returns {Array} Filtered odds analytics data
 */
export const getFilteredOddsAnalytics = (deduplicatedBets) => {
  if (!deduplicatedBets || deduplicatedBets.length === 0) {
    return [];
  }

  const filteredBets = deduplicatedBets.filter((bet) => {
    const betType = bet.BET_TYPE?.toLowerCase() || "";
    const betSelection = bet.BET_SELECTION?.toLowerCase() || "";
    const teamIncluded = bet.TEAM_INCLUDED?.toLowerCase() || "";

    // Filter out specific bet types for odds analytics only
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

    return true;
  });

  console.log(
    `Getting bets for odds analytics, total deduplicated bets: ${deduplicatedBets.length}`
  );
  console.log(`Filtered bets for odds analytics: ${filteredBets.length}`);

  const oddsRanges = {};

  filteredBets.forEach((bet) => {
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

  return Object.entries(oddsRanges)
    .map(([range, stats]) => ({
      ...stats,
      winRate:
        stats.wins + stats.losses > 0
          ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
          : 0,
      avgOdds: stats.total > 0 ? (stats.totalOdds / stats.total).toFixed(2) : 0,
    }))
    .sort((a, b) => parseFloat(a.avgOdds) - parseFloat(b.avgOdds));
};
