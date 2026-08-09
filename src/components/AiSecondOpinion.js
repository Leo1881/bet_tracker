import React from "react";

const AGREEMENT_STYLES = {
  agree: { label: "Agrees with system ✓", className: "bg-green-500/20 text-green-300 border-green-500/30" },
  partial: { label: "Partially agrees", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  disagree: { label: "Disagrees with system", className: "bg-red-500/20 text-red-300 border-red-500/30" },
};

const RISK_LABELS = {
  none: null,
  odds_trap: "⚠️ Possible odds trap",
  low_data: "⚠️ Thin data",
};

/**
 * Controlled AI second-opinion panel. State lives in the parent so a single
 * "Get AI picks (all)" action can populate every game at once.
 *
 * @param {Object|undefined} result - AI response for this game
 * @param {string|undefined} error - error message, if the fetch failed
 * @param {boolean} loading - whether this game's opinion is being fetched
 * @param {Function} onFetch - request/refresh this game's opinion
 */
function AiSecondOpinion({ result, error, loading, onFetch }) {
  const agreement = result && AGREEMENT_STYLES[result.agreement];
  const riskLabel = result && RISK_LABELS[result.risk_flag];

  return (
    <div className="mt-3 rounded-lg border border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🤖</span>
          <span className="text-indigo-300 font-semibold text-xs uppercase tracking-wide">
            AI second opinion
          </span>
        </div>
        <button
          type="button"
          onClick={onFetch}
          disabled={loading}
          className="text-xs px-3 py-1 rounded-md bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-100 border border-indigo-400/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Thinking…" : result || error ? "Refresh" : "Get AI pick"}
        </button>
      </div>

      {!result && !error && !loading && (
        <div className="mt-2 text-xs text-gray-500">
          No AI pick yet — use “Get AI picks (all)” above or the button here.
        </div>
      )}

      {error && (
        <div className="mt-2 text-xs text-red-300 leading-relaxed">{error}</div>
      )}

      {result && !error && (
        <div className="mt-2 space-y-1.5">
          {result.skip ? (
            <div className="text-sm font-semibold text-gray-300">
              AI recommends: <span className="text-amber-300">Skip / no bet</span>
            </div>
          ) : (
            <div className="text-sm font-semibold text-white">
              {result.ai_pick}{" "}
              <span className="text-indigo-300">({result.ai_confidence}%)</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {agreement && (
              <span className={`text-xs px-2 py-0.5 rounded border ${agreement.className}`}>
                {agreement.label}
              </span>
            )}
            {riskLabel && (
              <span className="text-xs px-2 py-0.5 rounded border bg-amber-500/20 text-amber-300 border-amber-500/30">
                {riskLabel}
              </span>
            )}
          </div>

          {result.ai_reasoning && (
            <p className="text-gray-300 text-xs leading-relaxed">{result.ai_reasoning}</p>
          )}

          {result.model && (
            <p className="text-gray-500 text-[10px]">via {result.model}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AiSecondOpinion;
