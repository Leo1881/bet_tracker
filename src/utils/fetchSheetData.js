// API endpoints for database access
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const BETS_URL = `${API_BASE_URL}/bets`;
const BLACKLIST_URL = `${API_BASE_URL}/blacklisted-teams`;
const NEW_BETS_URL = `${API_BASE_URL}/new-bets`;
const TEAM_NOTES_URL = `${API_BASE_URL}/team-notes`;

export const fetchSheetData = async () => {
  try {
    const response = await fetch(BETS_URL);
    const data = await response.json();

    console.log("Fetched bets from database:", data.length);

    // Check if we have data
    if (!data || data.length === 0) {
      console.log("No data found in database");
      return [];
    }

    console.log("Database data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching data from database:", error);
    return [];
  }
};

export const fetchBlacklistedTeams = async () => {
  try {
    const response = await fetch(BLACKLIST_URL);
    const data = await response.json();

    console.log("Fetched blacklisted teams from database:", data.length);

    // Check if we have data
    if (!data || data.length === 0) {
      console.log("No blacklist data found in database");
      return [];
    }

    console.log("Blacklisted teams:", data);
    return data;
  } catch (error) {
    console.error("Error fetching blacklist data:", error);
    return [];
  }
};

export const fetchNewBets = async () => {
  try {
    const response = await fetch(NEW_BETS_URL);
    const data = await response.json();

    console.log("Fetched new bets from database:", data.length);

    // Check if we have data
    if (!data || data.length === 0) {
      console.log("No new bets data found in database");
      return [];
    }

    console.log("New bets:", data);
    return data;
  } catch (error) {
    console.error("Error fetching new bets data:", error);
    return [];
  }
};

export const fetchTeamNotes = async () => {
  try {
    const response = await fetch(TEAM_NOTES_URL);
    const data = await response.json();

    console.log("Fetched team notes from database:", data.length);

    // Check if we have data
    if (!data || data.length === 0) {
      console.log("No team notes data found in database");
      return [];
    }

    console.log("Team notes:", data);
    return data;
  } catch (error) {
    console.error("Error fetching team notes data:", error);
    return [];
  }
};
