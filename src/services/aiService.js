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

/**
 * Persist an AI opinion onto betslip_recommendations rows for this fixture
 * (so Prediction Accuracy can score AI vs system after results land).
 */
export const saveAiOpinionToDb = async (rec, opinion) => {
  if (!rec || !opinion) return { updated: 0 };
  const home =
    rec.home_team ||
    rec.HOME_TEAM ||
    (typeof rec.match === "string" ? rec.match.split(/\s+vs\s+/i)[0] : null);
  const away =
    rec.away_team ||
    rec.AWAY_TEAM ||
    (typeof rec.match === "string" ? rec.match.split(/\s+vs\s+/i)[1] : null);
  if (!home || !away) return { updated: 0 };

  const response = await fetch("/api/betslip-recommendations/ai-opinion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      home_team: home.trim(),
      away_team: String(away).trim(),
      date: rec.date || rec.DATE || null,
      ai_pick: opinion.ai_pick ?? null,
      ai_confidence: opinion.ai_confidence ?? null,
      ai_reasoning: opinion.ai_reasoning ?? null,
      ai_agreement: opinion.agreement ?? null,
      ai_skip: !!opinion.skip,
    }),
  });
  if (!response.ok) {
    // Non-fatal: AI UI still works if rows aren't saved yet
    return { updated: 0 };
  }
  return response.json();
};
