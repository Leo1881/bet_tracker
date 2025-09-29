-- Add system_prediction_accurate column to track original system prediction accuracy
ALTER TABLE recommendation_tracking 
ADD COLUMN IF NOT EXISTS system_prediction_accurate BOOLEAN;

-- Add comment to explain the new column
COMMENT ON COLUMN recommendation_tracking.system_prediction_accurate IS 'Whether the systems original prediction about the game outcome was accurate (separate from recommendation alignment)';


