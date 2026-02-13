import { useState, useEffect } from "react";
import {
  fetchSheetData,
  fetchBlacklistedTeams,
  fetchTeamNotes,
} from "../utils/fetchSheetData";

export const useAppState = () => {
  // Main data state
  const [bets, setBets] = useState([]);
  const [filteredBets, setFilteredBets] = useState([]);
  const [blacklistedTeams, setBlacklistedTeams] = useState([]);
  const [teamNotes, setTeamNotes] = useState([]);
  const [newBets, setNewBets] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [betRecommendations, setBetRecommendations] = useState([]);
  const [dailyGames, setDailyGames] = useState([]);
  const [attachedPredictions, setAttachedPredictions] = useState({});

  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCompletedSlips, setShowCompletedSlips] = useState(false);
  const [dataViewLoaded, setDataViewLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("data");
  const [dailyGamesLoading, setDailyGamesLoading] = useState(false);
  const [scoringAnalysisLoading, setScoringAnalysisLoading] = useState(false);

  // Sort configurations
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [leagueSortConfig, setLeagueSortConfig] = useState({
    key: "winRate",
    direction: "desc",
  });
  const [countrySortConfig, setCountrySortConfig] = useState({
    key: "winRate",
    direction: "desc",
  });
  const [blacklistSortConfig, setBlacklistSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [oddsSortConfig, setOddsSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [analyticsSortConfig, setAnalyticsSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [analysisSortConfig, setAnalysisSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [slipsSortConfig, setSlipsSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [teamNotesSortConfig, setTeamNotesSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [recommendationSortPreference, setRecommendationSortPreference] = useState("confidence"); // "confidence" | "league_mix"

  // Filters state
  const [filters, setFilters] = useState({
    team: "",
    country: "",
    league: "",
    betType: "",
    betSelection: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    oddsFrom: "",
    oddsTo: "",
  });

  // Query state
  const [queryFilters, setQueryFilters] = useState([
    {
      field: "",
      value: "",
      metric: "",
      operator: "",
      metricValue: "",
    },
  ]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResults, setQueryResults] = useState([]);

  // Expansion states
  const [expandedAnalyticsTeams, setExpandedAnalyticsTeams] = useState(
    new Set()
  );
  const [expandedOddsRanges, setExpandedOddsRanges] = useState(new Set());
  const [expandedSlips, setExpandedSlips] = useState(new Set());
  const [expandedBetTypes, setExpandedBetTypes] = useState(new Set());

  // Analysis state
  const [scoringAnalysis, setScoringAnalysis] = useState(null);

  // Load initial data
  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const [data, blacklist, notes] = await Promise.all([
          fetchSheetData(),
          fetchBlacklistedTeams(),
          fetchTeamNotes(),
        ]);

        // Load attached predictions if available
        let attachedPredictionsData = [];
        if (process.env.NODE_ENV === "development") {
          try {
            const response = await fetch(
              "http://localhost:3001/api/attached-predictions",
              {
                headers: {
                  "Cache-Control": "no-cache",
                  Pragma: "no-cache",
                },
              }
            );
            attachedPredictionsData = await response.json();
          } catch (error) {
            console.log("API not available in production, using empty data");
            attachedPredictionsData = [];
          }
        }

        console.log("Fetched data:", data);
        console.log("Fetched blacklist:", blacklist);
        console.log("Fetched team notes:", notes.length);
        setBets(data);
        setFilteredBets(data);
        setBlacklistedTeams(blacklist);
        setTeamNotes(notes);

        // Load attached predictions
        const predictionsMap = {};
        attachedPredictionsData.forEach((item) => {
          predictionsMap[item.betslipId] = item.predictions;
        });
        setAttachedPredictions(predictionsMap);
      } catch (err) {
        setError("Failed to load bet data");
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  // Fetch daily games when Daily Games tab is active
  useEffect(() => {
    const fetchDailyGames = async () => {
      if (activeTab === "dailyGames") {
        try {
          setDailyGamesLoading(true);
          const response = await fetch(
            "https://docs.google.com/spreadsheets/d/1uairlmwCyYh_OwCFJZtEOHr8svQ2l8C_I8VnLsHHiXQ/gviz/tq?tqx=out:csv&gid=1498171880"
          );
          const csvText = await response.text();
          console.log("Raw CSV text:", csvText);
          const lines = csvText.split("\n").filter((line) => line.trim());
          console.log("CSV lines:", lines);

          // Parse data - try both comma and tab separators
          const dataLines = lines.slice(1); // Skip header row
          console.log("Data lines (after skipping header):", dataLines);

          const games = dataLines
            .map((line) => {
              // Try tab separator first, then comma
              let values = line
                .split("\t")
                .map((v) => v.trim().replace(/"/g, ""));

              // If we don't have enough values, try comma separator
              if (values.length < 5) {
                values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
              }

              console.log("Parsed values:", values);
              return {
                date: values[0] || "",
                home_team: values[1] || "",
                odds1: values[2] || "",
                away_team: values[3] || "",
                odds2: values[4] || "",
                oddsX: values[5] || "",
              };
            })
            .filter((game) => game.home_team && game.away_team);

          console.log("Final games array:", games);

          setDailyGames(games);
        } catch (err) {
          console.error("Failed to fetch daily games:", err);
        } finally {
          setDailyGamesLoading(false);
        }
      }
    };

    fetchDailyGames();
  }, [activeTab]);

  return {
    // Data state
    bets,
    setBets,
    filteredBets,
    setFilteredBets,
    blacklistedTeams,
    setBlacklistedTeams,
    teamNotes,
    setTeamNotes,
    newBets,
    setNewBets,
    analysisResults,
    setAnalysisResults,
    betRecommendations,
    setBetRecommendations,
    dailyGames,
    setDailyGames,
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
    setLoading,
    error,
    setError,
    showFilters,
    setShowFilters,
    activeTab,
    setActiveTab,
    dailyGamesLoading,
    setDailyGamesLoading,
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
    recommendationSortPreference,
    setRecommendationSortPreference,

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
  };
};
