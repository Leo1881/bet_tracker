# Bet Tracker Improvements Checklist

Work through these items one by one. Check off as you complete each.

---

## Quick Wins

- [x] **Remove dead code** – Delete the `{false && activeTab === "betAnalysis" && ...}` block (~650 lines) in App.js
- [x] **Run npm audit fix** – Address security vulnerabilities
- [x] **Update browserslist** – Run `npx update-browserslist-db@latest`

---

## High Impact

- [ ] **Extract AnalyticsCards component** – Move the inline analytics cards (Current Form, Best Bet Type, etc.) from App.js into a separate component
- [ ] **Extract AnalysisResultsTable component** – Move the inline analysis results table from App.js into a separate component
- [ ] **Add useMemo for expensive computations** – Memoize `getDeduplicatedFilteredBets`, `getFilteredTeamStats`, `getUniqueValues`, and similar functions
- [ ] **Consolidate filter logic** – Unify `getDeduplicatedFilteredBets` with `applyFilters` to avoid duplicate filter logic
- [ ] **Reduce prop drilling** – Introduce React Context for shared state (filters, bets, loading) or a TabContent component

---

## Medium Impact

- [ ] **Restructure server.js** – Split routes into separate files (e.g. `routes/bets.js`, `routes/predictions.js`)
- [ ] **Add React Error Boundary** – Wrap app/sections so one tab crash doesn't break the whole app
- [ ] **Improve loading states** – Add skeleton loaders instead of blank screens
- [ ] **Improve error handling** – Add retry actions and clearer error messages

---

## Nice to Have

- [ ] **Add TypeScript** – Migrate to TypeScript for type safety on bets, filters, API responses
- [ ] **Add list virtualization** – Use react-window or @tanstack/react-virtual for large data tables
- [ ] **Validate environment variables** – Fail fast with clear errors if DB credentials are missing

---

## Notes

- Start with Quick Wins for immediate payoff
- Tackle High Impact items when you have more time
- Medium/Nice to Have can be done incrementally
