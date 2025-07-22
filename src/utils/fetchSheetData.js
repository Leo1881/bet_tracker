const SHEET_URL =
  "https://sheets.googleapis.com/v4/spreadsheets/1uairlmwCyYh_OwCFJZtEOHr8svQ2l8C_I8VnLsHHiXQ/values/Sheet1?key=AIzaSyC7NbH0E89eEVZOkGOBdfrwBT42P-bxHEk";

const BLACKLIST_URL =
  "https://sheets.googleapis.com/v4/spreadsheets/1uairlmwCyYh_OwCFJZtEOHr8svQ2l8C_I8VnLsHHiXQ/values/Sheet2?key=AIzaSyC7NbH0E89eEVZOkGOBdfrwBT42P-bxHEk";

const NEW_BETS_URL =
  "https://sheets.googleapis.com/v4/spreadsheets/1uairlmwCyYh_OwCFJZtEOHr8svQ2l8C_I8VnLsHHiXQ/values/Sheet3?key=AIzaSyC7NbH0E89eEVZOkGOBdfrwBT42P-bxHEk";

export const fetchSheetData = async () => {
  try {
    const response = await fetch(SHEET_URL);
    const data = await response.json();

    console.log("Raw sheet data:", data.values); // Debug log

    // Check if we have data
    if (!data.values || data.values.length === 0) {
      console.log("No data found in sheet");
      return [];
    }

    // Look for the row that contains our expected headers
    const expectedHeaders = [
      "DATE",
      "COUNTRY",
      "LEAGUE",
      "HOME_TEAM",
      "ODDS_1",
      "AWAY_TEAM",
      "ODDS_2",
      "BET_TYPE",
      "BET_SELECTION",
      "TEAM_BET",
      "RESULT",
      "REASON",
    ];

    let headerRowIndex = -1;
    let headers = [];

    // Find the row that contains our headers
    for (let i = 0; i < data.values.length; i++) {
      const row = data.values[i];
      const hasHeaders = expectedHeaders.every((header) =>
        row.some(
          (cell) => cell && cell.toString().toUpperCase().includes(header)
        )
      );

      if (hasHeaders) {
        headerRowIndex = i;
        headers = row;
        console.log("Found headers at row:", i, headers);
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.log("Could not find headers, using first row");
      headers = data.values[0] || [];
      headerRowIndex = 0;
    }

    // Get data rows (everything after the header row)
    const dataRows = data.values.slice(headerRowIndex + 1);

    console.log("Headers:", headers);
    console.log("Data rows:", dataRows);

    // Convert data rows to objects
    const formatted = dataRows.map((row) => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || "";
      });
      return obj;
    });

    console.log("Formatted data:", formatted);
    return formatted;
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    return [];
  }
};

export const fetchBlacklistedTeams = async () => {
  try {
    const response = await fetch(BLACKLIST_URL);
    const data = await response.json();

    console.log("Raw blacklist data:", data.values);

    // Check if we have data
    if (!data.values || data.values.length === 0) {
      console.log("No blacklist data found in Sheet2");
      return [];
    }

    // Find the header row
    const expectedHeaders = ["country", "league", "team_name"];
    let headerRowIndex = -1;
    let headers = [];

    // Find the row that contains our headers
    for (let i = 0; i < data.values.length; i++) {
      const row = data.values[i];
      const hasHeaders = expectedHeaders.every((header) =>
        row.some(
          (cell) => cell && cell.toString().toLowerCase().includes(header)
        )
      );

      if (hasHeaders) {
        headerRowIndex = i;
        headers = row;
        console.log("Found blacklist headers at row:", i, headers);
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.log("Could not find blacklist headers, using first row");
      headers = data.values[0] || [];
      headerRowIndex = 0;
    }

    // Get data rows (everything after the header row)
    const dataRows = data.values.slice(headerRowIndex + 1);

    // Find column indices
    const countryIndex = headers.findIndex(
      (header) => header && header.toString().toLowerCase().includes("country")
    );
    const leagueIndex = headers.findIndex(
      (header) => header && header.toString().toLowerCase().includes("league")
    );
    const teamNameIndex = headers.findIndex(
      (header) =>
        header && header.toString().toLowerCase().includes("team_name")
    );

    if (teamNameIndex === -1) {
      console.log("Could not find team_name column in blacklist");
      return [];
    }

    const blacklistedTeams = dataRows
      .map((row) => ({
        country: countryIndex !== -1 ? (row[countryIndex] || "").trim() : "",
        league: leagueIndex !== -1 ? (row[leagueIndex] || "").trim() : "",
        team_name: (row[teamNameIndex] || "").trim(),
      }))
      .filter((team) => team.team_name !== ""); // Remove empty entries

    console.log("Blacklisted teams:", blacklistedTeams);
    return blacklistedTeams;
  } catch (error) {
    console.error("Error fetching blacklist data:", error);
    return [];
  }
};

export const fetchNewBets = async () => {
  try {
    const response = await fetch(NEW_BETS_URL);
    const data = await response.json();

    console.log("Raw new bets data:", data.values);

    // Check if we have data
    if (!data.values || data.values.length === 0) {
      console.log("No new bets data found in Sheet3");
      return [];
    }

    // Find the header row
    const expectedHeaders = [
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
    ];
    let headerRowIndex = -1;
    let headers = [];

    // Find the row that contains our headers
    for (let i = 0; i < data.values.length; i++) {
      const row = data.values[i];
      const hasHeaders = expectedHeaders.every((header) =>
        row.some(
          (cell) => cell && cell.toString().toLowerCase().includes(header)
        )
      );

      if (hasHeaders) {
        headerRowIndex = i;
        headers = row;
        console.log("Found new bets headers at row:", i, headers);
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.log("Could not find new bets headers, using first row");
      headers = data.values[0] || [];
      headerRowIndex = 0;
    }

    // Get data rows (everything after the header row)
    const dataRows = data.values.slice(headerRowIndex + 1);

    // Find column indices
    const dateIndex = headers.findIndex(
      (header) => header && header.toString().toLowerCase().includes("date")
    );
    const countryIndex = headers.findIndex(
      (header) => header && header.toString().toLowerCase().includes("country")
    );
    const leagueIndex = headers.findIndex(
      (header) => header && header.toString().toLowerCase().includes("league")
    );
    const homeTeamIndex = headers.findIndex(
      (header) =>
        header && header.toString().toLowerCase().includes("home_team")
    );
    const awayTeamIndex = headers.findIndex(
      (header) =>
        header && header.toString().toLowerCase().includes("away_team")
    );
    const odds1Index = headers.findIndex(
      (header) => header && header.toString().toLowerCase().includes("odds1")
    );
    const odds2Index = headers.findIndex(
      (header) => header && header.toString().toLowerCase().includes("odds2")
    );
    const betTypeIndex = headers.findIndex(
      (header) => header && header.toString().toLowerCase().includes("bet_type")
    );
    const betSelectionIndex = headers.findIndex(
      (header) =>
        header && header.toString().toLowerCase().includes("bet_selection")
    );
    const teamIncludedIndex = headers.findIndex(
      (header) =>
        header && header.toString().toLowerCase().includes("team_included")
    );

    const newBets = dataRows
      .map((row) => ({
        date: dateIndex !== -1 ? (row[dateIndex] || "").trim() : "",
        country: countryIndex !== -1 ? (row[countryIndex] || "").trim() : "",
        league: leagueIndex !== -1 ? (row[leagueIndex] || "").trim() : "",
        home_team:
          homeTeamIndex !== -1 ? (row[homeTeamIndex] || "").trim() : "",
        away_team:
          awayTeamIndex !== -1 ? (row[awayTeamIndex] || "").trim() : "",
        odds1: odds1Index !== -1 ? parseFloat(row[odds1Index]) || 0 : 0,
        odds2: odds2Index !== -1 ? parseFloat(row[odds2Index]) || 0 : 0,
        bet_type: betTypeIndex !== -1 ? (row[betTypeIndex] || "").trim() : "",
        bet_selection:
          betSelectionIndex !== -1 ? (row[betSelectionIndex] || "").trim() : "",
        team_included:
          teamIncludedIndex !== -1 ? (row[teamIncludedIndex] || "").trim() : "",
      }))
      .filter(
        (bet) => bet.team_included !== "" && (bet.odds1 > 0 || bet.odds2 > 0)
      ); // Remove empty entries and bets without odds

    console.log("New bets:", newBets);
    return newBets;
  } catch (error) {
    console.error("Error fetching new bets data:", error);
    return [];
  }
};
