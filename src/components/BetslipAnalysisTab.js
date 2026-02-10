import React, { useState, useEffect, useCallback } from "react";
import { fetchSheetData } from "../utils/fetchSheetData";

const BetslipAnalysisTab = () => {
  const [betIds, setBetIds] = useState([]);
  const [selectedBetId, setSelectedBetId] = useState("");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  const loadBetIds = useCallback(async () => {
    try {
      const res = await fetch("/api/betslip-recommendations/bet-ids");
      if (!res.ok) throw new Error("Failed to load betslips");
      const ids = await res.json();
      setBetIds(ids);
      if (ids.length > 0 && !selectedBetId) setSelectedBetId(ids[0]);
    } catch (e) {
      setError(e.message);
      setBetIds([]);
    }
  }, [selectedBetId]);

  useEffect(() => {
    loadBetIds();
  }, [loadBetIds]);

  const loadGames = useCallback(async () => {
    if (!selectedBetId) {
      setGames([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/betslip-recommendations?bet_id=${encodeURIComponent(selectedBetId)}`
      );
      if (!res.ok) throw new Error("Failed to load games");
      const data = await res.json();
      setGames(data);
    } catch (e) {
      setError(e.message);
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBetId]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const handleCompare = async () => {
    if (!selectedBetId) return;
    setComparing(true);
    setError(null);
    try {
      const sheetRows = await fetchSheetData("Sheet1");
      const betIdKey = "BET_ID";
      const key = Object.keys(sheetRows[0] || {}).find(
        (k) => k.toUpperCase() === "BET_ID"
      );
      const rowsForBet = (sheetRows || []).filter(
        (row) => (row[key] || row[betIdKey] || "").toString().trim() === selectedBetId
      );
      if (rowsForBet.length === 0) {
        alert(
          `No rows on Sheet1 with BET_ID "${selectedBetId}". Update Sheet1 with results for this betslip first.`
        );
        setComparing(false);
        return;
      }
      const res = await fetch("/api/betslip-recommendations/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bet_id: selectedBetId,
          results: rowsForBet.map((row) => ({
            country: row.COUNTRY ?? row.country,
            league: row.LEAGUE ?? row.league,
            bet_type: row.BET_TYPE ?? row.bet_type,
            bet_selection: row.BET_SELECTION ?? row.bet_selection,
            team_included: row.TEAM_INCLUDED ?? row.team_included,
            result: row.RESULT ?? row.result,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Compare failed");
      }
      const data = await res.json();
      alert(`Updated ${data.updated} of ${data.total} games with results from Sheet1.`);
      loadGames();
    } catch (e) {
      setError(e.message);
      alert(`Error: ${e.message}`);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">Betslip Analysis</h3>
      <p className="text-gray-300 text-sm mb-4">
        Select a betslip you saved from Bet Analysis, then compare recommendations with actual results from Sheet1.
      </p>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <label className="text-white font-medium">Betslip (BET_ID)</label>
        <select
          value={selectedBetId}
          onChange={(e) => setSelectedBetId(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white min-w-[200px]"
        >
          <option value="">-- Select betslip --</option>
          {betIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <button
          onClick={loadGames}
          disabled={!selectedBetId || loading}
          className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
        <button
          onClick={handleCompare}
          disabled={!selectedBetId || comparing || games.length === 0}
          className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50"
        >
          {comparing ? "Comparing..." : "Compare with Sheet1"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-200 text-sm">
          {error}
        </div>
      )}

      {games.length === 0 && !loading && selectedBetId && (
        <p className="text-gray-400">No games saved for this betslip.</p>
      )}

      {games.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/20">
              <tr>
                <th className="px-3 py-2 text-left text-white font-semibold">Date</th>
                <th className="px-3 py-2 text-left text-white font-semibold">Match</th>
                <th className="px-3 py-2 text-left text-white font-semibold">Country / League</th>
                <th className="px-3 py-2 text-left text-white font-semibold">Bet</th>
                <th className="px-3 py-2 text-left text-white font-semibold">Recommendation</th>
                <th className="px-3 py-2 text-left text-white font-semibold">Confidence</th>
                <th className="px-3 py-2 text-left text-white font-semibold">Actual result</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {games.map((g) => (
                <tr key={g.id} className="border-b border-white/10">
                  <td className="px-3 py-2">{g.date || "—"}</td>
                  <td className="px-3 py-2">
                    {g.home_team} vs {g.away_team}
                  </td>
                  <td className="px-3 py-2">{g.country} • {g.league}</td>
                  <td className="px-3 py-2">
                    {g.bet_type} / {g.bet_selection}
                    {g.team_included ? ` (${g.team_included})` : ""}
                  </td>
                  <td className="px-3 py-2">{g.recommendation || "—"}</td>
                  <td className="px-3 py-2">{g.confidence_score != null ? g.confidence_score : "—"}</td>
                  <td className="px-3 py-2">
                    {g.actual_result ? (
                      <span className={g.actual_result.toLowerCase().includes("win") ? "text-green-400" : "text-red-400"}>
                        {g.actual_result}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BetslipAnalysisTab;
