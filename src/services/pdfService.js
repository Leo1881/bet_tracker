/**
 * PDF Service
 * Handles PDF report generation for betting analysis
 */
import { debugLog } from "../utils/debug";

/**
 * Generate PDF report from analysis results
 * @param {Array} analysisResults - Array of analysis results
 * @param {Array} betRecommendations - Array of bet recommendations
 * @returns {Promise<void>}
 */
export const generatePDFReport = async (
  analysisResults,
  betRecommendations
) => {
  if (!analysisResults || analysisResults.length === 0) {
    alert(
      "No bet analysis data available. Please run 'Fetch & Analyze New Bets' first."
    );
    return;
  }

  try {
    // Import jsPDF dynamically to avoid issues with SSR
    const { default: jsPDF } = await import("jspdf");

    const pdf = new jsPDF("l", "mm", "a4");
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    let yPosition = margin;
    const lineHeight = 5;

    // Consolidated Bet Analysis Table
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Bet Analysis Report", margin, yPosition);
    yPosition += lineHeight * 1.5;

    // Table headers - 8 columns with bet recommendations
    const tableHeaders = [
      "Teams (Home v Away)",
      "League",
      "Confidence",
      "Performance",
      "Primary Rec",
      "Secondary Rec",
      "Tertiary Rec",
      "Scoring Analysis",
    ];
    const columnWidths = [50, 30, 20, 20, 35, 35, 35, 30];
    const startX = margin;

    // Draw table headers
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    let currentX = startX;
    tableHeaders.forEach((header, index) => {
      pdf.text(header, currentX, yPosition);
      currentX += columnWidths[index];
    });
    yPosition += lineHeight;

    // Draw header line
    pdf.line(
      startX,
      yPosition,
      startX + columnWidths.reduce((a, b) => a + b, 0),
      yPosition
    );
    yPosition += lineHeight;

    // Table data
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "normal");

    analysisResults.forEach((bet, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      currentX = startX;

      // Teams (Home v Away)
      const matchText = `${bet.HOME_TEAM} v ${bet.AWAY_TEAM}`;
      pdf.text(matchText, currentX, yPosition);
      currentX += columnWidths[0];

      // League
      const leagueText = `${bet.COUNTRY} - ${bet.LEAGUE}`;
      pdf.text(leagueText, currentX, yPosition);
      currentX += columnWidths[1];

      // Confidence
      pdf.text(`${bet.confidenceScore}/10`, currentX, yPosition);
      currentX += columnWidths[2];

      // Historical Performance
      pdf.text(
        `${bet.historicalWins}W - ${bet.historicalLosses}L`,
        currentX,
        yPosition
      );
      currentX += columnWidths[3];

      // Find matching bet recommendation
      const matchingRec = betRecommendations
        ? betRecommendations.find((rec) => {
            // More flexible matching - check if either team name appears in the match string
            const homeMatch = rec.match
              .toLowerCase()
              .includes(bet.HOME_TEAM.toLowerCase());
            const awayMatch = rec.match
              .toLowerCase()
              .includes(bet.AWAY_TEAM.toLowerCase());
            return homeMatch && awayMatch;
          })
        : null;

      // Debug: Log the recommendation structure and matching process
      debugLog("Looking for match:", `${bet.HOME_TEAM} vs ${bet.AWAY_TEAM}`);
      debugLog(
        "Available recommendations:",
        betRecommendations.map((r) => r.match)
      );
      if (matchingRec) {
        debugLog("Found matching recommendation:", matchingRec);
        debugLog("Primary:", matchingRec.primary);
        debugLog("Secondary:", matchingRec.secondary);
        debugLog("Tertiary:", matchingRec.tertiary);
      } else {
        debugLog("No matching recommendation found");
      }

      // Primary Recommendation
      if (
        matchingRec &&
        matchingRec.primary &&
        matchingRec.primary.recommendation &&
        matchingRec.primary.recommendation.confidence
      ) {
        const primaryBet = matchingRec.primary.recommendation.bet || "N/A";
        const primaryConfidence =
          matchingRec.primary.recommendation.confidence.toFixed(1);
        pdf.text(
          `${primaryBet} (${primaryConfidence}/10)`,
          currentX,
          yPosition
        );
      } else {
        pdf.text("N/A", currentX, yPosition);
      }
      currentX += columnWidths[4];

      // Secondary Recommendation
      if (
        matchingRec &&
        matchingRec.secondary &&
        matchingRec.secondary.recommendation &&
        matchingRec.secondary.recommendation.confidence
      ) {
        const secondaryBet = matchingRec.secondary.recommendation.bet || "N/A";
        const secondaryConfidence =
          matchingRec.secondary.recommendation.confidence.toFixed(1);
        pdf.text(
          `${secondaryBet} (${secondaryConfidence}/10)`,
          currentX,
          yPosition
        );
      } else {
        pdf.text("N/A", currentX, yPosition);
      }
      currentX += columnWidths[5];

      // Tertiary Recommendation
      if (
        matchingRec &&
        matchingRec.tertiary &&
        matchingRec.tertiary.recommendation &&
        matchingRec.tertiary.recommendation.confidence
      ) {
        const tertiaryBet = matchingRec.tertiary.recommendation.bet || "N/A";
        const tertiaryConfidence =
          matchingRec.tertiary.recommendation.confidence.toFixed(1);
        pdf.text(
          `${tertiaryBet} (${tertiaryConfidence}/10)`,
          currentX,
          yPosition
        );
      } else {
        pdf.text("N/A", currentX, yPosition);
      }
      currentX += columnWidths[6];

      // Scoring Analysis
      if (bet.scoringRecommendation && bet.scoringRecommendation.type) {
        pdf.text(bet.scoringRecommendation.type, currentX, yPosition);
      } else {
        pdf.text("N/A", currentX, yPosition);
      }

      yPosition += lineHeight;
    });

    // Save the PDF
    const fileName = `bet-analysis-report-${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Error generating PDF report. Please try again.");
  }
};
