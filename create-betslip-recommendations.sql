-- Betslip recommendations: one row per game, all fields for current use and future use.
-- Match key: bet_id + country + league + bet_type + bet_selection + team_included (one row per game).

CREATE TABLE IF NOT EXISTS betslip_recommendations (
    id SERIAL PRIMARY KEY,

    -- Identifiers (match key + display)
    bet_id VARCHAR(100) NOT NULL,
    betslip_id VARCHAR(255),           -- optional session id when uploaded
    game_id VARCHAR(255),             -- e.g. date_home_team_away_team
    date DATE,
    country VARCHAR(100),
    league VARCHAR(100),
    home_team VARCHAR(100),
    away_team VARCHAR(100),
    team_included VARCHAR(100),
    bet_type VARCHAR(50),
    bet_selection VARCHAR(100),

    -- Odds
    odds1 DECIMAL(5,2),
    odds2 DECIMAL(5,2),
    oddsx DECIMAL(5,2),

    -- Primary recommendation (the one you use)
    recommendation VARCHAR(255),
    confidence_score DECIMAL(5,2),
    reasoning TEXT,

    -- Extra recommendation data (for later use)
    confidence_breakdown JSONB,
    historical_data JSONB,
    probabilities JSONB,

    -- Primary / secondary / tertiary (for later use)
    primary_recommendation VARCHAR(255),
    primary_confidence DECIMAL(5,2),
    primary_reasoning TEXT,
    secondary_recommendation VARCHAR(255),
    secondary_confidence DECIMAL(5,2),
    secondary_reasoning TEXT,
    tertiary_recommendation VARCHAR(255),
    tertiary_confidence DECIMAL(5,2),
    tertiary_reasoning TEXT,
    chosen_recommendation_type VARCHAR(20) DEFAULT 'PRIMARY',
    recommendation_type VARCHAR(20) DEFAULT 'PRIMARY',

    -- Recent form (for later use)
    last_5_wins_home INTEGER DEFAULT 0,
    last_5_draws_home INTEGER DEFAULT 0,
    last_5_losses_home INTEGER DEFAULT 0,
    last_5_wins_away INTEGER DEFAULT 0,
    last_5_draws_away INTEGER DEFAULT 0,
    last_5_losses_away INTEGER DEFAULT 0,

    -- Result tracking (filled when you run Compare from Sheet1)
    actual_result VARCHAR(50),
    actual_home_score INTEGER,
    actual_away_score INTEGER,
    prediction_accurate BOOLEAN,
    system_prediction_accurate BOOLEAN,
    recommendation_alignment BOOLEAN,
    your_bet_won BOOLEAN,
    analysis_type VARCHAR(100),
    insight TEXT,
    analysis_notes TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    result_updated_at TIMESTAMP
);

-- Unique constraint: one row per game (your match key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_betslip_rec_unique
ON betslip_recommendations (bet_id, country, league, bet_type, bet_selection, team_included);

-- Indexes for listing and filtering
CREATE INDEX IF NOT EXISTS idx_betslip_rec_bet_id ON betslip_recommendations(bet_id);
CREATE INDEX IF NOT EXISTS idx_betslip_rec_date ON betslip_recommendations(date);
CREATE INDEX IF NOT EXISTS idx_betslip_rec_betslip_id ON betslip_recommendations(betslip_id);
