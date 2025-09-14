-- Insert test recommendations based on the betslip data provided
-- This will allow us to test the new matching logic

INSERT INTO recommendation_tracking (
    betslip_id, bet_id, game_id, date, home_team, away_team, 
    team_included, bet_type, bet_selection, odds1, odds2, oddsX,
    recommendation, confidence_score, reasoning
) VALUES 
-- Test data from the betslip: 2005/09/13 - 136
('test-betslip-136', '2005/09/13 - 136', '13-Sep_FCV_Dender_EH_Union_Saint-Gilloise', '2025-09-13', 'FCV Dender EH', 'Union Saint-Gilloise', 'Union Saint-Gilloise', 'Double Chance', 'X 2', 6.6, 1.44, NULL, 'Union Saint-Gilloise', 7.5, 'Test recommendation for Union Saint-Gilloise'),
('test-betslip-136', '2005/09/13 - 136', '13-Sep_Slavia_Prague_U19_Vysocina_Jihlava_U19', '2025-09-13', 'Slavia Prague U19', 'Vysocina Jihlava U19', 'Slavia Prague U19', 'Double Chance', '1 X', 1.32, 6.96, NULL, 'Slavia Prague U19', 8.0, 'Test recommendation for Slavia Prague U19'),
('test-betslip-136', '2005/09/13 - 136', '13-Sep_Slavia_Prague_MFK_Karvina', '2025-09-13', 'Slavia Prague', 'MFK Karvina', 'Slavia Prague', 'Win', 'Home Win', 1.12, 17, NULL, 'Slavia Prague', 9.0, 'Test recommendation for Slavia Prague'),
('test-betslip-136', '2005/09/13 - 136', '13-Sep_CSD_Independiente_del_Valle_Vinotinto_FC_Ecuador', '2025-09-13', 'CSD Independiente del Valle', 'Vinotinto FC Ecuador', 'CSD Independiente del Valle', 'Double Chance', '1 X', 1.32, 8.2, NULL, 'CSD Independiente del Valle', 7.8, 'Test recommendation for CSD Independiente del Valle'),
('test-betslip-136', '2005/09/13 - 136', '13-Sep_Laanemaa_JK_Haapsalu_FC_Phoenix_Johvi', '2025-09-13', 'Laanemaa JK Haapsalu', 'FC Phoenix Johvi', 'FC Phoenix Johvi', 'Win', 'Away Win', 12.04, 1.14, NULL, 'FC Phoenix Johvi', 8.5, 'Test recommendation for FC Phoenix Johvi'),
('test-betslip-136', '2005/09/13 - 136', '13-Sep_Flora_Tallinn_Parnu_JK_Vaprus', '2025-09-13', 'Flora Tallinn', 'Parnu JK Vaprus', 'Flora Tallinn', 'Win', 'Home Win', 1.33, 7.61, NULL, 'Flora Tallinn', 8.2, 'Test recommendation for Flora Tallinn'),
('test-betslip-136', '2005/09/13 - 136', '13-Sep_Tartu_JK_Tammeka_FCI_Levadia_Tallinn', '2025-09-13', 'Tartu JK Tammeka', 'FCI Levadia Tallinn', 'FCI Levadia Tallinn', 'Win', 'Away Win', 12.25, 1.14, NULL, 'FCI Levadia Tallinn', 7.0, 'Test recommendation for FCI Levadia Tallinn'),
('test-betslip-136', '2005/09/13 - 136', '13-Sep_PEPO_Lappeenranta_FC_Honka', '2025-09-13', 'PEPO Lappeenranta', 'FC Honka', 'FC Honka', 'Win', 'Away Win', 8.2, 1.23, NULL, 'FC Honka', 6.8, 'Test recommendation for FC Honka'),
('test-betslip-136', '2005/09/13 - 136', '13-Sep_Tampereen_Ilves_2_FC_Kiffen', '2025-09-13', 'Tampereen Ilves 2', 'FC Kiffen', 'Tampereen Ilves 2', 'Win', 'Home Win', 1.27, 6.8, NULL, 'Tampereen Ilves 2', 8.3, 'Test recommendation for Tampereen Ilves 2'),
('test-betslip-136', '2005/09/13 - 136', '13-Sep_Bayern_Munich_Hamburger_SV+N38', '2025-09-13', 'Bayern Munich', 'Hamburger SV+N38', 'Bayern Munich', 'Win', 'Home Win', 1.09, 28, NULL, 'Bayern Munich', 9.5, 'Test recommendation for Bayern Munich');

-- Show confirmation
SELECT 'Test recommendations inserted successfully!' as status;
SELECT COUNT(*) as total_recommendations FROM recommendation_tracking;
SELECT betslip_id, COUNT(*) as recommendations_count FROM recommendation_tracking GROUP BY betslip_id;

