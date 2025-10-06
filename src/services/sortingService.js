/**
 * Sorting Service
 * Handles all sorting logic for different data types
 */

/**
 * Creates sort handlers for different data types
 * @param {Object} sortConfigs - Object containing all sort configurations
 * @param {Object} setters - Object containing all setter functions
 * @returns {Object} Object containing all sort handler functions
 */
export const createSortHandlers = (sortConfigs, setters) => {
  const {
    sortConfig,
    leagueSortConfig,
    countrySortConfig,
    blacklistSortConfig,
    oddsSortConfig,
    slipsSortConfig,
    analysisSortConfig,
    teamNotesSortConfig,
    analyticsSortConfig,
    scoringSortConfig,
  } = sortConfigs;

  const {
    setSortConfig,
    setLeagueSortConfig,
    setCountrySortConfig,
    setBlacklistSortConfig,
    setOddsSortConfig,
    setSlipsSortConfig,
    setAnalysisSortConfig,
    setTeamNotesSortConfig,
    setAnalyticsSortConfig,
    setScoringSortConfig,
  } = setters;

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleLeagueSort = (key) => {
    let direction = "asc";
    if (leagueSortConfig.key === key && leagueSortConfig.direction === "asc") {
      direction = "desc";
    }
    setLeagueSortConfig({ key, direction });
  };

  const handleCountrySort = (key) => {
    let direction = "asc";
    if (
      countrySortConfig.key === key &&
      countrySortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setCountrySortConfig({ key, direction });
  };

  const handleBlacklistSort = (key) => {
    let direction = "asc";
    if (
      blacklistSortConfig.key === key &&
      blacklistSortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setBlacklistSortConfig({ key, direction });
  };

  const handleOddsSort = (key) => {
    let direction = "asc";
    if (oddsSortConfig.key === key && oddsSortConfig.direction === "asc") {
      direction = "desc";
    }
    setOddsSortConfig({ key, direction });
  };

  const handleSlipsSort = (key) => {
    let direction = "asc";
    if (slipsSortConfig.key === key && slipsSortConfig.direction === "asc") {
      direction = "desc";
    }
    setSlipsSortConfig({ key, direction });
  };

  const handleAnalysisSort = (key) => {
    let direction = "asc";
    if (
      analysisSortConfig.key === key &&
      analysisSortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setAnalysisSortConfig({ key, direction });
  };

  const handleTeamNotesSort = (key) => {
    let direction = "asc";
    if (
      teamNotesSortConfig.key === key &&
      teamNotesSortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setTeamNotesSortConfig({ key, direction });
  };

  const handleAnalyticsSort = (key) => {
    let direction = "asc";
    if (
      analyticsSortConfig.key === key &&
      analyticsSortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setAnalyticsSortConfig({ key, direction });
  };

  // Enhanced analytics sort with multi-column support
  const handleAnalyticsMultiSort = (key) => {
    let direction = "asc";
    let secondaryKey = null;

    // Define secondary sort keys for better multi-column sorting
    if (key === "winRate") {
      secondaryKey = "totalBets"; // Sort by total bets as secondary
    } else if (key === "totalBets") {
      secondaryKey = "winRate"; // Sort by win rate as secondary
    } else if (key === "wins") {
      secondaryKey = "winRate"; // Sort by win rate as secondary
    } else if (key === "losses") {
      secondaryKey = "winRate"; // Sort by win rate as secondary
    }

    if (
      analyticsSortConfig.key === key &&
      analyticsSortConfig.direction === "asc"
    ) {
      direction = "desc";
    }

    setAnalyticsSortConfig({
      key,
      direction,
      secondaryKey,
      secondaryDirection: direction === "asc" ? "desc" : "asc",
    });
  };

  const handleScoringSort = (key) => {
    let direction = "asc";
    if (
      scoringSortConfig.key === key &&
      scoringSortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setScoringSortConfig({ key, direction });
  };

  return {
    handleSort,
    handleLeagueSort,
    handleCountrySort,
    handleBlacklistSort,
    handleOddsSort,
    handleSlipsSort,
    handleAnalysisSort,
    handleTeamNotesSort,
    handleAnalyticsSort,
    handleAnalyticsMultiSort,
    handleScoringSort,
  };
};

/**
 * Generic sorting function for different data types
 * @param {Array} data - Data to sort
 * @param {Object} sortConfig - Sort configuration {key, direction}
 * @param {Array} numericFields - Array of field names that should be sorted numerically
 * @param {Array} dateFields - Array of field names that should be sorted as dates
 * @returns {Array} Sorted data
 */
export const sortData = (
  data,
  sortConfig,
  numericFields = [],
  dateFields = []
) => {
  if (!sortConfig.key) return data;

  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.key] || "";
    const bValue = b[sortConfig.key] || "";

    // Handle date sorting
    if (dateFields.includes(sortConfig.key)) {
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      if (sortConfig.direction === "asc") {
        return aDate - bDate;
      }
      return bDate - aDate;
    }

    // Handle numeric sorting
    if (numericFields.includes(sortConfig.key)) {
      const aNum = parseFloat(aValue) || 0;
      const bNum = parseFloat(bValue) || 0;
      if (sortConfig.direction === "asc") {
        return aNum - bNum;
      }
      // For descending sort, if values are equal, sort by secondary criteria
      if (sortConfig.key === "winRate" && aNum === bNum) {
        return b.wins - a.wins;
      }
      return bNum - aNum;
    }

    // Default string sorting
    if (sortConfig.direction === "asc") {
      return aValue.toString().localeCompare(bValue.toString());
    }
    return bValue.toString().localeCompare(aValue.toString());
  });
};

/**
 * Special sorting function for bet slips with custom logic
 * @param {Array} slipsData - Slips data to sort
 * @param {Object} sortConfig - Sort configuration
 * @returns {Array} Sorted slips data
 */
export const sortSlipsData = (slipsData, sortConfig) => {
  if (!sortConfig.key) return slipsData;

  return [...slipsData].sort((a, b) => {
    const aValue = a[sortConfig.key] || "";
    const bValue = b[sortConfig.key] || "";

    // Handle date sorting
    if (sortConfig.key === "date") {
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      if (sortConfig.direction === "asc") {
        return aDate - bDate;
      }
      return bDate - aDate;
    }

    // Handle numeric sorting
    if (["totalBets", "totalOdds", "potentialWin"].includes(sortConfig.key)) {
      const aNum = parseFloat(aValue) || 0;
      const bNum = parseFloat(bValue) || 0;
      if (sortConfig.direction === "asc") {
        return aNum - bNum;
      }
      return bNum - aNum;
    }

    // Handle bet ID sorting (extract numeric part)
    if (sortConfig.key === "betId") {
      const extractNumericPart = (betId) => {
        const match = betId.toString().match(/- (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      };
      const aNum = extractNumericPart(aValue);
      const bNum = extractNumericPart(bValue);
      if (sortConfig.direction === "asc") {
        return aNum - bNum;
      }
      return bNum - aNum;
    }

    // Default string sorting
    if (sortConfig.direction === "asc") {
      return aValue.toString().localeCompare(bValue.toString());
    }
    return bValue.toString().localeCompare(aValue.toString());
  });
};
