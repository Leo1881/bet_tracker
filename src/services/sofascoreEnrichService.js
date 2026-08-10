/**
 * Local test helper — SofaScore missing players / injuries / H2H.
 * Requires ENABLE_SOFASCORE_ENRICH=1 and scripts/sofascore_enrich setup.
 */

import { teamsMatch } from "../utils/teamNameUtils";

export const getSofascoreStatus = async () => {
  const res = await fetch("/api/sofascore/status");
  if (!res.ok) throw new Error("SofaScore status check failed");
  return res.json();
};

/**
 * @param {Array} games - recommendation-like objects (Best ticket)
 * @returns {Promise<{ results: Array }>}
 */
export const enrichGamesWithSofascore = async (games, maxGames = 12) => {
  const payload = {
    max_games: maxGames,
    games: (games || []).slice(0, maxGames).map((g) => ({
      match: g.match,
      home_team: g.home_team || g.HOME_TEAM,
      away_team: g.away_team || g.AWAY_TEAM,
      date: g.date || g.DATE,
      country: g.country || g.COUNTRY,
      league: g.league || g.LEAGUE,
    })),
  };
  const res = await fetch("/api/sofascore/enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `SofaScore enrich failed (${res.status})`);
  }
  return data;
};

/** Build a map keyed by match string for chip display. */
export const indexSofascoreResults = (results) => {
  const map = {};
  for (const r of results || []) {
    if (r.match) map[r.match] = r;
  }
  return map;
};

/**
 * Soft recommendation impact from SofaScore H2H (+ injuries) vs stake pick.
 * Does not rewrite the engine — adjusts display confidence and adds a note.
 *
 * @returns {{
 *   tier: 'support'|'caution'|'info'|null,
 *   note: string,
 *   confidenceDelta: number,
 *   h2hLabel: string,
 * } | null}
 */
export const buildSofascoreRecommendationImpact = (rec, sofa) => {
  if (!sofa?.matched) return null;

  const h2h = sofa.h2h;
  const hw = Number(h2h?.homeWins) || 0;
  const aw = Number(h2h?.awayWins) || 0;
  const dr = Number(h2h?.draws) || 0;
  const decisive = hw + aw;
  const h2hLabel =
    h2h != null ? `H2H ${hw}-${dr}-${aw}` : sofa.h2hSummary || "H2H n/a";

  const hero = rec?.bestBet || rec?.primary;
  const stakeType = hero?.type || "";
  const stakeTeam =
    hero?.teamForBet ||
    (hero?.recommendation?.bet &&
    !["AVOID", "No clear winner"].includes(hero.recommendation.bet) &&
    !/over|under|draw/i.test(String(hero.recommendation.bet))
      ? String(hero.recommendation.bet).replace(/\s+or\s+draw$/i, "").trim()
      : null);

  const sofaHome = sofa.sofaHome || "";
  const sofaAway = sofa.sofaAway || "";
  const backingHome = stakeTeam && teamsMatch(stakeTeam, sofaHome);
  const backingAway = stakeTeam && teamsMatch(stakeTeam, sofaAway);

  let confidenceDelta = 0;
  let tier = "info";
  const notes = [];

  if (h2h && decisive >= 4 && (backingHome || backingAway)) {
    const backedWins = backingHome ? hw : aw;
    const share = backedWins / decisive;
    const isSw = stakeType === "Straight Win";
    const isDc = String(stakeType).includes("Double Chance");

    if (share <= 0.35) {
      tier = "caution";
      confidenceDelta -= isSw ? 10 : isDc ? 5 : 3;
      notes.push(
        `H2H weak for stake side (${backedWins}/${decisive} wins in decisive games)`
      );
    } else if (share >= 0.65) {
      tier = "support";
      confidenceDelta += isSw ? 4 : 2;
      notes.push(
        `H2H supports stake side (${backedWins}/${decisive} wins in decisive games)`
      );
    } else {
      notes.push(
        `H2H mixed for stake side (${backedWins}/${decisive} decisive wins)`
      );
    }
  } else if (h2h) {
    notes.push(h2hLabel);
  }

  const homeMiss = sofa.homeMissing?.length || 0;
  const awayMiss = sofa.awayMissing?.length || 0;
  if (backingHome && homeMiss > 0) {
    confidenceDelta -= Math.min(6, homeMiss * 2);
    if (tier === "info") tier = "caution";
    if (tier === "support") tier = "info";
    notes.push(`Home missing/doubtful: ${homeMiss}`);
  }
  if (backingAway && awayMiss > 0) {
    confidenceDelta -= Math.min(6, awayMiss * 2);
    if (tier === "info") tier = "caution";
    if (tier === "support") tier = "info";
    notes.push(`Away missing/doubtful: ${awayMiss}`);
  }
  // Opponent absences can slightly help
  if (backingHome && awayMiss >= 2) {
    confidenceDelta += 2;
    notes.push("Opponent (away) has multiple absences");
  }
  if (backingAway && homeMiss >= 2) {
    confidenceDelta += 2;
    notes.push("Opponent (home) has multiple absences");
  }

  // Recent form (last 5 letters) — soft signal for early season / cups
  const formLetters = (block) =>
    Array.isArray(block?.form) ? block.form.map((x) => String(x).toUpperCase()) : [];
  const homeForm = formLetters(sofa.homeForm);
  const awayForm = formLetters(sofa.awayForm);
  const formScore = (letters) => {
    if (!letters.length) return null;
    const pts = letters.reduce(
      (s, L) => s + (L === "W" ? 1 : L === "D" ? 0.5 : 0),
      0
    );
    return pts / letters.length;
  };
  if ((backingHome || backingAway) && (homeForm.length || awayForm.length)) {
    const mine = formScore(backingHome ? homeForm : awayForm);
    const theirs = formScore(backingHome ? awayForm : homeForm);
    if (mine != null && mine <= 0.3 && (backingHome ? homeForm : awayForm).length >= 4) {
      confidenceDelta -= 4;
      if (tier === "info") tier = "caution";
      notes.push(
        `Cold form ${(backingHome ? homeForm : awayForm).join("")}`
      );
    } else if (
      mine != null &&
      theirs != null &&
      mine >= 0.7 &&
      mine - theirs >= 0.35
    ) {
      confidenceDelta += 2;
      if (tier === "info") tier = "support";
      notes.push(
        `Stronger recent form ${(backingHome ? homeForm : awayForm).join("")}`
      );
    }
  }

  // Key streaks vs market type
  const keyStreaks = sofa.keyStreaks || [];
  const isOu = /over\/under|over|under/i.test(stakeType) || /over|under/i.test(String(hero?.recommendation?.bet || ""));
  for (const s of keyStreaks) {
    const short = s.short;
    const val = String(s.value || "");
    if (isOu && (short === "O2.5" || short === "U2.5" || short === "BTTS")) {
      notes.push(`Streak ${short} ${val}`);
    }
    if (
      (backingAway || backingHome) &&
      short === "Unbeaten" &&
      (s.team === "away" ? backingAway : s.team === "home" ? backingHome : false)
    ) {
      confidenceDelta += 2;
      notes.push(`Unbeaten streak ${val}`);
    }
  }

  if (!notes.length && !h2h && !sofa.formSummary) return null;

  return {
    tier,
    note: notes.join(" · ") || h2hLabel,
    confidenceDelta,
    h2hLabel,
    formSummary: sofa.formSummary || "",
    streaksSummary: sofa.streaksSummary || "",
  };
};

/**
 * Attach impact onto each sofa result using the matching recommendation card.
 */
export const attachRecommendationImpacts = (results, recommendations) => {
  const byMatch = new Map(
    (recommendations || []).map((r) => [r.match, r])
  );
  return (results || []).map((sofa) => {
    const rec = byMatch.get(sofa.match);
    const impact = rec
      ? buildSofascoreRecommendationImpact(rec, sofa)
      : null;
    return impact ? { ...sofa, impact } : sofa;
  });
};
