import React, { useState } from "react";

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const tabs = [
    { id: "betAnalysis", label: "Bet Analysis", icon: "📊" },
    { id: "recommendations", label: "Bet Recommendations", icon: "🎯" },
    { id: "query", label: "Query", icon: "🔍" },
    { id: "betSlips", label: "Bet Slips", icon: "📝" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "performance", label: "Performance", icon: "⚡" },
    { id: "odds", label: "Odds Analytics", icon: "💰" },
    { id: "topTeams", label: "Top Teams", icon: "🏆" },
    { id: "betTypeAnalytics", label: "Team Analytics", icon: "👥" },
    { id: "scoringAnalysis", label: "Scoring Analysis", icon: "⚽" },
    { id: "headToHead", label: "Head to Head", icon: "⚔️" },
    { id: "predictionAccuracy", label: "Prediction Accuracy", icon: "🎯" },
    { id: "recommendationAnalysis", label: "Recommendation Analysis", icon: "📋" },
    { id: "data", label: "Data View", icon: "📊" },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="mb-6 w-full">
      {/* Mobile Navigation */}
      <div className="block md:hidden">
        {/* Mobile Tab Selector */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-left flex items-center justify-between text-white hover:bg-white/20 transition-colors"
        >
          <div className="flex items-center">
            <span className="text-xl mr-3">{activeTabData?.icon}</span>
            <span className="font-semibold">{activeTabData?.label}</span>
          </div>
          <span className="text-gray-400">
            {isMobileMenuOpen ? "▲" : "▼"}
          </span>
        </button>

        {/* Mobile Tab Menu */}
        {isMobileMenuOpen && (
          <div className="mt-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 flex items-center transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#3982db] text-white"
                    : "text-gray-300 hover:bg-white/20"
                }`}
              >
                <span className="text-lg mr-3">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex space-x-1 w-full overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-3 rounded-lg font-semibold transition-colors min-w-[120px] ${
              activeTab === tab.id
                ? "bg-[#3982db] text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;
