// Data processing utility functions

export const getDeduplicatedBets = (bets) => {
  const seen = new Set();
  return bets.filter((bet) => {
    const key = `${bet.DATE}-${bet.HOME_TEAM}-${bet.AWAY_TEAM}-${bet.BET_TYPE}-${bet.BET_SELECTION}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const applyFilters = (bets, filters) => {
  let filtered = [...bets];

  if (filters.team) {
    filtered = filtered.filter(
      (bet) =>
        bet.HOME_TEAM?.toLowerCase() === filters.team.toLowerCase() ||
        bet.AWAY_TEAM?.toLowerCase() === filters.team.toLowerCase() ||
        bet.TEAM_INCLUDED?.toLowerCase() === filters.team.toLowerCase()
    );
  }

  if (filters.country) {
    filtered = filtered.filter(
      (bet) => bet.COUNTRY?.toLowerCase() === filters.country.toLowerCase()
    );
  }

  if (filters.league) {
    filtered = filtered.filter(
      (bet) => bet.LEAGUE?.toLowerCase() === filters.league.toLowerCase()
    );
  }

  if (filters.betType) {
    filtered = filtered.filter(
      (bet) => bet.BET_TYPE?.toLowerCase() === filters.betType.toLowerCase()
    );
  }

  if (filters.betSelection) {
    filtered = filtered.filter(
      (bet) =>
        bet.BET_SELECTION?.toLowerCase() === filters.betSelection.toLowerCase()
    );
  }

  if (filters.status) {
    filtered = filtered.filter(
      (bet) => bet.STATUS?.toLowerCase() === filters.status.toLowerCase()
    );
  }

  if (filters.dateFrom) {
    filtered = filtered.filter((bet) => {
      const betDate = new Date(bet.DATE);
      const fromDate = new Date(filters.dateFrom);
      return betDate >= fromDate;
    });
  }

  if (filters.dateTo) {
    filtered = filtered.filter((bet) => {
      const betDate = new Date(bet.DATE);
      const toDate = new Date(filters.dateTo);
      return betDate <= toDate;
    });
  }

  if (filters.oddsFrom) {
    filtered = filtered.filter((bet) => {
      const odds = parseFloat(bet.ODDS);
      return !isNaN(odds) && odds >= parseFloat(filters.oddsFrom);
    });
  }

  if (filters.oddsTo) {
    filtered = filtered.filter((bet) => {
      const odds = parseFloat(bet.ODDS);
      return !isNaN(odds) && odds <= parseFloat(filters.oddsTo);
    });
  }

  return filtered;
};

export const sortData = (data, sortConfig) => {
  if (!sortConfig.key) return data;

  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.key] || "";
    const bValue = b[sortConfig.key] || "";

    // Handle date sorting
    if (sortConfig.key === "DATE") {
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
    }

    // Handle numeric sorting
    if (sortConfig.key === "ODDS" || sortConfig.key === "STAKE") {
      const aNum = parseFloat(aValue) || 0;
      const bNum = parseFloat(bValue) || 0;
      return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
    }

    // Handle string sorting
    const aStr = aValue.toString().toLowerCase();
    const bStr = bValue.toString().toLowerCase();
    if (sortConfig.direction === "asc") {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });
};

export const getUniqueValues = (data, field) => {
  const values = data
    .map((item) => item[field])
    .filter((value) => value && value.trim() !== "")
    .map((value) => value.trim());
  return [...new Set(values)].sort();
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "won":
      return "text-green-400";
    case "lost":
      return "text-red-400";
    case "pending":
      return "text-yellow-400";
    case "void":
      return "text-gray-400";
    default:
      return "text-gray-300";
  }
};
