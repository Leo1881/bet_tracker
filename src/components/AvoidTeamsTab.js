import React, { useCallback, useMemo, useState } from "react";
import { fetchSheetData } from "../utils/fetchSheetData";
import { buildDynamicAvoidList } from "../services/avoidListService";

/**
 * Dynamic avoid list from Sheet1.
 * Pass `bets` from app state so the table matches recommendations;
 * Refresh reloads Sheet1 (and parent can sync via onBetsRefresh).
 */
const AvoidTeamsTab = ({ bets = [], onBetsRefresh }) => {
  const fromApp = useMemo(() => buildDynamicAvoidList(bets), [bets]);
  const [overrideList, setOverrideList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const dynamicList = overrideList ?? fromApp;

  const runRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sheetBets = await fetchSheetData("Sheet1");
      if (!sheetBets?.length) {
        throw new Error("No bets returned from Google Sheet (Sheet1).");
      }
      const list = buildDynamicAvoidList(sheetBets);
      setLastUpdated(new Date());
      if (typeof onBetsRefresh === "function") {
        onBetsRefresh(sheetBets);
        setOverrideList(null);
      } else {
        setOverrideList(list);
      }
    } catch (e) {
      setError(e.message || "Failed to build avoid list");
    } finally {
      setLoading(false);
    }
  }, [onBetsRefresh]);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Avoid teams</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Auto-built from Sheet1 using{" "}
            <span className="text-gray-300">unique matches</span> (same game on
            many slips counts once). Criteria: ≥3 matches &amp; ≥40% loss, or ≥5
            &amp; ≥30%, or ≥8 &amp; ≥25%. Used in recommendations. Refresh pulls
            the latest Sheet1.
          </p>
        </div>
        <button
          type="button"
          onClick={runRefresh}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? "Updating…" : "Refresh from Sheet1"}
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        {dynamicList.length} teams
        {lastUpdated
          ? ` · refreshed ${lastUpdated.toLocaleString()}`
          : " · from loaded Sheet1 data"}
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {dynamicList.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/20">
              <tr>
                <th className="px-3 py-2 text-left text-white font-semibold">
                  #
                </th>
                <th className="px-3 py-2 text-left text-white font-semibold">
                  Country
                </th>
                <th className="px-3 py-2 text-left text-white font-semibold">
                  League
                </th>
                <th className="px-3 py-2 text-left text-white font-semibold">
                  Team
                </th>
                <th className="px-3 py-2 text-right text-white font-semibold">
                  Matches
                </th>
                <th className="px-3 py-2 text-right text-white font-semibold">
                  W–L
                </th>
                <th className="px-3 py-2 text-right text-white font-semibold">
                  Loss %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {dynamicList.map((row, index) => (
                <tr
                  key={`${row.TEAM_NAME}-${index}`}
                  className="hover:bg-white/5"
                >
                  <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                  <td className="px-3 py-2 text-gray-200">{row.COUNTRY}</td>
                  <td className="px-3 py-2 text-gray-200">{row.LEAGUE}</td>
                  <td className="px-3 py-2 text-white font-medium">
                    {row.TEAM_NAME}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-400 tabular-nums">
                    {row.uniqueMatches ?? row.settled}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-300 tabular-nums">
                    {row.wins}-{row.losses}
                    {(row.legWins != null || row.legLosses != null) &&
                      row.legWins + row.legLosses !==
                        (row.uniqueMatches ?? row.settled) && (
                        <div className="text-[10px] text-gray-500">
                          {row.legWins}-{row.legLosses} legs
                        </div>
                      )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {row.lossRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dynamicList.length === 0 && !loading && (
        <p className="text-gray-400 text-sm">
          No teams currently meet the avoid thresholds.
        </p>
      )}
    </div>
  );
};

export default AvoidTeamsTab;
