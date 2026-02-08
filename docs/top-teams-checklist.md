# Top Teams tab – “What might feel missing” checklist

Use this to go through each item one by one and decide if you want to change anything.

---

- [ ] **1. No filtering by your main UI**  
  The list is always “all time” over **all** deduplicated bets. Date range, country, league, team, result, and bet type filters on the main Data/Analytics views do **not** apply to Top Teams. If you expect “top teams in this league” or “this year only”, that’s not what the tab does today.

- [ ] **2. Bets with no country or league**  
  Any bet missing **COUNTRY** or **LEAGUE** is **skipped** when building the list. If some imports or sources don’t set these fields, those bets never affect Top Teams.

- [x] **3. Pending bets in the numbers**  
  **Done:** Total Bets and ranking now use only settled bets (win/loss). Recent Performance uses the last 10 settled bets. Pending bets are excluded everywhere.

- [ ] **4. Dedup key doesn’t use TEAM_INCLUDED**  
  Deduplication is by date + home + away + bet type + bet selection. So “Team A vs Team B – Win – Team A” and “Team A vs Team B – Win – Team B” are two separate rows (different selection). Both can count toward each team. If you expected one row per game per team, that’s not how it works.

- [x] **5. Same team name in different leagues**  
  The same team name in two leagues shows as **two rows**. **Keep as-is:** Teams perform differently in different leagues; one row per league is correct. (e.g. “Team A – England – Premier League” and “Team A – England – Championship”). Confirm this is what you want, or if you’d prefer one row per team name across all leagues.

- [x] **6. Blacklist is display-only**  
  ~~Blacklisted teams still **appear** in the top 100 and still **affect** the ranking; they’re just styled (red row, badge). The list is not “top 100 excluding blacklist”.~~ **Done:** Blacklisted teams are now excluded from the list and are not displayed.

---

*File: `docs/top-teams-checklist.md` – tick each box as you go through it.*
