import React, { useMemo } from "react";

const PatternAnalysisTab = ({ bets }) => {
  // Analyze all patterns from historical bets
  const patterns = useMemo(() => {
    if (!bets || bets.length === 0) {
      return {
        successPatterns: [],
        failurePatterns: [],
        teamPatterns: [],
        leaguePatterns: [],
        oddsPatterns: [],
        betslipPatterns: [],
      };
    }

    // Helper to determine if bet is home or away
    const getHomeAway = (bet) => {
      const teamIncluded = (bet.TEAM_INCLUDED || "").toLowerCase();
      const homeTeam = (bet.HOME_TEAM || "").toLowerCase();
      const awayTeam = (bet.AWAY_TEAM || "").toLowerCase();
      
      if (teamIncluded === homeTeam) return "Home";
      if (teamIncluded === awayTeam) return "Away";
      
      // Fallback: check bet selection
      const betSelection = (bet.BET_SELECTION || "").toLowerCase();
      if (betSelection.includes("home") || betSelection.includes("1")) return "Home";
      if (betSelection.includes("away") || betSelection.includes("2")) return "Away";
      
      return "Unknown";
    };

    // Helper to determine bet outcome
    const getBetOutcome = (bet) => {
      const result = (bet.RESULT || "").toLowerCase();
      if (result.includes("win")) return "win";
      if (result.includes("loss")) return "loss";
      if (result.includes("pending") || !result || result.trim() === "") return "pending";
      return "unknown";
    };

    // Helper to get odds value
    const getOddsValue = (bet) => {
      if (bet.ODDS1 && bet.ODDS2) {
        // Use the relevant odds based on bet selection
        const betSelection = (bet.BET_SELECTION || "").toLowerCase();
        if (betSelection.includes("home") || betSelection.includes("1")) return parseFloat(bet.ODDS1);
        if (betSelection.includes("away") || betSelection.includes("2")) return parseFloat(bet.ODDS2);
        return parseFloat(bet.ODDS1) || parseFloat(bet.ODDS2) || null;
      }
      return null;
    };

    // Filter completed bets only
    const completedBets = bets.filter(bet => {
      const outcome = getBetOutcome(bet);
      return outcome === "win" || outcome === "loss";
    });

    // 1. COMBINATION PATTERNS - Track all patterns, then split into success/failure
    const successPatternMap = new Map();
    
    // 2. TEAM PATTERNS
    const teamPatternMap = new Map();
    
    // 4. LEAGUE PATTERNS
    const leaguePatternMap = new Map();
    
    // 5. ODDS PATTERNS
    const oddsPatternMap = new Map();
    
    // 6. BETSLIP PATTERNS
    const betslipPatternMap = new Map();

    completedBets.forEach((bet) => {
      const outcome = getBetOutcome(bet);
      if (outcome === "pending" || outcome === "unknown") return;

      const isWin = outcome === "win";
      const betType = bet.BET_TYPE || "Unknown";
      const homeAway = getHomeAway(bet);
      const team = bet.TEAM_INCLUDED || "Unknown";
      const league = bet.LEAGUE || "Unknown";
      const country = bet.COUNTRY || "Unknown";
      const oddsValue = getOddsValue(bet);
      // BET_ID available as bet.BET_ID if needed

      // SUCCESS PATTERNS - Build combination keys
      const combinations = [
        `${homeAway} + ${betType}`,
        `${betType} + ${league}`,
        `${homeAway} + ${betType} + ${league}`,
        `${country} + ${betType}`,
        `${homeAway} + ${league}`,
      ];

      combinations.forEach((combo) => {
        // Track all patterns in a single map first, then split into success/failure
        if (!successPatternMap.has(combo)) {
          successPatternMap.set(combo, { wins: 0, losses: 0, total: 0 });
        }
        
        const stats = successPatternMap.get(combo);
        if (isWin) stats.wins++;
        else stats.losses++;
        stats.total++;
      });

      // TEAM PATTERNS
      const teamKey = `${team} - ${betType} - ${homeAway}`;
      if (!teamPatternMap.has(teamKey)) {
        teamPatternMap.set(teamKey, { wins: 0, losses: 0, total: 0, team, betType, homeAway });
      }
      const teamStats = teamPatternMap.get(teamKey);
      if (isWin) teamStats.wins++;
      else teamStats.losses++;
      teamStats.total++;

      // LEAGUE PATTERNS
      const leagueKey = `${league} - ${betType}`;
      if (!leaguePatternMap.has(leagueKey)) {
        leaguePatternMap.set(leagueKey, { wins: 0, losses: 0, total: 0, league, betType });
      }
      const leagueStats = leaguePatternMap.get(leagueKey);
      if (isWin) leagueStats.wins++;
      else leagueStats.losses++;
      leagueStats.total++;

      // ODDS PATTERNS
      if (oddsValue) {
        let oddsRange = "Unknown";
        if (oddsValue >= 1.0 && oddsValue < 1.5) oddsRange = "1.0-1.5";
        else if (oddsValue >= 1.5 && oddsValue < 2.0) oddsRange = "1.5-2.0";
        else if (oddsValue >= 2.0 && oddsValue < 3.0) oddsRange = "2.0-3.0";
        else if (oddsValue >= 3.0) oddsRange = "3.0+";

        const oddsKey = `${oddsRange} - ${betType}`;
        if (!oddsPatternMap.has(oddsKey)) {
          oddsPatternMap.set(oddsKey, { wins: 0, losses: 0, total: 0, oddsRange, betType });
        }
        const oddsStats = oddsPatternMap.get(oddsKey);
        if (isWin) oddsStats.wins++;
        else oddsStats.losses++;
        oddsStats.total++;
      }
    });

    // Process betslip patterns
    const betslipGroups = new Map();
    bets.forEach((bet) => {
      const betId = bet.BET_ID || "NO_ID";
      if (!betslipGroups.has(betId)) {
        betslipGroups.set(betId, []);
      }
      betslipGroups.get(betId).push(bet);
    });

    betslipGroups.forEach((slipBets, betId) => {
      const completedSlipBets = slipBets.filter(bet => {
        const outcome = getBetOutcome(bet);
        return outcome === "win" || outcome === "loss";
      });

      if (completedSlipBets.length === 0) return;

      const wins = completedSlipBets.filter(bet => getBetOutcome(bet) === "win").length;
      const losses = completedSlipBets.filter(bet => getBetOutcome(bet) === "loss").length;
      const winRate = completedSlipBets.length > 0 ? (wins / completedSlipBets.length) * 100 : 0;

      // Analyze betslip composition
      const betTypes = [...new Set(completedSlipBets.map(b => b.BET_TYPE))];
      const homeAwayCounts = { home: 0, away: 0 };
      completedSlipBets.forEach(bet => {
        const ha = getHomeAway(bet);
        if (ha === "Home") homeAwayCounts.home++;
        if (ha === "Away") homeAwayCounts.away++;
      });

      const composition = {
        totalBets: completedSlipBets.length,
        betTypeCount: betTypes.length,
        hasMultipleBetTypes: betTypes.length > 1,
        hasHomeAndAway: homeAwayCounts.home > 0 && homeAwayCounts.away > 0,
        allSameBetType: betTypes.length === 1,
        wins,
        losses,
        winRate,
      };

      const compositionKey = `Bets: ${composition.totalBets}, Types: ${composition.betTypeCount}, Home/Away Mix: ${composition.hasHomeAndAway}`;
      if (!betslipPatternMap.has(compositionKey)) {
        betslipPatternMap.set(compositionKey, {
          wins: 0,
          losses: 0,
          total: 0,
          composition,
        });
      }
      const slipStats = betslipPatternMap.get(compositionKey);
      if (winRate >= 70) slipStats.wins++;
      else if (winRate < 50) slipStats.losses++;
      slipStats.total++;
    });

    // Convert maps to arrays and calculate win rates
    const processPatterns = (map, minBets = 3) => {
      return Array.from(map.entries())
        .map(([key, stats]) => {
          const winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
          return {
            pattern: key,
            ...stats,
            winRate,
          };
        })
        .filter(p => p.total >= minBets)
        .sort((a, b) => b.winRate - a.winRate);
    };

    // Split patterns into success and failure
    const allPatterns = Array.from(successPatternMap.entries())
      .map(([key, stats]) => {
        const winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
        return {
          pattern: key,
          ...stats,
          winRate,
        };
      })
      .filter(p => p.total >= 3);

    const successPatterns = allPatterns.filter(p => p.winRate >= 70).sort((a, b) => b.winRate - a.winRate);
    const failurePatterns = allPatterns.filter(p => p.winRate < 50).sort((a, b) => a.winRate - b.winRate);

    const processTeamPatterns = (map, minBets = 3) => {
      return Array.from(map.entries())
        .map(([key, stats]) => {
          const winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
          return {
            ...stats,
            winRate,
          };
        })
        .filter(p => p.total >= minBets)
        .sort((a, b) => b.winRate - a.winRate);
    };

    return {
      successPatterns: successPatterns.slice(0, 20),
      failurePatterns: failurePatterns.slice(0, 20),
      teamPatterns: processTeamPatterns(teamPatternMap).slice(0, 30),
      leaguePatterns: processPatterns(leaguePatternMap).slice(0, 20),
      oddsPatterns: processPatterns(oddsPatternMap).slice(0, 15),
      betslipPatterns: processPatterns(betslipPatternMap, 2).slice(0, 15),
    };
  }, [bets]);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">📊 Pattern Analysis</h2>
      <p className="text-gray-300 mb-6">
        Discover patterns in your betting history to identify what works and what doesn't.
      </p>

      {/* Success Patterns */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-green-400 mb-4">
          ✅ Success Patterns (70%+ Win Rate)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patterns.successPatterns.length > 0 ? (
            patterns.successPatterns.map((pattern, idx) => (
              <div
                key={idx}
                className="bg-green-500/20 border border-green-500/50 rounded-lg p-4"
              >
                <div className="text-white font-semibold mb-2">{pattern.pattern}</div>
                <div className="text-green-300 text-2xl font-bold">
                  {pattern.winRate.toFixed(1)}%
                </div>
                <div className="text-gray-300 text-sm mt-1">
                  {pattern.wins}W / {pattern.losses}L ({pattern.total} bets)
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 col-span-full">
              No success patterns found (need 70%+ win rate with 3+ bets)
            </div>
          )}
        </div>
      </div>

      {/* Failure Patterns */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-red-400 mb-4">
          ❌ Failure Patterns (&lt;50% Win Rate)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patterns.failurePatterns.length > 0 ? (
            patterns.failurePatterns.map((pattern, idx) => (
              <div
                key={idx}
                className="bg-red-500/20 border border-red-500/50 rounded-lg p-4"
              >
                <div className="text-white font-semibold mb-2">{pattern.pattern}</div>
                <div className="text-red-300 text-2xl font-bold">
                  {pattern.winRate.toFixed(1)}%
                </div>
                <div className="text-gray-300 text-sm mt-1">
                  {pattern.wins}W / {pattern.losses}L ({pattern.total} bets)
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 col-span-full">
              No failure patterns found (need &lt;50% win rate with 3+ bets)
            </div>
          )}
        </div>
      </div>

      {/* Team Patterns */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-blue-400 mb-4">
          👥 Team-Specific Patterns
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/20">
              <tr>
                <th className="px-4 py-2 text-left text-white">Team</th>
                <th className="px-4 py-2 text-left text-white">Bet Type</th>
                <th className="px-4 py-2 text-left text-white">Home/Away</th>
                <th className="px-4 py-2 text-left text-white">Win Rate</th>
                <th className="px-4 py-2 text-left text-white">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {patterns.teamPatterns.length > 0 ? (
                patterns.teamPatterns.map((pattern, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="px-4 py-2 text-gray-300">{pattern.team}</td>
                    <td className="px-4 py-2 text-gray-300">{pattern.betType}</td>
                    <td className="px-4 py-2 text-gray-300">{pattern.homeAway}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                          pattern.winRate >= 70
                            ? "bg-green-100 text-green-800"
                            : pattern.winRate >= 50
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {pattern.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-300 text-sm">
                      {pattern.wins}W / {pattern.losses}L
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-center text-gray-400">
                    No team patterns found (need 3+ bets per team/bet type/home-away combo)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* League Patterns */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-purple-400 mb-4">
          🏆 League Patterns
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patterns.leaguePatterns.length > 0 ? (
            patterns.leaguePatterns.map((pattern, idx) => (
              <div
                key={idx}
                className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-4"
              >
                <div className="text-white font-semibold mb-2">{pattern.pattern}</div>
                <div className="text-purple-300 text-2xl font-bold">
                  {pattern.winRate.toFixed(1)}%
                </div>
                <div className="text-gray-300 text-sm mt-1">
                  {pattern.wins}W / {pattern.losses}L ({pattern.total} bets)
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 col-span-full">
              No league patterns found (need 3+ bets per league/bet type combo)
            </div>
          )}
        </div>
      </div>

      {/* Odds Patterns */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-yellow-400 mb-4">
          💰 Odds-Based Patterns
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patterns.oddsPatterns.length > 0 ? (
            patterns.oddsPatterns.map((pattern, idx) => (
              <div
                key={idx}
                className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4"
              >
                <div className="text-white font-semibold mb-2">{pattern.pattern}</div>
                <div className="text-yellow-300 text-2xl font-bold">
                  {pattern.winRate.toFixed(1)}%
                </div>
                <div className="text-gray-300 text-sm mt-1">
                  {pattern.wins}W / {pattern.losses}L ({pattern.total} bets)
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 col-span-full">
              No odds patterns found (need 3+ bets per odds range/bet type combo)
            </div>
          )}
        </div>
      </div>

      {/* Betslip Composition Patterns */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">
          📝 Betslip Composition Patterns
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patterns.betslipPatterns.length > 0 ? (
            patterns.betslipPatterns.map((pattern, idx) => (
              <div
                key={idx}
                className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg p-4"
              >
                <div className="text-white font-semibold mb-2">{pattern.pattern}</div>
                <div className="text-cyan-300 text-2xl font-bold">
                  {pattern.winRate.toFixed(1)}%
                </div>
                <div className="text-gray-300 text-sm mt-1">
                  {pattern.wins}W / {pattern.losses}L ({pattern.total} betslips)
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 col-span-full">
              No betslip patterns found (need 2+ betslips per composition type)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatternAnalysisTab;

