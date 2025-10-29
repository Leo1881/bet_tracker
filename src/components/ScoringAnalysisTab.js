import React, { useState, useEffect } from "react";

const ScoringAnalysisTab = ({
  analyzeScoringPatterns,
  scoringAnalysisLoading,
  scoringAnalysis,
  bets,
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: "over2_5Rate",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [minGames, setMinGames] = useState(5);
  const [viewMode, setViewMode] = useState("overall"); // "overall", "home", "away"
  const [filters, setFilters] = useState({
    minOver2_5: "",
    maxOver2_5: "",
    minAvgGoals: "",
    maxAvgGoals: "",
    minOver1_5: "",
    minOver3_5: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const getConfidenceLevel = (games) => {
    if (games >= 20)
      return {
        level: "High",
        color: "text-green-400",
        bg: "bg-green-500/20 text-green-300 border border-green-500/30",
        progress: 100,
      };
    if (games >= 10)
      return {
        level: "Medium",
        color: "text-yellow-400",
        bg: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
        progress: 66,
      };
    return {
      level: "Low",
      color: "text-red-400",
      bg: "bg-red-500/20 text-red-300 border border-red-500/30",
      progress: 33,
    };
  };

  const calculateWilsonScore = (successes, total) => {
    if (total === 0) return 0;

    const n = total;
    const p = successes / total;
    const z = 1.96; // 95% confidence level

    return (
      (p +
        (z * z) / (2 * n) -
        z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) /
      (1 + (z * z) / n)
    );
  };

  const getViewModeData = (stat) => {
    switch (viewMode) {
      case "home":
        return {
          avgGoals: stat.homeAvgGoals || stat.avgGoals,
          avgGoalsScored: stat.homeAvgGoalsScored || stat.avgGoalsScored,
          over1_5Rate: stat.homeOver1_5Rate || stat.over1_5Rate,
          over2_5Rate: stat.homeOver2_5Rate || stat.over2_5Rate,
          over3_5Rate: stat.homeOver3_5Rate || stat.over3_5Rate,
          // Derived and optional metrics
          under2_5Rate: (
            100 - parseFloat(stat.homeOver2_5Rate || stat.over2_5Rate)
          ).toFixed(1),
          avgConceded: stat.homeAvgGoalsConceded || stat.avgGoalsConceded,
          totalGames: stat.homeGames || stat.totalGames,
        };
      case "away":
        return {
          avgGoals: stat.awayAvgGoals || stat.avgGoals,
          avgGoalsScored: stat.awayAvgGoalsScored || stat.avgGoalsScored,
          over1_5Rate: stat.awayOver1_5Rate || stat.over1_5Rate,
          over2_5Rate: stat.awayOver2_5Rate || stat.over2_5Rate,
          over3_5Rate: stat.awayOver3_5Rate || stat.over3_5Rate,
          // Derived and optional metrics
          under2_5Rate: (
            100 - parseFloat(stat.awayOver2_5Rate || stat.over2_5Rate)
          ).toFixed(1),
          avgConceded: stat.awayAvgGoalsConceded || stat.avgGoalsConceded,
          totalGames: stat.awayGames || stat.totalGames,
        };
      default:
        return {
          avgGoals: stat.avgGoals,
          avgGoalsScored: stat.avgGoalsScored,
          over1_5Rate: stat.over1_5Rate,
          over2_5Rate: stat.over2_5Rate,
          over3_5Rate: stat.over3_5Rate,
          // Derived and optional metrics
          under2_5Rate: (100 - parseFloat(stat.over2_5Rate)).toFixed(1),
          avgConceded: stat.avgGoalsConceded,
          totalGames: stat.totalGames,
        };
    }
  };

  const getLeagueStats = (stat) => {
    if (!scoringAnalysis || scoringAnalysis.length === 0)
      return { leagueAvg: 0, leagueRank: 0, totalTeams: 0 };

    const leagueTeams = scoringAnalysis.filter(
      (team) => team.league === stat.league && team.country === stat.country
    );

    if (leagueTeams.length === 0)
      return { leagueAvg: 0, leagueRank: 0, totalTeams: 0 };

    const leagueAvg =
      leagueTeams.reduce(
        (sum, team) => sum + parseFloat(team.over1_5Rate || 0),
        0
      ) / leagueTeams.length;

    const sortedTeams = leagueTeams.sort(
      (a, b) => parseFloat(b.over1_5Rate || 0) - parseFloat(a.over1_5Rate || 0)
    );

    const leagueRank =
      sortedTeams.findIndex((team) => team.team === stat.team) + 1;

    return {
      leagueAvg: leagueAvg.toFixed(1),
      leagueRank,
      totalTeams: leagueTeams.length,
    };
  };

  const getSortedData = () => {
    if (!scoringAnalysis || scoringAnalysis.length === 0) return [];

    let filtered = scoringAnalysis.filter((stat) => {
      const viewData = getViewModeData(stat);
      return viewData.totalGames >= minGames;
    });

    // Apply search filter if debounced search term exists
    if (debouncedSearchTerm.trim()) {
      filtered = filtered.filter(
        (stat) =>
          stat.team.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          stat.league
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          stat.country.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Apply performance filters
    filtered = filtered.filter((stat) => {
      const viewData = getViewModeData(stat);

      // Over 2.5 rate filters
      if (
        filters.minOver2_5 &&
        parseFloat(viewData.over2_5Rate) < parseFloat(filters.minOver2_5)
      ) {
        return false;
      }
      if (
        filters.maxOver2_5 &&
        parseFloat(viewData.over2_5Rate) > parseFloat(filters.maxOver2_5)
      ) {
        return false;
      }

      // Average goals filters
      if (
        filters.minAvgGoals &&
        parseFloat(viewData.avgGoals) < parseFloat(filters.minAvgGoals)
      ) {
        return false;
      }
      if (
        filters.maxAvgGoals &&
        parseFloat(viewData.avgGoals) > parseFloat(filters.maxAvgGoals)
      ) {
        return false;
      }

      // Over 1.5 and 3.5 filters
      if (
        filters.minOver1_5 &&
        parseFloat(viewData.over1_5Rate) < parseFloat(filters.minOver1_5)
      ) {
        return false;
      }
      if (
        filters.minOver3_5 &&
        parseFloat(viewData.over3_5Rate) < parseFloat(filters.minOver3_5)
      ) {
        return false;
      }

      return true;
    });

    return filtered
      .sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig.key) {
          case "totalGames":
            aValue = a.totalGames;
            bValue = b.totalGames;
            break;
          case "avgGoals":
            aValue = parseFloat(a.avgGoals);
            bValue = parseFloat(b.avgGoals);
            break;
          case "over1_5Rate":
            aValue = parseFloat(a.over1_5Rate);
            bValue = parseFloat(b.over1_5Rate);
            break;
          case "over2_5Rate":
            aValue = parseFloat(a.over2_5Rate);
            bValue = parseFloat(b.over2_5Rate);
            break;
          case "over3_5Rate":
            aValue = parseFloat(a.over3_5Rate);
            bValue = parseFloat(b.over3_5Rate);
            break;
          default:
            return 0;
        }

        if (sortConfig.direction === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      })
      .slice(0, 50);
  };
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Scoring Analysis</h3>
        <button
          onClick={analyzeScoringPatterns}
          disabled={scoringAnalysisLoading}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            scoringAnalysisLoading
              ? "bg-gray-500 text-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {scoringAnalysisLoading
            ? "🔄 Analyzing..."
            : "📊 Analyze Scoring Patterns"}
        </button>
      </div>

      {scoringAnalysis && scoringAnalysis.length > 0 ? (
        <div className="space-y-4">
          <div className="text-gray-300 mb-4">
            <p>
              📈 Team scoring patterns based on{" "}
              {bets
                ? bets.filter((bet) => bet.HOME_SCORE && bet.AWAY_SCORE).length
                : 0}{" "}
              games with scores
            </p>
          </div>

          {/* Controls */}
          <div className="mb-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search teams, leagues, or countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Minimum Games Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-300">Minimum Games:</label>
                <select
                  value={minGames}
                  onChange={(e) => setMinGames(parseInt(e.target.value))}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={3}>3+ games</option>
                  <option value={5}>5+ games</option>
                  <option value={10}>10+ games</option>
                  <option value={15}>15+ games</option>
                  <option value={20}>20+ games</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-300">View:</label>
                <div className="flex bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("overall")}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      viewMode === "overall"
                        ? "bg-blue-500 text-white"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    Overall
                  </button>
                  <button
                    onClick={() => setViewMode("home")}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      viewMode === "home"
                        ? "bg-blue-500 text-white"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => setViewMode("away")}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      viewMode === "away"
                        ? "bg-blue-500 text-white"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    Away
                  </button>
                </div>
              </div>

              <span className="text-xs text-gray-400">
                ({getSortedData().length} teams shown)
              </span>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showFilters ? "🔽 Hide Filters" : "🔽 Show Advanced Filters"}
              </button>
              {(filters.minOver2_5 ||
                filters.maxOver2_5 ||
                filters.minAvgGoals ||
                filters.maxAvgGoals ||
                filters.minOver1_5 ||
                filters.minOver3_5) && (
                <button
                  onClick={() =>
                    setFilters({
                      minOver2_5: "",
                      maxOver2_5: "",
                      minAvgGoals: "",
                      maxAvgGoals: "",
                      minOver1_5: "",
                      minOver3_5: "",
                    })
                  }
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-white/5 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Performance Filters
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Over 2.5 Rate Range */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-300">
                      Over 2.5 Rate (%)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minOver2_5}
                        onChange={(e) =>
                          setFilters({ ...filters, minOver2_5: e.target.value })
                        }
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        max="100"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxOver2_5}
                        onChange={(e) =>
                          setFilters({ ...filters, maxOver2_5: e.target.value })
                        }
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  {/* Average Goals Range */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-300">
                      Average Goals
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minAvgGoals}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            minAvgGoals: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        step="0.1"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxAvgGoals}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            maxAvgGoals: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>

                  {/* Over 1.5 and 3.5 Minimums */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-300">
                      Other Thresholds (%)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min Over 1.5"
                        value={filters.minOver1_5}
                        onChange={(e) =>
                          setFilters({ ...filters, minOver1_5: e.target.value })
                        }
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        max="100"
                      />
                      <input
                        type="number"
                        placeholder="Min Over 3.5"
                        value={filters.minOver3_5}
                        onChange={(e) =>
                          setFilters({ ...filters, minOver3_5: e.target.value })
                        }
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Status Messages */}
            {searchTerm !== debouncedSearchTerm && (
              <p className="text-sm text-blue-400">🔍 Searching...</p>
            )}
            {debouncedSearchTerm && searchTerm === debouncedSearchTerm && (
              <p className="text-sm text-gray-400">
                Showing {getSortedData().length} results for "
                {debouncedSearchTerm}"
              </p>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/20">
                <tr>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    Team
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    League
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    Confidence
                  </th>
                  <th
                    className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("totalGames")}
                  >
                    <div className="flex items-center justify-between">
                      <span>Games</span>
                      {sortConfig.key === "totalGames" && (
                        <span className="ml-2">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("avgGoals")}
                  >
                    <div className="flex items-center justify-between">
                      <span>Total Goals Avg</span>
                      {sortConfig.key === "avgGoals" && (
                        <span className="ml-2">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    Scored Avg
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    Conceded Avg
                  </th>
                  <th
                    className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("over1_5Rate")}
                  >
                    <div className="flex items-center justify-between">
                      <span>Over 1.5</span>
                      {sortConfig.key === "over1_5Rate" && (
                        <span className="ml-2">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("over2_5Rate")}
                  >
                    <div className="flex items-center justify-between">
                      <span>Over 2.5</span>
                      {sortConfig.key === "over2_5Rate" && (
                        <span className="ml-2">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("over3_5Rate")}
                  >
                    <div className="flex items-center justify-between">
                      <span>Over 3.5</span>
                      {sortConfig.key === "over3_5Rate" && (
                        <span className="ml-2">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    League Avg O1.5
                  </th>
                  <th className="px-4 py-2 text-left text-white font-semibold">
                    League Rank
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {getSortedData().map((stat, index) => {
                  const viewData = getViewModeData(stat);
                  return (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0 ? "bg-white/5" : "bg-white/10"
                      }`}
                    >
                      <td className="px-4 py-3 text-white font-medium">
                        {stat.team}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {stat.country} - {stat.league}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const confidence = getConfidenceLevel(
                            viewData.totalGames
                          );
                          return (
                            <div className="flex flex-col space-y-1">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${confidence.bg}`}
                              >
                                {confidence.level}
                              </span>
                              <div className="w-full bg-gray-700 rounded-full h-1">
                                <div
                                  className={`h-1 rounded-full transition-all duration-300 ${
                                    confidence.level === "High"
                                      ? "bg-green-400"
                                      : confidence.level === "Medium"
                                      ? "bg-yellow-400"
                                      : "bg-red-400"
                                  }`}
                                  style={{ width: `${confidence.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {viewData.totalGames}
                      </td>
                      <td className="px-4 py-3 text-blue-300 font-mono">
                        {viewData.avgGoals}
                      </td>
                      <td className="px-4 py-3 text-green-300 font-mono">
                        {viewData.avgGoalsScored}
                      </td>
                      <td className="px-4 py-3 text-rose-300 font-mono">
                        {viewData.avgConceded != null
                          ? viewData.avgConceded
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-green-300 font-mono">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span>{viewData.over1_5Rate}%</span>
                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-400 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(
                                    parseFloat(viewData.over1_5Rate),
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            Wilson:{" "}
                            {(() => {
                              const over1_5Games = Math.round(
                                (parseFloat(viewData.over1_5Rate) / 100) *
                                  viewData.totalGames
                              );
                              const wilsonScore = calculateWilsonScore(
                                over1_5Games,
                                viewData.totalGames
                              );
                              return `${(wilsonScore * 100).toFixed(1)}%`;
                            })()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-yellow-300 font-mono">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span>{viewData.over2_5Rate}%</span>
                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(
                                    parseFloat(viewData.over2_5Rate),
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            Wilson:{" "}
                            {(() => {
                              const over2_5Games = Math.round(
                                (parseFloat(viewData.over2_5Rate) / 100) *
                                  viewData.totalGames
                              );
                              const wilsonScore = calculateWilsonScore(
                                over2_5Games,
                                viewData.totalGames
                              );
                              return `${(wilsonScore * 100).toFixed(1)}%`;
                            })()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-orange-300 font-mono">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span>{viewData.over3_5Rate}%</span>
                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-orange-400 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(
                                    parseFloat(viewData.over3_5Rate),
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            Wilson:{" "}
                            {(() => {
                              const over3_5Games = Math.round(
                                (parseFloat(viewData.over3_5Rate) / 100) *
                                  viewData.totalGames
                              );
                              const wilsonScore = calculateWilsonScore(
                                over3_5Games,
                                viewData.totalGames
                              );
                              return `${(wilsonScore * 100).toFixed(1)}%`;
                            })()}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-purple-300 font-mono">
                        {(() => {
                          const leagueStats = getLeagueStats(stat);
                          return `${leagueStats.leagueAvg}%`;
                        })()}
                      </td>
                      <td className="px-4 py-3 text-indigo-300 font-mono">
                        {(() => {
                          const leagueStats = getLeagueStats(stat);
                          return `${leagueStats.leagueRank}/${leagueStats.totalTeams}`;
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Recommendation Sections */}
          <div className="mt-8 space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Team Recommendations
            </h3>

            {/* Good Over Teams */}
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-300 mb-3 flex items-center">
                🎯 Good Over Teams
                <span className="ml-2 text-sm text-gray-400">
                  (High Over 2.5 rate, good sample size)
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {getSortedData()
                  .filter((stat) => {
                    const viewData = getViewModeData(stat);
                    return (
                      viewData.totalGames >= 10 &&
                      parseFloat(viewData.over2_5Rate) >= 60 &&
                      parseFloat(viewData.avgGoals) >= 2.0
                    );
                  })
                  .slice(0, 6)
                  .map((stat, index) => {
                    const viewData = getViewModeData(stat);
                    return (
                      <div
                        key={index}
                        className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-white text-sm">
                              {stat.team}
                            </div>
                            <div className="text-xs text-gray-400">
                              {stat.league}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-300 font-mono text-sm">
                              {viewData.over2_5Rate}%
                            </div>
                            <div className="text-xs text-gray-400">
                              {viewData.avgGoals} goals
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Avoid Over Teams */}
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-red-300 mb-3 flex items-center">
                ⚠️ Avoid Over Teams
                <span className="ml-2 text-sm text-gray-400">
                  (Low Over 2.5 rate, good sample size)
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {getSortedData()
                  .filter((stat) => {
                    const viewData = getViewModeData(stat);
                    return (
                      viewData.totalGames >= 10 &&
                      parseFloat(viewData.over2_5Rate) <= 40 &&
                      parseFloat(viewData.avgGoals) <= 1.5
                    );
                  })
                  .slice(0, 6)
                  .map((stat, index) => {
                    const viewData = getViewModeData(stat);
                    return (
                      <div
                        key={index}
                        className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-white text-sm">
                              {stat.team}
                            </div>
                            <div className="text-xs text-gray-400">
                              {stat.league}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-red-300 font-mono text-sm">
                              {viewData.over2_5Rate}%
                            </div>
                            <div className="text-xs text-gray-400">
                              {viewData.avgGoals} goals
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* High-Scoring Teams */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
                ⚡ High-Scoring Teams
                <span className="ml-2 text-sm text-gray-400">
                  (High average goals, good sample size)
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {getSortedData()
                  .filter((stat) => {
                    const viewData = getViewModeData(stat);
                    return (
                      viewData.totalGames >= 8 &&
                      parseFloat(viewData.avgGoals) >= 2.5
                    );
                  })
                  .sort((a, b) => {
                    const aGoals = parseFloat(getViewModeData(a).avgGoals);
                    const bGoals = parseFloat(getViewModeData(b).avgGoals);
                    return bGoals - aGoals;
                  })
                  .slice(0, 6)
                  .map((stat, index) => {
                    const viewData = getViewModeData(stat);
                    return (
                      <div
                        key={index}
                        className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-white text-sm">
                              {stat.team}
                            </div>
                            <div className="text-xs text-gray-400">
                              {stat.league}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-blue-300 font-mono text-sm">
                              {viewData.avgGoals}
                            </div>
                            <div className="text-xs text-gray-400">
                              {viewData.over2_5Rate}% O2.5
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Trends & Streaks Section */}
          <div className="mt-8 space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Trends & Streaks Analysis
            </h3>

            {/* Current Streaks */}
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-purple-300 mb-3 flex items-center">
                🔥 Current Streaks
                <span className="ml-2 text-sm text-gray-400">
                  (Consecutive Over/Under games)
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {getSortedData()
                  .filter((stat) => {
                    const viewData = getViewModeData(stat);
                    return viewData.totalGames >= 8;
                  })
                  .sort((a, b) => {
                    const aData = getViewModeData(a);
                    const bData = getViewModeData(b);
                    return (
                      parseFloat(bData.over1_5Rate) -
                      parseFloat(aData.over1_5Rate)
                    );
                  })
                  .slice(0, 6)
                  .map((stat, index) => {
                    const viewData = getViewModeData(stat);
                    const overRate = parseFloat(viewData.over1_5Rate);
                    const streakType =
                      overRate >= 70
                        ? "Over"
                        : overRate <= 30
                        ? "Under"
                        : "Mixed";
                    const streakStrength = Math.abs(overRate - 50);

                    return (
                      <div
                        key={index}
                        className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-white text-sm">
                              {stat.team}
                            </div>
                            <div className="text-xs text-gray-400">
                              {stat.league}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-sm font-mono ${
                                streakType === "Over"
                                  ? "text-green-300"
                                  : streakType === "Under"
                                  ? "text-red-300"
                                  : "text-yellow-300"
                              }`}
                            >
                              {streakType} {streakStrength.toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-400">
                              {viewData.totalGames} games
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Performance Trends */}
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-indigo-300 mb-3 flex items-center">
                📈 Performance Trends
                <span className="ml-2 text-sm text-gray-400">
                  (Teams with notable patterns)
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {getSortedData()
                  .filter((stat) => {
                    const viewData = getViewModeData(stat);
                    return viewData.totalGames >= 10;
                  })
                  .sort((a, b) => {
                    const aData = getViewModeData(a);
                    const bData = getViewModeData(b);
                    return (
                      parseFloat(bData.over1_5Rate) -
                      parseFloat(aData.over1_5Rate)
                    );
                  })
                  .slice(0, 6)
                  .map((stat, index) => {
                    const viewData = getViewModeData(stat);
                    const overRate = parseFloat(viewData.over1_5Rate);
                    const avgGoals = parseFloat(viewData.avgGoals);
                    const conceded = parseFloat(viewData.avgConceded || 0);

                    let trend = "Stable";
                    let trendColor = "text-gray-300";

                    if (overRate >= 75 && avgGoals >= 2.5) {
                      trend = "High-Scoring";
                      trendColor = "text-green-300";
                    } else if (overRate <= 25 && avgGoals <= 1.5) {
                      trend = "Low-Scoring";
                      trendColor = "text-red-300";
                    } else if (conceded <= 1.0 && avgGoals >= 2.0) {
                      trend = "Attacking";
                      trendColor = "text-blue-300";
                    } else if (conceded <= 0.8) {
                      trend = "Defensive";
                      trendColor = "text-purple-300";
                    }

                    return (
                      <div
                        key={index}
                        className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-white text-sm">
                              {stat.team}
                            </div>
                            <div className="text-xs text-gray-400">
                              {stat.league}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-sm font-medium ${trendColor}`}
                            >
                              {trend}
                            </div>
                            <div className="text-xs text-gray-400">
                              {overRate.toFixed(0)}% O1.5
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {getSortedData().map((stat, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Team
                    </span>
                    <span className="text-white font-medium text-sm">
                      {stat.team}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      League
                    </span>
                    <span className="text-gray-300 text-sm">
                      {stat.country} - {stat.league}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Confidence
                    </span>
                    {(() => {
                      const confidence = getConfidenceLevel(stat.totalGames);
                      return (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${confidence.bg}`}
                        >
                          {confidence.level}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Games
                    </span>
                    <span className="text-gray-300 text-sm">
                      {stat.totalGames}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total Goals Avg
                    </span>
                    <span className="text-blue-300 font-mono text-sm">
                      {stat.avgGoals}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Scored Avg
                    </span>
                    <span className="text-green-300 font-mono text-sm">
                      {stat.avgGoalsScored}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Goals Conceded
                    </span>
                    <span className="text-rose-300 font-mono text-sm">
                      {stat.avgGoalsConceded}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      League Avg O1.5
                    </span>
                    <span className="text-purple-300 font-mono text-sm">
                      {(() => {
                        const leagueStats = getLeagueStats(stat);
                        return `${leagueStats.leagueAvg}%`;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      League Rank
                    </span>
                    <span className="text-indigo-300 font-mono text-sm">
                      {(() => {
                        const leagueStats = getLeagueStats(stat);
                        return `${leagueStats.leagueRank}/${leagueStats.totalTeams}`;
                      })()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Over 1.5</div>
                      <div className="text-green-300 font-mono text-sm mb-1">
                        {stat.over1_5Rate}%
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1 mb-1">
                        <div
                          className="bg-green-400 h-1 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              parseFloat(stat.over1_5Rate),
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Wilson:{" "}
                        {(() => {
                          const over1_5Games = Math.round(
                            (parseFloat(stat.over1_5Rate) / 100) *
                              stat.totalGames
                          );
                          const wilsonScore = calculateWilsonScore(
                            over1_5Games,
                            stat.totalGames
                          );
                          return `${(wilsonScore * 100).toFixed(1)}%`;
                        })()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Over 2.5</div>
                      <div className="text-yellow-300 font-mono text-sm mb-1">
                        {stat.over2_5Rate}%
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1 mb-1">
                        <div
                          className="bg-yellow-400 h-1 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              parseFloat(stat.over2_5Rate),
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Wilson:{" "}
                        {(() => {
                          const over2_5Games = Math.round(
                            (parseFloat(stat.over2_5Rate) / 100) *
                              stat.totalGames
                          );
                          const wilsonScore = calculateWilsonScore(
                            over2_5Games,
                            stat.totalGames
                          );
                          return `${(wilsonScore * 100).toFixed(1)}%`;
                        })()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Over 3.5</div>
                      <div className="text-orange-300 font-mono text-sm mb-1">
                        {stat.over3_5Rate}%
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1 mb-1">
                        <div
                          className="bg-orange-400 h-1 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              parseFloat(stat.over3_5Rate),
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Wilson:{" "}
                        {(() => {
                          const over3_5Games = Math.round(
                            (parseFloat(stat.over3_5Rate) / 100) *
                              stat.totalGames
                          );
                          const wilsonScore = calculateWilsonScore(
                            over3_5Games,
                            stat.totalGames
                          );
                          return `${(wilsonScore * 100).toFixed(1)}%`;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-4">
            📊 No Scoring Analysis Available
          </div>
          <p className="text-gray-500">
            Click "Analyze Scoring Patterns" to generate scoring analysis based
            on your historical data.
          </p>
        </div>
      )}
    </div>
  );
};

export default ScoringAnalysisTab;
