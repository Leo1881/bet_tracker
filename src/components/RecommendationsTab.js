import React, { useState, useMemo } from "react";

// Helper: is a single card (bestBet, primary, secondary, tertiary) ticket-ready?
const isCardTicketReady = (card) => {
  if (!card?.recommendation) return false;
  const conf = parseFloat(card.recommendation.confidence);
  if (isNaN(conf)) return false;
  if (card.recommendation.bet === "AVOID") return false;
  if (card.oddsPerformance?.type === "warning") return false;

  // Exception: Straight Win with very high confidence (≥85%) and no red odds counts as ticket-ready even if risk is High
  if (card.type === "Straight Win" && conf >= 85) return true;

  // Standard rules: confidence ≥70%, risk ≠ High
  if (conf < 70) return false;
  if ((card.riskLevel || "").toLowerCase() === "high") return false;
  return true;
};

// Helper: does this rec have at least one ticket-ready card?
const hasAnyTicketReady = (rec) =>
  (rec.bestBet && isCardTicketReady(rec.bestBet)) ||
  (rec.primary && isCardTicketReady(rec.primary)) ||
  (rec.secondary && isCardTicketReady(rec.secondary)) ||
  (rec.tertiary && isCardTicketReady(rec.tertiary));

const HIGH_SCORING_THRESHOLD = 2; // 2 or higher

const RecommendationsTab = ({ betRecommendations, scoringAnalysis = [] }) => {
  const [sortBy, setSortBy] = useState("confidence"); // confidence, odds, risk
  const [sortOrder, setSortOrder] = useState("desc"); // asc, desc
  const [filterConfidence, setFilterConfidence] = useState("all"); // all, high, medium, low
  const [filterRisk, setFilterRisk] = useState("all"); // all, high, medium, low
  const [filterHasAvoid, setFilterHasAvoid] = useState("all"); // all, yes, no
  const [filterTicketReady, setFilterTicketReady] = useState(false);
  const [subTab, setSubTab] = useState("recommendations"); // "recommendations" | "scoring"
  const [scoringSortKey, setScoringSortKey] = useState("avgGoalsScored");
  const [scoringSortOrder, setScoringSortOrder] = useState("desc");

  const handleScoringSort = (key) => {
    if (scoringSortKey === key) {
      setScoringSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setScoringSortKey(key);
      setScoringSortOrder(key === "team" || key === "league" ? "asc" : "desc");
    }
  };

  // Set of uploaded teams: "teamName|league" (from current recommendations)
  const uploadedTeamKeys = useMemo(() => {
    const keys = new Set();
    if (!betRecommendations || betRecommendations.length === 0) return keys;
    betRecommendations.forEach((rec) => {
      const parts = (rec.match || "").split(" vs ").map((s) => s.trim());
      const league = (rec.league || "").toLowerCase();
      parts.forEach((teamName) => {
        if (teamName) keys.add(`${teamName.toLowerCase()}|${league}`);
      });
    });
    return keys;
  }, [betRecommendations]);

  // Scoring data only for uploaded teams: avg goals scored >= 2.5 (no min games)
  const highScoringTeams = useMemo(() => {
    if (!scoringAnalysis || scoringAnalysis.length === 0 || uploadedTeamKeys.size === 0) return [];
    return scoringAnalysis
      .filter((stat) => {
        const key = `${(stat.team || "").toLowerCase()}|${(stat.league || "").toLowerCase()}`;
        if (!uploadedTeamKeys.has(key)) return false;
        const avgScored = parseFloat(stat.avgGoalsScored || 0);
        return avgScored >= HIGH_SCORING_THRESHOLD;
      })
      .map((stat) => ({
        team: stat.team,
        league: stat.league,
        country: stat.country || "",
        avgGoalsScored: parseFloat(stat.avgGoalsScored || 0),
        totalGames: stat.totalGames || 0,
      }))
      .sort((a, b) => b.avgGoalsScored - a.avgGoalsScored);
  }, [scoringAnalysis, uploadedTeamKeys]);

  const sortedScoringTeams = useMemo(() => {
    const list = [...highScoringTeams];
    const dir = scoringSortOrder === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let aVal, bVal;
      if (scoringSortKey === "team") {
        aVal = (a.team || "").toLowerCase();
        bVal = (b.team || "").toLowerCase();
        return dir * (aVal < bVal ? -1 : aVal > bVal ? 1 : 0);
      }
      if (scoringSortKey === "league") {
        aVal = `${a.country || ""} ${a.league || ""}`.toLowerCase();
        bVal = `${b.country || ""} ${b.league || ""}`.toLowerCase();
        return dir * (aVal < bVal ? -1 : aVal > bVal ? 1 : 0);
      }
      if (scoringSortKey === "avgGoalsScored") {
        aVal = a.avgGoalsScored;
        bVal = b.avgGoalsScored;
        return dir * (aVal - bVal);
      }
      if (scoringSortKey === "totalGames") {
        aVal = a.totalGames || 0;
        bVal = b.totalGames || 0;
        return dir * (aVal - bVal);
      }
      return 0;
    });
    return list;
  }, [highScoringTeams, scoringSortKey, scoringSortOrder]);

  // Filter and sort recommendations
  const filteredAndSortedRecommendations = useMemo(() => {
    let filtered = [...betRecommendations];

    // Ticket-ready only: show games with at least one pick that passes confidence ≥70, risk ≠ High, not AVOID, no red odds warning
    if (filterTicketReady) {
      filtered = filtered.filter(hasAnyTicketReady);
    }

    // Apply filters
    if (filterConfidence !== "all") {
      filtered = filtered.filter((rec) => {
        const confidence = rec.confidence || 0;
        if (filterConfidence === "high") return confidence >= 70;
        if (filterConfidence === "medium") return confidence >= 50 && confidence < 70;
        if (filterConfidence === "low") return confidence < 50;
        return true;
      });
    }

    if (filterRisk !== "all") {
      filtered = filtered.filter((rec) => {
        const riskLevel = rec.bestBet?.riskLevel || rec.primary?.riskLevel || "Medium";
        return riskLevel.toLowerCase() === filterRisk.toLowerCase();
      });
    }

    if (filterHasAvoid !== "all") {
      filtered = filtered.filter((rec) => {
        const hasAvoid =
          rec.bestBet?.recommendation?.bet === "AVOID" ||
          rec.primary?.recommendation?.bet === "AVOID" ||
          rec.secondary?.recommendation?.bet === "AVOID" ||
          rec.tertiary?.recommendation?.bet === "AVOID";
        return filterHasAvoid === "yes" ? hasAvoid : !hasAvoid;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      if (sortBy === "confidence") {
        aValue = a.confidence || 0;
        bValue = b.confidence || 0;
      } else if (sortBy === "odds") {
        aValue = parseFloat(a.odds) || 0;
        bValue = parseFloat(b.odds) || 0;
      } else if (sortBy === "risk") {
        const getRiskValue = (rec) => {
          const risk = rec.bestBet?.riskLevel || rec.primary?.riskLevel || "Medium";
          if (risk.toLowerCase() === "high") return 3;
          if (risk.toLowerCase() === "medium") return 2;
          return 1;
        };
        aValue = getRiskValue(a);
        bValue = getRiskValue(b);
      } else {
        return 0;
      }

      if (sortOrder === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [betRecommendations, sortBy, sortOrder, filterConfidence, filterRisk, filterHasAvoid, filterTicketReady]);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        🎯 Bet Recommendations
      </h3>
      <div className="text-gray-300 mb-6">
        <p>
          Betting recommendations ranked by risk-adjusted confidence scores.
          Each match shows:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            <span className="text-purple-300">⭐ BEST BET</span> - Optimal bet considering team-specific performance, confidence, odds value, and risk
          </li>
          <li>
            <span className="text-yellow-300">🥇 PRIMARY</span> - Best bet with
            highest confidence
          </li>
          <li>
            <span className="text-gray-300">🥈 SECONDARY</span> - Second best
            option
          </li>
          <li>
            <span className="text-orange-300">🥉 TERTIARY</span> - Third option
            or AVOID if low confidence
          </li>
        </ul>
        <p className="mt-2">
          Run "Fetch & Analyze New Bets" in the Bet Analysis tab to generate
          recommendations.
        </p>
      </div>

      {/* Sub-tabs: Recommendations | Scoring */}
      <div className="flex gap-2 mb-6 border-b border-white/20 pb-2">
        <button
          type="button"
          onClick={() => setSubTab("recommendations")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === "recommendations"
              ? "bg-blue-500 text-white"
              : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
          }`}
        >
          Recommendations
        </button>
        <button
          type="button"
          onClick={() => setSubTab("scoring")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === "scoring"
              ? "bg-blue-500 text-white"
              : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
          }`}
        >
          Scoring (avg scored ≥ 2)
        </button>
      </div>

      {subTab === "scoring" ? (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            <strong className="text-white">Only teams from your uploaded games.</strong> Shown where average goals scored is 2+. Run &quot;Analyze Scoring Patterns&quot; in Scoring Analysis if empty.
          </p>
          {highScoringTeams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/20">
                  <tr>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 select-none"
                      onClick={() => handleScoringSort("team")}
                    >
                      <span className="flex items-center gap-1">
                        Team
                        {scoringSortKey === "team" && (scoringSortOrder === "asc" ? " ↑" : " ↓")}
                      </span>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 select-none"
                      onClick={() => handleScoringSort("league")}
                    >
                      <span className="flex items-center gap-1">
                        League
                        {scoringSortKey === "league" && (scoringSortOrder === "asc" ? " ↑" : " ↓")}
                      </span>
                    </th>
                    <th
                      className="px-4 py-2 text-right text-white font-semibold cursor-pointer hover:bg-white/10 select-none"
                      onClick={() => handleScoringSort("avgGoalsScored")}
                    >
                      <span className="flex items-center gap-1 justify-end">
                        Avg scored
                        {scoringSortKey === "avgGoalsScored" && (scoringSortOrder === "asc" ? " ↑" : " ↓")}
                      </span>
                    </th>
                    <th
                      className="px-4 py-2 text-right text-white font-semibold cursor-pointer hover:bg-white/10 select-none"
                      onClick={() => handleScoringSort("totalGames")}
                    >
                      <span className="flex items-center gap-1 justify-end">
                        Games
                        {scoringSortKey === "totalGames" && (scoringSortOrder === "asc" ? " ↑" : " ↓")}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {sortedScoringTeams.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="px-4 py-2 text-white font-medium">{row.team}</td>
                      <td className="px-4 py-2 text-gray-300">{row.country} — {row.league}</td>
                      <td className="px-4 py-2 text-right text-green-300 font-mono">{row.avgGoalsScored.toFixed(1)}</td>
                      <td className="px-4 py-2 text-right text-gray-400">{row.totalGames}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
              <p className="text-gray-400">
                No uploaded teams with avg goals scored 2+. Run &quot;Analyze Scoring Patterns&quot; in the Scoring Analysis tab, or upload games and run bet analysis first.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Filter and Sort Controls - compact toolbar */}
      {betRecommendations.length > 0 && (
        <div className="mb-5 bg-white/5 rounded-lg px-4 py-3 border border-white/10">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-xs whitespace-nowrap">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/20 text-white text-sm rounded-md px-2 py-1.5 border border-white/20"
              >
                <option value="confidence">Confidence</option>
                <option value="odds">Odds</option>
                <option value="risk">Risk</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-white/20 text-white text-sm rounded-md px-2 py-1.5 border border-white/20"
              >
                <option value="desc">↓</option>
                <option value="asc">↑</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-xs whitespace-nowrap">Confidence</label>
              <select
                value={filterConfidence}
                onChange={(e) => setFilterConfidence(e.target.value)}
                className="bg-white/20 text-white text-sm rounded-md px-2 py-1.5 border border-white/20"
              >
                <option value="all">All</option>
                <option value="high">70%+</option>
                <option value="medium">50–70%</option>
                <option value="low">&lt;50%</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-xs whitespace-nowrap">Risk</label>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="bg-white/20 text-white text-sm rounded-md px-2 py-1.5 border border-white/20"
              >
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-xs whitespace-nowrap">AVOID</label>
              <select
                value={filterHasAvoid}
                onChange={(e) => setFilterHasAvoid(e.target.value)}
                className="bg-white/20 text-white text-sm rounded-md px-2 py-1.5 border border-white/20"
              >
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={filterTicketReady}
                onChange={(e) => setFilterTicketReady(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/30 bg-white/10 text-green-500 focus:ring-green-500 focus:ring-offset-0"
              />
              <span className="text-xs text-gray-400">Ticket-ready only</span>
            </label>
            <span className="text-xs text-gray-500 ml-auto">
              {filteredAndSortedRecommendations.length} of {betRecommendations.length}
            </span>
          </div>
        </div>
      )}

      {betRecommendations.length > 0 ? (
        <div className="space-y-6">
          {filteredAndSortedRecommendations.map((rec, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
            >
              {/* Match header: one clear strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-white/5 border-b border-white/10">
                <div>
                  <h4 className="text-lg font-bold text-white">{rec.match}</h4>
                  <p className="text-gray-400 text-sm mt-0.5">{rec.country} · {rec.league}</p>
                </div>
                <div className="flex items-baseline gap-4 text-sm">
                  <span className="text-blue-400 font-medium">{rec.confidence.toFixed(1)}%</span>
                  <span className="text-gray-500">Odds {rec.odds}</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Your pick: agree / disagree - compact */}
                {rec.proposedBetVerdict != null && (
                  <div className={`rounded-lg px-3 py-2 border ${rec.proposedBetVerdict.agrees ? "bg-green-500/10 border-green-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
                    <div className="text-sm">
                      <span className="text-gray-400">Your pick: </span>
                      <span className="text-white font-medium">{rec.proposedBetLabel || "—"}</span>
                      <span className="text-gray-400"> · </span>
                      {rec.proposedBetVerdict.agrees ? (
                        <span className="text-green-400 font-medium">We agree ✓</span>
                      ) : (
                        <>
                          <span className="text-amber-400 font-medium">We disagree</span>
                          {rec.proposedBetVerdict.reason && (
                            <p className="mt-1.5 text-gray-300 text-xs leading-relaxed">
                              {rec.proposedBetVerdict.reason}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent form: single compact row on desktop */}
                {rec.recentFormData && (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                    <span className="text-gray-400 font-medium">Form (last 5)</span>
                    <span className="text-gray-300">
                      <span className="text-green-400">{rec.recentFormData.homeWins}W</span>
                      <span className="text-yellow-400 mx-0.5">{rec.recentFormData.homeDraws}D</span>
                      <span className="text-red-400">{rec.recentFormData.homeLosses}L</span>
                      {rec.recentFormData.homeSequence?.length > 0 && (
                        <span className="ml-1.5 text-gray-500 font-mono">
                          ({rec.recentFormData.homeSequence.join(" ")})
                        </span>
                      )}
                      <span className="text-gray-500 ml-1">Home</span>
                    </span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-300">
                      <span className="text-green-400">{rec.recentFormData.awayWins}W</span>
                      <span className="text-yellow-400 mx-0.5">{rec.recentFormData.awayDraws}D</span>
                      <span className="text-red-400">{rec.recentFormData.awayLosses}L</span>
                      {rec.recentFormData.awaySequence?.length > 0 && (
                        <span className="ml-1.5 text-gray-500 font-mono">
                          ({rec.recentFormData.awaySequence.join(" ")})
                        </span>
                      )}
                      <span className="text-gray-500 ml-1">Away</span>
                    </span>
                  </div>
                )}

                {/* Recommendation cards - clear section */}
                <div className="pt-1">
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${filterTicketReady ? "lg:grid-cols-2" : (rec.bestBet ? "lg:grid-cols-4" : "lg:grid-cols-3")}`}>
                {/* Best Bet Card */}
                {rec.bestBet && (!filterTicketReady || isCardTicketReady(rec.bestBet)) && (
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-400/40 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-lg">⭐</span>
                      <span className="text-purple-300 font-semibold text-xs uppercase tracking-wide">Best bet</span>
                    </div>
                    <div className="text-white font-medium text-sm">{rec.bestBet.type}</div>
                    <div className={`text-sm font-semibold ${rec.bestBet.recommendation.bet === "AVOID" ? "text-red-400" : "text-purple-300"}`}>
                      {rec.bestBet.recommendation.bet === "AVOID"
                        ? `AVOID (${rec.bestBet.recommendation.confidence.toFixed(1)}%)`
                        : `${rec.bestBet.recommendation.bet} (${rec.bestBet.recommendation.confidence.toFixed(1)}%)`}
                    </div>
                    {rec.bestBet.recommendation.bet === "AVOID" && (
                      <div className="text-red-300 text-xs mt-1 leading-relaxed">{rec.bestBet.recommendation.reasoning}</div>
                    )}
                    <div className="text-gray-400 text-xs mt-1">Risk: {rec.bestBet.riskLevel}</div>
                    {rec.bestBet.oddsPerformance && (
                      <div className={`text-xs mt-1.5 px-2 py-0.5 rounded ${rec.bestBet.oddsPerformance.type === "warning" ? "bg-red-500/20 text-red-300" : rec.bestBet.oddsPerformance.type === "no_data" ? "bg-gray-500/20 text-gray-400" : "bg-blue-500/20 text-blue-300"}`}>
                        {rec.bestBet.oddsPerformance.message}
                      </div>
                    )}
                  </div>
                )}

                {/* Primary Recommendation */}
                {rec.primary && (!filterTicketReady || isCardTicketReady(rec.primary)) && (
                  <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-400/30 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-lg">🥇</span>
                      <span className="text-yellow-300 font-semibold text-xs uppercase tracking-wide">Primary</span>
                    </div>
                    <div className="text-white font-medium text-sm">{rec.primary.type}</div>
                    <div className={`text-sm ${rec.primary.recommendation.bet === "AVOID" ? "text-red-400" : "text-green-400"}`}>
                      {rec.primary.recommendation.bet === "AVOID" ? `AVOID (${rec.primary.recommendation.confidence.toFixed(1)}%)` : `${rec.primary.recommendation.bet} (${rec.primary.recommendation.confidence.toFixed(1)}%)`}
                    </div>
                    {rec.primary.recommendation.bet === "AVOID" && <div className="text-red-300 text-xs mt-1 leading-relaxed">{rec.primary.recommendation.reasoning}</div>}
                    <div className="text-gray-400 text-xs mt-1">Risk: {rec.primary.riskLevel}</div>
                    {rec.primary.oddsPerformance && (
                      <div className={`text-xs mt-1.5 px-2 py-0.5 rounded ${rec.primary.oddsPerformance.type === "warning" ? "bg-red-500/20 text-red-300" : rec.primary.oddsPerformance.type === "no_data" ? "bg-gray-500/20 text-gray-400" : "bg-blue-500/20 text-blue-300"}`}>
                        {rec.primary.oddsPerformance.message}
                      </div>
                    )}
                  </div>
                )}

                {/* Secondary Recommendation */}
                {rec.secondary && (!filterTicketReady || isCardTicketReady(rec.secondary)) && (
                  <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-400/30 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-lg">🥈</span>
                      <span className="text-gray-300 font-semibold text-xs uppercase tracking-wide">Secondary</span>
                    </div>
                    <div className="text-white font-medium text-sm">{rec.secondary.type}</div>
                    <div className={`text-sm ${rec.secondary.recommendation.bet === "AVOID" ? "text-red-400" : "text-blue-400"}`}>
                      {rec.secondary.recommendation.bet === "AVOID" ? `AVOID (${rec.secondary.recommendation.confidence.toFixed(1)}%)` : `${rec.secondary.recommendation.bet} (${rec.secondary.recommendation.confidence.toFixed(1)}%)`}
                    </div>
                    {rec.secondary.recommendation.bet === "AVOID" && <div className="text-red-300 text-xs mt-1 leading-relaxed">{rec.secondary.recommendation.reasoning}</div>}
                    <div className="text-gray-400 text-xs mt-1">Risk: {rec.secondary.riskLevel}</div>
                    {rec.secondary.oddsPerformance && (
                      <div className={`text-xs mt-1.5 px-2 py-0.5 rounded ${rec.secondary.oddsPerformance.type === "warning" ? "bg-red-500/20 text-red-300" : rec.secondary.oddsPerformance.type === "no_data" ? "bg-gray-500/20 text-gray-400" : "bg-blue-500/20 text-blue-300"}`}>
                        {rec.secondary.oddsPerformance.message}
                      </div>
                    )}
                  </div>
                )}

                {/* Tertiary Recommendation */}
                {rec.tertiary && (!filterTicketReady || isCardTicketReady(rec.tertiary)) && (
                  <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-400/30 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-lg">🥉</span>
                      <span className="text-orange-300 font-semibold text-xs uppercase tracking-wide">Tertiary</span>
                    </div>
                    <div className="text-white font-medium text-sm">{rec.tertiary.type}</div>
                    <div className={`text-sm ${rec.tertiary.recommendation.bet === "AVOID" ? "text-red-400" : "text-orange-400"}`}>
                      {rec.tertiary.recommendation.bet === "AVOID" ? `AVOID (${rec.tertiary.recommendation.confidence.toFixed(1)}%)` : `${rec.tertiary.recommendation.bet} (${rec.tertiary.recommendation.confidence.toFixed(1)}%)`}
                    </div>
                    {rec.tertiary.recommendation.bet === "AVOID" && <div className="text-red-300 text-xs mt-1 leading-relaxed">{rec.tertiary.recommendation.reasoning}</div>}
                    <div className="text-gray-400 text-xs mt-1">Risk: {rec.tertiary.riskLevel}</div>
                    {rec.tertiary.oddsPerformance && (
                      <div className={`text-xs mt-1.5 px-2 py-0.5 rounded ${rec.tertiary.oddsPerformance.type === "warning" ? "bg-red-500/20 text-red-300" : rec.tertiary.oddsPerformance.type === "no_data" ? "bg-gray-500/20 text-gray-400" : "bg-blue-500/20 text-blue-300"}`}>
                        {rec.tertiary.oddsPerformance.message}
                      </div>
                    )}
                  </div>
                )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🎯</div>
          <h4 className="text-lg font-semibold text-white mb-2">
            No Recommendations Yet
          </h4>
          <p className="text-gray-300">
            Run "Fetch & Analyze New Bets" in the Bet Analysis tab to generate
            betting recommendations.
          </p>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default RecommendationsTab;
