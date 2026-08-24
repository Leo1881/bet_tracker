import React, { useState, useEffect } from "react";
import { TabContentSkeleton } from "./SkeletonLoader";
import ErrorDisplay from "./ErrorDisplay";

const MARKET_SHORT = {
  "Straight Win": "SW",
  "Double Chance": "DC",
  "Double Chance 12": "DC12",
  "Over/Under": "O/U",
};

const MARKET_ORDER = [
  "Straight Win",
  "Double Chance",
  "Double Chance 12",
  "Over/Under",
];

const TierCard = ({
  label,
  emoji,
  desc,
  correct = 0,
  total = 0,
  accuracy = 0,
  byMarket,
  highlight,
}) => {
  const marketRows = MARKET_ORDER.map((name) => {
    const m = byMarket?.[name];
    if (!m || !m.total) return null;
    return {
      name,
      short: MARKET_SHORT[name] || name,
      correct: m.correct,
      total: m.total,
      accuracy: m.accuracy,
    };
  }).filter(Boolean);

  return (
    <div
      className={`rounded-lg p-4 border ${
        highlight
          ? "bg-emerald-500/15 border-emerald-400/40"
          : "bg-white/10 border-white/20"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{emoji}</span>
        <h4 className="text-lg font-semibold text-white">{label}</h4>
      </div>
      <p className="text-gray-400 text-xs mb-3">{desc}</p>
      <div className="text-3xl font-bold text-green-400">
        {total > 0 ? accuracy.toFixed(1) : "—"}%
      </div>
      <div className="text-gray-300 text-sm mt-1">
        {correct} correct / {total} bets
      </div>
      {marketRows.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
          {marketRows.map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="text-gray-400 w-10 shrink-0">{row.short}</span>
              <span className="text-gray-300 tabular-nums">
                {row.correct}/{row.total}
              </span>
              <span className="text-green-300/90 font-medium tabular-nums w-14 text-right">
                {row.accuracy.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PredictionAccuracyTab = () => {
  const [tierAccuracy, setTierAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTierAccuracy = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/betslip-recommendations/tier-accuracy");
      if (!res.ok) throw new Error("Failed to fetch tier accuracy");
      const data = await res.json();
      setTierAccuracy(data);
    } catch (err) {
      console.error("Error fetching tier accuracy:", err);
      setError("Failed to load system tier accuracy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTierAccuracy();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Accuracy Scoreboard
        </h3>
        <TabContentSkeleton lines={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Accuracy Scoreboard
        </h3>
        <ErrorDisplay
          message={error}
          onRetry={fetchTierAccuracy}
          title="Failed to load accuracy data"
          variant="inline"
        />
      </div>
    );
  }

  const {
    primary,
    secondary,
    tertiary,
    bestBet,
    ai,
    totalBets,
  } = tierAccuracy || {};

  const systemTiers = [
    {
      label: "Primary",
      emoji: "🥇",
      desc: "System top tier (saved on every betslip)",
      ...primary,
    },
    {
      label: "Secondary",
      emoji: "🥈",
      desc: "System's second choice",
      ...secondary,
    },
    {
      label: "Tertiary",
      emoji: "🥉",
      desc: "System's third choice",
      ...tertiary,
    },
  ];

  const heroTiers = [
    {
      label: "Best Bet",
      emoji: "⭐",
      desc: "Hero pick after ranking + loss rules (new saves only)",
      highlight: true,
      ...bestBet,
    },
    {
      label: "AI pick",
      emoji: "🤖",
      desc: "Gemini second opinion when you ran AI after saving",
      highlight: true,
      ...ai,
    },
  ];

  const hasAny =
    (totalBets || 0) > 0 ||
    (bestBet?.total || 0) > 0 ||
    (ai?.total || 0) > 0;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">Accuracy Scoreboard</h3>
      <div className="text-gray-300 mb-6 space-y-2">
        <p>
          Compares each pick type against the actual match outcome (scores from
          Sheet1 after Compare). Use this to see whether Best Bet or AI beats
          Primary over time.
        </p>
        <p className="text-amber-200/80 text-sm">
          Best Bet and AI columns only fill for games saved after this update
          (and AI only after you fetch an AI opinion). Older rows still score
          Primary / Secondary / Tertiary. When a market has 20+ settled picks,
          that hit rate also gently nudges ranking for new recommendations
          (league first, then country, then overall). Each card also breaks
          down SW / DC / DC12 / O-U.
        </p>
      </div>

      {!hasAny ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h4 className="text-lg font-semibold text-white mb-2">No Data Yet</h4>
          <p className="text-gray-300 mb-4">
            Upload betslips from Bet Analysis, save recommendations, run Compare
            from Recommendation Analysis when results land, then refresh here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {tierAccuracy?.gamesWithoutScores?.length > 0 && (
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-200 text-sm">
              {tierAccuracy.gamesWithoutScores.length} game(s) skipped (no
              HOME_SCORE/AWAY_SCORE):{" "}
              {tierAccuracy.gamesWithoutScores.join(", ")}
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-white/90 mb-3 uppercase tracking-wide">
              System tiers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {systemTiers.map((tier) => (
                <TierCard key={tier.label} {...tier} />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white/90 mb-3 uppercase tracking-wide">
              Best Bet & AI
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {heroTiers.map((tier) => (
                <TierCard key={tier.label} {...tier} />
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Primary/Secondary/Tertiary bets tracked: {totalBets}</span>
            <button
              onClick={fetchTierAccuracy}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionAccuracyTab;
