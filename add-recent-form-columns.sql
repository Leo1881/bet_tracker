-- Add recent form columns to recommendation_tracking table
-- This script adds the last 5 games data columns to store recent form information

-- Add columns for home team's last 5 games
ALTER TABLE recommendation_tracking 
ADD COLUMN IF NOT EXISTS last_5_wins_home INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_5_draws_home INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_5_losses_home INTEGER DEFAULT 0;

-- Add columns for away team's last 5 games  
ALTER TABLE recommendation_tracking
ADD COLUMN IF NOT EXISTS last_5_wins_away INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_5_draws_away INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_5_losses_away INTEGER DEFAULT 0;

-- Add columns to new_bets table as well (for consistency)
ALTER TABLE new_bets
ADD COLUMN IF NOT EXISTS last_5_wins_home INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_5_draws_home INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_5_losses_home INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_5_wins_away INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_5_draws_away INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_5_losses_away INTEGER DEFAULT 0;

-- Add columns to bets table as well (for consistency)
ALTER TABLE bets
ADD COLUMN IF NOT EXISTS last_5_wins_home INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_5_draws_home INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_5_losses_home INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_5_wins_away INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_5_draws_away INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_5_losses_away INTEGER DEFAULT 0;

-- Create indexes for better performance on recent form queries
CREATE INDEX IF NOT EXISTS idx_recommendation_tracking_recent_form_home 
ON recommendation_tracking(last_5_wins_home, last_5_draws_home, last_5_losses_home);

CREATE INDEX IF NOT EXISTS idx_recommendation_tracking_recent_form_away 
ON recommendation_tracking(last_5_wins_away, last_5_draws_away, last_5_losses_away);

-- Add comments to document the new columns
COMMENT ON COLUMN recommendation_tracking.last_5_wins_home IS 'Number of wins in home team''s last 5 games';
COMMENT ON COLUMN recommendation_tracking.last_5_draws_home IS 'Number of draws in home team''s last 5 games';
COMMENT ON COLUMN recommendation_tracking.last_5_losses_home IS 'Number of losses in home team''s last 5 games';
COMMENT ON COLUMN recommendation_tracking.last_5_wins_away IS 'Number of wins in away team''s last 5 games';
COMMENT ON COLUMN recommendation_tracking.last_5_draws_away IS 'Number of draws in away team''s last 5 games';
COMMENT ON COLUMN recommendation_tracking.last_5_losses_away IS 'Number of losses in away team''s last 5 games';
