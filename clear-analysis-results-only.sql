-- Script to clear only analysis/recommendation results while keeping betslips data
-- This preserves your original bet data but clears the analysis results

-- Clear recommendation tracking table (this contains the analysis results)
DELETE FROM recommendation_tracking;

-- Clear recommendation analysis table (this contains summary analysis)
DELETE FROM recommendation_analysis;

-- Clear any attached predictions (if they exist)
DELETE FROM attached_predictions;

-- Reset the auto-increment counters for analysis tables only
ALTER SEQUENCE recommendation_tracking_id_seq RESTART WITH 1;
ALTER SEQUENCE recommendation_analysis_id_seq RESTART WITH 1;

-- Show confirmation
SELECT 'Analysis results cleared successfully!' as status;
SELECT COUNT(*) as remaining_bets FROM bets; -- This should show your betslips are preserved
SELECT COUNT(*) as remaining_recommendations FROM recommendation_tracking; -- This should be 0
SELECT COUNT(*) as remaining_analyses FROM recommendation_analysis; -- This should be 0
