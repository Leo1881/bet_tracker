import React from "react";

const BetTypeChart = ({ teamBets, betType, teamName }) => {
  // Filter bets by bet type
  const filteredBets = teamBets.filter((bet) => {
    const betTypeLower = betType.toLowerCase();
    const betSelection = (
      bet.BET_SELECTION ||
      bet.bet_selection ||
      ""
    ).toLowerCase();
    const betTypeField = (
      bet.BET_TYPE ||
      bet.bet_type ||
      bet.betType ||
      ""
    ).toLowerCase();

    if (betTypeLower === "win") {
      return betSelection.includes("win") || betTypeField.includes("win");
    } else if (betTypeLower === "double chance") {
      return (
        betSelection.includes("x") || betTypeField.includes("double chance")
      );
    } else if (betTypeLower === "over") {
      return betSelection.includes("over") || betTypeField.includes("over");
    } else if (betTypeLower === "under") {
      return betSelection.includes("under") || betTypeField.includes("under");
    }
    return false;
  });

  // Generate chart data from filtered bets using rolling average
  const generateChartData = (bets) => {
    const data = [];
    const ROLLING_WINDOW = 5; // Use 5-game rolling window

    if (!bets || bets.length === 0) {
      return [];
    }

    // Process bets in chronological order
    const sortedBets = [...bets].sort((a, b) => {
      const dateA = a.DATE || a.date;
      const dateB = b.DATE || b.date;
      return new Date(dateA) - new Date(dateB);
    });

    // Get last 10 bets for display
    const last10Bets = sortedBets.slice(-10);

    last10Bets.forEach((bet, index) => {
      const result = bet.RESULT || bet.result;
      const isWin = result?.toLowerCase().includes("win") || result === "W";

      // Calculate rolling average: look back at last ROLLING_WINDOW games (or fewer if not enough games)
      // We need to look at the games up to and including the current game
      const gamesToLookAt = last10Bets.slice(0, index + 1);
      const windowStart = Math.max(0, gamesToLookAt.length - ROLLING_WINDOW);
      const windowGames = gamesToLookAt.slice(windowStart);
      
      // Count wins in the rolling window
      const windowWins = windowGames.filter(b => {
        const r = b.RESULT || b.result;
        return r?.toLowerCase().includes("win") || r === "W";
      }).length;
      
      const windowTotal = windowGames.length;
      const rollingWinRate = windowTotal > 0 ? (windowWins / windowTotal) * 100 : 0;


      data.push({
        x: index + 1,
        y: isNaN(rollingWinRate) ? 0 : rollingWinRate,
        game: index + 1,
        result: isWin ? "win" : "loss",
      });
    });

    return data;
  };

  const chartData = generateChartData(filteredBets);

  if (chartData.length === 0) {
    return (
      <div className="w-16 h-8 flex items-center justify-center text-gray-400 text-xs">
        No {betType}
      </div>
    );
  }

  // Calculate chart dimensions for small chart
  const width = 60;
  const height = 30;
  const padding = 1;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Create SVG path for the line
  const createPath = (data) => {
    if (data.length < 2) return "";

    const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;
    const points = data.map((point, index) => {
      const x = data.length > 1 ? padding + index * stepX : padding + chartWidth / 2;
      const y = padding + chartHeight - ((point.y || 0) / 100) * chartHeight;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  const pathData = createPath(chartData);

  // Calculate trend direction
  const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
  const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
  const firstAvg =
    firstHalf.reduce((sum, point) => sum + point.y, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, point) => sum + point.y, 0) / secondHalf.length;
  const trend = secondAvg - firstAvg;

  // Determine colors based on trend and current performance
  const currentWinRate = chartData[chartData.length - 1]?.y || 0;
  let lineColor = "#3b82f6"; // Default blue
  let trendIcon = "➡️";

  if (currentWinRate >= 70) {
    lineColor = trend > 5 ? "#10b981" : trend < -5 ? "#f59e0b" : "#10b981"; // Green
    trendIcon = trend > 5 ? "↗️" : trend < -5 ? "↘️" : "➡️";
  } else if (currentWinRate >= 50) {
    lineColor = trend > 5 ? "#f59e0b" : trend < -5 ? "#ef4444" : "#f59e0b"; // Yellow/Orange
    trendIcon = trend > 5 ? "↗️" : trend < -5 ? "↘️" : "➡️";
  } else {
    lineColor = trend > 5 ? "#f59e0b" : trend < -5 ? "#ef4444" : "#ef4444"; // Red
    trendIcon = trend > 5 ? "↗️" : trend < -5 ? "↘️" : "➡️";
  }

  return (
    <div className="w-16 h-8 flex flex-col items-center justify-center relative group">
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Background */}
        <rect width={width} height={height} fill="rgba(255,255,255,0.05)" />

        {/* Chart line */}
        <path
          d={pathData}
          fill="none"
          stroke={lineColor}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {chartData.map((point, index) => {
          const stepX = chartData.length > 1 ? chartWidth / (chartData.length - 1) : 0;
          const x = chartData.length > 1 ? padding + index * stepX : padding + chartWidth / 2;
          const y = padding + chartHeight - ((point.y || 0) / 100) * chartHeight;

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="0.8"
              fill={point.result === "win" ? "#10b981" : "#ef4444"}
              className="opacity-80"
            />
          );
        })}

        {/* Current point highlight */}
        {chartData.length > 0 && (
          <circle
            cx={chartData.length > 1 ? padding + chartWidth : padding + chartWidth / 2}
            cy={
              padding +
              chartHeight -
              ((chartData[chartData.length - 1].y || 0) / 100) * chartHeight
            }
            r="1.5"
            fill={lineColor}
            stroke="#fff"
            strokeWidth="0.5"
          />
        )}
      </svg>

      {/* Trend indicator */}
      <div className="absolute -top-1 -right-1 text-xs">{trendIcon}</div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        <div className="font-medium">{teamName}</div>
        <div>{betType} bets</div>
        <div>Last {chartData.length} games (5-game rolling avg)</div>
        <div>Current: {currentWinRate.toFixed(1)}%</div>
        <div>
          Trend: {trend > 0 ? "+" : ""}
          {trend.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

export default BetTypeChart;
