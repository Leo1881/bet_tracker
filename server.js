const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Database configuration
const POSTGRES_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "bet_tracker",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(POSTGRES_CONFIG);

// Test database connection
app.get("/api/test", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    res.json({ success: true, timestamp: result.rows[0].now });
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check predictions table structure
app.get("/api/check-predictions-table", async (req, res) => {
  try {
    const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'predictions' 
      ORDER BY ordinal_position
    `;
    const result = await pool.query(query);
    res.json({ columns: result.rows });
  } catch (error) {
    console.error("Error checking predictions table:", error);
    res.status(500).json({ error: error.message });
  }
});

// List all tables
app.get("/api/list-tables", async (req, res) => {
  try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    const result = await pool.query(query);
    res.json({ tables: result.rows.map((row) => row.table_name) });
  } catch (error) {
    console.error("Error listing tables:", error);
    res.status(500).json({ error: error.message });
  }
});

// Check attached_predictions table structure
app.get("/api/check-attached-predictions-table", async (req, res) => {
  try {
    const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'attached_predictions' 
      ORDER BY ordinal_position
    `;
    const result = await pool.query(query);
    res.json({ columns: result.rows });
  } catch (error) {
    console.error("Error checking attached_predictions table:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all bets
app.get("/api/bets", async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        date,
        bet_id,
        country,
        league,
        home_team,
        odds_1,
        away_team,
        odds_2,
        bet_type,
        bet_selection,
        team_bet,
        home_score,
        away_score,
        result,
        reason,
        created_at
      FROM bets 
      ORDER BY date DESC, created_at DESC
    `;

    const result = await pool.query(query);

    // Transform to match existing data structure
    const bets = result.rows.map((row) => ({
      DATE: row.date,
      BET_ID: row.bet_id,
      COUNTRY: row.country,
      LEAGUE: row.league,
      HOME_TEAM: row.home_team,
      ODDS1: row.odds_1,
      AWAY_TEAM: row.away_team,
      ODDS2: row.odds_2,
      BET_TYPE: row.bet_type,
      BET_SELECTION: row.bet_selection,
      TEAM_INCLUDED: row.team_bet,
      HOME_SCORE: row.home_score,
      AWAY_SCORE: row.away_score,
      RESULT: row.result,
      REASON: row.reason,
      CREATED_AT: row.created_at,
    }));

    res.json(bets);
  } catch (error) {
    console.error("Error fetching bets:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get blacklisted teams
app.get("/api/blacklisted-teams", async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        country,
        league,
        team_name,
        date_added
      FROM blacklisted_teams 
      ORDER BY date_added DESC
    `;

    const result = await pool.query(query);

    const teams = result.rows.map((row) => ({
      country: row.country,
      league: row.league,
      team_name: row.team_name,
      date_added: row.date_added,
    }));

    res.json(teams);
  } catch (error) {
    console.error("Error fetching blacklisted teams:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get new bets
app.get("/api/new-bets", async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        date,
        country,
        league,
        home_team,
        odds1,
        away_team,
        odds2,
        bet_type,
        bet_selection,
        team_included,
        created_at
      FROM new_bets 
      ORDER BY date DESC, created_at DESC
    `;

    const result = await pool.query(query);

    const newBets = result.rows.map((row) => ({
      date: row.date,
      country: row.country,
      league: row.league,
      home_team: row.home_team,
      odds1: row.odds1,
      away_team: row.away_team,
      odds2: row.odds2,
      bet_type: row.bet_type,
      bet_selection: row.bet_selection,
      team_included: row.team_included,
      created_at: row.created_at,
    }));

    res.json(newBets);
  } catch (error) {
    console.error("Error fetching new bets:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get team notes
app.get("/api/team-notes", async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        country,
        league,
        team_name,
        note,
        date_added
      FROM team_notes 
      ORDER BY date_added DESC
    `;

    const result = await pool.query(query);

    const notes = result.rows.map((row) => ({
      country: row.country,
      league: row.league,
      team_name: row.team_name,
      note: row.note,
      date_added: row.date_added,
    }));

    res.json(notes);
  } catch (error) {
    console.error("Error fetching team notes:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get attached predictions
app.get("/api/attached-predictions", async (req, res) => {
  try {
    // Check if table exists first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'attached_predictions'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      // Table doesn't exist, return empty array
      console.log("attached_predictions table does not exist, returning empty array");
      return res.json([]);
    }

    const query = `
      SELECT 
        id,
        betslip_id,
        predictions_data,
        created_at
      FROM attached_predictions 
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);

    const predictions = result.rows
      .map((row) => {
        try {
          const parsedPredictions =
            typeof row.predictions_data === "string"
              ? JSON.parse(row.predictions_data)
              : row.predictions_data;

          return {
            betslipId: row.betslip_id,
            predictions: parsedPredictions,
            createdAt: row.created_at,
          };
        } catch (parseError) {
          console.error(
            "Error parsing prediction data for betslip:",
            row.betslip_id,
            parseError
          );
          return null;
        }
      })
      .filter(Boolean); // Remove null entries

    res.json(predictions);
  } catch (error) {
    console.error("Error fetching attached predictions:", error);
    // Return empty array instead of 500 error for any database issues
    // This prevents the app from breaking if the table doesn't exist or DB is unavailable
    console.log("Returning empty array due to error:", error.message);
    return res.json([]);
  }
});

// Save attached predictions
app.post("/api/attached-predictions", async (req, res) => {
  try {
    const { betslipId, predictions } = req.body;

    const query = `
      INSERT INTO attached_predictions (betslip_id, predictions_data, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (betslip_id) 
      DO UPDATE SET 
        predictions_data = $2,
        created_at = NOW()
    `;

    const result = await pool.query(query, [
      betslipId,
      JSON.stringify(predictions),
    ]);

    res.json({ success: true, betslipId });
  } catch (error) {
    console.error("Error saving attached predictions:", error);
    res.status(500).json({ error: error.message });
  }
});

// Store recommendations for tracking
app.post("/api/recommendations", async (req, res) => {
  try {
    const { betslipId, recommendations } = req.body;

    if (!betslipId || !recommendations || !Array.isArray(recommendations)) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    // Insert each recommendation
    const insertQuery = `
      INSERT INTO recommendation_tracking (
        betslip_id, bet_id, game_id, date, home_team, away_team, team_included,
        bet_type, bet_selection, odds1, odds2, oddsx,
        recommendation, confidence_score, confidence_breakdown,
        reasoning, historical_data, probabilities,
        primary_recommendation, primary_confidence, primary_reasoning,
        secondary_recommendation, secondary_confidence, secondary_reasoning,
        tertiary_recommendation, tertiary_confidence, tertiary_reasoning,
        chosen_recommendation_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
      ON CONFLICT (bet_id, betslip_id) 
      DO UPDATE SET 
        bet_id = $2,
        recommendation = $13,
        confidence_score = $14,
        confidence_breakdown = $15,
        reasoning = $16,
        historical_data = $17,
        probabilities = $18,
        primary_recommendation = $19,
        primary_confidence = $20,
        primary_reasoning = $21,
        secondary_recommendation = $22,
        secondary_confidence = $23,
        secondary_reasoning = $24,
        tertiary_recommendation = $25,
        tertiary_confidence = $26,
        tertiary_reasoning = $27,
        chosen_recommendation_type = $28,
        updated_at = NOW()
    `;

    for (const rec of recommendations) {
      // Debug: Check what's being received by the server
      if (recommendations.indexOf(rec) === 0) {
        console.log("First recommendation received by server:", rec);
        console.log("BET_ID in first recommendation:", rec.bet_id);
      }

      const gameId = `${rec.date}_${rec.home_team}_${rec.away_team}`.replace(
        /\s+/g,
        "_"
      );

      // Parse date format (e.g., "13-Sep" to proper date)
      const parseDate = (dateStr) => {
        if (!dateStr) return null;

        // Handle "13-Sep" format
        if (dateStr.includes("-") && dateStr.length <= 6) {
          const [day, month] = dateStr.split("-");
          const monthMap = {
            Jan: "01",
            Feb: "02",
            Mar: "03",
            Apr: "04",
            May: "05",
            Jun: "06",
            Jul: "07",
            Aug: "08",
            Sep: "09",
            Oct: "10",
            Nov: "11",
            Dec: "12",
          };
          const currentYear = new Date().getFullYear();
          return `${currentYear}-${monthMap[month] || "01"}-${day.padStart(
            2,
            "0"
          )}`;
        }

        // Handle other formats or return as-is
        return dateStr;
      };

      // Helper function to parse numeric values
      const parseNumeric = (value) => {
        if (!value || value === "" || value === "null") return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };

      // Debug: Check what's being inserted into database
      if (recommendations.indexOf(rec) === 0) {
        console.log("Inserting into database with bet_id:", rec.bet_id);
        console.log("Recommendation type:", rec.recommendation_type);
      }

      try {
        await pool.query(insertQuery, [
          betslipId,
          rec.bet_id || null, // Add bet_id from the recommendation data
          gameId,
          parseDate(rec.date),
          rec.home_team,
          rec.away_team,
          rec.team_included,
          rec.bet_type,
          rec.bet_selection,
          parseNumeric(rec.odds1),
          parseNumeric(rec.odds2),
          parseNumeric(rec.oddsX),
          rec.primary_recommendation, // Use primary as main recommendation
          parseNumeric(rec.confidence_score),
          JSON.stringify(rec.confidence_breakdown),
          rec.primary_reasoning, // Use primary reasoning
          JSON.stringify(rec.historical_data),
          JSON.stringify(rec.probabilities),
          // All 3 recommendations
          rec.primary_recommendation,
          parseNumeric(rec.primary_confidence),
          rec.primary_reasoning,
          rec.secondary_recommendation,
          parseNumeric(rec.secondary_confidence),
          rec.secondary_reasoning,
          rec.tertiary_recommendation,
          parseNumeric(rec.tertiary_confidence),
          rec.tertiary_reasoning,
          "PRIMARY", // Default chosen recommendation type
        ]);
        console.log(
          "Successfully inserted recommendation for:",
          rec.home_team,
          "vs",
          rec.away_team
        );
      } catch (insertError) {
        console.error("Error inserting recommendation:", insertError);
        console.error("Recommendation data:", rec);
        throw insertError;
      }
    }

    res.json({ success: true, stored: recommendations.length });
  } catch (error) {
    console.error("Error storing recommendations:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update a specific recommendation record
app.put("/api/recommendations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      actual_result,
      prediction_accurate,
      recommendation_alignment,
      your_bet_won,
      analysis_type,
      insight,
      result_updated_at,
    } = req.body;

    console.log(
      `PUT /api/recommendations/${id} - Updating record with ID: ${id}`
    );
    console.log(`Request body:`, {
      actual_result,
      prediction_accurate,
      recommendation_alignment,
      your_bet_won,
      analysis_type,
      insight,
      result_updated_at,
    });

    // First, let's check if the record exists
    const checkQuery = `SELECT id, bet_id, betslip_id FROM recommendation_tracking WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [id]);

    console.log(`Record check result:`, checkResult.rows);

    const query = `
      UPDATE recommendation_tracking 
      SET 
        actual_result = $1,
        prediction_accurate = $2,
        recommendation_alignment = $3,
        your_bet_won = $4,
        analysis_type = $5,
        insight = $6,
        result_updated_at = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;

    const result = await pool.query(query, [
      actual_result,
      prediction_accurate,
      recommendation_alignment,
      your_bet_won,
      analysis_type,
      insight,
      result_updated_at,
      id,
    ]);

    console.log(`Update result:`, result.rows);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Recommendation not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating recommendation:", error);
    res.status(500).json({ error: "Failed to update recommendation" });
  }
});

// Get stored recommendations
app.get("/api/recommendations", async (req, res) => {
  try {
    const { betslipId, date, betId } = req.query;

    let query = `
      SELECT 
        id, betslip_id, bet_id, game_id, date, home_team, away_team, team_included,
        bet_type, bet_selection, odds1, odds2, oddsX,
        recommendation, recommendation_type, confidence_score, confidence_breakdown,
        reasoning, historical_data, probabilities,
        primary_recommendation, primary_confidence, primary_reasoning,
        secondary_recommendation, secondary_confidence, secondary_reasoning,
        tertiary_recommendation, tertiary_confidence, tertiary_reasoning,
        chosen_recommendation_type,
        actual_result, actual_home_score, actual_away_score,
        prediction_accurate, system_prediction_accurate, your_bet_won, analysis_type, insight, analysis_notes,
        created_at, updated_at, result_updated_at
      FROM recommendation_tracking
    `;

    const params = [];
    const conditions = [];

    if (betslipId) {
      conditions.push(`betslip_id = $${params.length + 1}`);
      params.push(betslipId);
    }

    if (date) {
      conditions.push(`date = $${params.length + 1}`);
      params.push(date);
    }

    if (betId) {
      conditions.push(`bet_id = $${params.length + 1}`);
      params.push(betId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY date DESC, created_at DESC`;

    const result = await pool.query(query, params);

    // Parse JSON fields (handle both string and object cases)
    const parseJsonField = (field) => {
      if (!field) return null;
      if (typeof field === "object") return field; // Already parsed
      if (typeof field === "string") {
        try {
          return JSON.parse(field);
        } catch (e) {
          console.warn("Failed to parse JSON field:", field);
          return null;
        }
      }
      return null;
    };

    const recommendations = result.rows.map((row) => ({
      ...row,
      confidence_breakdown: parseJsonField(row.confidence_breakdown),
      historical_data: parseJsonField(row.historical_data),
      probabilities: parseJsonField(row.probabilities),
    }));

    // Debug: Check what's being retrieved from database
    if (recommendations.length > 0) {
      console.log(
        "First recommendation retrieved from DB:",
        recommendations[0]
      );
      console.log(
        "BET_ID in retrieved recommendation:",
        recommendations[0]?.bet_id
      );
      console.log(
        "BET_TYPE in retrieved recommendation:",
        recommendations[0]?.bet_type
      );
    }

    res.json(recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ error: error.message });
  }
});

// Store analysis results
app.post("/api/recommendation-analysis", async (req, res) => {
  try {
    const {
      analysis_date,
      total_recommendations,
      correct_predictions,
      wrong_predictions,
      pending_predictions,
      confidence_failure_analysis,
      team_performance_analysis,
      recommendation_type_analysis,
      league_analysis,
      overall_accuracy,
      high_confidence_accuracy,
      medium_confidence_accuracy,
      low_confidence_accuracy,
      notes,
    } = req.body;

    const insertQuery = `
      INSERT INTO recommendation_analysis (
        analysis_date, total_recommendations, correct_predictions, wrong_predictions,
        pending_predictions, confidence_failure_analysis, team_performance_analysis,
        recommendation_type_analysis, league_analysis, overall_accuracy,
        high_confidence_accuracy, medium_confidence_accuracy, low_confidence_accuracy, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;

    await pool.query(insertQuery, [
      analysis_date,
      total_recommendations,
      correct_predictions,
      wrong_predictions,
      pending_predictions,
      JSON.stringify(confidence_failure_analysis),
      JSON.stringify(team_performance_analysis),
      JSON.stringify(recommendation_type_analysis),
      JSON.stringify(league_analysis),
      overall_accuracy,
      high_confidence_accuracy,
      medium_confidence_accuracy,
      low_confidence_accuracy,
      notes,
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error("Error storing analysis results:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get analysis results
app.get("/api/recommendation-analysis", async (req, res) => {
  try {
    const query = `
      SELECT 
        id, analysis_date, total_recommendations, correct_predictions,
        wrong_predictions, pending_predictions, confidence_failure_analysis,
        team_performance_analysis, recommendation_type_analysis, league_analysis,
        overall_accuracy, high_confidence_accuracy, medium_confidence_accuracy,
        low_confidence_accuracy, notes, created_at
      FROM recommendation_analysis
      ORDER BY analysis_date DESC, created_at DESC
    `;

    const result = await pool.query(query);

    // Parse JSON fields
    const analyses = result.rows.map((row) => ({
      ...row,
      confidence_failure_analysis: row.confidence_failure_analysis
        ? JSON.parse(row.confidence_failure_analysis)
        : null,
      team_performance_analysis: row.team_performance_analysis
        ? JSON.parse(row.team_performance_analysis)
        : null,
      recommendation_type_analysis: row.recommendation_type_analysis
        ? JSON.parse(row.recommendation_type_analysis)
        : null,
      league_analysis: row.league_analysis
        ? JSON.parse(row.league_analysis)
        : null,
    }));

    res.json(analyses);
  } catch (error) {
    console.error("Error fetching analysis results:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========== New betslip recommendations flow (no link to old recommendation_tracking) ==========

// Save one betslip (all games) to betslip_recommendations
app.post("/api/betslip-recommendations", async (req, res) => {
  try {
    const { bet_id, betslip_id, recommendations } = req.body;
    if (!bet_id || !recommendations || !Array.isArray(recommendations)) {
      return res.status(400).json({ error: "Invalid request: need bet_id and recommendations array" });
    }
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      if (dateStr.includes("T")) return dateStr.split("T")[0];
      if (dateStr.includes("-") && dateStr.length <= 6) {
        const [day, month] = dateStr.split("-");
        const monthMap = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
        const y = new Date().getFullYear();
        return `${y}-${monthMap[month] || "01"}-${String(day).padStart(2, "0")}`;
      }
      return dateStr;
    };
    const parseNum = (v) => {
      if (v === undefined || v === null || v === "") return null;
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    };
    const sid = betslip_id || `betslip_${Date.now()}`;
    const insert = `
      INSERT INTO betslip_recommendations (
        bet_id, betslip_id, game_id, date, country, league, home_team, away_team, team_included,
        bet_type, bet_selection, odds1, odds2, oddsx,
        recommendation, confidence_score, reasoning,
        primary_recommendation, primary_confidence, primary_reasoning,
        secondary_recommendation, secondary_confidence, secondary_reasoning,
        tertiary_recommendation, tertiary_confidence, tertiary_reasoning
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      ON CONFLICT (bet_id, country, league, bet_type, bet_selection, team_included)
      DO UPDATE SET
        betslip_id = $2, game_id = $3, date = $4, home_team = $7, away_team = $8,
        odds1 = $12, odds2 = $13, oddsx = $14, recommendation = $15, confidence_score = $16, reasoning = $17,
        primary_recommendation = $18, primary_confidence = $19, primary_reasoning = $20,
        secondary_recommendation = $21, secondary_confidence = $22, secondary_reasoning = $23,
        tertiary_recommendation = $24, tertiary_confidence = $25, tertiary_reasoning = $26,
        updated_at = NOW()
    `;
    for (const r of recommendations) {
      const gameId = `${(r.date || "").toString().replace(/\s/g, "_")}_${(r.home_team || "").replace(/\s/g, "_")}_${(r.away_team || "").replace(/\s/g, "_")}`;
      await pool.query(insert, [
        bet_id,
        sid,
        gameId,
        parseDate(r.date),
        r.country ?? null,
        r.league ?? null,
        r.home_team ?? null,
        r.away_team ?? null,
        r.team_included ?? null,
        r.bet_type ?? null,
        r.bet_selection ?? null,
        parseNum(r.odds1),
        parseNum(r.odds2),
        parseNum(r.oddsx),
        r.recommendation ?? null,
        parseNum(r.confidence_score),
        r.reasoning ?? null,
        r.primary_recommendation ?? null,
        parseNum(r.primary_confidence),
        r.primary_reasoning ?? null,
        r.secondary_recommendation ?? null,
        parseNum(r.secondary_confidence),
        r.secondary_reasoning ?? null,
        r.tertiary_recommendation ?? null,
        parseNum(r.tertiary_confidence),
        r.tertiary_reasoning ?? null,
      ]);
    }
    res.json({ success: true, bet_id, stored: recommendations.length });
  } catch (error) {
    console.error("Error saving betslip recommendations:", error);
    res.status(500).json({ error: error.message });
  }
});

// Evaluate if a recommendation was correct given actual scores (shared logic)
// actualResult: optional string like "Home Win", "Away Win", "Draw" for when scores are missing
function evaluateRecommendation(rec, homeTeam, awayTeam, homeScore, awayScore, actualResult) {
  if (!rec || String(rec).trim() === "") return null;
  const recLower = String(rec).toLowerCase();
  const hasScores = homeScore != null && awayScore != null;
  const total = (homeScore ?? 0) + (awayScore ?? 0);
  const homeWon = (homeScore ?? 0) > (awayScore ?? 0);
  const awayWon = (awayScore ?? 0) > (homeScore ?? 0);
  const draw = hasScores && homeScore === awayScore;
  const ar = String(actualResult || "").toLowerCase();
  const isDrawFromResult = ar.includes("draw") && !ar.includes("win");
  const isWinFromResult = ar.includes("win") && !ar.includes("draw");

  // "No clear winner" = system abstained from a clear prediction; not evaluable, fall back to secondary/tertiary
  if (recLower.includes("no clear")) return null;

  const normalize = (v) => (v == null ? "" : String(v).trim().toLowerCase());
  const normRec = (s) => normalize(s).replace(/\s+(to\s+)?win$/, "").replace(/\s+avoid$/, "").replace(/\s+fc\.?\s*$/i, "").trim();
  const TEAM_ALIASES = { "man utd": "manchester united", "man united": "manchester united", "hearts": "heart of midlothian", "heart of midlothian": "heart of midlothian" };
  const normTeam = (t) => TEAM_ALIASES[normRec(t)] ?? normRec(t);
  const teamMatches = (recTeam, gameTeam) => {
    const r = normTeam(recTeam);
    const g = normTeam(gameTeam);
    return r === g || g.includes(r) || r.includes(g);
  };
  const r = normRec(rec);
  const overMatch = r.match(/over\s+([\d.]+)/);
  if (overMatch) return hasScores ? total > parseFloat(overMatch[1]) : null;
  const underMatch = r.match(/under\s+([\d.]+)/);
  if (underMatch) return hasScores ? total < parseFloat(underMatch[1]) : null;
  // "X or Draw" (double chance) ≠ "X to win" – different risk. Only correct when result is draw.
  const orDrawMatch = r.match(/^(.+?)\s+or\s+draw$/);
  if (orDrawMatch) {
    const teamPart = orDrawMatch[1].trim();
    if (teamMatches(teamPart, homeTeam) || teamMatches(teamPart, awayTeam)) {
      const wasDraw = hasScores ? draw : (isDrawFromResult ? true : (isWinFromResult ? false : null));
      return wasDraw;
    }
    return null;
  }
  if (teamMatches(rec, homeTeam)) return homeWon;
  if (teamMatches(rec, awayTeam)) return awayWon;
  return null;
}

// List saved betslips / games (optional ?bet_id= filter)
app.get("/api/betslip-recommendations", async (req, res) => {
  try {
    const { bet_id } = req.query;
    let query = `SELECT * FROM betslip_recommendations ORDER BY date DESC, id DESC`;
    const params = [];
    if (bet_id) {
      query = `SELECT * FROM betslip_recommendations WHERE bet_id = $1 ORDER BY date ASC, id ASC`;
      params.push(bet_id);
    }
    const result = await pool.query(query, params);
    const rows = result.rows.map((row) => {
      const hs = row.actual_home_score != null ? Number(row.actual_home_score) : null;
      const as = row.actual_away_score != null ? Number(row.actual_away_score) : null;
      const primary = row.primary_recommendation ?? row.recommendation;
      const evalRow = (rec) => evaluateRecommendation(rec, row.home_team, row.away_team, hs, as, row.actual_result);
      const pCorrect = evalRow(primary);
      const sCorrect = evalRow(row.secondary_recommendation);
      const tCorrect = evalRow(row.tertiary_recommendation);
      // Prioritize primary: if primary is evaluable, use it; else fall back to secondary, then tertiary
      const systemCorrect = pCorrect !== null ? pCorrect : (sCorrect !== null ? sCorrect : tCorrect);
      const systemKnown = pCorrect !== null || sCorrect !== null || tCorrect !== null;
      return { ...row, system_primary_correct: pCorrect, system_secondary_correct: sCorrect, system_tertiary_correct: tCorrect, system_prediction_accurate: systemKnown ? systemCorrect : null };
    });
    res.json(rows);
  } catch (error) {
    console.error("Error fetching betslip recommendations:", error);
    res.status(500).json({ error: error.message });
  }
});

// Tier accuracy: Evaluate SYSTEM recommendations against actual match outcome (not user's bet)
app.get("/api/betslip-recommendations/tier-accuracy", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT date, home_team, away_team, primary_recommendation, secondary_recommendation, tertiary_recommendation, recommendation, actual_result, actual_home_score, actual_away_score
       FROM betslip_recommendations
       WHERE actual_result IS NOT NULL AND TRIM(actual_result) != ''`
    );
    const normalize = (v) => (v == null ? "" : String(v).trim().toLowerCase());
    const normRec = (s) => normalize(s).replace(/\s+(to\s+)?win$/, "").replace(/\s+avoid$/, "").replace(/\s+fc\.?\s*$/i, "").trim();
    const TEAM_ALIASES = { "man utd": "manchester united", "man united": "manchester united", "hearts": "heart of midlothian", "heart of midlothian": "heart of midlothian", "coleraine": "coleraine", "hibernian": "hibernian" };
    const normTeam = (t) => TEAM_ALIASES[normRec(t)] ?? normRec(t);
    const teamMatches = (recTeam, gameTeam) => {
      const r = normTeam(recTeam);
      const g = normTeam(gameTeam);
      return r === g || g.includes(r) || r.includes(g);
    };

    // Dedupe by game (same game can appear on multiple betslips)
    const gameKey = (r) => `${normRec(r.home_team)}|${normRec(r.away_team)}|${r.date}`;
    const seen = new Set();
    const games = result.rows.filter((r) => {
      const k = gameKey(r);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const tiers = { primary: { correct: 0, total: 0 }, secondary: { correct: 0, total: 0 }, tertiary: { correct: 0, total: 0 } };
    const gamesWithoutScores = [];
    for (const row of games) {
      const hs = row.actual_home_score != null ? Number(row.actual_home_score) : null;
      const as = row.actual_away_score != null ? Number(row.actual_away_score) : null;
      const canEvaluate = (hs != null && as != null) || (row.actual_result && String(row.actual_result).trim() !== "");
      if (!canEvaluate) {
        gamesWithoutScores.push(`${row.home_team} vs ${row.away_team}`);
        continue;
      }
      const primary = row.primary_recommendation ?? row.recommendation;
      const pCorrect = evaluateRecommendation(primary, row.home_team, row.away_team, hs, as, row.actual_result);
      const sCorrect = evaluateRecommendation(row.secondary_recommendation, row.home_team, row.away_team, hs, as, row.actual_result);
      const tCorrect = evaluateRecommendation(row.tertiary_recommendation, row.home_team, row.away_team, hs, as, row.actual_result);

      if (pCorrect !== null) {
        tiers.primary.total++;
        if (pCorrect) tiers.primary.correct++;
      }
      if (sCorrect !== null) {
        tiers.secondary.total++;
        if (sCorrect) tiers.secondary.correct++;
      }
      if (tCorrect !== null) {
        tiers.tertiary.total++;
        if (tCorrect) tiers.tertiary.correct++;
      }
    }

    const primaryAcc = tiers.primary.total > 0 ? (tiers.primary.correct / tiers.primary.total) * 100 : 0;
    const secondaryAcc = tiers.secondary.total > 0 ? (tiers.secondary.correct / tiers.secondary.total) * 100 : 0;
    const tertiaryAcc = tiers.tertiary.total > 0 ? (tiers.tertiary.correct / tiers.tertiary.total) * 100 : 0;
    const totalBets = tiers.primary.total + tiers.secondary.total + tiers.tertiary.total;
    res.json({
      primary: { correct: tiers.primary.correct, total: tiers.primary.total, accuracy: primaryAcc },
      secondary: { correct: tiers.secondary.correct, total: tiers.secondary.total, accuracy: secondaryAcc },
      tertiary: { correct: tiers.tertiary.correct, total: tiers.tertiary.total, accuracy: tertiaryAcc },
      totalBets,
      gamesWithoutScores: gamesWithoutScores.length > 0 ? gamesWithoutScores : undefined,
    });
  } catch (error) {
    console.error("Error fetching tier accuracy:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get distinct bet_ids for dropdown
app.get("/api/betslip-recommendations/bet-ids", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT bet_id FROM betslip_recommendations ORDER BY bet_id DESC`
    );
    res.json(result.rows.map((r) => r.bet_id));
  } catch (error) {
    console.error("Error fetching bet IDs:", error);
    res.status(500).json({ error: error.message });
  }
});

// Compare: accept results from Sheet1, match by (bet_id, country, league, bet_type, bet_selection, team_included), update actual_result
app.post("/api/betslip-recommendations/compare", async (req, res) => {
  try {
    const { bet_id, results } = req.body;
    if (!bet_id || !results || !Array.isArray(results)) {
      return res.status(400).json({ error: "Invalid request: need bet_id and results array" });
    }
    const rows = await pool.query(
      `SELECT id, bet_id, country, league, bet_type, bet_selection, team_included, home_team, away_team FROM betslip_recommendations WHERE bet_id = $1`,
      [bet_id]
    );
    const normalize = (v) => {
      let s = (v == null ? "" : String(v).trim().toLowerCase().replace(/\s+/g, " "));
      return s.replace(/\s+fc\.?\s*$/i, "").trim();
    };
    // Team name aliases for matching (Sheet1 may use abbreviations; DB may use full names)
    const TEAM_ALIASES = {
      "man utd": "manchester united",
      "man united": "manchester united",
      "man city": "manchester city",
      "leeds": "leeds united",
      "leeds united": "leeds united",
      "west ham": "west ham united",
      "west ham united": "west ham united",
      "chelsea fc": "chelsea",
      "chelsea": "chelsea",
      "spurs": "tottenham hotspur",
      "tottenham": "tottenham hotspur",
      "liv": "liverpool",
      "celtic glasgow": "celtic",
      "celtic": "celtic",
      "psg": "paris saint-germain",
      "paris sg": "paris saint-germain",
      "inter": "inter milan",
      "inter milan": "inter milan",
      "juve": "juventus turin",
      "juventus": "juventus turin",
      "rb leipzig": "rb leipzig",
      "bayern": "bayern munich",
      "bayern munich": "bayern munich",
      "real madrid": "real madrid",
      "barcelona": "fc barcelona",
      "fc barcelona": "fc barcelona",
      "sl benfica": "benfica",
      "benfica": "benfica",
      "sporting lisbon": "sporting cp",
      "sporting cp": "sporting cp",
      "fc porto": "porto",
      "porto": "porto",
      "livingston fc": "livingston",
      "livingston": "livingston",
      "heart of midlothian": "hearts",
      "hibernian": "hibernian",
      "hearts": "hearts",
    };
    const canonicalTeam = (name) => {
      const n = normalize(name);
      return TEAM_ALIASES[n] ?? n;
    };
    const resultMap = new Map();
    const fallbackRows = []; // { home, away, result } from Sheet1 - match by iterating
    const resultsByIndex = []; // [result|null, ...] - match by row position when Sheet1 and DB have same order
    let rowsWithResult = 0;
    let rowsWithHomeAway = 0;
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const key = [
        normalize(row.country ?? row.COUNTRY),
        normalize(row.league ?? row.LEAGUE),
        normalize(row.bet_type ?? row.BET_TYPE),
        normalize(row.bet_selection ?? row.BET_SELECTION),
        normalize(row.team_included ?? row.TEAM_INCLUDED),
      ].join("|");
      const resVal = row.result ?? row.RESULT ?? row.actual_result ?? row.outcome ?? row["Win/Loss"];
      const home = normalize(row.home_team ?? row.HOME_TEAM);
      const away = normalize(row.away_team ?? row.AWAY_TEAM);
      if (home || away) rowsWithHomeAway++;
      const val = (resVal !== undefined && resVal !== null && String(resVal).trim() !== "") ? String(resVal).trim() : null;
      const parseScore = (s) => { const n = parseInt(String(s || ""), 10); return isNaN(n) ? null : n; };
      const hs = parseScore(row.home_score ?? row.HOME_SCORE);
      const as = parseScore(row.away_score ?? row.AWAY_SCORE);
      if (val) {
        rowsWithResult++;
        resultMap.set(key, { result: val, home_score: hs, away_score: as });
        if (home || away) {
          const h = canonicalTeam(row.home_team ?? row.HOME_TEAM);
          const a = canonicalTeam(row.away_team ?? row.AWAY_TEAM);
          fallbackRows.push({ home, away, result: val, home_score: hs, away_score: as });
          fallbackRows.push({ home: h, away: a, result: val, home_score: hs, away_score: as });
        }
      }
      resultsByIndex[i] = val ? { result: val, home_score: hs, away_score: as } : null;
    }
    // Helper: find result + scores from fallbackRows by matching home|away
    const findFallbackResult = (dbHome, dbAway) => {
      const h = normalize(dbHome);
      const a = normalize(dbAway);
      const hc = canonicalTeam(dbHome);
      const ac = canonicalTeam(dbAway);
      for (const r of fallbackRows) {
        if ((r.home === h && r.away === a) || (r.home === hc && r.away === ac) ||
            (r.home === a && r.away === h) || (r.home === ac && r.away === hc)) {
          return r;
        }
      }
      return null;
    };
    // Debug: log first 2 Sheet1 keys and first 2 DB keys to diagnose matching
    const sampleResults = results.slice(0, 2).map((r) => ({
      home: r.home_team ?? r.HOME_TEAM,
      away: r.away_team ?? r.AWAY_TEAM,
      fallbackKey: `${normalize(r.home_team ?? r.HOME_TEAM)}|${normalize(r.away_team ?? r.AWAY_TEAM)}`,
    }));
    const sampleDb = rows.rows.slice(0, 2).map((r) => ({
      home: r.home_team,
      away: r.away_team,
      fallbackKey: `${normalize(r.home_team)}|${normalize(r.away_team)}`,
    }));
    console.log("[Compare] Sample Sheet1 keys:", JSON.stringify(sampleResults));
    console.log("[Compare] Sample DB keys:", JSON.stringify(sampleDb));
    console.log("[Compare] FallbackRows size:", fallbackRows.length, "ResultMap size:", resultMap.size);
    let updated = 0;
    const unmatched = [];
    const matchTrace = [];
    // Index match: when same count AND first row matches (validates same order)
    const firstDbMatch = rows.rows.length > 0 && results.length > 0 && (() => {
      const dbH = normalize(rows.rows[0].home_team);
      const dbA = normalize(rows.rows[0].away_team);
      const shH = normalize(results[0].home_team ?? results[0].HOME_TEAM);
      const shA = normalize(results[0].away_team ?? results[0].AWAY_TEAM);
      return (dbH === shH && dbA === shA) || (dbH === canonicalTeam(results[0].home_team ?? results[0].HOME_TEAM) && dbA === canonicalTeam(results[0].away_team ?? results[0].AWAY_TEAM));
    })();
    const useIndexMatch = results.length === rows.rows.length && firstDbMatch;
    for (let i = 0; i < rows.rows.length; i++) {
      const rec = rows.rows[i];
      const key = [
        normalize(rec.country),
        normalize(rec.league),
        normalize(rec.bet_type),
        normalize(rec.bet_selection),
        normalize(rec.team_included),
      ].join("|");
      let matchVal = resultMap.get(key);
      if (!matchVal && rec.home_team && rec.away_team) {
        matchVal = findFallbackResult(rec.home_team, rec.away_team);
      }
      if (!matchVal && useIndexMatch && resultsByIndex[i]) {
        matchVal = resultsByIndex[i];
      }
      const actualResult = matchVal?.result ?? (typeof matchVal === "string" ? matchVal : null);
      const actualHomeScore = matchVal?.home_score ?? null;
      const actualAwayScore = matchVal?.away_score ?? null;
      if (matchTrace.length < 5) {
        matchTrace.push({
          game: `${rec.home_team} vs ${rec.away_team}`,
          dbNorm: `${normalize(rec.home_team)}|${normalize(rec.away_team)}`,
          dbCanon: `${canonicalTeam(rec.home_team)}|${canonicalTeam(rec.away_team)}`,
          found: !!actualResult,
          byIndex: useIndexMatch && !!resultsByIndex[i],
        });
      }
      if (!actualResult && rec.home_team && rec.away_team && unmatched.length < 5) {
        unmatched.push({
          game: `${rec.home_team} vs ${rec.away_team}`,
          dbKey: `${normalize(rec.home_team)}|${normalize(rec.away_team)}`,
          dbCanonKey: `${canonicalTeam(rec.home_team)}|${canonicalTeam(rec.away_team)}`,
        });
      }
      if (actualResult) {
        await pool.query(
          `UPDATE betslip_recommendations SET actual_result = $1, actual_home_score = $2, actual_away_score = $3, result_updated_at = NOW(), updated_at = NOW() WHERE id = $4`,
          [actualResult, actualHomeScore, actualAwayScore, rec.id]
        );
        updated++;
      }
    }
    res.json({
      success: true,
      bet_id,
      updated,
      total: rows.rows.length,
      debug: {
        sampleSheet1: sampleResults,
        sampleDb,
        fallbackRowsSize: fallbackRows.length,
        resultMapSize: resultMap.size,
        rowsWithResult,
        rowsWithHomeAway,
        totalSheetRows: results.length,
        useIndexMatch,
        firstDbMatch,
        resultsWithResultCount: resultsByIndex.filter(Boolean).length,
        fallbackRowsSample: fallbackRows.slice(0, 8),
        matchTrace,
        unmatchedSample: unmatched,
      },
    });
  } catch (error) {
    console.error("Error comparing betslip recommendations:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET /api/test - Test database connection`);
  console.log(`  GET /api/bets - Get all bets`);
  console.log(`  GET /api/blacklisted-teams - Get blacklisted teams`);
  console.log(`  GET /api/new-bets - Get new bets`);
  console.log(`  GET /api/team-notes - Get team notes`);
  console.log(`  POST /api/recommendations - Store recommendations`);
  console.log(`  GET /api/recommendations - Get stored recommendations`);
  console.log(`  POST /api/recommendation-analysis - Store analysis results`);
  console.log(`  GET /api/recommendation-analysis - Get analysis results`);
  console.log(`  POST /api/betslip-recommendations - Save betslip (new flow)`);
  console.log(`  GET /api/betslip-recommendations - List games (?bet_id=)`);
  console.log(`  GET /api/betslip-recommendations/tier-accuracy - Primary/Secondary/Tertiary accuracy`);
  console.log(`  GET /api/betslip-recommendations/bet-ids - List bet IDs`);
  console.log(`  POST /api/betslip-recommendations/compare - Compare with Sheet1 results`);
});
