#!/usr/bin/env node
/**
 * Check tables and clear recommendation/analysis data.
 * Uses the same .env DB config as server.js.
 *
 * Usage: node clear-database.js
 * Optional: node clear-database.js --all   (also clears bets, new_bets, blacklisted_teams, team_notes)
 */

const { Pool } = require("pg");
require("dotenv").config();

const POSTGRES_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "bet_tracker",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(POSTGRES_CONFIG);

async function listTables() {
  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return result.rows.map((r) => r.table_name);
}

async function getRowCount(table) {
  try {
    const r = await pool.query(`SELECT COUNT(*) AS n FROM ${table}`);
    return parseInt(r.rows[0].n, 10);
  } catch (e) {
    return null;
  }
}

async function checkAndClear() {
  const clearAll = process.argv.includes("--all");

  try {
    console.log("Connecting to database...");
    const tables = await listTables();
    console.log("\n--- Table row counts (before clear) ---\n");

    for (const table of tables) {
      const count = await getRowCount(table);
      console.log(`  ${table}: ${count != null ? count : "error"}`);
    }

    // Always clear recommendation/analysis data
    console.log("\n--- Clearing recommendation & analysis data ---\n");

    await pool.query("DELETE FROM recommendation_tracking");
    console.log("  recommendation_tracking: cleared");

    await pool.query("DELETE FROM recommendation_analysis");
    console.log("  recommendation_analysis: cleared");

    try {
      await pool.query("DELETE FROM attached_predictions");
      console.log("  attached_predictions: cleared");
    } catch (e) {
      if (e.code !== "42P01") console.log("  attached_predictions: skip (table missing or error)");
    }

    await pool.query("ALTER SEQUENCE recommendation_tracking_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE recommendation_analysis_id_seq RESTART WITH 1");
    console.log("  Sequences reset.");

    if (clearAll) {
      console.log("\n--- Clearing all app data (--all) ---\n");
      await pool.query("DELETE FROM bets");
      await pool.query("DELETE FROM new_bets");
      await pool.query("DELETE FROM blacklisted_teams");
      await pool.query("DELETE FROM team_notes");
      console.log("  bets, new_bets, blacklisted_teams, team_notes: cleared.");
    }

    console.log("\n--- Table row counts (after clear) ---\n");
    for (const table of tables) {
      const count = await getRowCount(table);
      console.log(`  ${table}: ${count != null ? count : "error"}`);
    }

    console.log("\nDone.");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkAndClear();
