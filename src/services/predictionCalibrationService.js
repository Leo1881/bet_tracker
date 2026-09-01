/**
 * Prediction-accuracy learning:
 * 1) Confidence calibration — blend displayed confidence toward empirical hit rate
 * 2) Hard prefer/skip — crush weak markets / prefer strong ones in a segment
 *
 * Uses settled betslip recommendations (system picks vs match outcome).
 */

export const CALIBRATION_MIN_SAMPLE = 20;
export const CALIBRATION_BASELINE = 0.55;
export const CALIBRATION_K = 0.4;
export const CALIBRATION_CLAMP_MIN = 0.85;
export const CALIBRATION_CLAMP_MAX = 1.15;

/** Hard learning rules need a larger sample than soft nudges. */
export const LEARNING_HARD_MIN_SAMPLE = 30;
export const LEARNING_SKIP_ACCURACY = 0.55;
export const LEARNING_PREFER_ACCURACY = 0.65;
export const LEARNING_SKIP_SCORE_MULT = 0.3;
export const LEARNING_PREFER_SCORE_MULT = 1.12;
export const LEARNING_DC_OVER_WEAK_SW_MULT = 1.15;
/** Max blend toward empirical hit rate when calibrating confidence. */
export const CONF_CALIB_MAX_WEIGHT = 0.65;

const norm = (v) =>
  v == null ? "" : String(v).trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Map a saved recommendation string to the ranking market type.
 * @param {string} rec
 * @returns {string|null}
 */
export function classifyRecommendationMarket(rec) {
  const r = norm(rec);
  if (!r || r.includes("avoid") || r.includes("no clear")) return null;
  if (r.includes("home or away")) return "Double Chance 12";
  if (/\bor\s+draw\b/.test(r)) return "Double Chance";
  if (/\bover\s+[\d.]+/.test(r) || /\bunder\s+[\d.]+/.test(r)) {
    return "Over/Under";
  }
  return "Straight Win";
}

/**
 * @returns {Promise<object|null>}
 */
export async function fetchPredictionCalibration() {
  try {
    const res = await fetch("/api/betslip-recommendations/calibration");
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch prediction calibration:", err);
    return null;
  }
}

function packHit(bucket) {
  if (!bucket || !bucket.total) return null;
  return {
    correct: bucket.correct,
    total: bucket.total,
    accuracy: bucket.total > 0 ? bucket.correct / bucket.total : 0,
  };
}

function scopeLabelOf(scope) {
  if (scope === "league") return "this league";
  if (scope === "country") return "this country";
  return "overall";
}

/**
 * Resolve the best available bucket: league → country → global market.
 * @param {string} marketType
 * @param {string} country
 * @param {string} league
 * @param {object|null} calibration
 * @param {{ preferStake?: boolean, minSample?: number }} [opts]
 */
export function resolveCalibrationBucket(
  marketType,
  country,
  league,
  calibration,
  { preferStake = false, minSample } = {},
) {
  if (!calibration || !marketType) return null;

  const need = minSample ?? calibration?.minSample ?? CALIBRATION_MIN_SAMPLE;
  const c = norm(country);
  const l = norm(league);
  const leagueKey = `${marketType}|${c}|${l}`;
  const countryKey = `${marketType}|${c}`;

  const leagueMaps = preferStake
    ? [calibration.stakeMarketLeague, calibration.marketLeague]
    : [calibration.marketLeague];
  const countryMaps = preferStake
    ? [calibration.stakeMarketCountry, calibration.marketCountry]
    : [calibration.marketCountry];
  const marketMaps = preferStake
    ? [calibration.stakeMarkets, calibration.markets]
    : [calibration.markets];

  const candidates = [];
  for (const map of leagueMaps) {
    candidates.push({
      hit: packHit(map?.[leagueKey]),
      scope: "league",
      key: leagueKey,
    });
  }
  for (const map of countryMaps) {
    candidates.push({
      hit: packHit(map?.[countryKey]),
      scope: "country",
      key: countryKey,
    });
  }
  for (const map of marketMaps) {
    candidates.push({
      hit: packHit(map?.[marketType]),
      scope: "market",
      key: marketType,
    });
  }

  for (const candidate of candidates) {
    if (candidate.hit && candidate.hit.total >= need) {
      return { ...candidate.hit, scope: candidate.scope, key: candidate.key };
    }
  }

  return null;
}

/**
 * Soft multiplier for ranking. Returns 1.0 when sample is too small or missing.
 * @returns {{ multiplier: number, note: string|null, bucket: object|null }}
 */
export function getSegmentedAccuracyAdjustment(
  marketType,
  country,
  league,
  calibration,
) {
  const minSample = calibration?.minSample ?? CALIBRATION_MIN_SAMPLE;
  const baseline = calibration?.baseline ?? CALIBRATION_BASELINE;
  const k = calibration?.k ?? CALIBRATION_K;
  const clampMin = calibration?.clampMin ?? CALIBRATION_CLAMP_MIN;
  const clampMax = calibration?.clampMax ?? CALIBRATION_CLAMP_MAX;

  const bucket = resolveCalibrationBucket(
    marketType,
    country,
    league,
    calibration,
    { minSample },
  );

  if (!bucket || bucket.total < minSample) {
    return { multiplier: 1, note: null, bucket };
  }

  const raw = 1 + k * (bucket.accuracy - baseline);
  const multiplier = Math.max(clampMin, Math.min(clampMax, raw));

  if (Math.abs(multiplier - 1) < 0.005) {
    return { multiplier: 1, note: null, bucket };
  }

  const pct = (bucket.accuracy * 100).toFixed(0);
  const direction = multiplier > 1 ? "boosted" : "reduced";
  const note = `${marketType} ${direction} (${pct}% of ${bucket.total} in ${scopeLabelOf(bucket.scope)})`;

  return { multiplier, note, bucket };
}

/**
 * 1) Blend displayed confidence toward empirical segment hit rate.
 * @returns {{
 *   confidence: number,
 *   rawConfidence: number,
 *   note: string|null,
 *   bucket: object|null,
 * }}
 */
export function calibrateDisplayedConfidence(
  confidence,
  marketType,
  country,
  league,
  calibration,
) {
  const raw = Number(confidence);
  if (!Number.isFinite(raw)) {
    return { confidence: raw, rawConfidence: raw, note: null, bucket: null };
  }

  const minSample = calibration?.minSample ?? CALIBRATION_MIN_SAMPLE;
  const maxWeight =
    calibration?.confCalibMaxWeight ?? CONF_CALIB_MAX_WEIGHT;
  const bucket = resolveCalibrationBucket(
    marketType,
    country,
    league,
    calibration,
    { preferStake: true, minSample },
  );

  if (!bucket || bucket.total < minSample) {
    return {
      confidence: raw,
      rawConfidence: raw,
      note: null,
      bucket,
    };
  }

  const ramp = Math.min(
    1,
    Math.max(0, (bucket.total - minSample) / (minSample * 2)),
  );
  const weight = ramp * maxWeight;
  const empirical = bucket.accuracy * 100;
  const calibrated = raw * (1 - weight) + empirical * weight;
  const confidenceOut =
    Math.round(Math.max(10, Math.min(100, calibrated)) * 10) / 10;

  const note =
    weight >= 0.12 && Math.abs(confidenceOut - raw) >= 1
      ? `Confidence calibrated ${raw.toFixed(0)}% → ${confidenceOut.toFixed(0)}% (hit rate ${(bucket.accuracy * 100).toFixed(0)}% of ${bucket.total} in ${scopeLabelOf(bucket.scope)})`
      : null;

  return {
    confidence: confidenceOut,
    rawConfidence: raw,
    note,
    bucket,
  };
}

/**
 * 2) Hard prefer/skip from segmented accuracy (stake-pick history preferred).
 * @returns {{ adjustedScore: number, notes: string[], action: "skip"|"prefer"|null }}
 */
export function applyLearningScoreAdjustments({
  type,
  adjustedScore,
  country,
  league,
  calibration,
}) {
  let score = adjustedScore;
  const notes = [];
  let action = null;

  if (!calibration || !type) {
    return { adjustedScore: score, notes, action };
  }

  const hardMin =
    calibration?.hardMinSample ?? LEARNING_HARD_MIN_SAMPLE;
  const skipAcc = calibration?.skipAccuracy ?? LEARNING_SKIP_ACCURACY;
  const preferAcc =
    calibration?.preferAccuracy ?? LEARNING_PREFER_ACCURACY;

  const bucket = resolveCalibrationBucket(type, country, league, calibration, {
    preferStake: true,
    minSample: hardMin,
  });

  if (bucket && bucket.total >= hardMin) {
    const pct = (bucket.accuracy * 100).toFixed(0);
    const scope = scopeLabelOf(bucket.scope);
    if (bucket.accuracy < skipAcc) {
      score *= LEARNING_SKIP_SCORE_MULT;
      action = "skip";
      notes.push(
        `Learning: ${type} weak (${pct}% of ${bucket.total} in ${scope}) — deprioritized`,
      );
    } else if (bucket.accuracy >= preferAcc) {
      score *= LEARNING_PREFER_SCORE_MULT;
      action = "prefer";
      notes.push(
        `Learning: ${type} strong (${pct}% of ${bucket.total} in ${scope}) — preferred`,
      );
    }
  }

  // Prefer DC when SW is proven weak in the same segment
  if (type === "Double Chance") {
    const swBucket = resolveCalibrationBucket(
      "Straight Win",
      country,
      league,
      calibration,
      { preferStake: true, minSample: hardMin },
    );
    const dcBucket =
      bucket ||
      resolveCalibrationBucket(type, country, league, calibration, {
        preferStake: true,
        minSample: hardMin,
      });
    if (
      swBucket &&
      swBucket.total >= hardMin &&
      swBucket.accuracy < skipAcc &&
      dcBucket &&
      dcBucket.total >= hardMin &&
      dcBucket.accuracy >= preferAcc
    ) {
      score *= LEARNING_DC_OVER_WEAK_SW_MULT;
      notes.push(
        `Learning: prefer Double Chance over weak Straight Win in ${scopeLabelOf(swBucket.scope)}`,
      );
      if (!action) action = "prefer";
    }
  }

  return { adjustedScore: score, notes, action };
}

/**
 * After scoring: if stake pick is a weak learning market, switch to a stronger
 * alternative (prefer DC), or skip.
 */
export function enforceLearningStakePick({
  stakePick,
  rankedOptions,
  country,
  league,
  calibration,
}) {
  if (!stakePick || !calibration) {
    return { stakePick, notes: [] };
  }
  const betText = stakePick.recommendation?.bet ?? "";
  if (betText === "AVOID" || betText === "No clear winner") {
    return { stakePick, notes: [] };
  }

  const hardMin =
    calibration?.hardMinSample ?? LEARNING_HARD_MIN_SAMPLE;
  const skipAcc = calibration?.skipAccuracy ?? LEARNING_SKIP_ACCURACY;

  const bucket = resolveCalibrationBucket(
    stakePick.type,
    country,
    league,
    calibration,
    { preferStake: true, minSample: hardMin },
  );

  if (!bucket || bucket.total < hardMin || bucket.accuracy >= skipAcc) {
    return { stakePick, notes: [] };
  }

  const usable = (rankedOptions || []).filter((o) => {
    if (!o || o === stakePick) return false;
    const t = o.recommendation?.bet ?? "";
    if (t === "AVOID" || t === "No clear winner") return false;
    const b = resolveCalibrationBucket(o.type, country, league, calibration, {
      preferStake: true,
      minSample: hardMin,
    });
    // Allow switch if alternative isn't also a hard-skip, or has no hard sample yet
    if (!b || b.total < hardMin) return true;
    return b.accuracy >= skipAcc;
  });

  const preferOrder = [
    "Double Chance",
    "Over/Under",
    "Double Chance 12",
    "Straight Win",
  ];
  usable.sort((a, b) => {
    const scoreDiff = (b.bestBetScore ?? b.adjustedScore ?? 0) -
      (a.bestBetScore ?? a.adjustedScore ?? 0);
    if (Math.abs(scoreDiff) > 0.0001) return scoreDiff;
    return (
      (preferOrder.indexOf(a.type) ?? 99) - (preferOrder.indexOf(b.type) ?? 99)
    );
  });

  if (usable.length > 0) {
    const next = usable[0];
    return {
      stakePick: next,
      notes: [
        `Learning: switched stake pick from ${stakePick.type} to ${next.type} (${(bucket.accuracy * 100).toFixed(0)}% of ${bucket.total} in ${scopeLabelOf(bucket.scope)})`,
      ],
    };
  }

  return {
    stakePick: {
      ...stakePick,
      recommendation: {
        ...stakePick.recommendation,
        bet: "AVOID",
        reasoning: `Learning skip: ${stakePick.type} hit only ${(bucket.accuracy * 100).toFixed(0)}% of ${bucket.total} in ${scopeLabelOf(bucket.scope)}, and no safer market alternative.`,
      },
    },
    notes: [
      `Learning: no stake pick — ${stakePick.type} weak (${(bucket.accuracy * 100).toFixed(0)}% of ${bucket.total}) with no alternative`,
    ],
  };
}

/**
 * Apply confidence calibration onto a ranked market card (mutates copy).
 */
export function applyConfidenceCalibrationToCard(
  card,
  country,
  league,
  calibration,
) {
  if (!card?.recommendation || typeof card.recommendation.confidence !== "number") {
    return card;
  }
  const cal = calibrateDisplayedConfidence(
    card.recommendation.confidence,
    card.type,
    country,
    league,
    calibration,
  );
  if (!cal.note && cal.confidence === card.recommendation.confidence) {
    return card;
  }
  return {
    ...card,
    recommendation: {
      ...card.recommendation,
      confidence: cal.confidence,
      rawConfidence: cal.rawConfidence,
      confidenceCalibrationNote: cal.note,
    },
    lossRuleNotes: cal.note
      ? [...new Set([...(card.lossRuleNotes || []), cal.note])]
      : card.lossRuleNotes,
  };
}
