-- Create recommendation_tracking table for persistent recommendation storage
CREATE TABLE IF NOT EXISTS recommendation_tracking (
    id SERIAL PRIMARY KEY,
    betslip_id VARCHAR(255) NOT NULL,
    bet_id VARCHAR(100), -- Original BET_ID from Google Sheets (e.g., "2005/08/28 - 102")
    game_id VARCHAR(255) NOT NULL, -- Unique identifier: date_home_team_away_team
    date DATE NOT NULL,
    home_team VARCHAR(100),
    away_team VARCHAR(100),
    team_included VARCHAR(100),
    bet_type VARCHAR(50),
    bet_selection VARCHAR(100),
    odds1 DECIMAL(5,2),
    odds2 DECIMAL(5,2),
    oddsX DECIMAL(5,2),
    
    -- Recommendation data
    recommendation VARCHAR(100),
    confidence_score DECIMAL(3,1),
    confidence_breakdown JSONB, -- Store the full breakdown object
    reasoning TEXT, -- Store the detailed reasoning
    historical_data JSONB, -- Store historical context (win/loss details, matchups, etc.)
    probabilities JSONB, -- Store calculated probabilities
    
    -- Result tracking
    actual_result VARCHAR(20),
    actual_home_score INTEGER,
    actual_away_score INTEGER,
    prediction_accurate BOOLEAN,
    analysis_notes TEXT, -- Manual notes about why it failed/succeeded
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    result_updated_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recommendation_tracking_betslip_id ON recommendation_tracking(betslip_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_tracking_game_id ON recommendation_tracking(game_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_tracking_date ON recommendation_tracking(date);
CREATE INDEX IF NOT EXISTS idx_recommendation_tracking_team_included ON recommendation_tracking(team_included);
CREATE INDEX IF NOT EXISTS idx_recommendation_tracking_created_at ON recommendation_tracking(created_at);

-- Create a unique constraint to prevent duplicate recommendations for the same game
CREATE UNIQUE INDEX IF NOT EXISTS idx_recommendation_tracking_unique_game 
ON recommendation_tracking(game_id, betslip_id);

-- Create recommendation_analysis table for storing comparison results
CREATE TABLE IF NOT EXISTS recommendation_analysis (
    id SERIAL PRIMARY KEY,
    analysis_date DATE NOT NULL,
    total_recommendations INTEGER NOT NULL,
    correct_predictions INTEGER NOT NULL,
    wrong_predictions INTEGER NOT NULL,
    pending_predictions INTEGER NOT NULL,
    
    -- Detailed analysis data
    confidence_failure_analysis JSONB, -- Which confidence factors failed most often
    team_performance_analysis JSONB,   -- Which teams were over/under predicted
    recommendation_type_analysis JSONB, -- Success rates by recommendation type
    league_analysis JSONB,             -- Performance by league
    
    -- Summary statistics
    overall_accuracy DECIMAL(5,2),     -- Overall accuracy percentage
    high_confidence_accuracy DECIMAL(5,2), -- Accuracy for high confidence predictions
    medium_confidence_accuracy DECIMAL(5,2), -- Accuracy for medium confidence predictions
    low_confidence_accuracy DECIMAL(5,2),    -- Accuracy for low confidence predictions
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    notes TEXT -- Manual notes about the analysis
);

-- Create indexes for recommendation_analysis table
CREATE INDEX IF NOT EXISTS idx_recommendation_analysis_date ON recommendation_analysis(analysis_date);
CREATE INDEX IF NOT EXISTS idx_recommendation_analysis_created_at ON recommendation_analysis(created_at);
