import React, { useState } from "react";

const normalizeTeamName = (name = "") => {
  if (!name) return "";

  return name
    .toLowerCase()
    .replace(/[.-]/g, " ")
    .replace(/\b(women|woman|ladies|lady|femenino|femenina)\b/g, " ")
    .replace(/\b(cf|fc|club|de|the|team|cd|sd|ud|ac|sc|afc)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const hasWomenKeyword = (name = "") =>
  /\b(women|woman|ladies|lady|femenino|femenina)\b/i.test(name);

const isSameTeamName = (teamName = "", searchTerm = "") => {
  if (!teamName || !searchTerm) return false;

  const teamIsWomen = hasWomenKeyword(teamName);
  const searchIsWomen = hasWomenKeyword(searchTerm);

  if (teamIsWomen !== searchIsWomen) {
    return false;
  }

  const normalizedTeam = normalizeTeamName(teamName);
  const normalizedSearch = normalizeTeamName(searchTerm);

  if (!normalizedTeam || !normalizedSearch) return false;

  return normalizedTeam === normalizedSearch;
};

const buildTeamKey = (teamName = "", country = "", league = "") => {
  const normalizedTeam = normalizeTeamName(teamName);
  const countryKey = (country || "").toLowerCase().trim();
  const leagueKey = (league || "").toLowerCase().trim();

  if (!normalizedTeam || !countryKey || !leagueKey) {
    return null;
  }

  const genderSuffix = hasWomenKeyword(teamName) ? "women" : "standard";

  return `${normalizedTeam}_${genderSuffix}_${countryKey}_${leagueKey}`;
};

const QuickLookupTab = ({ teamAnalytics, scoringAnalysis, bets }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  /**
   * Calculate Wilson Score for confidence interval
   */
  const calculateWilsonScore = (successes, total) => {
    if (total === 0) return 0;
    const n = total;
    const p = successes / total;
    const z = 1.96; // 95% confidence
    const denominator = 1 + (z * z) / n;
    const center = (p + (z * z) / (2 * n)) / denominator;
    const margin =
      (z *
        Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) /
      denominator;
    return Math.max(0, Math.min(1, center - margin));
  };

  /**
   * Calculate Wilson rate for Over/Under percentages
   */
  const calculateWilsonRate = (rate, games) => {
    const successes = Math.round((rate / 100) * games);
    return calculateWilsonScore(successes, games) * 100;
  };

  /**
   * Get confidence level based on number of games
   */
  const getConfidenceLevel = (games) => {
    if (games >= 20) return { level: "High", color: "text-green-400" };
    if (games >= 10) return { level: "Medium", color: "text-yellow-400" };
    return { level: "Low", color: "text-red-400" };
  };

  /**
   * Generate recommendations for a team based on historical data
   */
  const generateRecommendations = (teamData, scoringData) => {
    const recommendations = [];

    // Straight Win recommendation
    if (teamData) {
      const winRate = parseFloat(teamData.winRate || 0);
      const wilsonWinRate = parseFloat(teamData.wilsonWinRate || 0);
      // Use totalBetsCount for confidence (total individual bets) or fallback to totalBets (for analytics data)
      const gamesCount = teamData.totalBetsCount || teamData.totalBets || 0;
      const confidence = getConfidenceLevel(gamesCount);

      if (winRate >= 70 || wilsonWinRate >= 65) {
        recommendations.push({
          type: "Straight Win",
          confidence: confidence.level,
          confidenceColor: confidence.color,
          winRate: winRate.toFixed(1),
          wilsonWinRate: wilsonWinRate.toFixed(1),
          games: gamesCount,
          reasoning: `Strong win rate of ${winRate.toFixed(1)}% (${wilsonWinRate.toFixed(1)}% Wilson) based on ${gamesCount} bets`,
        });
      } else if (winRate >= 60 || wilsonWinRate >= 55) {
        recommendations.push({
          type: "Straight Win",
          confidence: confidence.level,
          confidenceColor: confidence.color,
          winRate: winRate.toFixed(1),
          wilsonWinRate: wilsonWinRate.toFixed(1),
          games: gamesCount,
          reasoning: `Moderate win rate of ${winRate.toFixed(1)}% (${wilsonWinRate.toFixed(1)}% Wilson) based on ${gamesCount} bets`,
        });
      }
    }

    // Over 1.5 recommendation
    if (scoringData) {
      const over1_5Rate = parseFloat(scoringData.over1_5Rate || 0);
      const totalGames = parseInt(scoringData.totalGames || 0);
      const wilsonOver1_5 = calculateWilsonRate(over1_5Rate, totalGames);
      const confidence = getConfidenceLevel(totalGames);

      if (over1_5Rate >= 85 || wilsonOver1_5 >= 80) {
        recommendations.push({
          type: "Over 1.5",
          confidence: confidence.level,
          confidenceColor: confidence.color,
          rate: over1_5Rate.toFixed(1),
          wilsonRate: wilsonOver1_5.toFixed(1),
          games: totalGames,
          reasoning: `Strong Over 1.5 rate of ${over1_5Rate.toFixed(1)}% (${wilsonOver1_5.toFixed(1)}% Wilson) based on ${totalGames} games`,
        });
      } else if (over1_5Rate >= 75 || wilsonOver1_5 >= 70) {
        recommendations.push({
          type: "Over 1.5",
          confidence: confidence.level,
          confidenceColor: confidence.color,
          rate: over1_5Rate.toFixed(1),
          wilsonRate: wilsonOver1_5.toFixed(1),
          games: totalGames,
          reasoning: `Moderate Over 1.5 rate of ${over1_5Rate.toFixed(1)}% (${wilsonOver1_5.toFixed(1)}% Wilson) based on ${totalGames} games`,
        });
      }
    }

    // Over 2.5 recommendation
    if (scoringData) {
      const over2_5Rate = parseFloat(scoringData.over2_5Rate || 0);
      const totalGames = parseInt(scoringData.totalGames || 0);
      const wilsonOver2_5 = calculateWilsonRate(over2_5Rate, totalGames);
      const confidence = getConfidenceLevel(totalGames);

      if (over2_5Rate >= 70 || wilsonOver2_5 >= 65) {
        recommendations.push({
          type: "Over 2.5",
          confidence: confidence.level,
          confidenceColor: confidence.color,
          rate: over2_5Rate.toFixed(1),
          wilsonRate: wilsonOver2_5.toFixed(1),
          games: totalGames,
          reasoning: `Strong Over 2.5 rate of ${over2_5Rate.toFixed(1)}% (${wilsonOver2_5.toFixed(1)}% Wilson) based on ${totalGames} games`,
        });
      } else if (over2_5Rate >= 60 || wilsonOver2_5 >= 55) {
        recommendations.push({
          type: "Over 2.5",
          confidence: confidence.level,
          confidenceColor: confidence.color,
          rate: over2_5Rate.toFixed(1),
          wilsonRate: wilsonOver2_5.toFixed(1),
          games: totalGames,
          reasoning: `Moderate Over 2.5 rate of ${over2_5Rate.toFixed(1)}% (${wilsonOver2_5.toFixed(1)}% Wilson) based on ${totalGames} games`,
        });
      }
    }

    return recommendations;
  };

  /**
   * Search for teams
   */
  const handleSearch = () => {
    const trimmedSearchTerm = searchTerm.trim();

    if (!trimmedSearchTerm) {
      setSearchResults([]);
      return;
    }

    // Helper function to check if team name matches search term (supports CF/FC suffixes but keeps Women teams separate)
    const matchesSearch = (teamName) => {
      return isSameTeamName(teamName, trimmedSearchTerm);
    };

    const matchesTeamName = matchesSearch;

    const getBetOutcome = (bet) => {
      const result = (bet.RESULT || "").toLowerCase().trim();

      if (result.includes("win")) return "win";
      if (result.includes("loss")) return "loss";
      if (result.includes("draw")) return "draw";
      if (
        result === "" ||
        result === "-" ||
        result.includes("pending") ||
        result.includes("unknown")
      ) {
        return "pending";
      }
      return "pending";
    };

    const determineTeamPosition = (bet) => {
      const teamIncluded = bet.TEAM_INCLUDED || "";
      if (!matchesTeamName(teamIncluded)) {
        return null;
      }

      const betSelectionRaw = bet.BET_SELECTION || "";
      const betSelection = betSelectionRaw.toLowerCase();
      const selectionNoSpaces = betSelection.replace(/\s+/g, "");

      if (betSelection.includes("home win") || betSelection.includes("home")) {
        return "home";
      }
      if (betSelection.includes("away win") || betSelection.includes("away")) {
        return "away";
      }

      const has1 = selectionNoSpaces.includes("1");
      const has2 = selectionNoSpaces.includes("2");
      const hasX = selectionNoSpaces.includes("x");

      if (has1 && !has2) return "home";
      if (has2 && !has1) return "away";

      if (
        selectionNoSpaces.includes("1x") ||
        selectionNoSpaces.includes("x1") ||
        (has1 && hasX && !has2)
      ) {
        return "home";
      }
      if (
        selectionNoSpaces.includes("x2") ||
        selectionNoSpaces.includes("2x") ||
        (has2 && hasX && !has1)
      ) {
        return "away";
      }

      return null;
    };

    const isWinBet = (bet) => {
      if (!matchesTeamName(bet.TEAM_INCLUDED || "")) return false;
      const betType = (bet.BET_TYPE || "").toLowerCase();
      const betSelection = (bet.BET_SELECTION || "").toLowerCase();

      if (betType.includes("double")) return false;
      if (betType.includes("over") || betType.includes("under")) return false;

      if (betType === "" || betType === "win" || betType.includes("win")) {
        const selectionNoSpaces = betSelection.replace(/\s+/g, "");
        if (betSelection.includes("home win") || betSelection.includes("away win")) {
          return true;
        }
        if (
          selectionNoSpaces === "1" ||
          selectionNoSpaces === "2" ||
          selectionNoSpaces === "1win" ||
          selectionNoSpaces === "2win"
        ) {
          return true;
        }
      }
      return false;
    };

    const isDoubleChanceBet = (bet) => {
      if (!matchesTeamName(bet.TEAM_INCLUDED || "")) return false;
      const betType = (bet.BET_TYPE || "").toLowerCase();
      return betType.includes("double chance");
    };

    // Search in team analytics
    const analyticsMatches = (teamAnalytics || []).filter((team) => {
      const teamName = team.teamName || team.team || "";
      return matchesSearch(teamName);
    });

    // Search in scoring analysis
    const scoringMatches = (scoringAnalysis || []).filter((team) => {
      const teamName = team.team || "";
      return matchesSearch(teamName);
    });

    // Also search directly in bets data to find all leagues (teamAnalytics may be filtered to top 100)
    const allLeaguesFromBets = new Map();
    if (bets && Array.isArray(bets)) {
      bets.forEach((bet) => {
        const teamIncluded = bet.TEAM_INCLUDED || "";
        const homeTeam = bet.HOME_TEAM || "";
        const awayTeam = bet.AWAY_TEAM || "";
        const country = bet.COUNTRY || "";
        const league = bet.LEAGUE || "";

        // Check if this bet involves the searched team (in any position) - exact match only
        let matchedTeamName = null;
        const matchesSearchInBets = (name) => {
          return isSameTeamName(name, trimmedSearchTerm);
        };
        
        if (matchesSearchInBets(teamIncluded)) {
          matchedTeamName = bet.TEAM_INCLUDED;
        } else if (matchesSearchInBets(homeTeam)) {
          matchedTeamName = bet.HOME_TEAM;
        } else if (matchesSearchInBets(awayTeam)) {
          matchedTeamName = bet.AWAY_TEAM;
        }

        if (matchedTeamName && country && league) {
          // Use the matched team name (preserve original casing)
          const key = buildTeamKey(matchedTeamName, country, league);
          if (key && !allLeaguesFromBets.has(key)) {
            allLeaguesFromBets.set(key, {
              teamName: matchedTeamName.trim(),
              country: country.trim(),
              league: league.trim(),
              fromBets: true,
            });
          }
        }
      });
    }

    console.log(`Found ${allLeaguesFromBets.size} unique league combinations in raw bets data`);

    console.log(`Found ${analyticsMatches.length} analytics matches for "${searchTerm}"`);
    console.log(`Found ${scoringMatches.length} scoring matches for "${searchTerm}"`);
    if (analyticsMatches.length > 0) {
      console.log("Analytics matches:", analyticsMatches.map(t => ({
        team: t.teamName || t.team,
        country: t.country,
        league: t.league
      })));
    }
    if (scoringMatches.length > 0) {
      console.log("Scoring matches:", scoringMatches.map(t => ({
        team: t.team || t.teamName,
        country: t.country,
        league: t.league
      })));
    }

    // Group by team name + country + league combination (unique key for each league)
    const teamMap = new Map();

    // First, add ALL analytics matches (each unique team+country+league gets its own entry)
    analyticsMatches.forEach((team) => {
      const teamName = (team.teamName || team.team || "").trim();
      const country = (team.country || "").trim();
      const league = (team.league || "").trim();
      
      const key = buildTeamKey(teamName, country, league);
      
      if (!key) {
        console.log(`Analytics: Skipping entry for ${teamName} - ${country} - ${league} (invalid key)`);
        return;
      }
      
      console.log(`Analytics: Adding key "${key}" for ${teamName} - ${country} - ${league}`);
      
      if (!teamMap.has(key)) {
        teamMap.set(key, {
          teamName: teamName,
          country: country,
          league: league,
          analytics: team,
          scoring: null,
        });
      } else {
        // Update existing entry with analytics data (shouldn't happen, but just in case)
        console.log(`Analytics: Key "${key}" already exists, updating analytics data`);
        teamMap.get(key).analytics = team;
      }
    });

    // Add all leagues found in raw bets data (even if not in teamAnalytics top 100)
    allLeaguesFromBets.forEach((betInfo, key) => {
      if (!teamMap.has(key)) {
        // This league combination wasn't in teamAnalytics - create entry from bets
        teamMap.set(key, {
          teamName: betInfo.teamName,
          country: betInfo.country,
          league: betInfo.league,
          analytics: null,
          scoring: null,
          fromBets: true,
        });
        console.log(`Bets: Adding key "${key}" for ${betInfo.teamName} - ${betInfo.country} - ${betInfo.league}`);
      }
    });

    // Then, add ALL scoring matches (each unique team+country+league gets its own entry or matches existing)
    scoringMatches.forEach((team) => {
      const teamName = (team.team || "").trim();
      const country = (team.country || "").trim();
      const league = (team.league || "").trim();
      
      const key = buildTeamKey(teamName, country, league);
      
      if (!key) {
        console.log(`Scoring: Skipping entry for ${teamName} - ${country} - ${league} (invalid key)`);
        return;
      }
      
      console.log(`Scoring: Checking key "${key}" for ${teamName} - ${country} - ${league}`);
      
      if (!teamMap.has(key)) {
        // New league combination - create new entry
        console.log(`Scoring: Key "${key}" is NEW, creating entry`);
        teamMap.set(key, {
          teamName: teamName,
          country: country,
          league: league,
          analytics: null,
          scoring: team,
        });
      } else {
        // Match found - add scoring data to existing entry
        console.log(`Scoring: Key "${key}" exists, adding scoring data`);
        teamMap.get(key).scoring = team;
      }
    });
    
    console.log(`TeamMap size after processing: ${teamMap.size}`);
    console.log("TeamMap keys:", Array.from(teamMap.keys()));

    // Helper function to calculate stats from bets data
    const calculateStatsFromBets = (teamName, country, league) => {
      if (!bets || !Array.isArray(bets)) return null;

      const normalizedSearchName = teamName.trim();
      const matchesTeamName = (name) => isSameTeamName(name, normalizedSearchName);
      const countryLower = country.toLowerCase().trim();
      const leagueLower = league.toLowerCase().trim();

      // First filter by country and league (strict matching)
      const leagueBets = bets.filter((bet) => {
        const betCountry = (bet.COUNTRY || "").toLowerCase().trim();
        const betLeague = (bet.LEAGUE || "").toLowerCase().trim();
        return betCountry === countryLower && betLeague === leagueLower;
      });

      // Then find bets where this team appears (use normalized matching to handle CF/FC suffixes)
      const teamBets = leagueBets.filter((bet) => {
        const betNames = [bet.TEAM_INCLUDED, bet.HOME_TEAM, bet.AWAY_TEAM].filter(
          Boolean
        );

        return betNames.some((name) => matchesTeamName(name));
      });

      if (teamBets.length === 0) return null;

      // First, deduplicate bets themselves (remove duplicate bet entries)
      // Always use date + teams + bet type + team included (not BET_ID, since same BET_ID can appear multiple times)
      const uniqueBetsMap = new Map();
      const duplicateKeys = new Map(); // Track which keys had duplicates
      
      teamBets.forEach((bet) => {
        // Always use the combination key (date + teams + bet type + team included)
        // This ensures bets with same date/teams/bet type are deduplicated even if BET_ID differs
        const homeTeam = (bet.HOME_TEAM || "").toLowerCase().trim();
        const awayTeam = (bet.AWAY_TEAM || "").toLowerCase().trim();
        const betType = (bet.BET_TYPE || "").toLowerCase().trim();
        const teamIncluded = (bet.TEAM_INCLUDED || "").toLowerCase().trim();
        const date = String(bet.DATE || "").toLowerCase().trim();
        const key = `${date}_${homeTeam}_${awayTeam}_${betType}_${teamIncluded}`;
        
        if (!uniqueBetsMap.has(key)) {
          uniqueBetsMap.set(key, bet);
        } else {
          // This is a duplicate
          if (!duplicateKeys.has(key)) {
            duplicateKeys.set(key, 1);
          } else {
            duplicateKeys.set(key, duplicateKeys.get(key) + 1);
          }
        }
      });
      
      const deduplicatedTeamBets = Array.from(uniqueBetsMap.values());
      const totalDuplicates = teamBets.length - deduplicatedTeamBets.length;
      
      // Always log deduplication results
      console.log(`=== BET DEDUPLICATION RESULTS ===`);
      console.log(`  Total bets before deduplication: ${teamBets.length}`);
      console.log(`  Total bets after deduplication: ${deduplicatedTeamBets.length}`);
      console.log(`  Duplicates removed: ${totalDuplicates}`);
      
      if (totalDuplicates > 0) {
        console.log(`  ✓ Deduplicated bets: ${teamBets.length} -> ${deduplicatedTeamBets.length} (removed ${totalDuplicates} duplicates)`);
        if (duplicateKeys.size > 0) {
          console.log(`  Duplicate keys found:`, Array.from(duplicateKeys.entries()).slice(0, 5));
        }
      } else {
        console.log(`  ⚠ No duplicates found - all ${teamBets.length} bets appear unique`);
        // Debug: Check why identical-looking bets aren't being deduplicated
        // Check entries [1-4] which look identical in the display
        if (teamBets.length > 4) {
          console.log(`  Checking entries [1-4] (index 1-4) which appear identical:`);
          teamBets.slice(1, 5).forEach((b, idx) => {
            const actualIdx = idx + 1;
            const betId = b.BET_ID || b.betId || b.ID || 'NO BET_ID';
            console.log(`    Entry [${actualIdx}] - BET_ID: "${betId}", DATE: "${b.DATE}", HOME: "${b.HOME_TEAM}", AWAY: "${b.AWAY_TEAM}", TYPE: "${b.BET_TYPE}"`);
          });
          
          // Check what key would be generated for these
          console.log(`  Generated keys for entries [1-4]:`);
          teamBets.slice(1, 5).forEach((b, idx) => {
            const actualIdx = idx + 1;
            const homeTeam = (b.HOME_TEAM || "").toLowerCase().trim();
            const awayTeam = (b.AWAY_TEAM || "").toLowerCase().trim();
            const betType = (b.BET_TYPE || "").toLowerCase().trim();
            const teamIncluded = (b.TEAM_INCLUDED || "").toLowerCase().trim();
            const date = String(b.DATE || "").toLowerCase().trim();
            const key = `${date}_${homeTeam}_${awayTeam}_${betType}_${teamIncluded}`;
            console.log(`    Entry [${actualIdx}] key: "${key}"`);
            console.log(`      - Date (raw): "${b.DATE}" (normalized: "${date}")`);
            console.log(`      - HOME: "${b.HOME_TEAM}" (normalized: "${homeTeam}")`);
            console.log(`      - AWAY: "${b.AWAY_TEAM}" (normalized: "${awayTeam}")`);
            console.log(`      - TYPE: "${b.BET_TYPE}" (normalized: "${betType}")`);
            console.log(`      - TEAM_INCLUDED: "${b.TEAM_INCLUDED}" (normalized: "${teamIncluded}")`);
          });
        }
      }

      // Deduplicate games (same date + teams = same game)
      // For each unique game, keep the bet that has the clearest home/away info
      // Prioritize bets where HOME_TEAM or AWAY_TEAM matches the team (not just TEAM_INCLUDED)
      const uniqueGames = new Map();
      deduplicatedTeamBets.forEach((bet) => {
        const homeTeam = bet.HOME_TEAM || "";
        const awayTeam = bet.AWAY_TEAM || "";
        const date = bet.DATE || "";
        const gameKey = `${date}_${homeTeam.toLowerCase().trim()}_${awayTeam
          .toLowerCase()
          .trim()}`;
        
        // Check if this bet has clear home/away classification
        const position = determineTeamPosition(bet);
        const hasClearHomeAway = position === "home" || position === "away";
        
        if (!uniqueGames.has(gameKey)) {
          uniqueGames.set(gameKey, bet);
        } else {
          // Prefer bet with clear home/away classification
          const existingBet = uniqueGames.get(gameKey);
          const existingPosition = determineTeamPosition(existingBet);
          const existingHasClearHomeAway =
            existingPosition === "home" || existingPosition === "away";
          
          // Replace if new bet has clear home/away but existing doesn't
          if (hasClearHomeAway && !existingHasClearHomeAway) {
            uniqueGames.set(gameKey, bet);
          }
          // Or if both are clear, prefer Win bets over Over/Under
          else if (hasClearHomeAway && existingHasClearHomeAway) {
            const isWinBet = !bet.BET_TYPE?.toLowerCase().includes("over") && !bet.BET_TYPE?.toLowerCase().includes("under");
            const existingIsWinBet = !existingBet.BET_TYPE?.toLowerCase().includes("over") && !existingBet.BET_TYPE?.toLowerCase().includes("under");
            if (isWinBet && !existingIsWinBet) {
              uniqueGames.set(gameKey, bet);
            }
          }
        }
      });

      const deduplicatedBets = Array.from(uniqueGames.values());

      // Count unique games (for display)
      const uniqueGamesCount = deduplicatedBets.length;
      
      // Count ALL individual bets (after deduplicating duplicate bets) for wins/losses/pending
      const totalBetsCount = deduplicatedTeamBets.length; // All unique bet entries (deduplicated)
      const wins = deduplicatedTeamBets.filter((bet) => bet.RESULT?.toLowerCase().includes("win")).length;
      const losses = deduplicatedTeamBets.filter((bet) => bet.RESULT?.toLowerCase().includes("loss")).length;
      const pendingBets = deduplicatedTeamBets.filter((bet) => {
        const result = (bet.RESULT || "").toLowerCase().trim();
        return result === "" || result === "unknown" || result === "pending" || 
               (!result.includes("win") && !result.includes("loss"));
      }).length;
      const completedBets = wins + losses; // Only completed bets for win rate calculation
      const winRate = completedBets > 0 ? (wins / completedBets) * 100 : 0;
      const wilsonWinRate = completedBets > 0 ? calculateWilsonScore(wins, completedBets) * 100 : 0;

      // Calculate Double Chance stats
      const doubleChanceBets = deduplicatedTeamBets.filter((bet) =>
        isDoubleChanceBet(bet)
      );
      const doubleChanceTotal = doubleChanceBets.length;
      const doubleChanceWins = doubleChanceBets.filter(
        (bet) => getBetOutcome(bet) === "win"
      ).length;
      const doubleChanceLosses = doubleChanceBets.filter(
        (bet) => getBetOutcome(bet) === "loss"
      ).length;
      const doubleChanceCompleted = doubleChanceWins + doubleChanceLosses;
      const doubleChanceWinRate = doubleChanceCompleted > 0 ? (doubleChanceWins / doubleChanceCompleted) * 100 : 0;
      const doubleChanceWilsonRate = doubleChanceCompleted > 0 ? calculateWilsonScore(doubleChanceWins, doubleChanceCompleted) * 100 : 0;

      // Calculate Over/Under from games with scores (deduplicated)
      const gamesWithScores = deduplicatedBets.filter(
        (bet) =>
          bet.HOME_SCORE !== null &&
          bet.HOME_SCORE !== undefined &&
          bet.AWAY_SCORE !== null &&
          bet.AWAY_SCORE !== undefined &&
          !isNaN(parseFloat(bet.HOME_SCORE)) &&
          !isNaN(parseFloat(bet.AWAY_SCORE))
      );

      let over0_5Count = 0;
      let over1_5Count = 0;
      let over2_5Count = 0;
      let under5_5Count = 0;
      let under4_5Count = 0;
      let totalGoals = 0;

      gamesWithScores.forEach((bet) => {
        const homeScore = parseFloat(bet.HOME_SCORE || 0);
        const awayScore = parseFloat(bet.AWAY_SCORE || 0);
        const gameTotal = homeScore + awayScore;
        totalGoals += gameTotal;
        if (gameTotal > 0) over0_5Count++;
        if (gameTotal > 1) over1_5Count++;
        if (gameTotal > 2) over2_5Count++;
        if (gameTotal < 5.5) under5_5Count++;
        if (gameTotal < 4.5) under4_5Count++;
      });

      const totalGames = gamesWithScores.length;
      const over0_5Rate = totalGames > 0 ? (over0_5Count / totalGames) * 100 : 0;
      const over1_5Rate = totalGames > 0 ? (over1_5Count / totalGames) * 100 : 0;
      const over2_5Rate = totalGames > 0 ? (over2_5Count / totalGames) * 100 : 0;
      const under5_5Rate = totalGames > 0 ? (under5_5Count / totalGames) * 100 : 0;
      const under4_5Rate = totalGames > 0 ? (under4_5Count / totalGames) * 100 : 0;
      const avgGoals = totalGames > 0 ? totalGoals / totalGames : 0;

      // Calculate Home/Away splits using Win bets only
      const winBets = deduplicatedTeamBets.filter((bet) => isWinBet(bet));
      const homeWinBets = winBets.filter(
        (bet) => determineTeamPosition(bet) === "home"
      );
      const awayWinBets = winBets.filter(
        (bet) => determineTeamPosition(bet) === "away"
      );

      const homeTotal = homeWinBets.length;
      let homeWins = 0;
      let homeLosses = 0;
      let homeCompleted = 0;
      homeWinBets.forEach((bet) => {
        const outcome = getBetOutcome(bet);
        if (outcome === "win") {
          homeWins++;
          homeCompleted++;
        } else if (outcome === "loss") {
          homeLosses++;
          homeCompleted++;
        }
      });
      const homeWinRate = homeCompleted > 0 ? (homeWins / homeCompleted) * 100 : 0;

      const awayTotal = awayWinBets.length;
      let awayWins = 0;
      let awayLosses = 0;
      let awayCompleted = 0;
      awayWinBets.forEach((bet) => {
        const outcome = getBetOutcome(bet);
        if (outcome === "win") {
          awayWins++;
          awayCompleted++;
        } else if (outcome === "loss") {
          awayLosses++;
          awayCompleted++;
        }
      });
      const awayWinRate = awayCompleted > 0 ? (awayWins / awayCompleted) * 100 : 0;

      // Calculate average goals from games with scores (for display)
      const avgGoalsDisplay = avgGoals;

      console.log(`calculateStatsFromBets for ${teamName} - ${country} - ${league}:`);
      console.log(`  Filtered to ${leagueBets.length} bets in this league`);
      console.log(`  Found ${teamBets.length} individual bets with this team (before deduplication)`);
      
      // Debug: Show sample of bets being counted (use deduplicated bets for display)
      if (deduplicatedTeamBets.length > 0) {
        console.log(`  Sample bets (first 5) - AFTER deduplication:`);
        deduplicatedTeamBets.slice(0, 5).forEach((b, idx) => {
          console.log(`    [${idx + 1}] Date: ${b.DATE}, HOME: "${b.HOME_TEAM}", AWAY: "${b.AWAY_TEAM}", TEAM_INCLUDED: "${b.TEAM_INCLUDED}", BET_TYPE: "${b.BET_TYPE}", RESULT: "${b.RESULT}"`);
        });
        if (deduplicatedTeamBets.length > 5) {
          console.log(`  Sample bets (last 5) - AFTER deduplication:`);
          deduplicatedTeamBets.slice(-5).forEach((b, idx) => {
            console.log(`    [${deduplicatedTeamBets.length - 4 + idx}] Date: ${b.DATE}, HOME: "${b.HOME_TEAM}", AWAY: "${b.AWAY_TEAM}", TEAM_INCLUDED: "${b.TEAM_INCLUDED}", BET_TYPE: "${b.BET_TYPE}", RESULT: "${b.RESULT}"`);
          });
        }
        
        // Check for potential name variations (use deduplicated bets)
        const uniqueHomeTeams = [...new Set(deduplicatedTeamBets.map(b => (b.HOME_TEAM || "").toLowerCase().trim()).filter(t => t.includes("porto")))];
        const uniqueAwayTeams = [...new Set(deduplicatedTeamBets.map(b => (b.AWAY_TEAM || "").toLowerCase().trim()).filter(t => t.includes("porto")))];
        const uniqueTeamIncluded = [...new Set(deduplicatedTeamBets.map(b => (b.TEAM_INCLUDED || "").toLowerCase().trim()).filter(t => t.includes("porto")))];
        console.log(`  Team name variations found (containing "porto"):`);
        console.log(`    HOME_TEAM: ${uniqueHomeTeams.join(", ")}`);
        console.log(`    AWAY_TEAM: ${uniqueAwayTeams.join(", ")}`);
        console.log(`    TEAM_INCLUDED: ${uniqueTeamIncluded.join(", ")}`);
      }
      
      console.log(`  Deduplicated to ${deduplicatedBets.length} unique games`);
      console.log(`  Unique games: ${uniqueGamesCount}`);
      console.log(`  Total bets: ${totalBetsCount} (${wins}W/${losses}L/${pendingBets}P)`);
      console.log(`  Games with scores: ${totalGames}`);
      console.log(`  Home games: ${homeTotal} (${homeWins}W/${homeLosses}L)`);
      console.log(`  Away games: ${awayTotal} (${awayWins}W/${awayLosses}L)`);

      return {
        uniqueGamesCount, // Number of unique games
        totalBetsCount, // Total individual bet entries
        pendingBets, // Number of pending bets
        wins, // Number of winning bets (all individual bets)
        losses, // Number of losing bets (all individual bets)
        winRate,
        wilsonWinRate,
        totalGames, // Games with scores (for Over/Under)
        over1_5Rate,
        over2_5Rate,
        over0_5Rate,
        under5_5Rate,
        under4_5Rate,
        avgGoals: avgGoalsDisplay,
        homeWinRate,
        awayWinRate,
        homeTotal, // Number of home games (unique games)
        awayTotal, // Number of away games (unique games)
        doubleChanceTotal, // Total Double Chance bets
        doubleChanceWins, // Double Chance wins
        doubleChanceLosses, // Double Chance losses
        doubleChanceWinRate, // Double Chance win rate
        doubleChanceWilsonRate, // Double Chance Wilson rate
      };
    };

    // Convert to array, calculate stats from bets if needed, and generate recommendations
    const resultsArray = Array.from(teamMap.values())
      .map((result) => {
        // Always calculate from bets to get home/away splits and ensure we have all stats
        // This supplements analytics/scoring data which might not have home/away breakdown
        let calculatedStats = null;
        if (bets) {
          calculatedStats = calculateStatsFromBets(result.teamName, result.country, result.league);
        }

        const recommendations = generateRecommendations(
          result.analytics || calculatedStats,
          result.scoring || calculatedStats
        );
        
        return {
          ...result,
          calculatedStats, // Store calculated stats for display
          recommendations,
        };
      })
      .sort((a, b) => {
        // Sort by country, then league, then team name
        if (a.country !== b.country) {
          return (a.country || "").localeCompare(b.country || "");
        }
        if (a.league !== b.league) {
          return (a.league || "").localeCompare(b.league || "");
        }
        return (a.teamName || "").localeCompare(b.teamName || "");
      });

    // Group results by team name to create total view
    const teamGroups = new Map();
    resultsArray.forEach((result) => {
      const teamName = result.teamName;
      if (!teamGroups.has(teamName)) {
        teamGroups.set(teamName, []);
      }
      teamGroups.get(teamName).push(result);
    });

    // Create total view for each team and merge with league-specific results
    const finalResults = [];
    teamGroups.forEach((leagueResults, teamName) => {
      if (leagueResults.length === 0) return;

      // Calculate total stats across all leagues
      let totalWins = 0;
      let totalLosses = 0;
      let totalPendingBets = 0;
      let totalUniqueGames = 0;
      let totalBetsCount = 0;
      let totalGamesWithScores = 0;
      let totalOver0_5Count = 0;
      let totalOver1_5Count = 0;
      let totalOver2_5Count = 0;
      let totalUnder5_5Count = 0;
      let totalUnder4_5Count = 0;
      let totalGoals = 0;
      let totalHomeWins = 0;
      // eslint-disable-next-line no-unused-vars -- accumulated for potential future use
      let totalHomeLosses = 0;
      let totalHomeGames = 0;
      let totalAwayWins = 0;
      // eslint-disable-next-line no-unused-vars -- accumulated for potential future use
      let totalAwayLosses = 0;
      let totalAwayGames = 0;
      let totalDoubleChanceTotal = 0;
      let totalDoubleChanceWins = 0;
      let totalDoubleChanceLosses = 0;

      leagueResults.forEach((result) => {
        if (result.calculatedStats || result.analytics) {
          // For Total View, use calculatedStats for accurate counts
          if (result.calculatedStats) {
            const leagueUniqueGames = result.calculatedStats.uniqueGamesCount || 0;
            const leagueTotalBets = result.calculatedStats.totalBetsCount || 0;
            const leaguePendingBets = result.calculatedStats.pendingBets || 0;
            const leagueWins = result.calculatedStats.wins || 0;
            const leagueLosses = result.calculatedStats.losses || 0;
            
            console.log(`  Adding league: ${result.country} - ${result.league}`);
            console.log(`    - Unique games: ${leagueUniqueGames}`);
            console.log(`    - Total bets: ${leagueTotalBets}`);
            console.log(`    - Wins: ${leagueWins}, Losses: ${leagueLosses}, Pending: ${leaguePendingBets}`);
            
            totalUniqueGames += leagueUniqueGames;
            totalBetsCount += leagueTotalBets;
            totalPendingBets += leaguePendingBets;
            totalWins += leagueWins;
            totalLosses += leagueLosses;
            
            const gamesWithScores = result.calculatedStats.totalGames || 0;
            totalGamesWithScores += gamesWithScores;

            // Calculate Over/Under from calculated stats
            const over0_5Games = Math.round(
              (result.calculatedStats.over0_5Rate / 100) * gamesWithScores
            );
            const over1_5Games = Math.round(
              (result.calculatedStats.over1_5Rate / 100) * gamesWithScores
            );
            const over2_5Games = Math.round(
              (result.calculatedStats.over2_5Rate / 100) * gamesWithScores
            );
            const under5_5Games = Math.round(
              (result.calculatedStats.under5_5Rate / 100) * gamesWithScores
            );
            const under4_5Games = Math.round(
              (result.calculatedStats.under4_5Rate / 100) * gamesWithScores
            );
            totalOver0_5Count += over0_5Games;
            totalOver1_5Count += over1_5Games;
            totalOver2_5Count += over2_5Games;
            totalUnder5_5Count += under5_5Games;
            totalUnder4_5Count += under4_5Games;
            totalGoals += (result.calculatedStats.avgGoals || 0) * gamesWithScores;

            // Home/Away totals - use the actual values from calculatedStats
            // homeTotal and awayTotal should already include all games (fixed earlier)
            const homeGames = result.calculatedStats.homeTotal || 0;
            const awayGames = result.calculatedStats.awayTotal || 0;
            
            // Calculate wins/losses from the win rate percentages
            // But first check if we have actual wins/losses counts for home/away
            // Since we don't track home/away wins separately in calculatedStats,
            // we need to calculate from the win rate
            // homeWinRate is based on completed games, so we need to apply it to all home games
            const homeWinRate = result.calculatedStats.homeWinRate || 0;
            const homeCompleted = homeGames; // homeTotal should already be all home games
            const homeWins = Math.round((homeWinRate / 100) * homeCompleted);
            const homeLosses = homeCompleted - homeWins;
            
            const awayWinRate = result.calculatedStats.awayWinRate || 0;
            const awayCompleted = awayGames; // awayTotal should already be all away games
            const awayWins = Math.round((awayWinRate / 100) * awayCompleted);
            const awayLosses = awayCompleted - awayWins;
            
            totalHomeWins += homeWins;
            totalHomeGames += homeGames;
            totalHomeLosses += homeLosses;
            
            totalAwayWins += awayWins;
            totalAwayGames += awayGames;
            totalAwayLosses += awayLosses;
            
            // Double Chance stats
            totalDoubleChanceTotal += result.calculatedStats.doubleChanceTotal || 0;
            totalDoubleChanceWins += result.calculatedStats.doubleChanceWins || 0;
            totalDoubleChanceLosses += result.calculatedStats.doubleChanceLosses || 0;
          } else if (result.analytics) {
            // Fallback to analytics - treat analytics.totalBets as unique games
            // Since analytics doesn't have separate bet counts, we approximate
            totalUniqueGames += result.analytics.totalBets || 0;
            totalBetsCount += result.analytics.totalBets || 0; // Approximate - same as unique games
            totalWins += result.analytics.wins || 0;
            totalLosses += result.analytics.losses || 0;
            // Can't calculate pending from analytics
          }
        }
      });

      console.log(`=== Total calculation for ${teamName} ===`);
      console.log(`  League results: ${leagueResults.length}`);
      console.log(`  Total unique games: ${totalUniqueGames}`);
      console.log(`  Total bets: ${totalBetsCount} (${totalWins}W/${totalLosses}L/${totalPendingBets}P)`);
      console.log(`  Sum totalGamesWithScores: ${totalGamesWithScores}`);

      // Create total stats object
      // Win rate based on completed bets (wins + losses)
      const completedBets = totalWins + totalLosses;
      const totalWinRate = completedBets > 0 ? (totalWins / completedBets) * 100 : 0;
      const totalWilsonWinRate = completedBets > 0 ? calculateWilsonScore(totalWins, completedBets) * 100 : 0;
      const totalOver0_5Rate =
        totalGamesWithScores > 0 ? (totalOver0_5Count / totalGamesWithScores) * 100 : 0;
      const totalOver1_5Rate =
        totalGamesWithScores > 0 ? (totalOver1_5Count / totalGamesWithScores) * 100 : 0;
      const totalOver2_5Rate =
        totalGamesWithScores > 0 ? (totalOver2_5Count / totalGamesWithScores) * 100 : 0;
      const totalUnder5_5Rate =
        totalGamesWithScores > 0 ? (totalUnder5_5Count / totalGamesWithScores) * 100 : 0;
      const totalUnder4_5Rate =
        totalGamesWithScores > 0 ? (totalUnder4_5Count / totalGamesWithScores) * 100 : 0;
      const totalAvgGoals = totalGamesWithScores > 0 ? totalGoals / totalGamesWithScores : 0;
      const totalHomeWinRate = totalHomeGames > 0 ? (totalHomeWins / totalHomeGames) * 100 : 0;
      const totalAwayWinRate = totalAwayGames > 0 ? (totalAwayWins / totalAwayGames) * 100 : 0;
      const totalDoubleChanceCompleted = totalDoubleChanceWins + totalDoubleChanceLosses;
      const totalDoubleChanceWinRate = totalDoubleChanceCompleted > 0 ? (totalDoubleChanceWins / totalDoubleChanceCompleted) * 100 : 0;
      const totalDoubleChanceWilsonRate = totalDoubleChanceCompleted > 0 ? calculateWilsonScore(totalDoubleChanceWins, totalDoubleChanceCompleted) * 100 : 0;

      const totalStats = {
        teamName,
        isTotalView: true,
        leagues: leagueResults.map(r => `${r.country} - ${r.league}`).join(", "),
        calculatedStats: {
          uniqueGamesCount: totalUniqueGames,
          totalBetsCount: totalBetsCount,
          pendingBets: totalPendingBets,
          wins: totalWins,
          losses: totalLosses,
          winRate: totalWinRate,
          wilsonWinRate: totalWilsonWinRate,
          totalGames: totalGamesWithScores, // Games with scores (for Over/Under calculations)
          over0_5Rate: totalOver0_5Rate,
          over1_5Rate: totalOver1_5Rate,
          over2_5Rate: totalOver2_5Rate,
          under5_5Rate: totalUnder5_5Rate,
          under4_5Rate: totalUnder4_5Rate,
          avgGoals: totalAvgGoals,
          homeWinRate: totalHomeWinRate,
          awayWinRate: totalAwayWinRate,
          homeTotal: totalHomeGames,
          awayTotal: totalAwayGames,
          doubleChanceTotal: totalDoubleChanceTotal,
          doubleChanceWins: totalDoubleChanceWins,
          doubleChanceLosses: totalDoubleChanceLosses,
          doubleChanceWinRate: totalDoubleChanceWinRate,
          doubleChanceWilsonRate: totalDoubleChanceWilsonRate,
        },
      };

      console.log(`=== Total View final stats for ${teamName} ===`);
      console.log(`  Unique games: ${totalUniqueGames}`);
      console.log(`  Total bets: ${totalBetsCount} (${totalWins}W/${totalLosses}L/${totalPendingBets}P)`);
      console.log(`  Games with scores: ${totalGamesWithScores}`);

      // Only add total view if there are multiple leagues
      // If there's only one league, skip the Total View and just show the league-specific result
      if (leagueResults.length > 1) {
        finalResults.push(totalStats);
      }
      finalResults.push(...leagueResults);
    });

    console.log(`Total unique league combinations found: ${finalResults.length}`);
    console.log("Results:", finalResults.map(r => r.isTotalView ? `TOTAL: ${r.teamName}` : `${r.teamName} - ${r.country} - ${r.league}`));

    setSearchResults(finalResults);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Quick Team Lookup</h2>
        <p className="text-gray-400 mb-4">
          Search for a team to view complete performance overview and historical statistics
        </p>

        {/* Search Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter team name..."
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3982db] focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-[#3982db] text-white rounded-lg hover:bg-[#2d6fc7] transition-colors font-semibold"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className={`backdrop-blur-sm rounded-lg p-6 ${
                result.isTotalView
                  ? "bg-[#3982db]/20 border-2 border-[#3982db]"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              {/* Team Header */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">
                  {result.teamName}
                </h3>
                {result.isTotalView ? (
                  <p className="text-gray-400 text-sm">
                    Total View - All Leagues ({result.leagues})
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm">
                    {result.country} - {result.league}
                  </p>
                )}
              </div>

              {/* Performance Overview */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Performance Overview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Win Rate */}
                  {(result.analytics || result.calculatedStats) && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Win Rate</p>
                      <p className="text-white font-semibold text-lg">
                        {((result.analytics?.winRate || result.calculatedStats?.winRate) || 0).toFixed(1)}%
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        ({(result.analytics?.wilsonWinRate || result.calculatedStats?.wilsonWinRate || 0).toFixed(1)}% Wilson)
                      </p>
                    </div>
                  )}
                  
                  {/* Unique Games */}
                  {(result.calculatedStats || result.analytics) && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Unique Games</p>
                      <p className="text-white font-semibold text-lg">
                        {result.calculatedStats?.uniqueGamesCount || result.analytics?.totalBets || 0}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Distinct matches
                      </p>
                    </div>
                  )}
                  
                  {/* Total Bets */}
                  {(result.calculatedStats || result.analytics) && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Total Bets</p>
                      <p className="text-white font-semibold text-lg">
                        {result.calculatedStats?.totalBetsCount || result.analytics?.totalBets || 0}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {result.analytics?.wins || result.calculatedStats?.wins || 0}W / {result.analytics?.losses || result.calculatedStats?.losses || 0}L
                        {result.calculatedStats?.pendingBets > 0 && (
                          <span className="ml-1">/ {result.calculatedStats.pendingBets}P</span>
                        )}
                      </p>
                    </div>
                  )}
                  
                  {/* Pending Bets - Only show if there are pending bets */}
                  {result.calculatedStats?.pendingBets > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Pending Bets</p>
                      <p className="text-white font-semibold text-lg">
                        {result.calculatedStats.pendingBets}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Awaiting result
                      </p>
                    </div>
                  )}
                  
                  {/* Home/Away Win Rates - Always show if calculated stats available */}
                  {result.calculatedStats && (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Home Win %</p>
                        <p className="text-white font-semibold text-lg">
                          {(result.calculatedStats?.homeWinRate || 0).toFixed(1)}%
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {result.calculatedStats?.homeTotal || 0} home games
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Away Win %</p>
                        <p className="text-white font-semibold text-lg">
                          {(result.calculatedStats?.awayWinRate || 0).toFixed(1)}%
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {result.calculatedStats?.awayTotal || 0} away games
                        </p>
                      </div>
                    </>
                  )}
                  
                  {/* Double Chance Stats */}
                  {result.calculatedStats && result.calculatedStats.doubleChanceTotal > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Double Chance</p>
                      <p className="text-white font-semibold text-lg">
                        {parseFloat(result.calculatedStats.doubleChanceWinRate || 0).toFixed(1)}%
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {result.calculatedStats.doubleChanceTotal} bets
                      </p>
                    </div>
                  )}
                  
                  {/* Over/Under Stats */}
                  {(result.scoring || result.calculatedStats) && (() => {
                    const stats = result.calculatedStats || result.scoring || {};
                    const totalGoalGames = stats.totalGames || 0;

                    return (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Over 0.5</p>
                        <p className="text-white font-semibold text-lg">
                          {parseFloat(stats.over0_5Rate || 0).toFixed(1)}%
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {totalGoalGames} games with goals over 0.5
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Over 1.5</p>
                        <p className="text-white font-semibold text-lg">
                          {parseFloat(stats.over1_5Rate || 0).toFixed(1)}%
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {totalGoalGames} games with goals over 1.5
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Over 2.5</p>
                        <p className="text-white font-semibold text-lg">
                          {parseFloat(stats.over2_5Rate || 0).toFixed(1)}%
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {totalGoalGames} games with goals over 2.5
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Under 5.5</p>
                        <p className="text-white font-semibold text-lg">
                          {parseFloat(stats.under5_5Rate || 0).toFixed(1)}%
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {totalGoalGames} games with goals under 5.5
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Under 4.5</p>
                        <p className="text-white font-semibold text-lg">
                          {parseFloat(stats.under4_5Rate || 0).toFixed(1)}%
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {totalGoalGames} games with goals under 4.5
                        </p>
                      </div>
                    </>
                    );
                  })()}

                  {/* Average Goals */}
                  {(result.scoring || result.calculatedStats) && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Avg Goals</p>
                      <p className="text-white font-semibold text-lg">
                        {parseFloat(result.scoring?.avgGoals || result.calculatedStats?.avgGoals || 0).toFixed(2)}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Per game
                      </p>
                    </div>
                  )}
                  
                  {/* Show message if no data available */}
                  {!result.analytics && !result.scoring && !result.calculatedStats && (
                    <div className="col-span-full bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                      <p className="text-yellow-300 text-sm">
                        Limited data available for this team/league combination. Historical data may be incomplete.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {searchResults.length === 0 && searchTerm && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 text-center">
          <p className="text-gray-400">No teams found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default QuickLookupTab;

