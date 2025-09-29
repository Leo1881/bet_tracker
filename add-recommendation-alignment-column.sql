-- Add recommendation_alignment column to track system recommendation alignment
ALTER TABLE recommendation_tracking 
ADD COLUMN IF NOT EXISTS recommendation_alignment BOOLEAN;

-- Add comment to explain the new column
COMMENT ON COLUMN recommendation_tracking.recommendation_alignment IS 'Whether the system recommended what the user actually bet (separate from prediction accuracy)';


