import React, { useEffect, useState, useCallback } from "react";
import { fetchNewBets, fetchSheetData } from "./utils/fetchSheetData";
import { applyFilters } from "./utils/dataProcessingUtils";
import { useAppState } from "./hooks/useAppState";
import { useAnalytics } from "./hooks/useAnalytics";
import { useSorting } from "./hooks/useSorting";
import { useTeamHistory } from "./hooks/useTeamHistory";
import { useDataProcessing } from "./hooks/useDataProcessing";
import { useUtility } from "./hooks/useUtility";
import { useAnalysis } from "./hooks/useAnalysis";
import { usePrediction } from "./hooks/usePrediction";
import { useBetAnalysis } from "./hooks/useBetAnalysis";
import { useQuery } from "./hooks/useQuery";
import { usePDF } from "./hooks/usePDF";
import { useAnalyticsFunctions } from "./hooks/useAnalyticsFunctions";
import { getOddsAnalytics as getOddsAnalyticsService } from "./services/oddsAnalyticsService";
import "./App.css";
import FilterControls from "./components/FilterControls";
import TabNavigation from "./components/TabNavigation";
import DataTab from "./components/DataTab";
import AnalyticsTab from "./components/AnalyticsTab";
import PerformanceTab from "./components/PerformanceTab";
import BlacklistTab from "./components/BlacklistTab";
import OddsTab from "./components/OddsTab";
import BetAnalysisTab from "./components/BetAnalysisTab";
import RecommendationsTab from "./components/RecommendationsTab";
import QueryTab from "./components/QueryTab";
import BetSlipsTab from "./components/BetSlipsTab";
import TopTeamsTab from "./components/TopTeamsTab";
import TeamAnalyticsTab from "./components/TeamAnalyticsTab";
import DailyGamesTab from "./components/DailyGamesTab";
import ScoringAnalysisTab from "./components/ScoringAnalysisTab";
import HeadToHeadTab from "./components/HeadToHeadTab";
import PredictionAccuracyTab from "./components/PredictionAccuracyTab";
import TeamNotesTab from "./components/TeamNotesTab";
import RecommendationAnalysisTab from "./components/RecommendationAnalysisTab";
import TeamUploadTab from "./components/TeamUploadTab";
import QuickLookupTab from "./components/QuickLookupTab";

function App() {
  // Use custom hook for state management
  const {
    // Data state
    bets,
    setFilteredBets,
    blacklistedTeams,
    teamNotes,
    setNewBets,
    analysisResults,
    setAnalysisResults,
    betRecommendations,
    setBetRecommendations,
    dailyGames,
    attachedPredictions,
    setAttachedPredictions,

    // UI state
    isAnalyzing,
    setIsAnalyzing,
    showCompletedSlips,
    setShowCompletedSlips,
    dataViewLoaded,
    setDataViewLoaded,
    loading,
    error,
    showFilters,
    setShowFilters,
    activeTab,
    setActiveTab,
    dailyGamesLoading,
    scoringAnalysisLoading,
    setScoringAnalysisLoading,

    // Sort configurations
    sortConfig,
    setSortConfig,
    leagueSortConfig,
    setLeagueSortConfig,
    countrySortConfig,
    setCountrySortConfig,
    blacklistSortConfig,
    setBlacklistSortConfig,
    oddsSortConfig,
    setOddsSortConfig,
    analyticsSortConfig,
    setAnalyticsSortConfig,
    analysisSortConfig,
    setAnalysisSortConfig,
    slipsSortConfig,
    setSlipsSortConfig,
    teamNotesSortConfig,
    setTeamNotesSortConfig,

    // Filters state
    filters,
    setFilters,

    // Query state
    queryFilters,
    setQueryFilters,
    isQuerying,
    setIsQuerying,
    queryResults,
    setQueryResults,

    // Expansion states
    expandedAnalyticsTeams,
    setExpandedAnalyticsTeams,
    expandedOddsRanges,
    setExpandedOddsRanges,
    expandedSlips,
    setExpandedSlips,
    expandedBetTypes,
    setExpandedBetTypes,

    // Analysis state
    scoringAnalysis,
    setScoringAnalysis,
  } = useAppState();
  // Additional state not covered by useAppState
  const [storedPredictions, setStoredPredictions] = useState([]);
  const [isUpdatingDatabase, setIsUpdatingDatabase] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [scoringSortConfig, setScoringSortConfig] = useState({
    key: "totalGames",
    direction: "desc",
  });

  const applyFiltersCallback = useCallback(() => {
    const filtered = applyFilters(bets, filters);
    setFilteredBets(filtered);
  }, [bets, filters, setFilteredBets]);

  // Apply filters when bets or filters change
  useEffect(() => {
    applyFiltersCallback();
  }, [applyFiltersCallback]);

  // Use the sorting hook for all sort handlers
  const {
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
  } = useSorting(
    {
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
    },
    {
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
    }
  );

  const getSortedLeagueDataLocal = () => {
    const leagueData = getLeagueAnalytics();
    return getSortedLeagueData(leagueData, leagueSortConfig);
  };

  const getSortedCountryDataLocal = () => {
    const countryData = getCountryAnalytics();
    return getSortedCountryData(countryData, countrySortConfig);
  };

  const getSortedOddsDataLocal = () => {
    const oddsData = getOddsAnalytics();
    return getSortedOddsData(oddsData, oddsSortConfig);
  };

  // Local wrapper for getSortedData
  const getSortedDataLocal = () => {
    return getSortedData(getDeduplicatedFilteredBets(), sortConfig);
  };

  const getSortedAnalysisResultsLocal = () => {
    return getSortedAnalysisResults(analysisResults, analysisSortConfig);
  };

  const getSortedSlipsDataLocal = () => {
    const slipsData = getBetSlips();
    return getSortedSlipsData(
      slipsData,
      slipsSortConfig,
      filters.status,
      showCompletedSlips
    );
  };

  // eslint-disable-next-line no-unused-vars
  const getOddsAnalytics = () => {
    return getOddsAnalyticsService(getDeduplicatedBetsForAnalysis);
  };

  const getFilteredOddsAnalytics = () => {
    const oddsRanges = {
      "1.0-1.5": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
      "1.5-2.0": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
      "2.0-3.0": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
      "3.0-5.0": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
      "5.0+": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
    };

    console.log("Total bets to analyze for odds analytics:", bets.length);

    bets.forEach((bet, index) => {
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
        console.log(
          `Skipping bet for odds analytics - excluded: ${bet.BET_TYPE} | ${bet.BET_SELECTION} | ${bet.TEAM_INCLUDED}`
        );
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

  const getBetsForOddsRange = (range) => {
    const deduplicatedBets = getDeduplicatedBetsForAnalysis;
    console.log(
      `Getting bets for range ${range}, total deduplicated bets: ${deduplicatedBets.length}`
    );

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

    console.log(`Bets found for range ${range}:`, filteredBets.length);
    console.log("Sample bets for debugging:", filteredBets.slice(0, 3));

    // Additional deduplication step for the expanded view
    const uniqueBets = new Map();
    filteredBets.forEach((bet) => {
      const uniqueKey = `${bet.DATE}_${bet.HOME_TEAM}_${bet.AWAY_TEAM}_${bet.LEAGUE}_${bet.BET_TYPE}_${bet.TEAM_INCLUDED}`;
      if (!uniqueBets.has(uniqueKey)) {
        uniqueBets.set(uniqueKey, bet);
      }
    });

    const finalBets = Array.from(uniqueBets.values());
    console.log(
      `After additional deduplication: ${filteredBets.length} -> ${finalBets.length} bets`
    );

    return finalBets;
  };

  const toggleOddsRangeExpansion = (range) => {
    const newExpanded = new Set(expandedOddsRanges);
    if (newExpanded.has(range)) {
      newExpanded.delete(range);
    } else {
      newExpanded.add(range);
    }
    setExpandedOddsRanges(newExpanded);
  };

  const toggleSlipExpansion = (betId) => {
    const newExpanded = new Set(expandedSlips);
    if (newExpanded.has(betId)) {
      newExpanded.delete(betId);
    } else {
      newExpanded.add(betId);
    }
    setExpandedSlips(newExpanded);
  };

  const toggleTeamExpansion = (team) => {
    const newExpanded = new Set(expandedBetTypes);
    if (newExpanded.has(team)) {
      newExpanded.delete(team);
    } else {
      newExpanded.add(team);
    }
    setExpandedBetTypes(newExpanded);
  };

  const toggleAnalyticsTeamExpansion = useCallback(
    (team) => {
      const newExpanded = new Set(expandedAnalyticsTeams);
      if (newExpanded.has(team)) {
        newExpanded.delete(team);
      } else {
        newExpanded.add(team);
      }
      setExpandedAnalyticsTeams(newExpanded);
    },
    [expandedAnalyticsTeams, setExpandedAnalyticsTeams]
  );

  // Get deduplicated bets for team performance analytics
  // eslint-disable-next-line no-unused-vars
  const getDeduplicatedBets = () => {
    const uniqueBets = new Map();

    bets.forEach((bet) => {
      // Create a unique key for each bet: DATE + HOME_TEAM + AWAY_TEAM + LEAGUE + BET_TYPE + TEAM_INCLUDED + BET_ID
      const uniqueKey = `${bet.DATE}_${bet.HOME_TEAM}_${bet.AWAY_TEAM}_${
        bet.LEAGUE
      }_${bet.BET_TYPE}_${bet.TEAM_INCLUDED}_${bet.BET_ID || "NO_ID"}`;

      // Only add if this unique combination doesn't exist yet
      if (!uniqueBets.has(uniqueKey)) {
        uniqueBets.set(uniqueKey, bet);
      } else {
        console.log("Duplicate found with key:", uniqueKey);
        const originalBet = uniqueBets.get(uniqueKey);
        console.log("Original bet fields:", {
          DATE: originalBet.DATE,
          HOME_TEAM: originalBet.HOME_TEAM,
          AWAY_TEAM: originalBet.AWAY_TEAM,
          LEAGUE: originalBet.LEAGUE,
          BET_TYPE: originalBet.BET_TYPE,
          TEAM_INCLUDED: originalBet.TEAM_INCLUDED,
        });
        console.log("Duplicate bet fields:", {
          DATE: bet.DATE,
          HOME_TEAM: bet.HOME_TEAM,
          AWAY_TEAM: bet.AWAY_TEAM,
          LEAGUE: bet.LEAGUE,
          BET_TYPE: bet.BET_TYPE,
          TEAM_INCLUDED: bet.TEAM_INCLUDED,
        });
      }
    });

    const result = Array.from(uniqueBets.values());
    console.log(
      `Deduplication: ${bets.length} original bets -> ${result.length} unique bets`
    );
    return result;
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return Object.values(filters).some((value) => value !== "");
  };

  // Handle filter changes and trigger data loading
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };

    // Clear league filter when country changes
    if (filterType === "country") {
      newFilters.league = "";
    }

    setFilters(newFilters);

    // Check if any filters are now active
    const hasFilters = Object.values(newFilters).some((val) => val !== "");
    if (hasFilters && !dataViewLoaded) {
      setDataViewLoaded(true);
    }
  };

  // Get deduplicated filtered bets for stats cards
  const getDeduplicatedFilteredBets = () => {
    const deduplicatedBets = getDeduplicatedBetsForAnalysis;

    // Apply the same filters as the main filteredBets
    let filtered = [...deduplicatedBets];

    if (filters.team) {
      filtered = filtered.filter(
        (bet) =>
          bet.HOME_TEAM?.toLowerCase() === filters.team.toLowerCase() ||
          bet.AWAY_TEAM?.toLowerCase() === filters.team.toLowerCase() ||
          bet.TEAM_INCLUDED?.toLowerCase() === filters.team.toLowerCase()
      );
    }

    if (filters.betType) {
      filtered = filtered.filter((bet) =>
        bet.BET_TYPE?.toLowerCase().includes(filters.betType.toLowerCase())
      );
    }

    if (filters.betSelection) {
      filtered = filtered.filter((bet) =>
        bet.BET_SELECTION?.toLowerCase().includes(
          filters.betSelection.toLowerCase()
        )
      );
    }

    if (filters.country) {
      filtered = filtered.filter((bet) =>
        bet.COUNTRY?.toLowerCase().includes(filters.country.toLowerCase())
      );
    }

    if (filters.league) {
      filtered = filtered.filter((bet) =>
        bet.LEAGUE?.toLowerCase().includes(filters.league.toLowerCase())
      );
    }

    if (filters.result) {
      filtered = filtered.filter((bet) =>
        bet.RESULT?.toLowerCase().includes(filters.result.toLowerCase())
      );
    }

    if (filters.minWinRate || filters.maxWinRate) {
      const teamStats = teamAnalytics;
      const teamWinRates = {};

      teamStats.forEach((team) => {
        teamWinRates[team.team] = parseFloat(team.winRate);
      });

      filtered = filtered.filter((bet) => {
        const teamName = bet.TEAM_INCLUDED || bet.HOME_TEAM || bet.AWAY_TEAM;
        const winRate = teamWinRates[teamName] || 0;

        if (filters.minWinRate && winRate < parseFloat(filters.minWinRate)) {
          return false;
        }
        if (filters.maxWinRate && winRate > parseFloat(filters.maxWinRate)) {
          return false;
        }
        return true;
      });
    }

    return filtered;
  };

  // eslint-disable-next-line no-unused-vars
  const isTeamBlacklisted = (teamName) => {
    if (!teamName || !blacklistedTeams.length) return false;
    const normalizedTeamName = teamName.toLowerCase().trim();
    return blacklistedTeams.some((blacklistedTeam) => {
      // Handle both string and object formats
      const teamToCheck =
        typeof blacklistedTeam === "string"
          ? blacklistedTeam
          : blacklistedTeam.TEAM_NAME;

      if (!teamToCheck) return false;

      const normalizedBlacklistedTeam = teamToCheck.toLowerCase().trim();
      return (
        normalizedTeamName.includes(normalizedBlacklistedTeam) ||
        normalizedBlacklistedTeam.includes(normalizedTeamName)
      );
    });
  };

  const getUniqueValues = (field, context = {}) => {
    const deduplicatedBets = getDeduplicatedBetsForAnalysis;
    let values = deduplicatedBets.map((bet) => bet[field]).filter(Boolean);

    // Apply context filtering
    if (context.country && field === "LEAGUE") {
      values = deduplicatedBets
        .filter((bet) => bet.COUNTRY === context.country)
        .map((bet) => bet[field])
        .filter(Boolean);
    }

    console.log(`Getting unique values for field: ${field}`, context);
    console.log(`Raw values:`, values);

    // Filter out header row data
    const filteredValues = values.filter((value) => {
      const lowerValue = value.toLowerCase();
      // Exclude common header names
      if (
        lowerValue === "team_included" ||
        lowerValue === "home_team" ||
        lowerValue === "away_team" ||
        lowerValue === "team" ||
        lowerValue === "team included" ||
        lowerValue === "home team" ||
        lowerValue === "away team" ||
        lowerValue === "bet_type" ||
        lowerValue === "bet selection" ||
        lowerValue === "bet type" ||
        lowerValue === "country" ||
        lowerValue === "league" ||
        lowerValue === "date" ||
        lowerValue === "result" ||
        lowerValue === "reason" ||
        lowerValue === "odds1" ||
        lowerValue === "odds2"
      ) {
        return false;
      }
      return true;
    });

    console.log(`Filtered values for ${field}:`, filteredValues);
    return [...new Set(filteredValues)].sort();
  };

  // Confidence Scoring Functions

  // Store recommendations for accuracy tracking
  const storeRecommendations = async (analysisResults) => {
    try {
      // For now, we'll store recommendations in localStorage
      // In a full implementation, this would update Google Sheets
      const recommendations = analysisResults.map((result) => ({
        BET_ID: result.BET_ID || "",
        DATE: result.DATE || "",
        HOME_TEAM: result.HOME_TEAM || "",
        AWAY_TEAM: result.AWAY_TEAM || "",
        BET_TYPE: result.BET_TYPE || "",
        TEAM_INCLUDED: result.TEAM_INCLUDED || "",
        SYSTEM_RECOMMENDATION: result.recommendation || "",
        SYSTEM_CONFIDENCE: result.confidenceScore || 0,
        PREDICTION_ACCURATE: "Pending",
        RECOMMENDATION_FOLLOWED: "",
      }));

      localStorage.setItem(
        "betRecommendations",
        JSON.stringify(recommendations)
      );
      console.log(
        "Stored recommendations for accuracy tracking:",
        recommendations.length
      );
    } catch (error) {
      console.error("Error storing recommendations:", error);
    }
  };

  // Store predictions from analysis
  const storePredictions = (analysisResults) => {
    const today = new Date().toISOString().split("T")[0];
    const predictions = {
      id: `pred_${Date.now()}`,
      date: today,
      timestamp: new Date().toISOString(),
      games: analysisResults.map((result) => ({
        home_team: result.HOME_TEAM,
        away_team: result.AWAY_TEAM,
        country: result.COUNTRY,
        league: result.LEAGUE,
        team_included: result.TEAM_INCLUDED,
        bet_type: result.BET_TYPE,
        bet_selection: result.BET_SELECTION,
        odds1: result.ODDS1,
        odds2: result.ODDS2,
        oddsX: result.ODDSX,
        probabilities: result.probabilities,
        confidenceScore: result.confidenceScore,
        confidenceBreakdown: result.confidenceBreakdown,
        confidenceLabel: result.confidenceLabel,
        recommendation: result.recommendation,
      })),
    };

    setStoredPredictions((prev) => {
      const filtered = prev.filter((p) => p.date !== today);
      return [...filtered, predictions];
    });
  };

  // Get today's stored predictions
  const getTodayPredictions = () => {
    const today = new Date().toISOString().split("T")[0];
    const stored = storedPredictions.find((p) => p.date === today);

    // If we have stored predictions, use them
    if (stored) {
      return stored;
    }

    // If we have current analysis results, create predictions from them
    if (analysisResults && analysisResults.length > 0) {
      return {
        date: today,
        games: analysisResults.map((result) => ({
          home_team: result.homeTeam,
          away_team: result.awayTeam,
          team_included: result.teamIncluded,
          confidenceScore: result.confidenceScore,
          confidenceBreakdown: result.confidenceBreakdown,
          confidenceLabel: result.confidenceLabel,
          recommendation: result.recommendation,
        })),
      };
    }

    return null;
  };

  // Get prediction accuracy metrics from database recommendations
  const getPredictionAccuracyMetrics = async () => {
    try {
      // Fetch database recommendations
      const dbResponse = await fetch("/api/recommendations");
      if (!dbResponse.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const dbRecommendations = await dbResponse.json();
      console.log(
        "Fetched database recommendations:",
        dbRecommendations.length
      );
      console.log("First few recommendations:", dbRecommendations.slice(0, 3));

      // Include all recommendations (even those without results yet)
      const recommendationsWithResults = dbRecommendations;

      console.log(
        "Recommendations with results:",
        recommendationsWithResults.length
      );

      if (recommendationsWithResults.length === 0) {
        return {
          totalPredictions: 0,
          correctPredictions: 0,
          overallAccuracy: 0,
          byConfidence: {},
          byBetType: {},
          byRecommendationType: {},
        };
      }

      // Calculate accuracy based on system recommendation vs actual game outcome
      const calculateSystemAccuracy = (
        recommendation,
        actualResult,
        recommendationType
      ) => {
        if (!recommendation || !actualResult) {
          console.log("Missing data:", {
            recommendation,
            actualResult,
            recommendationType,
          });
          return false;
        }

        const rec = recommendation.toLowerCase();
        const result = actualResult.toLowerCase();

        console.log("Checking accuracy:", { rec, result, recommendationType });

        // System recommended Home Win and home team won
        if (rec.includes("home win") && result.includes("win")) {
          console.log("✅ Home Win correct");
          return true;
        }

        // System recommended Away Win and away team won
        if (rec.includes("away win") && result.includes("win")) {
          console.log("✅ Away Win correct");
          return true;
        }

        // System recommended Double Chance Home and home team won or drew
        if (
          rec.includes("double chance home") &&
          (result.includes("win") || result.includes("draw"))
        ) {
          console.log("✅ Double Chance Home correct");
          return true;
        }

        // System recommended Double Chance Away and away team won or drew
        if (
          rec.includes("double chance away") &&
          (result.includes("win") || result.includes("draw"))
        ) {
          console.log("✅ Double Chance Away correct");
          return true;
        }

        // System recommended Avoid and team lost
        if (rec.includes("avoid") && result.includes("loss")) {
          console.log("✅ Avoid correct");
          return true;
        }

        // System recommended Over and goals were over the line
        if (rec.includes("over") && result.includes("win")) {
          console.log("✅ Over correct");
          return true;
        }

        // System recommended Under and goals were under the line
        if (rec.includes("under") && result.includes("win")) {
          console.log("✅ Under correct");
          return true;
        }

        console.log("❌ No match found");
        return false;
      };

      // Calculate overall accuracy based on system recommendations vs actual outcomes
      const totalPredictions = recommendationsWithResults.length;
      const correctPredictions = recommendationsWithResults.filter((rec) =>
        calculateSystemAccuracy(
          rec.recommendation,
          rec.actual_result,
          rec.recommendation_type
        )
      ).length;
      const overallAccuracy =
        totalPredictions > 0
          ? (correctPredictions / totalPredictions) * 100
          : 0;

      // Group by confidence score ranges
      const confidenceGroups = {
        "High (8-10)": recommendationsWithResults.filter(
          (rec) => rec.confidence_score >= 8
        ),
        "Medium (6-7)": recommendationsWithResults.filter(
          (rec) => rec.confidence_score >= 6 && rec.confidence_score < 8
        ),
        "Low (4-5)": recommendationsWithResults.filter(
          (rec) => rec.confidence_score >= 4 && rec.confidence_score < 6
        ),
        "Very Low (1-3)": recommendationsWithResults.filter(
          (rec) => rec.confidence_score < 4
        ),
      };

      // Calculate accuracy for each confidence group using system accuracy
      const calculateGroupAccuracy = (group) => {
        const correct = group.filter((rec) =>
          calculateSystemAccuracy(
            rec.recommendation,
            rec.actual_result,
            rec.recommendation_type
          )
        ).length;
        return group.length > 0 ? (correct / group.length) * 100 : 0;
      };

      // Group by system recommendation type (what the system predicted)
      const categorizeSystemRecommendation = (recommendation) => {
        if (!recommendation) return "Unknown";

        const rec = recommendation.toLowerCase();

        // Win recommendations (team names)
        if (
          rec.includes("win") &&
          !rec.includes("double chance") &&
          !rec.includes("no clear")
        ) {
          return "Win";
        }

        // Double Chance recommendations
        if (rec.includes("double chance") || rec.includes(" or draw")) {
          return "Double Chance";
        }

        // Over/Under recommendations - specific lines
        if (rec.includes("over 1.5")) {
          return "Over 1.5";
        }
        if (rec.includes("over 2.5")) {
          return "Over 2.5";
        }
        if (rec.includes("over 3.5")) {
          return "Over 3.5";
        }
        if (rec.includes("over 4.5")) {
          return "Over 4.5";
        }
        if (rec.includes("under 1.5")) {
          return "Under 1.5";
        }
        if (rec.includes("under 2.5")) {
          return "Under 2.5";
        }
        if (rec.includes("under 3.5")) {
          return "Under 3.5";
        }
        if (rec.includes("under 4.5")) {
          return "Under 4.5";
        }
        // Fallback for other over/under
        if (rec.includes("over")) {
          return "Over Other";
        }
        if (rec.includes("under")) {
          return "Under Other";
        }

        // Avoid recommendations
        if (rec.includes("avoid")) {
          return "Avoid";
        }

        // No clear winner/trend
        if (rec.includes("no clear") || rec.includes("no trend")) {
          return "No Clear Winner";
        }

        // Team name recommendations (fallback for team names)
        if (
          rec.length > 2 &&
          !rec.includes("over") &&
          !rec.includes("under") &&
          !rec.includes("double chance") &&
          !rec.includes("no clear") &&
          !rec.includes("no trend")
        ) {
          return "Win";
        }

        // Default fallback
        return "Other";
      };

      const systemRecommendationGroups = {};
      recommendationsWithResults.forEach((rec) => {
        const recCategory = categorizeSystemRecommendation(rec.recommendation);
        console.log(
          `Recommendation: "${rec.recommendation}" -> Category: "${recCategory}"`
        );
        if (!systemRecommendationGroups[recCategory]) {
          systemRecommendationGroups[recCategory] = [];
        }
        systemRecommendationGroups[recCategory].push(rec);
      });

      console.log(
        "System recommendation groups:",
        Object.keys(systemRecommendationGroups)
      );
      console.log(
        "Group counts:",
        Object.entries(systemRecommendationGroups).map(
          ([key, value]) => `${key}: ${value.length}`
        )
      );

      // Calculate accuracy by system recommendation type using system accuracy
      const accuracyByBetType = {};
      Object.keys(systemRecommendationGroups).forEach((recCategory) => {
        const group = systemRecommendationGroups[recCategory];
        const correct = group.filter((rec) => {
          // Only count as correct if there's an actual result
          if (!rec.actual_result || rec.actual_result.trim() === "") {
            return false; // Pending results don't count as correct
          }
          return calculateSystemAccuracy(
            rec.recommendation,
            rec.actual_result,
            rec.recommendation_type
          );
        }).length;
        const pending = group.filter(
          (rec) => !rec.actual_result || rec.actual_result.trim() === ""
        ).length;
        accuracyByBetType[recCategory] = {
          total: group.length,
          correct: correct,
          pending: pending,
          accuracy: group.length > 0 ? (correct / group.length) * 100 : 0,
        };
      });

      // Group by recommendation type (team names)
      const recommendationGroups = {};
      recommendationsWithResults.forEach((rec) => {
        const recType = rec.recommendation || "Unknown";
        if (!recommendationGroups[recType]) {
          recommendationGroups[recType] = [];
        }
        recommendationGroups[recType].push(rec);
      });

      // Calculate accuracy by recommendation type using system accuracy
      const accuracyByRecommendationType = {};
      Object.keys(recommendationGroups).forEach((recType) => {
        const group = recommendationGroups[recType];
        const correct = group.filter((rec) =>
          calculateSystemAccuracy(
            rec.recommendation,
            rec.actual_result,
            rec.recommendation_type
          )
        ).length;
        accuracyByRecommendationType[recType] = {
          total: group.length,
          correct: correct,
          accuracy: group.length > 0 ? (correct / group.length) * 100 : 0,
        };
      });

      return {
        totalPredictions,
        correctPredictions,
        overallAccuracy: Math.round(overallAccuracy * 10) / 10,
        byConfidence: {
          "High (8-10)": {
            total: confidenceGroups["High (8-10)"].length,
            correct: confidenceGroups["High (8-10)"].filter((rec) =>
              calculateSystemAccuracy(
                rec.recommendation,
                rec.actual_result,
                rec.recommendation_type
              )
            ).length,
            accuracy:
              Math.round(
                calculateGroupAccuracy(confidenceGroups["High (8-10)"]) * 10
              ) / 10,
          },
          "Medium (6-7)": {
            total: confidenceGroups["Medium (6-7)"].length,
            correct: confidenceGroups["Medium (6-7)"].filter((rec) =>
              calculateSystemAccuracy(
                rec.recommendation,
                rec.actual_result,
                rec.recommendation_type
              )
            ).length,
            accuracy:
              Math.round(
                calculateGroupAccuracy(confidenceGroups["Medium (6-7)"]) * 10
              ) / 10,
          },
          "Low (4-5)": {
            total: confidenceGroups["Low (4-5)"].length,
            correct: confidenceGroups["Low (4-5)"].filter((rec) =>
              calculateSystemAccuracy(
                rec.recommendation,
                rec.actual_result,
                rec.recommendation_type
              )
            ).length,
            accuracy:
              Math.round(
                calculateGroupAccuracy(confidenceGroups["Low (4-5)"]) * 10
              ) / 10,
          },
          "Very Low (1-3)": {
            total: confidenceGroups["Very Low (1-3)"].length,
            correct: confidenceGroups["Very Low (1-3)"].filter((rec) =>
              calculateSystemAccuracy(
                rec.recommendation,
                rec.actual_result,
                rec.recommendation_type
              )
            ).length,
            accuracy:
              Math.round(
                calculateGroupAccuracy(confidenceGroups["Very Low (1-3)"]) * 10
              ) / 10,
          },
        },
        byBetType: accuracyByBetType,
        byRecommendationType: accuracyByRecommendationType,
      };
    } catch (error) {
      console.error("Error fetching prediction accuracy metrics:", error);
      return {
        totalPredictions: 0,
        correctPredictions: 0,
        overallAccuracy: 0,
        byConfidence: {},
        byBetType: {},
        byRecommendationType: {},
      };
    }
  };

  // Calculate prediction accuracy
  const calculatePredictionAccuracy = (bet) => {
    if (!bet.SYSTEM_RECOMMENDATION || !bet.RESULT) {
      return "Pending";
    }

    const recommendation = bet.SYSTEM_RECOMMENDATION.toLowerCase();
    const result = bet.RESULT.toLowerCase();

    // Handle different recommendation types
    if (recommendation === "avoid") {
      // If system said avoid and result was loss, it was accurate
      return result.includes("loss") ? "Yes" : "No";
    }

    if (recommendation.includes("win")) {
      return result.includes("win") ? "Yes" : "No";
    }

    if (recommendation.includes("over")) {
      // For over/under, we need to check actual scores
      if (bet.HOME_SCORE && bet.AWAY_SCORE) {
        const totalGoals = parseInt(bet.HOME_SCORE) + parseInt(bet.AWAY_SCORE);
        const goalLine = parseInt(recommendation.match(/\d+/)?.[0] || "2.5");
        return totalGoals > goalLine ? "Yes" : "No";
      }
      return "Pending";
    }

    if (recommendation.includes("under")) {
      if (bet.HOME_SCORE && bet.AWAY_SCORE) {
        const totalGoals = parseInt(bet.HOME_SCORE) + parseInt(bet.AWAY_SCORE);
        const goalLine = parseInt(recommendation.match(/\d+/)?.[0] || "2.5");
        return totalGoals < goalLine ? "Yes" : "No";
      }
      return "Pending";
    }

    // For double chance recommendations
    if (recommendation.includes("or draw")) {
      return result.includes("win") || result.includes("draw") ? "Yes" : "No";
    }

    return "Pending";
  };

  // Check if betslip matches analysis
  const checkBetslipMatch = (betslipGames, analysisGames) => {
    const betslipSet = new Set(
      betslipGames.map(
        (game) =>
          `${game.HOME_TEAM?.toLowerCase()}-${game.AWAY_TEAM?.toLowerCase()}`
      )
    );
    const analysisSet = new Set(
      analysisGames.map(
        (game) =>
          `${game.home_team?.toLowerCase()}-${game.away_team?.toLowerCase()}`
      )
    );

    const missingFromBetslip = analysisGames.filter(
      (game) =>
        !betslipSet.has(
          `${game.home_team?.toLowerCase()}-${game.away_team?.toLowerCase()}`
        )
    );
    const extraInBetslip = betslipGames.filter(
      (game) =>
        !analysisSet.has(
          `${game.HOME_TEAM?.toLowerCase()}-${game.AWAY_TEAM?.toLowerCase()}`
        )
    );

    return {
      matches: betslipGames.length - extraInBetslip.length,
      total: analysisGames.length,
      missingFromBetslip,
      extraInBetslip,
      isPerfectMatch:
        missingFromBetslip.length === 0 && extraInBetslip.length === 0,
    };
  };

  // Attach predictions to betslip
  const attachPredictionsToBetslip = async (betslipId, predictions) => {
    try {
      // For production (GitHub Pages), only update local state
      if (process.env.NODE_ENV === "development") {
        // Save to database only in development
        const response = await fetch("/api/attached-predictions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ betslipId, predictions }),
        });

        if (response.ok) {
          // Update local state using original betslip ID
          setAttachedPredictions((prev) => ({
            ...prev,
            [betslipId]: predictions,
          }));
        } else {
          console.error("Failed to save predictions to database");
        }
      } else {
        // In production, just update local state
        setAttachedPredictions((prev) => ({
          ...prev,
          [betslipId]: predictions,
        }));
        console.log("Predictions saved to local state (production mode)");
      }
    } catch (error) {
      console.error("Error saving predictions:", error);
      // Fallback: update local state even if API fails
      setAttachedPredictions((prev) => ({
        ...prev,
        [betslipId]: predictions,
      }));
    }
  };

  const generateBetRecommendations = (analysisResults) => {
    if (!analysisResults || analysisResults.length === 0) return [];

    // Include all bets (including "Avoid" ones) and sort by confidence
    const validBets = analysisResults.sort(
      (a, b) => b.confidenceScore - a.confidenceScore
    );

    // Generate comprehensive recommendations for each bet
    const recommendations = validBets.slice(0, 40).map((bet, index) => {
      const odds = parseFloat(bet.ODDS1) || 2.0;
      const confidence = bet.confidenceScore || 5.0;

      // Calculate recommendation score (higher confidence + good odds = better score)
      const recommendationScore = confidence * (odds > 1.5 ? 1.2 : 1.0);

      // Get team data for comprehensive analysis
      const homeTeam = bet.HOME_TEAM;
      const awayTeam = bet.AWAY_TEAM;
      const country = bet.COUNTRY;
      const league = bet.LEAGUE;

      // Analyze straight win recommendation
      const straightWinRecommendation = analyzeStraightWin(
        homeTeam,
        awayTeam,
        country,
        league,
        bet
      );

      // Analyze double chance recommendation
      const doubleChanceRecommendation = analyzeDoubleChance(
        homeTeam,
        awayTeam,
        country,
        league,
        bet
      );

      // Analyze over/under recommendation
      const overUnderRecommendation = analyzeOverUnder(
        homeTeam,
        awayTeam,
        country,
        league,
        bet
      );

      // Create array of all bet recommendations with their types
      const allBets = [
        {
          type: "Straight Win",
          recommendation: straightWinRecommendation,
          riskLevel: "High",
        },
        {
          type: "Double Chance",
          recommendation: doubleChanceRecommendation,
          riskLevel: "Medium",
        },
        {
          type: "Over/Under",
          recommendation: overUnderRecommendation,
          riskLevel: "Medium",
        },
      ];

      // Calculate risk-adjusted scores for ranking
      const rankedBets = allBets.map((bet) => {
        let adjustedScore = bet.recommendation.confidence;

        // Apply risk adjustments
        if (bet.type === "Double Chance") {
          adjustedScore *= 0.9; // Slightly lower score for safer bet
        } else if (bet.type === "Over/Under") {
          adjustedScore *= 0.95; // Medium risk adjustment
        }
        // Straight Win keeps base score (highest risk/reward)

        return {
          ...bet,
          adjustedScore: adjustedScore,
        };
      });

      // Sort by adjusted score (highest first)
      rankedBets.sort((a, b) => b.adjustedScore - a.adjustedScore);

      // Assign rankings
      const primary = rankedBets[0];
      const secondary = rankedBets[1];
      const tertiary = rankedBets[2];

      // Extract recent form data
      const recentFormData = {
        homeWins: parseInt(bet.LAST_5_WINS_HOME) || 0,
        homeDraws: parseInt(bet.LAST_5_DRAWS_HOME) || 0,
        homeLosses: parseInt(bet.LAST_5_LOSSES_HOME) || 0,
        awayWins: parseInt(bet.LAST_5_WINS_AWAY) || 0,
        awayDraws: parseInt(bet.LAST_5_DRAWS_AWAY) || 0,
        awayLosses: parseInt(bet.LAST_5_LOSSES_AWAY) || 0,
      };

      return {
        rank: index + 1,
        match: `${bet.HOME_TEAM} vs ${bet.AWAY_TEAM}`,
        league: bet.LEAGUE,
        country: bet.COUNTRY,
        primary: primary,
        secondary: secondary,
        tertiary: tertiary,
        confidence: confidence,
        odds: odds,
        recommendationScore: recommendationScore,
        recentFormData: recentFormData,
        // Keep original recommendations for backward compatibility
        straightWin: straightWinRecommendation,
        doubleChance: doubleChanceRecommendation,
        overUnder: overUnderRecommendation,
      };
    });

    // Return all recommendations
    return recommendations;
  };

  const analyzeStraightWin = (homeTeam, awayTeam, country, league, betData) => {
    // Check if this is an "Avoid" bet
    if (betData.recommendation && betData.recommendation.includes("Avoid")) {
      return {
        bet: "AVOID",
        confidence: betData.confidenceScore || 5,
        winRate: 0,
        totalBets: 0,
        reasoning: betData.recommendation
          .replace("Avoid (", "")
          .replace(")", ""),
      };
    }

    // Get historical data for both teams
    const homeTeamBets = (bets || []).filter(
      (b) =>
        b.TEAM_INCLUDED === homeTeam &&
        b.COUNTRY === country &&
        b.LEAGUE === league &&
        b.BET_TYPE === "Win" &&
        b.RESULT &&
        b.RESULT.trim() !== ""
    );

    const awayTeamBets = (bets || []).filter(
      (b) =>
        b.TEAM_INCLUDED === awayTeam &&
        b.COUNTRY === country &&
        b.LEAGUE === league &&
        b.BET_TYPE === "Win" &&
        b.RESULT &&
        b.RESULT.trim() !== ""
    );

    // Calculate win rates
    const homeWins = homeTeamBets.filter((b) =>
      b.RESULT.toLowerCase().includes("win")
    ).length;
    const homeWinRate =
      homeTeamBets.length > 0 ? (homeWins / homeTeamBets.length) * 100 : 0;

    const awayWins = awayTeamBets.filter((b) =>
      b.RESULT.toLowerCase().includes("win")
    ).length;
    const awayWinRate =
      awayTeamBets.length > 0 ? (awayWins / awayTeamBets.length) * 100 : 0;

    // Determine recommendation
    if (homeWinRate > awayWinRate + 10) {
      return {
        bet: homeTeam,
        confidence: Math.min(homeWinRate / 10, 10),
        winRate: homeWinRate,
        totalBets: homeTeamBets.length,
        reasoning: `${homeTeam} has ${homeWinRate.toFixed(
          1
        )}% win rate vs ${awayTeam}'s ${awayWinRate.toFixed(1)}%`,
      };
    } else if (awayWinRate > homeWinRate + 10) {
      return {
        bet: awayTeam,
        confidence: Math.min(awayWinRate / 10, 10),
        winRate: awayWinRate,
        totalBets: awayTeamBets.length,
        reasoning: `${awayTeam} has ${awayWinRate.toFixed(
          1
        )}% win rate vs ${homeTeam}'s ${homeWinRate.toFixed(1)}%`,
      };
    } else {
      return {
        bet: "No clear winner",
        confidence: 5,
        winRate: Math.max(homeWinRate, awayWinRate),
        totalBets: homeTeamBets.length + awayTeamBets.length,
        reasoning: "Teams have similar win rates",
      };
    }
  };

  const analyzeDoubleChance = (
    homeTeam,
    awayTeam,
    country,
    league,
    betData
  ) => {
    // Check if this is an "Avoid" bet
    if (betData.recommendation && betData.recommendation.includes("Avoid")) {
      return {
        bet: "AVOID",
        confidence: betData.confidenceScore || 5,
        successRate: 0,
        totalBets: 0,
        reasoning: betData.recommendation
          .replace("Avoid (", "")
          .replace(")", ""),
      };
    }

    // First, get the Straight Win analysis to understand which team is stronger
    const straightWinAnalysis = analyzeStraightWin(
      homeTeam,
      awayTeam,
      country,
      league,
      betData
    );

    // Get all historical matches between these teams or in this league to calculate draw rate
    const allMatches = (bets || []).filter(
      (b) =>
        ((b.HOME_TEAM === homeTeam && b.AWAY_TEAM === awayTeam) ||
          (b.HOME_TEAM === awayTeam && b.AWAY_TEAM === homeTeam)) &&
        b.COUNTRY === country &&
        b.LEAGUE === league &&
        b.RESULT &&
        b.RESULT.trim() !== ""
    );

    // Calculate draw rate from historical matches
    const draws = allMatches.filter((b) =>
      b.RESULT.toLowerCase().includes("draw")
    ).length;
    const drawRate =
      allMatches.length > 0 ? (draws / allMatches.length) * 100 : 15; // Default 15% if no data

    // Calculate Double Chance confidence based on Straight Win + Draw
    let doubleChanceConfidence;
    let recommendedTeam;
    let reasoning;

    if (straightWinAnalysis.bet === homeTeam) {
      recommendedTeam = homeTeam;
      doubleChanceConfidence = (straightWinAnalysis.winRate + drawRate) / 10;
      reasoning = `${homeTeam} has ${straightWinAnalysis.winRate.toFixed(
        1
      )}% win rate + ${drawRate.toFixed(1)}% draw rate`;
    } else if (straightWinAnalysis.bet === awayTeam) {
      recommendedTeam = awayTeam;
      doubleChanceConfidence = (straightWinAnalysis.winRate + drawRate) / 10;
      reasoning = `${awayTeam} has ${straightWinAnalysis.winRate.toFixed(
        1
      )}% win rate + ${drawRate.toFixed(1)}% draw rate`;
    } else {
      // If no clear winner, use the team with higher win rate
      const homeWinRate = straightWinAnalysis.winRate;
      const awayWinRate = straightWinAnalysis.winRate;
      if (homeWinRate >= awayWinRate) {
        recommendedTeam = homeTeam;
        doubleChanceConfidence = (homeWinRate + drawRate) / 10;
        reasoning = `${homeTeam} has ${homeWinRate.toFixed(
          1
        )}% win rate + ${drawRate.toFixed(1)}% draw rate`;
      } else {
        recommendedTeam = awayTeam;
        doubleChanceConfidence = (awayWinRate + drawRate) / 10;
        reasoning = `${awayTeam} has ${awayWinRate.toFixed(
          1
        )}% win rate + ${drawRate.toFixed(1)}% draw rate`;
      }
    }

    // Ensure Double Chance confidence is at least as high as Straight Win (logical validation)
    doubleChanceConfidence = Math.max(
      doubleChanceConfidence,
      straightWinAnalysis.confidence
    );

    return {
      bet: `${recommendedTeam} or Draw`,
      confidence: Math.min(doubleChanceConfidence, 10),
      successRate: doubleChanceConfidence * 10,
      totalBets: allMatches.length,
      reasoning: reasoning,
    };
  };

  const analyzeOverUnder = (homeTeam, awayTeam, country, league, betData) => {
    // Check if this is an "Avoid" bet
    if (betData.recommendation && betData.recommendation.includes("Avoid")) {
      return {
        bet: "AVOID",
        confidence: betData.confidenceScore || 5,
        avgGoals: 0,
        totalGames: 0,
        reasoning: betData.recommendation
          .replace("Avoid (", "")
          .replace(")", ""),
      };
    }

    // Get scoring data for both teams
    const homeTeamGames = (bets || []).filter(
      (b) =>
        (b.HOME_TEAM === homeTeam || b.AWAY_TEAM === homeTeam) &&
        b.COUNTRY === country &&
        b.LEAGUE === league &&
        b.HOME_SCORE &&
        b.AWAY_SCORE &&
        b.RESULT &&
        b.RESULT.trim() !== ""
    );

    const awayTeamGames = (bets || []).filter(
      (b) =>
        (b.HOME_TEAM === awayTeam || b.AWAY_TEAM === awayTeam) &&
        b.COUNTRY === country &&
        b.LEAGUE === league &&
        b.HOME_SCORE &&
        b.AWAY_SCORE &&
        b.RESULT &&
        b.RESULT.trim() !== ""
    );

    // Calculate average goals
    const homeTotalGoals = homeTeamGames.reduce(
      (sum, b) => sum + parseInt(b.HOME_SCORE) + parseInt(b.AWAY_SCORE),
      0
    );
    const homeAvgGoals =
      homeTeamGames.length > 0 ? homeTotalGoals / homeTeamGames.length : 0;

    const awayTotalGoals = awayTeamGames.reduce(
      (sum, b) => sum + parseInt(b.HOME_SCORE) + parseInt(b.AWAY_SCORE),
      0
    );
    const awayAvgGoals =
      awayTeamGames.length > 0 ? awayTotalGoals / awayTeamGames.length : 0;

    // Calculate combined average
    const combinedAvgGoals = (homeAvgGoals + awayAvgGoals) / 2;
    const totalGames = homeTeamGames.length + awayTeamGames.length;

    // If no data, return no clear trend
    if (totalGames === 0) {
      return {
        bet: "No clear trend",
        confidence: 5,
        avgGoals: 0,
        totalGames: 0,
        reasoning: "No historical scoring data available",
      };
    }

    // Analyze multiple goal lines and find the best recommendation
    const goalLines = [1.5, 2.5, 3.5, 4.5];
    let bestRecommendation = null;
    let highestConfidence = 0;

    goalLines.forEach((line) => {
      // Calculate confidence for OVER this line
      if (combinedAvgGoals > line + 0.2) {
        const overConfidence = Math.min(
          ((combinedAvgGoals - line) / line) * 8 + 6,
          10
        );
        if (overConfidence > highestConfidence) {
          highestConfidence = overConfidence;
          bestRecommendation = {
            bet: `OVER ${line}`,
            confidence: overConfidence,
            avgGoals: combinedAvgGoals,
            totalGames: totalGames,
            reasoning: `Combined average: ${combinedAvgGoals.toFixed(
              1
            )} goals per game (${line} line)`,
          };
        }
      }

      // Calculate confidence for UNDER this line
      if (combinedAvgGoals < line - 0.2) {
        const underConfidence = Math.min(
          ((line - combinedAvgGoals) / line) * 8 + 6,
          10
        );
        if (underConfidence > highestConfidence) {
          highestConfidence = underConfidence;
          bestRecommendation = {
            bet: `UNDER ${line}`,
            confidence: underConfidence,
            avgGoals: combinedAvgGoals,
            totalGames: totalGames,
            reasoning: `Combined average: ${combinedAvgGoals.toFixed(
              1
            )} goals per game (${line} line)`,
          };
        }
      }
    });

    // If no clear recommendation found, return neutral
    if (!bestRecommendation || highestConfidence < 6) {
      return {
        bet: "No clear trend",
        confidence: 5,
        avgGoals: combinedAvgGoals,
        totalGames: totalGames,
        reasoning: `Combined average: ${combinedAvgGoals.toFixed(
          1
        )} goals per game`,
      };
    }

    return bestRecommendation;
  };

  // Generate detailed reasoning for why a bet should be avoided
  const getAvoidReasoning = (bet, confidenceBreakdown) => {
    const reasons = [];

    // Team confidence reasoning
    if (confidenceBreakdown.team < 4) {
      const teamBets = bets.filter(
        (b) =>
          b.TEAM_INCLUDED === bet.team_included &&
          b.COUNTRY === bet.country &&
          b.LEAGUE === bet.league &&
          b.RESULT !== "" &&
          b.RESULT !== "pending"
      );

      if (teamBets.length === 0) {
        reasons.push("No historical data for this team in this league");
      } else {
        const wins = teamBets.filter((b) => b.RESULT === "win").length;
        const winRate = (wins / teamBets.length) * 100;
        reasons.push(
          `Poor team performance: ${winRate.toFixed(1)}% win rate (${wins}/${
            teamBets.length
          } bets)`
        );
      }
    }

    // League confidence reasoning
    if (confidenceBreakdown.league < 4) {
      const leagueBets = bets.filter(
        (b) =>
          b.COUNTRY === bet.country &&
          b.LEAGUE === bet.league &&
          b.RESULT !== "" &&
          b.RESULT !== "pending"
      );

      if (leagueBets.length === 0) {
        reasons.push("No historical data for this league");
      } else {
        const wins = leagueBets.filter((b) => b.RESULT === "win").length;
        const winRate = (wins / leagueBets.length) * 100;
        reasons.push(
          `Poor league performance: ${winRate.toFixed(1)}% win rate (${wins}/${
            leagueBets.length
          } bets)`
        );
      }
    }

    // Odds confidence reasoning
    if (confidenceBreakdown.odds < 4) {
      const similarBets = bets.filter(
        (b) =>
          b.BET_TYPE === bet.bet_type &&
          b.RESULT !== "" &&
          b.RESULT !== "pending" &&
          (Math.abs(b.ODDS1 - bet.odds1) <= 0.5 ||
            Math.abs(b.ODDS2 - bet.odds1) <= 0.5)
      );

      if (similarBets.length === 0) {
        reasons.push("No historical data for similar odds in this bet type");
      } else {
        const wins = similarBets.filter((b) => b.RESULT === "win").length;
        const winRate = (wins / similarBets.length) * 100;
        reasons.push(
          `Poor performance with similar odds: ${winRate.toFixed(
            1
          )}% win rate (${wins}/${similarBets.length} bets)`
        );
      }
    }

    // Matchup confidence reasoning
    if (confidenceBreakdown.matchup < 4) {
      const matchups = bets.filter(
        (b) =>
          ((b.HOME_TEAM === bet.home_team && b.AWAY_TEAM === bet.away_team) ||
            (b.HOME_TEAM === bet.away_team && b.AWAY_TEAM === bet.home_team)) &&
          b.COUNTRY === bet.country &&
          b.LEAGUE === bet.league &&
          b.RESULT !== "" &&
          b.RESULT !== "pending"
      );

      if (matchups.length === 0) {
        reasons.push("No historical head-to-head data for this matchup");
      } else {
        const wins = matchups.filter((b) => b.RESULT === "win").length;
        const winRate = (wins / matchups.length) * 100;
        reasons.push(
          `Poor head-to-head performance: ${winRate.toFixed(
            1
          )}% win rate (${wins}/${matchups.length} matchups)`
        );
      }
    }

    // Position confidence reasoning
    if (confidenceBreakdown.position < 4 && bet.LEAGUE !== "CUP") {
      if (bet.HOME_TEAM_POSITION_NUMBER && bet.AWAY_TEAM_POSITION_NUMBER) {
        const homePos = parseInt(bet.HOME_TEAM_POSITION_NUMBER);
        const awayPos = parseInt(bet.AWAY_TEAM_POSITION_NUMBER);
        const totalTeams = parseInt(bet.TOTAL_TEAMS_IN_LEAGUE);

        if (totalTeams > 0) {
          const homePercent = (homePos / totalTeams) * 100;
          const awayPercent = (awayPos / totalTeams) * 100;

          // Determine which team is being bet on
          const isBettingOnHomeTeam =
            (bet.team_included || "") &&
            (bet.home_team || "") &&
            (bet.team_included || "")
              .toLowerCase()
              .includes((bet.home_team || "").toLowerCase());

          if (isBettingOnHomeTeam && homePercent > 60) {
            reasons.push(
              `Poor league position: Home team in bottom ${(
                100 - homePercent
              ).toFixed(0)}% of league`
            );
          } else if (!isBettingOnHomeTeam && awayPercent > 60) {
            reasons.push(
              `Poor league position: Away team in bottom ${(
                100 - awayPercent
              ).toFixed(0)}% of league`
            );
          }
        }
      } else {
        reasons.push("Missing league position data");
      }
    }

    // Home/Away confidence reasoning
    if (confidenceBreakdown.homeAway < 4) {
      const isBettingOnHomeTeam = (bet.team_included || "")
        .toLowerCase()
        .includes((bet.home_team || "").toLowerCase());
      const gameType = isBettingOnHomeTeam ? "home" : "away";

      const homeAwayBets = bets.filter(
        (b) =>
          b.TEAM_INCLUDED === bet.team_included &&
          b.COUNTRY === bet.country &&
          b.LEAGUE === bet.league &&
          b.RESULT !== "" &&
          b.RESULT !== "pending"
      );

      if (homeAwayBets.length === 0) {
        reasons.push(`No ${gameType} game data for this team`);
      } else {
        const wins = homeAwayBets.filter((b) => b.RESULT === "win").length;
        const winRate = (wins / homeAwayBets.length) * 100;
        reasons.push(
          `Poor ${gameType} performance: ${winRate.toFixed(
            1
          )}% win rate (${wins}/${homeAwayBets.length} ${gameType} games)`
        );
      }
    }

    // If no specific reasons found, provide general reasoning
    if (reasons.length === 0) {
      reasons.push("Overall confidence score too low for a safe bet");
    }

    return reasons.join("; ");
  };

  // Use the analytics hook for deduplicated bets
  const { deduplicatedBets: getDeduplicatedBetsForAnalysis } = useAnalytics(
    bets,
    analyticsSortConfig
  );

  // Use the analytics hook for team analytics
  const { teamAnalytics } = useAnalytics(bets, analyticsSortConfig);

  // Use the analytics hook for sorted analytics data
  const { getSortedAnalyticsData } = useAnalytics(bets, analyticsSortConfig);

  // Use the team history hook for confidence calculations
  const { calculateConfidence, getBreakdown, getLabel, getRecommendation } =
    useTeamHistory(bets);

  // Use the data processing hook
  const {
    getSortedData,
    getSortedLeagueData,
    getSortedCountryData,
    getSortedBlacklistData,
    getSortedOddsData,
    getSortedAnalysisResults,
    getSortedSlipsData,
    getSortedTeamNotesData,
  } = useDataProcessing(bets, filters);

  // Use the utility hook
  const {
    getStatusColorClass,
    formatDateString,
    calculateWinPercentageForBets,
    storePredictionsData,
    storeRecommendationsData,
  } = useUtility(bets, blacklistedTeams, storedPredictions);

  // Use the analysis hook
  const {} = useAnalysis(bets);

  // Use the prediction hook
  const {} = usePrediction(bets);

  // Use the bet analysis hook
  const {
    analyzeNewBets: analyzeNewBetsService,
    findPreviousMatchups: findPreviousMatchupsService,
    analyzeScoringPatterns: analyzeScoringPatternsService,
    getScoringRecommendation: getScoringRecommendationService,
    getDeduplicatedNewBets: getDeduplicatedNewBetsService,
  } = useBetAnalysis(
    bets,
    blacklistedTeams,
    getDeduplicatedBetsForAnalysis,
    calculateConfidence,
    getBreakdown,
    getLabel,
    getRecommendation,
    storePredictionsData,
    storeRecommendationsData,
    setScoringAnalysis,
    setScoringAnalysisLoading
  );

  // Use the query hook
  const {
    getAvailableFields: getAvailableFieldsService,
    getFieldValues: getFieldValuesService,
    getAvailableMetrics: getAvailableMetricsService,
    getAvailableOperators: getAvailableOperatorsService,
    addQueryFilter: addQueryFilterService,
    removeQueryFilter: removeQueryFilterService,
    updateQueryFilter: updateQueryFilterService,
    executeQuery: executeQueryService,
    clearQuery: clearQueryService,
  } = useQuery(
    getDeduplicatedBetsForAnalysis,
    teamAnalytics,
    queryFilters,
    setQueryFilters,
    setQueryResults,
    setIsQuerying
  );

  // Use the PDF hook
  const { generatePDFReport: generatePDFReportService } = usePDF(
    analysisResults,
    betRecommendations
  );

  // Use the analytics functions hook
  const {
    getLeagueAnalytics: getLeagueAnalyticsService,
    getCountryAnalytics: getCountryAnalyticsService,
    getBestPerformers: getBestPerformersService,
    getHeadToHeadData: getHeadToHeadDataService,
    getTopTeams: getTopTeamsService,
  } = useAnalyticsFunctions(getDeduplicatedBetsForAnalysis);

  // Query system functions - using service functions
  const getAvailableFields = () => {
    return getAvailableFieldsService();
  };

  const getFieldValues = (field) => {
    return getFieldValuesService(field);
  };

  const getAvailableMetrics = () => {
    return getAvailableMetricsService();
  };

  const getAvailableOperators = () => {
    return getAvailableOperatorsService();
  };

  const addQueryFilter = () => {
    return addQueryFilterService();
  };

  const removeQueryFilter = (index) => {
    return removeQueryFilterService(index);
  };

  const updateQueryFilter = (index, field, value) => {
    return updateQueryFilterService(index, field, value);
  };

  const executeQuery = async () => {
    return await executeQueryService();
  };

  const clearQuery = () => {
    return clearQueryService();
  };

  // PDF Report Generation - using service function
  const generatePDFReport = async () => {
    return await generatePDFReportService();
  };

  const getLeagueAnalytics = () => {
    return getLeagueAnalyticsService();
  };

  const getCountryAnalytics = () => {
    return getCountryAnalyticsService();
  };

  const getBestPerformers = () => {
    return getBestPerformersService();
  };

  const analyzeNewBets = async () => {
    try {
      setIsAnalyzing(true);

      // Fetch new bets from Sheet3
      const fetchedNewBets = await fetchNewBets();
      setNewBets(fetchedNewBets);

      if (!fetchedNewBets || fetchedNewBets.length === 0) {
        console.log("No new bets found or fetch failed");
        setAnalysisResults([]);
        return;
      }

      // Use the service to analyze new bets
      const { results } = await analyzeNewBetsService(fetchedNewBets);

      setAnalysisResults(results);

      // Generate bet recommendations using the local function
      const recommendations = generateBetRecommendations(results);
      setBetRecommendations(recommendations);
    } catch (error) {
      console.error("Error analyzing new bets:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Update database with recommendations
  const updateDatabase = async () => {
    try {
      setIsUpdatingDatabase(true);

      if (!analysisResults || analysisResults.length === 0) {
        console.log("No analysis results to save");
        return;
      }

      // Generate a unique betslip ID for this analysis session
      const betslipId = `analysis_${
        new Date().toISOString().split("T")[0]
      }_${Date.now()}`;

      // Debug: Check if BET_ID is available in analysisResults
      console.log("Sample analysis result:", analysisResults[0]);
      console.log("BET_ID in first result:", analysisResults[0]?.BET_ID);

      // Prepare recommendations data for database storage
      // Store all 3 recommendations (Primary/Secondary/Tertiary) for each game in one record
      const recommendations = analysisResults
        .map((result) => {
          // Get the full recommendation object that contains primary/secondary/tertiary
          const matchString1 = `${result.HOME_TEAM} vs ${result.AWAY_TEAM}`;
          const matchString2 = `${result.AWAY_TEAM} vs ${result.HOME_TEAM}`;

          const fullRecommendation = betRecommendations.find(
            (rec) => rec.match === matchString1 || rec.match === matchString2
          );

          // Debug: Check matching for first few results
          if (analysisResults.indexOf(result) < 3) {
            console.log(`Game ${analysisResults.indexOf(result) + 1}:`);
            console.log(
              `  Looking for: "${matchString1}" or "${matchString2}"`
            );
            console.log(`  Found match:`, !!fullRecommendation);
            if (fullRecommendation) {
              console.log(`  Match found:`, fullRecommendation.match);
            }
          }

          if (fullRecommendation) {
            return {
              bet_id: result.BET_ID,
              date: result.DATE,
              home_team: result.HOME_TEAM,
              away_team: result.AWAY_TEAM,
              team_included: result.TEAM_INCLUDED,
              bet_type: result.BET_TYPE,
              bet_selection: result.BET_SELECTION,
              odds1: result.ODDS1,
              odds2: result.ODDS2,
              oddsX: result.ODDSX,
              // Store all 3 recommendations in one record
              primary_recommendation:
                fullRecommendation.primary.recommendation.bet,
              primary_confidence:
                fullRecommendation.primary.recommendation.confidence,
              primary_reasoning:
                fullRecommendation.primary.recommendation.reasoning ||
                fullRecommendation.primary.recommendation.bet,
              secondary_recommendation:
                fullRecommendation.secondary.recommendation.bet,
              secondary_confidence:
                fullRecommendation.secondary.recommendation.confidence,
              secondary_reasoning:
                fullRecommendation.secondary.recommendation.reasoning ||
                fullRecommendation.secondary.recommendation.bet,
              tertiary_recommendation:
                fullRecommendation.tertiary.recommendation.bet,
              tertiary_confidence:
                fullRecommendation.tertiary.recommendation.confidence,
              tertiary_reasoning:
                fullRecommendation.tertiary.recommendation.reasoning ||
                fullRecommendation.tertiary.recommendation.bet,
              // Use primary confidence as the main confidence score
              confidence_score:
                fullRecommendation.primary.recommendation.confidence,
              confidence_breakdown: result.confidenceBreakdown,
              historical_data: {
                historicalBets: result.historicalBets,
                historicalWins: result.historicalWins,
                historicalLosses: result.historicalLosses,
                winRate: result.winRate,
                winDetails: result.winDetails,
                lossDetails: result.lossDetails,
                previousMatchups: result.previousMatchups,
                competitions: result.competitions,
              },
              probabilities: result.probabilities,
            };
          }
          return null;
        })
        .filter(Boolean);

      // Debug: Check what's being sent to database
      console.log("Total analysis results:", analysisResults.length);
      console.log("Total bet recommendations:", betRecommendations.length);
      console.log(
        "First few bet recommendations:",
        betRecommendations.slice(0, 3)
      );
      console.log("First few analysis results:", analysisResults.slice(0, 3));
      console.log(
        "Total recommendations after filtering:",
        recommendations.length
      );
      console.log("First recommendation being sent to DB:", recommendations[0]);
      console.log(
        "BET_ID in first recommendation:",
        recommendations[0]?.bet_id
      );

      // Send to database
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          betslipId,
          recommendations,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(
          `Successfully stored ${result.stored} recommendations to database`
        );
        alert(
          `✅ Successfully saved ${result.stored} recommendations to database!`
        );
      } else {
        throw new Error("Failed to save recommendations");
      }
    } catch (error) {
      console.error("Error updating database:", error);
      alert(`❌ Error saving recommendations: ${error.message}`);
    } finally {
      setIsUpdatingDatabase(false);
    }
  };

  // Compare stored recommendations with Google Sheets results
  const compareRecommendationsWithResults = async () => {
    try {
      setIsComparing(true);

      // Fetch stored recommendations from database
      const recommendationsResponse = await fetch("/api/recommendations");
      if (!recommendationsResponse.ok) {
        throw new Error("Failed to fetch recommendations from database");
      }
      const storedRecommendations = await recommendationsResponse.json();

      if (storedRecommendations.length === 0) {
        console.log("No stored recommendations found");
        return { matched: [], unmatched: [], analysis: null };
      }

      // Fetch current bets data from Google Sheets (which includes results)
      console.log("Fetching current bets from Google Sheets...");
      const currentBets = await fetchSheetData();
      console.log(
        "Fetched current bets:",
        currentBets ? currentBets.length : 0,
        "records"
      );

      // Debug: Show first few bets from Google Sheets
      if (currentBets && currentBets.length > 0) {
        console.log("=== GOOGLE SHEETS DATA SAMPLE ===");
        currentBets.slice(0, 5).forEach((bet, index) => {
          console.log(
            `${index + 1}. BET_ID: "${bet.BET_ID}", Teams: "${
              bet.HOME_TEAM
            }" vs "${bet.AWAY_TEAM}", Result: "${bet.RESULT}"`
          );
        });
      }

      if (!currentBets || currentBets.length === 0) {
        throw new Error("Failed to fetch current bets from Google Sheets");
      }

      console.log(
        `Found ${storedRecommendations.length} stored recommendations`
      );
      console.log(`Found ${currentBets.length} current bets with results`);

      // Simple test - just log the first few items
      console.log("=== DEBUG INFO ===");
      console.log(
        "First stored recommendation date:",
        storedRecommendations[0]?.date
      );
      console.log("First current bet date:", currentBets[0]?.DATE);
      console.log(
        "First stored recommendation teams:",
        storedRecommendations[0]?.home_team,
        "vs",
        storedRecommendations[0]?.away_team
      );
      console.log(
        "First current bet teams:",
        currentBets[0]?.HOME_TEAM,
        "vs",
        currentBets[0]?.AWAY_TEAM
      );

      // Check date ranges (moved after normalizeDate function definition)

      // Debug: Show first stored recommendation
      if (storedRecommendations.length > 0) {
        console.log("First stored recommendation:", storedRecommendations[0]);
        console.log(
          "BET_ID in stored recommendation:",
          storedRecommendations[0]?.bet_id
        );
      }

      // Debug: Show first current bet
      if (currentBets.length > 0) {
        console.log("First current bet:", currentBets[0]);
      }

      // Debug: Show raw Google Sheets data structure
      console.log("=== RAW GOOGLE SHEETS DATA ===");
      console.log("Total bets fetched:", currentBets.length);
      console.log("First 5 raw bets:", currentBets.slice(0, 5));
      console.log(
        "All unique dates in Google Sheets:",
        [...new Set(currentBets.map((bet) => bet.DATE))].slice(0, 10)
      );

      // Function to normalize dates for matching
      const normalizeDate = (dateStr) => {
        if (!dateStr) return "";
        // If it's already in ISO format, extract just the date part
        if (dateStr.includes("T")) {
          return dateStr.split("T")[0];
        }
        // If it's in DD-MMM format, convert to YYYY-MM-DD
        if (dateStr.includes("-") && dateStr.length <= 6) {
          const [day, month] = dateStr.split("-");
          const monthMap = {
            Jan: "01",
            Feb: "02",
            Mar: "03",
            Apr: "04",
            May: "05",
            Jun: "06",
            Jul: "07",
            Aug: "08",
            Sep: "09",
            Oct: "10",
            Nov: "11",
            Dec: "12",
          };
          const currentYear = new Date().getFullYear();
          return `${currentYear}-${monthMap[month] || "01"}-${day.padStart(
            2,
            "0"
          )}`;
        }
        return dateStr;
      };

      // Create a lookup map for faster matching (only games with results)
      // Use BET_ID as the key for precise matching of specific bets
      const betsLookup = new Map();
      const teamBetsLookup = new Map(); // Fallback for team-based matching

      currentBets.forEach((bet) => {
        // Only include games that have results
        if (bet.RESULT && bet.RESULT.trim() !== "") {
          // Primary lookup: Use BET_ID for exact matching
          if (bet.BET_ID && bet.BET_ID.trim() !== "") {
            betsLookup.set(bet.BET_ID, bet);
          }

          // Fallback lookup: Use team names for cases where BET_ID doesn't match
          const teamKey = `${bet.HOME_TEAM}_vs_${bet.AWAY_TEAM}`.replace(
            /\s+/g,
            "_"
          );

          if (!teamBetsLookup.has(teamKey)) {
            teamBetsLookup.set(teamKey, []);
          }
          teamBetsLookup.get(teamKey).push(bet);
        }
      });

      console.log(
        `Created BET_ID lookup map with ${betsLookup.size} games that have results`
      );

      // Debug: Show what BET_IDs are actually in the lookup
      const betIdKeys = Array.from(betsLookup.keys());
      console.log("BET_IDs in lookup:", betIdKeys.slice(0, 10));

      // Check if your specific BET_ID is in the lookup
      const targetBetId = "2005/09/13 - 136";
      console.log(`Looking for BET_ID: "${targetBetId}"`);
      console.log(`Found in lookup: ${betsLookup.has(targetBetId)}`);
      if (betsLookup.has(targetBetId)) {
        console.log("Match found:", betsLookup.get(targetBetId));
      }
      console.log(
        `Created team-based fallback lookup with ${teamBetsLookup.size} team combinations`
      );

      // Debug: Show sample results from Google Sheets
      const gamesWithResults = currentBets.filter(
        (bet) => bet.RESULT && bet.RESULT.trim() !== ""
      );
      console.log(
        "Sample games with results:",
        gamesWithResults.slice(0, 5).map((bet) => ({
          date: bet.DATE,
          home: bet.HOME_TEAM,
          away: bet.AWAY_TEAM,
          result: bet.RESULT,
        }))
      );

      // Show unique result values
      const uniqueResults = [
        ...new Set(gamesWithResults.map((bet) => bet.RESULT)),
      ];
      console.log("Unique result values in Google Sheets:", uniqueResults);

      // Debug: Show a few examples of the Google Sheets date format
      console.log(
        "Sample Google Sheets dates:",
        currentBets.slice(0, 3).map((bet) => bet.DATE)
      );
      console.log(
        "Sample normalized Google Sheets dates:",
        currentBets.slice(0, 3).map((bet) => normalizeDate(bet.DATE))
      );
      console.log(
        "Sample Google Sheets game IDs:",
        currentBets.slice(0, 3).map((bet) => {
          const normalizedDate = normalizeDate(bet.DATE);
          return `${normalizedDate}_${bet.HOME_TEAM}_${bet.AWAY_TEAM}`.replace(
            /\s+/g,
            "_"
          );
        })
      );

      // Debug: Show August games specifically
      const augustGames = currentBets.filter((bet) => {
        const normalizedDate = normalizeDate(bet.DATE);
        return normalizedDate.startsWith("2025-08-");
      });
      console.log(`Found ${augustGames.length} August games in Google Sheets`);
      console.log(
        "Sample August games:",
        augustGames.slice(0, 3).map((bet) => ({
          date: bet.DATE,
          normalized: normalizeDate(bet.DATE),
          home: bet.HOME_TEAM,
          away: bet.AWAY_TEAM,
          result: bet.RESULT,
        }))
      );

      // Debug: Show all unique team combinations in Google Sheets
      const teamCombinations = [
        ...new Set(
          currentBets.map((bet) => `${bet.HOME_TEAM}_vs_${bet.AWAY_TEAM}`)
        ),
      ];
      console.log(
        "Sample team combinations in Google Sheets:",
        teamCombinations.slice(0, 10)
      );

      // Debug: Show first few keys in the lookup maps
      const teamKeys = Array.from(teamBetsLookup.keys()).slice(0, 5);
      console.log("First 5 team lookup keys:", teamKeys);

      // Check date ranges
      const storedDates = storedRecommendations
        .map((r) => normalizeDate(r.date))
        .sort();
      const currentDates = currentBets.map((b) => normalizeDate(b.DATE)).sort();
      console.log(
        "Stored recommendations date range:",
        storedDates[0],
        "to",
        storedDates[storedDates.length - 1]
      );
      console.log(
        "Current bets date range:",
        currentDates[0],
        "to",
        currentDates[currentDates.length - 1]
      );

      // Filter stored recommendations to only include games that have results in Google Sheets
      const recommendationsWithResults = storedRecommendations.filter(
        (recommendation) => {
          // Use BET_ID for filtering instead of team names
          if (recommendation.bet_id && recommendation.bet_id.trim() !== "") {
            return betsLookup.has(recommendation.bet_id);
          }

          // Fallback to team-based matching if no BET_ID
          const teamKey =
            `${recommendation.home_team}_vs_${recommendation.away_team}`.replace(
              /\s+/g,
              "_"
            );
          return teamBetsLookup.has(teamKey);
        }
      );

      console.log(
        `Found ${recommendationsWithResults.length} stored recommendations that have results in Google Sheets`
      );

      // Match recommendations with results
      const matched = [];
      const unmatched = [];

      for (const recommendation of recommendationsWithResults) {
        // Debug: Check if recommendation has database id
        if (!recommendation.id) {
          console.error("Recommendation missing database id:", recommendation);
        }

        // Try to find matching bet using BET_ID first (most accurate)
        let matchingBet = null;

        if (recommendation.bet_id && recommendation.bet_id.trim() !== "") {
          // Find all games with this BET_ID
          const gamesWithBetId = currentBets.filter(
            (bet) =>
              bet.BET_ID === recommendation.bet_id &&
              bet.RESULT &&
              bet.RESULT.trim() !== ""
          );

          console.log(`Looking for BET_ID: ${recommendation.bet_id}`);
          console.log(`Found ${gamesWithBetId.length} games with this BET_ID`);

          // Log all games with this BET_ID for debugging
          if (gamesWithBetId.length > 0) {
            console.log(`All games with BET_ID ${recommendation.bet_id}:`);
            gamesWithBetId.forEach((bet, index) => {
              console.log(
                `  ${index + 1}. ${bet.HOME_TEAM} vs ${
                  bet.AWAY_TEAM
                } - Result: ${bet.RESULT}`
              );
            });
          }

          // Find the specific game that matches teams
          matchingBet = gamesWithBetId.find((bet) => {
            const homeMatch = bet.HOME_TEAM === recommendation.home_team;
            const awayMatch = bet.AWAY_TEAM === recommendation.away_team;

            console.log(
              `Checking: "${bet.HOME_TEAM}" === "${recommendation.home_team}" ? ${homeMatch}`
            );
            console.log(
              `Checking: "${bet.AWAY_TEAM}" === "${recommendation.away_team}" ? ${awayMatch}`
            );

            return homeMatch && awayMatch;
          });

          console.log(
            `Looking for teams: ${recommendation.home_team} vs ${recommendation.away_team}`
          );
          console.log(`Found specific game match:`, matchingBet ? "Yes" : "No");
          console.log(
            `Recommendation ID: ${recommendation.id}, Game: ${recommendation.home_team} vs ${recommendation.away_team}`
          );

          if (matchingBet) {
            console.log(
              `✅ MATCHED: ${matchingBet.HOME_TEAM} vs ${matchingBet.AWAY_TEAM}, Result: ${matchingBet.RESULT}`
            );
          } else {
            console.log(
              `❌ NO MATCH FOUND for teams: ${recommendation.home_team} vs ${recommendation.away_team}`
            );
          }
        }

        // Fallback: If no BET_ID match, try team-based matching with bet type
        if (!matchingBet) {
          const teamKey =
            `${recommendation.home_team}_vs_${recommendation.away_team}`.replace(
              /\s+/g,
              "_"
            );

          const teamBets = teamBetsLookup.get(teamKey) || [];

          // Try to find exact bet type match first
          if (recommendation.bet_type && recommendation.bet_selection) {
            matchingBet = teamBets.find(
              (bet) =>
                bet.BET_TYPE === recommendation.bet_type &&
                bet.BET_SELECTION === recommendation.bet_selection
            );
          }

          // If still no match, use the first available bet for this team combination
          if (!matchingBet && teamBets.length > 0) {
            matchingBet = teamBets[0];
          }

          console.log(`Looking for team key: ${teamKey}`);
          console.log(`Found team match:`, matchingBet ? "Yes" : "No");
          console.log(`Available bets for team:`, teamBets.length);
        }

        if (matchingBet) {
          console.log(`Result: "${matchingBet.RESULT}"`);
          console.log(`Bet Type: "${matchingBet.BET_TYPE}"`);
          console.log(`Bet Selection: "${matchingBet.BET_SELECTION}"`);
        }

        if (
          matchingBet &&
          matchingBet.RESULT &&
          matchingBet.RESULT.trim() !== ""
        ) {
          // We have a match with results
          const analysis = analyzeRecommendationFailure(
            recommendation,
            matchingBet
          );
          matched.push({
            ...recommendation,
            actual_result: matchingBet.RESULT,
            actual_home_score: matchingBet.HOME_SCORE,
            actual_away_score: matchingBet.AWAY_SCORE,
            analysis,
          });
        } else {
          // No match or no results yet
          unmatched.push(recommendation);
        }
      }

      // Generate overall analysis
      const analysis = generateOverallAnalysis(matched);

      // Update database records with actual results and accuracy
      if (matched.length > 0) {
        console.log("Updating database records with actual results...");
        console.log("Sample match data:", matched[0]);
        try {
          const updatePromises = matched.map(async (match) => {
            // Only log for Double Chance Away games
            if (
              match.recommendation &&
              match.recommendation.includes("Double Chance Away")
            ) {
              console.log(`DEBUG UPDATE - Double Chance Away:`, {
                id: match.id,
                bet_id: match.bet_id,
                actual_result: match.actual_result,
                yourBetWon: match.analysis.yourBetWon,
                systemRecommendationAccurate:
                  match.analysis.systemRecommendationAccurate,
                analysisType: match.analysis.analysisType,
                insight: match.analysis.insight,
              });
            }

            const updateData = {
              actual_result: match.actual_result,
              prediction_accurate: match.analysis.systemPredictionAccurate,
              recommendation_alignment:
                match.analysis.systemRecommendationAccurate,
              your_bet_won: match.analysis.yourBetWon,
              analysis_type: match.analysis.analysisType,
              insight: match.analysis.insight,
              result_updated_at: new Date().toISOString(),
            };

            const response = await fetch(`/api/recommendations/${match.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(updateData),
            });

            if (!response.ok) {
              console.error(
                `Failed to update record ${match.id}:`,
                response.statusText
              );
            } else {
              console.log(`Successfully updated record ${match.id}`);
            }
          });

          await Promise.all(updatePromises);
          console.log("Database records updated successfully");
        } catch (error) {
          console.error("Error updating database records:", error);
        }
      } else {
        console.log("No matched records to update");
      }

      console.log(`Matched: ${matched.length}, Unmatched: ${unmatched.length}`);
      return { matched, unmatched, analysis };
    } catch (error) {
      console.error("Error comparing recommendations:", error);
      throw error;
    } finally {
      setIsComparing(false);
    }
  };

  // Evaluate if your specific bet selection won (separate from system prediction accuracy)
  const evaluateYourBetOutcome = (yourBetSelection, actualResult) => {
    const result = actualResult.toLowerCase();
    const betSelection = yourBetSelection?.toLowerCase() || "";

    // Since your Google Sheets RESULT column contains your bet outcome (WIN/LOSS),
    // we can directly check if the result is "win"
    if (result.includes("win")) {
      return true; // Your bet won
    } else if (result.includes("loss")) {
      return false; // Your bet lost
    } else {
      return false; // Pending or unknown
    }
  };

  // Evaluate if the system's original prediction about the game outcome was accurate
  const evaluateSystemPredictionAccuracy = (
    systemRecommendation,
    actualResult
  ) => {
    const result = actualResult.toLowerCase();
    const recommendation = systemRecommendation?.toLowerCase() || "";

    // Simplified approach: If your bet won, assume the system was right
    // If your bet lost, assume the system was wrong
    // This is a proxy for system prediction accuracy based on your betting results

    return result.includes("win");
  };

  // Evaluate if the system's recommendation matched what you actually bet
  const evaluateSystemRecommendationAccuracy = (
    systemRecommendation,
    yourBetSelection
  ) => {
    const recommendation = systemRecommendation?.toLowerCase() || "";
    const yourBet = yourBetSelection?.toLowerCase() || "";

    // Debug logging - only for specific game
    if (
      systemRecommendation &&
      systemRecommendation.includes("Double Chance Away")
    ) {
      console.log(
        `DEBUG: System recommendation: "${systemRecommendation}" -> "${recommendation}"`
      );
      console.log(`DEBUG: Your bet: "${yourBetSelection}" -> "${yourBet}"`);
    }

    // Check if the system recommended what you actually bet
    // Need exact matches, not partial matches

    // Handle exact matches first
    if (recommendation === yourBet) {
      return true;
    }

    // Handle specific bet type matches
    if (
      recommendation.includes("home win") ||
      recommendation.includes("home")
    ) {
      // System recommended home win - only matches if you bet home win (not 1 X)
      return yourBet.includes("home win") || yourBet.includes("home");
    } else if (
      recommendation.includes("away win") ||
      recommendation.includes("away")
    ) {
      // System recommended away win - only matches if you bet away win (not X 2)
      return yourBet.includes("away win") || yourBet.includes("away");
    } else if (recommendation.includes("draw")) {
      // System recommended draw - only matches if you bet draw (not 1 X or X 2)
      return yourBet.includes("draw");
    } else if (
      recommendation.includes("double chance away") ||
      recommendation.includes("Double Chance Away")
    ) {
      // System recommended double chance away - matches if you bet X 2
      return yourBet.includes("x 2") || yourBet.includes("x2");
    } else if (
      recommendation.includes("double chance home") ||
      recommendation.includes("Double Chance Home")
    ) {
      // System recommended double chance home - matches if you bet 1 X
      return yourBet.includes("1 x") || yourBet.includes("1x");
    } else if (
      recommendation.includes("double chance") ||
      recommendation.includes("Double Chance")
    ) {
      // Generic double chance - check both possibilities
      return (
        yourBet.includes("1 x") ||
        yourBet.includes("1x") ||
        yourBet.includes("x 2") ||
        yourBet.includes("x2")
      );
    } else if (
      recommendation.includes("1 x") ||
      recommendation.includes("1x")
    ) {
      // System recommended 1 X - only matches if you bet 1 X
      return yourBet.includes("1 x") || yourBet.includes("1x");
    } else if (
      recommendation.includes("x 2") ||
      recommendation.includes("x2")
    ) {
      // System recommended X 2 - only matches if you bet X 2
      return yourBet.includes("x 2") || yourBet.includes("x2");
    } else if (
      recommendation.includes("1 2") ||
      recommendation.includes("12")
    ) {
      // System recommended 1 2 - only matches if you bet 1 2
      return yourBet.includes("1 2") || yourBet.includes("12");
    } else if (recommendation.includes("over")) {
      return yourBet.includes("over");
    } else if (recommendation.includes("under")) {
      return yourBet.includes("under");
    } else {
      // Fallback - exact match only
      const result = recommendation === yourBet;
      console.log(`DEBUG: Fallback result: ${result}`);
      return result;
    }
  };

  // Analyze why a specific recommendation failed
  const analyzeRecommendationFailure = (recommendation, actualBet) => {
    const betType = recommendation.bet_type?.toLowerCase() || "";
    const betSelection = recommendation.bet_selection || "";
    const systemRecommendation = recommendation.recommendation || "";
    const result = actualBet.RESULT.toLowerCase();

    // Separate evaluations
    const yourBetWon = evaluateYourBetOutcome(betSelection, result);
    const systemRecommendationAccurate = evaluateSystemRecommendationAccuracy(
      systemRecommendation,
      betSelection
    );

    // Debug logging
    console.log(
      `Debug: System recommendation: "${systemRecommendation}", Your bet: "${betSelection}", Match: ${systemRecommendationAccurate}`
    );

    // Determine overall analysis
    let analysisType = "";
    let failureReason = "";
    let insight = "";

    if (yourBetWon && systemRecommendationAccurate) {
      analysisType = "Both Correct";
      insight = "Your bet won and the system recommended what you bet";
    } else if (yourBetWon && !systemRecommendationAccurate) {
      analysisType = "You Won, System Wrong";
      insight =
        "Your bet won but the system recommended something different than what you bet";
      failureReason = `System recommended ${systemRecommendation} but you bet ${betSelection}`;
    } else if (!yourBetWon && systemRecommendationAccurate) {
      analysisType = "System Right, You Lost";
      insight = "System recommended what you bet but your bet lost";
      failureReason = `System recommended ${systemRecommendation} and you bet ${betSelection}, but you lost`;
    } else {
      analysisType = "Both Wrong";
      insight =
        "System recommended something different than what you bet, and your bet lost";
      failureReason = `System recommended ${systemRecommendation} but you bet ${betSelection}, and you lost`;
    }

    // Analyze confidence factors that may have been wrong
    const confidenceAnalysis = analyzeConfidenceFactors(
      recommendation,
      actualBet,
      systemRecommendationAccurate // Use system accuracy for confidence analysis
    );

    return {
      yourBetWon,
      systemRecommendationAccurate,
      systemPredictionAccurate: evaluateSystemPredictionAccuracy(
        systemRecommendation,
        result
      ),
      analysisType,
      insight,
      failureReason,
      confidenceAnalysis,
      yourBetSelection: betSelection,
      systemRecommendation: systemRecommendation,
      actualResult: result,
    };
  };

  // Analyze which confidence factors were wrong
  const analyzeConfidenceFactors = (recommendation, actualBet, isCorrect) => {
    const breakdown = recommendation.confidence_breakdown || {};
    const analysis = {};

    // Team confidence analysis
    if (breakdown.team >= 7 && !isCorrect) {
      analysis.team = {
        wasHigh: true,
        issue:
          "High team confidence but team lost - possibly poor recent form not captured",
      };
    }

    // Home/Away confidence analysis
    if (breakdown.homeAway >= 7 && !isCorrect) {
      analysis.homeAway = {
        wasHigh: true,
        issue: "High home/away confidence but advantage didn't matter",
      };
    }

    // League confidence analysis
    if (breakdown.league >= 7 && !isCorrect) {
      analysis.league = {
        wasHigh: true,
        issue: "High league confidence but league trends didn't apply",
      };
    }

    // Odds confidence analysis
    if (breakdown.odds >= 7 && !isCorrect) {
      analysis.odds = {
        wasHigh: true,
        issue: "High odds confidence but market was wrong",
      };
    }

    return analysis;
  };

  // Generate overall analysis of all matched recommendations
  const generateOverallAnalysis = (matchedRecommendations) => {
    if (matchedRecommendations.length === 0) {
      return null;
    }

    const total = matchedRecommendations.length;

    // Count user bet outcomes
    const userBetsWon = matchedRecommendations.filter(
      (m) => m.analysis.yourBetWon
    ).length;
    const userBetsLost = total - userBetsWon;

    // Count system recommendation accuracy
    const systemCorrect = matchedRecommendations.filter(
      (m) => m.analysis.systemRecommendationAccurate
    ).length;
    const systemWrong = total - systemCorrect;

    // Calculate accuracies
    const userBetAccuracy = (userBetsWon / total) * 100;
    const systemAccuracy = (systemCorrect / total) * 100;

    // Analyze confidence factor failures
    const confidenceFailures = {
      team: 0,
      homeAway: 0,
      league: 0,
      odds: 0,
      matchup: 0,
      position: 0,
    };

    matchedRecommendations.forEach((match) => {
      if (
        !match.analysis.systemRecommendationAccurate &&
        match.analysis.confidenceAnalysis
      ) {
        Object.keys(match.analysis.confidenceAnalysis).forEach((factor) => {
          if (match.analysis.confidenceAnalysis[factor]?.wasHigh) {
            confidenceFailures[factor]++;
          }
        });
      }
    });

    return {
      total,
      correct: systemCorrect, // Show system recommendation accuracy
      wrong: systemWrong, // Show system recommendation failures
      accuracy: Math.round(systemAccuracy * 10) / 10, // System accuracy
      userBetsWon,
      userBetsLost,
      userBetAccuracy: Math.round(userBetAccuracy * 10) / 10,
      confidenceFailures,
      recommendations: matchedRecommendations,
    };
  };

  const findPreviousMatchups = (homeTeam, awayTeam, country, league) => {
    return findPreviousMatchupsService(homeTeam, awayTeam, country, league);
  };

  // Scoring Analysis Functions
  const analyzeScoringPatterns = async () => {
    return await analyzeScoringPatternsService();
  };

  const getScoringRecommendation = (
    homeTeam,
    awayTeam,
    homeLeague,
    awayLeague,
    scoringData = scoringAnalysis // Use passed data or fallback to state
  ) => {
    return getScoringRecommendationService(
      homeTeam,
      awayTeam,
      homeLeague,
      awayLeague,
      scoringData
    );
  };

  const getHeadToHeadData = () => {
    return getHeadToHeadDataService();
  };

  const getTopTeams = () => {
    return getTopTeamsService();
  };

  const getBetSlips = () => {
    const slipStats = new Map();

    // Group bets by BET_ID
    bets.forEach((bet) => {
      const betId = bet.BET_ID?.trim();
      if (!betId) return; // Skip bets without BET_ID

      if (!slipStats.has(betId)) {
        slipStats.set(betId, {
          betId,
          date: bet.DATE,
          bets: [],
          totalBets: 0,
          wins: 0,
          losses: 0,
          pending: 0,
          winRate: 0,
        });
      }

      const slip = slipStats.get(betId);
      slip.bets.push(bet);
      slip.totalBets++;

      // Count results
      const result = bet.RESULT?.toLowerCase() || "";
      if (result.includes("win")) {
        slip.wins++;
      } else if (result.includes("loss")) {
        slip.losses++;
      } else if (
        result.includes("pending") ||
        !result ||
        result.trim() === ""
      ) {
        slip.pending++;
      }
    });

    // Calculate win rates and convert to array
    const slipsArray = Array.from(slipStats.values())
      .map((slip) => {
        const totalWithResult = slip.wins + slip.losses;
        slip.winRate =
          totalWithResult > 0 ? (slip.wins / totalWithResult) * 100 : 0;
        // Add status field
        slip.status = slip.pending > 0 ? "Pending" : "Complete";
        return slip;
      })
      .sort((a, b) => {
        // Sort by date (newest first), then by win rate (highest first)
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;
        return b.winRate - a.winRate;
      });

    return slipsArray;
  };

  const getBetSlipsSummary = () => {
    const slips = getBetSlips();
    if (slips.length === 0) {
      return {
        totalSlips: 0,
        overallSuccessRate: 0,
        averageBetsPerSlip: 0,
        averageWins: 0,
        averageLosses: 0,
        bestPerformingSlip: null,
      };
    }

    const totalBets = slips.reduce((sum, slip) => sum + slip.totalBets, 0);
    const totalWins = slips.reduce((sum, slip) => sum + slip.wins, 0);
    const totalLosses = slips.reduce((sum, slip) => sum + slip.losses, 0);
    const totalWithResult = totalWins + totalLosses;

    // Filter for completed slips only when calculating best performing slip
    const completedSlips = slips.filter((slip) => slip.status === "Complete");
    const bestSlip =
      completedSlips.length > 0
        ? completedSlips.reduce((best, slip) =>
            slip.winRate > best.winRate ? slip : best
          )
        : null;

    return {
      totalSlips: slips.length,
      overallSuccessRate:
        totalWithResult > 0 ? (totalWins / totalWithResult) * 100 : 0,
      averageBetsPerSlip: totalBets / slips.length,
      averageWins: totalWins / slips.length,
      averageLosses: totalLosses / slips.length,
      bestPerformingSlip: bestSlip,
    };
  };

  const getTeamNotesForTeam = (teamName, country, league) => {
    console.log("Looking for team notes for:", { teamName, country, league });
    console.log("Available team notes:", teamNotes);

    const filteredNotes = teamNotes.filter((note) => {
      const matches =
        note.TEAM_NAME === teamName &&
        note.COUNTRY === country &&
        note.LEAGUE === league;
      console.log(
        "Checking note:",
        note.TEAM_NAME,
        "vs",
        teamName,
        "=",
        matches
      );
      return matches;
    });

    console.log("Found team notes:", filteredNotes);
    return filteredNotes;
  };

  const isTeamInTop40 = (teamName) => {
    const topTeams = getTopTeams();
    return topTeams.some(
      (team) => team.teamName.toLowerCase() === teamName?.toLowerCase()
    );
  };

  const getTop40Ranking = (teamName) => {
    const topTeams = getTopTeams();
    const team = topTeams.find(
      (team) => team.teamName.toLowerCase() === teamName?.toLowerCase()
    );
    return team ? topTeams.indexOf(team) + 1 : null;
  };

  const getPositionBadge = (position) => {
    if (!position) return null;

    switch (position) {
      case "Top":
        return { text: "🥇 Top", color: "text-green-400" };
      case "Mid":
        return { text: "🥈 Mid", color: "text-yellow-400" };
      case "Bottom":
        return { text: "🥉 Bottom", color: "text-red-400" };
      case "Cup":
        return { text: "🏆 Cup", color: "text-purple-400" };
      default:
        return null;
    }
  };

  const getDeduplicatedNewBets = (newBets) => {
    return getDeduplicatedNewBetsService(newBets);
  };

  const getBetTypeAnalyticsForTeam = (teamName, country, league) => {
    const deduplicatedBets = getDeduplicatedBetsForAnalysis;

    // Filter bets for the specific team in the exact country + league combination
    const teamBets = deduplicatedBets.filter(
      (bet) =>
        bet.TEAM_INCLUDED === teamName &&
        bet.COUNTRY === country &&
        bet.LEAGUE === league
    );

    if (teamBets.length === 0) return null;

    // Group by bet type
    const betTypeGroups = {};

    teamBets.forEach((bet) => {
      const betType = bet.BET_TYPE || "Unknown";
      const result = bet.RESULT?.toLowerCase() || "";
      const isWin = result.includes("win");
      const isLoss = result.includes("loss");

      if (!betTypeGroups[betType]) {
        betTypeGroups[betType] = {
          betType,
          wins: 0,
          losses: 0,
          total: 0,
        };
      }

      betTypeGroups[betType].total++;
      if (isWin) betTypeGroups[betType].wins++;
      if (isLoss) betTypeGroups[betType].losses++;
    });

    // Calculate win rates and sort by performance
    const analytics = Object.values(betTypeGroups)
      .filter((group) => group.total >= 2) // Only include bet types with 2+ bets
      .map((group) => ({
        betType: group.betType,
        wins: group.wins,
        losses: group.losses,
        total: group.total,
        winRate:
          group.total > 0 ? ((group.wins / group.total) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

    return analytics;
  };

  const getProcessedDailyGames = () => {
    const deduplicatedBets = getDeduplicatedBetsForAnalysis;
    const allTeams = new Set();

    // Get all teams from betting history
    deduplicatedBets.forEach((bet) => {
      if (bet.HOME_TEAM) allTeams.add(bet.HOME_TEAM);
      if (bet.AWAY_TEAM) allTeams.add(bet.AWAY_TEAM);
    });

    // Simple exact team name matching
    const findBestTeamMatch = (teamName) => {
      if (!teamName) return null;

      console.log(`Looking for exact match for: "${teamName}"`);

      // Only try exact match
      if (allTeams.has(teamName)) {
        console.log(`Found exact match: "${teamName}"`);
        return teamName;
      }

      console.log(`No exact match found for: "${teamName}"`);
      return null;
    };

    // Debug: Log key information
    console.log("Total teams in betting history:", allTeams.size);
    console.log("Total daily games:", dailyGames.length);

    // Check for specific teams we know should match
    console.log(
      "FK Tukums 2000/TSS in history:",
      allTeams.has("FK Tukums 2000/TSS")
    );
    console.log("Riga FC in history:", allTeams.has("Riga FC"));

    const processedGames = dailyGames.map((game) => {
      console.log(`Processing game: ${game.home_team} vs ${game.away_team}`);

      const matchedHomeTeam = findBestTeamMatch(game.home_team);
      const matchedAwayTeam = findBestTeamMatch(game.away_team);

      const homeTeamInHistory = matchedHomeTeam !== null;
      const awayTeamInHistory = matchedAwayTeam !== null;

      console.log(
        `Home team match: ${
          homeTeamInHistory ? "YES" : "NO"
        } (${matchedHomeTeam})`
      );
      console.log(
        `Away team match: ${
          awayTeamInHistory ? "YES" : "NO"
        } (${matchedAwayTeam})`
      );

      // Get team analytics if team exists in history
      const homeTeamAnalytics = homeTeamInHistory
        ? teamAnalytics.find((t) => t.team === matchedHomeTeam)
        : null;
      const awayTeamAnalytics = awayTeamInHistory
        ? teamAnalytics.find((t) => t.team === matchedAwayTeam)
        : null;

      // Get country and league data from original betting data
      const getTeamCountryLeague = (teamName) => {
        const teamBets = deduplicatedBets.filter(
          (bet) => bet.HOME_TEAM === teamName || bet.AWAY_TEAM === teamName
        );
        if (teamBets.length > 0) {
          const bet = teamBets[0]; // Get first bet for this team
          return {
            country: bet.COUNTRY || "",
            league: bet.LEAGUE || "",
          };
        }
        return { country: "", league: "" };
      };

      const homeCountryLeague = homeTeamInHistory
        ? getTeamCountryLeague(matchedHomeTeam)
        : null;
      const awayCountryLeague = awayTeamInHistory
        ? getTeamCountryLeague(matchedAwayTeam)
        : null;

      // Get head-to-head data
      const headToHeadData =
        homeTeamInHistory && awayTeamInHistory
          ? findPreviousMatchups(matchedHomeTeam, matchedAwayTeam, "", "")
          : [];

      // Get top 40 rankings
      const homeTeamRank = homeTeamInHistory
        ? getTop40Ranking(matchedHomeTeam)
        : null;
      const awayTeamRank = awayTeamInHistory
        ? getTop40Ranking(matchedAwayTeam)
        : null;

      const result = {
        ...game,
        matchedHomeTeam,
        matchedAwayTeam,
        homeTeamInHistory,
        awayTeamInHistory,
        homeTeamAnalytics,
        awayTeamAnalytics,
        homeCountryLeague,
        awayCountryLeague,
        headToHeadData,
        homeTeamRank,
        awayTeamRank,
        hasHistoricalData: homeTeamInHistory || awayTeamInHistory,
      };

      console.log(`Game has historical data: ${result.hasHistoricalData}`);
      return result;
    });

    const filteredGames = processedGames.filter(
      (game) => game.hasHistoricalData
    );
    console.log(
      `Total games processed: ${processedGames.length}, Games with historical data: ${filteredGames.length}`
    );

    return filteredGames;
  };

  const getTeamBetTypeAnalytics = () => {
    const deduplicatedBets = getDeduplicatedBetsForAnalysis;

    // Group bets by team
    const teamGroups = {};

    deduplicatedBets.forEach((bet) => {
      const teamIncluded = bet.TEAM_INCLUDED;
      const homeTeam = bet.HOME_TEAM;
      const awayTeam = bet.AWAY_TEAM;
      const betType = bet.BET_TYPE || "Unknown";
      const result = bet.RESULT?.toLowerCase() || "";
      const isWin = result.includes("win");
      const isLoss = result.includes("loss");

      // Determine the correct odds based on which team was bet on
      let odds = 0;
      if (teamIncluded === homeTeam) {
        odds = parseFloat(bet.ODDS1) || 0;
      } else if (teamIncluded === awayTeam) {
        odds = parseFloat(bet.ODDS2) || 0;
      } else {
        // Fallback to ODDS1 if we can't determine
        odds = parseFloat(bet.ODDS1) || 0;
      }

      const league = `${bet.COUNTRY} ${bet.LEAGUE}`;

      // Use TEAM_INCLUDED if available, otherwise use HOME_TEAM or AWAY_TEAM
      const teamToAnalyze = teamIncluded || homeTeam || awayTeam;

      if (!teamToAnalyze) return; // Skip bets without any team

      // Exclude teams named "Over 1.5" and "Over 0.5"
      if (teamToAnalyze === "Over 1.5" || teamToAnalyze === "Over 0.5") {
        return;
      }

      if (!teamGroups[teamToAnalyze]) {
        teamGroups[teamToAnalyze] = {
          team: teamToAnalyze,
          total: 0,
          wins: 0,
          losses: 0,
          totalOdds: 0,
          betTypes: {},
          leagues: {},
          recentBets: [],
        };
      }

      const group = teamGroups[teamToAnalyze];
      group.total++;
      group.totalOdds += odds;

      if (isWin) group.wins++;
      if (isLoss) group.losses++;

      // Track bet types
      if (!group.betTypes[betType]) {
        group.betTypes[betType] = {
          wins: 0,
          losses: 0,
          total: 0,
          totalOdds: 0,
        };
      }
      group.betTypes[betType].total++;
      group.betTypes[betType].totalOdds += odds;
      if (isWin) group.betTypes[betType].wins++;
      if (isLoss) group.betTypes[betType].losses++;

      // Track leagues
      if (league) {
        if (!group.leagues[league]) {
          group.leagues[league] = { wins: 0, losses: 0, total: 0 };
        }
        group.leagues[league].total++;
        if (isWin) group.leagues[league].wins++;
        if (isLoss) group.leagues[league].losses++;
      }

      // Track recent bets (last 20)
      if (group.recentBets.length < 20) {
        group.recentBets.push({
          date: bet.DATE,
          result: isWin ? "W" : isLoss ? "L" : "P",
          betType: betType,
          odds: odds,
          league: league,
        });
      }
    });

    // Calculate win rates and process data
    const analytics = Object.values(teamGroups)
      .filter((team) => team.total >= 5) // Only include teams with 5+ bets
      .map((group) => {
        const winRate =
          group.total > 0 ? ((group.wins / group.total) * 100).toFixed(1) : 0;
        const avgOdds =
          group.total > 0 ? (group.totalOdds / group.total).toFixed(2) : 0;

        // Get bet type breakdown
        const betTypeBreakdown = Object.entries(group.betTypes)
          .map(([betType, stats]) => ({
            betType,
            wins: stats.wins,
            losses: stats.losses,
            total: stats.total,
            winRate:
              stats.total > 0
                ? ((stats.wins / stats.total) * 100).toFixed(1)
                : 0,
            avgOdds:
              stats.total > 0 ? (stats.totalOdds / stats.total).toFixed(2) : 0,
          }))
          .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

        // Get league breakdown
        const leagueBreakdown = Object.entries(group.leagues)
          .map(([league, stats]) => ({
            league,
            wins: stats.wins,
            losses: stats.losses,
            total: stats.total,
            winRate:
              stats.total > 0
                ? ((stats.wins / stats.total) * 100).toFixed(1)
                : 0,
          }))
          .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

        // Calculate recent performance
        const recentWins = group.recentBets.filter(
          (bet) => bet.result === "W"
        ).length;
        const recentLosses = group.recentBets.filter(
          (bet) => bet.result === "L"
        ).length;
        const recentTotal = recentWins + recentLosses;
        const recentWinRate =
          recentTotal > 0 ? ((recentWins / recentTotal) * 100).toFixed(1) : 0;

        return {
          ...group,
          winRate,
          avgOdds,
          betTypeBreakdown,
          leagueBreakdown,
          recentWinRate,
          recentWins,
          recentLosses,
          recentTotal,
        };
      });

    // Calculate composite score for better ranking
    const analyticsWithScore = analytics.map((team) => {
      // Composite score: Win Rate (60%) + Sample Size Bonus (40%)
      const winRateScore = parseFloat(team.winRate) * 0.6;

      // Sample size bonus: More bets = higher reliability score
      let sampleSizeScore = 0;
      if (team.total >= 20) sampleSizeScore = 40; // 20+ bets = max score
      else if (team.total >= 15) sampleSizeScore = 35; // 15-19 bets
      else if (team.total >= 10) sampleSizeScore = 30; // 10-14 bets
      else if (team.total >= 8) sampleSizeScore = 25; // 8-9 bets
      else if (team.total >= 5) sampleSizeScore = 20; // 5-7 bets (minimum threshold)

      const compositeScore = winRateScore + sampleSizeScore;

      return {
        ...team,
        compositeScore,
        sampleSizeScore,
      };
    });

    // Sort by composite score descending
    return analyticsWithScore.sort(
      (a, b) => b.compositeScore - a.compositeScore
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#121212] via-[#1E1E1E] to-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your bets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#121212] via-[#1E1E1E] to-[#121212] flex items-center justify-center">
        <div className="bg-red-500 text-white px-6 py-4 rounded-lg">
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121212] via-[#1E1E1E] to-[#121212]">
      {/* Header */}
      <div className="w-full px-2 md:px-4 py-4 md:py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            <span className="text-2xl md:text-[44px]">⚽️</span> BET TRACKER
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-6 border border-white/20">
            <div className="text-2xl font-bold text-white">
              {getDeduplicatedFilteredBets().length}
            </div>
            <div className="text-gray-300">Filtered Bets</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-6 border border-white/20">
            <div className="text-2xl font-bold text-green-400">
              {
                getDeduplicatedFilteredBets().filter((bet) =>
                  bet.RESULT?.toLowerCase().includes("win")
                ).length
              }
            </div>
            <div className="text-gray-300">Wins</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-6 border border-white/20">
            <div className="text-2xl font-bold text-red-400">
              {
                getDeduplicatedFilteredBets().filter((bet) =>
                  bet.RESULT?.toLowerCase().includes("loss")
                ).length
              }
            </div>
            <div className="text-gray-300">Losses</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-6 border border-white/20">
            <div className="text-2xl font-bold text-yellow-400">
              {
                getDeduplicatedFilteredBets().filter(
                  (bet) => !bet.RESULT || bet.RESULT.trim() === ""
                ).length
              }
            </div>
            <div className="text-gray-300">Pending</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-6 border border-white/20 col-span-2 md:col-span-1">
            <div className="text-2xl font-bold text-blue-400">
              {calculateWinPercentageForBets(getDeduplicatedFilteredBets())}%
            </div>
            <div className="text-gray-300">Win Rate</div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6">
          {(() => {
            const performers = getBestPerformers();
            return (
              <>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-6 border border-white/20">
                  <div className="text-sm md:text-lg font-bold text-green-400 mb-1 md:mb-2">
                    Best League
                  </div>
                  <div className="text-lg md:text-2xl font-bold text-white">
                    {performers.bestLeague.leagueDisplay ||
                      performers.bestLeague.league ||
                      "N/A"}
                  </div>
                  <div className="text-xs md:text-sm text-gray-300">
                    {performers.bestLeague.winRate || 0}% Win Rate
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-6 border border-white/20">
                  <div className="text-sm md:text-lg font-bold text-green-400 mb-1 md:mb-2">
                    Best Country
                  </div>
                  <div className="text-lg md:text-2xl font-bold text-white">
                    {performers.bestCountry.country || "N/A"}
                  </div>
                  <div className="text-xs md:text-sm text-gray-300">
                    {performers.bestCountry.winRate || 0}% Win Rate
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-6 border border-white/20">
                  <div className="text-sm md:text-lg font-bold text-blue-400 mb-1 md:mb-2">
                    Most Bets
                  </div>
                  <div className="text-lg md:text-2xl font-bold text-white">
                    {performers.mostBetsLeague.leagueDisplay ||
                      performers.mostBetsLeague.league ||
                      "N/A"}
                  </div>
                  <div className="text-xs md:text-sm text-gray-300">
                    {performers.mostBetsLeague.total || 0} Bets
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-6 border border-white/20">
                  <div className="text-sm md:text-lg font-bold text-red-400 mb-1 md:mb-2">
                    Worst League
                  </div>
                  <div className="text-lg md:text-2xl font-bold text-white">
                    {performers.worstLeague.leagueDisplay ||
                      performers.worstLeague.league ||
                      "N/A"}
                  </div>
                  <div className="text-xs md:text-sm text-gray-300">
                    {performers.worstLeague.winRate || 0}% Win Rate
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        <FilterControls
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          filters={filters}
          handleFilterChange={handleFilterChange}
          getUniqueValues={getUniqueValues}
          getBestPerformers={getBestPerformers}
          setFilters={setFilters}
          setDataViewLoaded={setDataViewLoaded}
        />

        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Content */}
        <div className="px-2 md:px-0">
          {activeTab === "data" && (
            <DataTab
              dataViewLoaded={dataViewLoaded}
              getDeduplicatedFilteredBets={getDeduplicatedFilteredBets}
              handleSort={handleSort}
              sortConfig={sortConfig}
              getSortedData={getSortedDataLocal}
              getStatusColor={getStatusColorClass}
              formatDate={formatDateString}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsTab
              handleAnalyticsSort={handleAnalyticsSort}
              handleAnalyticsMultiSort={handleAnalyticsMultiSort}
              analyticsSortConfig={analyticsSortConfig}
              getSortedAnalyticsData={getSortedAnalyticsData}
              expandedAnalyticsTeams={expandedAnalyticsTeams}
              toggleAnalyticsTeamExpansion={toggleAnalyticsTeamExpansion}
              bets={bets}
            />
          )}

          {activeTab === "performance" && (
            <PerformanceTab
              handleLeagueSort={handleLeagueSort}
              leagueSortConfig={leagueSortConfig}
              getSortedLeagueData={getSortedLeagueDataLocal}
              handleCountrySort={handleCountrySort}
              countrySortConfig={countrySortConfig}
              getSortedCountryData={getSortedCountryDataLocal}
            />
          )}

          {activeTab === "blacklist" && (
            <BlacklistTab
              handleBlacklistSort={handleBlacklistSort}
              blacklistSortConfig={blacklistSortConfig}
              blacklistedTeams={blacklistedTeams}
              getSortedBlacklistData={getSortedBlacklistData}
            />
          )}

          {activeTab === "odds" && (
            <OddsTab
              handleOddsSort={handleOddsSort}
              oddsSortConfig={oddsSortConfig}
              getSortedOddsData={getSortedOddsDataLocal}
              getFilteredOddsAnalytics={getFilteredOddsAnalytics}
              expandedOddsRanges={expandedOddsRanges}
              toggleOddsRangeExpansion={toggleOddsRangeExpansion}
              getBetsForOddsRange={getBetsForOddsRange}
              formatDate={formatDateString}
              getStatusColor={getStatusColorClass}
            />
          )}

          {activeTab === "betAnalysis" && (
            <BetAnalysisTab
              analyzeNewBets={analyzeNewBets}
              isAnalyzing={isAnalyzing}
              generatePDFReport={generatePDFReport}
              updateDatabase={updateDatabase}
              isUpdatingDatabase={isUpdatingDatabase}
              analysisResults={analysisResults}
              handleAnalysisSort={handleAnalysisSort}
              analysisSortConfig={analysisSortConfig}
              getSortedAnalysisResults={getSortedAnalysisResultsLocal}
              formatDate={formatDateString}
              getStatusColor={getStatusColorClass}
              getPositionBadge={getPositionBadge}
              isTeamInTop40={isTeamInTop40}
              getTop40Ranking={getTop40Ranking}
              getBetTypeAnalyticsForTeam={getBetTypeAnalyticsForTeam}
              getTeamNotesForTeam={getTeamNotesForTeam}
            />
          )}

          {/* Original betAnalysis content - to be removed after testing */}
          {false && activeTab === "betAnalysis" && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="flex items-center mb-4">
                <h3 className="text-lg font-bold text-white">Bet Analysis</h3>
                <div className="relative ml-2 group">
                  <button className="text-blue-400 hover:text-blue-300 text-sm bg-blue-500/20 hover:bg-blue-500/30 rounded-full w-6 h-6 flex items-center justify-center transition-colors">
                    ?
                  </button>
                  <div className="absolute left-0 top-8 w-96 bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
                    <div className="mb-3">
                      <strong className="text-white">
                        Confidence Score (0-10):
                      </strong>
                      <br />
                      🏆 Team Performance: Historical win rate and betting
                      experience
                      <br />
                      🏛️ League Experience: Your success rate in this
                      league/country
                      <br />
                      💰 Odds Value: Risk assessment based on betting odds
                      <br />
                      ⚔️ Head-to-Head: Previous results when these teams met
                      <br />
                      📊 League Position: Team strength based on league position
                      (Top/Mid/Bottom)
                      <br />
                      🏠 Home/Away: Team performance in home vs away games
                    </div>
                    <div>
                      <strong className="text-white">
                        📊 Probability Calculator:
                      </strong>
                      <br />
                      🏠 Home/Draw/Away: Mathematical probabilities from odds
                      <br />
                      📈 Expected Goals: Poisson distribution modeling
                      <br />
                      🎯 Top Scorelines: Most likely final scores
                    </div>
                  </div>
                </div>
              </div>

              {/* Fetch and Analyze Button */}
              <div className="mb-6 flex gap-4">
                <button
                  onClick={analyzeNewBets}
                  disabled={isAnalyzing}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isAnalyzing
                      ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {isAnalyzing ? "🔄 Analyzing..." : "Fetch & Analyze New Bets"}
                </button>
                <button
                  onClick={generatePDFReport}
                  disabled={!analysisResults || analysisResults.length === 0}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    !analysisResults || analysisResults.length === 0
                      ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  📄 Generate PDF Report
                </button>
              </div>

              {/* Analysis Results */}
              {analysisResults.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    📋 Analysis Results ({analysisResults.length} bets)
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/20">
                        <tr>
                          <th
                            className="px-4 py-2 text-left text-white font-semibold w-20 cursor-pointer hover:bg-white/10"
                            onClick={() => handleAnalysisSort("DATE")}
                          >
                            <div className="flex items-center">
                              Date
                              {analysisSortConfig.key === "DATE" && (
                                <span className="ml-1">
                                  {analysisSortConfig.direction === "asc"
                                    ? "↑"
                                    : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                          <th className="px-4 py-2 text-left text-white font-semibold w-32">
                            Match
                          </th>
                          <th className="px-4 py-2 text-left text-white font-semibold w-20">
                            Positions
                          </th>
                          <th className="px-4 py-2 text-left text-white font-semibold w-24">
                            Bet On
                          </th>
                          <th className="px-4 py-2 text-left text-white font-semibold w-16">
                            Odds
                          </th>
                          <th className="px-4 py-2 text-left text-white font-semibold w-80">
                            Confidence
                          </th>
                          <th className="px-4 py-2 text-left text-white font-semibold w-80">
                            Probability
                          </th>
                          <th className="px-4 py-2 text-left text-white font-semibold w-32">
                            Blacklist
                          </th>
                          <th className="px-4 py-2 text-left text-white font-semibold w-80">
                            History
                          </th>
                          <th className="px-4 py-2 text-left text-white font-semibold w-32">
                            Previous Matchups
                          </th>
                          <th className="px-4 py-2 text-left text-white font-semibold w-32">
                            Recommendation
                          </th>
                          <th className="px-4 py-2 text-left text-white font-semibold w-40">
                            Scoring
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {getSortedAnalysisResultsLocal().map(
                          (result, index) => (
                            <tr
                              key={index}
                              className={`${
                                index % 2 === 0 ? "bg-white/5" : "bg-white/10"
                              }`}
                            >
                              <td className="px-4 py-6 text-gray-300">
                                {formatDateString(result.DATE)}
                              </td>
                              <td className="px-4 py-6 text-gray-300">
                                <div className="text-sm">
                                  <div>
                                    {result.HOME_TEAM} vs {result.AWAY_TEAM}
                                  </div>
                                  <div className="text-gray-400 text-xs">
                                    {result.COUNTRY} • {result.LEAGUE}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-6 text-gray-300">
                                <div className="text-sm">
                                  {(() => {
                                    const homeBadge = getPositionBadge(
                                      result.HOME_TEAM_POSITION
                                    );
                                    const awayBadge = getPositionBadge(
                                      result.AWAY_TEAM_POSITION
                                    );
                                    return (
                                      <div>
                                        <div
                                          className={`text-xs ${
                                            homeBadge?.color || "text-gray-400"
                                          }`}
                                        >
                                          {homeBadge?.text || "N/A"}
                                        </div>
                                        <div
                                          className={`text-xs ${
                                            awayBadge?.color || "text-gray-400"
                                          }`}
                                        >
                                          {awayBadge?.text || "N/A"}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="px-4 py-6 text-purple-300 font-medium">
                                <div>
                                  {result.TEAM_INCLUDED}
                                  {isTeamInTop40(result.TEAM_INCLUDED) && (
                                    <div className="text-xs text-yellow-400 mt-1">
                                      Top 40: #
                                      {getTop40Ranking(result.TEAM_INCLUDED)}
                                    </div>
                                  )}
                                  {result.isBlacklisted && (
                                    <div className="text-xs text-red-400 mt-1 font-medium">
                                      🚫 Blacklisted
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-6 text-yellow-400 font-mono">
                                {result.betOdds}
                              </td>
                              <td className="px-4 py-6">
                                <div className="text-sm">
                                  <div className="mb-1">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium mb-2 ${result.confidenceLabel.color} cursor-help`}
                                      title={`${result.confidenceLabel.label}
🏆 Team Performance: ${result.confidenceBreakdown.team}/10
📈 Recent Form: ${result.confidenceBreakdown.recentForm}/10
🏛️ League Experience: ${result.confidenceBreakdown.league}/10
💰 Odds Value: ${result.confidenceBreakdown.odds}/10
⚔️ Head-to-Head: ${result.confidenceBreakdown.matchup}/10
📊 League Position: ${result.confidenceBreakdown.position}/10
🏠 Home/Away: ${result.confidenceBreakdown.homeAway}/10`}
                                    >
                                      {result.confidenceLabel.emoji}{" "}
                                      {result.confidenceScore}/10
                                    </span>
                                    <div className="text-xs text-gray-400 mt-2">
                                      {result.confidenceLabel.label}
                                    </div>
                                  </div>

                                  {/* Bet Type Suggestions */}
                                  {(() => {
                                    const betTypeAnalytics =
                                      getBetTypeAnalyticsForTeam(
                                        result.TEAM_INCLUDED,
                                        result.COUNTRY,
                                        result.LEAGUE
                                      );

                                    if (
                                      betTypeAnalytics &&
                                      betTypeAnalytics.length > 0
                                    ) {
                                      const topBetTypes =
                                        betTypeAnalytics.slice(0, 3); // Show top 3
                                      return (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                          <div className="text-xs text-blue-400 font-medium mb-2">
                                            💡 Bet Type Tips for{" "}
                                            {result.team_included}:
                                          </div>
                                          {topBetTypes.map((betType, idx) => {
                                            const isGood =
                                              parseFloat(betType.winRate) >= 60;
                                            const isAverage =
                                              parseFloat(betType.winRate) >= 40;
                                            const icon = isGood
                                              ? "✅"
                                              : isAverage
                                              ? "⚠️"
                                              : "❌";
                                            const color = isGood
                                              ? "text-green-300"
                                              : isAverage
                                              ? "text-yellow-300"
                                              : "text-red-300";

                                            return (
                                              <div
                                                key={idx}
                                                className={`text-xs ${color} mb-1`}
                                              >
                                                {icon} {betType.betType}:{" "}
                                                {betType.winRate}% (
                                                {betType.wins}/{betType.total})
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}

                                  {/* Team Notes Display */}
                                  {(() => {
                                    const homeTeamNotes = getTeamNotesForTeam(
                                      result.HOME_TEAM,
                                      result.COUNTRY,
                                      result.LEAGUE
                                    );
                                    const awayTeamNotes = getTeamNotesForTeam(
                                      result.AWAY_TEAM,
                                      result.COUNTRY,
                                      result.LEAGUE
                                    );

                                    if (
                                      homeTeamNotes.length > 0 ||
                                      awayTeamNotes.length > 0
                                    ) {
                                      return (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                          <div className="text-xs text-orange-400 font-medium mb-2">
                                            📝 Team Notes:
                                          </div>
                                          {homeTeamNotes.map((note, idx) => (
                                            <div
                                              key={`home-${idx}`}
                                              className="text-xs text-orange-300 mb-1"
                                            >
                                              <span className="font-medium">
                                                {result.HOME_TEAM}:
                                              </span>{" "}
                                              {note.NOTE}
                                              <span className="text-gray-400 ml-1">
                                                ({note.DATE_ADDED})
                                              </span>
                                            </div>
                                          ))}
                                          {awayTeamNotes.map((note, idx) => (
                                            <div
                                              key={`away-${idx}`}
                                              className="text-xs text-orange-300 mb-1"
                                            >
                                              <span className="font-medium">
                                                {result.AWAY_TEAM}:
                                              </span>{" "}
                                              {note.NOTE}
                                              <span className="text-gray-400 ml-1">
                                                ({note.DATE_ADDED})
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </td>
                              <td className="px-4 py-6">
                                {result.probabilities ? (
                                  <div className="text-sm">
                                    <div className="mb-2">
                                      <div className="text-xs text-gray-400 mb-1">
                                        Win Probabilities:
                                      </div>
                                      <div className="flex space-x-2 text-xs">
                                        <span className="text-blue-300">
                                          🏠 {result.probabilities.probs.home}%
                                        </span>
                                        <span className="text-yellow-300">
                                          🤝 {result.probabilities.probs.draw}%
                                        </span>
                                        <span className="text-red-300">
                                          ✈️ {result.probabilities.probs.away}%
                                        </span>
                                      </div>
                                    </div>
                                    <div className="mb-2">
                                      <div className="text-xs text-gray-400 mb-1">
                                        Expected Goals:
                                      </div>
                                      <div className="text-xs text-purple-300">
                                        {result.probabilities.lambda.home} -{" "}
                                        {result.probabilities.lambda.away}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-gray-400 mb-1">
                                        Top Scorelines:
                                      </div>
                                      {result.probabilities.topScores
                                        .slice(0, 3)
                                        .map((score, idx) => (
                                          <div
                                            key={idx}
                                            className="text-xs text-green-300"
                                          >
                                            {score.score} ({score.prob}%)
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">
                                    No odds data
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-6">
                                {result.isBlacklisted ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap">
                                    🚫 Blacklisted
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                                    ✅ Safe
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-6 text-gray-300">
                                {result.hasHistory ? (
                                  <div className="text-sm">
                                    <div>
                                      {result.historicalWins}W -{" "}
                                      {result.historicalLosses}L
                                    </div>
                                    <div className="text-xs mt-2">
                                      {result.winRate}% win rate
                                    </div>
                                    {result.competitions.length > 0 && (
                                      <div className="mt-1">
                                        <div className="text-xs text-blue-400 font-medium">
                                          Competitions:
                                        </div>
                                        {result.competitions.map(
                                          (comp, idx) => (
                                            <div
                                              key={idx}
                                              className="text-xs text-blue-300"
                                            >
                                              • {comp}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                    {result.winDetails.length > 0 && (
                                      <div className="mt-1">
                                        <div className="text-xs text-green-400 font-medium">
                                          Wins:
                                        </div>
                                        {result.winDetails.map(
                                          (detail, idx) => (
                                            <div
                                              key={idx}
                                              className="text-xs text-green-300"
                                            >
                                              • {detail}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                    {result.lossDetails.length > 0 && (
                                      <div className="mt-1">
                                        <div className="text-xs text-red-400 font-medium">
                                          Losses:
                                        </div>
                                        {result.lossDetails.map(
                                          (detail, idx) => (
                                            <div
                                              key={idx}
                                              className="text-xs text-red-300"
                                            >
                                              • {detail}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">
                                    No history
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-6 text-gray-300">
                                {result.previousMatchups.length > 0 ? (
                                  <div className="text-sm">
                                    <div className="text-blue-400 font-medium mb-1">
                                      🔄 {result.previousMatchups.length}{" "}
                                      previous matchup
                                      {result.previousMatchups.length > 1
                                        ? "s"
                                        : ""}
                                    </div>
                                    {(() => {
                                      const wins =
                                        result.previousMatchups.filter((m) =>
                                          m.result
                                            ?.toLowerCase()
                                            .includes("win")
                                        ).length;
                                      const losses =
                                        result.previousMatchups.filter((m) =>
                                          m.result
                                            ?.toLowerCase()
                                            .includes("loss")
                                        ).length;
                                      const total = wins + losses;
                                      const winRate =
                                        total > 0
                                          ? ((wins / total) * 100).toFixed(1)
                                          : 0;

                                      return (
                                        <div className="text-xs">
                                          <div className="text-gray-300 mb-1">
                                            {wins}W - {losses}L
                                          </div>
                                          <span
                                            className={`px-1 py-0.5 rounded text-xs font-medium mt-2 ${
                                              parseFloat(winRate) >= 70
                                                ? "bg-green-100 text-green-800"
                                                : parseFloat(winRate) >= 50
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                          >
                                            {winRate}% win rate
                                          </span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">
                                    No previous matchups
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-6">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${result.recommendationColor}`}
                                >
                                  {result.recommendation}
                                </span>
                              </td>
                              <td className="px-4 py-6">
                                {result.scoringRecommendation ? (
                                  <div className="text-sm">
                                    <div
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        result.scoringRecommendation
                                          .confidence === "high"
                                          ? "bg-green-100 text-green-800"
                                          : result.scoringRecommendation
                                              .confidence === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {result.scoringRecommendation.type}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      {result.scoringRecommendation.rate.toFixed(
                                        1
                                      )}
                                      % rate
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">
                                    No data
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Stats */}
                  <div className="mt-6 p-4 bg-white/5 rounded-lg">
                    <h5 className="text-white font-semibold mb-3">
                      📊 Summary
                    </h5>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Total Bets</div>
                        <div className="text-white font-medium">
                          {analysisResults.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Blacklisted</div>
                        <div className="text-red-400 font-medium">
                          {
                            analysisResults.filter((r) => r.isBlacklisted)
                              .length
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">High Confidence</div>
                        <div className="text-green-400 font-medium">
                          {
                            analysisResults.filter(
                              (r) =>
                                r.recommendation.includes("Win") ||
                                r.recommendation === "Home Win" ||
                                r.recommendation === "Away Win"
                            ).length
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Double Chance</div>
                        <div className="text-yellow-400 font-medium">
                          {
                            analysisResults.filter((r) =>
                              r.recommendation.includes("Double Chance")
                            ).length
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Avoid</div>
                        <div className="text-red-400 font-medium">
                          {
                            analysisResults.filter((r) =>
                              r.recommendation.includes("Avoid")
                            ).length
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {analysisResults.length === 0 && !isAnalyzing && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-lg mb-4">
                    No Analysis Results
                  </div>
                  <p className="text-gray-500">
                    Click the button above to fetch and analyze new bets from
                    Sheet3.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "query" && (
            <QueryTab
              queryFilters={queryFilters}
              updateQueryFilter={updateQueryFilter}
              addQueryFilter={addQueryFilter}
              removeQueryFilter={removeQueryFilter}
              clearQuery={clearQuery}
              executeQuery={executeQuery}
              isQuerying={isQuerying}
              queryResults={queryResults}
              getAvailableFields={getAvailableFields}
              getFieldValues={getFieldValues}
              getAvailableMetrics={getAvailableMetrics}
              getAvailableOperators={getAvailableOperators}
            />
          )}

          {activeTab === "recommendations" && (
            <RecommendationsTab betRecommendations={betRecommendations} />
          )}

          {activeTab === "teamUpload" && (
            <TeamUploadTab
              scoringAnalysis={scoringAnalysis}
              teamAnalytics={teamAnalytics}
              blacklistedTeams={blacklistedTeams}
              isTeamBlacklisted={isTeamBlacklisted}
              bets={bets}
              analyzeScoringPatterns={analyzeScoringPatterns}
            />
          )}

          {activeTab === "quickLookup" && (
            <QuickLookupTab
              scoringAnalysis={scoringAnalysis}
              teamAnalytics={teamAnalytics}
              bets={bets}
            />
          )}

          {activeTab === "predictionAccuracy" && (
            <PredictionAccuracyTab
              getPredictionAccuracyMetrics={getPredictionAccuracyMetrics}
            />
          )}

          {activeTab === "recommendationAnalysis" && (
            <RecommendationAnalysisTab
              compareRecommendationsWithResults={
                compareRecommendationsWithResults
              }
              isComparing={isComparing}
              comparisonResults={comparisonResults}
              setComparisonResults={setComparisonResults}
            />
          )}

          {activeTab === "headToHead" && (
            <HeadToHeadTab
              analysisResults={analysisResults}
              formatDate={formatDateString}
            />
          )}

          {activeTab === "topTeams" && (
            <TopTeamsTab
              getTopTeams={getTopTeams}
              blacklistedTeams={blacklistedTeams}
              isTeamBlacklisted={isTeamBlacklisted}
            />
          )}

          {activeTab === "betSlips" && (
            <BetSlipsTab
              showCompletedSlips={showCompletedSlips}
              setShowCompletedSlips={setShowCompletedSlips}
              getBetSlipsSummary={getBetSlipsSummary}
              handleSlipsSort={handleSlipsSort}
              slipsSortConfig={slipsSortConfig}
              getSortedSlipsData={getSortedSlipsDataLocal}
              expandedSlips={expandedSlips}
              toggleSlipExpansion={toggleSlipExpansion}
              formatDate={formatDateString}
              attachedPredictions={attachedPredictions}
              getTodayPredictions={getTodayPredictions}
              checkBetslipMatch={checkBetslipMatch}
              attachPredictionsToBetslip={attachPredictionsToBetslip}
            />
          )}

          {activeTab === "teamNotes" && (
            <TeamNotesTab
              handleTeamNotesSort={handleTeamNotesSort}
              teamNotesSortConfig={teamNotesSortConfig}
              getSortedTeamNotesData={getSortedTeamNotesData}
              teamNotes={teamNotes}
            />
          )}

          {activeTab === "betTypeAnalytics" && (
            <TeamAnalyticsTab
              getTeamBetTypeAnalytics={getTeamBetTypeAnalytics}
              expandedBetTypes={expandedBetTypes}
              toggleTeamExpansion={toggleTeamExpansion}
            />
          )}

          {activeTab === "dailyGames" && (
            <DailyGamesTab
              dailyGamesLoading={dailyGamesLoading}
              getProcessedDailyGames={getProcessedDailyGames}
            />
          )}

          {activeTab === "scoringAnalysis" && (
            <ScoringAnalysisTab
              analyzeScoringPatterns={analyzeScoringPatterns}
              scoringAnalysisLoading={scoringAnalysisLoading}
              scoringAnalysis={scoringAnalysis}
              bets={bets}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
