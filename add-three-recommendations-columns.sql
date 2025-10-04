-- Add columns to store all 3 recommendations in one record
ALTER TABLE recommendation_tracking 
ADD COLUMN IF NOT EXISTS primary_recommendation VARCHAR(255),
ADD COLUMN IF NOT EXISTS primary_confidence DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS primary_reasoning TEXT,
ADD COLUMN IF NOT EXISTS secondary_recommendation VARCHAR(255),
ADD COLUMN IF NOT EXISTS secondary_confidence DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS secondary_reasoning TEXT,
ADD COLUMN IF NOT EXISTS tertiary_recommendation VARCHAR(255),
ADD COLUMN IF NOT EXISTS tertiary_confidence DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS tertiary_reasoning TEXT,
ADD COLUMN IF NOT EXISTS chosen_recommendation_type VARCHAR(20) DEFAULT 'PRIMARY';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recommendation_tracking_primary ON recommendation_tracking(primary_recommendation);
CREATE INDEX IF NOT EXISTS idx_recommendation_tracking_chosen ON recommendation_tracking(chosen_recommendation_type);
