-- Change unique constraint from (game_id, betslip_id) to (bet_id, betslip_id)
-- This allows multiple bet types for the same game in different bet_ids

-- Drop the old unique constraint
DROP INDEX IF EXISTS idx_recommendation_tracking_unique_game;

-- Add new unique constraint based on bet_id and betslip_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_recommendation_tracking_unique_bet
ON recommendation_tracking (bet_id, betslip_id);

-- Add a comment explaining the change
COMMENT ON INDEX idx_recommendation_tracking_unique_bet IS 'Unique constraint on bet_id and betslip_id to allow multiple bet types for same game';
