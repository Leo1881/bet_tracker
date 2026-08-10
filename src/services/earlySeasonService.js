/**
 * Early-season detection from Sheet3 games-played columns.
 * Under 5 games → thin sample; be more cautious on stake picks.
 */

export const EARLY_SEASON_GAMES_THRESHOLD = 5;
/** Confidence multiplier when early season (cap optimism from thin form). */
export const EARLY_SEASON_CONFIDENCE_FACTOR = 0.85;
/** Extra Straight Win ranking cut when early season. */
export const EARLY_SEASON_SW_SCORE_FACTOR = 0.88;

export function parseGamesPlayed(value) {
  if (value == null || value === "") return null;
  const n = parseInt(String(value).trim(), 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * @returns {{
 *   isEarlySeason: boolean,
 *   homeGamesPlayed: number|null,
 *   awayGamesPlayed: number|null,
 *   label: string,
 *   detail: string,
 * }}
 */
export function getEarlySeasonInfo(bet) {
  const homeGamesPlayed = parseGamesPlayed(bet?.HOME_TEAM_GAMES_PLAYED);
  const awayGamesPlayed = parseGamesPlayed(bet?.AWAY_TEAM_GAMES_PLAYED);
  const gpKnown = homeGamesPlayed != null || awayGamesPlayed != null;

  const underThreshold =
    (homeGamesPlayed != null &&
      homeGamesPlayed < EARLY_SEASON_GAMES_THRESHOLD) ||
    (awayGamesPlayed != null &&
      awayGamesPlayed < EARLY_SEASON_GAMES_THRESHOLD);

  // If GP columns missing but form was filled from last season, still treat as early.
  const prevSeasonFallback =
    !gpKnown && bet?.formSource === "previous_season";

  const isEarlySeason = underThreshold || prevSeasonFallback;

  const gpBits = [];
  if (homeGamesPlayed != null) gpBits.push(`home ${homeGamesPlayed} gp`);
  if (awayGamesPlayed != null) gpBits.push(`away ${awayGamesPlayed} gp`);
  if (!gpKnown && prevSeasonFallback) {
    gpBits.push("using previous-season form");
  }

  return {
    isEarlySeason,
    homeGamesPlayed,
    awayGamesPlayed,
    label: "Early season",
    detail: gpBits.length
      ? `${gpBits.join(" · ")} — under ${EARLY_SEASON_GAMES_THRESHOLD} games = thinner form`
      : `Under ${EARLY_SEASON_GAMES_THRESHOLD} games played — thinner form`,
  };
}

/**
 * Soften ranking scores when early season (especially Straight Win).
 */
export function applyEarlySeasonScoreAdjustments({
  type,
  recommendation,
  adjustedScore,
  earlySeasonInfo,
}) {
  if (!earlySeasonInfo?.isEarlySeason) {
    return { adjustedScore, notes: [] };
  }
  const betText = recommendation?.bet ?? "";
  if (betText === "AVOID" || betText === "No clear winner") {
    return { adjustedScore, notes: [] };
  }

  let score = adjustedScore;
  const notes = [];

  if (type === "Straight Win") {
    score *= EARLY_SEASON_SW_SCORE_FACTOR;
    notes.push(
      `Early season: Straight Win reduced (${earlySeasonInfo.detail})`
    );
  } else if (type === "Double Chance") {
    score *= 1.05;
    notes.push("Early season: slight preference for Double Chance (safer)");
  }

  return { adjustedScore: score, notes };
}

/** Cap displayed / stake confidence when early season. */
export function capEarlySeasonConfidence(confidence, earlySeasonInfo) {
  if (!earlySeasonInfo?.isEarlySeason) return confidence;
  const n = Number(confidence);
  if (!Number.isFinite(n)) return confidence;
  return Math.round(n * EARLY_SEASON_CONFIDENCE_FACTOR * 10) / 10;
}
