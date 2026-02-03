# Recommendation Tab – Suggested Improvements (7 items)

List of improvements proposed during review of the current recommendation implementation. Use as a backlog for future work.

---

## 1. ~~Hard cap at 40 games~~ ✅ Done

- **Was:** Only the first 40 games (after form filter) got recommendations.
- **Change:** Increased to **50 games** in `App.js` (`betsWithFormData.slice(0, 50)`).

---

## 2. ~~Risk / Straight Win behaviour~~ ✅ Done

- **Was:** Straight Win is always "High" risk, so it never counted as ticket-ready.
- **Change:** **Exception added:** Straight Win with confidence **≥ 85%** and no red odds counts as ticket-ready even when risk is High. Implemented in `RecommendationsTab.js` (`isCardTicketReady`) and helper text updated.

---

## 3. "First 50" depends on sort order

- **Observation:** The 50 games are chosen purely as "top 50 by confidence score." There is no option to pick by "most ticket-ready" or "league mix."
- **Possible change:** Add a setting or alternate sort so which 50 get recommendations can be tuned (e.g. prefer games with at least one ticket-ready pick, or balance by league).

---

## 4. Duplication between Best Bet and Primary

- **Observation:** When Best Bet is the same as Primary, both cards show the same recommendation.
- **Possible change:** When Best Bet === Primary, show a "Same as Primary" label on the Best Bet card, or collapse/hide the duplicate so only one card is shown.

---

## 5. Confidence scale audit

- **Observation:** Recommendations use 0–100% confidence; some legacy comments or logic might still assume 0–10.
- **Possible change:** Single pass through recommendation and odds logic to ensure confidence is consistently 0–100 everywhere.

---

## 6. Console logging

- **Observation:** Lots of `console.log` in the recommendation and odds flow (form analysis, odds performance, etc.).
- **Possible change:** Remove or gate behind a debug flag (e.g. `DEBUG_RECOMMENDATIONS`) so production builds are quiet.

---

## 7. ~~ESLint / build~~ ✅ Done

- **Was:** App only built with `CI=false` because of existing ESLint warnings (unused vars, empty pattern, etc.).
- **Change:** Fixed all ESLint warnings across App.js and other files (removed or silenced unused vars, fixed empty object pattern, removed unnecessary escapes, fixed hook deps). Build now succeeds with `CI=true`.

---

*Last updated: items 1, 2, 6 (console logging), 7 marked done.*
