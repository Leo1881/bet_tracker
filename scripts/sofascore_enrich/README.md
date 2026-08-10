# SofaScore enrich (local test only)

Optional experiment: pull **missing players / injuries** from SofaScore for games
you already analyzed. Does **not** replace Sheet1 flow.

## Setup (once)

```bash
cd scripts/sofascore_enrich
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium
```

## Enable in the app

In project `.env` (local only — do not commit secrets):

```
ENABLE_SOFASCORE_ENRICH=1
```

Restart `npm run server`. On **Recommendations**, use  
**Test: SofaScore enrich** (Best ticket games by default).

## CLI smoke test

```bash
source .venv/bin/activate
echo '{"games":[{"home_team":"Leeds United","away_team":"Arsenal","date":"2026-01-31"}]}' \
  | python enrich.py
```

Matching uses **team search + next/last fixtures** (SofaScore date schedule endpoint is currently 404).
Also pulls **H2H** (`homeWins-draws-awayWins`) and head-to-head streaks.
The UI applies a **soft** confidence nudge / caution note from H2H vs the stake pick (does not rewrite core ranking until you choose to).

Lineups are fetched raw so upcoming games without formation still return missing players when available.

Unofficial API — may break or rate-limit. Intended for local testing; don’t push until you’re happy with it.
