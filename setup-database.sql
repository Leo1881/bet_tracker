-- Create database (run this separately if needed)
-- CREATE DATABASE bet_tracker;

-- Connect to the database
-- \c bet_tracker;

-- Create bets table
CREATE TABLE IF NOT EXISTS bets (
    id SERIAL PRIMARY KEY,
    date DATE,
    bet_id VARCHAR(50),
    country VARCHAR(100),
    league VARCHAR(100),
    home_team VARCHAR(100),
    odds1 DECIMAL(5,2),
    away_team VARCHAR(100),
    odds2 DECIMAL(5,2),
    bet_type VARCHAR(50),
    bet_selection VARCHAR(100),
    team_included VARCHAR(100),
    home_score INTEGER,
    away_score INTEGER,
    result VARCHAR(20),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create blacklisted_teams table
CREATE TABLE IF NOT EXISTS blacklisted_teams (
    id SERIAL PRIMARY KEY,
    country VARCHAR(100),
    league VARCHAR(100),
    team_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create new_bets table
CREATE TABLE IF NOT EXISTS new_bets (
    id SERIAL PRIMARY KEY,
    date DATE,
    country VARCHAR(100),
    league VARCHAR(100),
    home_team VARCHAR(100),
    odds1 DECIMAL(5,2),
    away_team VARCHAR(100),
    odds2 DECIMAL(5,2),
    bet_type VARCHAR(50),
    bet_selection VARCHAR(100),
    team_included VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create team_notes table
CREATE TABLE IF NOT EXISTS team_notes (
    id SERIAL PRIMARY KEY,
    country VARCHAR(100),
    league VARCHAR(100),
    team_name VARCHAR(100),
    note TEXT,
    date_added DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bets_date ON bets(date);
CREATE INDEX IF NOT EXISTS idx_bets_country_league ON bets(country, league);
CREATE INDEX IF NOT EXISTS idx_bets_team_included ON bets(team_included);
CREATE INDEX IF NOT EXISTS idx_bets_result ON bets(result);

CREATE INDEX IF NOT EXISTS idx_blacklisted_teams_name ON blacklisted_teams(team_name);
CREATE INDEX IF NOT EXISTS idx_blacklisted_teams_country_league ON blacklisted_teams(country, league);

CREATE INDEX IF NOT EXISTS idx_new_bets_date ON new_bets(date);
CREATE INDEX IF NOT EXISTS idx_new_bets_country_league ON new_bets(country, league);
CREATE INDEX IF NOT EXISTS idx_new_bets_team_included ON new_bets(team_included);

CREATE INDEX IF NOT EXISTS idx_team_notes_team_name ON team_notes(team_name);
CREATE INDEX IF NOT EXISTS idx_team_notes_country_league ON team_notes(country, league);

-- Create a view for scoring analysis
CREATE OR REPLACE VIEW scoring_analysis AS
SELECT 
    home_team as team,
    country,
    league,
    COUNT(*) as total_games,
    SUM(home_score + away_score) as total_goals,
    ROUND(AVG(home_score + away_score), 2) as avg_goals,
    SUM(CASE WHEN (home_score + away_score) > 1 THEN 1 ELSE 0 END) as over1_5_count,
    SUM(CASE WHEN (home_score + away_score) > 2 THEN 1 ELSE 0 END) as over2_5_count,
    SUM(CASE WHEN (home_score + away_score) > 3 THEN 1 ELSE 0 END) as over3_5_count,
    ROUND((SUM(CASE WHEN (home_score + away_score) > 1 THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 1) as over1_5_rate,
    ROUND((SUM(CASE WHEN (home_score + away_score) > 2 THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 1) as over2_5_rate,
    ROUND((SUM(CASE WHEN (home_score + away_score) > 3 THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 1) as over3_5_rate,
    COUNT(*) as home_games,
    0 as away_games
FROM bets 
WHERE home_score IS NOT NULL AND away_score IS NOT NULL AND result IS NOT NULL AND result != ''
GROUP BY home_team, country, league

UNION ALL

SELECT 
    away_team as team,
    country,
    league,
    COUNT(*) as total_games,
    SUM(home_score + away_score) as total_goals,
    ROUND(AVG(home_score + away_score), 2) as avg_goals,
    SUM(CASE WHEN (home_score + away_score) > 1 THEN 1 ELSE 0 END) as over1_5_count,
    SUM(CASE WHEN (home_score + away_score) > 2 THEN 1 ELSE 0 END) as over2_5_count,
    SUM(CASE WHEN (home_score + away_score) > 3 THEN 1 ELSE 0 END) as over3_5_count,
    ROUND((SUM(CASE WHEN (home_score + away_score) > 1 THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 1) as over1_5_rate,
    ROUND((SUM(CASE WHEN (home_score + away_score) > 2 THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 1) as over2_5_rate,
    ROUND((SUM(CASE WHEN (home_score + away_score) > 3 THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 1) as over3_5_rate,
    0 as home_games,
    COUNT(*) as away_games
FROM bets 
WHERE home_score IS NOT NULL AND away_score IS NOT NULL AND result IS NOT NULL AND result != ''
GROUP BY away_team, country, league;

-- Create a view for team performance analysis
CREATE OR REPLACE VIEW team_performance AS
SELECT 
    team_included as team,
    country,
    league,
    COUNT(*) as total_bets,
    SUM(CASE WHEN LOWER(result) LIKE '%win%' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN LOWER(result) LIKE '%loss%' THEN 1 ELSE 0 END) as losses,
    ROUND((SUM(CASE WHEN LOWER(result) LIKE '%win%' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 1) as win_rate
FROM bets 
WHERE team_included IS NOT NULL AND team_included != '' AND result IS NOT NULL AND result != ''
GROUP BY team_included, country, league;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
