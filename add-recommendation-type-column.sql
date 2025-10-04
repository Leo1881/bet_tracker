-- Add recommendation_type column to store PRIMARY/SECONDARY/TERTIARY
ALTER TABLE recommendation_tracking 
ADD COLUMN IF NOT EXISTS recommendation_type VARCHAR(20) DEFAULT 'PRIMARY';

-- Update existing records to have PRIMARY as default
UPDATE recommendation_tracking 
SET recommendation_type = 'PRIMARY' 
WHERE recommendation_type IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_recommendation_tracking_type ON recommendation_tracking(recommendation_type);
