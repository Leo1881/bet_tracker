/**
 * Data Processing Service
 * Handles sorting, filtering, and data manipulation functions
 */

/**
 * Get sorted data based on sort configuration
 * @param {Array} data - Array of data to sort
 * @param {Object} sortConfig - Sort configuration object
 * @returns {Array} Sorted data
 */
export const getSortedData = (data, sortConfig) => {
  if (!sortConfig.key) return data;

  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === bValue) return 0;

    const comparison = aValue < bValue ? -1 : 1;
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });
};

/**
 * Get sorted league data
 * @param {Array} leagueData - League analytics data
 * @param {Object} leagueSortConfig - League sort configuration
 * @returns {Array} Sorted league data
 */
export const getSortedLeagueData = (leagueData, leagueSortConfig) => {
  if (!leagueSortConfig.key) return leagueData;

  return [...leagueData].sort((a, b) => {
    let aValue = a[leagueSortConfig.key];
    let bValue = b[leagueSortConfig.key];

    // Handle numeric fields (winRate, wins, losses, total)
    if (
      leagueSortConfig.key === "winRate" ||
      leagueSortConfig.key === "wins" ||
      leagueSortConfig.key === "losses" ||
      leagueSortConfig.key === "total"
    ) {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }

    // Primary sort by the selected field
    if (aValue !== bValue) {
      const comparison = aValue < bValue ? -1 : 1;
      return leagueSortConfig.direction === "asc" ? comparison : -comparison;
    }

    // Secondary sort: if winRate is equal, sort by total bets (descending)
    if (leagueSortConfig.key === "winRate") {
      const aTotal = parseFloat(a.total) || 0;
      const bTotal = parseFloat(b.total) || 0;
      return bTotal - aTotal; // Descending order for bets
    }

    return 0;
  });
};

/**
 * Get sorted country data
 * @param {Array} countryData - Country analytics data
 * @param {Object} countrySortConfig - Country sort configuration
 * @returns {Array} Sorted country data
 */
export const getSortedCountryData = (countryData, countrySortConfig) => {
  if (!countrySortConfig.key) return countryData;

  return [...countryData].sort((a, b) => {
    let aValue = a[countrySortConfig.key];
    let bValue = b[countrySortConfig.key];

    // Handle numeric fields (winRate, wins, losses, total)
    if (
      countrySortConfig.key === "winRate" ||
      countrySortConfig.key === "wins" ||
      countrySortConfig.key === "losses" ||
      countrySortConfig.key === "total"
    ) {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }

    // Primary sort by the selected field
    if (aValue !== bValue) {
      const comparison = aValue < bValue ? -1 : 1;
      return countrySortConfig.direction === "asc" ? comparison : -comparison;
    }

    // Secondary sort: if winRate is equal, sort by total bets (descending)
    if (countrySortConfig.key === "winRate") {
      const aTotal = parseFloat(a.total) || 0;
      const bTotal = parseFloat(b.total) || 0;
      return bTotal - aTotal; // Descending order for bets
    }

    return 0;
  });
};

/**
 * Get sorted blacklist data
 * @param {Array} blacklistedTeams - Array of blacklisted teams
 * @param {Object} blacklistSortConfig - Blacklist sort configuration
 * @returns {Array} Sorted blacklist data
 */
export const getSortedBlacklistData = (
  blacklistedTeams,
  blacklistSortConfig
) => {
  if (!blacklistSortConfig.key) return blacklistedTeams;

  return [...blacklistedTeams].sort((a, b) => {
    const aValue = a[blacklistSortConfig.key];
    const bValue = b[blacklistSortConfig.key];

    if (aValue === bValue) return 0;

    const comparison = aValue < bValue ? -1 : 1;
    return blacklistSortConfig.direction === "asc" ? comparison : -comparison;
  });
};

/**
 * Get sorted odds data
 * @param {Array} oddsData - Odds analytics data
 * @param {Object} oddsSortConfig - Odds sort configuration
 * @returns {Array} Sorted odds data
 */
export const getSortedOddsData = (oddsData, oddsSortConfig) => {
  if (!oddsSortConfig.key) return oddsData;

  return [...oddsData].sort((a, b) => {
    const aValue = a[oddsSortConfig.key];
    const bValue = b[oddsSortConfig.key];

    if (aValue === bValue) return 0;

    const comparison = aValue < bValue ? -1 : 1;
    return oddsSortConfig.direction === "asc" ? comparison : -comparison;
  });
};

/**
 * Get sorted analysis results
 * @param {Array} analysisResults - Analysis results data
 * @param {Object} analysisSortConfig - Analysis sort configuration
 * @returns {Array} Sorted analysis results
 */
export const getSortedAnalysisResults = (
  analysisResults,
  analysisSortConfig
) => {
  if (!analysisSortConfig.key) return analysisResults;

  return [...analysisResults].sort((a, b) => {
    const aValue = a[analysisSortConfig.key];
    const bValue = b[analysisSortConfig.key];

    if (aValue === bValue) return 0;

    const comparison = aValue < bValue ? -1 : 1;
    return analysisSortConfig.direction === "asc" ? comparison : -comparison;
  });
};

/**
 * Get sorted slips data with status filtering
 * @param {Array} slipsData - Bet slips data
 * @param {Object} slipsSortConfig - Slips sort configuration
 * @param {string} statusFilter - Status filter value
 * @param {boolean} showCompletedSlips - Whether to show completed slips
 * @returns {Array} Sorted and filtered slips data
 */
export const getSortedSlipsData = (
  slipsData,
  slipsSortConfig,
  statusFilter,
  showCompletedSlips = false
) => {
  let filteredData = slipsData;

  // Apply status filter
  if (statusFilter && statusFilter !== "all") {
    filteredData = slipsData.filter((slip) => {
      const status = slip.status?.toLowerCase() || "";
      return status === statusFilter.toLowerCase();
    });
  }

  // Filter by completed slips checkbox
  if (!showCompletedSlips) {
    filteredData = filteredData.filter((slip) => {
      // Hide completed slips
      if (slip.status === "Complete") {
        return false;
      }
      // Hide pending slips with any losses
      if (slip.status === "Pending" && slip.losses > 0) {
        return false;
      }
      // Only show pending slips with 0 losses
      return slip.status === "Pending" && slip.losses === 0;
    });
  }

  if (!slipsSortConfig.key) return filteredData;

  return [...filteredData].sort((a, b) => {
    let aValue = a[slipsSortConfig.key];
    let bValue = b[slipsSortConfig.key];

    // Handle betId sorting by extracting the numeric part from the end
    if (slipsSortConfig.key === "betId") {
      const extractNumericPart = (betId) => {
        // Extract the last part after " - " (e.g., "026" from "2025/07/29 - 026")
        const match = betId.toString().match(/- (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      };
      aValue = extractNumericPart(aValue);
      bValue = extractNumericPart(bValue);
    }

    // Handle date sorting
    if (slipsSortConfig.key === "date") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    // Handle numeric sorting
    if (typeof aValue === "number" && typeof bValue === "number") {
      const comparison = aValue - bValue;
      return slipsSortConfig.direction === "asc" ? comparison : -comparison;
    }

    // Handle string sorting
    if (aValue === bValue) return 0;
    const comparison = aValue < bValue ? -1 : 1;
    return slipsSortConfig.direction === "asc" ? comparison : -comparison;
  });
};

/**
 * Get sorted team notes data
 * @param {Array} teamNotesData - Team notes data
 * @param {Object} teamNotesSortConfig - Team notes sort configuration
 * @returns {Array} Sorted team notes data
 */
export const getSortedTeamNotesData = (teamNotesData, teamNotesSortConfig) => {
  // Handle old lowercase field names by converting them to uppercase
  let sortKey = teamNotesSortConfig.key;
  if (sortKey === "team_name") sortKey = "TEAM_NAME";
  if (sortKey === "notes") sortKey = "NOTES";
  if (sortKey === "date_added") sortKey = "DATE_ADDED";

  if (!sortKey) return teamNotesData;

  return [...teamNotesData].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue === bValue) return 0;

    const comparison = aValue < bValue ? -1 : 1;
    return teamNotesSortConfig.direction === "asc" ? comparison : -comparison;
  });
};

/**
 * Get deduplicated bets
 * @param {Array} bets - Array of all bets
 * @returns {Array} Deduplicated bets
 */
export const getDeduplicatedBets = (bets) => {
  const uniqueBets = new Map();

  bets.forEach((bet) => {
    const key = `${bet.DATE}-${bet.HOME_TEAM}-${bet.AWAY_TEAM}-${bet.BET_TYPE}-${bet.BET_SELECTION}`;

    if (!uniqueBets.has(key)) {
      uniqueBets.set(key, bet);
    }
  });

  return Array.from(uniqueBets.values());
};

/**
 * Get deduplicated filtered bets
 * @param {Array} deduplicatedBets - Deduplicated bets
 * @param {Object} filters - Filter object
 * @returns {Array} Filtered deduplicated bets
 */
export const getDeduplicatedFilteredBets = (deduplicatedBets, filters) => {
  return deduplicatedBets.filter((bet) => {
    // Apply filters
    if (filters.country && bet.COUNTRY !== filters.country) return false;
    if (filters.league && bet.LEAGUE !== filters.league) return false;
    if (filters.betType && bet.BET_TYPE !== filters.betType) return false;
    if (filters.result && bet.RESULT !== filters.result) return false;
    if (
      filters.team &&
      bet.TEAM_INCLUDED?.toLowerCase() !== filters.team.toLowerCase()
    )
      return false;
    if (filters.dateFrom && bet.DATE < filters.dateFrom) return false;
    if (filters.dateTo && bet.DATE > filters.dateTo) return false;

    return true;
  });
};

/**
 * Check if any filters are active
 * @param {Object} filters - Filter object
 * @returns {boolean} True if any filters are active
 */
export const hasActiveFilters = (filters) => {
  return Object.values(filters).some((value) => value !== "");
};

/**
 * Get unique values for a field
 * @param {Array} data - Array of data
 * @param {string} field - Field name to get unique values for
 * @param {Object} context - Additional context for filtering
 * @returns {Array} Array of unique values
 */
export const getUniqueValues = (data, field, context = {}) => {
  let values = data.map((item) => item[field]).filter(Boolean);

  // Apply context filters if provided
  if (context.country) {
    values = data
      .filter((item) => item.COUNTRY === context.country)
      .map((item) => item[field])
      .filter(Boolean);
  }

  if (context.league) {
    values = data
      .filter((item) => item.LEAGUE === context.league)
      .map((item) => item[field])
      .filter(Boolean);
  }

  return [...new Set(values)].sort();
};

/**
 * Toggle expansion state for odds ranges
 * @param {Set} expandedOddsRanges - Current expanded odds ranges
 * @param {string} range - Range to toggle
 * @returns {Set} New expanded odds ranges set
 */
export const toggleOddsRangeExpansion = (expandedOddsRanges, range) => {
  const newExpanded = new Set(expandedOddsRanges);
  if (newExpanded.has(range)) {
    newExpanded.delete(range);
  } else {
    newExpanded.add(range);
  }
  return newExpanded;
};

/**
 * Toggle expansion state for slips
 * @param {Set} expandedSlips - Current expanded slips
 * @param {string} betId - Bet ID to toggle
 * @returns {Set} New expanded slips set
 */
export const toggleSlipExpansion = (expandedSlips, betId) => {
  const newExpanded = new Set(expandedSlips);
  if (newExpanded.has(betId)) {
    newExpanded.delete(betId);
  } else {
    newExpanded.add(betId);
  }
  return newExpanded;
};

/**
 * Toggle expansion state for teams
 * @param {Set} expandedBetTypes - Current expanded bet types
 * @param {string} team - Team to toggle
 * @returns {Set} New expanded bet types set
 */
export const toggleTeamExpansion = (expandedBetTypes, team) => {
  const newExpanded = new Set(expandedBetTypes);
  if (newExpanded.has(team)) {
    newExpanded.delete(team);
  } else {
    newExpanded.add(team);
  }
  return newExpanded;
};
