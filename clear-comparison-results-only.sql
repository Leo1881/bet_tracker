-- Script to clear only the comparison results while keeping original recommendations
-- This allows you to re-run the comparison with the fixed matching logic

-- Clear only the comparison result fields, keep the original recommendations
UPDATE recommendation_tracking 
SET 
    actual_result = NULL,
    actual_home_score = NULL,
    actual_away_score = NULL,
    prediction_accurate = NULL,
    analysis_notes = NULL,
    result_updated_at = NULL;

-- Clear the analysis summary table
DELETE FROM recommendation_analysis;

-- Reset the analysis table sequence
ALTER SEQUENCE recommendation_analysis_id_seq RESTART WITH 1;

-- Show confirmation
SELECT 'Comparison results cleared successfully!' as status;
SELECT COUNT(*) as remaining_recommendations FROM recommendation_tracking;
SELECT COUNT(*) as recommendations_with_results FROM recommendation_tracking WHERE actual_result IS NOT NULL;
SELECT COUNT(*) as remaining_analyses FROM recommendation_analysis;
