/**
 * Normalize / match team names so blacklist and form checks agree
 * (e.g. "Man Utd" ↔ "Manchester United").
 */

const TEAM_ALIASES = {
  "man utd": "manchester united",
  "man united": "manchester united",
  "manchester utd": "manchester united",
  "man city": "manchester city",
  "manchester city fc": "manchester city",
  "spurs": "tottenham hotspur",
  "tottenham": "tottenham hotspur",
  "wolves": "wolverhampton wanderers",
  "newcastle": "newcastle united",
  "nottingham forest": "nottingham forest",
  "nottm forest": "nottingham forest",
  "hearts": "heart of midlothian",
  "hibs": "hibernian",
  "psg": "paris saint germain",
  "paris sg": "paris saint germain",
  "inter": "inter milan",
  "internazionale": "inter milan",
};

export function normalizeTeamName(name) {
  if (name == null) return "";
  let n = String(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b(fc|cf|sc|afc)\b\.?/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (TEAM_ALIASES[n]) return TEAM_ALIASES[n];
  return n;
}

/** True if two team labels refer to the same club (aliases + contains). */
export function teamsMatch(a, b) {
  if (!a || !b) return false;
  const x = normalizeTeamName(a);
  const y = normalizeTeamName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  return false;
}

/**
 * @param {string} teamName
 * @param {Array<string|{TEAM_NAME?: string, team_name?: string}>} blacklistedTeams
 */
export function isTeamNameBlacklisted(teamName, blacklistedTeams) {
  if (!teamName || !blacklistedTeams?.length) return false;
  return blacklistedTeams.some((entry) => {
    const listed =
      typeof entry === "string"
        ? entry
        : entry?.TEAM_NAME || entry?.team_name || "";
    return teamsMatch(teamName, listed);
  });
}
