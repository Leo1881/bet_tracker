import React from "react";

const TeamNotesTab = ({
  handleTeamNotesSort,
  teamNotesSortConfig,
  getSortedTeamNotesData,
  teamNotes,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">Team Notes</h3>

      {/* Team Notes Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/20">
            <tr>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                onClick={() => handleTeamNotesSort("COUNTRY")}
              >
                <div className="flex items-center">
                  Country
                  {teamNotesSortConfig.key === "COUNTRY" && (
                    <span className="ml-1">
                      {teamNotesSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                onClick={() => handleTeamNotesSort("LEAGUE")}
              >
                <div className="flex items-center">
                  League
                  {teamNotesSortConfig.key === "LEAGUE" && (
                    <span className="ml-1">
                      {teamNotesSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                onClick={() => handleTeamNotesSort("TEAM_NAME")}
              >
                <div className="flex items-center">
                  Team Name
                  {teamNotesSortConfig.key === "TEAM_NAME" && (
                    <span className="ml-1">
                      {teamNotesSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-4 py-2 text-left text-white font-semibold">
                Note
              </th>
              <th
                className="px-4 py-2 text-left text-white font-semibold cursor-pointer hover:bg-white/10"
                onClick={() => handleTeamNotesSort("DATE_ADDED")}
              >
                <div className="flex items-center">
                  Date Added
                  {teamNotesSortConfig.key === "DATE_ADDED" && (
                    <span className="ml-1">
                      {teamNotesSortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {getSortedTeamNotesData().map((note, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-white/5" : "bg-white/10"}`}
              >
                <td className="px-4 py-4 text-gray-300">{note.COUNTRY}</td>
                <td className="px-4 py-4 text-gray-300">{note.LEAGUE}</td>
                <td className="px-4 py-4 text-purple-300 font-medium">
                  {note.TEAM_NAME}
                </td>
                <td className="px-4 py-4 text-orange-300">{note.NOTE}</td>
                <td className="px-4 py-4 text-gray-400 text-sm">
                  {note.DATE_ADDED}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {teamNotes.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-4">
            📝 No Team Notes Found
          </div>
          <p className="text-gray-500">
            Add team notes to Sheet4 in your Google Spreadsheet to see them
            here.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamNotesTab;
