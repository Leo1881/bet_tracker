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
import {
  getOddsAnalytics as getOddsAnalyticsService,
  getFilteredOddsAnalytics as getFilteredOddsAnalyticsService,
  getBetsForOddsRange as getBetsForOddsRangeService,
  getTeamOddsAnalytics as getTeamOddsAnalyticsService,
} from "./services/oddsAnalyticsService";
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
import PatternAnalysisTab from "./components/PatternAnalysisTab";

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
    return getFilteredOddsAnalyticsService(bets);
  };

  const getBetsForOddsRange = (range) => {
    const deduplicatedBets = getDeduplicatedBetsForAnalysis;
    return getBetsForOddsRangeService(deduplicatedBets, range);
  };

  const getTeamOddsAnalytics = () => {
    return getTeamOddsAnalyticsService(bets);
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
          // Only filter by TEAM_INCLUDED - this is the team you bet on/for
          // HOME_TEAM/AWAY_TEAM are just the match participants, not necessarily the team you bet on
          bet.TEAM_INCLUDED?.toLowerCase() === filters.team.toLowerCase() ||
          // Fallback: if TEAM_INCLUDED is missing, check HOME_TEAM/AWAY_TEAM
          (!bet.TEAM_INCLUDED && (
            bet.HOME_TEAM?.toLowerCase() === filters.team.toLowerCase() ||
            bet.AWAY_TEAM?.toLowerCase() === filters.team.toLowerCase()
          ))
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

  // Store recommendations for accuracy tracking (reserved for future use)
  // eslint-disable-next-line no-unused-vars
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

  // Store predictions from analysis (reserved for future use)
  // eslint-disable-next-line no-unused-vars
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
      // Handle both old (1-10) and new (0-100%) confidence formats
      const normalizeConfidence = (score) => {
        // If score is <= 10, assume old format and convert to percentage
        return score <= 10 ? score * 10 : score;
      };

      const confidenceGroups = {
        "High (80-100%)": recommendationsWithResults.filter(
          (rec) => normalizeConfidence(rec.confidence_score) >= 80
        ),
        "Medium (60-79%)": recommendationsWithResults.filter(
          (rec) => {
            const normalized = normalizeConfidence(rec.confidence_score);
            return normalized >= 60 && normalized < 80;
          }
        ),
        "Low (40-59%)": recommendationsWithResults.filter(
          (rec) => {
            const normalized = normalizeConfidence(rec.confidence_score);
            return normalized >= 40 && normalized < 60;
          }
        ),
        "Very Low (10-39%)": recommendationsWithResults.filter(
          (rec) => normalizeConfidence(rec.confidence_score) < 40
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
            total: confidenceGroups["High (80-100%)"].length,
            correct: confidenceGroups["High (80-100%)"].filter((rec) =>
              calculateSystemAccuracy(
                rec.recommendation,
                rec.actual_result,
                rec.recommendation_type
              )
            ).length,
            accuracy:
              Math.round(
                calculateGroupAccuracy(confidenceGroups["High (80-100%)"]) * 100
              ),
          },
          "Medium (60-79%)": {
            total: confidenceGroups["Medium (60-79%)"].length,
            correct: confidenceGroups["Medium (60-79%)"].filter((rec) =>
              calculateSystemAccuracy(
                rec.recommendation,
                rec.actual_result,
                rec.recommendation_type
              )
            ).length,
            accuracy:
              Math.round(
                calculateGroupAccuracy(confidenceGroups["Medium (60-79%)"]) * 100
              ),
          },
          "Low (40-59%)": {
            total: confidenceGroups["Low (40-59%)"].length,
            correct: confidenceGroups["Low (40-59%)"].filter((rec) =>
              calculateSystemAccuracy(
                rec.recommendation,
                rec.actual_result,
                rec.recommendation_type
              )
            ).length,
            accuracy:
              Math.round(
                calculateGroupAccuracy(confidenceGroups["Low (40-59%)"]) * 100
              ),
          },
          "Very Low (10-39%)": {
            total: confidenceGroups["Very Low (10-39%)"].length,
            correct: confidenceGroups["Very Low (10-39%)"].filter((rec) =>
              calculateSystemAccuracy(
                rec.recommendation,
                rec.actual_result,
                rec.recommendation_type
              )
            ).length,
            accuracy:
              Math.round(
                calculateGroupAccuracy(confidenceGroups["Very Low (10-39%)"]) * 100
              ),
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

  // Calculate prediction accuracy (reserved for future use)
  // eslint-disable-next-line no-unused-vars
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

  // Wilson Score calculation for statistical confidence
  const calculateWilsonScore = (wins, total) => {
    if (total === 0) return 0;
    const n = total;
    const p = wins / total;
    const z = 1.96; // 95% confidence level
    return (
      (p +
        (z * z) / (2 * n) -
        z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) /
      (1 + (z * z) / n)
    );
  };

  // Calculate team-specific bet type performance (win rates for each bet type for a specific team)
  const getTeamBetTypePerformance = (teamName, country, league, betType) => {
    if (!bets || bets.length === 0) return null;

    const deduplicatedBets = getDeduplicatedBetsForAnalysis;
    const betsWithResults = deduplicatedBets.filter(
      (b) => b.RESULT && b.RESULT.trim() !== ""
    );

    // Filter bets for this specific team in this league/country
    let teamBets = [];
    
    if (betType === "Straight Win") {
      teamBets = betsWithResults.filter(
        (b) =>
          b.TEAM_INCLUDED === teamName &&
          b.COUNTRY === country &&
          b.LEAGUE === league &&
          (b.BET_TYPE === "Win" || !b.BET_TYPE || b.BET_TYPE === "") &&
          !b.BET_TYPE?.toLowerCase().includes("double chance") &&
          !b.BET_TYPE?.toLowerCase().includes("over") &&
          !b.BET_TYPE?.toLowerCase().includes("under")
      );
    } else if (betType === "Double Chance") {
      teamBets = betsWithResults.filter(
        (b) =>
          b.TEAM_INCLUDED === teamName &&
          b.COUNTRY === country &&
          b.LEAGUE === league &&
          b.BET_TYPE &&
          b.BET_TYPE.toLowerCase().includes("double chance")
      );
    } else if (betType === "Over/Under") {
      teamBets = betsWithResults.filter(
        (b) =>
          b.TEAM_INCLUDED === teamName &&
          b.COUNTRY === country &&
          b.LEAGUE === league &&
          b.BET_TYPE &&
          (b.BET_TYPE.toLowerCase().includes("over") ||
            b.BET_TYPE.toLowerCase().includes("under"))
      );
    }

    if (teamBets.length === 0) return null;

    const wins = teamBets.filter((b) =>
      b.RESULT.toLowerCase().includes("win")
    ).length;
    const winRate = wins / teamBets.length;
    const wilsonScore = calculateWilsonScore(wins, teamBets.length);

    return {
      winRate: winRate,
      wilsonRate: wilsonScore,
      totalBets: teamBets.length,
      wins: wins,
    };
  };

  // Calculate data-driven multipliers based on historical bet type performance
  const calculateBetTypeMultipliers = () => {
    if (!bets || bets.length === 0) {
      // Default multipliers if no data
      return {
        straightWin: 1.0,
        doubleChance: 0.9,
        overUnder: 0.95,
      };
    }

    // Filter bets with results
    const betsWithResults = bets.filter(
      (b) => b.RESULT && b.RESULT.trim() !== ""
    );

    // Calculate win rates for each bet type
    const straightWinBets = betsWithResults.filter(
      (b) =>
        (b.BET_TYPE === "Win" || !b.BET_TYPE || b.BET_TYPE === "") &&
        !b.BET_TYPE?.toLowerCase().includes("double chance") &&
        !b.BET_TYPE?.toLowerCase().includes("over") &&
        !b.BET_TYPE?.toLowerCase().includes("under")
    );
    const straightWinWins = straightWinBets.filter((b) =>
      b.RESULT.toLowerCase().includes("win")
    ).length;
    const straightWinRate =
      straightWinBets.length > 0 ? straightWinWins / straightWinBets.length : 0;

    const doubleChanceBets = betsWithResults.filter(
      (b) =>
        b.BET_TYPE &&
        b.BET_TYPE.toLowerCase().includes("double chance")
    );
    const doubleChanceWins = doubleChanceBets.filter((b) =>
      b.RESULT.toLowerCase().includes("win")
    ).length;
    const doubleChanceRate =
      doubleChanceBets.length > 0
        ? doubleChanceWins / doubleChanceBets.length
        : 0;

    const overUnderBets = betsWithResults.filter(
      (b) =>
        b.BET_TYPE &&
        (b.BET_TYPE.toLowerCase().includes("over") ||
          b.BET_TYPE.toLowerCase().includes("under"))
    );
    const overUnderWins = overUnderBets.filter((b) =>
      b.RESULT.toLowerCase().includes("win")
    ).length;
    const overUnderRate =
      overUnderBets.length > 0 ? overUnderWins / overUnderBets.length : 0;

    // Find the highest win rate to use as baseline
    const maxRate = Math.max(
      straightWinRate,
      doubleChanceRate,
      overUnderRate,
      0.5
    ); // Minimum 0.5 to avoid division issues

    // Calculate small multiplier adjustments (±3-5% max)
    // Instead of normalizing to best = 1.0 (which creates large differences),
    // use small adjustments based on performance difference from the best
    // This keeps confidence as the primary ranking factor, with multipliers as a small boost
    const maxMultiplierBoost = 0.05; // Maximum 5% boost for best performing type
    const maxMultiplierPenalty = 0.05; // Maximum 5% penalty for worst performing type
    
    // Calculate performance difference from best (in decimal form, e.g., 0.75 - 0.65 = 0.10 = 10%)
    const straightWinDiff = straightWinRate - maxRate;
    const doubleChanceDiff = doubleChanceRate - maxRate;
    const overUnderDiff = overUnderRate - maxRate;
    
    // Convert difference to small multiplier adjustment
    // Use a scaling factor to keep adjustments small (e.g., 0.5 = 50% of difference becomes multiplier adjustment)
    // Example: If Double Chance wins 75% and Straight Win wins 65% (10% difference = 0.10),
    // multiplier adjustment = 0.10 * 0.5 = 0.05, so Straight Win gets 0.95 multiplier
    // This creates a 5% difference instead of the full 10%, keeping confidence as primary factor
    const adjustmentScale = 0.5; // Scale down the adjustment (50% of the difference)
    
    const multipliers = {
      straightWin:
        straightWinBets.length >= 10
          ? Math.max(
              1.0 - maxMultiplierPenalty,
              Math.min(1.0 + maxMultiplierBoost, 1.0 + (straightWinDiff * adjustmentScale))
            )
          : 1.0, // Default to 1.0 if insufficient data
      doubleChance:
        doubleChanceBets.length >= 10
          ? Math.max(
              1.0 - maxMultiplierPenalty,
              Math.min(1.0 + maxMultiplierBoost, 1.0 + (doubleChanceDiff * adjustmentScale))
            )
          : 1.0, // Default to 1.0 if insufficient data (no bias)
      overUnder:
        overUnderBets.length >= 10
          ? Math.max(
              1.0 - maxMultiplierPenalty,
              Math.min(1.0 + maxMultiplierBoost, 1.0 + (overUnderDiff * adjustmentScale))
            )
          : 1.0, // Default to 1.0 if insufficient data (no bias)
    };

    return multipliers;
  };

  // Helper function to get odds performance notification for a recommendation
  const getOddsPerformanceNotification = (
    recommendation,
    betType,
    betData,
    teamOddsAnalytics
  ) => {
    // Skip if recommendation is AVOID
    if (
      recommendation.bet === "AVOID" ||
      recommendation.bet === "No clear winner" ||
      !recommendation.bet
    ) {
      return null;
    }

    // Always use TEAM_INCLUDED - this is the team you're betting on, not the recommended team
    // The odds performance should show how well you've done betting on this team at these odds
    let teamName = betData.TEAM_INCLUDED;
    
    if (!teamName) {
      return {
        type: "no_data",
        message: "No odds history available for this team",
      };
    }

    // Map bet type
    let mappedBetType = "Win"; // default
    if (betType === "Straight Win") {
      mappedBetType = "Win";
    } else if (betType === "Double Chance") {
      mappedBetType = "Double Chance";
    } else if (betType === "Over/Under") {
      mappedBetType = "Over/Under";
    }

    // Determine odds for the team
    let betOdds = 0;
    const odds1 = parseFloat(betData.ODDS1) || 0;
    const odds2 = parseFloat(betData.ODDS2) || 0;

    if (
      teamName &&
      betData.HOME_TEAM &&
      teamName.toLowerCase().includes(betData.HOME_TEAM.toLowerCase())
    ) {
      betOdds = odds1;
    } else if (
      teamName &&
      betData.AWAY_TEAM &&
      teamName.toLowerCase().includes(betData.AWAY_TEAM.toLowerCase())
    ) {
      betOdds = odds2;
    } else {
      // Fallback: use the higher odds
      betOdds = Math.max(odds1, odds2);
    }

    if (betOdds <= 0) {
      return null;
    }

    // Map odds to range
    let oddsRange = "1.0-1.5";
    if (betOdds <= 1.5) oddsRange = "1.0-1.5";
    else if (betOdds <= 2.0) oddsRange = "1.5-2.0";
    else if (betOdds <= 3.0) oddsRange = "2.0-3.0";
    else if (betOdds <= 5.0) oddsRange = "3.0-5.0";
    else oddsRange = "5.0+";

    // Find team in odds analytics - match by team name, country, and league
    // First try exact match with country/league, then fallback to team name only
    let teamOddsData = teamOddsAnalytics.find(
      (team) =>
        team.teamName &&
        teamName &&
        team.teamName.toLowerCase() === teamName.toLowerCase() &&
        team.country &&
        betData.COUNTRY &&
        team.country.toLowerCase() === betData.COUNTRY.toLowerCase() &&
        team.league &&
        betData.LEAGUE &&
        team.league.toLowerCase() === betData.LEAGUE.toLowerCase()
    );
    
    // Fallback to team name only if no exact match found
    if (!teamOddsData) {
      teamOddsData = teamOddsAnalytics.find(
        (team) =>
          team.teamName &&
          teamName &&
          team.teamName.toLowerCase() === teamName.toLowerCase()
      );
    }

    if (!teamOddsData) {
      return {
        type: "no_data",
        message: "No odds history available for this team",
      };
    }

    // Find the odds range data for this team
    const rangeData = teamOddsData.oddsRanges.find(
      (r) => r.range === oddsRange
    );

    if (!rangeData) {
      return {
        type: "no_data",
        message: "No odds history available for this team",
      };
    }

    // Check bet type performance at this odds range
    const lossBetTypes = rangeData.betTypes?.losses || {};
    const winBetTypes = rangeData.betTypes?.wins || {};

    // Try to find the bet type - check both exact match and case-insensitive
    let lossesForBetType = 0;
    let winsForBetType = 0;
    
    // First try exact match
    if (lossBetTypes[mappedBetType] !== undefined) {
      lossesForBetType = lossBetTypes[mappedBetType];
    } else {
      // Try case-insensitive match
      const betTypeKey = Object.keys(lossBetTypes).find(
        (key) => key.toLowerCase() === mappedBetType.toLowerCase()
      );
      if (betTypeKey) {
        lossesForBetType = lossBetTypes[betTypeKey];
      }
    }
    
    if (winBetTypes[mappedBetType] !== undefined) {
      winsForBetType = winBetTypes[mappedBetType];
    } else {
      const betTypeKey = Object.keys(winBetTypes).find(
        (key) => key.toLowerCase() === mappedBetType.toLowerCase()
      );
      if (betTypeKey) {
        winsForBetType = winBetTypes[betTypeKey];
      }
    }
    
    const totalForBetType = lossesForBetType + winsForBetType;

    // Check if this is an outlier range
    const isOutlier = teamOddsData.outlierRanges && teamOddsData.outlierRanges.length > 0
      ? teamOddsData.outlierRanges.some((or) => or.range === oddsRange)
      : false;
    const isMostCommon = oddsRange === teamOddsData.mostCommonRange;

    // Build notification
    let notification = {
      type: "info",
      message: "",
      oddsRange: oddsRange,
      betOdds: betOdds.toFixed(2),
      isOutlier: isOutlier,
      isMostCommon: isMostCommon,
    };

    // Check if this bet type has losses at this range
    if (totalForBetType > 0) {
      const winRateForBetType = (winsForBetType / totalForBetType) * 100;

      if (lossesForBetType > 0) {
        // ANY losses = red warning
        notification.type = "warning";
        notification.message = `⚠️ ${mappedBetType} bets at odds ${oddsRange} for ${teamName}: ${winsForBetType}W / ${lossesForBetType}L (${winRateForBetType.toFixed(0)}% win rate)`;
      } else {
        // No losses = blue info
        notification.type = "info";
        notification.message = `✅ ${mappedBetType} bets at odds ${oddsRange} for ${teamName}: ${winsForBetType}W / 0L (100% win rate)`;
      }
    } else {
      // No bet type specific data - check if we should show general range info
      // But if there are losses in the general range, we should still warn
      if (rangeData.losses > 0) {
        notification.type = "warning";
        notification.message = `⚠️ ${mappedBetType} bets at odds ${oddsRange} for ${teamName}: No specific data, but range has ${rangeData.wins}W / ${rangeData.losses}L`;
      }
    }

    // If no bet type specific info and no warning set, provide general range info
    if (notification.type === "info" && !notification.message) {
      if (isOutlier) {
        notification.type = "warning";
        notification.message = `⚠️ Odds ${betOdds.toFixed(2)} (${oddsRange}) are outlier range - ${teamName} normally bets at ${teamOddsData.mostCommonRange}`;
      } else if (rangeData.losses > 0) {
        // If there are losses in the range, show red warning
        notification.type = "warning";
        notification.message = `⚠️ Odds ${betOdds.toFixed(2)} (${oddsRange}) - ${teamName} has ${rangeData.bets} bets at this range (${rangeData.wins}W / ${rangeData.losses}L)`;
      } else if (isMostCommon) {
        // No losses = blue info
        notification.type = "info";
        notification.message = `✅ Odds ${betOdds.toFixed(2)} (${oddsRange}) are in normal range - ${teamName} has ${rangeData.bets} bets at this range (${rangeData.wins}W / 0L)`;
      } else {
        // No losses = blue info
        notification.type = "info";
        notification.message = `ℹ️ Odds ${betOdds.toFixed(2)} (${oddsRange}) - ${teamName} has ${rangeData.bets} bets at this range (${rangeData.wins}W / 0L)`;
      }
    }

    return notification;
  };

  const generateBetRecommendations = (analysisResults) => {
    if (!analysisResults || analysisResults.length === 0) return [];

    // Calculate team odds analytics once for all recommendations
    // Use deduplicated bets to avoid counting duplicate bets multiple times
    const deduplicatedBets = getDeduplicatedBetsForAnalysis;
    const teamOddsAnalytics = getTeamOddsAnalytics(deduplicatedBets);

    // Calculate data-driven multipliers based on historical performance
    const betTypeMultipliers = calculateBetTypeMultipliers();

    // Include all bets (including "Avoid" ones) and sort by confidence
    const validBets = analysisResults.sort(
      (a, b) => b.confidenceScore - a.confidenceScore
    );

    // Filter out bets with no form data (both teams have 0W 0D 0L)
    // This prevents showing recommendations for games with insufficient data
    const betsWithFormData = validBets.filter((bet) => {
      // Check if we have form data from new columns
      const hasHomeSequence = bet.LAST_5_RESULT_HOME || bet.LAST_4_RESULT_HOME || 
                              bet.LAST_3_RESULT_HOME || bet.LAST_2_RESULT_HOME || 
                              bet.LAST_1_RESULT_HOME;
      const hasAwaySequence = bet.LAST_5_RESULT_AWAY || bet.LAST_4_RESULT_AWAY || 
                              bet.LAST_3_RESULT_AWAY || bet.LAST_2_RESULT_AWAY || 
                              bet.LAST_1_RESULT_AWAY;
      
      // If using new sequence columns, check if at least one team has data
      if (hasHomeSequence || hasAwaySequence) {
        return true; // At least one team has sequence data
      }
      
      // Fallback to old aggregate columns
      const homeWins = parseInt(bet.LAST_5_WINS_HOME) || 0;
      const homeDraws = parseInt(bet.LAST_5_DRAWS_HOME) || 0;
      const homeLosses = parseInt(bet.LAST_5_LOSSES_HOME) || 0;
      const awayWins = parseInt(bet.LAST_5_WINS_AWAY) || 0;
      const awayDraws = parseInt(bet.LAST_5_DRAWS_AWAY) || 0;
      const awayLosses = parseInt(bet.LAST_5_LOSSES_AWAY) || 0;
      
      const homeHasData = homeWins + homeDraws + homeLosses > 0;
      const awayHasData = awayWins + awayDraws + awayLosses > 0;
      
      // Include if at least one team has form data
      return homeHasData || awayHasData;
    });

    // Generate comprehensive recommendations for each bet
    const recommendations = betsWithFormData.slice(0, 50).map((bet, index) => {
      const odds = parseFloat(bet.ODDS1) || 2.0;
      const confidence = bet.confidenceScore || 5.0;

      // Calculate recommendation score (higher confidence + good odds = better score)
      const recommendationScore = confidence * (odds > 1.5 ? 1.2 : 1.0);

      // Get team data for comprehensive analysis
      const homeTeam = bet.HOME_TEAM;
      const awayTeam = bet.AWAY_TEAM;
      const country = bet.COUNTRY;
      const league = bet.LEAGUE;

      // Extract recent form data before analysis
      // Support both new individual result columns and old aggregate columns (backward compatibility)
      const getFormDataFromResults = (result5, result4, result3, result2, result1) => {
        const results = [result5, result4, result3, result2, result1]
          .filter(r => r && typeof r === 'string')
          .map(r => r.toUpperCase().trim());
        
        return {
          wins: results.filter(r => r === 'W').length,
          draws: results.filter(r => r === 'D').length,
          losses: results.filter(r => r === 'L').length,
          sequence: results // Store sequence for advanced analysis
        };
      };

      // Try new individual result columns first, fallback to old aggregate columns
      const homeFormFromResults = getFormDataFromResults(
        bet.LAST_5_RESULT_HOME,
        bet.LAST_4_RESULT_HOME,
        bet.LAST_3_RESULT_HOME,
        bet.LAST_2_RESULT_HOME,
        bet.LAST_1_RESULT_HOME
      );
      
      const awayFormFromResults = getFormDataFromResults(
        bet.LAST_5_RESULT_AWAY,
        bet.LAST_4_RESULT_AWAY,
        bet.LAST_3_RESULT_AWAY,
        bet.LAST_2_RESULT_AWAY,
        bet.LAST_1_RESULT_AWAY
      );

      // Use new columns if available, otherwise use old aggregate columns
      const recentFormData = {
        homeWins: homeFormFromResults.sequence.length > 0 
          ? homeFormFromResults.wins 
          : (parseInt(bet.LAST_5_WINS_HOME) || 0),
        homeDraws: homeFormFromResults.sequence.length > 0 
          ? homeFormFromResults.draws 
          : (parseInt(bet.LAST_5_DRAWS_HOME) || 0),
        homeLosses: homeFormFromResults.sequence.length > 0 
          ? homeFormFromResults.losses 
          : (parseInt(bet.LAST_5_LOSSES_HOME) || 0),
        homeSequence: homeFormFromResults.sequence, // Store sequence for sequence-based analysis
        awayWins: awayFormFromResults.sequence.length > 0 
          ? awayFormFromResults.wins 
          : (parseInt(bet.LAST_5_WINS_AWAY) || 0),
        awayDraws: awayFormFromResults.sequence.length > 0 
          ? awayFormFromResults.draws 
          : (parseInt(bet.LAST_5_DRAWS_AWAY) || 0),
        awayLosses: awayFormFromResults.sequence.length > 0 
          ? awayFormFromResults.losses 
          : (parseInt(bet.LAST_5_LOSSES_AWAY) || 0),
        awaySequence: awayFormFromResults.sequence, // Store sequence for sequence-based analysis
      };

      // Analyze straight win recommendation
      const straightWinRecommendation = analyzeStraightWin(
        homeTeam,
        awayTeam,
        country,
        league,
        bet,
        recentFormData
      );

      // Analyze double chance recommendation
      const doubleChanceRecommendation = analyzeDoubleChance(
        homeTeam,
        awayTeam,
        country,
        league,
        bet,
        recentFormData
      );

      // Analyze over/under recommendation
      const overUnderRecommendation = analyzeOverUnder(
        homeTeam,
        awayTeam,
        country,
        league,
        bet,
        recentFormData
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

      // Helper function to determine which team is being bet on for each recommendation
      const getTeamForRecommendation = (rec) => {
        if (rec.recommendation.bet === "AVOID" || rec.recommendation.bet === "No clear winner") {
          return null;
        }
        // For Straight Win, the bet is the team name
        if (rec.type === "Straight Win") {
          return rec.recommendation.bet;
        }
        // For Double Chance, check if it mentions home or away team
        if (rec.type === "Double Chance") {
          if (rec.recommendation.bet.toLowerCase().includes(homeTeam.toLowerCase())) {
            return homeTeam;
          } else if (rec.recommendation.bet.toLowerCase().includes(awayTeam.toLowerCase())) {
            return awayTeam;
          }
        }
        // For Over/Under, we can't determine a specific team, so use the team from the original bet
        if (rec.type === "Over/Under") {
          return bet.TEAM_INCLUDED || homeTeam;
        }
        return bet.TEAM_INCLUDED || homeTeam;
      };

      // Calculate risk-adjusted scores for ranking using data-driven multipliers
      // Use underlying Wilson rate when confidence is capped at 10.0 to preserve actual confidence levels
      const rankedBets = allBets.map((betOption) => {
        let baseScore = betOption.recommendation.confidence;
        
        // If confidence is capped at 100%, use underlying Wilson rate for ranking
        // This preserves the actual confidence difference when multiple bets are maxed out
        // Example: Straight Win with 95% Wilson (capped to 100%) vs Double Chance with 85% Wilson (capped to 100%)
        // We want to use 95% vs 85% for ranking, not 100% vs 100%
        if (baseScore >= 100.0) {
          // Check for Wilson rate in different fields based on bet type
          // Wilson rates are already in percentage form (0-100%)
          if (betOption.recommendation.wilsonWinRate !== undefined) {
            // Straight Win or Double Chance: use wilsonWinRate (already percentage)
            baseScore = betOption.recommendation.wilsonWinRate;
          } else if (betOption.recommendation.overWilsonRate !== undefined) {
            // Over/Under: use overWilsonRate or underWilsonRate (already percentage)
            baseScore = betOption.recommendation.overWilsonRate 
              ? betOption.recommendation.overWilsonRate 
              : (betOption.recommendation.underWilsonRate || 0);
          }
          // If no Wilson rate available, keep using capped confidence (shouldn't happen)
        }
        
        let adjustedScore = baseScore;

        // Apply data-driven multipliers based on historical performance (global across all teams)
        if (betOption.type === "Straight Win") {
          adjustedScore *= betTypeMultipliers.straightWin;
        } else if (betOption.type === "Double Chance") {
          adjustedScore *= betTypeMultipliers.doubleChance;
        } else if (betOption.type === "Over/Under") {
          adjustedScore *= betTypeMultipliers.overUnder;
        }

        // Factor in team-specific bet type performance for ranking
        // This ensures teams that perform better on specific bet types rank higher for those bet types
        const teamForBet = getTeamForRecommendation(betOption);
        if (teamForBet && betOption.recommendation.bet !== "AVOID" && betOption.recommendation.bet !== "No clear winner") {
          const teamPerformance = getTeamBetTypePerformance(
            teamForBet,
            country,
            league,
            betOption.type
          );

          if (teamPerformance && teamPerformance.totalBets >= 3) {
            // Factor in team-specific performance
            // If team has good performance (win rate > 50%), boost the score
            // If team has poor performance (win rate < 40%), penalize the score
            const performanceMultiplier = teamPerformance.winRate >= 0.5
              ? 1.0 + (teamPerformance.winRate - 0.5) * 0.4 // Boost up to 20% for 100% win rate
              : 1.0 - (0.5 - teamPerformance.winRate) * 0.6; // Penalize up to 30% for 0% win rate

            // Apply multiplier, but cap the impact
            adjustedScore = adjustedScore * Math.max(0.7, Math.min(1.2, performanceMultiplier));

            // Add sample size bonus (more bets = more reliable)
            if (teamPerformance.totalBets >= 10) {
              adjustedScore *= 1.05; // 5% bonus for 10+ bets
            } else if (teamPerformance.totalBets >= 5) {
              adjustedScore *= 1.02; // 2% bonus for 5+ bets
            }
          } else if (teamPerformance && teamPerformance.totalBets < 3) {
            // Insufficient data - small penalty
            adjustedScore *= 0.95;
          }
        }

        return {
          ...betOption,
          adjustedScore: adjustedScore,
          teamForBet: teamForBet, // Store for later use in Best Bet selection
        };
      });

      // Sort by adjusted score (highest first)
      rankedBets.sort((a, b) => b.adjustedScore - a.adjustedScore);

      // Assign rankings
      const primary = rankedBets[0];
      const secondary = rankedBets[1];
      const tertiary = rankedBets[2];

      // Add odds performance notifications to each recommendation
      primary.oddsPerformance = getOddsPerformanceNotification(
        primary.recommendation,
        primary.type,
        bet,
        teamOddsAnalytics
      );
      secondary.oddsPerformance = getOddsPerformanceNotification(
        secondary.recommendation,
        secondary.type,
        bet,
        teamOddsAnalytics
      );
      tertiary.oddsPerformance = getOddsPerformanceNotification(
        tertiary.recommendation,
        tertiary.type,
        bet,
        teamOddsAnalytics
      );

      // Calculate Best Bet - uses adjusted scores that already include team-specific bet type performance
      // Additional factors for Best Bet selection: odds value, risk level, and opponent strength
      const bestBetScores = rankedBets.map((betOption) => {
        const teamForBet = betOption.teamForBet; // Already calculated during ranking
        let bestBetScore = betOption.adjustedScore; // Start with adjusted score (already includes team-specific performance)

        // Factor in odds value (expected value)
        const recommendationOdds = odds; // Use the main odds for now
        const impliedProbability = 1 / recommendationOdds;
        const confidenceProbability = betOption.recommendation.confidence / 10;
        
        // If confidence suggests higher probability than odds imply, that's value
        const valueMultiplier = confidenceProbability > impliedProbability
          ? 1.0 + (confidenceProbability - impliedProbability) * 0.3 // Up to 30% boost for value
          : 1.0 - (impliedProbability - confidenceProbability) * 0.2; // Up to 20% penalty for poor value

        bestBetScore = bestBetScore * Math.max(0.8, Math.min(1.3, valueMultiplier));

        // Factor in risk level (lower risk = slightly higher score for best bet)
        if (betOption.riskLevel === "Low" || betOption.riskLevel === "Medium") {
          bestBetScore *= 1.03; // 3% boost for lower risk
        }

        // Factor in opponent strength for Best Bet selection
        // Get opponent position and form
        const opponentPosition = teamForBet === homeTeam
          ? (bet.AWAY_TEAM_POSITION_NUMBER || bet.AWAY_TEAM_POSITION)
          : (bet.HOME_TEAM_POSITION_NUMBER || bet.HOME_TEAM_POSITION);
        const opponentForm = teamForBet === homeTeam
          ? (recentFormData ? {
              wins: recentFormData.awayWins || 0,
              draws: recentFormData.awayDraws || 0,
              losses: recentFormData.awayLosses || 0
            } : null)
          : (recentFormData ? {
              wins: recentFormData.homeWins || 0,
              draws: recentFormData.homeDraws || 0,
              losses: recentFormData.homeLosses || 0
            } : null);
        
        const opponentStrengthImpact = calculateOpponentStrengthImpact(opponentPosition, opponentForm);
        // For Best Bet, favor bets against weaker opponents
        // Strong opponent (low multiplier) = reduce score, Weak opponent (high multiplier) = boost score
        bestBetScore = bestBetScore * Math.max(0.9, Math.min(1.1, opponentStrengthImpact));

        return {
          ...betOption,
          bestBetScore: bestBetScore,
          teamForBet: teamForBet,
        };
      });

      // Sort by best bet score and select the top one
      bestBetScores.sort((a, b) => b.bestBetScore - a.bestBetScore);
      const bestBet = bestBetScores[0];

      // Add odds performance notification to best bet
      bestBet.oddsPerformance = getOddsPerformanceNotification(
        bestBet.recommendation,
        bestBet.type,
        bet,
        teamOddsAnalytics
      );

      return {
        rank: index + 1,
        match: `${bet.HOME_TEAM} vs ${bet.AWAY_TEAM}`,
        league: bet.LEAGUE,
        country: bet.COUNTRY,
        bestBet: bestBet,
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

  // Calculate opponent strength impact based on league position and recent form
  // Returns a multiplier (0.85 to 1.15) based on opponent strength
  const calculateOpponentStrengthImpact = (opponentPosition, opponentRecentForm) => {
    let multiplier = 1.0; // Neutral base
    
    // Factor 1: League Position Impact
    if (opponentPosition) {
      const pos = parseInt(opponentPosition);
      if (pos <= 3) {
        // Top 3 opponent - reduce confidence (strong opponent)
        multiplier *= 0.92; // 8% reduction
      } else if (pos <= 6) {
        // Top 6 opponent - slight reduction
        multiplier *= 0.96; // 4% reduction
      } else if (pos >= 15) {
        // Bottom 3 opponent - boost confidence (weak opponent)
        multiplier *= 1.08; // 8% boost
      } else if (pos >= 12) {
        // Bottom half opponent - slight boost
        multiplier *= 1.04; // 4% boost
      }
    }
    
    // Factor 2: Recent Form Impact (opponent's last 5 games)
    if (opponentRecentForm) {
      const { wins, draws, losses } = opponentRecentForm;
      const totalGames = wins + draws + losses;
      
      if (totalGames >= 3) {
        // Calculate opponent's recent form score
        const formScore = (wins + 0.5 * draws) / totalGames;
        
        // If opponent has poor form (low wins), boost our confidence
        if (formScore < 0.3) {
          // Opponent struggling (0-1 wins in last 5) - boost confidence
          multiplier *= 1.06; // 6% boost
        } else if (formScore < 0.4) {
          // Opponent poor form (1-2 wins) - slight boost
          multiplier *= 1.03; // 3% boost
        } else if (formScore > 0.7) {
          // Opponent strong form (3+ wins) - reduce confidence
          multiplier *= 0.94; // 6% reduction
        } else if (formScore > 0.6) {
          // Opponent good form (2-3 wins) - slight reduction
          multiplier *= 0.97; // 3% reduction
        }
      }
    }
    
    // Cap the multiplier between 0.85 and 1.15
    return Math.max(0.85, Math.min(1.15, multiplier));
  };

  // Get opponent status description for reasoning
  const getOpponentStatusDescription = (opponentPosition, opponentRecentForm) => {
    const statusParts = [];
    
    if (opponentPosition) {
      const pos = parseInt(opponentPosition);
      if (pos <= 3) {
        statusParts.push(`top 3`);
      } else if (pos <= 6) {
        statusParts.push(`top 6`);
      } else if (pos >= 15) {
        statusParts.push(`bottom 3`);
      } else if (pos >= 12) {
        statusParts.push(`bottom half`);
      }
    }
    
    if (opponentRecentForm) {
      const { wins, draws, losses } = opponentRecentForm;
      const totalGames = wins + draws + losses;
      
      if (totalGames >= 3) {
        const formScore = (wins + 0.5 * draws) / totalGames;
        if (formScore < 0.3) {
          statusParts.push(`struggling form (${wins}W-${draws}D-${losses}L in last 5)`);
        } else if (formScore < 0.4) {
          statusParts.push(`poor form (${wins}W-${draws}D-${losses}L in last 5)`);
        } else if (formScore > 0.7) {
          statusParts.push(`strong form (${wins}W-${draws}D-${losses}L in last 5)`);
        } else if (formScore > 0.6) {
          statusParts.push(`good form (${wins}W-${draws}D-${losses}L in last 5)`);
        }
      }
    }
    
    return statusParts.length > 0 ? ` (Opponent: ${statusParts.join(', ')})` : '';
  };

  // Calculate recent form impact on confidence
  // Returns a multiplier (0.8 to 1.2) based on recent form
  // Enhanced with sequence-based analysis and recency weighting
  const calculateRecentFormImpact = (recentForm, isHomeTeam, isAwayTeam) => {
    if (!recentForm) return 1.0; // No form data = neutral impact

    let wins, draws, losses, sequence;
    
    if (isHomeTeam) {
      wins = recentForm.homeWins || 0;
      draws = recentForm.homeDraws || 0;
      losses = recentForm.homeLosses || 0;
      sequence = recentForm.homeSequence || [];
    } else if (isAwayTeam) {
      wins = recentForm.awayWins || 0;
      draws = recentForm.awayDraws || 0;
      losses = recentForm.awayLosses || 0;
      sequence = recentForm.awaySequence || [];
    } else {
      return 1.0; // Not applicable
    }

    const totalGames = wins + draws + losses;
    if (totalGames === 0) return 1.0; // No recent games = neutral

    // Calculate recent form score (wins + 0.5*draws) / total
    const formScore = (wins + 0.5 * draws) / totalGames;
    
    // Base multiplier from form score (0.5 = 0.9x, 1.0 = 1.1x)
    let multiplier = 0.9 + (formScore * 0.4); // Range: 0.9 to 1.3
    
    // Enhanced analysis if we have sequence data
    if (sequence && sequence.length > 0) {
      // Recency weighting: most recent games weighted more heavily
      // Weights: [0.6, 0.7, 0.8, 0.9, 1.0] for games 5 to 1 (oldest to newest)
      const recencyWeights = [0.6, 0.7, 0.8, 0.9, 1.0];
      let weightedScore = 0;
      let totalWeight = 0;
      
      sequence.forEach((result, index) => {
        const weight = recencyWeights[sequence.length - 1 - index] || 1.0;
        totalWeight += weight;
        if (result === 'W') {
          weightedScore += weight * 1.0;
        } else if (result === 'D') {
          weightedScore += weight * 0.5;
        } else if (result === 'L') {
          weightedScore += weight * 0.0;
        }
      });
      
      if (totalWeight > 0) {
        const weightedFormScore = weightedScore / totalWeight;
        // Use weighted score for more accurate multiplier
        multiplier = 0.9 + (weightedFormScore * 0.4);
      }
      
      // Sequence-based momentum detection
      // Check last 3 games for stronger momentum signal
      const last3Games = sequence.slice(-3);
      const last3Wins = last3Games.filter(r => r === 'W').length;
      const last3Losses = last3Games.filter(r => r === 'L').length;
      
      // Strong recent momentum: 2+ wins in last 3
      if (last3Wins >= 2 && last3Losses === 0) {
        multiplier *= 1.06; // Boost for strong recent momentum
      }
      // Poor recent momentum: 2+ losses in last 3
      else if (last3Losses >= 2 && last3Wins === 0) {
        multiplier *= 0.90; // Reduce for poor recent momentum
      }
      
      // Trend analysis: improving vs declining
      // Compare first half vs second half of sequence
      if (sequence.length >= 4) {
        const firstHalf = sequence.slice(0, Math.floor(sequence.length / 2));
        const secondHalf = sequence.slice(Math.floor(sequence.length / 2));
        
        const firstHalfScore = firstHalf.reduce((score, r) => {
          if (r === 'W') return score + 1.0;
          if (r === 'D') return score + 0.5;
          return score;
        }, 0) / firstHalf.length;
        
        const secondHalfScore = secondHalf.reduce((score, r) => {
          if (r === 'W') return score + 1.0;
          if (r === 'D') return score + 0.5;
          return score;
        }, 0) / secondHalf.length;
        
        // Improving trend: second half better than first half
        if (secondHalfScore > firstHalfScore + 0.2) {
          multiplier *= 1.04; // Boost for improving trend
        }
        // Declining trend: second half worse than first half
        else if (secondHalfScore < firstHalfScore - 0.2) {
          multiplier *= 0.94; // Reduce for declining trend
        }
      }
      
      // Streak detection: consecutive wins or losses
      const lastGame = sequence[sequence.length - 1];
      let streakLength = 1;
      for (let i = sequence.length - 2; i >= 0; i--) {
        if (sequence[i] === lastGame) {
          streakLength++;
        } else {
          break;
        }
      }
      
      // Boost for winning streaks, reduce for losing streaks
      if (lastGame === 'W' && streakLength >= 2) {
        multiplier *= 1.02; // Small boost for winning streak
      } else if (lastGame === 'L' && streakLength >= 2) {
        multiplier *= 0.98; // Small reduction for losing streak
      }
    } else {
      // Fallback to aggregate-based momentum (backward compatibility)
      const strongMomentum = wins >= 3 && losses <= 1;
      const poorMomentum = losses >= 3 && wins <= 1;
      
      if (strongMomentum) {
        multiplier *= 1.05; // Boost for strong momentum
      } else if (poorMomentum) {
        multiplier *= 0.92; // Reduce for poor momentum
      }
    }
    
    // Cap the multiplier between 0.8 and 1.2
    multiplier = Math.max(0.8, Math.min(1.2, multiplier));
    
    return multiplier;
  };

  const analyzeStraightWin = (homeTeam, awayTeam, country, league, betData, recentFormData) => {
    // Check if this is an "Avoid" bet
    if (betData.recommendation && betData.recommendation.includes("Avoid")) {
      return {
        bet: "AVOID",
        confidence: betData.confidenceScore || 30, // Low confidence for AVOID (30% = old 3/10)
        winRate: 0,
        totalBets: 0,
        reasoning: betData.recommendation
          .replace("Avoid (", "")
          .replace(")", ""),
      };
    }

    // Get historical data - prioritize home/away context
    // For home team: get bets where they played at home
    const homeTeamHomeBets = (bets || []).filter(
      (b) =>
        b.HOME_TEAM === homeTeam &&
        b.COUNTRY === country &&
        b.LEAGUE === league &&
        (b.BET_TYPE === "Win" || !b.BET_TYPE || b.BET_TYPE === "") &&
        b.RESULT &&
        b.RESULT.trim() !== ""
    );

    // For away team: get bets where they played away
    const awayTeamAwayBets = (bets || []).filter(
      (b) =>
        b.AWAY_TEAM === awayTeam &&
        b.COUNTRY === country &&
        b.LEAGUE === league &&
        (b.BET_TYPE === "Win" || !b.BET_TYPE || b.BET_TYPE === "") &&
        b.RESULT &&
        b.RESULT.trim() !== ""
    );

    // Fallback: if no home/away specific data, use general team data
    const homeTeamBets = homeTeamHomeBets.length > 0 
      ? homeTeamHomeBets 
      : (bets || []).filter(
          (b) =>
            b.TEAM_INCLUDED === homeTeam &&
            b.COUNTRY === country &&
            b.LEAGUE === league &&
            (b.BET_TYPE === "Win" || !b.BET_TYPE || b.BET_TYPE === "") &&
            b.RESULT &&
            b.RESULT.trim() !== ""
        );

    const awayTeamBets = awayTeamAwayBets.length > 0
      ? awayTeamAwayBets
      : (bets || []).filter(
          (b) =>
            b.TEAM_INCLUDED === awayTeam &&
            b.COUNTRY === country &&
            b.LEAGUE === league &&
            (b.BET_TYPE === "Win" || !b.BET_TYPE || b.BET_TYPE === "") &&
            b.RESULT &&
            b.RESULT.trim() !== ""
        );

    // Calculate wins and totals
    const homeWins = homeTeamBets.filter((b) =>
      b.RESULT.toLowerCase().includes("win")
    ).length;
    const homeTotal = homeTeamBets.length;
    const homeWinRate = homeTotal > 0 ? (homeWins / homeTotal) * 100 : 0;

    const awayWins = awayTeamBets.filter((b) =>
      b.RESULT.toLowerCase().includes("win")
    ).length;
    const awayTotal = awayTeamBets.length;
    const awayWinRate = awayTotal > 0 ? (awayWins / awayTotal) * 100 : 0;

    // Calculate Wilson Scores for statistical confidence
    const homeWilsonScore = homeTotal > 0 ? calculateWilsonScore(homeWins, homeTotal) : 0;
    const homeWilsonRate = homeWilsonScore * 100;
    
    const awayWilsonScore = awayTotal > 0 ? calculateWilsonScore(awayWins, awayTotal) : 0;
    const awayWilsonRate = awayWilsonScore * 100;

    // Minimum sample size requirement: 3 games
    // Standardized across all bet types for basic recommendations
    // Note: Over/Under requires 5 games due to needing scoring data (more complex analysis)
    const minSampleSize = 3;
    const hasHomeData = homeTotal >= minSampleSize;
    const hasAwayData = awayTotal >= minSampleSize;

    // If insufficient data for both teams, return low confidence
    if (!hasHomeData && !hasAwayData) {
      return {
        bet: "No clear winner",
        confidence: 30, // Low confidence due to insufficient data (30% = old 3/10)
        winRate: Math.max(homeWinRate, awayWinRate),
        totalBets: homeTotal + awayTotal,
        reasoning: `Insufficient data (${homeTotal} home games, ${awayTotal} away games). Need at least ${minSampleSize} games per team.`,
      };
    }

    // Use Wilson Score for comparison (more statistically reliable)
    // Compare Wilson rates instead of raw win rates
    const wilsonDifference = Math.abs(homeWilsonRate - awayWilsonRate);
    const minDifference = 5; // Minimum 5% difference in Wilson Score

    // Get opponent data for strength analysis
    const homeOpponentPosition = betData.AWAY_TEAM_POSITION_NUMBER || betData.AWAY_TEAM_POSITION;
    const awayOpponentPosition = betData.HOME_TEAM_POSITION_NUMBER || betData.HOME_TEAM_POSITION;
    const homeOpponentForm = recentFormData ? {
      wins: recentFormData.awayWins || 0,
      draws: recentFormData.awayDraws || 0,
      losses: recentFormData.awayLosses || 0
    } : null;
    const awayOpponentForm = recentFormData ? {
      wins: recentFormData.homeWins || 0,
      draws: recentFormData.homeDraws || 0,
      losses: recentFormData.homeLosses || 0
    } : null;

    // Determine recommendation based on Wilson Score
    if (hasHomeData && (!hasAwayData || homeWilsonRate > awayWilsonRate + minDifference)) {
      // Wilson rate is already a percentage (0-100%), use it directly
      let confidence = Math.min(homeWilsonRate, 100);
      // Apply recent form impact for home team
      const homeFormImpact = calculateRecentFormImpact(recentFormData, true, false);
      confidence = Math.min(confidence * homeFormImpact, 100);
      
      // Apply opponent strength impact (away team is opponent)
      const opponentStrengthImpact = calculateOpponentStrengthImpact(homeOpponentPosition, homeOpponentForm);
      confidence = Math.min(confidence * opponentStrengthImpact, 100);
      
      const formNote = homeFormImpact !== 1.0 
        ? ` (Recent form: ${homeFormImpact > 1.0 ? '+' : ''}${((homeFormImpact - 1) * 100).toFixed(0)}%)`
        : '';
      const opponentNote = getOpponentStatusDescription(homeOpponentPosition, homeOpponentForm);
      
      return {
        bet: homeTeam,
        confidence: confidence,
        winRate: homeWinRate,
        wilsonWinRate: homeWilsonRate,
        totalBets: homeTotal,
        reasoning: `${homeTeam} has ${homeWinRate.toFixed(1)}% win rate (${homeWilsonRate.toFixed(1)}% Wilson) based on ${homeTotal} games${homeTeamHomeBets.length > 0 ? ' at home' : ''}. ${awayTeam} has ${awayWinRate.toFixed(1)}% (${awayWilsonRate.toFixed(1)}% Wilson) based on ${awayTotal} games${awayTeamAwayBets.length > 0 ? ' away' : ''}.${formNote}${opponentNote}`,
      };
    } else if (hasAwayData && (!hasHomeData || awayWilsonRate > homeWilsonRate + minDifference)) {
      // Wilson rate is already a percentage (0-100%), use it directly
      let confidence = Math.min(awayWilsonRate, 100);
      // Apply recent form impact for away team
      const awayFormImpact = calculateRecentFormImpact(recentFormData, false, true);
      confidence = Math.min(confidence * awayFormImpact, 100);
      
      // Apply opponent strength impact (home team is opponent)
      const opponentStrengthImpact = calculateOpponentStrengthImpact(awayOpponentPosition, awayOpponentForm);
      confidence = Math.min(confidence * opponentStrengthImpact, 100);
      
      const formNote = awayFormImpact !== 1.0 
        ? ` (Recent form: ${awayFormImpact > 1.0 ? '+' : ''}${((awayFormImpact - 1) * 100).toFixed(0)}%)`
        : '';
      const opponentNote = getOpponentStatusDescription(awayOpponentPosition, awayOpponentForm);
      
      return {
        bet: awayTeam,
        confidence: confidence,
        winRate: awayWinRate,
        wilsonWinRate: awayWilsonRate,
        totalBets: awayTotal,
        reasoning: `${awayTeam} has ${awayWinRate.toFixed(1)}% win rate (${awayWilsonRate.toFixed(1)}% Wilson) based on ${awayTotal} games${awayTeamAwayBets.length > 0 ? ' away' : ''}. ${homeTeam} has ${homeWinRate.toFixed(1)}% (${homeWilsonRate.toFixed(1)}% Wilson) based on ${homeTotal} games${homeTeamHomeBets.length > 0 ? ' at home' : ''}.${formNote}${opponentNote}`,
      };
    } else {
      // Teams have similar Wilson Scores - compare recent form and opponent strength
      const avgWilsonRate = (homeWilsonRate + awayWilsonRate) / 2;
      // Wilson rate is already a percentage (0-100%), use it directly
      let confidence = Math.min(avgWilsonRate, 100);
      
      // Apply form impact to the stronger team based on recent form
      const homeFormImpact = calculateRecentFormImpact(recentFormData, true, false);
      const awayFormImpact = calculateRecentFormImpact(recentFormData, false, true);
      
      // If one team has significantly better form, use that
      if (Math.abs(homeFormImpact - awayFormImpact) > 0.1) {
        const betterFormImpact = homeFormImpact > awayFormImpact ? homeFormImpact : awayFormImpact;
        confidence = Math.min(confidence * betterFormImpact, 100);
      }
      
      // Consider opponent strength - if one team has a significantly weaker opponent, boost confidence slightly
      const homeOpponentStrength = calculateOpponentStrengthImpact(homeOpponentPosition, homeOpponentForm);
      const awayOpponentStrength = calculateOpponentStrengthImpact(awayOpponentPosition, awayOpponentForm);
      
      // If there's a clear opponent strength difference, adjust confidence
      if (Math.abs(homeOpponentStrength - awayOpponentStrength) > 0.05) {
        // Home team has weaker opponent (higher multiplier) - boost home confidence
        if (homeOpponentStrength > awayOpponentStrength) {
          confidence = Math.min(confidence * 1.02, 100);
        } else {
          // Away team has weaker opponent - boost away confidence
          confidence = Math.min(confidence * 1.02, 100);
        }
      }
      
      const opponentNote = ` Opponent analysis: ${homeTeam} faces ${getOpponentStatusDescription(homeOpponentPosition, homeOpponentForm).replace(' (Opponent: ', '').replace(')', '') || 'moderate opposition'}; ${awayTeam} faces ${getOpponentStatusDescription(awayOpponentPosition, awayOpponentForm).replace(' (Opponent: ', '').replace(')', '') || 'moderate opposition'}.`;
      
      return {
        bet: "No clear winner",
        confidence: Math.max(confidence, 30), // At least 30% if we have some data
        winRate: Math.max(homeWinRate, awayWinRate),
        wilsonWinRate: avgWilsonRate,
        totalBets: homeTotal + awayTotal,
        reasoning: `Teams have similar win rates: ${homeTeam} ${homeWinRate.toFixed(1)}% (${homeWilsonRate.toFixed(1)}% Wilson, ${homeTotal} games) vs ${awayTeam} ${awayWinRate.toFixed(1)}% (${awayWilsonRate.toFixed(1)}% Wilson, ${awayTotal} games). Difference: ${wilsonDifference.toFixed(1)}%.${opponentNote}`,
      };
    }
  };

  // Helper function to identify draws from scores
  const isDraw = (bet) => {
    const homeScore = parseInt(bet.HOME_SCORE);
    const awayScore = parseInt(bet.AWAY_SCORE);
    return (
      homeScore !== null &&
      awayScore !== null &&
      !isNaN(homeScore) &&
      !isNaN(awayScore) &&
      homeScore === awayScore
    );
  };

  const analyzeDoubleChance = (
    homeTeam,
    awayTeam,
    country,
    league,
    betData,
    recentFormData
  ) => {
    // Check if this is an "Avoid" bet
    if (betData.recommendation && betData.recommendation.includes("Avoid")) {
      return {
        bet: "AVOID",
        confidence: betData.confidenceScore || 30, // Low confidence for AVOID (30% = old 3/10)
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
      betData,
      recentFormData
    );

    // Get all games involving these teams (not just head-to-head)
    const homeTeamGames = (bets || []).filter(
      (b) =>
        (b.HOME_TEAM === homeTeam || b.AWAY_TEAM === homeTeam) &&
        b.COUNTRY === country &&
        b.LEAGUE === league &&
        b.HOME_SCORE &&
        b.AWAY_SCORE &&
        !isNaN(parseInt(b.HOME_SCORE)) &&
        !isNaN(parseInt(b.AWAY_SCORE))
    );

    const awayTeamGames = (bets || []).filter(
      (b) =>
        (b.HOME_TEAM === awayTeam || b.AWAY_TEAM === awayTeam) &&
        b.COUNTRY === country &&
        b.LEAGUE === league &&
        b.HOME_SCORE &&
        b.AWAY_SCORE &&
        !isNaN(parseInt(b.HOME_SCORE)) &&
        !isNaN(parseInt(b.AWAY_SCORE))
    );

    // Create a deduplicated set of all games (to avoid double-counting head-to-head matches)
    const allGamesMap = new Map();
    [...homeTeamGames, ...awayTeamGames].forEach((game) => {
      const key = `${game.DATE}_${game.HOME_TEAM}_${game.AWAY_TEAM}`;
      if (!allGamesMap.has(key)) {
        allGamesMap.set(key, game);
      }
    });
    const allGames = Array.from(allGamesMap.values());

    // Calculate draw rate from all games involving these teams
    const draws = allGames.filter((b) => isDraw(b)).length;
    const totalGames = allGames.length;
    const drawRate = totalGames > 0 ? (draws / totalGames) * 100 : 0;

    // Calculate league-wide draw rate as fallback
    const leagueGames = (bets || []).filter(
      (b) =>
        b.COUNTRY === country &&
        b.LEAGUE === league &&
        b.HOME_SCORE &&
        b.AWAY_SCORE &&
        !isNaN(parseInt(b.HOME_SCORE)) &&
        !isNaN(parseInt(b.AWAY_SCORE))
    );

    // Deduplicate league games
    const leagueGamesMap = new Map();
    leagueGames.forEach((game) => {
      const key = `${game.DATE}_${game.HOME_TEAM}_${game.AWAY_TEAM}`;
      if (!leagueGamesMap.has(key)) {
        leagueGamesMap.set(key, game);
      }
    });
    const uniqueLeagueGames = Array.from(leagueGamesMap.values());
    const leagueDraws = uniqueLeagueGames.filter((b) => isDraw(b)).length;
    const leagueDrawRate =
      uniqueLeagueGames.length > 0
        ? (leagueDraws / uniqueLeagueGames.length) * 100
        : 0;

    // Use team-specific draw rate if we have enough data (at least 5 games), otherwise use league-wide
    const minSampleSize = 5;
    const effectiveDrawRate =
      totalGames >= minSampleSize ? drawRate : leagueDrawRate;

    // Try to get actual Double Chance bet history for these teams
    const homeTeamDoubleChanceBets = (bets || []).filter(
      (b) =>
        b.TEAM_INCLUDED === homeTeam &&
        b.COUNTRY === country &&
        b.LEAGUE === league &&
        b.BET_TYPE &&
        b.BET_TYPE.toLowerCase().includes("double chance") &&
        b.RESULT &&
        b.RESULT.trim() !== ""
    );

    const awayTeamDoubleChanceBets = (bets || []).filter(
      (b) =>
        b.TEAM_INCLUDED === awayTeam &&
        b.COUNTRY === country &&
        b.LEAGUE === league &&
        b.BET_TYPE &&
        b.BET_TYPE.toLowerCase().includes("double chance") &&
        b.RESULT &&
        b.RESULT.trim() !== ""
    );

    // Calculate Double Chance win rates from actual bet history
    const homeDoubleChanceWins = homeTeamDoubleChanceBets.filter((b) =>
      b.RESULT.toLowerCase().includes("win")
    ).length;
    const homeDoubleChanceTotal = homeTeamDoubleChanceBets.length;
    const homeDoubleChanceWinRate =
      homeDoubleChanceTotal > 0
        ? (homeDoubleChanceWins / homeDoubleChanceTotal) * 100
        : 0;
    const homeDoubleChanceWilsonScore =
      homeDoubleChanceTotal > 0
        ? calculateWilsonScore(homeDoubleChanceWins, homeDoubleChanceTotal)
        : 0;
    const homeDoubleChanceWilsonRate = homeDoubleChanceWilsonScore * 100;

    const awayDoubleChanceWins = awayTeamDoubleChanceBets.filter((b) =>
      b.RESULT.toLowerCase().includes("win")
    ).length;
    const awayDoubleChanceTotal = awayTeamDoubleChanceBets.length;
    const awayDoubleChanceWinRate =
      awayDoubleChanceTotal > 0
        ? (awayDoubleChanceWins / awayDoubleChanceTotal) * 100
        : 0;
    const awayDoubleChanceWilsonScore =
      awayDoubleChanceTotal > 0
        ? calculateWilsonScore(awayDoubleChanceWins, awayDoubleChanceTotal)
        : 0;
    const awayDoubleChanceWilsonRate = awayDoubleChanceWilsonScore * 100;

    // Determine which team to recommend
    let recommendedTeam;
    let teamWinRate;
    let teamWilsonRate;
    let teamDoubleChanceWinRate;
    let teamDoubleChanceWilsonRate;
    let teamDoubleChanceTotal;

    // Use Straight Win analysis to determine the stronger team
    if (straightWinAnalysis.bet === homeTeam) {
      recommendedTeam = homeTeam;
      teamWinRate = straightWinAnalysis.winRate || 0;
      teamWilsonRate = straightWinAnalysis.wilsonWinRate || 0;
      teamDoubleChanceWinRate = homeDoubleChanceWinRate;
      teamDoubleChanceWilsonRate = homeDoubleChanceWilsonRate;
      teamDoubleChanceTotal = homeDoubleChanceTotal;
    } else if (straightWinAnalysis.bet === awayTeam) {
      recommendedTeam = awayTeam;
      teamWinRate = straightWinAnalysis.winRate || 0;
      teamWilsonRate = straightWinAnalysis.wilsonWinRate || 0;
      teamDoubleChanceWinRate = awayDoubleChanceWinRate;
      teamDoubleChanceWilsonRate = awayDoubleChanceWilsonRate;
      teamDoubleChanceTotal = awayDoubleChanceTotal;
    } else {
      // No clear winner - calculate individual team stats to compare
      // Get home team win bets
      const homeTeamWinBets = (bets || []).filter(
        (b) =>
          b.TEAM_INCLUDED === homeTeam &&
          b.COUNTRY === country &&
          b.LEAGUE === league &&
          (b.BET_TYPE === "Win" || !b.BET_TYPE || b.BET_TYPE === "") &&
          b.RESULT &&
          b.RESULT.trim() !== ""
      );
      const homeTeamWins = homeTeamWinBets.filter((b) =>
        b.RESULT.toLowerCase().includes("win")
      ).length;
      const homeTeamTotal = homeTeamWinBets.length;
      const homeTeamWinRate = homeTeamTotal > 0 ? (homeTeamWins / homeTeamTotal) * 100 : 0;
      const homeTeamWilsonScore = homeTeamTotal > 0 ? calculateWilsonScore(homeTeamWins, homeTeamTotal) : 0;
      const homeTeamWilsonRate = homeTeamWilsonScore * 100;

      // Get away team win bets
      const awayTeamWinBets = (bets || []).filter(
        (b) =>
          b.TEAM_INCLUDED === awayTeam &&
          b.COUNTRY === country &&
          b.LEAGUE === league &&
          (b.BET_TYPE === "Win" || !b.BET_TYPE || b.BET_TYPE === "") &&
          b.RESULT &&
          b.RESULT.trim() !== ""
      );
      const awayTeamWins = awayTeamWinBets.filter((b) =>
        b.RESULT.toLowerCase().includes("win")
      ).length;
      const awayTeamTotal = awayTeamWinBets.length;
      const awayTeamWinRate = awayTeamTotal > 0 ? (awayTeamWins / awayTeamTotal) * 100 : 0;
      const awayTeamWilsonScore = awayTeamTotal > 0 ? calculateWilsonScore(awayTeamWins, awayTeamTotal) : 0;
      const awayTeamWilsonRate = awayTeamWilsonScore * 100;
      
      // If we have actual Double Chance data, prefer that
      if (homeDoubleChanceTotal >= 3 && awayDoubleChanceTotal >= 3) {
        if (homeDoubleChanceWilsonRate >= awayDoubleChanceWilsonRate) {
          recommendedTeam = homeTeam;
          teamWinRate = homeTeamWinRate;
          teamWilsonRate = homeDoubleChanceWilsonRate;
          teamDoubleChanceWinRate = homeDoubleChanceWinRate;
          teamDoubleChanceWilsonRate = homeDoubleChanceWilsonRate;
          teamDoubleChanceTotal = homeDoubleChanceTotal;
        } else {
          recommendedTeam = awayTeam;
          teamWinRate = awayTeamWinRate;
          teamWilsonRate = awayDoubleChanceWilsonRate;
          teamDoubleChanceWinRate = awayDoubleChanceWinRate;
          teamDoubleChanceWilsonRate = awayDoubleChanceWilsonRate;
          teamDoubleChanceTotal = awayDoubleChanceTotal;
        }
      } else if (homeTeamWilsonRate >= awayTeamWilsonRate) {
        recommendedTeam = homeTeam;
        teamWinRate = homeTeamWinRate;
        teamWilsonRate = homeTeamWilsonRate;
        teamDoubleChanceWinRate = homeDoubleChanceWinRate;
        teamDoubleChanceWilsonRate = homeDoubleChanceWilsonRate;
        teamDoubleChanceTotal = homeDoubleChanceTotal;
      } else {
        recommendedTeam = awayTeam;
        teamWinRate = awayTeamWinRate;
        teamWilsonRate = awayTeamWilsonRate;
        teamDoubleChanceWinRate = awayDoubleChanceWinRate;
        teamDoubleChanceWilsonRate = awayDoubleChanceWilsonRate;
        teamDoubleChanceTotal = awayDoubleChanceTotal;
      }
    }

    // Calculate Double Chance confidence
    // Priority: Use actual Double Chance bet history if available (most accurate)
    // Fallback: Calculate from Straight Win + Draw Rate (less accurate but still useful)
    // Thresholds:
    // - >= 5 bets: Full confidence (standardized minimum for reliable statistics)
    // - 3-4 bets: Reduced confidence (0.9x multiplier) due to small sample
    // - < 3 bets: Use fallback formula (Straight Win + Draw Rate)
    let doubleChanceConfidence;
    let reasoning;

    if (teamDoubleChanceTotal >= 5) {
      // Use actual Double Chance Wilson Rate (already in percentage form 0-100%)
      doubleChanceConfidence = Math.min(teamDoubleChanceWilsonRate, 100);
      reasoning = `${recommendedTeam} has ${teamDoubleChanceWinRate.toFixed(1)}% Double Chance win rate (${teamDoubleChanceWilsonRate.toFixed(1)}% Wilson) based on ${teamDoubleChanceTotal} actual Double Chance bets.`;
    } else if (teamDoubleChanceTotal >= 3) {
      // Use actual Double Chance data but with lower confidence due to small sample (0.9x multiplier)
      doubleChanceConfidence = Math.min(teamDoubleChanceWilsonRate * 0.9, 100);
      reasoning = `${recommendedTeam} has ${teamDoubleChanceWinRate.toFixed(1)}% Double Chance win rate (${teamDoubleChanceWilsonRate.toFixed(1)}% Wilson) based on ${teamDoubleChanceTotal} Double Chance bets (small sample).`;
    } else {
      // Calculate from Straight Win + Draw Rate
      // Double Chance = Win OR Draw, so we add draw rate to win rate
      // This is mathematically correct: P(Win) + P(Draw) = P(Win OR Draw)
      // Note: This can exceed 100% if team has high win rate + high draw rate, but cap at 100%
      const doubleChanceRate = Math.min(teamWilsonRate + effectiveDrawRate, 100);
      doubleChanceConfidence = Math.min(doubleChanceRate, 100);
      
      const drawRateSource = totalGames >= minSampleSize 
        ? `team-specific (${drawRate.toFixed(1)}% from ${totalGames} games)` 
        : `league-wide (${leagueDrawRate.toFixed(1)}% from ${uniqueLeagueGames.length} league games)`;
      
      reasoning = `${recommendedTeam} has ${teamWinRate.toFixed(1)}% win rate (${teamWilsonRate.toFixed(1)}% Wilson) + ${effectiveDrawRate.toFixed(1)}% draw rate (${drawRateSource}). Total: ${doubleChanceRate.toFixed(1)}%`;
    }

    // Ensure Double Chance confidence is at least as high as Straight Win (logical validation)
    // Double Chance should always be safer than Straight Win
    doubleChanceConfidence = Math.max(
      doubleChanceConfidence,
      straightWinAnalysis.confidence
    );

    // Apply recent form impact
    const isHomeTeam = recommendedTeam === homeTeam;
    const isAwayTeam = recommendedTeam === awayTeam;
    const formImpact = calculateRecentFormImpact(recentFormData, isHomeTeam, isAwayTeam);
    doubleChanceConfidence = Math.min(doubleChanceConfidence * formImpact, 100);
    
    // Apply opponent strength impact
    const opponentPosition = isHomeTeam 
      ? (betData.AWAY_TEAM_POSITION_NUMBER || betData.AWAY_TEAM_POSITION)
      : (betData.HOME_TEAM_POSITION_NUMBER || betData.HOME_TEAM_POSITION);
    const opponentForm = isHomeTeam 
      ? (recentFormData ? {
          wins: recentFormData.awayWins || 0,
          draws: recentFormData.awayDraws || 0,
          losses: recentFormData.awayLosses || 0
        } : null)
      : (recentFormData ? {
          wins: recentFormData.homeWins || 0,
          draws: recentFormData.homeDraws || 0,
          losses: recentFormData.homeLosses || 0
        } : null);
    const opponentStrengthImpact = calculateOpponentStrengthImpact(opponentPosition, opponentForm);
    doubleChanceConfidence = Math.min(doubleChanceConfidence * opponentStrengthImpact, 100);
    
    // Add form note to reasoning if applicable
    if (formImpact !== 1.0) {
      const formNote = ` Recent form: ${formImpact > 1.0 ? '+' : ''}${((formImpact - 1) * 100).toFixed(0)}%`;
      reasoning += formNote;
    }
    
    // Add opponent status note
    const opponentNote = getOpponentStatusDescription(opponentPosition, opponentForm);
    if (opponentNote) {
      reasoning += opponentNote;
    }

    return {
      bet: `${recommendedTeam} or Draw`,
      confidence: Math.min(doubleChanceConfidence, 10),
      successRate: doubleChanceConfidence * 10,
      totalBets: totalGames || teamDoubleChanceTotal || 0,
      reasoning: reasoning,
      // Add Wilson rate for ranking when confidence is capped
      wilsonWinRate: teamDoubleChanceTotal >= 3 
        ? teamDoubleChanceWilsonRate 
        : teamWilsonRate, // Use Straight Win Wilson rate for fallback case
    };
  };

  const analyzeOverUnder = (homeTeam, awayTeam, country, league, betData, recentFormData) => {
    // Check if this is an "Avoid" bet
    if (betData.recommendation && betData.recommendation.includes("Avoid")) {
      return {
        bet: "AVOID",
        confidence: betData.confidenceScore || 30, // Low confidence for AVOID (30% = old 3/10)
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
    
    // Create a deduplicated set of all games (to avoid double-counting head-to-head matches)
    const allGamesMap = new Map();
    [...homeTeamGames, ...awayTeamGames].forEach((game) => {
      // Use date + home team + away team as unique key
      const key = `${game.DATE}_${game.HOME_TEAM}_${game.AWAY_TEAM}`;
      if (!allGamesMap.has(key)) {
        allGamesMap.set(key, game);
      }
    });
    const allGames = Array.from(allGamesMap.values());
    const totalGames = allGames.length;

    // If no data, return no clear trend
    if (totalGames === 0) {
      return {
        bet: "No clear trend",
        confidence: 3, // Standardized low confidence (consistent with other bet types)
        avgGoals: 0,
        totalGames: 0,
        reasoning: "No historical scoring data available",
      };
    }

    // Minimum sample size requirement: 5 games
    // Higher than Straight Win/Double Chance (3 games) because Over/Under analysis requires:
    // - Scoring data (HOME_SCORE and AWAY_SCORE must exist)
    // - More complex statistical analysis (over/under rates across multiple goal lines)
    // This ensures more reliable predictions for goal-based betting
    const minSampleSize = 5;
    if (totalGames < minSampleSize) {
      return {
        bet: "No clear trend",
        confidence: 3, // Low confidence due to insufficient data
        avgGoals: combinedAvgGoals,
        totalGames: totalGames,
        reasoning: `Insufficient data (${totalGames} games). Need at least ${minSampleSize} games for reliable over/under predictions.`,
      };
    }

    // Calculate actual over/under rates from historical games
    // Count how many games went over/under each line
    const goalLines = [1.5, 2.5, 3.5, 4.5];
    let bestRecommendation = null;
    let highestConfidence = 0;

    goalLines.forEach((line) => {
      // Count games where total goals exceeded the line
      const overGames = allGames.filter((b) => {
        const totalGoals = parseInt(b.HOME_SCORE) + parseInt(b.AWAY_SCORE);
        return totalGoals > line;
      }).length;

      // Count games where total goals were under the line
      const underGames = allGames.filter((b) => {
        const totalGoals = parseInt(b.HOME_SCORE) + parseInt(b.AWAY_SCORE);
        return totalGoals < line;
      }).length;

      // Calculate actual rates
      const overRate = totalGames > 0 ? (overGames / totalGames) * 100 : 0;
      const underRate = totalGames > 0 ? (underGames / totalGames) * 100 : 0;

      // Use Wilson Score for statistical confidence
      const overWilsonScore = overGames > 0 ? calculateWilsonScore(overGames, totalGames) : 0;
      const overWilsonRate = overWilsonScore * 100;
      
      const underWilsonScore = underGames > 0 ? calculateWilsonScore(underGames, totalGames) : 0;
      const underWilsonRate = underWilsonScore * 100;

      // Calculate confidence based on Wilson Score (similar to Straight Win)
      // Use a minimum threshold of 60% for confidence
      const minThreshold = 60; // Minimum 60% rate for any confidence
      const minDifference = 10; // Must be at least 10% above/below 50%

      // Check OVER recommendation
      if (overWilsonRate >= minThreshold && (overWilsonRate - 50) >= minDifference) {
        // Wilson rate is already in percentage form (0-100%), use it directly
        const overConfidence = Math.min(overWilsonRate, 100);
        if (overConfidence > highestConfidence) {
          highestConfidence = overConfidence;
          bestRecommendation = {
            bet: `OVER ${line}`,
            confidence: overConfidence,
            avgGoals: combinedAvgGoals,
            totalGames: totalGames,
            overRate: overRate,
            overWilsonRate: overWilsonRate,
            reasoning: `Historical data shows ${overRate.toFixed(1)}% (${overWilsonRate.toFixed(1)}% Wilson) of games go OVER ${line} (${overGames}/${totalGames} games). Combined avg: ${combinedAvgGoals.toFixed(1)} goals.`,
          };
        }
      }

      // Check UNDER recommendation
      if (underWilsonRate >= minThreshold && (underWilsonRate - 50) >= minDifference) {
        // Wilson rate is already in percentage form (0-100%), use it directly
        const underConfidence = Math.min(underWilsonRate, 100);
        if (underConfidence > highestConfidence) {
          highestConfidence = underConfidence;
          bestRecommendation = {
            bet: `UNDER ${line}`,
            confidence: underConfidence,
            avgGoals: combinedAvgGoals,
            totalGames: totalGames,
            underRate: underRate,
            underWilsonRate: underWilsonRate,
            reasoning: `Historical data shows ${underRate.toFixed(1)}% (${underWilsonRate.toFixed(1)}% Wilson) of games go UNDER ${line} (${underGames}/${totalGames} games). Combined avg: ${combinedAvgGoals.toFixed(1)} goals.`,
          };
        }
      }
    });

    // If no clear recommendation found, return neutral
    if (!bestRecommendation || highestConfidence < 5) {
      return {
        bet: "No clear trend",
        confidence: 3, // Standardized low confidence (consistent with other bet types)
        avgGoals: combinedAvgGoals,
        totalGames: totalGames,
        reasoning: `No strong over/under pattern found. Combined average: ${combinedAvgGoals.toFixed(1)} goals per game (${totalGames} games).`,
      };
    }

    // Apply recent form impact for Over/Under
    // Consider both teams' form - good form tends to favor OVER, poor form favors UNDER
    const homeFormImpact = calculateRecentFormImpact(recentFormData, true, false);
    const awayFormImpact = calculateRecentFormImpact(recentFormData, false, true);
    const avgFormImpact = (homeFormImpact + awayFormImpact) / 2;
    
    // For OVER bets, boost confidence if teams are in good form (scoring more)
    // For UNDER bets, boost confidence if teams are in poor form (scoring less)
    const isOverBet = bestRecommendation.bet.includes("OVER");
    let formMultiplier = 1.0;
    
    if (isOverBet && avgFormImpact > 1.0) {
      // Good form favors OVER
      formMultiplier = avgFormImpact;
    } else if (!isOverBet && avgFormImpact < 1.0) {
      // Poor form favors UNDER
      formMultiplier = 1.0 + (1.0 - avgFormImpact); // Invert the impact
    } else if (isOverBet && avgFormImpact < 1.0) {
      // Poor form reduces OVER confidence
      formMultiplier = avgFormImpact;
    } else if (!isOverBet && avgFormImpact > 1.0) {
      // Good form reduces UNDER confidence
      formMultiplier = 2.0 - avgFormImpact; // Invert the impact
    }
    
    // Cap the multiplier
    formMultiplier = Math.max(0.9, Math.min(1.1, formMultiplier));
    
    bestRecommendation.confidence = Math.min(bestRecommendation.confidence * formMultiplier, 100);
    
    // Apply opponent strength impact for Over/Under
    // Strong teams tend to score more (favor OVER), weak teams concede more (favor OVER)
    // Weak teams score less (favor UNDER), strong teams concede less (favor UNDER)
    const homeOpponentPosition = betData.AWAY_TEAM_POSITION_NUMBER || betData.AWAY_TEAM_POSITION;
    const awayOpponentPosition = betData.HOME_TEAM_POSITION_NUMBER || betData.HOME_TEAM_POSITION;
    const homeOpponentForm = recentFormData ? {
      wins: recentFormData.awayWins || 0,
      draws: recentFormData.awayDraws || 0,
      losses: recentFormData.awayLosses || 0
    } : null;
    const awayOpponentForm = recentFormData ? {
      wins: recentFormData.homeWins || 0,
      draws: recentFormData.homeDraws || 0,
      losses: recentFormData.homeLosses || 0
    } : null;
    
    // Average opponent strength (both teams' opponents)
    const homeOpponentStrength = calculateOpponentStrengthImpact(homeOpponentPosition, homeOpponentForm);
    const awayOpponentStrength = calculateOpponentStrengthImpact(awayOpponentPosition, awayOpponentForm);
    const avgOpponentStrength = (homeOpponentStrength + awayOpponentStrength) / 2;
    
    // For OVER: weak opponents (higher multiplier) favor more goals
    // For UNDER: strong opponents (lower multiplier) favor fewer goals
    let opponentMultiplier = 1.0;
    if (isOverBet) {
      // Weak opponents = higher multiplier = more goals expected
      opponentMultiplier = avgOpponentStrength;
    } else {
      // Strong opponents = lower multiplier = fewer goals expected
      opponentMultiplier = 2.0 - avgOpponentStrength; // Invert
    }
    
    // Cap the multiplier
    opponentMultiplier = Math.max(0.95, Math.min(1.05, opponentMultiplier));
    bestRecommendation.confidence = Math.min(bestRecommendation.confidence * opponentMultiplier, 100);
    
    // Add form note to reasoning if applicable
    if (formMultiplier !== 1.0) {
      const formNote = ` Recent form: ${formMultiplier > 1.0 ? '+' : ''}${((formMultiplier - 1) * 100).toFixed(0)}%`;
      bestRecommendation.reasoning += formNote;
    }
    
    // Add opponent strength note
    const opponentNote = ` Opponent strength: ${homeTeam} faces ${getOpponentStatusDescription(homeOpponentPosition, homeOpponentForm).replace(' (Opponent: ', '').replace(')', '') || 'moderate opposition'}; ${awayTeam} faces ${getOpponentStatusDescription(awayOpponentPosition, awayOpponentForm).replace(' (Opponent: ', '').replace(')', '') || 'moderate opposition'}.`;
    bestRecommendation.reasoning += opponentNote;

    return bestRecommendation;
  };

  // Generate detailed reasoning for why a bet should be avoided (reserved for future use)
  // eslint-disable-next-line no-unused-vars
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

  // Use the analysis hook (side effects only)
  // eslint-disable-next-line no-empty-pattern
  const {} = useAnalysis(bets);

  // Use the prediction hook (side effects only)
  // eslint-disable-next-line no-empty-pattern
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

  // Get best team for the currently filtered league/country
  const getBestTeamForFilteredLeague = () => {
    // Only show if both country and league filters are active
    if (!filters.country || !filters.league) {
      return null;
    }

    // Get filtered bets
    const filteredBets = getDeduplicatedFilteredBets();
    
    // Get top teams from filtered bets using the service function directly
    const topTeams = getTopTeams(filteredBets);
    
    // Filter teams to match the exact country and league
    const teamsInLeague = topTeams.filter(
      (team) =>
        team.country === filters.country &&
        team.league === filters.league &&
        team.totalBets >= 3 // Minimum 3 bets for consideration
    );

    if (teamsInLeague.length === 0) {
      return null;
    }

    // Sort by win rate (descending), then by total bets (descending)
    const bestTeam = teamsInLeague.sort((a, b) => {
      const winRateDiff = parseFloat(b.winRate) - parseFloat(a.winRate);
      if (Math.abs(winRateDiff) > 5) return winRateDiff; // Significant difference
      return b.totalBets - a.totalBets; // More bets = more reliable
    })[0];

    return bestTeam;
  };

  const analyzeNewBets = async () => {
    try {
      setIsAnalyzing(true);

      // Clear previous results to avoid showing old data mixed with new
      setAnalysisResults([]);
      setBetRecommendations([]);

      // Fetch new bets from Sheet3
      const fetchedNewBets = await fetchNewBets();
      setNewBets(fetchedNewBets);

      if (!fetchedNewBets || fetchedNewBets.length === 0) {
        setAnalysisResults([]);
        setBetRecommendations([]);
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
        return;
      }

      // Generate a unique betslip ID for this analysis session
      const betslipId = `analysis_${
        new Date().toISOString().split("T")[0]
      }_${Date.now()}`;

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

  // eslint-disable-next-line no-unused-vars
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

  // eslint-disable-next-line no-unused-vars
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

  // eslint-disable-next-line no-unused-vars
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
        {(() => {
          const performers = getBestPerformers();
          const bestTeamForLeague = getBestTeamForFilteredLeague();
          const showBestTeam = bestTeamForLeague !== null;
          
          return (
            <div className={`grid grid-cols-2 md:grid-cols-2 ${showBestTeam ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3 md:gap-6 mb-6`}>
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
              {/* 5th card: Best Team for filtered league - only shows when filters are active */}
              {showBestTeam && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-6 border border-white/20">
                  <div className="text-sm md:text-lg font-bold text-purple-400 mb-1 md:mb-2">
                    Best Team ({filters.league})
                  </div>
                  <div className="text-lg md:text-2xl font-bold text-white">
                    {bestTeamForLeague.teamName || "N/A"}
                  </div>
                  <div className="text-xs md:text-sm text-gray-300">
                    {bestTeamForLeague.winRate || 0}% Win Rate
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {bestTeamForLeague.totalBets || 0} Bets
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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
              getTeamOddsAnalytics={getTeamOddsAnalytics}
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
                                        {result.positionGap && (
                                          <span
                                            className={`block mt-1 text-xs px-2 py-0.5 rounded-full w-fit ${
                                              result.positionGap.gapLabel === "Large"
                                                ? "bg-amber-500/30 text-amber-200"
                                                : result.positionGap.gapLabel === "Moderate"
                                                  ? "bg-blue-500/20 text-blue-200"
                                                  : "bg-white/10 text-gray-400"
                                            }`}
                                            title={`${(result.positionGap.relativeGap * 100).toFixed(0)}% of table`}
                                          >
                                            Gap: {result.positionGap.gapLabel}
                                          </span>
                                        )}
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
🏆 Team Performance: ${result.confidenceBreakdown.team}%
📈 Recent Form: ${result.confidenceBreakdown.recentForm}%
🏛️ League Experience: ${result.confidenceBreakdown.league}%
💰 Odds Value: ${result.confidenceBreakdown.odds}%
⚔️ Head-to-Head: ${result.confidenceBreakdown.matchup}%
📊 League Position: ${result.confidenceBreakdown.position}%
🏠 Home/Away: ${result.confidenceBreakdown.homeAway}%`}
                                    >
                                      {result.confidenceLabel.emoji}{" "}
                                      {result.confidenceScore}%
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
            <RecommendationsTab betRecommendations={betRecommendations} scoringAnalysis={scoringAnalysis} />
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

          {activeTab === "patternAnalysis" && (
            <PatternAnalysisTab bets={bets} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
