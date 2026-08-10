/**
 * Build a short 8–12 leg "best ticket" from full recommendation list.
 * Prefers strong stake picks, league diversity, and avoids traps when possible.
 */

import { isTrapLeague, isTrapCountry } from "./recommendationLossRulesService";

export const BEST_TICKET_MIN = 8;
export const BEST_TICKET_MAX = 12;
export const BEST_TICKET_MIN_CONFIDENCE = 65;
export const BEST_TICKET_MAX_PER_LEAGUE = 2;

function stakeCard(rec) {
  return rec?.bestBet || rec?.primary || null;
}

function stakeBetText(card) {
  return String(card?.recommendation?.bet ?? "").trim();
}

function isAvoid(card) {
  const bet = stakeBetText(card);
  return !bet || bet === "AVOID" || bet === "No clear winner";
}

function isStakeTicketReady(card) {
  if (!card?.recommendation || isAvoid(card)) return false;
  const conf = parseFloat(card.recommendation.confidence);
  if (Number.isNaN(conf)) return false;
  if (card.oddsPerformance?.type === "warning") return false;
  if (card.oddsTrapWarning?.isTrap) return false;
  if (card.type === "Straight Win" && conf >= 85) return true;
  if (conf < 70) return false;
  if (String(card.riskLevel || "").toLowerCase() === "high") return false;
  return true;
}

function leagueKey(rec) {
  return `${String(rec.country || "").toLowerCase()}|${String(rec.league || "").toLowerCase()}`;
}

function gameKey(rec) {
  return [rec?.match, rec?.country, rec?.league, rec?.date]
    .map((v) => String(v ?? ""))
    .join("|");
}

/**
 * Score a game for ticket inclusion (higher = better).
 * Hard rejects return null.
 */
function scoreCandidate(rec, { allowTrap, allowEarly, allowBlacklist }) {
  const card = stakeCard(rec);
  if (!card || isAvoid(card)) return null;

  const conf = parseFloat(card.recommendation?.confidence ?? rec.confidence) || 0;
  if (conf < BEST_TICKET_MIN_CONFIDENCE) return null;

  const trap =
    isTrapLeague(rec.country, rec.league) || isTrapCountry(rec.country);
  if (trap && !allowTrap) return null;

  if (rec.earlySeason?.isEarlySeason && !allowEarly) return null;
  if (rec.blacklistWarning && !allowBlacklist) return null;
  if (rec.oddsTrapOnBestBet && !allowTrap) return null;
  if (rec.performanceNote?.tier === "caution" && !allowTrap) return null;

  let score = conf;

  if (isStakeTicketReady(card)) score += 12;
  if (card.type === "Double Chance") score += 4;
  if (card.type === "Straight Win") score += 1;
  if ((card.riskLevel || "").toLowerCase() === "low") score += 3;
  if ((card.riskLevel || "").toLowerCase() === "medium") score += 1;
  if ((card.riskLevel || "").toLowerCase() === "high") score -= 6;

  if (rec.performanceNote?.tier === "strong") score += 5;
  if (rec.performanceNote?.tier === "risky") score -= 4;
  if (rec.performanceNote?.tier === "caution") score -= 10;
  if (rec.lossWarning?.isRisky) score -= 8;
  if (rec.earlySeason?.isEarlySeason) score -= 10;
  if (rec.blacklistWarning) score -= 15;
  if (trap) score -= 12;

  return score;
}

function pickWithDiversity(ranked, maxSize) {
  const selected = [];
  const perLeague = new Map();

  for (const item of ranked) {
    if (selected.length >= maxSize) break;
    const lk = leagueKey(item.rec);
    const count = perLeague.get(lk) || 0;
    if (count >= BEST_TICKET_MAX_PER_LEAGUE) continue;
    selected.push(item.rec);
    perLeague.set(lk, count + 1);
  }
  return selected;
}

function rankPool(recommendations, flags) {
  return recommendations
    .map((rec) => {
      const score = scoreCandidate(rec, flags);
      if (score == null) return null;
      return { rec, score, key: gameKey(rec) };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.rec.confidence - a.rec.confidence);
}

/**
 * @param {Array} recommendations - full betRecommendations list
 * @param {{ minSize?: number, maxSize?: number }} opts
 * @returns {Array} selected recommendation objects (8–12 when possible)
 */
export function buildBestTicket(
  recommendations,
  { minSize = BEST_TICKET_MIN, maxSize = BEST_TICKET_MAX } = {}
) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return [];
  }

  const stages = [
    { allowTrap: false, allowEarly: false, allowBlacklist: false },
    { allowTrap: false, allowEarly: true, allowBlacklist: false },
    { allowTrap: true, allowEarly: true, allowBlacklist: false },
    { allowTrap: true, allowEarly: true, allowBlacklist: true },
  ];

  let selected = [];
  const seen = new Set();

  for (const flags of stages) {
    const ranked = rankPool(recommendations, flags).filter(
      (item) => !seen.has(item.key)
    );
    const picked = pickWithDiversity(ranked, maxSize - selected.length);
    for (const rec of picked) {
      const key = gameKey(rec);
      if (seen.has(key)) continue;
      seen.add(key);
      selected.push(rec);
      if (selected.length >= maxSize) break;
    }
    if (selected.length >= minSize) break;
  }

  // If still short, fill by raw stake confidence (still no AVOID)
  if (selected.length < minSize) {
    const fillers = [...recommendations]
      .filter((rec) => {
        const card = stakeCard(rec);
        return card && !isAvoid(card) && !seen.has(gameKey(rec));
      })
      .sort(
        (a, b) =>
          (b.confidence || 0) - (a.confidence || 0) ||
          (parseFloat(b.odds) || 0) - (parseFloat(a.odds) || 0)
      );
    for (const rec of fillers) {
      selected.push(rec);
      seen.add(gameKey(rec));
      if (selected.length >= minSize) break;
    }
  }

  return selected.slice(0, maxSize);
}

export function bestTicketGameKey(rec) {
  return gameKey(rec);
}
