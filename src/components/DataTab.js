import React from "react";

const DataTab = ({
  dataViewLoaded,
  getDeduplicatedFilteredBets,
  handleSort,
  sortConfig,
  getSortedData,
  getStatusColor,
  formatDate,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden max-w-full">
      {!dataViewLoaded ? (
        <div className="p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h4 className="text-lg font-semibold text-white mb-2">
            Apply Filters to View Data
          </h4>
          <p className="text-gray-300">
            Use the filters above to load and view your betting data. This helps
            improve performance by only loading data when needed.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-white/20">
              <tr>
                {getDeduplicatedFilteredBets()[0] &&
                  Object.keys(getDeduplicatedFilteredBets()[0])
                    .filter(
                      (key) =>
                        ![
                          "ID",
                          "SYSTEM_RECOMMENDATION",
                          "SYSTEM_CONFIDENCE",
                          "PREDICTION_ACCURATE",
                          "RECOMMENDATION_FOLLOWED",
                          "REASON",
                        ].includes(key)
                    )
                    .map((key) => (
                      <th
                        key={key}
                        className="px-3 py-4 text-left text-white font-semibold text-sm whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => handleSort(key)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{key}</span>
                          {sortConfig.key === key && (
                            <span className="ml-2">
                              {sortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {getSortedData().map((bet, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  {Object.entries(bet)
                    .filter(
                      ([key, value]) =>
                        ![
                          "ID",
                          "SYSTEM_RECOMMENDATION",
                          "SYSTEM_CONFIDENCE",
                          "PREDICTION_ACCURATE",
                          "RECOMMENDATION_FOLLOWED",
                          "REASON",
                        ].includes(key)
                    )
                    .map(([key, value], i) => (
                      <td key={i} className="px-3 py-4 text-gray-200 text-sm">
                        {key === "RESULT" ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              value
                            )}`}
                          >
                            {value || "Unknown"}
                          </span>
                        ) : key === "DATE" ? (
                          <span className="text-blue-300 whitespace-nowrap">
                            {formatDate(value)}
                          </span>
                        ) : key.includes("ODDS") ? (
                          <span className="font-mono text-yellow-400 whitespace-nowrap">
                            {value || "-"}
                          </span>
                        ) : key === "BET_TYPE" ||
                          key === "BET_SELECTION" ||
                          key === "TEAM_BET" ? (
                          <span className="font-medium text-purple-300 whitespace-nowrap">
                            {value || "-"}
                          </span>
                        ) : (
                          <span className="whitespace-nowrap">
                            {value || "-"}
                          </span>
                        )}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DataTab;
