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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET /api/test - Test database connection`);
  console.log(`  GET /api/bets - Get all bets`);
  console.log(`  GET /api/blacklisted-teams - Get blacklisted teams`);
  console.log(`  GET /api/new-bets - Get new bets`);
  console.log(`  GET /api/team-notes - Get team notes`);
});
