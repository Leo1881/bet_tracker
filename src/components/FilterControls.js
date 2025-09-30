import React from "react";

const FilterControls = ({
  showFilters,
  setShowFilters,
  filters,
  handleFilterChange,
  getUniqueValues,
  getBestPerformers,
  setFilters,
  setDataViewLoaded,
}) => {
  return (
    <>
      {/* Filter Controls */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 mb-8">
        <div
          className={`flex items-center justify-between ${
            showFilters ? "mb-4" : ""
          }`}
        >
          <h2 className="text-xl font-bold text-white">Filters & Analytics</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-[#3982db] hover:bg-[#2d6bb8] text-white px-4 py-2 rounded-lg transition-colors"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Team</label>
              <select
                value={filters.team}
                onChange={(e) => handleFilterChange("team", e.target.value)}
                className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
              >
                <option value="">All Teams</option>
                {getUniqueValues("TEAM_INCLUDED").map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Bet Type
              </label>
              <select
                value={filters.betType}
                onChange={(e) => handleFilterChange("betType", e.target.value)}
                className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
              >
                <option value="">All Bet Types</option>
                {getUniqueValues("BET_TYPE").map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Bet Selection
              </label>
              <select
                value={filters.betSelection}
                onChange={(e) =>
                  handleFilterChange("betSelection", e.target.value)
                }
                className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
              >
                <option value="">All Bet Selections</option>
                {getUniqueValues("BET_SELECTION").map((selection) => (
                  <option key={selection} value={selection}>
                    {selection}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Country
              </label>
              <select
                value={filters.country}
                onChange={(e) => handleFilterChange("country", e.target.value)}
                className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
              >
                <option value="">All Countries</option>
                {getUniqueValues("COUNTRY").map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">League</label>
              <select
                value={filters.league}
                onChange={(e) => handleFilterChange("league", e.target.value)}
                className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
                disabled={!filters.country}
              >
                <option value="">
                  {filters.country
                    ? "All Leagues in " + filters.country
                    : "Select Country First"}
                </option>
                {filters.country &&
                  getUniqueValues("LEAGUE", { country: filters.country }).map(
                    (league) => (
                      <option key={league} value={league}>
                        {league}
                      </option>
                    )
                  )}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Result</label>
              <select
                value={filters.result}
                onChange={(e) => handleFilterChange("result", e.target.value)}
                className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
              >
                <option value="">All Results</option>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Min Win Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.minWinRate}
                onChange={(e) =>
                  handleFilterChange("minWinRate", e.target.value)
                }
                className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Max Win Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.maxWinRate}
                onChange={(e) =>
                  handleFilterChange("maxWinRate", e.target.value)
                }
                className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-16 border border-white/20"
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Clear Filters
              </label>
              <button
                onClick={() => {
                  setFilters({
                    team: "",
                    betType: "",
                    betSelection: "",
                    country: "",
                    league: "",
                    result: "",
                    minWinRate: "",
                    maxWinRate: "",
                  });
                  setDataViewLoaded(false);
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FilterControls;
