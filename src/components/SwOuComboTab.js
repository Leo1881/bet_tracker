import React, { useCallback, useMemo, useState } from "react";
import { fetchSheetData } from "../utils/fetchSheetData";
import {
  buildDcOuComboList,
  buildSwOuComboList,
} from "../services/swOuComboService";

const MODES = {
  SW: {
    build: buildSwOuComboList,
    title: "SW + O/U combo teams",
    primaryLabel: "Straight Win",
    primaryShort: "SW",
    empty: "No teams match the SW + O/U criteria yet. Load or refresh Sheet1.",
    errorFallback: "Failed to build SW + O/U list",
  },
  DC: {
    build: buildDcOuComboList,
    title: "DC + O/U combo teams",
    primaryLabel: "Double Chance",
    primaryShort: "DC",
    empty: "No teams match the DC + O/U criteria yet. Load or refresh Sheet1.",
    errorFallback: "Failed to build DC + O/U list",
  },
};

/**
 * Combo tab: SW+OU or DC+OU via dropdown. Unique-match history from Sheet1.
 */
const SwOuComboTab = ({
  bets = [],
  onBetsRefresh,
  isTeamBlacklisted = () => false,
}) => {
  const [mode, setMode] = useState("SW"); // "SW" | "DC"
  const config = MODES[mode] || MODES.SW;
  const buildList = config.build;

  const fromApp = useMemo(
    () => buildList(bets, { limit: 35 }),
    [bets, buildList],
  );
  const [overrideByMode, setOverrideByMode] = useState({
    SW: null,
    DC: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hideBlacklisted, setHideBlacklisted] = useState(true);

  const rawList = overrideByMode[mode] ?? fromApp;

  const list = useMemo(() => {
    if (!hideBlacklisted) return rawList;
    return rawList.filter((row) => !isTeamBlacklisted(row.teamName));
  }, [rawList, hideBlacklisted, isTeamBlacklisted]);

  const runRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sheetBets = await fetchSheetData("Sheet1");
      if (!sheetBets?.length) {
        throw new Error("No bets returned from Google Sheet (Sheet1).");
      }
      const next = buildList(sheetBets, { limit: 35 });
      setLastUpdated(new Date());
      if (typeof onBetsRefresh === "function") {
        onBetsRefresh(sheetBets);
        setOverrideByMode({ SW: null, DC: null });
      } else {
        setOverrideByMode((prev) => ({ ...prev, [mode]: next }));
      }
    } catch (e) {
      setError(e.message || config.errorFallback);
    } finally {
      setLoading(false);
    }
  }, [onBetsRefresh, buildList, config.errorFallback, mode]);

  const fmtRecord = (wins, losses) => `${wins}–${losses}`;
  const fmtPct = (n) => `${(n ?? 0).toFixed(1)}%`;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{config.title}</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Top 35 teams where both{" "}
            <span className="text-gray-300">{config.primaryLabel}</span> and{" "}
            <span className="text-gray-300">Over/Under</span> hit well in your
            Sheet1 history. Counts are{" "}
            <span className="text-gray-300">unique matches</span> (same fixture
            on many slips = once; win if any settled leg on that match won).
            Need ≥6 unique {config.primaryShort} and ≥6 unique O/U matches, both
            ≥65% hit rate. Ranked by combined Wilson. Best O/U side shown when
            Over/Under splits.
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

      <div className="flex flex-wrap items-center gap-4 mb-3">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <span className="text-gray-400">Combo</span>
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              setError(null);
            }}
            className="bg-white/20 text-white text-sm rounded-md px-2 py-1.5 border border-white/20"
          >
            <option value="SW">SW + O/U</option>
            <option value="DC">DC + O/U</option>
          </select>
        </label>
        <p className="text-xs text-gray-500">
          {list.length} teams
          {hideBlacklisted && rawList.length !== list.length
            ? ` (${rawList.length - list.length} avoid-list hidden)`
            : ""}
          {lastUpdated
            ? ` · refreshed ${lastUpdated.toLocaleString()}`
            : " · from loaded Sheet1 data"}
        </p>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={hideBlacklisted}
            onChange={(e) => setHideBlacklisted(e.target.checked)}
            className="rounded border-white/20"
          />
          Hide avoid-list teams
        </label>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-gray-400 text-sm">{config.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Team</th>
                <th className="py-2 pr-3 font-medium">League</th>
                <th className="py-2 pr-3 font-medium">{config.primaryShort}</th>
                <th className="py-2 pr-3 font-medium">
                  {config.primaryShort} %
                </th>
                <th className="py-2 pr-3 font-medium">Best O/U</th>
                <th className="py-2 pr-3 font-medium">O/U %</th>
                <th className="py-2 pr-3 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row, idx) => (
                <tr
                  key={`${mode}|${row.teamName}|${row.country}|${row.league}`}
                  className="border-b border-white/5 text-gray-200 hover:bg-white/5"
                >
                  <td className="py-2.5 pr-3 text-gray-500">{idx + 1}</td>
                  <td className="py-2.5 pr-3 font-medium text-white">
                    {row.teamName}
                  </td>
                  <td className="py-2.5 pr-3 text-gray-400">
                    {row.country} · {row.league}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {fmtRecord(row.primaryWins, row.primaryLosses)}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums text-emerald-300">
                    {fmtPct(row.primaryRate)}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="text-sky-300">{row.bestOuLabel}</span>{" "}
                    <span className="tabular-nums text-gray-300">
                      {fmtRecord(row.bestOuWins, row.bestOuLosses)}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums text-emerald-300">
                    {fmtPct(row.bestOuRate)}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums text-gray-400">
                    {row.comboScore.toFixed(1)}
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

export default SwOuComboTab;
