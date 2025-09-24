const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
    res.status(500).json({ error: error.message });
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
        bet_type, bet_selection, odds1, odds2, oddsX,
        recommendation, confidence_score, confidence_breakdown,
        reasoning, historical_data, probabilities
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (game_id, betslip_id) 
      DO UPDATE SET 
        bet_id = $2,
        recommendation = $13,
        confidence_score = $14,
        confidence_breakdown = $15,
        reasoning = $16,
        historical_data = $17,
        probabilities = $18,
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
      }

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
        rec.recommendation,
        parseNumeric(rec.confidence_score),
        JSON.stringify(rec.confidence_breakdown),
        rec.reasoning,
        JSON.stringify(rec.historical_data),
        JSON.stringify(rec.probabilities),
      ]);
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
    const { actual_result, prediction_accurate, result_updated_at } = req.body;

    console.log(
      `PUT /api/recommendations/${id} - Updating record with ID: ${id}`
    );
    console.log(`Request body:`, {
      actual_result,
      prediction_accurate,
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
        result_updated_at = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const result = await pool.query(query, [
      actual_result,
      prediction_accurate,
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
        recommendation, confidence_score, confidence_breakdown,
        reasoning, historical_data, probabilities,
        actual_result, actual_home_score, actual_away_score,
        prediction_accurate, analysis_notes,
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
});
