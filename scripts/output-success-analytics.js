#!/usr/bin/env node
/**
 * Output success analytics (country, league, team, bet type, dates) as JSON.
 * Run: node scripts/output-success-analytics.js
 * Requires: .env with DB_* vars
 */
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "bet_tracker",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

function toBet(row) {
  return {
    DATE: row.date,
    COUNTRY: row.country,
    LEAGUE: row.league,
    HOME_TEAM: row.home_team,
    AWAY_TEAM: row.away_team,
    TEAM_INCLUDED: row.team_bet,
    BET_TYPE: row.bet_type,
    BET_SELECTION: row.bet_selection,
    RESULT: row.result,
    ODDS1: row.odds_1,
    ODDS2: row.odds_2,
  };
}

function mapBetType(bt) {
  const t = (bt || "").toLowerCase();
  if (t.includes("double chance")) return "Double Chance";
  if (t.includes("over") || t.includes("under")) return "Over/Under";
  if (t.includes("win") || !t) return "Straight Win";
  return bt || "Other";
}

async function main() {
  try {
    const result = await pool.query(`
      SELECT date, country, league, home_team, away_team, team_bet, bet_type, bet_selection, result, odds_1, odds_2
      FROM bets
      ORDER BY date DESC
    `);

    const bets = result.rows.map(toBet);
    const withResult = bets.filter(
      (b) =>
        b.RESULT &&
        (b.RESULT.toLowerCase().includes("win") ||
          b.RESULT.toLowerCase().includes("loss"))
    );

    // By country
    const byCountry = {};
    withResult.forEach((b) => {
      const c = b.COUNTRY || "Unknown";
      if (!byCountry[c]) byCountry[c] = { wins: 0, losses: 0 };
      byCountry[c].total = (byCountry[c].total || 0) + 1;
      if (b.RESULT.toLowerCase().includes("win")) byCountry[c].wins++;
      else byCountry[c].losses++;
    });
    const countryAnalytics = Object.entries(byCountry)
      .filter(([, s]) => s.wins + s.losses >= 3)
      .map(([country, s]) => ({
        country,
        wins: s.wins,
        losses: s.losses,
        total: s.wins + s.losses,
        winRate: ((s.wins / (s.wins + s.losses)) * 100).toFixed(1) + "%",
      }))
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

    // By league (country + league)
    const byLeague = {};
    withResult.forEach((b) => {
      const key = `${b.LEAGUE || "Unknown"} (${b.COUNTRY || "Unknown"})`;
      if (!byLeague[key]) byLeague[key] = { wins: 0, losses: 0 };
      byLeague[key].total = (byLeague[key].total || 0) + 1;
      if (b.RESULT.toLowerCase().includes("win")) byLeague[key].wins++;
      else byLeague[key].losses++;
    });
    const leagueAnalytics = Object.entries(byLeague)
      .filter(([, s]) => s.wins + s.losses >= 3)
      .map(([league, s]) => ({
        league,
        wins: s.wins,
        losses: s.losses,
        total: s.wins + s.losses,
        winRate: ((s.wins / (s.wins + s.losses)) * 100).toFixed(1) + "%",
      }))
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

    // By team
    const byTeam = {};
    withResult.forEach((b) => {
      const t = b.TEAM_INCLUDED || "Unknown";
      if (!byTeam[t]) byTeam[t] = { wins: 0, losses: 0 };
      byTeam[t].total = (byTeam[t].total || 0) + 1;
      if (b.RESULT.toLowerCase().includes("win")) byTeam[t].wins++;
      else byTeam[t].losses++;
    });
    const teamAnalytics = Object.entries(byTeam)
      .filter(([, s]) => s.wins + s.losses >= 3)
      .map(([team, s]) => ({
        team,
        wins: s.wins,
        losses: s.losses,
        total: s.wins + s.losses,
        winRate: ((s.wins / (s.wins + s.losses)) * 100).toFixed(1) + "%",
      }))
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

    // By bet type
    const byBetType = {};
    withResult.forEach((b) => {
      const cat = mapBetType(b.BET_TYPE);
      if (!byBetType[cat]) byBetType[cat] = { wins: 0, losses: 0 };
      byBetType[cat].total = (byBetType[cat].total || 0) + 1;
      if (b.RESULT.toLowerCase().includes("win")) byBetType[cat].wins++;
      else byBetType[cat].losses++;
    });
    const betTypeAnalytics = Object.entries(byBetType)
      .filter(([, s]) => s.wins + s.losses >= 2)
      .map(([type, s]) => ({
        betType: type,
        wins: s.wins,
        losses: s.losses,
        total: s.wins + s.losses,
        winRate: ((s.wins / (s.wins + s.losses)) * 100).toFixed(1) + "%",
      }))
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

    // By day of week
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const byDay = {};
    withResult.forEach((b) => {
      const d = b.DATE ? new Date(b.DATE).getDay() : 0;
      const name = dayNames[d];
      if (!byDay[name]) byDay[name] = { wins: 0, losses: 0 };
      byDay[name].total = (byDay[name].total || 0) + 1;
      if (b.RESULT.toLowerCase().includes("win")) byDay[name].wins++;
      else byDay[name].losses++;
    });
    const dayOrder = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dayAnalytics = Object.entries(byDay)
      .filter(([, s]) => s.wins + s.losses >= 2)
      .map(([day, s]) => ({
        dayOfWeek: day,
        wins: s.wins,
        losses: s.losses,
        total: s.wins + s.losses,
        winRate: ((s.wins / (s.wins + s.losses)) * 100).toFixed(1) + "%",
      }))
      .sort((a, b) => dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek]);

    // By month
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const byMonth = {};
    withResult.forEach((b) => {
      const m = b.DATE ? new Date(b.DATE).getMonth() : 0;
      const name = monthNames[m];
      if (!byMonth[name]) byMonth[name] = { wins: 0, losses: 0 };
      byMonth[name].total = (byMonth[name].total || 0) + 1;
      if (b.RESULT.toLowerCase().includes("win")) byMonth[name].wins++;
      else byMonth[name].losses++;
    });
    const monthOrder = Object.fromEntries(
      monthNames.map((n, i) => [n, i])
    );
    const monthAnalytics = Object.entries(byMonth)
      .filter(([, s]) => s.wins + s.losses >= 2)
      .map(([month, s]) => ({
        month,
        wins: s.wins,
        losses: s.losses,
        total: s.wins + s.losses,
        winRate: ((s.wins / (s.wins + s.losses)) * 100).toFixed(1) + "%",
      }))
      .sort((a, b) => monthOrder[a.month] - monthOrder[b.month]);

    const output = {
      summary: {
        totalBets: bets.length,
        withResult: withResult.length,
        wins: withResult.filter((b) => b.RESULT.toLowerCase().includes("win")).length,
        losses: withResult.filter((b) => b.RESULT.toLowerCase().includes("loss")).length,
        overallWinRate:
          withResult.length > 0
            ? (
                (withResult.filter((b) => b.RESULT.toLowerCase().includes("win")).length /
                  withResult.length) *
                100
              ).toFixed(1) + "%"
            : "N/A",
      },
      byCountry: countryAnalytics,
      byLeague: leagueAnalytics,
      byTeam: teamAnalytics.slice(0, 30),
      byBetType: betTypeAnalytics,
      byDayOfWeek: dayAnalytics,
      byMonth: monthAnalytics,
    };

    console.log(JSON.stringify(output, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
