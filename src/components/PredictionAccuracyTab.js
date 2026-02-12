import React, { useState, useEffect } from "react";

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
          System Recommendation Accuracy
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-300">Loading accuracy data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          System Recommendation Accuracy
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const { primary, secondary, tertiary, totalBets } = tierAccuracy || {};
  const tiers = [
    { label: "Primary", emoji: "🥇", ...primary, desc: "System's top recommendation" },
    { label: "Secondary", emoji: "🥈", ...secondary, desc: "System's second choice" },
    { label: "Tertiary", emoji: "🥉", ...tertiary, desc: "System's third choice" },
  ];

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        System Recommendation Accuracy
      </h3>
      <div className="text-gray-300 mb-6">
        <p>
          How accurate is each tier of the system's recommendations? Each tier
          is evaluated against the actual match outcome (scores). For example:
          if Primary was "OVER 1.5" and the result was 1-1, Primary is correct.
          If Tertiary was "Man Utd" and the result was draw, Tertiary is incorrect.
        </p>
        <p className="text-amber-200/80 text-sm mt-2">
          Requirement: Add HOME_SCORE and AWAY_SCORE to Sheet1 and run Compare for accuracy to work.
        </p>
      </div>

      {totalBets === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h4 className="text-lg font-semibold text-white mb-2">
            No Data Yet
          </h4>
          <p className="text-gray-300 mb-4">
            Upload betslips from Bet Analysis, run Compare from Recommendation
            Analysis to add results from Sheet1, then return here to see the
            system's tier accuracy.
          </p>
          {tierAccuracy?.debug && (
            <div className="mt-4 p-4 bg-black/20 rounded-lg text-left text-sm text-gray-400 max-w-xl mx-auto">
              <p>Debug: {tierAccuracy.debug.rowsWithResult} rows have results. {tierAccuracy.debug.unmatchedRows?.length ?? 0} didn't match any tier.</p>
              {tierAccuracy.debug.unmatchedRows?.length > 0 && (
                <pre className="mt-2 text-xs overflow-auto">
                  {JSON.stringify(tierAccuracy.debug.unmatchedRows, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {tierAccuracy?.gamesWithoutScores?.length > 0 && (
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-200 text-sm">
              {tierAccuracy.gamesWithoutScores.length} game(s) skipped (no HOME_SCORE/AWAY_SCORE in Sheet1): {tierAccuracy.gamesWithoutScores.join(", ")}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <div
                key={tier.label}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{tier.emoji}</span>
                  <h4 className="text-lg font-semibold text-white">
                    {tier.label}
                  </h4>
                </div>
                <p className="text-gray-400 text-xs mb-3">{tier.desc}</p>
                <div className="text-3xl font-bold text-green-400">
                  {tier.total > 0 ? tier.accuracy.toFixed(1) : "—"}%
                </div>
                <div className="text-gray-300 text-sm mt-1">
                  {tier.correct} correct / {tier.total} bets
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Total bets tracked: {totalBets}</span>
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
