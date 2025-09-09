-- Script to clear all recommendation tracking data
-- Run this to start fresh with new data

-- Clear all data from recommendation_tracking table
DELETE FROM recommendation_tracking;

-- Clear all data from recommendation_analysis table  
DELETE FROM recommendation_analysis;

-- Reset the auto-increment counters
ALTER SEQUENCE recommendation_tracking_id_seq RESTART WITH 1;
ALTER SEQUENCE recommendation_analysis_id_seq RESTART WITH 1;

-- Show confirmation
SELECT 'Database cleared successfully!' as status;
SELECT COUNT(*) as remaining_recommendations FROM recommendation_tracking;
SELECT COUNT(*) as remaining_analyses FROM recommendation_analysis;

