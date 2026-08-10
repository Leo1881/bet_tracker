# Recommendation improvement notes (deferred)

Points 1–5 and 10 are implemented.
Points 6–9 deferred (see below).

## 2. One “decision pick,” not four markets fighting — DONE
UI: one Stake pick; Primary/Secondary/Tertiary under Details → Alternatives.
Scoring: loss rules apply first; SW form/gap boost only when loss rules did not cut;
removed second SW boost on Best Bet path; safer market wins score ties.

## 3. Separate “edge” from “safety” (odds-band policy) — DONE
Stake pick follows backed odds:
- &lt; 1.40 → Straight Win allowed
- 1.40–1.70 → Double Chance unless form overwhelming (4+W / high conf)
- ≥ 1.70 → Double Chance, or AVOID skip if no DC
Hard enforce after ranking; notes show on Loss rules chip.

## 4. Early-season / previous-season form = lower quality — DONE
Label **Early season** when either side has &lt; 5 games played
(HOME_TEAM_GAMES_PLAYED / AWAY_TEAM_GAMES_PLAYED), or prev-season form
fallback if GP missing. Caps stake confidence; softens SW / prefers DC.

## 5. Blacklist notice (soft) — DONE
Show **Blacklisted: Team** chip on recommendation cards; still show the game.
Name matching includes aliases (Man Utd ↔ Manchester United).
No hard skip / hide.

## 6. Fix year/date ambiguity — DEFERRED
DD-MMM dates need reliable year (prefer BET_ID — user notes IDs start with year).
Skipped for now (current slips mostly same year). Revisit when multi-year slips matter.

## 7. Make AI earn its keep — DEFERRED / trimmed
Auto-run AI not practical (API rate limit / few queries).
Possible later: Agree/Disagree badge only when user manually fetches AI.
No auto-weighting for now.

## 8. Cut overlapping warnings — DEFERRED
Leave chips as-is for now (performance, loss pattern, odds trap, loss rules, early season, blacklist).

## 9. Calibration should move the pick (or hide) — DEFERRED (keep as info)
Calibration stays in Details only; does not change the stake pick for now.

## 10. Fewer games, better games (ticket builder) — DONE
Recommendations tab: **Best ticket** (8–12) on top + **All games** below.
Toggle: Both / Best ticket / All games. Prefers strong stake picks, league
mix, avoids traps / blacklist / early season when possible.
