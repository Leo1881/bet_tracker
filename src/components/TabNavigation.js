import React from "react";

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "betAnalysis", label: "Bet Analysis" },
    { id: "recommendations", label: "Bet Recommendations" },
    { id: "query", label: "Query" },
    { id: "betSlips", label: "Bet Slips" },
    { id: "analytics", label: "Analytics" },
    { id: "performance", label: "Performance" },
    { id: "odds", label: "Odds Analytics" },
    { id: "topTeams", label: "Top Teams" },
    { id: "betTypeAnalytics", label: "Team Analytics" },
    { id: "scoringAnalysis", label: "Scoring Analysis" },
    { id: "headToHead", label: "Head to Head" },
    { id: "predictionAccuracy", label: "Prediction Accuracy" },
    { id: "recommendationAnalysis", label: "Recommendation Analysis" },
    { id: "data", label: "Data View" },
  ];

  return (
    <div className="flex space-x-1 mb-6 w-full overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-colors min-w-[120px] ${
            activeTab === tab.id
              ? "bg-[#3982db] text-white"
              : "bg-white/10 text-gray-300 hover:bg-white/20"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
