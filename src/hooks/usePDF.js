import { useCallback } from "react";
import { generatePDFReport } from "../services/pdfService";

/**
 * Custom hook for PDF generation functions
 * @param {Array} analysisResults - Array of analysis results
 * @param {Array} betRecommendations - Array of bet recommendations
 * @returns {Object} PDF functions
 */
export const usePDF = (analysisResults, betRecommendations) => {
  // Generate PDF report
  const generatePDFReportData = useCallback(async () => {
    return await generatePDFReport(analysisResults, betRecommendations);
  }, [analysisResults, betRecommendations]);

  return {
    generatePDFReport: generatePDFReportData,
  };
};
