/**
 * AI Second Opinion (server-side)
 *
 * Given one game plus the app's own recommendations, ask an LLM for an
 * INDEPENDENT betting recommendation. Provider is selectable via env
 * (currently Gemini). The API key never leaves the server.
 */
const { GoogleGenAI, Type } = require("@google/genai");

const PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase();
const MODEL = process.env.AI_MODEL || "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY || "";

let genaiClient = null;
function getGeminiClient() {
  if (!API_KEY) return null;
  if (!genaiClient) genaiClient = new GoogleGenAI({ apiKey: API_KEY });
  return genaiClient;
}

// Strict JSON schema the model must return.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    skip: {
      type: Type.BOOLEAN,
      description: "true if the data is too thin/contradictory to bet with confidence",
    },
    ai_pick: {
      type: Type.STRING,
      description:
        "Your recommended bet, e.g. a team name to win, 'Double Chance <Team> or Draw', 'Double Chance 12', 'Over 2.5', 'Under 2.5', 'Draw', or 'Skip' when skip=true",
    },
    ai_confidence: {
      type: Type.INTEGER,
      description: "Your true confidence 0-100 in ai_pick (0 when skipping)",
    },
    ai_reasoning: {
      type: Type.STRING,
      description: "1-2 concise sentences justifying the pick from the provided data",
    },
    agreement: {
      type: Type.STRING,
      enum: ["agree", "partial", "disagree"],
      description: "How your pick compares to the system's PRIMARY recommendation",
    },
    risk_flag: {
      type: Type.STRING,
      enum: ["none", "odds_trap", "low_data"],
      description: "Main risk you see with this fixture",
    },
  },
  required: ["skip", "ai_pick", "ai_confidence", "ai_reasoning", "agreement", "risk_flag"],
  propertyOrdering: ["skip", "ai_pick", "ai_confidence", "ai_reasoning", "agreement", "risk_flag"],
};

const SYSTEM_INSTRUCTION = [
  "You are an expert football (soccer) betting analyst giving an INDEPENDENT second opinion.",
  "You receive a fixture, market odds, recent form, and another system's recommendations.",
  "Form your OWN recommendation from scratch; do not just echo the system.",
  "You MAY use general football knowledge and priors (home advantage, value of recent form, that short odds imply a strong favourite, draw tendencies in tight games).",
  "You MUST NOT invent specific current facts you cannot know: injuries, suspensions, line-ups, transfers, manager changes, weather, motivation, or actual results. You have no live data.",
  "Base the pick primarily on the provided statistics; treat outside knowledge only as soft priors.",
  "Allowed picks: a team name (to win), 'Double Chance <Team> or Draw', 'Double Chance 12' (home or away, no draw), 'Over X.5', 'Under X.5', or 'Draw'.",
  "If the data is too thin or contradictory to bet with real confidence, set skip=true, ai_pick='Skip', ai_confidence=0.",
  "Set 'agreement' by comparing your pick to the system's PRIMARY recommendation.",
  "You are given the user's historical betting patterns and per-fixture history flags. Weigh them heavily: they reflect where THIS user actually loses money.",
  "If a fixture hits a trap flag (blacklisted/underperforming team, trap league or country), lower your confidence, prefer a safer market (Double Chance / Over-Under), or skip.",
  "Confidence must reflect genuine uncertainty; avoid defaulting to round numbers.",
].join(" ");

// Distilled from analysis of ~23k of the user's settled bets (18.7% overall loss rate).
const PERSONAL_LOSS_PATTERNS = [
  "- Loss rate rises sharply with the price on the backed team: under 1.40 ≈ 15%, 1.40–1.69 ≈ 26%, above 1.70 ≈ 31%. Prefer backed-team odds under ~1.70.",
  "- Straight-win bets lose more (21.5%) than Double Chance (14.3%) or Over/Under (13.3%). Prefer the safer market when the edge is thin.",
  "- Backing the away team loses more (21.7%) than the home team (16.9%).",
  "- ~48% of losses end in a draw and ~37% are decided by one goal — draws are the biggest threat, so in tight/evenly-matched games favour Double Chance.",
].join("\n");

// Fixture entities with historically poor returns for this user (loss rate >= ~40%, or trap markets).
// Sourced from Sheet1 loss analysis (~23k settled legs). Keep in sync with Sheet2 / blacklisted_teams.
const TRAP_COUNTRIES = [
  "poland",
  "austria",
  "qatar",
  "ireland",
  "azerbaijan",
  "japan",
  "ukraine",
  "brazil",
];
const TRAP_LEAGUES = [
  ["poland", "1 liga"],
  ["poland", "ekstraklasa"],
  ["austria", "bundesliga"],
  ["scotland", "championship"],
  ["ireland", "first division"],
  ["qatar", "stars league"],
  ["south africa", "mtn 8"],
  ["brazil", "brasiliero"],
  ["greece", "football league"],
];
const TRAP_TEAMS = [
  // High-volume / high-rate bleeders from loss analysis
  "coventry city",
  "abha club",
  "salpa",
  "pocheon citizen",
  "athens kallithea",
  "fulham",
  "wieczysta krakow",
  "csd municipal",
  "cruzeiro",
  "crystal palace",
  "limavady united",
  "panathinaikos",
  "erzurumspor",
  "sporting cristal",
  "aek larnaca",
  "rubio nu",
  "bohemians dublin",
  "fc salzburg",
  "st. johnstone",
  "st johnstone",
  "wisla krakow",
  "flamengo",
  "man utd",
  "manchester united",
  "dundalk",
  "fc lahti",
  // Already on Sheet2 and still trap-level
  "heart of midlothian",
  "hearts",
  "maccabi petah tikva",
  "al sadd",
  "rakow",
  "vicenza",
  "ue santa coloma",
  "cfr 1907 cluj",
  "fcsb",
  "tp-47",
  "turun palloseura",
  "fk liepaja",
];

function personalHistoryFlags(game) {
  const flags = [];
  const c = String(game.country ?? "").toLowerCase();
  const l = String(game.league ?? "").toLowerCase();
  const hay = [game.match, game.home_team, game.away_team, game.proposedBetLabel]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase())
    .join(" | ");
  if (TRAP_COUNTRIES.some((x) => c.includes(x))) {
    flags.push(`Country "${game.country}" is a historical trap for this user (elevated loss rate).`);
  }
  if (TRAP_LEAGUES.some(([cc, ll]) => c.includes(cc) && l.includes(ll))) {
    flags.push(`League "${game.league}" is a historical trap for this user (very high loss rate).`);
  }
  const hits = TRAP_TEAMS.filter((t) => hay.includes(t));
  if (hits.length) {
    flags.push(`Involves blacklisted/underperforming team(s): ${hits.join(", ")}.`);
  }
  return flags;
}

function fmtForm(form) {
  if (!form) return "unknown";
  const seq = (arr) => (Array.isArray(arr) && arr.length ? ` [${arr.join(" ")}]` : "");
  return (
    `Home ${form.homeWins ?? "?"}W-${form.homeDraws ?? "?"}D-${form.homeLosses ?? "?"}L${seq(form.homeSequence)}; ` +
    `Away ${form.awayWins ?? "?"}W-${form.awayDraws ?? "?"}D-${form.awayLosses ?? "?"}L${seq(form.awaySequence)}`
  );
}

function fmtPick(label, tier) {
  if (!tier || !tier.recommendation) return null;
  const r = tier.recommendation;
  const conf = typeof r.confidence === "number" ? `${r.confidence.toFixed(1)}%` : r.confidence;
  const reason = r.reasoning ? ` — ${r.reasoning}` : "";
  return `${label} (${tier.type}, risk ${tier.riskLevel || "?"}): ${r.bet} @ ${conf}${reason}`;
}

function buildPrompt(game) {
  const lines = [];
  lines.push(`Fixture: ${game.match || `${game.home_team} vs ${game.away_team}`}`);
  if (game.date) lines.push(`Date: ${game.date}`);
  lines.push(`Competition: ${[game.country, game.league].filter(Boolean).join(" · ") || "unknown"}`);
  lines.push(
    `Market odds: home ${game.odds1 ?? "?"}, draw ${game.oddsX ?? "?"}, away ${game.odds2 ?? "?"}` +
      (game.odds ? ` (raw: ${game.odds})` : "")
  );
  lines.push(`Recent form (last 5): ${fmtForm(game.recentFormData)}`);

  if (game.confidenceBreakdown) {
    const cb = game.confidenceBreakdown;
    const parts = Object.entries(cb)
      .filter(([, v]) => v != null)
      .map(([k, v]) => `${k}=${v}`);
    if (parts.length) lines.push(`System confidence breakdown (0-10): ${parts.join(", ")}`);
  }

  const systemPicks = [
    fmtPick("Best bet", game.bestBet),
    fmtPick("Primary", game.primary),
    fmtPick("Secondary", game.secondary),
    fmtPick("Tertiary", game.tertiary),
  ].filter(Boolean);
  if (systemPicks.length) {
    lines.push("");
    lines.push("System's own recommendations:");
    systemPicks.forEach((p) => lines.push(`- ${p}`));
  }

  if (game.proposedBetLabel) lines.push(`User's proposed bet: ${game.proposedBetLabel}`);
  if (game.performanceNote?.label) {
    const pn = game.performanceNote;
    lines.push(
      `User's historical record in ${pn.label}: ${Math.round((pn.winRate || 0) * 100)}% (${pn.wins}W/${pn.totalBets} bets)`
    );
  }
  if (game.lossWarning?.isRisky && game.lossWarning.message) {
    lines.push(`Loss-pattern warning: ${game.lossWarning.message}`);
  }
  if (game.oddsTrapMessage) lines.push(`Odds-trap note: ${game.oddsTrapMessage}`);

  lines.push("");
  lines.push("User's historical betting patterns (weigh these — they reflect the user's real results):");
  lines.push(PERSONAL_LOSS_PATTERNS);

  const flags = personalHistoryFlags(game);
  if (flags.length) {
    lines.push("");
    lines.push("Personal history flags for THIS fixture:");
    flags.forEach((f) => lines.push(`- ${f}`));
  }

  lines.push("");
  lines.push("Give your independent recommendation as JSON matching the schema.");
  return lines.join("\n");
}

function isRateLimitError(err) {
  const msg = String(err?.message || "");
  return (
    err?.status === 429 ||
    err?.code === 429 ||
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED")
  );
}

/** Pull Google's suggested wait (seconds) out of a 429 error, if present. */
function parseRetryDelayMs(err) {
  const msg = String(err?.message || "");
  const m = /retry in ([\d.]+)\s*s/i.exec(msg) || /"retryDelay":\s*"([\d.]+)s"/i.exec(msg);
  if (m) return Math.ceil(parseFloat(m[1]) * 1000);
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateWithRetry(client, params, maxRetries = 4) {
  let attempt = 0;
  for (;;) {
    try {
      return await client.models.generateContent(params);
    } catch (err) {
      if (!isRateLimitError(err) || attempt >= maxRetries) throw err;
      const delay = Math.min(parseRetryDelayMs(err) || 2000 * 2 ** attempt, 65000);
      await sleep(delay + 500);
      attempt += 1;
    }
  }
}

async function getSecondOpinion(game) {
  if (PROVIDER !== "gemini") {
    throw new Error(`Unsupported AI_PROVIDER "${PROVIDER}". Only "gemini" is wired up.`);
  }
  const client = getGeminiClient();
  if (!client) {
    const err = new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
    err.code = "NO_API_KEY";
    throw err;
  }

  let response;
  try {
    response = await generateWithRetry(client, {
      model: MODEL,
      contents: buildPrompt(game),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.4,
      },
    });
  } catch (err) {
    if (isRateLimitError(err)) {
      const e = new Error(
        "Gemini free-tier rate limit reached. Wait a minute and retry, or enable billing for higher limits."
      );
      e.code = "RATE_LIMIT";
      throw e;
    }
    throw err;
  }

  const text = response.text;
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(`AI returned non-JSON response: ${String(text).slice(0, 300)}`);
  }
  return { ...parsed, model: MODEL, provider: PROVIDER };
}

module.exports = { getSecondOpinion };
