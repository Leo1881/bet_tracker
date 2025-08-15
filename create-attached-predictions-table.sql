-- Create attached_predictions table
CREATE TABLE IF NOT EXISTS attached_predictions (
    id SERIAL PRIMARY KEY,
    betslip_id VARCHAR(255) UNIQUE NOT NULL,
    predictions_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_attached_predictions_betslip_id ON attached_predictions(betslip_id);
