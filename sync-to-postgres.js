const { google } = require("googleapis");
const { Pool } = require("pg");
require("dotenv").config();

// Google Sheets configuration
const SHEETS_CONFIG = {
  spreadsheetId: "1uairlmwCyYh_OwCFJZtEOHr8svQ2l8C_I8VnLsHHiXQ",
  apiKey: "AIzaSyC7NbH0E89eEVZOkGOBdfrwBT42P-bxHEk",
  ranges: {
    bets: "Sheet1",
    blacklist: "Sheet2",
    newBets: "Sheet3",
    teamNotes: "Sheet4",
  },
};

// PostgreSQL configuration
const POSTGRES_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "bet_tracker",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
};

// Initialize Google Sheets API
const sheets = google.sheets({ version: "v4", auth: SHEETS_CONFIG.apiKey });

// Initialize PostgreSQL connection
const pool = new Pool(POSTGRES_CONFIG);

// Helper function to parse date from Google Sheets format
function parseDate(dateString) {
  if (!dateString) return null;

  // Handle "06-Jul" format
  if (dateString.match(/^\d{2}-[A-Za-z]{3}$/)) {
    const currentYear = new Date().getFullYear();
    const fullDate = `${dateString}-${currentYear}`;
    const date = new Date(fullDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0]; // Return YYYY-MM-DD format
    }
  }

  // Handle other date formats
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0]; // Return YYYY-MM-DD format
  }

  return null;
}

// Helper function to fetch data from Google Sheets
async function fetchSheetData(range) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_CONFIG.spreadsheetId,
      range: range,
    });
    return response.data.values || [];
  } catch (error) {
    console.error(`Error fetching data from ${range}:`, error.message);
    return [];
  }
}

// Helper function to find header row and extract headers
function extractHeaders(data, range) {
  if (!data || data.length === 0) return { headers: [], dataRows: [] };

  const expectedHeaders = {
    bets: [
      "DATE",
      "BET_ID",
      "COUNTRY",
      "LEAGUE",
      "HOME_TEAM",
      "ODDS1",
      "AWAY_TEAM",
      "ODDS2",
      "BET_TYPE",
      "BET_SELECTION",
      "TEAM_INCLUDED",
      "HOME_SCORE",
      "AWAY_SCORE",
      "RESULT",
      "REASON",
    ],
    blacklist: ["country", "league", "team_name"],
    newBets: [
      "date",
      "country",
      "league",
      "home_team",
      "odds1",
      "away_team",
      "odds2",
      "bet_type",
      "bet_selection",
      "team_included",
    ],
    teamNotes: ["country", "league", "team_name", "note", "date_added"],
  };

  // Determine sheet type based on the range
  let sheetType = "unknown";
  for (const [key, value] of Object.entries(SHEETS_CONFIG.ranges)) {
    if (value === range) {
      sheetType = key;
      break;
    }
  }
  const expected = expectedHeaders[sheetType] || [];

  // Find header row
  let headerRowIndex = -1;
  let headers = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const hasHeaders = expected.every((header) =>
      row.some((cell) => cell && cell.toString().toUpperCase().includes(header))
    );

    if (hasHeaders) {
      headerRowIndex = i;
      headers = row;
      break;
    }
  }

  if (headerRowIndex === -1) {
    headers = data[0] || [];
    headerRowIndex = 0;
  }

  const dataRows = data.slice(headerRowIndex + 1);
  return { headers, dataRows };
}

// Function to sync bets data
async function syncBets() {
  console.log("Syncing bets data...");

  const rawData = await fetchSheetData(SHEETS_CONFIG.ranges.bets);
  const { headers, dataRows } = extractHeaders(
    rawData,
    SHEETS_CONFIG.ranges.bets
  );

  if (dataRows.length === 0) {
    console.log("No bets data to sync");
    return;
  }

  // Clear existing data
  await pool.query("DELETE FROM bets");

  // Insert new data
  const insertQuery = `
    INSERT INTO bets (
      date, bet_id, country, league, home_team, odds_1, away_team, odds_2, 
      bet_type, bet_selection, team_bet, home_score, away_score, result, reason
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `;

  for (const row of dataRows) {
    const values = [
      parseDate(
        row[headers.findIndex((h) => h.toUpperCase().includes("DATE"))]
      ) || null,
      row[headers.findIndex((h) => h.toUpperCase().includes("BET_ID"))] || null,
      row[headers.findIndex((h) => h.toUpperCase().includes("COUNTRY"))] ||
        null,
      row[headers.findIndex((h) => h.toUpperCase().includes("LEAGUE"))] || null,
      row[headers.findIndex((h) => h.toUpperCase().includes("HOME_TEAM"))] ||
        null,
      (() => {
        const value =
          row[headers.findIndex((h) => h.toUpperCase().includes("ODDS1"))];
        return value !== undefined && value !== null && value !== ""
          ? parseFloat(value)
          : null;
      })(),
      row[headers.findIndex((h) => h.toUpperCase().includes("AWAY_TEAM"))] ||
        null,
      (() => {
        const value =
          row[headers.findIndex((h) => h.toUpperCase().includes("ODDS2"))];
        return value !== undefined && value !== null && value !== ""
          ? parseFloat(value)
          : null;
      })(),
      row[headers.findIndex((h) => h.toUpperCase().includes("BET_TYPE"))] ||
        null,
      row[
        headers.findIndex((h) => h.toUpperCase().includes("BET_SELECTION"))
      ] || null,
      row[
        headers.findIndex((h) => h.toUpperCase().includes("TEAM_INCLUDED"))
      ] || null,
      (() => {
        const value =
          row[headers.findIndex((h) => h.toUpperCase().includes("HOME_SCORE"))];
        return value !== undefined && value !== null && value !== ""
          ? parseInt(value)
          : null;
      })(),
      (() => {
        const value =
          row[headers.findIndex((h) => h.toUpperCase().includes("AWAY_SCORE"))];
        return value !== undefined && value !== null && value !== ""
          ? parseInt(value)
          : null;
      })(),
      row[headers.findIndex((h) => h.toUpperCase().includes("RESULT"))] || null,
      row[headers.findIndex((h) => h.toUpperCase().includes("REASON"))] || null,
    ];

    await pool.query(insertQuery, values);
  }

  console.log(`Synced ${dataRows.length} bets`);
}

// Function to sync blacklist data
async function syncBlacklist() {
  console.log("Syncing blacklist data...");

  const rawData = await fetchSheetData(SHEETS_CONFIG.ranges.blacklist);
  const { headers, dataRows } = extractHeaders(
    rawData,
    SHEETS_CONFIG.ranges.blacklist
  );

  if (dataRows.length === 0) {
    console.log("No blacklist data to sync");
    return;
  }

  // Clear existing data
  await pool.query("DELETE FROM blacklisted_teams");

  // Insert new data
  const insertQuery = `
    INSERT INTO blacklisted_teams (country, league, team_name) 
    VALUES ($1, $2, $3)
  `;

  for (const row of dataRows) {
    const values = [
      row[headers.findIndex((h) => h.toLowerCase().includes("country"))] ||
        null,
      row[headers.findIndex((h) => h.toLowerCase().includes("league"))] || null,
      row[headers.findIndex((h) => h.toLowerCase().includes("team_name"))] ||
        null,
    ];

    await pool.query(insertQuery, values);
  }

  console.log(`Synced ${dataRows.length} blacklisted teams`);
}

// Function to sync new bets data
async function syncNewBets() {
  console.log("Syncing new bets data...");

  const rawData = await fetchSheetData(SHEETS_CONFIG.ranges.newBets);
  const { headers, dataRows } = extractHeaders(
    rawData,
    SHEETS_CONFIG.ranges.newBets
  );

  if (dataRows.length === 0) {
    console.log("No new bets data to sync");
    return;
  }

  // Clear existing data
  await pool.query("DELETE FROM new_bets");

  // Insert new data
  const insertQuery = `
    INSERT INTO new_bets (
      date, country, league, home_team, odds1, away_team, odds2, 
      bet_type, bet_selection, team_included
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `;

  for (const row of dataRows) {
    const values = [
      parseDate(
        row[headers.findIndex((h) => h.toLowerCase().includes("date"))]
      ) || null,
      row[headers.findIndex((h) => h.toLowerCase().includes("country"))] ||
        null,
      row[headers.findIndex((h) => h.toLowerCase().includes("league"))] || null,
      row[headers.findIndex((h) => h.toLowerCase().includes("home_team"))] ||
        null,
      (() => {
        const value =
          row[headers.findIndex((h) => h.toLowerCase().includes("odds1"))];
        return value !== undefined && value !== null && value !== ""
          ? parseFloat(value)
          : null;
      })(),
      row[headers.findIndex((h) => h.toLowerCase().includes("away_team"))] ||
        null,
      (() => {
        const value =
          row[headers.findIndex((h) => h.toLowerCase().includes("odds2"))];
        return value !== undefined && value !== null && value !== ""
          ? parseFloat(value)
          : null;
      })(),
      row[headers.findIndex((h) => h.toLowerCase().includes("bet_type"))] ||
        null,
      row[
        headers.findIndex((h) => h.toLowerCase().includes("bet_selection"))
      ] || null,
      row[
        headers.findIndex((h) => h.toLowerCase().includes("team_included"))
      ] || null,
    ];

    await pool.query(insertQuery, values);
  }

  console.log(`Synced ${dataRows.length} new bets`);
}

// Function to sync team notes data
async function syncTeamNotes() {
  console.log("Syncing team notes data...");

  const rawData = await fetchSheetData(SHEETS_CONFIG.ranges.teamNotes);
  const { headers, dataRows } = extractHeaders(
    rawData,
    SHEETS_CONFIG.ranges.teamNotes
  );

  if (dataRows.length === 0) {
    console.log("No team notes data to sync");
    return;
  }

  // Clear existing data
  await pool.query("DELETE FROM team_notes");

  // Insert new data
  const insertQuery = `
    INSERT INTO team_notes (country, league, team_name, note, date_added) 
    VALUES ($1, $2, $3, $4, $5)
  `;

  for (const row of dataRows) {
    const values = [
      row[headers.findIndex((h) => h.toLowerCase().includes("country"))] ||
        null,
      row[headers.findIndex((h) => h.toLowerCase().includes("league"))] || null,
      row[headers.findIndex((h) => h.toLowerCase().includes("team_name"))] ||
        null,
      row[headers.findIndex((h) => h.toLowerCase().includes("note"))] || null,
      parseDate(
        row[headers.findIndex((h) => h.toLowerCase().includes("date_added"))]
      ) || null,
    ];

    await pool.query(insertQuery, values);
  }

  console.log(`Synced ${dataRows.length} team notes`);
}

// Main sync function
async function syncAllData() {
  console.log("Starting data sync from Google Sheets to PostgreSQL...");
  console.log("Timestamp:", new Date().toISOString());

  try {
    // Test database connection
    await pool.query("SELECT NOW()");
    console.log("Database connection successful");

    // Sync all data
    await syncBets();
    await syncBlacklist();
    await syncNewBets();
    await syncTeamNotes();

    console.log("Data sync completed successfully!");
  } catch (error) {
    console.error("Error during data sync:", error);
  } finally {
    await pool.end();
  }
}

// Run the sync if this script is executed directly
if (require.main === module) {
  syncAllData();
}

module.exports = { syncAllData };
