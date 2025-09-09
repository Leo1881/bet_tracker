import React from "react";

const QueryTab = ({
  queryFilters,
  updateQueryFilter,
  addQueryFilter,
  removeQueryFilter,
  clearQuery,
  executeQuery,
  isQuerying,
  queryResults,
  getAvailableFields,
  getFieldValues,
  getAvailableMetrics,
  getAvailableOperators,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        🔍 Advanced Query Filter
      </h3>
      <div className="text-gray-300 mb-6">
        <p>
          Build custom queries to find teams that match specific criteria. Get
          clean, deduplicated results instead of raw data rows.
        </p>
      </div>

      {/* Query Filters */}
      <div className="space-y-4 mb-6">
        {queryFilters.map((filter, index) => (
          <div
            key={index}
            className="bg-white/5 rounded-lg p-4 border border-white/10"
          >
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-white text-sm font-medium">Field:</label>
                <select
                  value={filter.field}
                  onChange={(e) =>
                    updateQueryFilter(index, "field", e.target.value)
                  }
                  className="bg-white/20 border border-white/30 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Field</option>
                  {getAvailableFields().map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-white text-sm font-medium">Value:</label>
                <select
                  value={filter.value}
                  onChange={(e) =>
                    updateQueryFilter(index, "value", e.target.value)
                  }
                  className="bg-white/20 border border-white/30 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!filter.field}
                >
                  <option value="">Select Value</option>
                  {filter.field &&
                    getFieldValues(filter.field).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-white text-sm font-medium">
                  Metric:
                </label>
                <select
                  value={filter.metric}
                  onChange={(e) =>
                    updateQueryFilter(index, "metric", e.target.value)
                  }
                  className="bg-white/20 border border-white/30 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Metric (Optional)</option>
                  {getAvailableMetrics().map((metric) => (
                    <option key={metric.value} value={metric.value}>
                      {metric.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-white text-sm font-medium">
                  Operator:
                </label>
                <select
                  value={filter.operator}
                  onChange={(e) =>
                    updateQueryFilter(index, "operator", e.target.value)
                  }
                  className="bg-white/20 border border-white/30 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!filter.metric}
                >
                  <option value="">Select Operator</option>
                  {filter.metric &&
                    getAvailableOperators().map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-white text-sm font-medium">Value:</label>
                <input
                  type="text"
                  value={filter.metricValue}
                  onChange={(e) =>
                    updateQueryFilter(index, "metricValue", e.target.value)
                  }
                  className="bg-white/20 border border-white/30 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
                  placeholder="0"
                  disabled={!filter.operator}
                />
              </div>

              {queryFilters.length > 1 && (
                <button
                  onClick={() => removeQueryFilter(index)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button
            onClick={addQueryFilter}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add Another Filter
          </button>
          <button
            onClick={clearQuery}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={executeQuery}
            disabled={isQuerying}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isQuerying ? "Running Query..." : "Run Query"}
          </button>
        </div>
      </div>

      {/* Query Results */}
      {queryResults.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h4 className="text-white font-semibold mb-3">
            Results ({queryResults.length} teams found):
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {queryResults.map((teamData, index) => (
              <div key={index} className="bg-white/10 rounded p-3 text-white">
                <div className="font-medium text-blue-300">{teamData.team}</div>
                <div className="text-sm text-gray-300">
                  {teamData.country} • {teamData.league}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Example Queries */}
      <div className="mt-6 bg-white/5 rounded-lg p-4 border border-white/10">
        <h4 className="text-white font-semibold mb-3">Example Queries:</h4>
        <div className="text-gray-300 text-sm space-y-2">
          <p>
            <strong>
              Teams with 0 Double Chance losses AND played home games:
            </strong>
            <br />
            Filter 1: Field: "Bet Type" → Value: "Double Chance" → Metric:
            "Losses" → Operator: "Equals" → Value: "0"
            <br />
            Filter 2: Field: "HOME_TEAM" → Value: [any team name]
          </p>
          <p>
            <strong>Teams with &gt;80% win rate in Premier League:</strong>
            <br />
            Filter 1: Field: "Team Included" → Value: [any team] → Metric: "Win
            Rate" → Operator: "Greater Than" → Value: "80"
            <br />
            Filter 2: Field: "League" → Value: "Premier League"
          </p>
          <p>
            <strong>Teams that won with odds &gt;2.0:</strong>
            <br />
            Filter 1: Field: "Result" → Value: "win"
            <br />
            Filter 2: Field: "ODDS1" → Value: [any odds] → Metric: "Greater
            Than" → Value: "2.0"
          </p>
          <p>
            <strong>Teams in top 5 league position:</strong>
            <br />
            Filter 1: Field: "HOME_TEAM_POSITION_NUMBER" → Value: [any position]
            → Metric: "Less Than" → Value: "6"
          </p>
        </div>
      </div>
    </div>
  );
};

export default QueryTab;
