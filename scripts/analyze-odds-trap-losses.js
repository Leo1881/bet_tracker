#!/usr/bin/env node
/**
 * Analyze historical losses where odds were in the "trap zone" (1.20–1.55).
 * These are games where you bet on a favorite at odds that weren't as short
 * as expected for a mismatch – and lost.
 *
 * Run: node scripts/analyze-odds-trap-losses.js
 * Requires: .env with DB_* vars (or defaults to localhost)
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

// Trap zone: odds where a favorite "should" have been shorter
const TRAP_ZONE_MIN = 1.2;
const TRAP_ZONE_MAX = 1.55;

function getBetOdds(bet) {
  const odds1 = parseFloat(bet.odds_1 ?? bet.odds1) || 0;
  const odds2 = parseFloat(bet.odds_2 ?? bet.odds2) || 0;
  const teamBet = (bet.team_bet ?? bet.team_included ?? "").toLowerCase();
  const homeTeam = (bet.home_team || "").toLowerCase();
  const awayTeam = (bet.away_team || "").toLowerCase();
  const betSelection = (bet.bet_selection || "").toLowerCase();

  // Straight Win: TEAM_INCLUDED = team name
  if (teamBet && homeTeam && teamBet.includes(homeTeam)) return odds1;
  if (teamBet && awayTeam && teamBet.includes(awayTeam)) return odds2;

  // Double Chance: "1 X" = home or draw, "X 2" = away or draw
  if (betSelection.includes("1 x") || betSelection.includes("1x")) return odds1;
  if (betSelection.includes("x 2") || betSelection.includes("x2")) return odds2;

  // Fallback: use lower odds (favorite)
  if (odds1 > 0 && odds2 > 0) return Math.min(odds1, odds2);
  return odds1 || odds2;
}

function isWinOrDoubleChance(bet) {
  const type = (bet.bet_type || "").toLowerCase();
  const sel = (bet.bet_selection || "").toLowerCase();
  return (
    type.includes("win") ||
    type.includes("double chance") ||
    sel.includes("home win") ||
    sel.includes("away win") ||
    sel.includes("1 x") ||
    sel.includes("x 2") ||
    sel.includes("1x") ||
    sel.includes("x2")
  );
}

async function main() {
  try {
    const result = await pool.query(`
      SELECT *
      FROM bets
      WHERE LOWER(result) LIKE '%loss%'
      ORDER BY date DESC
    `);

    const losses = result.rows;
    const winOrDc = losses.filter(isWinOrDoubleChance);
    const trapLosses = winOrDc.filter((b) => {
      const odds = getBetOdds(b);
      return odds >= TRAP_ZONE_MIN && odds <= TRAP_ZONE_MAX;
    });

    console.log("\n=== Odds Trap Analysis: Historical Losses ===\n");
    console.log(`Total losses in DB: ${losses.length}`);
    console.log(`Losses (Win or Double Chance): ${winOrDc.length}`);
    console.log(
      `Losses in TRAP ZONE (odds ${TRAP_ZONE_MIN}–${TRAP_ZONE_MAX}): ${trapLosses.length}\n`
    );

    if (trapLosses.length === 0) {
      console.log("No trap-zone losses found. Either no data or odds were outside the zone.");
      process.exit(0);
    }

    console.log("Trap zone losses (odds longer than expected for a favorite):\n");
    console.log(
      "Date       | League              | Match                    | Your pick        | Odds  | Result"
    );
    console.log("-".repeat(95));

    trapLosses.forEach((b) => {
      const date = (b.date || "").toString().slice(0, 10);
      const league = (b.country || "") + " " + (b.league || "");
      const match = `${(b.home_team || "").slice(0, 12)} v ${(b.away_team || "").slice(0, 10)}`;
      const pick = (b.team_bet || b.team_included || b.bet_selection || "").slice(0, 16);
      const odds = getBetOdds(b).toFixed(2);
      const result = (b.result || "").slice(0, 6);
      console.log(
        `${date} | ${league.padEnd(18)} | ${match.padEnd(24)} | ${pick.padEnd(16)} | ${odds.padStart(5)} | ${result}`
      );
    });

    console.log("\n");
    pool.end();
  } catch (err) {
    console.error("Error:", err.message);
    if (err.code === "ECONNREFUSED") {
      console.error("\nMake sure PostgreSQL is running and .env has correct DB_* values.");
    }
    process.exit(1);
  }
}

main();
