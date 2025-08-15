# Google Sheets to PostgreSQL Sync Script

This script automatically syncs your Google Sheets data to PostgreSQL database for the Bet Tracker app.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install googleapis pg dotenv
```

### 2. Create Environment File

Copy `env-template.txt` to `.env` and update with your database credentials:

```bash
cp env-template.txt .env
```

Edit `.env` with your actual PostgreSQL credentials:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bet_tracker
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=false
```

### 3. Run the Sync Script

**Manual sync:**

```bash
node sync-to-postgres.js
```

**Or using npm:**

```bash
npm run sync
```

## Automated Daily Sync

### Option 1: Cron Job (Linux/Mac)

Add to your crontab to run daily at 9 AM:

```bash
crontab -e
```

Add this line:

```
0 9 * * * cd /path/to/your/bet_tracker && node sync-to-postgres.js >> sync.log 2>&1
```

### Option 2: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to Daily at 9 AM
4. Action: Start a program
5. Program: `node`
6. Arguments: `sync-to-postgres.js`
7. Start in: `C:\path\to\your\bet_tracker`

### Option 3: GitHub Actions (if you want cloud sync)

Create `.github/workflows/sync.yml`:

```yaml
name: Sync to PostgreSQL
on:
  schedule:
    - cron: "0 9 * * *" # Daily at 9 AM UTC
  workflow_dispatch: # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "16"
      - run: npm install
      - run: node sync-to-postgres.js
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_PORT: ${{ secrets.DB_PORT }}
          DB_NAME: ${{ secrets.DB_NAME }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          DB_SSL: ${{ secrets.DB_SSL }}
```

## What the Script Does

1. **Fetches data** from your Google Sheets (Sheet1, Sheet2, Sheet3, Sheet4)
2. **Clears existing data** in PostgreSQL tables
3. **Inserts fresh data** from Google Sheets
4. **Logs the process** with timestamps and counts

## Tables Synced

- `bets` - Your main betting history (Sheet1)
- `blacklisted_teams` - Teams to avoid (Sheet2)
- `new_bets` - Games to analyze (Sheet3)
- `team_notes` - Team notes and observations (Sheet4)

## Troubleshooting

**Connection Error:**

- Check your `.env` file has correct database credentials
- Ensure PostgreSQL is running
- Verify database `bet_tracker` exists

**Permission Error:**

- Make sure your database user has INSERT/DELETE permissions
- Check if tables exist and are accessible

**Google Sheets Error:**

- Verify the spreadsheet ID is correct
- Check if the API key has access to the spreadsheet

## Logs

The script logs:

- Connection status
- Number of records synced for each table
- Any errors encountered
- Timestamp of sync completion

Check the console output or log file for detailed information.
