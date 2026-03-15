# Expected Odds Design: Detecting the "Odds Trap"

**Goal:** When a top team plays a weak team, estimate what odds we'd *expect* to see. If the actual odds are longer than expected, flag it as a potential trap (favorite often loses/draws).

---

## 1. Data We Have

### For new games (Sheet3 – games to analyze)
| Field | Description |
|-------|-------------|
| `ODDS1` | Home team odds |
| `ODDS2` | Away team odds |
| `HOME_TEAM_POSITION_NUMBER` | Home team league position (1 = top) |
| `AWAY_TEAM_POSITION_NUMBER` | Away team league position |
| `TOTAL_TEAMS_IN_LEAGUE` | League size (e.g. 20) |
| `HOME_TEAM`, `AWAY_TEAM` | Team names |
| `COUNTRY`, `LEAGUE` | Competition |

### For historical bets (Sheet1 – completed bets)
| Field | Description |
|-------|-------------|
| `ODDS1`, `ODDS2` | Odds at time of bet |
| `HOME_TEAM`, `AWAY_TEAM` | Teams |
| `RESULT` | Win / Loss / Pending |
| `COUNTRY`, `LEAGUE` | Competition |

**Note:** Historical bets do *not* have position data in the schema. We only have odds + result.

### Existing helper
`getPositionGapIndicator(homePos, awayPos, totalTeams)` already exists in `teamHistoryService.js`:
- Returns `relativeGap` (0–1, e.g. 0.85 = 17 spots in 20-team league)
- Returns `gapLabel`: `"Large"` (≥40%), `"Moderate"` (20–40%), `"Close"` (<20%)

---

## 2. Options for Estimating Expected Odds

### Option A: Rule-based from position gap (simplest)

**Idea:** Use position gap to define an expected odds range. No historical data needed.

| Position gap | Expected odds for favorite |
|--------------|-----------------------------|
| Large (≥40% of table) | 1.15 – 1.25 |
| Moderate (20–40%) | 1.25 – 1.50 |
| Close (<20%) | 1.50+ |

**Logic:**
1. Compute position gap (already available).
2. Determine which team is the favorite (lower position = better).
3. Get the favorite’s odds (ODDS1 if home, ODDS2 if away).
4. Compare to the expected range for that gap.
5. If actual odds > expected max → flag as potential trap.

**Pros:** Simple, works immediately, uses data we already have.  
**Cons:** Ranges are rough; leagues differ (e.g. Premier League vs lower leagues).

---

### Option B: Historical odds by league (data-driven)

**Idea:** Use Sheet1 to see how odds relate to win rate per league.

**Steps:**
1. For each historical bet, take the odds of the team we bet on (ODDS1 or ODDS2).
2. Group by league and odds band (e.g. 1.10–1.25, 1.25–1.40, 1.40–1.60).
3. Compute win rate per band per league.
4. Use this to define “expected” bands: e.g. “In Premier League, 1.15–1.25 wins 88% of the time; 1.35–1.50 wins 62%.”

**Logic for a new game:**
- If position gap is Large but favorite’s odds fall in a band with low historical win rate → flag as trap.

**Pros:** Uses your own results, adapts to each league.  
**Cons:** Needs enough historical data per league; no position in history, so we infer “mismatch” from position gap only for new games.

---

### Option C: Hybrid (position gap + historical calibration)

**Idea:** Combine A and B.

1. Use position gap to decide “expected” band (e.g. Large gap → expect 1.15–1.25).
2. Use historical data to calibrate: “In this league, when odds are 1.35–1.50, win rate is X%.”
3. If position says “Large gap” but odds fall in a band with low win rate → flag.

**Pros:** Uses both structure (position) and your data (historical win rate).  
**Cons:** More logic to implement and maintain.

---

## 3. Recommendation

**Start with Option A** because:
1. Uses only data we already have.
2. No schema changes.
3. Easy to implement and test.
4. Can be refined later with Option B or C once we see how it behaves.

---

## 4. Implementation sketch (Option A)

```
For each recommendation where we're backing the favorite (Straight Win):

1. Get position gap: getPositionGapIndicator(homePos, awayPos, totalTeams)
2. If no positions → skip (can't estimate expected odds)
3. Determine favorite: lower position number = favorite
4. Get favorite odds: ODDS1 if home is favorite, ODDS2 if away
5. Define expected range from gap:
   - Large  → expected max 1.25
   - Moderate → expected max 1.50
   - Close → no trap check (odds naturally longer)
6. If favorite odds > expected max:
   - Add warning: "Odds longer than expected for this mismatch – possible trap"
   - Optionally reduce confidence or add a flag
```

---

## 5. Thresholds to tune

- **Large gap expected max:** 1.25 is a starting point; could be 1.20 or 1.30.
- **Moderate gap expected max:** 1.50 is a starting point.
- **How much to penalize:** Only warn, or also reduce confidence? And by how much?

These can be adjusted after you see how often the flag fires and how often those games are traps.

---

## 6. Implementation (done)

- **Logic:** `src/utils/oddsTrapUtils.js` – `getOddsTrapResult(bet, card, homeTeam, awayTeam)`
- **Applies to:** League games only (skips cup), Straight Win and Double Chance
- **Expected max:** Large gap → 1.25, Moderate gap → 1.50
- **Confidence penalty:** 10 points when trap detected
- **UI:** Amber warning on each card (Best Bet, Primary, Secondary, Tertiary) + top-level warning in match header
- **Ticket-ready:** Cards with odds trap are not ticket-ready

---

## 7. Open questions (resolved)

1. ~~Does Sheet3 always have position?~~ League games yes, cup games no – we skip cup.
2. ~~Straight Win or Double Chance?~~ Both.
3. ~~UI or confidence only?~~ Both – warning in UI and confidence reduced.
