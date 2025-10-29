// API endpoints for database access
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

const BETS_URL = `${API_BASE_URL}/bets`;
const BLACKLIST_URL = `${API_BASE_URL}/blacklisted-teams`;
const NEW_BETS_URL = `${API_BASE_URL}/new-bets`;
const TEAM_NOTES_URL = `${API_BASE_URL}/team-notes`;

// Google Sheets configuration (for GitHub Pages)
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

// Helper function to fetch data from Google Sheets
const fetchFromGoogleSheets = async (range) => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.spreadsheetId}/values/${range}?key=${SHEETS_CONFIG.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error(`Error fetching data from Google Sheets ${range}:`, error);
    return [];
  }
};

// Helper function to convert Google Sheets data to the expected format
const convertSheetsDataToBets = (sheetsData) => {
  if (!sheetsData || sheetsData.length === 0) return [];

  const headers = sheetsData[0];
  const dataRows = sheetsData.slice(1);

  return dataRows.map((row, index) => {
    const bet = {};
    headers.forEach((header, colIndex) => {
      const value = row[colIndex] || "";
      bet[header] = value;
    });

    // Add an id for consistency
    bet.id = index + 1;

    return bet;
  });
};

// Helper function to convert Google Sheets data to team notes format
const convertSheetsDataToTeamNotes = (sheetsData) => {
  if (!sheetsData || sheetsData.length === 0) return [];

  const headers = sheetsData[0];
  const dataRows = sheetsData.slice(1);

  return dataRows.map((row, index) => {
    const teamNote = {};
    headers.forEach((header, colIndex) => {
      const value = row[colIndex] || "";
      teamNote[header] = value;
    });

    // Add an id for consistency
    teamNote.id = index + 1;

    return teamNote;
  });
};

export const fetchSheetData = async (sheetName = "Sheet1") => {
  // For now, prioritize Google Sheets to get it working
  try {
    console.log(`Fetching from Google Sheets - ${sheetName}...`);
    const sheetsData = await fetchFromGoogleSheets(sheetName);
    const convertedData = convertSheetsDataToBets(sheetsData);
    console.log(
      `Successfully fetched data from Google Sheets ${sheetName}:`,
      convertedData.length
    );
    return convertedData;
  } catch (error) {
    console.error(`Error fetching data from Google Sheets ${sheetName}:`, error);

    // Fallback to local server if Google Sheets fails (only for Sheet1)
    if (sheetName === "Sheet1") {
      try {
        console.log("Google Sheets failed, trying local server...");
        const response = await fetch(BETS_URL);

        if (response.ok) {
          const data = await response.json();
          console.log("Successfully fetched bets from database:", data.length);
          return data;
        }
      } catch (dbError) {
        console.log("Local server also unavailable");
      }
    }

    return [];
  }
};

export const fetchBlacklistedTeams = async () => {
  try {
    // Try local server first
    const response = await fetch(BLACKLIST_URL);

    if (response.ok) {
      const data = await response.json();
      console.log(
        "Successfully fetched blacklisted teams from database:",
        data.length
      );
      return data;
    }
  } catch (error) {
    console.log("Local server unavailable, falling back to Google Sheets...");
  }

  // Fallback to Google Sheets
  try {
    console.log("Fetching blacklist from Google Sheets...");
    const sheetsData = await fetchFromGoogleSheets(
      SHEETS_CONFIG.ranges.blacklist
    );
    const convertedData = convertSheetsDataToBets(sheetsData);
    console.log(
      "Successfully fetched blacklisted teams from Google Sheets:",
      convertedData.length
    );
    return convertedData;
  } catch (error) {
    console.error("Error fetching blacklist from Google Sheets:", error);
    return [];
  }
};

export const fetchNewBets = async () => {
  // For now, prioritize Google Sheets to get it working
  try {
    console.log("Fetching new bets from Google Sheets...");
    const sheetsData = await fetchFromGoogleSheets(
      SHEETS_CONFIG.ranges.newBets
    );
    const convertedData = convertSheetsDataToBets(sheetsData);
    console.log(
      "Successfully fetched new bets from Google Sheets:",
      convertedData.length
    );
    return convertedData;
  } catch (error) {
    console.error("Error fetching new bets from Google Sheets:", error);

    // Fallback to local server if Google Sheets fails
    try {
      console.log("Google Sheets failed, trying local server...");
      const response = await fetch(NEW_BETS_URL);

      if (response.ok) {
        const data = await response.json();
        console.log(
          "Successfully fetched new bets from database:",
          data.length
        );
        return data;
      }
    } catch (dbError) {
      console.log("Local server also unavailable");
    }

    // Return empty array instead of throwing error
    console.log("No data sources available, returning empty array");
    return [];
  }
};

export const fetchTeamNotes = async () => {
  try {
    // Try local server first
    const response = await fetch(TEAM_NOTES_URL);

    if (response.ok) {
      const data = await response.json();
      console.log(
        "Successfully fetched team notes from database:",
        data.length
      );
      return data;
    }
  } catch (error) {
    console.log("Local server unavailable, falling back to Google Sheets...");
  }

  // Fallback to Google Sheets
  try {
    console.log("Fetching team notes from Google Sheets...");
    const sheetsData = await fetchFromGoogleSheets(
      SHEETS_CONFIG.ranges.teamNotes
    );
    const convertedData = convertSheetsDataToTeamNotes(sheetsData);
    console.log(
      "Successfully fetched team notes from Google Sheets:",
      convertedData.length
    );
    return convertedData;
  } catch (error) {
    console.error("Error fetching team notes from Google Sheets:", error);
    return [];
  }
};
