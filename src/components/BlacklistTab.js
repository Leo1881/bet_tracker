import React from "react";

const BlacklistTab = ({
  handleBlacklistSort,
  blacklistSortConfig,
  blacklistedTeams,
  getSortedBlacklistData,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">Blacklisted Teams</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/20">
            <tr>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleBlacklistSort("COUNTRY")}
              >
                <div className="flex items-center justify-between">
                  <span>Country</span>
                  {blacklistSortConfig.key === "COUNTRY" && (
                    <span className="ml-2">
                      {blacklistSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleBlacklistSort("LEAGUE")}
              >
                <div className="flex items-center justify-between">
                  <span>League</span>
                  {blacklistSortConfig.key === "league" && (
                    <span className="ml-2">
                      {blacklistSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleBlacklistSort("TEAM_NAME")}
              >
                <div className="flex items-center justify-between">
                  <span>Team Name</span>
                  {blacklistSortConfig.key === "TEAM_NAME" && (
                    <span className="ml-2">
                      {blacklistSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {blacklistedTeams.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center">
                  <p className="text-gray-300 text-lg">
                    No blacklisted teams found
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Add teams to Sheet2 in your Google Sheets to see them here
                  </p>
                </td>
              </tr>
            ) : (
              getSortedBlacklistData().map((team, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-2 text-gray-200 font-medium capitalize">
                    {team.COUNTRY}
                  </td>
                  <td className="px-4 py-2 text-gray-200 font-medium capitalize">
                    {team.LEAGUE}
                  </td>
                  <td className="px-4 py-2 text-gray-200 font-medium capitalize">
                    {team.TEAM_NAME}
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      🚫 Blacklisted
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-gray-400 text-sm">
        <p>Total blacklisted teams: {blacklistedTeams.length}</p>
      </div>
    </div>
  );
};

export default BlacklistTab;
