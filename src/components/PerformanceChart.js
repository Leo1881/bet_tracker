import React from "react";

const PerformanceChart = ({ teamBets, teamName, allBets }) => {
  // Generate chart data from last 20 games
  const generateChartData = (bets) => {
    const data = [];
    let cumulativeWins = 0;
    let cumulativeGames = 0;

    if (!bets || bets.length === 0) {
      return [];
    }

    // Process bets in chronological order (oldest first)
    // Handle both data structures: Analytics tab (DATE, RESULT) and Team Analytics tab (date, result)
    const sortedBets = [...bets].sort((a, b) => {
      const dateA = a.DATE || a.date;
      const dateB = b.DATE || b.date;
      return new Date(dateA) - new Date(dateB);
    });

    sortedBets.slice(-20).forEach((bet, index) => {
      // Handle both data structures
      const result = bet.RESULT || bet.result;
      const isWin = result?.toLowerCase().includes("win") || result === "W";
      
      if (isWin) cumulativeWins++;
      cumulativeGames++;

      data.push({
        x: index + 1,
        y: cumulativeGames > 0 ? (cumulativeWins / cumulativeGames) * 100 : 0,
        game: index + 1,
        result: isWin ? "win" : "loss",
      });
    });

    return data;
  };

  const chartData = generateChartData(teamBets || []);

  if (chartData.length === 0) {
    return (
      <div className="w-24 h-12 flex items-center justify-center text-gray-400 text-xs">
        No data
      </div>
    );
  }

  // Calculate chart dimensions and scaling
  const width = 100;
  const height = 40;
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Create SVG path for the line
  const createPath = (data) => {
    if (data.length < 2) return "";

    const stepX = chartWidth / (data.length - 1);
    const points = data.map((point, index) => {
      const x = padding + index * stepX;
      const y = padding + chartHeight - (point.y / 100) * chartHeight;
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

  // Determine colors based on trend
  const lineColor = trend > 5 ? "#10b981" : trend < -5 ? "#ef4444" : "#3b82f6";
  const trendIcon = trend > 5 ? "↗️" : trend < -5 ? "↘️" : "➡️";

  return (
    <div className="w-24 h-12 flex flex-col items-center justify-center relative group">
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Background grid */}
        <defs>
          <pattern
            id="grid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* Chart line */}
        <path
          d={pathData}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {chartData.map((point, index) => {
          const stepX = chartWidth / (chartData.length - 1);
          const x = padding + index * stepX;
          const y = padding + chartHeight - (point.y / 100) * chartHeight;

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1.5"
              fill={point.result === "win" ? "#10b981" : "#ef4444"}
              className="opacity-80"
            />
          );
        })}

        {/* Current point highlight */}
        {chartData.length > 0 && (
          <circle
            cx={padding + chartWidth}
            cy={
              padding +
              chartHeight -
              (chartData[chartData.length - 1].y / 100) * chartHeight
            }
            r="3"
            fill={lineColor}
            stroke="white"
            strokeWidth="1"
          />
        )}
      </svg>

      {/* Trend indicator */}
      <div
        className="absolute -top-1 -right-1 text-xs"
        title={`Trend: ${trend > 0 ? "+" : ""}${trend.toFixed(1)}%`}
      >
        {trendIcon}
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        <div className="font-medium">{teamName}</div>
        <div>Last {chartData.length} games</div>
        <div>Current: {chartData[chartData.length - 1]?.y.toFixed(1)}%</div>
        <div>
          Trend: {trend > 0 ? "+" : ""}
          {trend.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
