import React, { useCallback, useState } from "react";
import { fetchSheetData } from "../utils/fetchSheetData";
import { analyzeWinPatterns } from "../services/winPatternAnalysisService";

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

function RateBar({ rate, max = 100, good }) {
  const width = Math.min(100, Math.max(0, (rate / max) * 100));
  const color = good
    ? rate >= 80
      ? "bg-emerald-400"
      : rate >= 70
        ? "bg-green-400"
        : "bg-teal-400"
    : rate >= 40
      ? "bg-red-400"
      : rate >= 25
        ? "bg-amber-400"
        : "bg-blue-400";
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-white/10 rounded overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs text-gray-300 w-12 text-right">{rate}%</span>
    </div>
  );
}

function LiftBadge({ lift }) {
  if (lift == null || Number.isNaN(lift)) return null;
  const positive = lift >= 0;
  return (
    <span
      className={`text-xs tabular-nums ${
        positive ? "text-emerald-300" : "text-red-300"
      }`}
    >
      {positive ? "+" : ""}
      {lift}
    </span>
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

const WinPatternsTab = () => {
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
      const result = analyzeWinPatterns(bets);
      setAnalysis(result);
    } catch (e) {
      setError(e.message || "Failed to analyze win patterns");
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const o = analysis?.overall;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">Win Patterns</h3>
          <p className="text-sm text-gray-400 mt-1">
            Where your settled Sheet1 legs actually hit — venue, odds, market,
            and combo recipes. Ranked by win rate and lift vs your overall
            baseline (not just raw win count).
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
            pull Sheet1 and find your successful setups.
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-400">
          Fetching Sheet1 and computing win patterns…
        </div>
      )}

      {analysis && !loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard value={o.decided.toLocaleString()} label="Settled legs" />
            <StatCard
              value={o.wins.toLocaleString()}
              label="Wins"
              tone="success"
            />
            <StatCard value={`${o.winRate}%`} label="Overall win rate" tone="success" />
            <StatCard
              value={`${o.lossRate}%`}
              label="Overall loss rate"
              tone="danger"
            />
          </div>

          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <div className="font-semibold text-emerald-200 mb-1">
              How to read this
            </div>
            <span className="text-emerald-100/90">
              Lift = segment win % minus your overall {o.winRate}%. Focus on
              high lift with enough volume (recipes need ≥40 legs). Short prices
              always win a lot — lift tells you what actually beats your baseline.
            </span>
          </div>

          <section className="space-y-3">
            <h4 className="text-white font-semibold">
              Top winning recipes (venue · market · odds, min 40)
            </h4>
            <p className="text-xs text-gray-400">
              Best combo setups sorted by lift. Example: Home · Straight Win ·
              &lt;1.40
            </p>
            <SimpleTable
              headers={["Recipe", "Legs", "Wins", "Win %", "Lift"]}
              columnAlign={["left", "right", "right", "right", "right"]}
              rows={(analysis.recipes || []).map((r) => [
                r.key,
                r.n.toLocaleString(),
                r.wins.toLocaleString(),
                `${r.winRate}%`,
                <LiftBadge key={`${r.key}-lift`} lift={r.lift} />,
              ])}
            />
            {(analysis.recipes || []).length === 0 && (
              <p className="text-sm text-gray-400">
                No recipes cleared the volume bar yet.
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h4 className="text-white font-semibold">
              Win rate by price on backed team
            </h4>
            <div className="space-y-2 bg-white/5 rounded-lg border border-white/10 p-4">
              {analysis.byOdds.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-gray-300 w-36 shrink-0">
                    {row.key}{" "}
                    <span className="text-gray-500">
                      ({row.n.toLocaleString()})
                    </span>
                  </span>
                  <RateBar rate={row.winRate} max={100} good />
                  <LiftBadge lift={row.lift} />
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
                    <RateBar rate={row.winRate} max={100} good />
                    <LiftBadge lift={row.lift} />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-white font-semibold">Home vs away</h4>
              <div className="grid grid-cols-2 gap-3">
                {analysis.byHomeAway.map((row) => (
                  <div key={row.key} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                    <div className="text-2xl font-bold text-green-300">
                      {row.winRate}%
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {row.key} ({row.n.toLocaleString()})
                    </div>
                    <div className="mt-1">
                      <LiftBadge lift={row.lift} />
                      <span className="text-xs text-gray-500 ml-1">lift</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="space-y-3">
            <h4 className="text-white font-semibold">
              Best selections (min 20 legs)
            </h4>
            <SimpleTable
              headers={["Selection", "Legs", "Wins", "Win %", "Lift"]}
              columnAlign={["left", "right", "right", "right", "right"]}
              rows={analysis.bySelection.map((r) => [
                r.key,
                r.n.toLocaleString(),
                r.wins.toLocaleString(),
                `${r.winRate}%`,
                <LiftBadge key={`${r.key}-s`} lift={r.lift} />,
              ])}
            />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="space-y-3">
              <h4 className="text-white font-semibold">
                Best leagues (min 25 legs)
              </h4>
              <SimpleTable
                headers={["League", "Legs", "Win %", "Lift"]}
                columnAlign={["left", "right", "right", "right"]}
                rows={analysis.byLeagueRate.map((r) => [
                  r.key,
                  r.n,
                  `${r.winRate}%`,
                  <LiftBadge key={`${r.key}-l`} lift={r.lift} />,
                ])}
              />
            </section>
            <section className="space-y-3">
              <h4 className="text-white font-semibold">
                Best countries (min 30 legs)
              </h4>
              <SimpleTable
                headers={["Country", "Legs", "Win %", "Lift"]}
                columnAlign={["left", "right", "right", "right"]}
                rows={analysis.byCountryRate.map((r) => [
                  r.key,
                  r.n,
                  `${r.winRate}%`,
                  <LiftBadge key={`${r.key}-c`} lift={r.lift} />,
                ])}
              />
            </section>
          </div>

          <section className="space-y-3">
            <h4 className="text-white font-semibold">
              Best teams by market (min 8 legs)
            </h4>
            <SimpleTable
              headers={["Team", "Bet type", "Legs", "Win %", "Lift"]}
              columnAlign={["left", "left", "right", "right", "right"]}
              rows={(analysis.byTeamByType || []).map((r) => [
                r.team,
                r.betType,
                r.n,
                `${r.winRate}%`,
                <LiftBadge key={`${r.key}-t`} lift={r.lift} />,
              ])}
            />
          </section>

          <section className="space-y-3">
            <h4 className="text-white font-semibold">Win rate by month</h4>
            <div className="space-y-2 bg-white/5 rounded-lg border border-white/10 p-4">
              {analysis.byMonth.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-gray-300 w-16">{row.key}</span>
                  <RateBar rate={row.winRate} max={100} good />
                  <LiftBadge lift={row.lift} />
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

export default WinPatternsTab;
