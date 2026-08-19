import React, { useCallback, useState } from "react";
import { fetchSheetData } from "../utils/fetchSheetData";
import { analyzeLossPatterns } from "../services/lossPatternAnalysisService";

function StatCard({ value, label, tone }) {
  const toneClass =
    tone === "danger"
      ? "text-red-300"
      : tone === "success"
        ? "text-green-300"
        : tone === "warning"
          ? "text-amber-300"
          : "text-white";
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function RateBar({ rate, max = 100 }) {
  const width = Math.min(100, Math.max(0, (rate / max) * 100));
  const color =
    rate >= 40 ? "bg-red-400" : rate >= 25 ? "bg-amber-400" : "bg-blue-400";
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-white/10 rounded overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs text-gray-300 w-12 text-right">{rate}%</span>
    </div>
  );
}

function SimpleTable({ headers, rows, columnAlign }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-white/10">
          <tr>
            {headers.map((h, i) => (
              <th
                key={h}
                className={`px-3 py-2 text-gray-300 font-medium ${
                  columnAlign?.[i] === "right" ? "text-right" : "text-left"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-white/5">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-3 py-2 text-gray-200 ${
                    columnAlign?.[ci] === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const LossPatternsTab = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bets = await fetchSheetData("Sheet1");
      if (!bets || bets.length === 0) {
        throw new Error("No bets returned from Google Sheet (Sheet1).");
      }
      const result = analyzeLossPatterns(bets);
      setAnalysis(result);
    } catch (e) {
      setError(e.message || "Failed to analyze loss patterns");
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const o = analysis?.overall;
  const scored = analysis?.lossScoreStats;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">Loss Patterns</h3>
          <p className="text-sm text-gray-400 mt-1">
            Fresh analysis of every settled leg from Google Sheet (Sheet1). Hit
            Rerun anytime after new results land.
          </p>
          {analysis?.analyzedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Last run: {new Date(analysis.analyzedAt).toLocaleString()}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={runAnalysis}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-[#3982db] hover:bg-[#2f6eb8] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Analyzing…" : analysis ? "Rerun analysis" : "Run analysis"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-2">No analysis yet.</p>
          <p className="text-sm">
            Click <span className="text-white font-medium">Run analysis</span> to
            pull Sheet1 and find where your bets go wrong.
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-400">
          Fetching Sheet1 and computing patterns…
        </div>
      )}

      {analysis && !loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard value={o.decided.toLocaleString()} label="Settled legs" />
            <StatCard
              value={o.losses.toLocaleString()}
              label="Losses"
              tone="danger"
            />
            <StatCard value={`${o.winRate}%`} label="Win rate" tone="success" />
            <StatCard
              value={`${o.lossRate}%`}
              label="Overall loss rate"
              tone="danger"
            />
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <div className="font-semibold text-amber-200 mb-1">
              Clearest pattern: price creep
            </div>
            Loss rate rises sharply as the price on the team you back increases.
            Most volume sits under 1.40; the damage is concentrated when you
            reach for bigger odds.
          </div>

          <section className="space-y-3">
            <h4 className="text-white font-semibold">
              Loss rate by price on backed team
            </h4>
            <div className="space-y-2 bg-white/5 rounded-lg border border-white/10 p-4">
              {analysis.byOdds.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-gray-300 w-36 shrink-0">
                    {row.key}{" "}
                    <span className="text-gray-500">({row.n.toLocaleString()})</span>
                  </span>
                  <RateBar rate={row.lossRate} max={40} />
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="space-y-3">
              <h4 className="text-white font-semibold">By bet type</h4>
              <div className="space-y-2 bg-white/5 rounded-lg border border-white/10 p-4">
                {analysis.byType.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-gray-300 truncate">
                      {row.key}{" "}
                      <span className="text-gray-500">
                        ({row.n.toLocaleString()})
                      </span>
                    </span>
                    <RateBar rate={row.lossRate} max={40} />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-white font-semibold">Home vs away</h4>
              <div className="grid grid-cols-2 gap-3">
                {analysis.byHomeAway.map((row) => (
                  <StatCard
                    key={row.key}
                    value={`${row.lossRate}%`}
                    label={`${row.key} (${row.n.toLocaleString()})`}
                    tone={row.lossRate >= 20 ? "danger" : undefined}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <StatCard
                  value={`${scored.drawPct}%`}
                  label="Losses that were draws"
                  tone="warning"
                />
                <StatCard
                  value={`${scored.lostByOneGoalPct}%`}
                  label="Decided by 1 goal"
                  tone="warning"
                />
                <StatCard
                  value={scored.avgTotalGoals}
                  label="Avg goals in losses"
                />
              </div>
            </section>
          </div>

          <section className="space-y-3">
            <h4 className="text-white font-semibold">By bet selection</h4>
            <SimpleTable
              headers={["Selection", "Legs", "Losses", "Loss rate"]}
              columnAlign={["left", "right", "right", "right"]}
              rows={analysis.bySelection.map((r) => [
                r.key,
                r.n.toLocaleString(),
                r.loss.toLocaleString(),
                `${r.lossRate}%`,
              ])}
            />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="space-y-3">
              <h4 className="text-white font-semibold">
                Worst leagues (min 25 legs)
              </h4>
              <SimpleTable
                headers={["League", "Legs", "Lost", "Rate"]}
                columnAlign={["left", "right", "right", "right"]}
                rows={analysis.byLeagueRate.map((r) => [
                  r.key,
                  r.n,
                  r.loss,
                  `${r.lossRate}%`,
                ])}
              />
            </section>
            <section className="space-y-3">
              <h4 className="text-white font-semibold">
                Worst countries (min 30 legs)
              </h4>
              <SimpleTable
                headers={["Country", "Legs", "Lost", "Rate"]}
                columnAlign={["left", "right", "right", "right"]}
                rows={analysis.byCountryRate.map((r) => [
                  r.key,
                  r.n,
                  r.loss,
                  `${r.lossRate}%`,
                ])}
              />
            </section>
          </div>

          <section className="space-y-3">
            <h4 className="text-white font-semibold">
              Worst teams by loss rate (by bet type, min 5 legs)
            </h4>
            <p className="text-xs text-gray-400">
              Same club can look bad on Straight Win but fine on Double Chance —
              these rows are split so they are not mixed.
            </p>
            <SimpleTable
              headers={["Team", "Bet type", "Legs", "Losses", "Loss rate"]}
              columnAlign={["left", "left", "right", "right", "right"]}
              rows={(analysis.byTeamByType || []).map((r) => [
                r.team,
                r.betType,
                r.n,
                r.loss,
                `${r.lossRate}%`,
              ])}
            />
          </section>

          <section className="space-y-3">
            <h4 className="text-white font-semibold">Most common losing scores</h4>
            <SimpleTable
              headers={["Scoreline", "Losing legs"]}
              columnAlign={["left", "right"]}
              rows={scored.topScores.map((s) => [
                s.key,
                s.n.toLocaleString(),
              ])}
            />
          </section>

          <section className="space-y-3">
            <h4 className="text-white font-semibold">Loss rate by month</h4>
            <div className="space-y-2 bg-white/5 rounded-lg border border-white/10 p-4">
              {analysis.byMonth.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-gray-300 w-16">{row.key}</span>
                  <RateBar rate={row.lossRate} max={40} />
                  <span className="text-xs text-gray-500 w-16 text-right">
                    n={row.n}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-100">
            <div className="font-semibold text-green-200 mb-2">Takeaways</div>
            <ol className="list-decimal list-inside space-y-1 text-green-100/90">
              {analysis.takeaways.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
};

export default LossPatternsTab;
