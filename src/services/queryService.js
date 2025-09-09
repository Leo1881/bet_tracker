/**
 * Query Service
 * Handles query system functions for filtering and analyzing betting data
 */

/**
 * Get available fields for query filtering
 * @returns {Array} Array of field objects with value and label
 */
export const getAvailableFields = () => {
  return [
    { value: "BET_TYPE", label: "Bet Type" },
    { value: "BET_SELECTION", label: "Bet Selection" },
    { value: "COUNTRY", label: "Country" },
    { value: "LEAGUE", label: "League" },
    { value: "TEAM_INCLUDED", label: "Team Included" },
    { value: "HOME_TEAM", label: "Home Team" },
    { value: "AWAY_TEAM", label: "Away Team" },
    { value: "RESULT", label: "Result" },
    { value: "ODDS1", label: "Odds 1" },
    { value: "ODDS2", label: "Odds 2" },
    { value: "ODDSX", label: "Odds X" },
    { value: "HOME_SCORE", label: "Home Score" },
    { value: "AWAY_SCORE", label: "Away Score" },
    { value: "DATE", label: "Date" },
    { value: "HOME_TEAM_POSITION_NUMBER", label: "Home Team Position" },
    { value: "AWAY_TEAM_POSITION_NUMBER", label: "Away Team Position" },
    { value: "TOTAL_TEAMS_IN_LEAGUE", label: "Total Teams in League" },
    { value: "HOME_TEAM_GAMES_PLAYED", label: "Home Team Games Played" },
    { value: "AWAY_TEAM_GAMES_PLAYED", label: "Away Team Games Played" },
  ];
};

/**
 * Get available values for a specific field
 * @param {string} field - Field name
 * @param {Array} deduplicatedBets - Array of deduplicated bets
 * @returns {Array} Sorted array of unique values for the field
 */
export const getFieldValues = (field, deduplicatedBets) => {
  // Special handling for certain fields
  if (field === "HOME_TEAM" || field === "AWAY_TEAM") {
    // For home/away team fields, add special options
    const values = [
      ...new Set(deduplicatedBets.map((bet) => bet[field]).filter(Boolean)),
    ];
    return values.sort();
  }

  const values = [
    ...new Set(deduplicatedBets.map((bet) => bet[field]).filter(Boolean)),
  ];
  return values.sort();
};

/**
 * Get available metrics for query filtering
 * @returns {Array} Array of metric objects with value and label
 */
export const getAvailableMetrics = () => {
  return [
    { value: "wins", label: "Wins" },
    { value: "losses", label: "Losses" },
    { value: "winRate", label: "Win Rate" },
    { value: "total", label: "Total Bets" },
  ];
};

/**
 * Get available operators for query filtering
 * @returns {Array} Array of operator objects with value and label
 */
export const getAvailableOperators = () => {
  return [
    { value: "equals", label: "Equals" },
    { value: "greaterThan", label: "Greater Than" },
    { value: "lessThan", label: "Less Than" },
    { value: "contains", label: "Contains" },
  ];
};

/**
 * Add a new query filter
 * @param {Array} queryFilters - Current query filters
 * @param {Function} setQueryFilters - Function to update query filters
 */
export const addQueryFilter = (queryFilters, setQueryFilters) => {
  setQueryFilters([
    ...queryFilters,
    {
      field: "",
      value: "",
      metric: "",
      operator: "",
      metricValue: "",
    },
  ]);
};

/**
 * Remove a query filter by index
 * @param {number} index - Index of filter to remove
 * @param {Array} queryFilters - Current query filters
 * @param {Function} setQueryFilters - Function to update query filters
 */
export const removeQueryFilter = (index, queryFilters, setQueryFilters) => {
  const newFilters = queryFilters.filter((_, i) => i !== index);
  setQueryFilters(newFilters);
};

/**
 * Update a query filter
 * @param {number} index - Index of filter to update
 * @param {string} field - Field to update
 * @param {string} value - New value
 * @param {Array} queryFilters - Current query filters
 * @param {Function} setQueryFilters - Function to update query filters
 */
export const updateQueryFilter = (
  index,
  field,
  value,
  queryFilters,
  setQueryFilters
) => {
  const newFilters = [...queryFilters];
  newFilters[index] = { ...newFilters[index], [field]: value };
  setQueryFilters(newFilters);
};

/**
 * Execute query with current filters
 * @param {Array} queryFilters - Current query filters
 * @param {Array} deduplicatedBets - Array of deduplicated bets
 * @param {Array} teamAnalytics - Array of team analytics data
 * @param {Function} setQueryResults - Function to set query results
 * @param {Function} setIsQuerying - Function to set querying state
 */
export const executeQuery = async (
  queryFilters,
  deduplicatedBets,
  teamAnalytics,
  setQueryResults,
  setIsQuerying
) => {
  setIsQuerying(true);

  try {
    let filteredTeams = new Set();

    // Apply all filters (AND logic - all conditions must be met)
    const matchingBets = deduplicatedBets.filter((bet) => {
      // Check if this bet matches ALL filters
      return queryFilters.every((filter) => {
        if (!filter.field || !filter.value) return true; // Skip empty filters

        const betValue = bet[filter.field];
        if (!betValue) return false;

        // Check if the bet matches the field value
        let matchesField = false;

        // Handle numeric fields differently
        const numericFields = [
          "ODDS1",
          "ODDS2",
          "ODDSX",
          "HOME_SCORE",
          "AWAY_SCORE",
          "HOME_TEAM_POSITION_NUMBER",
          "AWAY_TEAM_POSITION_NUMBER",
          "TOTAL_TEAMS_IN_LEAGUE",
          "HOME_TEAM_GAMES_PLAYED",
          "AWAY_TEAM_GAMES_PLAYED",
        ];

        if (numericFields.includes(filter.field)) {
          // For numeric fields, check if the value is greater than, less than, or equals
          const betNum = parseFloat(betValue);
          const filterNum = parseFloat(filter.value);

          if (!isNaN(betNum) && !isNaN(filterNum)) {
            if (filter.operator === "greaterThan") {
              matchesField = betNum > filterNum;
            } else if (filter.operator === "lessThan") {
              matchesField = betNum < filterNum;
            } else if (filter.operator === "equals") {
              matchesField = betNum === filterNum;
            } else {
              // Default to contains for numeric fields
              matchesField = betValue
                .toLowerCase()
                .includes(filter.value.toLowerCase());
            }
          } else {
            // Fallback to string matching for non-numeric values
            matchesField = betValue
              .toLowerCase()
              .includes(filter.value.toLowerCase());
          }
        } else {
          // For non-numeric fields, use string matching
          matchesField = betValue
            .toLowerCase()
            .includes(filter.value.toLowerCase());
        }

        if (!matchesField) return false;

        // If no metric filter, just return true for this filter
        if (!filter.metric || !filter.operator || filter.metricValue === "") {
          return true;
        }

        // For metric filtering, we need to check team-level data
        // This will be handled after we collect all matching bets
        return true;
      });
    });

    // Add matching teams to the set with league and country info
    const teamResults = new Map(); // Use Map to store unique team info

    matchingBets.forEach((bet) => {
      const teamName = bet.TEAM_INCLUDED || bet.HOME_TEAM || bet.AWAY_TEAM;
      if (teamName) {
        const league = bet.LEAGUE || "Unknown";
        const country = bet.COUNTRY || "Unknown";
        const key = `${teamName}|${league}|${country}`;

        if (!teamResults.has(key)) {
          teamResults.set(key, {
            team: teamName,
            league: league,
            country: country,
          });
        }
      }
    });

    // Apply metric filters to the collected teams
    let finalResults = Array.from(teamResults.values());

    // Check if any filters have metric conditions
    const metricFilters = queryFilters.filter(
      (filter) => filter.metric && filter.operator && filter.metricValue !== ""
    );

    if (metricFilters.length > 0) {
      finalResults = finalResults.filter((teamData) => {
        // Get team analytics for this team
        const teamAnalyticsData = teamAnalytics.find(
          (t) => t.team === teamData.team
        );

        if (!teamAnalyticsData) return false;

        // Check if team meets ALL metric filter conditions
        return metricFilters.every((filter) => {
          let metricValue;

          // Special handling for "no losses" filter
          if (
            filter.field === "BET_TYPE" &&
            filter.value.toLowerCase().includes("double chance") &&
            filter.metric === "losses" &&
            filter.operator === "equals" &&
            filter.metricValue === "0"
          ) {
            // Find Double Chance bet type data
            const betTypeData = teamAnalyticsData.betTypeBreakdown.find((bt) =>
              bt.betType.toLowerCase().includes("double chance")
            );
            // Return true if no Double Chance losses (losses === 0)
            return betTypeData ? betTypeData.losses === 0 : false;
          }

          // Get bet type specific metrics if filtering by bet type
          if (filter.field === "BET_TYPE") {
            const betTypeData = teamAnalyticsData.betTypeBreakdown.find((bt) =>
              bt.betType.toLowerCase().includes(filter.value.toLowerCase())
            );
            metricValue = betTypeData ? betTypeData[filter.metric] : 0;
          } else {
            metricValue = teamAnalyticsData[filter.metric] || 0;
          }

          // Apply operator
          const targetValue = parseFloat(filter.metricValue);
          switch (filter.operator) {
            case "equals":
              return metricValue === targetValue;
            case "greaterThan":
              return metricValue > targetValue;
            case "lessThan":
              return metricValue < targetValue;
            case "contains":
              return metricValue.toString().includes(filter.metricValue);
            default:
              return true;
          }
        });
      });
    }

    const results = finalResults.sort((a, b) => {
      // Sort by team name first, then by country, then by league
      if (a.team !== b.team) return a.team.localeCompare(b.team);
      if (a.country !== b.country) return a.country.localeCompare(b.country);
      return a.league.localeCompare(b.league);
    });

    setQueryResults(results);
    return results;
  } catch (error) {
    console.error("Query error:", error);
    setQueryResults([]);
    return [];
  } finally {
    setIsQuerying(false);
  }
};

/**
 * Clear all query filters and results
 * @param {Function} setQueryFilters - Function to update query filters
 * @param {Function} setQueryResults - Function to set query results
 */
export const clearQuery = (setQueryFilters, setQueryResults) => {
  setQueryFilters([
    {
      field: "",
      value: "",
      metric: "",
      operator: "",
      metricValue: "",
    },
  ]);
  setQueryResults([]);
};
