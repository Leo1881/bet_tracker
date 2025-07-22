import React, { useEffect, useState, useCallback } from "react";
import {
  fetchSheetData,
  fetchBlacklistedTeams,
  fetchNewBets,
} from "./utils/fetchSheetData";
import "./App.css";

function App() {
  const [bets, setBets] = useState([]);
  const [filteredBets, setFilteredBets] = useState([]);
  const [blacklistedTeams, setBlacklistedTeams] = useState([]);
  const [newBets, setNewBets] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("data"); // 'data', 'analytics', 'performance', 'blacklist', 'odds', 'betAnalysis', or 'headToHead'
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [leagueSortConfig, setLeagueSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [countrySortConfig, setCountrySortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [blacklistSortConfig, setBlacklistSortConfig] = useState({
    key: "team_name",
    direction: "asc",
  });
  const [oddsSortConfig, setOddsSortConfig] = useState({
    key: "winRate",
    direction: "desc",
  });
  const [expandedOddsRanges, setExpandedOddsRanges] = useState(new Set());
  const [filters, setFilters] = useState({
    team: "",
    betType: "",
    betSelection: "",
    country: "",
    league: "",
    result: "",
    minWinRate: "",
    maxWinRate: "",
  });

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const [data, blacklist] = await Promise.all([
          fetchSheetData(),
          fetchBlacklistedTeams(),
        ]);
        console.log("Fetched data:", data);
        console.log("Fetched blacklist:", blacklist);
        setBets(data);
        setFilteredBets(data);
        setBlacklistedTeams(blacklist);
      } catch (err) {
        setError("Failed to load bet data");
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...bets];

    if (filters.team) {
      filtered = filtered.filter(
        (bet) =>
          bet.HOME_TEAM?.toLowerCase().includes(filters.team.toLowerCase()) ||
          bet.AWAY_TEAM?.toLowerCase().includes(filters.team.toLowerCase()) ||
          bet.TEAM_INCLUDED?.toLowerCase().includes(filters.team.toLowerCase())
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
      filtered = filtered.filter((bet) => {
        const teamName = bet.TEAM_BET || bet.HOME_TEAM || bet.AWAY_TEAM;
        if (!teamName) return true;

        const teamBets = bets.filter(
          (b) => (b.TEAM_BET || b.HOME_TEAM || b.AWAY_TEAM) === teamName
        );
        const wins = teamBets.filter((b) =>
          b.RESULT?.toLowerCase().includes("win")
        ).length;
        const losses = teamBets.filter((b) =>
          b.RESULT?.toLowerCase().includes("loss")
        ).length;
        const total = wins + losses;
        const winRate = total > 0 ? (wins / total) * 100 : 0;

        const minRate = filters.minWinRate ? parseFloat(filters.minWinRate) : 0;
        const maxRate = filters.maxWinRate
          ? parseFloat(filters.maxWinRate)
          : 100;

        return winRate >= minRate && winRate <= maxRate;
      });
    }

    console.log("Filtered bets:", filtered.length, "Original:", bets.length);
    setFilteredBets(filtered);
  }, [filters, bets]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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

  const getSortedData = () => {
    if (!sortConfig.key) return filteredBets;

    return [...filteredBets].sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";

      // Handle date sorting
      if (sortConfig.key === "DATE") {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        if (sortConfig.direction === "asc") {
          return aDate - bDate;
        }
        return bDate - aDate;
      }

      // Handle numeric sorting for odds
      if (sortConfig.key.includes("ODDS")) {
        const aNum = parseFloat(aValue) || 0;
        const bNum = parseFloat(bValue) || 0;
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

  const getSortedLeagueData = () => {
    const leagueData = getLeagueAnalytics();
    if (!leagueSortConfig.key) return leagueData;

    return [...leagueData].sort((a, b) => {
      const aValue = a[leagueSortConfig.key] || "";
      const bValue = b[leagueSortConfig.key] || "";

      // Handle numeric sorting for win rate, total, wins, losses, avg odds
      if (
        ["winRate", "total", "wins", "losses", "avgOdds"].includes(
          leagueSortConfig.key
        )
      ) {
        const aNum = parseFloat(aValue) || 0;
        const bNum = parseFloat(bValue) || 0;
        if (leagueSortConfig.direction === "asc") {
          return aNum - bNum;
        }
        return bNum - aNum;
      }

      // Default string sorting for league name
      if (leagueSortConfig.direction === "asc") {
        return aValue.toString().localeCompare(bValue.toString());
      }
      return bValue.toString().localeCompare(aValue.toString());
    });
  };

  const getSortedCountryData = () => {
    const countryData = getCountryAnalytics();
    if (!countrySortConfig.key) return countryData;

    return [...countryData].sort((a, b) => {
      const aValue = a[countrySortConfig.key] || "";
      const bValue = b[countrySortConfig.key] || "";

      // Handle numeric sorting for win rate, total, wins, losses, avg odds
      if (
        ["winRate", "total", "wins", "losses", "avgOdds"].includes(
          countrySortConfig.key
        )
      ) {
        const aNum = parseFloat(aValue) || 0;
        const bNum = parseFloat(bValue) || 0;
        if (countrySortConfig.direction === "asc") {
          return aNum - bNum;
        }
        return bNum - aNum;
      }

      // Default string sorting for country name
      if (countrySortConfig.direction === "asc") {
        return aValue.toString().localeCompare(bValue.toString());
      }
      return bValue.toString().localeCompare(aValue.toString());
    });
  };

  const getSortedBlacklistData = () => {
    if (!blacklistSortConfig.key) return blacklistedTeams;

    return [...blacklistedTeams].sort((a, b) => {
      const aValue = a[blacklistSortConfig.key] || "";
      const bValue = b[blacklistSortConfig.key] || "";

      // Default string sorting
      if (blacklistSortConfig.direction === "asc") {
        return aValue.toString().localeCompare(bValue.toString());
      }
      return bValue.toString().localeCompare(aValue.toString());
    });
  };

  const getSortedOddsData = () => {
    const oddsData = getFilteredOddsAnalytics();

    if (!oddsSortConfig.key) return oddsData;

    return [...oddsData].sort((a, b) => {
      const aValue = a[oddsSortConfig.key];
      const bValue = b[oddsSortConfig.key];

      if (oddsSortConfig.direction === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const getOddsAnalytics = () => {
    const oddsRanges = {
      "1.0-1.5": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
      "1.5-2.0": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
      "2.0-3.0": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
      "3.0-5.0": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
      "5.0+": { bets: 0, wins: 0, losses: 0, pending: 0, totalOdds: 0 },
    };

    console.log("Total bets to analyze:", bets.length);

    // Look specifically for Algeria record
    const algeriaBet = bets.find(
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

      console.log("Algeria average odds calculation:", algeriaAvgOdds);
      console.log("Algeria odds1 > 0:", algeriaOdds1 > 0);
      console.log("Algeria odds2 > 0:", algeriaOdds2 > 0);
      console.log("Algeria max odds:", Math.max(algeriaOdds1, algeriaOdds2));
    }

    bets.forEach((bet, index) => {
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
        console.log(
          `Bet on home team ${homeTeam} (${teamBet}), using odds1: ${odds1}`
        );
      }
      // If you bet on the away team, use odds2
      else if (
        teamBet &&
        awayTeam &&
        teamBet.toLowerCase().includes(awayTeam.toLowerCase())
      ) {
        betOdds = odds2;
        console.log(
          `Bet on away team ${awayTeam} (${teamBet}), using odds2: ${odds2}`
        );
      }
      // Fallback: use the higher odds (assuming you bet on the underdog)
      else {
        betOdds = Math.max(odds1, odds2);
        console.log(
          `Team match unclear. ${teamBet} vs ${homeTeam}/${awayTeam}. Using max odds: ${betOdds}`
        );
      }

      console.log(
        `Bet on ${teamBet}, using odds: ${betOdds} (odds1: ${odds1}, odds2: ${odds2})`
      );

      if (betOdds <= 0) {
        console.log(`Skipping bet - no valid odds for ${teamBet}`);
        return; // Skip bets without odds
      }

      let range;
      if (betOdds <= 1.5) range = "1.0-1.5";
      else if (betOdds <= 2.0) range = "1.5-2.0";
      else if (betOdds <= 3.0) range = "2.0-3.0";
      else if (betOdds <= 5.0) range = "3.0-5.0";
      else range = "5.0+";

      console.log(`Odds range: ${range} for ${teamBet} with odds ${betOdds}`);

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

    console.log("Final odds ranges:", oddsRanges);

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

    console.log("Final result:", result);
    return result;
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
    return bets.filter((bet) => {
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

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("win")) return "bg-green-100 text-green-800";
    if (lowerStatus.includes("loss")) return "bg-red-100 text-red-800";
    if (lowerStatus.includes("pending")) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const calculateWinPercentage = (betList = bets) => {
    const wins = betList.filter((bet) =>
      bet.RESULT?.toLowerCase().includes("win")
    ).length;
    const losses = betList.filter((bet) =>
      bet.RESULT?.toLowerCase().includes("loss")
    ).length;
    const total = wins + losses;

    if (total === 0) return 0;
    return ((wins / total) * 100).toFixed(1);
  };

  const isTeamBlacklisted = (teamName) => {
    if (!teamName || !blacklistedTeams.length) return false;
    const normalizedTeamName = teamName.toLowerCase().trim();
    return blacklistedTeams.some(
      (blacklistedTeam) =>
        normalizedTeamName.includes(blacklistedTeam) ||
        blacklistedTeam.includes(normalizedTeamName)
    );
  };

  const getUniqueValues = (field) => {
    const values = bets.map((bet) => bet[field]).filter(Boolean);

    console.log(`Getting unique values for field: ${field}`);
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

  const getTeamAnalytics = () => {
    const teams = {};
    bets.forEach((bet) => {
      const teamName = bet.TEAM_INCLUDED || bet.HOME_TEAM || bet.AWAY_TEAM;
      if (!teamName) return;

      // Skip header row data - exclude common header names
      const lowerTeamName = teamName.toLowerCase();
      if (
        lowerTeamName === "team_included" ||
        lowerTeamName === "home_team" ||
        lowerTeamName === "away_team" ||
        lowerTeamName === "team" ||
        lowerTeamName === "team included" ||
        lowerTeamName === "home team" ||
        lowerTeamName === "away team"
      ) {
        return;
      }

      if (!teams[teamName]) {
        teams[teamName] = { wins: 0, losses: 0, pending: 0 };
      }

      if (bet.RESULT?.toLowerCase().includes("win")) teams[teamName].wins++;
      else if (bet.RESULT?.toLowerCase().includes("loss"))
        teams[teamName].losses++;
      else if (bet.RESULT?.toLowerCase().includes("pending"))
        teams[teamName].pending++;
    });

    return Object.entries(teams)
      .map(([team, stats]) => ({
        team,
        ...stats,
        total: stats.wins + stats.losses + stats.pending,
        winRate:
          stats.wins + stats.losses > 0
            ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
            : 0,
      }))
      .sort((a, b) => {
        // Sort by wins first (descending)
        if (a.wins !== b.wins) {
          return b.wins - a.wins;
        }
        // If wins are equal, sort by win rate (descending)
        return parseFloat(b.winRate) - parseFloat(a.winRate);
      });
  };

  const getLeagueAnalytics = () => {
    const leagues = {};
    bets.forEach((bet) => {
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
      if (odds1 > 0 || odds2 > 0) {
        leagues[leagueKey].totalOdds += (odds1 + odds2) / 2;
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
          stats.betCount > 0
            ? (stats.totalOdds / stats.betCount).toFixed(2)
            : 0,
      }))
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
  };

  const getCountryAnalytics = () => {
    const countries = {};
    bets.forEach((bet) => {
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
      if (odds1 > 0 || odds2 > 0) {
        countries[countryName].totalOdds += (odds1 + odds2) / 2;
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
          stats.betCount > 0
            ? (stats.totalOdds / stats.betCount).toFixed(2)
            : 0,
      }))
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
  };

  const getBestPerformers = () => {
    const leagueAnalytics = getLeagueAnalytics();
    const countryAnalytics = getCountryAnalytics();

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

    const worstLeague = leagueAnalytics[leagueAnalytics.length - 1] || {};

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

  const analyzeNewBets = async () => {
    try {
      setIsAnalyzing(true);

      // Fetch new bets from Sheet3
      const fetchedNewBets = await fetchNewBets();
      setNewBets(fetchedNewBets);

      if (fetchedNewBets.length === 0) {
        setAnalysisResults([]);
        return;
      }

      // Analyze each new bet
      const results = fetchedNewBets.map((newBet) => {
        const teamName = newBet.team_included;
        const country = newBet.country;
        const league = newBet.league;

        // Check if team is blacklisted (any country/league)
        const isBlacklisted = blacklistedTeams.some(
          (blacklistedTeam) =>
            blacklistedTeam.team_name.toLowerCase() === teamName.toLowerCase()
        );

        // Get historical performance for this team (ALL competitions for Bet Analysis)
        const teamHistory = bets.filter((bet) => {
          const betTeamIncluded = bet.TEAM_INCLUDED?.toLowerCase() || "";

          // Match by exact team name (the team you bet on) - regardless of country/league
          return betTeamIncluded === teamName.toLowerCase();
        });

        // Calculate historical stats with detailed bet information
        const wins = teamHistory.filter((bet) =>
          bet.RESULT?.toLowerCase().includes("win")
        );
        const losses = teamHistory.filter((bet) =>
          bet.RESULT?.toLowerCase().includes("loss")
        );
        const total = wins.length + losses.length;
        const winRate =
          total > 0 ? ((wins.length / total) * 100).toFixed(1) : 0;

        // Create detailed history strings
        const winDetails = wins.map((bet) => {
          const betType = bet.BET_TYPE || "Unknown";
          const betSelection = bet.BET_SELECTION || "Unknown";
          return `${betType}: ${betSelection}`;
        });

        const lossDetails = losses.map((bet) => {
          const betType = bet.BET_TYPE || "Unknown";
          const betSelection = bet.BET_SELECTION || "Unknown";
          return `${betType}: ${betSelection}`;
        });

        // Determine which odds to use based on the team you bet on
        let betOdds = 0;
        const homeTeam = newBet.home_team;
        const awayTeam = newBet.away_team;

        // If you bet on the home team, use odds1
        if (teamName.toLowerCase().includes(homeTeam.toLowerCase())) {
          betOdds = newBet.odds1;
        }
        // If you bet on the away team, use odds2
        else if (teamName.toLowerCase().includes(awayTeam.toLowerCase())) {
          betOdds = newBet.odds2;
        }
        // Fallback: use the higher odds
        else {
          betOdds = Math.max(newBet.odds1, newBet.odds2);
        }

        // Check for previous matchups (same two teams)
        const previousMatchups = findPreviousMatchups(
          newBet.home_team,
          newBet.away_team,
          newBet.country,
          newBet.league
        );

        // Determine recommendation
        let recommendation = "BET";
        let recommendationColor = "text-green-400";

        if (isBlacklisted) {
          recommendation = "AVOID (Blacklisted)";
          recommendationColor = "text-red-400";
        } else if (total >= 3 && parseFloat(winRate) < 30) {
          recommendation = "AVOID (Poor History)";
          recommendationColor = "text-red-400";
        } else if (total >= 3 && parseFloat(winRate) < 50) {
          recommendation = "CAUTION (Mixed History)";
          recommendationColor = "text-yellow-400";
        } else if (total >= 3 && parseFloat(winRate) >= 70) {
          recommendation = "STRONG BET (Good History)";
          recommendationColor = "text-green-400";
        }

        // Get unique competitions where this team has history
        const competitions = [
          ...new Set(teamHistory.map((bet) => `${bet.COUNTRY} ${bet.LEAGUE}`)),
        ];

        return {
          ...newBet,
          betOdds,
          isBlacklisted,
          historicalBets: total,
          historicalWins: wins.length,
          historicalLosses: losses.length,
          winRate,
          recommendation,
          recommendationColor,
          winDetails,
          lossDetails,
          previousMatchups,
          hasHistory: total > 0,
          competitions: competitions,
        };
      });

      setAnalysisResults(results);
    } catch (error) {
      console.error("Error analyzing new bets:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const findPreviousMatchups = (homeTeam, awayTeam, country, league) => {
    // Create a normalized matchup key (alphabetical order of teams)
    const team1 = homeTeam.toLowerCase();
    const team2 = awayTeam.toLowerCase();
    const sortedTeams = [team1, team2].sort();
    const matchupKey = `${sortedTeams[0]}-${sortedTeams[1]}`;

    // Find all bets involving these two teams in the same country and league
    const matchups = bets.filter((bet) => {
      const betCountry = bet.COUNTRY?.toLowerCase() || "";
      const betLeague = bet.LEAGUE?.toLowerCase() || "";
      const betHomeTeam = bet.HOME_TEAM?.toLowerCase() || "";
      const betAwayTeam = bet.AWAY_TEAM?.toLowerCase() || "";
      const betResult = bet.RESULT?.toLowerCase() || "";

      // Check if it's the same country and league
      if (
        betCountry !== country.toLowerCase() ||
        betLeague !== league.toLowerCase()
      ) {
        return false;
      }

      // Check if it involves the same two teams (regardless of home/away)
      const betSortedTeams = [betHomeTeam, betAwayTeam].sort();
      const betMatchupKey = `${betSortedTeams[0]}-${betSortedTeams[1]}`;

      // Only include bets with actual results (Win or Loss)
      const hasResult = betResult.includes("win") || betResult.includes("loss");

      return betMatchupKey === matchupKey && hasResult;
    });

    return matchups.map((bet) => ({
      date: bet.DATE,
      homeTeam: bet.HOME_TEAM,
      awayTeam: bet.AWAY_TEAM,
      betType: bet.BET_TYPE,
      betSelection: bet.BET_SELECTION,
      teamIncluded: bet.TEAM_INCLUDED,
      result: bet.RESULT,
      odds1: bet.ODDS1,
      odds2: bet.ODDS2,
    }));
  };

  const getHeadToHeadData = () => {
    const headToHeadMap = new Map();

    // Process all bets to find matchups
    bets.forEach((bet) => {
      const country = bet.COUNTRY?.toLowerCase() || "";
      const league = bet.LEAGUE?.toLowerCase() || "";
      const homeTeam = bet.HOME_TEAM?.toLowerCase() || "";
      const awayTeam = bet.AWAY_TEAM?.toLowerCase() || "";

      if (!homeTeam || !awayTeam) return;

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
      if (bet.RESULT?.toLowerCase().includes("win")) {
        matchup.wins++;
      } else if (bet.RESULT?.toLowerCase().includes("loss")) {
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
      <div className="w-full px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            ⚽️ Bet Tracker
          </h1>
          <p className="text-gray-300 text-lg">
            Track your betting performance and analyze your results
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-2xl font-bold text-white">
              {filteredBets.length}
            </div>
            <div className="text-gray-300">Filtered Bets</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-2xl font-bold text-green-400">
              {
                filteredBets.filter((bet) =>
                  bet.RESULT?.toLowerCase().includes("win")
                ).length
              }
            </div>
            <div className="text-gray-300">Wins</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-2xl font-bold text-red-400">
              {
                filteredBets.filter((bet) =>
                  bet.RESULT?.toLowerCase().includes("loss")
                ).length
              }
            </div>
            <div className="text-gray-300">Losses</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-2xl font-bold text-yellow-400">
              {
                filteredBets.filter((bet) =>
                  bet.RESULT?.toLowerCase().includes("pending")
                ).length
              }
            </div>
            <div className="text-gray-300">Pending</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-2xl font-bold text-blue-400">
              {calculateWinPercentage(filteredBets)}%
            </div>
            <div className="text-gray-300">Win Rate</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              Filters & Analytics
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Team</label>
                <select
                  value={filters.team}
                  onChange={(e) =>
                    setFilters({ ...filters, team: e.target.value })
                  }
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 border border-white/20"
                >
                  <option value="">All Teams</option>
                  {getUniqueValues("TEAM_INCLUDED").map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Bet Type
                </label>
                <select
                  value={filters.betType}
                  onChange={(e) =>
                    setFilters({ ...filters, betType: e.target.value })
                  }
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 border border-white/20"
                >
                  <option value="">All Bet Types</option>
                  {getUniqueValues("BET_TYPE").map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Bet Selection
                </label>
                <select
                  value={filters.betSelection}
                  onChange={(e) =>
                    setFilters({ ...filters, betSelection: e.target.value })
                  }
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 border border-white/20"
                >
                  <option value="">All Bet Selections</option>
                  {getUniqueValues("BET_SELECTION").map((selection) => (
                    <option key={selection} value={selection}>
                      {selection}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Country
                </label>
                <select
                  value={filters.country}
                  onChange={(e) =>
                    setFilters({ ...filters, country: e.target.value })
                  }
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 border border-white/20"
                >
                  <option value="">All Countries</option>
                  {getUniqueValues("COUNTRY").map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Result
                </label>
                <select
                  value={filters.result}
                  onChange={(e) =>
                    setFilters({ ...filters, result: e.target.value })
                  }
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 border border-white/20"
                >
                  <option value="">All Results</option>
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Min Win Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minWinRate}
                  onChange={(e) =>
                    setFilters({ ...filters, minWinRate: e.target.value })
                  }
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 border border-white/20"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Max Win Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.maxWinRate}
                  onChange={(e) =>
                    setFilters({ ...filters, maxWinRate: e.target.value })
                  }
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 border border-white/20"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Clear Filters
                </label>
                <button
                  onClick={() =>
                    setFilters({
                      team: "",
                      betType: "",
                      betSelection: "",
                      country: "",
                      league: "",
                      result: "",
                      minWinRate: "",
                      maxWinRate: "",
                    })
                  }
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab("data")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "data"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            📊 Data View
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "analytics"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            📈 Analytics View
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "performance"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            🌍 Performance Analytics
          </button>
          <button
            onClick={() => setActiveTab("blacklist")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "blacklist"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            🚫 Blacklist
          </button>
          <button
            onClick={() => setActiveTab("odds")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "odds"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            📈 Odds Analytics
          </button>
          <button
            onClick={() => setActiveTab("betAnalysis")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "betAnalysis"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            🔍 Bet Analysis
          </button>
          <button
            onClick={() => setActiveTab("headToHead")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "headToHead"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            ⚔️ Head to Head
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "data" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden max-w-full">
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-white/20">
                  <tr>
                    {filteredBets[0] &&
                      Object.keys(filteredBets[0]).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-4 text-left text-white font-semibold text-sm whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors"
                          onClick={() => handleSort(key)}
                        >
                          <div className="flex items-center justify-between">
                            <span>{key}</span>
                            {sortConfig.key === key && (
                              <span className="ml-2">
                                {sortConfig.direction === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {getSortedData().map((bet, index) => (
                    <tr
                      key={index}
                      className="hover:bg-white/5 transition-colors"
                    >
                      {Object.entries(bet).map(([key, value], i) => (
                        <td key={i} className="px-3 py-4 text-gray-200 text-sm">
                          {key === "RESULT" ? (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                value
                              )}`}
                            >
                              {value || "Unknown"}
                            </span>
                          ) : key === "DATE" ? (
                            <span className="text-blue-300 whitespace-nowrap">
                              {formatDate(value)}
                            </span>
                          ) : key.includes("ODDS") ? (
                            <span className="font-mono text-yellow-400 whitespace-nowrap">
                              {value || "-"}
                            </span>
                          ) : key === "BET_TYPE" ||
                            key === "BET_SELECTION" ||
                            key === "TEAM_BET" ? (
                            <span className="font-medium text-purple-300 whitespace-nowrap">
                              {value || "-"}
                            </span>
                          ) : (
                            <span className="whitespace-nowrap">
                              {value || "-"}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Team Performance Analytics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/20">
                  <tr>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Team
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Total Bets
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Wins
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Losses
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Win Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {getTeamAnalytics().map((team, index) => (
                    <tr
                      key={index}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-2 text-gray-200">{team.team}</td>
                      <td className="px-4 py-2 text-gray-200">{team.total}</td>
                      <td className="px-4 py-2 text-green-400">{team.wins}</td>
                      <td className="px-4 py-2 text-red-400">{team.losses}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            parseFloat(team.winRate) >= 70
                              ? "bg-green-100 text-green-800"
                              : parseFloat(team.winRate) >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {team.winRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="space-y-6">
            {/* Best Performers Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {(() => {
                const performers = getBestPerformers();
                return (
                  <>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <div className="text-lg font-bold text-green-400 mb-2">
                        🏆 Best League
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {performers.bestLeague.leagueDisplay ||
                          performers.bestLeague.league ||
                          "N/A"}
                      </div>
                      <div className="text-gray-300">
                        {performers.bestLeague.winRate || 0}% Win Rate
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <div className="text-lg font-bold text-green-400 mb-2">
                        🌍 Best Country
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {performers.bestCountry.country || "N/A"}
                      </div>
                      <div className="text-gray-300">
                        {performers.bestCountry.winRate || 0}% Win Rate
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <div className="text-lg font-bold text-blue-400 mb-2">
                        📊 Most Bets
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {performers.mostBetsLeague.leagueDisplay ||
                          performers.mostBetsLeague.league ||
                          "N/A"}
                      </div>
                      <div className="text-gray-300">
                        {performers.mostBetsLeague.total || 0} Bets
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* League Performance Table */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                🏆 League Performance Analytics
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/20">
                    <tr>
                      <th
                        className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => handleLeagueSort("leagueDisplay")}
                      >
                        <div className="flex items-center justify-between">
                          <span>League</span>
                          {leagueSortConfig.key === "leagueDisplay" && (
                            <span className="ml-2">
                              {leagueSortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => handleLeagueSort("total")}
                      >
                        <div className="flex items-center justify-between">
                          <span>Bets</span>
                          {leagueSortConfig.key === "total" && (
                            <span className="ml-2">
                              {leagueSortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => handleLeagueSort("wins")}
                      >
                        <div className="flex items-center justify-between">
                          <span>Wins</span>
                          {leagueSortConfig.key === "wins" && (
                            <span className="ml-2">
                              {leagueSortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => handleLeagueSort("losses")}
                      >
                        <div className="flex items-center justify-between">
                          <span>Losses</span>
                          {leagueSortConfig.key === "losses" && (
                            <span className="ml-2">
                              {leagueSortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => handleLeagueSort("winRate")}
                      >
                        <div className="flex items-center justify-between">
                          <span>Win Rate</span>
                          {leagueSortConfig.key === "winRate" && (
                            <span className="ml-2">
                              {leagueSortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {getSortedLeagueData().map((league, index) => (
                      <tr
                        key={index}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-2 text-gray-200 font-medium">
                          {league.leagueDisplay}
                        </td>
                        <td className="px-4 py-2 text-gray-200">
                          {league.total}
                        </td>
                        <td className="px-4 py-2 text-green-400">
                          {league.wins}
                        </td>
                        <td className="px-4 py-2 text-red-400">
                          {league.losses}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              parseFloat(league.winRate) >= 70
                                ? "bg-green-100 text-green-800"
                                : parseFloat(league.winRate) >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {league.winRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Country Performance Table */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                🌍 Country Performance Analytics
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/20">
                    <tr>
                      <th
                        className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => handleCountrySort("country")}
                      >
                        <div className="flex items-center justify-between">
                          <span>Country</span>
                          {countrySortConfig.key === "country" && (
                            <span className="ml-2">
                              {countrySortConfig.direction === "asc"
                                ? "↑"
                                : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => handleCountrySort("total")}
                      >
                        <div className="flex items-center justify-between">
                          <span>Bets</span>
                          {countrySortConfig.key === "total" && (
                            <span className="ml-2">
                              {countrySortConfig.direction === "asc"
                                ? "↑"
                                : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => handleCountrySort("wins")}
                      >
                        <div className="flex items-center justify-between">
                          <span>Wins</span>
                          {countrySortConfig.key === "wins" && (
                            <span className="ml-2">
                              {countrySortConfig.direction === "asc"
                                ? "↑"
                                : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => handleCountrySort("losses")}
                      >
                        <div className="flex items-center justify-between">
                          <span>Losses</span>
                          {countrySortConfig.key === "losses" && (
                            <span className="ml-2">
                              {countrySortConfig.direction === "asc"
                                ? "↑"
                                : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => handleCountrySort("winRate")}
                      >
                        <div className="flex items-center justify-between">
                          <span>Win Rate</span>
                          {countrySortConfig.key === "winRate" && (
                            <span className="ml-2">
                              {countrySortConfig.direction === "asc"
                                ? "↑"
                                : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {getSortedCountryData().map((country, index) => (
                      <tr
                        key={index}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-2 text-gray-200 font-medium">
                          {country.country}
                        </td>
                        <td className="px-4 py-2 text-gray-200">
                          {country.total}
                        </td>
                        <td className="px-4 py-2 text-green-400">
                          {country.wins}
                        </td>
                        <td className="px-4 py-2 text-red-400">
                          {country.losses}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              parseFloat(country.winRate) >= 70
                                ? "bg-green-100 text-green-800"
                                : parseFloat(country.winRate) >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {country.winRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "blacklist" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              🚫 Blacklisted Teams
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/20">
                  <tr>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleBlacklistSort("country")}
                    >
                      <div className="flex items-center justify-between">
                        <span>Country</span>
                        {blacklistSortConfig.key === "country" && (
                          <span className="ml-2">
                            {blacklistSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleBlacklistSort("league")}
                    >
                      <div className="flex items-center justify-between">
                        <span>League</span>
                        {blacklistSortConfig.key === "league" && (
                          <span className="ml-2">
                            {blacklistSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleBlacklistSort("team_name")}
                    >
                      <div className="flex items-center justify-between">
                        <span>Team Name</span>
                        {blacklistSortConfig.key === "team_name" && (
                          <span className="ml-2">
                            {blacklistSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {blacklistedTeams.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center">
                        <p className="text-gray-300 text-lg">
                          No blacklisted teams found
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                          Add teams to Sheet2 in your Google Sheets to see them
                          here
                        </p>
                      </td>
                    </tr>
                  ) : (
                    getSortedBlacklistData().map((team, index) => (
                      <tr
                        key={index}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-2 text-gray-200 font-medium capitalize">
                          {team.country}
                        </td>
                        <td className="px-4 py-2 text-gray-200 font-medium capitalize">
                          {team.league}
                        </td>
                        <td className="px-4 py-2 text-gray-200 font-medium capitalize">
                          {team.team_name}
                        </td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            🚫 Blacklisted
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-gray-400 text-sm">
              <p>Total blacklisted teams: {blacklistedTeams.length}</p>
            </div>
          </div>
        )}

        {activeTab === "odds" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              📈 Odds Range Performance Analytics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/20">
                  <tr>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleOddsSort("range")}
                    >
                      <div className="flex items-center justify-between">
                        <span>Odds Range</span>
                        {oddsSortConfig.key === "range" && (
                          <span className="ml-2">
                            {oddsSortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleOddsSort("bets")}
                    >
                      <div className="flex items-center justify-between">
                        <span>Bets</span>
                        {oddsSortConfig.key === "bets" && (
                          <span className="ml-2">
                            {oddsSortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleOddsSort("wins")}
                    >
                      <div className="flex items-center justify-between">
                        <span>Wins</span>
                        {oddsSortConfig.key === "wins" && (
                          <span className="ml-2">
                            {oddsSortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleOddsSort("losses")}
                    >
                      <div className="flex items-center justify-between">
                        <span>Losses</span>
                        {oddsSortConfig.key === "losses" && (
                          <span className="ml-2">
                            {oddsSortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleOddsSort("winRate")}
                    >
                      <div className="flex items-center justify-between">
                        <span>Win Rate</span>
                        {oddsSortConfig.key === "winRate" && (
                          <span className="ml-2">
                            {oddsSortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleOddsSort("avgOdds")}
                    >
                      <div className="flex items-center justify-between">
                        <span>Avg Odds</span>
                        {oddsSortConfig.key === "avgOdds" && (
                          <span className="ml-2">
                            {oddsSortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {getSortedOddsData().length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center">
                        <p className="text-gray-300 text-lg">
                          No odds data found
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                          Add bets with odds data to see odds range analytics
                        </p>
                      </td>
                    </tr>
                  ) : (
                    getFilteredOddsAnalytics().map((odds, index) => {
                      const isExpanded = expandedOddsRanges.has(odds.range);
                      const rangeBets = getBetsForOddsRange(odds.range);

                      return (
                        <React.Fragment key={index}>
                          <tr
                            className="hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() => toggleOddsRangeExpansion(odds.range)}
                          >
                            <td className="px-4 py-2 text-gray-200 font-medium">
                              <div className="flex items-center">
                                <span className="mr-2">
                                  {isExpanded ? "▼" : "▶"}
                                </span>
                                {odds.range}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-gray-200">
                              {odds.bets}
                            </td>
                            <td className="px-4 py-2 text-green-400">
                              {odds.wins}
                            </td>
                            <td className="px-4 py-2 text-red-400">
                              {odds.losses}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  parseFloat(odds.winRate) >= 70
                                    ? "bg-green-100 text-green-800"
                                    : parseFloat(odds.winRate) >= 50
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {odds.winRate}%
                              </span>
                            </td>
                            <td className="px-4 py-2 text-blue-300">
                              {odds.avgOdds}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-white/5">
                              <td colSpan="6" className="px-4 py-4">
                                <div className="space-y-3">
                                  <h4 className="text-white font-semibold mb-3">
                                    📊 Individual Bets in {odds.range} Range (
                                    {rangeBets.length} bets)
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead className="bg-white/10">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-white font-medium">
                                            Date
                                          </th>
                                          <th className="px-3 py-2 text-left text-white font-medium">
                                            Country
                                          </th>
                                          <th className="px-3 py-2 text-left text-white font-medium">
                                            League
                                          </th>
                                          <th className="px-3 py-2 text-left text-white font-medium">
                                            Teams
                                          </th>
                                          <th className="px-3 py-2 text-left text-white font-medium">
                                            Bet On
                                          </th>
                                          <th className="px-3 py-2 text-left text-white font-medium">
                                            Odds
                                          </th>
                                          <th className="px-3 py-2 text-left text-white font-medium">
                                            Result
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/10">
                                        {rangeBets.map((bet, betIndex) => {
                                          const odds1 =
                                            parseFloat(bet.ODDS1) || 0;
                                          const odds2 =
                                            parseFloat(bet.ODDS2) || 0;
                                          const teamBet = bet.TEAM_INCLUDED;
                                          const homeTeam = bet.HOME_TEAM;
                                          const awayTeam = bet.AWAY_TEAM;

                                          // Determine which odds to use
                                          let betOdds = 0;
                                          if (
                                            teamBet &&
                                            homeTeam &&
                                            teamBet
                                              .toLowerCase()
                                              .includes(homeTeam.toLowerCase())
                                          ) {
                                            betOdds = odds1;
                                          } else if (
                                            teamBet &&
                                            awayTeam &&
                                            teamBet
                                              .toLowerCase()
                                              .includes(awayTeam.toLowerCase())
                                          ) {
                                            betOdds = odds2;
                                          } else {
                                            betOdds = Math.max(odds1, odds2);
                                          }

                                          return (
                                            <tr
                                              key={betIndex}
                                              className="hover:bg-white/5"
                                            >
                                              <td className="px-3 py-2 text-gray-300">
                                                {formatDate(bet.DATE)}
                                              </td>
                                              <td className="px-3 py-2 text-gray-300">
                                                {bet.COUNTRY || "-"}
                                              </td>
                                              <td className="px-3 py-2 text-gray-300">
                                                {bet.LEAGUE || "-"}
                                              </td>
                                              <td className="px-3 py-2 text-gray-300">
                                                <div className="text-xs">
                                                  <div>
                                                    {bet.HOME_TEAM || "-"}
                                                  </div>
                                                  <div className="text-gray-400">
                                                    vs
                                                  </div>
                                                  <div>
                                                    {bet.AWAY_TEAM || "-"}
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="px-3 py-2 text-purple-300 font-medium">
                                                {teamBet || "-"}
                                              </td>
                                              <td className="px-3 py-2 text-yellow-400 font-mono">
                                                {betOdds.toFixed(2)}
                                              </td>
                                              <td className="px-3 py-2">
                                                <span
                                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                    bet.RESULT
                                                  )}`}
                                                >
                                                  {bet.RESULT || "Unknown"}
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-gray-400 text-sm">
              <p>
                💡 Tip: Focus on odds ranges with higher win rates for better
                profitability
              </p>
            </div>
          </div>
        )}

        {activeTab === "betAnalysis" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              🔍 Bet Analysis
            </h3>
            <div className="text-gray-300 mb-6">
              <p>
                Add your new bets to Sheet3 in your Google Spreadsheet, then
                click the button below to analyze them against your historical
                data and blacklist.
              </p>
            </div>

            {/* Fetch and Analyze Button */}
            <div className="mb-6">
              <button
                onClick={analyzeNewBets}
                disabled={isAnalyzing}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isAnalyzing
                    ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {isAnalyzing
                  ? "🔄 Analyzing..."
                  : "📊 Fetch & Analyze New Bets"}
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
                        <th className="px-4 py-2 text-left text-white font-semibold">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-white font-semibold">
                          Match
                        </th>
                        <th className="px-4 py-2 text-left text-white font-semibold">
                          Bet On
                        </th>
                        <th className="px-4 py-2 text-left text-white font-semibold">
                          Odds
                        </th>
                        <th className="px-4 py-2 text-left text-white font-semibold">
                          Blacklist
                        </th>
                        <th className="px-4 py-2 text-left text-white font-semibold">
                          History
                        </th>
                        <th className="px-4 py-2 text-left text-white font-semibold">
                          Previous Matchups
                        </th>
                        <th className="px-4 py-2 text-left text-white font-semibold">
                          Recommendation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {analysisResults.map((result, index) => (
                        <tr key={index} className="hover:bg-white/5">
                          <td className="px-4 py-2 text-gray-300">
                            {formatDate(result.date)}
                          </td>
                          <td className="px-4 py-2 text-gray-300">
                            <div className="text-sm">
                              <div>
                                {result.home_team} vs {result.away_team}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {result.country} • {result.league}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-purple-300 font-medium">
                            {result.team_included}
                          </td>
                          <td className="px-4 py-2 text-yellow-400 font-mono">
                            {result.betOdds}
                          </td>
                          <td className="px-4 py-2">
                            {result.isBlacklisted ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                🚫 Blacklisted
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✅ Safe
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-300">
                            {result.hasHistory ? (
                              <div className="text-sm">
                                <div>
                                  {result.historicalWins}W -{" "}
                                  {result.historicalLosses}L
                                </div>
                                <div className="text-xs">
                                  {result.winRate}% win rate
                                </div>
                                {result.competitions.length > 0 && (
                                  <div className="mt-1">
                                    <div className="text-xs text-blue-400 font-medium">
                                      Competitions:
                                    </div>
                                    {result.competitions.map((comp, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs text-blue-300"
                                      >
                                        • {comp}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {result.winDetails.length > 0 && (
                                  <div className="mt-1">
                                    <div className="text-xs text-green-400 font-medium">
                                      Wins:
                                    </div>
                                    {result.winDetails.map((detail, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs text-green-300"
                                      >
                                        • {detail}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {result.lossDetails.length > 0 && (
                                  <div className="mt-1">
                                    <div className="text-xs text-red-400 font-medium">
                                      Losses:
                                    </div>
                                    {result.lossDetails.map((detail, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs text-red-300"
                                      >
                                        • {detail}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                No history
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-300">
                            {result.previousMatchups.length > 0 ? (
                              <div className="text-sm">
                                <div className="text-blue-400 font-medium mb-1">
                                  🔄 {result.previousMatchups.length} previous
                                  matchup
                                  {result.previousMatchups.length > 1
                                    ? "s"
                                    : ""}
                                </div>
                                {(() => {
                                  const wins = result.previousMatchups.filter(
                                    (m) =>
                                      m.result?.toLowerCase().includes("win")
                                  ).length;
                                  const losses = result.previousMatchups.filter(
                                    (m) =>
                                      m.result?.toLowerCase().includes("loss")
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
                                        className={`px-1 py-0.5 rounded text-xs font-medium ${
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
                          <td className="px-4 py-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${result.recommendationColor}`}
                            >
                              {result.recommendation}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Stats */}
                <div className="mt-6 p-4 bg-white/5 rounded-lg">
                  <h5 className="text-white font-semibold mb-3">📊 Summary</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Total Bets</div>
                      <div className="text-white font-medium">
                        {analysisResults.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Blacklisted</div>
                      <div className="text-red-400 font-medium">
                        {analysisResults.filter((r) => r.isBlacklisted).length}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Recommended</div>
                      <div className="text-green-400 font-medium">
                        {
                          analysisResults.filter((r) =>
                            r.recommendation.includes("BET")
                          ).length
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Avoid</div>
                      <div className="text-red-400 font-medium">
                        {
                          analysisResults.filter((r) =>
                            r.recommendation.includes("AVOID")
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
                  📝 No Analysis Results
                </div>
                <p className="text-gray-500">
                  Click the button above to fetch and analyze new bets from
                  Sheet3.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "headToHead" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              ⚔️ Head to Head Analysis
            </h3>
            <div className="text-gray-300 mb-6">
              <p>
                This tab shows matchups found in your new bet analysis. Click
                "Fetch & Analyze New Bets" in the Bet Analysis tab to populate
                this data.
              </p>
            </div>

            {analysisResults.length > 0 ? (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white mb-4">
                  📋 Matchups Found in New Bets (
                  {
                    analysisResults.filter((r) => r.previousMatchups.length > 0)
                      .length
                  }{" "}
                  matchups)
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/20">
                      <tr>
                        <th className="px-4 py-2 text-left text-white font-semibold">
                          New Bet
                        </th>
                        <th className="px-4 py-2 text-left text-white font-semibold">
                          Country
                        </th>
                        <th className="px-4 py-2 text-left text-white font-semibold">
                          League
                        </th>
                        <th className="px-4 py-2 text-left text-white font-semibold">
                          Teams
                        </th>
                        <th className="px-4 py-2 text-left text-white font-semibold">
                          Previous Bets
                        </th>
                        <th className="px-4 py-2 text-left text-white font-semibold">
                          Performance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {analysisResults
                        .filter((result) => result.previousMatchups.length > 0)
                        .map((result, index) => {
                          const wins = result.previousMatchups.filter((m) =>
                            m.result?.toLowerCase().includes("win")
                          ).length;
                          const losses = result.previousMatchups.filter((m) =>
                            m.result?.toLowerCase().includes("loss")
                          ).length;
                          const total = wins + losses;
                          const winRate =
                            total > 0 ? ((wins / total) * 100).toFixed(1) : 0;

                          return (
                            <tr key={index} className="hover:bg-white/5">
                              <td className="px-4 py-2 text-gray-300">
                                <div className="text-sm">
                                  <div className="font-medium text-purple-300">
                                    {result.team_included}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {formatDate(result.date)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-gray-300">
                                {result.country}
                              </td>
                              <td className="px-4 py-2 text-gray-300">
                                {result.league}
                              </td>
                              <td className="px-4 py-2 text-gray-300">
                                <div className="text-sm">
                                  <div>
                                    {result.home_team} vs {result.away_team}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-gray-300">
                                <div className="text-sm">
                                  <div className="text-blue-400 font-medium mb-1">
                                    {result.previousMatchups.length} previous
                                    bet
                                    {result.previousMatchups.length > 1
                                      ? "s"
                                      : ""}
                                  </div>
                                  {result.previousMatchups
                                    .slice(0, 3)
                                    .map((matchup, idx) => (
                                      <div key={idx} className="text-xs mb-1">
                                        <div className="text-gray-400">
                                          {formatDate(matchup.date)}:{" "}
                                          {matchup.betType} -{" "}
                                          {matchup.betSelection}
                                        </div>
                                        <div
                                          className={`text-xs ${
                                            matchup.result
                                              ?.toLowerCase()
                                              .includes("win")
                                              ? "text-green-400"
                                              : "text-red-400"
                                          }`}
                                        >
                                          {matchup.result} •{" "}
                                          {matchup.teamIncluded}
                                        </div>
                                      </div>
                                    ))}
                                  {result.previousMatchups.length > 3 && (
                                    <div className="text-xs text-gray-500">
                                      +{result.previousMatchups.length - 3}{" "}
                                      more...
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <div className="text-sm">
                                  <div className="text-gray-300">
                                    {wins}W - {losses}L
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-4">
                  📝 No Matchups Found
                </div>
                <p className="text-gray-500">
                  No previous matchups found in your new bets. Click "Fetch &
                  Analyze New Bets" in the Bet Analysis tab to populate this
                  data.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400">
          <p>Built with React & Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}

export default App;
