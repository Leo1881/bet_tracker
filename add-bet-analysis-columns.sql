-- Add new columns to track separate bet outcome and system prediction accuracy
ALTER TABLE recommendation_tracking 
ADD COLUMN IF NOT EXISTS your_bet_won BOOLEAN,
ADD COLUMN IF NOT EXISTS analysis_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS insight TEXT;

-- Add comments to explain the new columns
COMMENT ON COLUMN recommendation_tracking.your_bet_won IS 'Whether the users actual bet selection won (separate from system prediction accuracy)';
COMMENT ON COLUMN recommendation_tracking.analysis_type IS 'Type of analysis: Both Correct, You Won System Wrong, System Right You Lost, Both Wrong';
COMMENT ON COLUMN recommendation_tracking.insight IS 'Insight about why the bet won/lost relative to system prediction';
