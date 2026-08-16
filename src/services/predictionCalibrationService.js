/**
 * Segmented prediction accuracy → soft ranking nudge.
 * Uses settled betslip recommendations (system picks vs match outcome).
 */

export const CALIBRATION_MIN_SAMPLE = 20;
export const CALIBRATION_BASELINE = 0.55; // expected hit rate before boost/penalty
export const CALIBRATION_K = 0.4; // how strongly accuracy moves the score
export const CALIBRATION_CLAMP_MIN = 0.85;
export const CALIBRATION_CLAMP_MAX = 1.15;

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

/**
 * Resolve the best available bucket: league → country → global market.
 * Only returns a bucket that meets minSample (thin league data must not block overall).
 * @param {string} marketType - e.g. "Straight Win"
 * @param {string} country
 * @param {string} league
 * @param {object|null} calibration - API payload
 */
export function resolveCalibrationBucket(marketType, country, league, calibration) {
  if (!calibration || !marketType) return null;

  const minSample = calibration?.minSample ?? CALIBRATION_MIN_SAMPLE;
  const c = norm(country);
  const l = norm(league);
  const leagueKey = `${marketType}|${c}|${l}`;
  const countryKey = `${marketType}|${c}`;

  const candidates = [
    { hit: packHit(calibration.marketLeague?.[leagueKey]), scope: "league", key: leagueKey },
    { hit: packHit(calibration.marketCountry?.[countryKey]), scope: "country", key: countryKey },
    { hit: packHit(calibration.markets?.[marketType]), scope: "market", key: marketType },
  ];

  for (const candidate of candidates) {
    if (candidate.hit && candidate.hit.total >= minSample) {
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
  const scopeLabel =
    bucket.scope === "league"
      ? "this league"
      : bucket.scope === "country"
        ? "this country"
        : "overall";
  const direction = multiplier > 1 ? "boosted" : "reduced";
  const note = `${marketType} ${direction} (${pct}% of ${bucket.total} in ${scopeLabel})`;

  return { multiplier, note, bucket };
}
