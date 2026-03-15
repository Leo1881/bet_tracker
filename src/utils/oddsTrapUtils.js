import { getPositionGapIndicator } from "../services/teamHistoryService";

/**
 * Expected odds max by position gap (favorite should be shorter than this).
 * Large gap (top vs bottom) → expect ~1.15–1.25
 * Moderate gap → expect ~1.25–1.50
 */
const EXPECTED_ODDS_MAX = {
  Large: 1.25,
  Moderate: 1.5,
};

/**
 * Detects if a recommendation is in the "odds trap" zone: favorite's odds
 * are longer than expected for the position gap (market may know something).
 *
 * Applies only to league games (not cup), Straight Win and Double Chance.
 *
 * @param {Object} bet - Bet data with ODDS1, ODDS2, positions, LEAGUE
 * @param {Object} card - Recommendation card with type, recommendation.bet
 * @param {string} homeTeam - Home team name
 * @param {string} awayTeam - Away team name
 * @returns {{ isTrap: boolean, message: string } | null} - Trap result or null
 */
export function getOddsTrapResult(bet, card, homeTeam, awayTeam) {
  const type = (card?.type || "").toLowerCase();
  if (!type.includes("straight win") && !type.includes("double chance")) {
    return null;
  }

  const league = (bet?.LEAGUE || "").toLowerCase();
  if (league.includes("cup")) {
    return null;
  }

  const homePos = parseInt(bet?.HOME_TEAM_POSITION_NUMBER || bet?.HOME_TEAM_POSITION, 10);
  const awayPos = parseInt(bet?.AWAY_TEAM_POSITION_NUMBER || bet?.AWAY_TEAM_POSITION, 10);
  if (!Number.isFinite(homePos) || !Number.isFinite(awayPos)) {
    return null;
  }

  const positionGap = getPositionGapIndicator(
    homePos,
    awayPos,
    bet?.TOTAL_TEAMS_IN_LEAGUE
  );
  if (!positionGap || positionGap.gapLabel === "Close") {
    return null;
  }

  const expectedMax = EXPECTED_ODDS_MAX[positionGap.gapLabel];
  if (!expectedMax) return null;

  const recBet = (card?.recommendation?.bet || "").toLowerCase();
  if (recBet === "avoid" || recBet === "no clear winner" || recBet === "no clear trend") {
    return null;
  }

  const h = (homeTeam || "").toLowerCase().trim();
  const a = (awayTeam || "").toLowerCase().trim();
  if (!h || !a) return null;

  let favoriteOdds = 0;
  let isBettingOnFavorite = false;

  if (type.includes("straight win")) {
    if (recBet.includes(h) || h.includes(recBet)) {
      favoriteOdds = parseFloat(bet?.ODDS1) || 0;
      isBettingOnFavorite = homePos < awayPos;
    } else if (recBet.includes(a) || a.includes(recBet)) {
      favoriteOdds = parseFloat(bet?.ODDS2) || 0;
      isBettingOnFavorite = awayPos < homePos;
    }
  } else if (type.includes("double chance")) {
    // Double Chance format: "Team A or Draw" or "1 X" / "X 2"
    if (recBet.includes("1 x") || recBet.includes("1x")) {
      favoriteOdds = parseFloat(bet?.ODDS1) || 0;
      isBettingOnFavorite = homePos < awayPos;
    } else if (recBet.includes("x 2") || recBet.includes("x2")) {
      favoriteOdds = parseFloat(bet?.ODDS2) || 0;
      isBettingOnFavorite = awayPos < homePos;
    } else if (recBet.includes(h) || h.includes(recBet)) {
      favoriteOdds = parseFloat(bet?.ODDS1) || 0;
      isBettingOnFavorite = homePos < awayPos;
    } else if (recBet.includes(a) || a.includes(recBet)) {
      favoriteOdds = parseFloat(bet?.ODDS2) || 0;
      isBettingOnFavorite = awayPos < homePos;
    }
  }

  if (favoriteOdds <= 0 || !isBettingOnFavorite) {
    return null;
  }

  if (favoriteOdds > expectedMax) {
    return {
      isTrap: true,
      message: "Strong team vs weak opponent, but odds aren't as short as usual – the market may know something. Proceed with caution.",
    };
  }

  return null;
}

/**
 * Confidence penalty when odds trap is detected.
 */
export const ODDS_TRAP_CONFIDENCE_PENALTY = 10;
