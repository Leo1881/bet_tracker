import React, { useEffect, useState, useCallback } from "react";
import {
  fetchSheetData,
  fetchBlacklistedTeams,
  fetchNewBets,
  fetchTeamNotes,
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
  const [activeTab, setActiveTab] = useState("data"); // 'data', 'analytics', 'performance', 'blacklist', 'odds', 'betAnalysis', 'headToHead', 'topTeams', 'betSlips', 'teamNotes', or 'betTypeAnalytics'
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
    key: "team_name",
    direction: "asc",
  });
  const [oddsSortConfig, setOddsSortConfig] = useState({
    key: "winRate",
    direction: "desc",
  });
  const [slipsSortConfig, setSlipsSortConfig] = useState({
    key: "betId",
    direction: "desc",
  });
  const [teamNotesSortConfig, setTeamNotesSortConfig] = useState({
    key: "team_name",
    direction: "asc",
  });
  const [expandedOddsRanges, setExpandedOddsRanges] = useState(new Set());
  const [expandedSlips, setExpandedSlips] = useState(new Set());
  const [expandedBetTypes, setExpandedBetTypes] = useState(new Set());
  const [expandedAnalyticsTeams, setExpandedAnalyticsTeams] = useState(
    new Set()
  );
  const [analyticsSortConfig, setAnalyticsSortConfig] = useState({
    key: "winRate",
    direction: "desc",
  });
  const [dailyGames, setDailyGames] = useState([]);
  const [dailyGamesLoading, setDailyGamesLoading] = useState(false);
  const [teamNotes, setTeamNotes] = useState([]);
  const [filters, setFilters] = useState({
    team: "",
    betType: "",
    betSelection: "",
    country: "",
    league: "",
    result: "",
    minWinRate: "",
    maxWinRate: "",
    status: "",
  });

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const [data, blacklist, notes] = await Promise.all([
          fetchSheetData(),
          fetchBlacklistedTeams(),
          fetchTeamNotes(),
        ]);
        console.log("Fetched data:", data);
        console.log("Fetched blacklist:", blacklist);
        console.log("Fetched team notes:", notes);
        setBets(data);
        setFilteredBets(data);
        setBlacklistedTeams(blacklist);
        setTeamNotes(notes);
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

  const handleSlipsSort = (key) => {
    let direction = "asc";
    if (slipsSortConfig.key === key && slipsSortConfig.direction === "asc") {
      direction = "desc";
    }
    setSlipsSortConfig({ key, direction });
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

  const getSortedData = () => {
    const deduplicatedFilteredBets = getDeduplicatedFilteredBets();

    if (!sortConfig.key) return deduplicatedFilteredBets;

    return [...deduplicatedFilteredBets].sort((a, b) => {
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
        // For descending sort, if win rates are equal, sort by wins (descending)
        if (leagueSortConfig.key === "winRate" && aNum === bNum) {
          return b.wins - a.wins;
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
        // For descending sort, if win rates are equal, sort by wins (descending)
        if (countrySortConfig.key === "winRate" && aNum === bNum) {
          return b.wins - a.wins;
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

  const getSortedSlipsData = () => {
    let slipsData = getBetSlips();

    // Apply status filter
    if (filters.status) {
      slipsData = slipsData.filter((slip) => slip.status === filters.status);
    }

    if (!slipsSortConfig.key) return slipsData;

    return [...slipsData].sort((a, b) => {
      const aValue = a[slipsSortConfig.key];
      const bValue = b[slipsSortConfig.key];

      // Handle date sorting
      if (slipsSortConfig.key === "date") {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        if (slipsSortConfig.direction === "asc") {
          return aDate - bDate;
        }
        return bDate - aDate;
      }

      // Handle numeric sorting for totalBets, wins, losses, winRate
      if (
        ["totalBets", "wins", "losses", "winRate"].includes(slipsSortConfig.key)
      ) {
        const aNum = parseFloat(aValue) || 0;
        const bNum = parseFloat(bValue) || 0;
        if (slipsSortConfig.direction === "asc") {
          return aNum - bNum;
        }
        return bNum - aNum;
      }

      // Handle betId sorting by extracting the numeric part from the end
      if (slipsSortConfig.key === "betId") {
        const extractNumericPart = (betId) => {
          // Extract the last part after " - " (e.g., "026" from "2025/07/29 - 026")
          const match = betId.toString().match(/- (\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        };

        const aNum = extractNumericPart(aValue);
        const bNum = extractNumericPart(bValue);

        if (slipsSortConfig.direction === "asc") {
          return aNum - bNum;
        }
        return bNum - aNum;
      }

      // Handle status sorting
      if (slipsSortConfig.key === "status") {
        const statusOrder = { Complete: 1, Pending: 2 };
        const aOrder = statusOrder[aValue] || 3;
        const bOrder = statusOrder[bValue] || 3;

        if (slipsSortConfig.direction === "asc") {
          return aOrder - bOrder;
        }
        return bOrder - aOrder;
      }

      // Default string sorting for other fields
      if (slipsSortConfig.direction === "asc") {
        return aValue.toString().localeCompare(bValue.toString());
      }
      return bValue.toString().localeCompare(aValue.toString());
    });
  };

  const getSortedTeamNotesData = () => {
    if (!teamNotesSortConfig.key) return teamNotes;

    return [...teamNotes].sort((a, b) => {
      const aValue = a[teamNotesSortConfig.key];
      const bValue = b[teamNotesSortConfig.key];

      // Handle date sorting
      if (teamNotesSortConfig.key === "date_added") {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        if (teamNotesSortConfig.direction === "asc") {
          return aDate - bDate;
        }
        return bDate - aDate;
      }

      // Default string sorting
      if (teamNotesSortConfig.direction === "asc") {
        return aValue.toString().localeCompare(bValue.toString());
      }
      return bValue.toString().localeCompare(aValue.toString());
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

    const deduplicatedBets = getDeduplicatedBetsForAnalysis();
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

      console.log("Algeria average odds calculation:", algeriaAvgOdds);
      console.log("Algeria odds1 > 0:", algeriaOdds1 > 0);
      console.log("Algeria odds2 > 0:", algeriaOdds2 > 0);
      console.log("Algeria max odds:", Math.max(algeriaOdds1, algeriaOdds2));
    }

    deduplicatedBets.forEach((bet, index) => {
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
    const deduplicatedBets = getDeduplicatedBetsForAnalysis();
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

  const toggleAnalyticsTeamExpansion = (team) => {
    const newExpanded = new Set(expandedAnalyticsTeams);
    if (newExpanded.has(team)) {
      newExpanded.delete(team);
    } else {
      newExpanded.add(team);
    }
    setExpandedAnalyticsTeams(newExpanded);
  };

  const handleAnalyticsSort = (key) => {
    setAnalyticsSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
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

  // Get deduplicated bets for team performance analytics
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

  // Get deduplicated filtered bets for stats cards
  const getDeduplicatedFilteredBets = () => {
    const deduplicatedBets = getDeduplicatedBetsForAnalysis();

    // Apply the same filters as the main filteredBets
    let filtered = [...deduplicatedBets];

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
      const teamStats = getTeamAnalytics();
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
    const deduplicatedBets = getDeduplicatedBetsForAnalysis();
    const values = deduplicatedBets.map((bet) => bet[field]).filter(Boolean);

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

  // Confidence Scoring Functions
  const calculateTeamConfidence = (teamName, country, league) => {
    // Only look for exact match (country + league) - no fallback to other competitions
    const teamBets = bets.filter(
      (bet) =>
        bet.TEAM_INCLUDED === teamName &&
        bet.COUNTRY === country &&
        bet.LEAGUE === league &&
        bet.RESULT !== "" &&
        bet.RESULT !== "pending"
    );

    if (teamBets.length === 0) return 0;

    const wins = teamBets.filter((bet) => bet.RESULT === "win").length;
    const winRate = (wins / teamBets.length) * 100;

    // Recent form (last 5 bets)
    const recentBets = teamBets.slice(-5);
    const recentWins = recentBets.filter((bet) => bet.RESULT === "win").length;
    const recentForm =
      recentBets.length > 0 ? (recentWins / recentBets.length) * 100 : 0;

    // Calculate confidence based on win rate, recent form, and sample size
    let confidence = 0;

    // Base confidence from win rate (40% weight)
    if (winRate >= 80) confidence += 4;
    else if (winRate >= 70) confidence += 3.5;
    else if (winRate >= 60) confidence += 3;
    else if (winRate >= 50) confidence += 2.5;
    else if (winRate >= 40) confidence += 2;
    else confidence += 1;

    // Recent form bonus (20% weight)
    if (recentForm >= 80) confidence += 2;
    else if (recentForm >= 70) confidence += 1.5;
    else if (recentForm >= 60) confidence += 1;
    else if (recentForm >= 50) confidence += 0.5;

    // Sample size bonus (40% weight)
    if (teamBets.length >= 10) confidence += 4;
    else if (teamBets.length >= 7) confidence += 3.5;
    else if (teamBets.length >= 5) confidence += 3;
    else if (teamBets.length >= 3) confidence += 2.5;
    else if (teamBets.length >= 2) confidence += 2;
    else confidence += 1;

    return Math.min(10, Math.max(1, confidence));
  };

  const calculateLeagueConfidence = (country, league) => {
    const leagueBets = bets.filter(
      (bet) =>
        bet.COUNTRY === country &&
        bet.LEAGUE === league &&
        bet.RESULT !== "" &&
        bet.RESULT !== "pending"
    );

    if (leagueBets.length === 0) return 0;

    const wins = leagueBets.filter((bet) => bet.RESULT === "win").length;
    const winRate = (wins / leagueBets.length) * 100;

    // Calculate confidence based on win rate and sample size
    let confidence = 0;

    if (winRate >= 75) confidence += 7;
    else if (winRate >= 65) confidence += 6;
    else if (winRate >= 55) confidence += 5;
    else if (winRate >= 45) confidence += 4;
    else if (winRate >= 35) confidence += 3;
    else confidence += 2;

    // Sample size bonus
    if (leagueBets.length >= 15) confidence += 3;
    else if (leagueBets.length >= 10) confidence += 2.5;
    else if (leagueBets.length >= 5) confidence += 2;
    else if (leagueBets.length >= 3) confidence += 1.5;
    else confidence += 1;

    return Math.min(10, Math.max(1, confidence));
  };

  const calculateOddsConfidence = (odds, betType, teamIncluded) => {
    // Filter bets with similar odds and bet type
    const similarBets = bets.filter(
      (bet) =>
        bet.BET_TYPE === betType &&
        bet.RESULT !== "" &&
        bet.RESULT !== "pending" &&
        (Math.abs(bet.ODDS1 - odds) <= 0.5 || Math.abs(bet.ODDS2 - odds) <= 0.5)
    );

    if (similarBets.length === 0) return 5; // Neutral if no data

    const wins = similarBets.filter((bet) => bet.RESULT === "win").length;
    const winRate = (wins / similarBets.length) * 100;

    // Calculate confidence based on win rate
    if (winRate >= 70) return 8;
    else if (winRate >= 60) return 7;
    else if (winRate >= 50) return 6;
    else if (winRate >= 40) return 5;
    else if (winRate >= 30) return 4;
    else return 3;
  };

  const calculateMatchupConfidence = (homeTeam, awayTeam, country, league) => {
    const matchups = bets.filter(
      (bet) =>
        ((bet.HOME_TEAM === homeTeam && bet.AWAY_TEAM === awayTeam) ||
          (bet.HOME_TEAM === awayTeam && bet.AWAY_TEAM === homeTeam)) &&
        bet.COUNTRY === country &&
        bet.LEAGUE === league &&
        bet.RESULT !== "" &&
        bet.RESULT !== "pending"
    );

    if (matchups.length === 0) return 5; // Neutral if no previous matchups

    const wins = matchups.filter((bet) => bet.RESULT === "win").length;
    const winRate = (wins / matchups.length) * 100;

    // Calculate confidence based on win rate and sample size
    let confidence = 5; // Start neutral

    if (winRate >= 80) confidence += 3;
    else if (winRate >= 70) confidence += 2;
    else if (winRate >= 60) confidence += 1;
    else if (winRate >= 50) confidence += 0;
    else if (winRate >= 40) confidence -= 1;
    else if (winRate >= 30) confidence -= 2;
    else confidence -= 3;

    // Sample size adjustment
    if (matchups.length >= 5) confidence += 1;
    else if (matchups.length >= 3) confidence += 0.5;

    return Math.min(10, Math.max(1, confidence));
  };

  const calculatePositionConfidence = (
    homePosition,
    awayPosition,
    teamIncluded,
    homeTeam,
    awayTeam
  ) => {
    // If either position is "Cup" or missing, exclude from calculation
    if (
      !homePosition ||
      !awayPosition ||
      homePosition === "Cup" ||
      awayPosition === "Cup"
    ) {
      return 5; // Neutral score for cup games or missing data
    }

    // Define position hierarchy
    const positionValues = { Top: 3, Mid: 2, Bottom: 1 };

    const homeValue = positionValues[homePosition] || 2;
    const awayValue = positionValues[awayPosition] || 2;

    // Determine which team you're betting on
    const isBettingOnHomeTeam =
      teamIncluded &&
      homeTeam &&
      teamIncluded.toLowerCase().includes(homeTeam.toLowerCase());
    const isBettingOnAwayTeam =
      teamIncluded &&
      awayTeam &&
      teamIncluded.toLowerCase().includes(awayTeam.toLowerCase());

    // Calculate advantage from the perspective of the team you're betting on
    let advantage;
    if (isBettingOnHomeTeam) {
      // You're betting on home team, so advantage = homeValue - awayValue
      advantage = homeValue - awayValue;
    } else if (isBettingOnAwayTeam) {
      // You're betting on away team, so advantage = awayValue - homeValue
      advantage = awayValue - homeValue;
    } else {
      // Fallback: use home team perspective
      advantage = homeValue - awayValue;
    }

    // Convert advantage to confidence score (0-10)
    if (advantage >= 2) return 9; // Strong advantage
    if (advantage === 1) return 7; // Moderate advantage
    if (advantage === 0) return 5; // Even matchups
    if (advantage === -1) return 3; // Moderate disadvantage
    if (advantage <= -2) return 1; // Strong disadvantage

    return 5; // Default neutral score
  };

  const calculateHomeAwayConfidence = (
    teamName,
    country,
    league,
    isHomeGame
  ) => {
    // Only look for exact match (country + league) - no fallback to other competitions
    const teamBets = bets.filter(
      (bet) =>
        bet.TEAM_INCLUDED === teamName &&
        bet.COUNTRY === country &&
        bet.LEAGUE === league &&
        bet.RESULT !== "" &&
        bet.RESULT !== "pending"
    );

    if (teamBets.length === 0) return 5; // Neutral if no data

    // Filter for home or away games based on the team being bet on
    const homeAwayBets = teamBets.filter((bet) => {
      const isBettingOnHomeTeam =
        bet.TEAM_INCLUDED &&
        bet.HOME_TEAM &&
        bet.TEAM_INCLUDED.toLowerCase().includes(bet.HOME_TEAM.toLowerCase());

      return isHomeGame ? isBettingOnHomeTeam : !isBettingOnHomeTeam;
    });

    if (homeAwayBets.length === 0) return 5; // Neutral if no home/away data

    const wins = homeAwayBets.filter((bet) => bet.RESULT === "win").length;
    const winRate = (wins / homeAwayBets.length) * 100;

    // Calculate confidence based on win rate and sample size
    let confidence = 5; // Start neutral

    // Win rate factor (70% weight)
    if (winRate >= 80) confidence += 3.5;
    else if (winRate >= 70) confidence += 2.5;
    else if (winRate >= 60) confidence += 1.5;
    else if (winRate >= 50) confidence += 0.5;
    else if (winRate >= 40) confidence -= 0.5;
    else if (winRate >= 30) confidence -= 1.5;
    else confidence -= 2.5;

    // Sample size factor (30% weight)
    if (homeAwayBets.length >= 8) confidence += 1.5;
    else if (homeAwayBets.length >= 5) confidence += 1;
    else if (homeAwayBets.length >= 3) confidence += 0.5;

    return Math.min(10, Math.max(1, confidence));
  };

  const calculateConfidenceScore = (bet) => {
    const teamConfidence = calculateTeamConfidence(
      bet.team_included,
      bet.country,
      bet.league
    );
    const leagueConfidence = calculateLeagueConfidence(bet.country, bet.league);
    const oddsConfidence = calculateOddsConfidence(
      bet.odds1,
      bet.bet_type,
      bet.team_included
    );
    const matchupConfidence = calculateMatchupConfidence(
      bet.home_team,
      bet.away_team,
      bet.country,
      bet.league
    );
    const positionConfidence = calculatePositionConfidence(
      bet.home_team_position,
      bet.away_team_position,
      bet.team_included,
      bet.home_team,
      bet.away_team
    );

    // Determine if this is a home or away game for the team being bet on
    const isBettingOnHomeTeam =
      bet.team_included &&
      bet.home_team &&
      bet.team_included.toLowerCase().includes(bet.home_team.toLowerCase());
    const isHomeGame = isBettingOnHomeTeam;

    const homeAwayConfidence = calculateHomeAwayConfidence(
      bet.team_included,
      bet.country,
      bet.league,
      isHomeGame
    );

    // Weighted average: Team (30%), League (15%), Odds (15%), Matchup (15%), Position (10%), Home/Away (15%)
    const weightedScore =
      teamConfidence * 0.3 +
      leagueConfidence * 0.15 +
      oddsConfidence * 0.15 +
      matchupConfidence * 0.15 +
      positionConfidence * 0.1 +
      homeAwayConfidence * 0.15;

    return Math.round(weightedScore * 10) / 10; // Round to 1 decimal place
  };

  const getConfidenceBreakdown = (bet) => {
    const teamConfidence = calculateTeamConfidence(
      bet.team_included,
      bet.country,
      bet.league
    );
    const leagueConfidence = calculateLeagueConfidence(bet.country, bet.league);
    const oddsConfidence = calculateOddsConfidence(
      bet.odds1,
      bet.bet_type,
      bet.team_included
    );
    const matchupConfidence = calculateMatchupConfidence(
      bet.home_team,
      bet.away_team,
      bet.country,
      bet.league
    );
    const positionConfidence = calculatePositionConfidence(
      bet.home_team_position,
      bet.away_team_position,
      bet.team_included,
      bet.home_team,
      bet.away_team
    );

    // Determine if this is a home or away game for the team being bet on
    const isBettingOnHomeTeam =
      bet.team_included &&
      bet.home_team &&
      bet.team_included.toLowerCase().includes(bet.home_team.toLowerCase());
    const isHomeGame = isBettingOnHomeTeam;

    const homeAwayConfidence = calculateHomeAwayConfidence(
      bet.team_included,
      bet.country,
      bet.league,
      isHomeGame
    );

    return {
      team: Math.round(teamConfidence * 10) / 10,
      league: Math.round(leagueConfidence * 10) / 10,
      odds: Math.round(oddsConfidence * 10) / 10,
      matchup: Math.round(matchupConfidence * 10) / 10,
      position: Math.round(positionConfidence * 10) / 10,
      homeAway: Math.round(homeAwayConfidence * 10) / 10,
    };
  };

  const getConfidenceLabel = (score) => {
    if (score >= 8)
      return {
        label: "Very High Confidence",
        color: "bg-green-100 text-green-800",
        emoji: "🟢",
      };
    if (score >= 6)
      return {
        label: "High Confidence",
        color: "bg-yellow-100 text-yellow-800",
        emoji: "🟡",
      };
    if (score >= 4)
      return {
        label: "Moderate Confidence",
        color: "bg-orange-100 text-orange-800",
        emoji: "🟠",
      };
    return {
      label: "Low Confidence",
      color: "bg-red-100 text-red-800",
      emoji: "🔴",
    };
  };

  const getTeamAnalytics = () => {
    const teams = {};
    const deduplicatedBets = getDeduplicatedBetsForAnalysis();
    deduplicatedBets.forEach((bet) => {
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

      // Skip pending bets for analytics
      const result = bet.RESULT?.toLowerCase() || "";
      if (result.includes("pending")) return;

      if (!teams[teamName]) {
        teams[teamName] = {
          wins: 0,
          losses: 0,
          pending: 0,
          betTypes: {},
        };
      }

      // Track overall stats (excluding pending)
      if (result.includes("win")) teams[teamName].wins++;
      else if (result.includes("loss")) teams[teamName].losses++;

      // Track bet type stats (excluding pending)
      const betType = bet.BET_TYPE || "Unknown";
      if (!teams[teamName].betTypes[betType]) {
        teams[teamName].betTypes[betType] = { wins: 0, losses: 0, total: 0 };
      }

      teams[teamName].betTypes[betType].total++;
      if (result.includes("win")) teams[teamName].betTypes[betType].wins++;
      else if (result.includes("loss"))
        teams[teamName].betTypes[betType].losses++;
    });

    return Object.entries(teams)
      .map(([team, stats]) => {
        // Calculate bet type breakdown
        const betTypeBreakdown = Object.entries(stats.betTypes)
          .map(([betType, betStats]) => {
            const totalWithResult = betStats.wins + betStats.losses;
            return {
              betType,
              wins: betStats.wins,
              losses: betStats.losses,
              total: betStats.total,
              totalWithResult: totalWithResult,
              winRate:
                totalWithResult > 0
                  ? ((betStats.wins / totalWithResult) * 100).toFixed(1)
                  : 0,
            };
          })
          .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

        return {
          team,
          ...stats,
          total: stats.wins + stats.losses, // Only completed bets
          winRate:
            stats.wins + stats.losses > 0
              ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
              : 0,
          betTypeBreakdown,
        };
      })
      .sort((a, b) => {
        // Sort by wins first (descending)
        if (a.wins !== b.wins) {
          return b.wins - a.wins;
        }
        // If wins are equal, sort by win rate (descending)
        return parseFloat(b.winRate) - parseFloat(a.winRate);
      });
  };

  const getSortedAnalyticsData = () => {
    const analytics = getTeamAnalytics();

    return analytics.sort((a, b) => {
      const { key, direction } = analyticsSortConfig;
      const multiplier = direction === "asc" ? 1 : -1;

      switch (key) {
        case "team":
          return multiplier * a.team.localeCompare(b.team);
        case "total":
          return multiplier * (a.total - b.total);
        case "wins":
          return multiplier * (a.wins - b.wins);
        case "losses":
          return multiplier * (a.losses - b.losses);
        case "winRate":
          const winRateComparison =
            multiplier * (parseFloat(a.winRate) - parseFloat(b.winRate));
          // If win rates are equal, sort by wins (descending)
          if (winRateComparison === 0) {
            return b.wins - a.wins;
          }
          return winRateComparison;
        default:
          return 0;
      }
    });
  };

  const getLeagueAnalytics = () => {
    const leagues = {};
    const deduplicatedBets = getDeduplicatedBetsForAnalysis();
    deduplicatedBets.forEach((bet) => {
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
    const deduplicatedBets = getDeduplicatedBetsForAnalysis();
    deduplicatedBets.forEach((bet) => {
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

    // Find worst league - prioritize leagues with poor performance and enough bets
    const worstLeague =
      leagueAnalytics
        .filter((league) => league.total >= 3) // Minimum 3 bets for "worst" consideration
        .sort((a, b) => {
          // Sort by win rate (ascending - lowest first)
          const winRateDiff = parseFloat(a.winRate) - parseFloat(b.winRate);
          if (Math.abs(winRateDiff) > 5) return winRateDiff;

          // If win rates are close, prefer leagues with more bets (more significant)
          return b.total - a.total;
        })[0] ||
      leagueAnalytics[leagueAnalytics.length - 1] ||
      {};

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

      // Deduplicate new bets to avoid counting multiple tickets for the same game
      const deduplicatedNewBets = getDeduplicatedNewBets(fetchedNewBets);
      console.log(
        `Original new bets: ${fetchedNewBets.length}, Deduplicated: ${deduplicatedNewBets.length}`
      );

      // Analyze each deduplicated new bet
      const results = deduplicatedNewBets.map((newBet) => {
        const teamName = newBet.team_included;
        const country = newBet.country;
        const league = newBet.league;

        // Check if team is blacklisted (any country/league)
        const isBlacklisted = blacklistedTeams.some(
          (blacklistedTeam) =>
            blacklistedTeam.team_name.toLowerCase() === teamName.toLowerCase()
        );

        // Get historical performance for this team (EXACT country + league match only)
        // Use deduplicated bets to avoid counting multiple tickets for the same game
        const deduplicatedBets = getDeduplicatedBetsForAnalysis();
        const teamHistory = deduplicatedBets.filter((bet) => {
          const betTeamIncluded = bet.TEAM_INCLUDED?.toLowerCase() || "";
          const betCountry = bet.COUNTRY?.toLowerCase() || "";
          const betLeague = bet.LEAGUE?.toLowerCase() || "";

          // Match by exact team name, country, and league
          return (
            betTeamIncluded === teamName.toLowerCase() &&
            betCountry === country.toLowerCase() &&
            betLeague === league.toLowerCase()
          );
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

        // Create detailed history strings with competition context
        // Deduplicate win/loss details to avoid showing multiple tickets for the same bet type
        const uniqueWinDetails = new Set();
        wins.forEach((bet) => {
          const betType = bet.BET_TYPE || "Unknown";
          const betSelection = bet.BET_SELECTION || "Unknown";
          const competition = `${bet.COUNTRY} ${bet.LEAGUE}`;
          const detail = `${betType}: ${betSelection} (${competition})`;
          uniqueWinDetails.add(detail);
        });

        const uniqueLossDetails = new Set();
        losses.forEach((bet) => {
          const betType = bet.BET_TYPE || "Unknown";
          const betSelection = bet.BET_SELECTION || "Unknown";
          const competition = `${bet.COUNTRY} ${bet.LEAGUE}`;
          const detail = `${betType}: ${betSelection} (${competition})`;
          uniqueLossDetails.add(detail);
        });

        const winDetails = Array.from(uniqueWinDetails);
        const lossDetails = Array.from(uniqueLossDetails);

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

        // Calculate confidence score
        const confidenceScore = calculateConfidenceScore({
          team_included: teamName,
          country: country,
          league: league,
          odds1: newBet.odds1,
          bet_type: newBet.bet_type,
          home_team: newBet.home_team,
          away_team: newBet.away_team,
          home_team_position: newBet.home_team_position,
          away_team_position: newBet.away_team_position,
        });

        const confidenceBreakdown = getConfidenceBreakdown({
          team_included: teamName,
          country: country,
          league: league,
          odds1: newBet.odds1,
          bet_type: newBet.bet_type,
          home_team: newBet.home_team,
          away_team: newBet.away_team,
          home_team_position: newBet.home_team_position,
          away_team_position: newBet.away_team_position,
        });

        const confidenceLabel = getConfidenceLabel(confidenceScore);

        // Determine recommendation based on confidence score
        let recommendation = "BET";
        let recommendationColor = "text-green-400";

        if (isBlacklisted) {
          recommendation = "AVOID (Blacklisted)";
          recommendationColor = "text-red-400";
        } else if (confidenceScore >= 8) {
          recommendation = "HIGH CONFIDENCE BET";
          recommendationColor = "text-green-400";
        } else if (confidenceScore >= 6) {
          recommendation = "GOOD CONFIDENCE BET";
          recommendationColor = "text-green-400";
        } else if (confidenceScore >= 4) {
          recommendation = "MODERATE CONFIDENCE - CAUTION";
          recommendationColor = "text-yellow-400";
        } else if (confidenceScore <= 3) {
          recommendation = "LOW CONFIDENCE - AVOID";
          recommendationColor = "text-red-400";
        }

        // Debug logging
        console.log(
          `Bet: ${teamName} - Confidence: ${confidenceScore} - Recommendation: ${recommendation}`
        );

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
          confidenceScore,
          confidenceBreakdown,
          confidenceLabel,
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
    // Use deduplicated bets to avoid counting multiple tickets for the same game
    const deduplicatedBets = getDeduplicatedBetsForAnalysis();
    const matchups = deduplicatedBets.filter((bet) => {
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
    // Use deduplicated bets to avoid counting multiple tickets for the same game
    const deduplicatedBets = getDeduplicatedBetsForAnalysis();
    deduplicatedBets.forEach((bet) => {
      const country = bet.COUNTRY?.toLowerCase() || "";
      const league = bet.LEAGUE?.toLowerCase() || "";
      const homeTeam = bet.HOME_TEAM?.toLowerCase() || "";
      const awayTeam = bet.AWAY_TEAM?.toLowerCase() || "";
      const result = bet.RESULT?.toLowerCase() || "";

      if (!homeTeam || !awayTeam) return;

      // Only include bets with actual results (Win or Loss)
      const hasResult = result.includes("win") || result.includes("loss");
      if (!hasResult) return;

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
      if (result.includes("win")) {
        matchup.wins++;
      } else if (result.includes("loss")) {
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

  const getTopTeams = () => {
    const teamStats = new Map();

    // Process deduplicated bets to calculate team statistics
    const deduplicatedBets = getDeduplicatedBetsForAnalysis();
    deduplicatedBets.forEach((bet) => {
      const teamIncluded = bet.TEAM_INCLUDED;
      const country = bet.COUNTRY;
      const league = bet.LEAGUE;

      if (!teamIncluded || !country || !league) return;

      // Exclude teams named "Over 1.5" and "Over 0.5"
      if (teamIncluded === "Over 1.5" || teamIncluded === "Over 0.5") {
        return;
      }

      // Create unique key for team + country + league combination
      const teamKey = `${teamIncluded.toLowerCase()}_${country.toLowerCase()}_${league.toLowerCase()}`;

      if (!teamStats.has(teamKey)) {
        teamStats.set(teamKey, {
          teamName: teamIncluded,
          country: country,
          league: league,
          totalBets: 0,
          wins: 0,
          losses: 0,
          recentWins: 0,
          recentBets: 0,
          winRate: 0,
          recentWinRate: 0,
          lastBetDate: null,
        });
      }

      const team = teamStats.get(teamKey);
      team.totalBets++;

      // Track recent performance (last 10 bets)
      const betDate = new Date(bet.DATE);
      if (!team.lastBetDate || betDate > team.lastBetDate) {
        team.lastBetDate = betDate;
      }

      if (bet.RESULT?.toLowerCase().includes("win")) {
        team.wins++;
        team.recentWins++;
      } else if (bet.RESULT?.toLowerCase().includes("loss")) {
        team.losses++;
      }

      team.recentBets++;
      if (team.recentBets > 10) {
        // Keep only last 10 bets for recent performance
        team.recentBets = 10;
        team.recentWins = Math.min(team.recentWins, 10);
      }

      // Calculate win rates
      const totalBetsWithResult = team.wins + team.losses;
      team.winRate =
        totalBetsWithResult > 0 ? (team.wins / totalBetsWithResult) * 100 : 0;
      team.recentWinRate =
        team.recentBets > 0 ? (team.recentWins / team.recentBets) * 100 : 0;
    });

    // Convert to array and calculate composite score
    const teamsArray = Array.from(teamStats.values() || [])
      .filter((team) => team && team.totalBets >= 2) // Only teams with at least 2 bets
      .map((team) => {
        // Calculate composite score (win rate 50%, total wins 30%, recent performance 20%)
        const winRateScore = (team.winRate || 0) * 0.5;
        const totalWinsScore = Math.min((team.wins || 0) * 2, 100) * 0.3; // Cap at 50 wins
        const recentPerformanceScore = (team.recentWinRate || 0) * 0.2;

        const compositeScore =
          winRateScore + totalWinsScore + recentPerformanceScore;

        return {
          ...team,
          compositeScore,
        };
      })
      .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
      .slice(0, 40); // Top 40 teams

    return teamsArray || [];
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
        bestPerformingSlip: null,
      };
    }

    const totalBets = slips.reduce((sum, slip) => sum + slip.totalBets, 0);
    const totalWins = slips.reduce((sum, slip) => sum + slip.wins, 0);
    const totalLosses = slips.reduce((sum, slip) => sum + slip.losses, 0);
    const totalWithResult = totalWins + totalLosses;

    const bestSlip = slips.reduce((best, slip) =>
      slip.winRate > best.winRate ? slip : best
    );

    return {
      totalSlips: slips.length,
      overallSuccessRate:
        totalWithResult > 0 ? (totalWins / totalWithResult) * 100 : 0,
      averageBetsPerSlip: totalBets / slips.length,
      bestPerformingSlip: bestSlip,
    };
  };

  const getTeamNotesForTeam = (teamName, country, league) => {
    return teamNotes.filter(
      (note) =>
        note.team_name === teamName &&
        note.country === country &&
        note.league === league
    );
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
    const uniqueBets = new Map();

    newBets.forEach((bet) => {
      // Create a unique key based on the game details (excluding BET_ID)
      const key = `${bet.date}_${bet.home_team}_${bet.away_team}_${bet.country}_${bet.league}_${bet.bet_type}_${bet.bet_selection}_${bet.team_included}`;

      if (!uniqueBets.has(key)) {
        uniqueBets.set(key, bet);
      }
    });

    return Array.from(uniqueBets.values());
  };

  const getDeduplicatedBetsForAnalysis = () => {
    const uniqueBets = new Map();

    bets.forEach((bet) => {
      // Create a unique key for analysis: DATE + HOME_TEAM + AWAY_TEAM + LEAGUE + BET_TYPE + TEAM_INCLUDED (excluding BET_ID)
      const uniqueKey = `${bet.DATE}_${bet.HOME_TEAM}_${bet.AWAY_TEAM}_${bet.LEAGUE}_${bet.BET_TYPE}_${bet.TEAM_INCLUDED}`;

      // Only add if this unique combination doesn't exist yet
      if (!uniqueBets.has(uniqueKey)) {
        uniqueBets.set(uniqueKey, bet);
      }
    });

    const result = Array.from(uniqueBets.values());
    console.log(
      `Analysis Deduplication: ${bets.length} original bets -> ${result.length} unique bets`
    );
    return result;
  };

  const getBetTypeAnalyticsForTeam = (teamName, country, league) => {
    const deduplicatedBets = getDeduplicatedBetsForAnalysis();

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
    const deduplicatedBets = getDeduplicatedBetsForAnalysis();
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
        ? getTeamAnalytics().find((t) => t.team === matchedHomeTeam)
        : null;
      const awayTeamAnalytics = awayTeamInHistory
        ? getTeamAnalytics().find((t) => t.team === matchedAwayTeam)
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
    const deduplicatedBets = getDeduplicatedBetsForAnalysis();

    // Group bets by team
    const teamGroups = {};

    deduplicatedBets.forEach((bet) => {
      const teamIncluded = bet.TEAM_INCLUDED;
      const betType = bet.BET_TYPE || "Unknown";
      const result = bet.RESULT?.toLowerCase() || "";
      const isWin = result.includes("win");
      const isLoss = result.includes("loss");
      const odds = parseFloat(bet.ODDS1) || 0;
      const league = `${bet.COUNTRY} ${bet.LEAGUE}`;

      if (!teamIncluded) return; // Skip bets without team_included

      if (!teamGroups[teamIncluded]) {
        teamGroups[teamIncluded] = {
          team: teamIncluded,
          total: 0,
          wins: 0,
          losses: 0,
          totalOdds: 0,
          betTypes: {},
          leagues: {},
          recentBets: [],
        };
      }

      const group = teamGroups[teamIncluded];
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

    // Sort by win rate descending
    return analytics.sort(
      (a, b) => parseFloat(b.winRate) - parseFloat(a.winRate)
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
      <div className="w-full px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            <span className="text-2xl md:text-[44px]">⚽️</span> BET TRACKER
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-2xl font-bold text-white">
              {getDeduplicatedFilteredBets().length}
            </div>
            <div className="text-gray-300">Filtered Bets</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-2xl font-bold text-green-400">
              {
                getDeduplicatedFilteredBets().filter((bet) =>
                  bet.RESULT?.toLowerCase().includes("win")
                ).length
              }
            </div>
            <div className="text-gray-300">Wins</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-2xl font-bold text-red-400">
              {
                getDeduplicatedFilteredBets().filter((bet) =>
                  bet.RESULT?.toLowerCase().includes("loss")
                ).length
              }
            </div>
            <div className="text-gray-300">Losses</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-2xl font-bold text-yellow-400">
              {
                getDeduplicatedFilteredBets().filter((bet) =>
                  bet.RESULT?.toLowerCase().includes("pending")
                ).length
              }
            </div>
            <div className="text-gray-300">Pending</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-2xl font-bold text-blue-400">
              {calculateWinPercentage(getDeduplicatedFilteredBets())}%
            </div>
            <div className="text-gray-300">Win Rate</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 mb-8">
          <div
            className={`flex items-center justify-between ${
              showFilters ? "mb-4" : ""
            }`}
          >
            <h2 className="text-xl font-bold text-white">
              Filters & Analytics
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-[#3982db] hover:bg-[#2d6bb8] text-white px-4 py-2 rounded-lg transition-colors"
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
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
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
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
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
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
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
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
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
                  League
                </label>
                <select
                  value={filters.league}
                  onChange={(e) =>
                    setFilters({ ...filters, league: e.target.value })
                  }
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
                >
                  <option value="">All Leagues</option>
                  {getUniqueValues("LEAGUE").map((league) => (
                    <option key={league} value={league}>
                      {league}
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
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
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
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
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
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
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

        {/* Best Performers Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {(() => {
            const performers = getBestPerformers();
            return (
              <>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-lg font-bold text-green-400 mb-2">
                    Best League
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
                    Best Country
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
                    Most Bets
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
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-lg font-bold text-red-400 mb-2">
                    Worst League
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {performers.worstLeague.leagueDisplay ||
                      performers.worstLeague.league ||
                      "N/A"}
                  </div>
                  <div className="text-gray-300">
                    {performers.worstLeague.winRate || 0}% Win Rate
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 w-full">
          <button
            onClick={() => setActiveTab("data")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "data"
                ? "bg-[#3982db] text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            Data View
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "analytics"
                ? "bg-[#3982db] text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "performance"
                ? "bg-[#3982db] text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            Performance
          </button>

          <button
            onClick={() => setActiveTab("topTeams")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "topTeams"
                ? "bg-[#3982db] text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            Top Teams
          </button>
          <button
            onClick={() => setActiveTab("betSlips")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "betSlips"
                ? "bg-[#3982db] text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            Bet Slips
          </button>
          <button
            onClick={() => setActiveTab("teamNotes")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "teamNotes"
                ? "bg-[#3982db] text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            Team Notes
          </button>
          <button
            onClick={() => setActiveTab("betTypeAnalytics")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "betTypeAnalytics"
                ? "bg-[#3982db] text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            Team Analytics
          </button>
          <button
            onClick={() => setActiveTab("dailyGames")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "dailyGames"
                ? "bg-[#3982db] text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            Daily Games
          </button>
          <button
            onClick={() => setActiveTab("blacklist")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "blacklist"
                ? "bg-[#3982db] text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            Blacklist
          </button>

          <button
            onClick={() => setActiveTab("betAnalysis")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "betAnalysis"
                ? "bg-[#3982db] text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            Bet Analysis
          </button>
          <button
            onClick={() => setActiveTab("headToHead")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "headToHead"
                ? "bg-[#3982db] text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            Head to Head
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "data" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden max-w-full">
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-white/20">
                  <tr>
                    {getDeduplicatedFilteredBets()[0] &&
                      Object.keys(getDeduplicatedFilteredBets()[0]).map(
                        (key) => (
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
                        )
                      )}
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
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleAnalyticsSort("team")}
                    >
                      <div className="flex items-center justify-between">
                        <span>Team</span>
                        {analyticsSortConfig.key === "team" && (
                          <span className="ml-2">
                            {analyticsSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleAnalyticsSort("total")}
                    >
                      <div className="flex items-center justify-between">
                        <span>Total Bets</span>
                        {analyticsSortConfig.key === "total" && (
                          <span className="ml-2">
                            {analyticsSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleAnalyticsSort("wins")}
                    >
                      <div className="flex items-center justify-between">
                        <span>Wins</span>
                        {analyticsSortConfig.key === "wins" && (
                          <span className="ml-2">
                            {analyticsSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleAnalyticsSort("losses")}
                    >
                      <div className="flex items-center justify-between">
                        <span>Losses</span>
                        {analyticsSortConfig.key === "losses" && (
                          <span className="ml-2">
                            {analyticsSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleAnalyticsSort("winRate")}
                    >
                      <div className="flex items-center justify-between">
                        <span>Win Rate</span>
                        {analyticsSortConfig.key === "winRate" && (
                          <span className="ml-2">
                            {analyticsSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {getSortedAnalyticsData().map((team, index) => (
                    <React.Fragment key={index}>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2 text-gray-200">{team.team}</td>
                        <td className="px-4 py-2 text-gray-200">
                          {team.total}
                        </td>
                        <td className="px-4 py-2 text-green-400">
                          {team.wins}
                        </td>
                        <td className="px-4 py-2 text-red-400">
                          {team.losses}
                        </td>
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
                        <td className="px-4 py-2">
                          <button
                            onClick={() =>
                              toggleAnalyticsTeamExpansion(team.team)
                            }
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            {expandedAnalyticsTeams.has(team.team) ? "▼" : "▶"}
                          </button>
                        </td>
                      </tr>
                      {expandedAnalyticsTeams.has(team.team) &&
                        team.betTypeBreakdown.length > 0 && (
                          <tr>
                            <td colSpan="6" className="px-4 py-2 bg-white/5">
                              <div className="ml-4">
                                <h4 className="text-white font-medium mb-2">
                                  Bet Type Breakdown:
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {team.betTypeBreakdown.map((betType, idx) => (
                                    <div
                                      key={idx}
                                      className="text-sm bg-white/10 rounded p-2"
                                    >
                                      <div className="font-medium text-gray-200">
                                        {betType.betType}
                                      </div>
                                      <div className="text-green-400">
                                        {betType.wins}W
                                      </div>
                                      <div className="text-red-400">
                                        {betType.losses}L
                                      </div>
                                      <div className="text-gray-300">
                                        {betType.winRate}% (
                                        {betType.totalWithResult} completed,{" "}
                                        {betType.total} total)
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="space-y-6">
            {/* League Performance Table */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                League Performance Analytics
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
              Blacklisted Teams
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
              Odds Range Performance Analytics
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
            <h3 className="text-lg font-bold text-white mb-4">Bet Analysis</h3>
            <div className="text-gray-300 mb-6">
              <p>
                Confidence Score (0-10):
                <br />
                🏆 Team Performance: Historical win rate and betting experience
                <br />
                🏛️ League Experience: Your success rate in this league/country
                <br />
                💰 Odds Value: Risk assessment based on betting odds
                <br />
                ⚔️ Head-to-Head: Previous results when these teams met
                <br />
                📊 League Position: Team strength based on league position
                (Top/Mid/Bottom)
                <br />
                🏠 Home/Away: Team performance in home vs away games
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
                {isAnalyzing ? "🔄 Analyzing..." : "Fetch & Analyze New Bets"}
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
                        <th className="px-4 py-2 text-left text-white font-semibold w-20">
                          Date
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
                          🎯 Confidence
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {analysisResults.map((result, index) => (
                        <tr
                          key={index}
                          className={`${
                            index % 2 === 0 ? "bg-white/5" : "bg-white/10"
                          }`}
                        >
                          <td className="px-4 py-6 text-gray-300">
                            {formatDate(result.date)}
                          </td>
                          <td className="px-4 py-6 text-gray-300">
                            <div className="text-sm">
                              <div>
                                {result.home_team} vs {result.away_team}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {result.country} • {result.league}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-6 text-gray-300">
                            <div className="text-sm">
                              {(() => {
                                const homeBadge = getPositionBadge(
                                  result.home_team_position
                                );
                                const awayBadge = getPositionBadge(
                                  result.away_team_position
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
                              {result.team_included}
                              {isTeamInTop40(result.team_included) && (
                                <div className="text-xs text-yellow-400 mt-1">
                                  Top 40: #
                                  {getTop40Ranking(result.team_included)}
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
                                  className={`px-2 py-1 rounded-full text-xs font-medium mb-2 ${result.confidenceLabel.color}`}
                                >
                                  {result.confidenceLabel.emoji}{" "}
                                  {result.confidenceScore}/10
                                </span>
                                <div className="text-xs text-gray-400 mt-2">
                                  {result.confidenceLabel.label}
                                </div>
                              </div>
                              <div className="text-xs text-gray-400 mt-2 mb-2">
                                <div className="mb-1">
                                  🏆 Team Performance:{" "}
                                  {result.confidenceBreakdown.team}/10
                                </div>
                                <div className="mb-1">
                                  🏛️ League Experience:{" "}
                                  {result.confidenceBreakdown.league}/10
                                </div>
                                <div className="mb-1">
                                  💰 Odds Value:{" "}
                                  {result.confidenceBreakdown.odds}/10
                                </div>
                                <div className="mb-1">
                                  ⚔️ Head-to-Head:{" "}
                                  {result.confidenceBreakdown.matchup}/10
                                </div>
                                <div className="mb-1">
                                  📊 League Position:{" "}
                                  {result.confidenceBreakdown.position}/10
                                </div>
                                <div className="mb-1">
                                  🏠 Home/Away:{" "}
                                  {result.confidenceBreakdown.homeAway}/10
                                </div>
                              </div>

                              {/* Bet Type Suggestions */}
                              {(() => {
                                const betTypeAnalytics =
                                  getBetTypeAnalyticsForTeam(
                                    result.team_included,
                                    result.country,
                                    result.league
                                  );

                                if (
                                  betTypeAnalytics &&
                                  betTypeAnalytics.length > 0
                                ) {
                                  const topBetTypes = betTypeAnalytics.slice(
                                    0,
                                    3
                                  ); // Show top 3
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
                                            {betType.winRate}% ({betType.wins}/
                                            {betType.total})
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
                                  result.home_team,
                                  result.country,
                                  result.league
                                );
                                const awayTeamNotes = getTeamNotesForTeam(
                                  result.away_team,
                                  result.country,
                                  result.league
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
                                            {result.home_team}:
                                          </span>{" "}
                                          {note.note}
                                          <span className="text-gray-400 ml-1">
                                            ({note.date_added})
                                          </span>
                                        </div>
                                      ))}
                                      {awayTeamNotes.map((note, idx) => (
                                        <div
                                          key={`away-${idx}`}
                                          className="text-xs text-orange-300 mb-1"
                                        >
                                          <span className="font-medium">
                                            {result.away_team}:
                                          </span>{" "}
                                          {note.note}
                                          <span className="text-gray-400 ml-1">
                                            ({note.date_added})
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
                          <td className="px-4 py-6 text-gray-300">
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Stats */}
                <div className="mt-6 p-4 bg-white/5 rounded-lg">
                  <h5 className="text-white font-semibold mb-3">📊 Summary</h5>

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
                        {analysisResults.filter((r) => r.isBlacklisted).length}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">High Confidence</div>
                      <div className="text-green-400 font-medium">
                        {
                          analysisResults.filter(
                            (r) =>
                              r.recommendation.includes(
                                "HIGH CONFIDENCE BET"
                              ) ||
                              r.recommendation.includes(
                                "GOOD CONFIDENCE BET"
                              ) ||
                              r.recommendation === "BET"
                          ).length
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Caution</div>
                      <div className="text-yellow-400 font-medium">
                        {
                          analysisResults.filter((r) =>
                            r.recommendation.includes("CAUTION")
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

        {activeTab === "headToHead" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Head to Head Analysis
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
                                    className={`px-2 py-1 rounded-full text-xs font-medium mt-1 inline-block ${
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
                  No Matchups Found
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

        {activeTab === "topTeams" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Top 40 Teams Ranking
            </h3>
            <div className="text-gray-300 mb-6">
              <p>
                Teams ranked by composite score: Win Rate (50%), Total Wins
                (30%), Recent Performance (20%)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/20">
                  <tr>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Rank
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Team
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Win Rate
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Total Bets
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Wins/Losses
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Recent Performance
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Countries
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Leagues
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {getTopTeams().map((team, index) => (
                    <tr key={index} className="hover:bg-white/5">
                      <td className="px-4 py-2 text-gray-300">
                        <div className="flex items-center">
                          <span
                            className={`text-lg font-bold ${
                              index === 0
                                ? "text-yellow-400"
                                : index === 1
                                ? "text-gray-300"
                                : index === 2
                                ? "text-amber-600"
                                : "text-gray-400"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        <div className="font-medium text-white">
                          {team.teamName}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            team.winRate >= 70
                              ? "bg-green-100 text-green-800"
                              : team.winRate >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {team.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        {team.totalBets}
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        <div className="text-sm">
                          <span className="text-green-400">{team.wins}W</span>
                          <span className="text-gray-400"> / </span>
                          <span className="text-red-400">{team.losses}L</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        <div className="text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              team.recentWinRate >= 70
                                ? "bg-green-100 text-green-800"
                                : team.recentWinRate >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {team.recentWinRate.toFixed(1)}% ({team.recentBets}{" "}
                            bets)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        <div className="text-xs">{team.country || "N/A"}</div>
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        <div className="text-xs">{team.league || "N/A"}</div>
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        <span className="font-medium text-blue-400">
                          {team.compositeScore.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "betSlips" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Bet Slips Performance
            </h3>

            {/* Summary Cards */}
            {(() => {
              const summary = getBetSlipsSummary();
              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-2xl font-bold text-white">
                      {summary.totalSlips}
                    </div>
                    <div className="text-gray-300 text-sm">Total Slips</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-2xl font-bold text-blue-400">
                      {summary.overallSuccessRate.toFixed(1)}%
                    </div>
                    <div className="text-gray-300 text-sm">
                      Overall Success Rate
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-2xl font-bold text-yellow-400">
                      {summary.averageBetsPerSlip.toFixed(1)}
                    </div>
                    <div className="text-gray-300 text-sm">
                      Avg Bets per Slip
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-2xl font-bold text-green-400">
                      {summary.bestPerformingSlip
                        ? summary.bestPerformingSlip.winRate.toFixed(1) + "%"
                        : "N/A"}
                    </div>
                    <div className="text-gray-300 text-sm">
                      Best Slip Success Rate
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Slips Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/20">
                  <tr>
                    <th className="px-4 py-2 text-left text-white font-semibold w-8"></th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                      onClick={() => handleSlipsSort("betId")}
                    >
                      <div className="flex items-center">
                        Bet Slip ID
                        {slipsSortConfig.key === "betId" && (
                          <span className="ml-1">
                            {slipsSortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                      onClick={() => handleSlipsSort("date")}
                    >
                      <div className="flex items-center">
                        Date
                        {slipsSortConfig.key === "date" && (
                          <span className="ml-1">
                            {slipsSortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                      onClick={() => handleSlipsSort("totalBets")}
                    >
                      <div className="flex items-center">
                        Bets
                        {slipsSortConfig.key === "totalBets" && (
                          <span className="ml-1">
                            {slipsSortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Wins/Losses
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                      onClick={() => handleSlipsSort("winRate")}
                    >
                      <div className="flex items-center">
                        Success Rate
                        {slipsSortConfig.key === "winRate" && (
                          <span className="ml-1">
                            {slipsSortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                      onClick={() => handleSlipsSort("status")}
                    >
                      <div className="flex items-center">
                        Status
                        {slipsSortConfig.key === "status" && (
                          <span className="ml-1">
                            {slipsSortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {getSortedSlipsData().map((slip, index) => (
                    <React.Fragment key={index}>
                      <tr
                        className="hover:bg-white/5 cursor-pointer"
                        onClick={() => toggleSlipExpansion(slip.betId)}
                      >
                        <td className="px-4 py-2 text-gray-300">
                          <div className="flex items-center justify-center">
                            <span
                              className={`transform transition-transform duration-200 ${
                                expandedSlips.has(slip.betId) ? "rotate-90" : ""
                              }`}
                            >
                              ▶
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-gray-300">
                          <div className="font-medium text-white">
                            {slip.betId}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-gray-300">
                          {formatDate(slip.date)}
                        </td>
                        <td className="px-4 py-2 text-gray-300">
                          {slip.totalBets}
                        </td>
                        <td className="px-4 py-2 text-gray-300">
                          <div className="text-sm">
                            <span className="text-green-400">{slip.wins}W</span>
                            <span className="text-gray-400"> / </span>
                            <span className="text-red-400">{slip.losses}L</span>
                            {slip.pending > 0 && (
                              <>
                                <span className="text-gray-400"> / </span>
                                <span className="text-yellow-400">
                                  {slip.pending}P
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-gray-300">
                          <span
                            className={`inline-block w-16 text-center px-2 py-1 rounded-full text-xs font-medium ${
                              slip.winRate >= 70
                                ? "bg-green-100 text-green-800"
                                : slip.winRate >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {slip.winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-300">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              slip.status === "Complete"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {slip.status}
                          </span>
                        </td>
                      </tr>
                      {expandedSlips.has(slip.betId) && (
                        <tr className="bg-white/5">
                          <td colSpan="7" className="px-4 py-3">
                            <div className="bg-white/10 rounded-lg p-4">
                              <h4 className="text-white font-semibold mb-3">
                                Individual Bets:
                              </h4>
                              <div className="grid gap-2">
                                {slip.bets.map((bet, betIndex) => (
                                  <div
                                    key={betIndex}
                                    className="flex items-center justify-between bg-white/5 rounded p-3"
                                  >
                                    <div className="flex-1">
                                      <div className="text-white font-medium">
                                        {bet.TEAM_INCLUDED}
                                      </div>
                                      <div className="text-gray-400 text-sm">
                                        {bet.COUNTRY} - {bet.LEAGUE}
                                      </div>
                                      <div className="text-gray-400 text-sm">
                                        {bet.BET_TYPE} {bet.BET_SELECTION}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div
                                        className={`inline-block w-20 text-center px-2 py-1 rounded-full text-xs font-medium ${
                                          bet.RESULT?.toLowerCase().includes(
                                            "win"
                                          )
                                            ? "bg-green-100 text-green-800"
                                            : bet.RESULT?.toLowerCase().includes(
                                                "loss"
                                              )
                                            ? "bg-red-100 text-red-800"
                                            : "bg-yellow-100 text-yellow-800"
                                        }`}
                                      >
                                        {bet.RESULT || "Pending"}
                                      </div>
                                      <div className="text-gray-400 text-xs mt-1">
                                        {bet.ODDS1 && bet.ODDS2
                                          ? `Odds: ${bet.ODDS1}/${bet.ODDS2}`
                                          : ""}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {getBetSlips().length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">
                  No bet slips found. Add BET_ID values to your data to see slip
                  performance.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "teamNotes" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Team Notes</h3>

            {/* Team Notes Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/20">
                  <tr>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                      onClick={() => handleTeamNotesSort("country")}
                    >
                      <div className="flex items-center">
                        Country
                        {teamNotesSortConfig.key === "country" && (
                          <span className="ml-1">
                            {teamNotesSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                      onClick={() => handleTeamNotesSort("league")}
                    >
                      <div className="flex items-center">
                        League
                        {teamNotesSortConfig.key === "league" && (
                          <span className="ml-1">
                            {teamNotesSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                      onClick={() => handleTeamNotesSort("team_name")}
                    >
                      <div className="flex items-center">
                        Team Name
                        {teamNotesSortConfig.key === "team_name" && (
                          <span className="ml-1">
                            {teamNotesSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      Note
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                      onClick={() => handleTeamNotesSort("date_added")}
                    >
                      <div className="flex items-center">
                        Date Added
                        {teamNotesSortConfig.key === "date_added" && (
                          <span className="ml-1">
                            {teamNotesSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {getSortedTeamNotesData().map((note, index) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0 ? "bg-white/5" : "bg-white/10"
                      }`}
                    >
                      <td className="px-4 py-4 text-gray-300">
                        {note.country}
                      </td>
                      <td className="px-4 py-4 text-gray-300">{note.league}</td>
                      <td className="px-4 py-4 text-purple-300 font-medium">
                        {note.team_name}
                      </td>
                      <td className="px-4 py-4 text-orange-300">{note.note}</td>
                      <td className="px-4 py-4 text-gray-400 text-sm">
                        {note.date_added}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {teamNotes.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-4">
                  📝 No Team Notes Found
                </div>
                <p className="text-gray-500">
                  Add team notes to Sheet4 in your Google Spreadsheet to see
                  them here.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "betTypeAnalytics" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Team Analytics
            </h3>

            {getTeamBetTypeAnalytics().length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-4">
                  📊 No Team Data Found
                </div>
                <p className="text-gray-500">
                  Add some bets to see your performance by team.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {getTeamBetTypeAnalytics().map((team) => (
                  <div key={team.team} className="bg-white/5 rounded-lg p-4">
                    <button
                      onClick={() => toggleTeamExpansion(team.team)}
                      className="w-full text-left flex items-center justify-between hover:bg-white/5 p-2 rounded transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-semibold text-white">
                          {team.team}
                        </span>
                        <span className="text-green-400 font-medium">
                          {team.winRate}% ({team.wins}W, {team.losses}L)
                        </span>
                        <span className="text-yellow-400 text-sm">
                          Avg Odds: {team.avgOdds}
                        </span>
                      </div>
                      <span className="text-gray-400">
                        {expandedBetTypes.has(team.team) ? "▼" : "▶"}
                      </span>
                    </button>

                    {expandedBetTypes.has(team.team) && (
                      <div className="mt-4 space-y-4">
                        {/* Bet Type Breakdown */}
                        {team.betTypeBreakdown.length > 0 && (
                          <div>
                            <h4 className="text-white font-medium mb-2">
                              Bet Type Performance:
                            </h4>
                            <div className="space-y-1">
                              {team.betTypeBreakdown.map((betType, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm text-gray-300 ml-4"
                                >
                                  • {betType.betType}: {betType.wins}W,{" "}
                                  {betType.losses}L ({betType.winRate}%) -{" "}
                                  {betType.total} bets (Avg Odds:{" "}
                                  {betType.avgOdds})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* League Breakdown */}
                        {team.leagueBreakdown.length > 0 && (
                          <div>
                            <h4 className="text-white font-medium mb-2">
                              League Performance:
                            </h4>
                            <div className="space-y-1">
                              {team.leagueBreakdown.map((league, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm text-gray-300 ml-4"
                                >
                                  • {league.league}: {league.wins}W,{" "}
                                  {league.losses}L ({league.winRate}%) -{" "}
                                  {league.total} bets
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recent Performance */}
                        {team.recentTotal > 0 && (
                          <div>
                            <h4 className="text-white font-medium mb-2">
                              Recent Performance:
                            </h4>
                            <div className="text-sm text-gray-300 ml-4">
                              • Last {team.recentTotal} bets: {team.recentWins}
                              W, {team.recentLosses}L ({team.recentWinRate}%)
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "dailyGames" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Daily Games</h3>

            {dailyGamesLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-4">
                  Loading daily games...
                </div>
              </div>
            ) : getProcessedDailyGames().length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-4">
                  No Games with Historical Data
                </div>
                <p className="text-gray-500">
                  Upload games to Sheet5 in your Google Spreadsheet to see teams
                  you have betting history for.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {getProcessedDailyGames().map((game, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-semibold text-white">
                          {game.home_team} vs {game.away_team}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {game.date}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-400 text-sm">
                          {game.odds1} / {game.odds2}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Home Team Analysis */}
                      {game.homeTeamInHistory && (
                        <div className="bg-white/5 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-purple-300 font-medium">
                              {game.home_team}
                            </span>
                            {game.homeTeamRank && (
                              <span className="text-yellow-400 text-sm">
                                Top 40: #{game.homeTeamRank}
                              </span>
                            )}
                          </div>
                          {game.homeTeamAnalytics && (
                            <div className="text-sm space-y-1">
                              <div
                                className={`${
                                  parseFloat(game.homeTeamAnalytics.winRate) >=
                                  60
                                    ? "text-green-400"
                                    : parseFloat(
                                        game.homeTeamAnalytics.winRate
                                      ) >= 40
                                    ? "text-yellow-400"
                                    : "text-red-400"
                                }`}
                              >
                                Win Rate: {game.homeTeamAnalytics.winRate}% (
                                {game.homeTeamAnalytics.wins}W,{" "}
                                {game.homeTeamAnalytics.losses}L)
                              </div>
                              <div className="text-gray-300">
                                Total Bets: {game.homeTeamAnalytics.total}
                              </div>
                              <div className="text-blue-300 text-xs">
                                {game.homeCountryLeague?.country} -{" "}
                                {game.homeCountryLeague?.league}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Away Team Analysis */}
                      {game.awayTeamInHistory && (
                        <div className="bg-white/5 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-purple-300 font-medium">
                              {game.away_team}
                            </span>
                            {game.awayTeamRank && (
                              <span className="text-yellow-400 text-sm">
                                Top 40: #{game.awayTeamRank}
                              </span>
                            )}
                          </div>
                          {game.awayTeamAnalytics && (
                            <div className="text-sm space-y-1">
                              <div
                                className={`${
                                  parseFloat(game.awayTeamAnalytics.winRate) >=
                                  60
                                    ? "text-green-400"
                                    : parseFloat(
                                        game.awayTeamAnalytics.winRate
                                      ) >= 40
                                    ? "text-yellow-400"
                                    : "text-red-400"
                                }`}
                              >
                                Win Rate: {game.awayTeamAnalytics.winRate}% (
                                {game.awayTeamAnalytics.wins}W,{" "}
                                {game.awayTeamAnalytics.losses}L)
                              </div>
                              <div className="text-gray-300">
                                Total Bets: {game.awayTeamAnalytics.total}
                              </div>
                              <div className="text-blue-300 text-xs">
                                {game.awayCountryLeague?.country} -{" "}
                                {game.awayCountryLeague?.league}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Head to Head Data */}
                    {game.headToHeadData.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="text-sm text-blue-400 font-medium mb-2">
                          Previous Matchups:
                        </div>
                        <div className="text-sm text-gray-300">
                          {game.headToHeadData
                            .slice(0, 3)
                            .map((matchup, idx) => (
                              <div key={idx} className="mb-1">
                                {matchup.date}: {matchup.result} ({matchup.odds}
                                )
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
