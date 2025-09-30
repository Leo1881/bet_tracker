import React, { useState } from "react";

const DataTab = ({
  dataViewLoaded,
  getDeduplicatedFilteredBets,
  handleSort,
  sortConfig,
  getSortedData,
  getStatusColor,
  formatDate,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const betsPerPage = 100;

  // Get paginated data
  const getPaginatedData = () => {
    const allData = getSortedData();
    const startIndex = (currentPage - 1) * betsPerPage;
    const endIndex = startIndex + betsPerPage;
    return allData.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(getSortedData().length / betsPerPage);

  // Reset to page 1 when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [getSortedData]);

  // Pagination controls
  const PaginationControls = () => (
    <div className="flex justify-between items-center mt-4 px-4 py-3 bg-white/5 rounded-lg">
      <button
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
      >
        ← Previous
      </button>
      
      <div className="flex items-center space-x-4">
        <span className="text-gray-300">
          Page {currentPage} of {totalPages}
        </span>
        <span className="text-gray-400">
          ({getSortedData().length} total bets)
        </span>
      </div>
      
      <button
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
      >
        Next →
      </button>
    </div>
  );
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
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-white/20">
                <tr>
                  {getDeduplicatedFilteredBets()[0] &&
                    Object.keys(getDeduplicatedFilteredBets()[0])
                      .filter(
                        (key) =>
                          ![
                            "ID",
                            "id",
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
                {getPaginatedData().map((bet, index) => (
                  <tr
                    key={index}
                    className="hover:bg-white/5 transition-colors"
                  >
                    {Object.entries(bet)
                      .filter(
                        ([key, value]) =>
                          ![
                            "ID",
                            "id",
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
          <PaginationControls />
        </div>

        {/* Mobile Grid View */}
          <div className="block md:hidden overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-white/20">
                <tr>
                  {getDeduplicatedFilteredBets()[0] &&
                    Object.keys(getDeduplicatedFilteredBets()[0])
                      .filter(
                        (key) =>
                          ![
                            "ID",
                            "id",
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
                          className="px-2 py-3 text-left text-white font-semibold text-xs whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors"
                          onClick={() => handleSort(key)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs">
                              {key.replace(/_/g, " ")}
                            </span>
                            {sortConfig.key === key && (
                              <span className="ml-1 text-xs">
                                {sortConfig.direction === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {getPaginatedData().map((bet, index) => (
                  <tr
                    key={index}
                    className="hover:bg-white/5 transition-colors"
                  >
                    {Object.entries(bet)
                      .filter(
                        ([key, value]) =>
                          ![
                            "ID",
                            "id",
                            "SYSTEM_RECOMMENDATION",
                            "SYSTEM_CONFIDENCE",
                            "PREDICTION_ACCURATE",
                            "RECOMMENDATION_FOLLOWED",
                            "REASON",
                          ].includes(key)
                      )
                      .map(([key, value], i) => (
                        <td key={i} className="px-2 py-3 text-gray-200 text-xs">
                          {key === "RESULT" ? (
                            <span
                              className={`px-1 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                value
                              )}`}
                            >
                              {value || "Unknown"}
                            </span>
                          ) : key === "DATE" ? (
                            <span className="text-blue-300 whitespace-nowrap text-xs">
                              {formatDate(value)}
                            </span>
                          ) : key.includes("ODDS") ? (
                            <span className="font-mono text-yellow-400 whitespace-nowrap text-xs">
                              {value || "-"}
                            </span>
                          ) : key === "BET_TYPE" ||
                            key === "BET_SELECTION" ||
                            key === "TEAM_BET" ? (
                            <span className="font-medium text-purple-300 whitespace-nowrap text-xs">
                              {value || "-"}
                            </span>
                          ) : (
                            <span className="whitespace-nowrap text-xs">
                              {value || "-"}
                            </span>
                          )}
                        </td>
                      ))}
                  </tr>
                ))}
            </tbody>
          </table>
          <PaginationControls />
        </div>
        </>
      )}
    </div>
  );
};

export default DataTab;
