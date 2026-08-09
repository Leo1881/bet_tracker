/**
 * AI service (frontend)
 * Calls the backend AI endpoint. The API key lives only on the server.
 */

/** Build a compact payload for the AI from a recommendation card object. */
export const buildAiGamePayload = (rec) => ({
  match: rec.match,
  country: rec.country,
  league: rec.league,
  date: rec.date,
  odds: rec.odds,
  odds1: rec.odds1 ?? rec.ODDS1,
  odds2: rec.odds2 ?? rec.ODDS2,
  oddsX: rec.oddsX ?? rec.ODDSX,
  recentFormData: rec.recentFormData,
  confidenceBreakdown: rec.confidenceBreakdown,
  bestBet: rec.bestBet,
  primary: rec.primary,
  secondary: rec.secondary,
  tertiary: rec.tertiary,
  proposedBetLabel: rec.proposedBetLabel,
  performanceNote: rec.performanceNote,
  lossWarning: rec.lossWarning,
  oddsTrapMessage: rec.bestBet?.oddsTrapWarning?.message,
});

/**
 * Get an independent AI recommendation for one game.
 * @param {Object} rec - a recommendation card object from betRecommendations
 * @returns {Promise<Object>} { skip, ai_pick, ai_confidence, ai_reasoning, agreement, risk_flag, model }
 */
export const getAiSecondOpinion = async (rec) => {
  const response = await fetch("/api/ai/second-opinion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game: buildAiGamePayload(rec) }),
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch (_e) {
      // keep default message
    }
    throw new Error(message);
  }

  return response.json();
};
