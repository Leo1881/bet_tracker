#!/usr/bin/env python3
"""
Enrich fixtures with SofaScore missing-player / injury info (local test).

Input (stdin JSON):
  { "games": [ { "home_team", "away_team", "date", "match?", "country?", "league?" } ] }

Output (stdout JSON):
  { "results": [ ... ], "count": N }
"""

from __future__ import annotations

import asyncio
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sofascore_wrapper.api import SofascoreAPI
from sofascore_wrapper.search import Search

MONTHS = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
}

TEAM_ALIASES = {
    "man utd": "manchester united",
    "man united": "manchester united",
    "manchester utd": "manchester united",
    "man city": "manchester city",
    "spurs": "tottenham hotspur",
    "tottenham": "tottenham hotspur",
    "wolves": "wolverhampton wanderers",
    "psg": "paris saint germain",
    "inter": "inter milan",
}


def fold_accents(s: str) -> str:
    """Genclerbirligi ↔ Gençlerbirliği, Fenerbahce ↔ Fenerbahçe."""
    nk = unicodedata.normalize("NFKD", s or "")
    return "".join(ch for ch in nk if not unicodedata.combining(ch))


def norm_team(name: str) -> str:
    n = fold_accents(name or "").lower().strip()
    n = re.sub(r"\b(fc|cf|sc|afc|sk|fk|jk)\b\.?", "", n)
    n = re.sub(r"[^a-z0-9\s]", " ", n)
    n = re.sub(r"\s+", " ", n).strip()
    return TEAM_ALIASES.get(n, n)


def teams_match(a: str, b: str) -> bool:
    x, y = norm_team(a), norm_team(b)
    if not x or not y:
        return False
    if x == y:
        return True
    return x in y or y in x


def parse_date(raw: Any) -> Optional[str]:
    if raw is None or raw == "":
        return None
    s = str(raw).strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}", s):
        return s[:10]
    m = re.match(r"^(\d{1,2})-([A-Za-z]{3})$", s)
    if m:
        day = int(m.group(1))
        mon = MONTHS.get(m.group(2).lower()[:3])
        if mon:
            year = datetime.now().year
            return f"{year:04d}-{mon:02d}-{day:02d}"
    try:
        d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return d.date().isoformat()
    except Exception:
        return None


def split_match(game: Dict[str, Any]) -> Tuple[str, str]:
    home = game.get("home_team") or game.get("HOME_TEAM") or ""
    away = game.get("away_team") or game.get("AWAY_TEAM") or ""
    if home and away:
        return str(home), str(away)
    match = game.get("match") or ""
    parts = re.split(r"\s+vs\.?\s+", match, flags=re.I)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    return home, away


def simplify_missing(entries: Any) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    if not entries:
        return out
    for item in entries:
        if not isinstance(item, dict):
            continue
        player = item.get("player") or {}
        name = (
            player.get("name")
            or player.get("shortName")
            or item.get("name")
            or "Unknown"
        )
        typ = item.get("type") or item.get("status") or "missing"
        desc = item.get("description")
        out.append(
            {
                "name": name,
                "type": str(typ),
                "reason": item.get("reason"),
                "description": desc,
                "position": player.get("position"),
            }
        )
    return out


async def search_team_id(api: SofascoreAPI, team_name: str) -> Optional[int]:
    search = Search(api, team_name)
    data = await search.search_all(sport="football")
    results = (data or {}).get("results") or []
    best_id = None
    best_score = -1
    for row in results:
        if row.get("type") != "team" and (row.get("entity") or {}).get("sport", {}).get(
            "slug"
        ) not in (None, "football"):
            # search_all mixes types; prefer entity with sport football
            pass
        ent = row.get("entity") or {}
        sport = (ent.get("sport") or {}).get("slug") or ""
        # team rows often have type "team" at top level
        row_type = row.get("type")
        if row_type and row_type != "team":
            continue
        if sport and sport != "football":
            continue
        name = ent.get("name") or ""
        if not teams_match(team_name, name):
            continue
        score = 3 if norm_team(name) == norm_team(team_name) else 1
        if score > best_score and ent.get("id"):
            best_score = score
            best_id = int(ent["id"])
    return best_id


async def team_events(api: SofascoreAPI, team_id: int) -> List[Dict[str, Any]]:
    events: List[Dict[str, Any]] = []
    for path in (
        f"/team/{team_id}/events/next/0",
        f"/team/{team_id}/events/last/0",
    ):
        try:
            data = await api._get(path)
            events.extend((data or {}).get("events") or [])
        except Exception:
            continue
    return events


def event_date_iso(ev: Dict[str, Any]) -> Optional[str]:
    ts = ev.get("startTimestamp")
    if not ts:
        return None
    try:
        return datetime.fromtimestamp(int(ts), tz=timezone.utc).date().isoformat()
    except Exception:
        return None


def pick_event(
    events: List[Dict[str, Any]],
    home: str,
    away: str,
    date_iso: Optional[str],
) -> Optional[Dict[str, Any]]:
    candidates = []
    today = datetime.now(timezone.utc).date()
    for ev in events:
        h = (ev.get("homeTeam") or {}).get("name") or ""
        a = (ev.get("awayTeam") or {}).get("name") or ""
        ok = (teams_match(home, h) and teams_match(away, a)) or (
            teams_match(home, a) and teams_match(away, h)
        )
        if not ok:
            continue
        ed = event_date_iso(ev)
        # Team pair match alone is enough; date only boosts ranking.
        score = 10
        if date_iso and ed == date_iso:
            score += 20
        elif date_iso and ed:
            try:
                d0 = datetime.fromisoformat(date_iso).date()
                d1 = datetime.fromisoformat(ed).date()
                delta = abs((d1 - d0).days)
                # Wider window: sheet dates are often approximate / wrong year
                if delta <= 14:
                    score += max(0, 14 - delta)
            except Exception:
                pass
        if ed:
            try:
                d1 = datetime.fromisoformat(ed).date()
                # Prefer upcoming / nearer fixtures when date is weak
                days_from_today = (d1 - today).days
                if 0 <= days_from_today <= 60:
                    score += 5
                score -= min(abs(days_from_today), 40) * 0.01
            except Exception:
                pass
        candidates.append((score, ev))
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]


async def fetch_lineups_safe(api: SofascoreAPI, event_id: int) -> Dict[str, Any]:
    """Raw lineups — wrapper crashes when formation is null on upcoming games."""
    data = await api._get(f"/event/{event_id}/lineups")
    home = (data or {}).get("home") or {}
    away = (data or {}).get("away") or {}
    return {
        "confirmed": (data or {}).get("confirmed"),
        "homeMissing": simplify_missing(home.get("missingPlayers")),
        "awayMissing": simplify_missing(away.get("missingPlayers")),
    }


# Streak names we care about for betting (case-insensitive substring match)
STREAK_PRIORITY = [
    ("both teams scoring", "BTTS"),
    ("both teams to score", "BTTS"),
    ("more than 2.5", "O2.5"),
    ("over 2.5", "O2.5"),
    ("less than 2.5", "U2.5"),
    ("under 2.5", "U2.5"),
    ("no losses", "Unbeaten"),
    ("wins", "Wins"),
    ("without clean sheet", "No CS"),
]


def pick_key_streaks(general: List[Any], h2h_streaks: List[Any], limit: int = 6) -> List[Dict[str, Any]]:
    """Filter SofaScore streaks down to BTTS / O-U / unbeaten-style lines."""
    pooled = []
    for src, rows in (("general", general or []), ("h2h", h2h_streaks or [])):
        for row in rows:
            if not isinstance(row, dict):
                continue
            name = str(row.get("name") or "")
            low = name.lower()
            short = None
            for needle, label in STREAK_PRIORITY:
                if needle in low:
                    short = label
                    break
            if not short:
                continue
            pooled.append(
                {
                    "name": name,
                    "short": short,
                    "value": row.get("value"),
                    "team": row.get("team"),
                    "source": src,
                }
            )
    # Prefer unique short labels; keep first of each short+team
    seen = set()
    out = []
    for row in pooled:
        key = (row["short"], row.get("team"), row.get("source"))
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
        if len(out) >= limit:
            break
    return out


def form_letter_from_event(ev: Dict[str, Any], team_id: int) -> Optional[str]:
    """W/D/L for team_id in a finished event."""
    status = ((ev.get("status") or {}).get("type") or "").lower()
    if status and status not in ("finished", "ended"):
        # Softascore often uses type finished
        if status not in ("finished",):
            pass
    winner = ev.get("winnerCode")  # 1 home, 2 away, 3 draw
    home_id = (ev.get("homeTeam") or {}).get("id")
    away_id = (ev.get("awayTeam") or {}).get("id")
    if winner == 3:
        return "D"
    if winner == 1:
        if home_id == team_id:
            return "W"
        if away_id == team_id:
            return "L"
    if winner == 2:
        if away_id == team_id:
            return "W"
        if home_id == team_id:
            return "L"
    # Fallback from scores
    hs = (ev.get("homeScore") or {}).get("current")
    aws = (ev.get("awayScore") or {}).get("current")
    if hs is None or aws is None:
        return None
    try:
        hs_i, aw_i = int(hs), int(aws)
    except Exception:
        return None
    if hs_i == aw_i:
        return "D"
    home_won = hs_i > aw_i
    if home_id == team_id:
        return "W" if home_won else "L"
    if away_id == team_id:
        return "W" if not home_won else "L"
    return None


async def form_from_last_fixtures(
    api: SofascoreAPI, team_id: int, limit: int = 5
) -> Dict[str, Any]:
    letters: List[str] = []
    try:
        data = await api._get(f"/team/{team_id}/events/last/0")
    except Exception as e:
        return {"form": [], "source": "last_fixtures", "error": str(e)}
    for ev in (data or {}).get("events") or []:
        status = ((ev.get("status") or {}).get("type") or "").lower()
        if status and status not in ("finished", "ended"):
            continue
        letter = form_letter_from_event(ev, team_id)
        if letter:
            letters.append(letter)
        if len(letters) >= limit:
            break
    return {"form": letters, "source": "last_fixtures"}


async def fetch_form_and_streaks(
    api: SofascoreAPI,
    event_id: int,
    home_team_id: Optional[int],
    away_team_id: Optional[int],
) -> Dict[str, Any]:
    out: Dict[str, Any] = {
        "homeForm": None,
        "awayForm": None,
        "formSource": None,
        "formSummary": "",
        "keyStreaks": [],
        "streaksSummary": "",
        "h2hStreaks": [],
        "generalStreaks": [],
    }

    # Streaks (same endpoint we already use)
    try:
        streaks = await api._get(f"/event/{event_id}/team-streaks")
        general = (streaks or {}).get("general") or []
        h2h_streaks = (streaks or {}).get("head2head") or []
        out["generalStreaks"] = [
            {"name": r.get("name"), "value": r.get("value"), "team": r.get("team")}
            for r in general
            if isinstance(r, dict)
        ][:10]
        out["h2hStreaks"] = [
            {"name": r.get("name"), "value": r.get("value"), "team": r.get("team")}
            for r in h2h_streaks
            if isinstance(r, dict)
        ][:10]
        out["keyStreaks"] = pick_key_streaks(general, h2h_streaks)
        bits = []
        for s in out["keyStreaks"][:5]:
            side = s.get("team") or ""
            bits.append(f"{s['short']} {s.get('value')} ({side})" if side else f"{s['short']} {s.get('value')}")
        out["streaksSummary"] = " · ".join(bits)
    except Exception as e:
        out["streaksError"] = str(e)

    # Official pregame form when available
    try:
        pf = await api._get(f"/event/{event_id}/pregame-form")
        home = (pf or {}).get("homeTeam") or {}
        away = (pf or {}).get("awayTeam") or {}
        out["homeForm"] = {
            "form": home.get("form") or [],
            "position": home.get("position"),
            "points": home.get("value"),
            "avgRating": home.get("avgRating"),
            "source": "pregame-form",
        }
        out["awayForm"] = {
            "form": away.get("form") or [],
            "position": away.get("position"),
            "points": away.get("value"),
            "avgRating": away.get("avgRating"),
            "source": "pregame-form",
        }
        out["formSource"] = "pregame-form"
    except Exception:
        # Fallback: last fixtures W/D/L
        if home_team_id:
            await asyncio.sleep(0.2)
            out["homeForm"] = await form_from_last_fixtures(api, home_team_id)
        if away_team_id:
            await asyncio.sleep(0.2)
            out["awayForm"] = await form_from_last_fixtures(api, away_team_id)
        out["formSource"] = "last_fixtures"

    def fmt_side(label: str, block: Optional[Dict[str, Any]]) -> str:
        if not block:
            return f"{label} ?"
        seq = "".join(block.get("form") or []) or "?"
        return f"{label} {seq}"

    out["formSummary"] = " · ".join(
        [fmt_side("Home", out.get("homeForm")), fmt_side("Away", out.get("awayForm"))]
    )
    return out


async def fetch_h2h_safe(api: SofascoreAPI, event_id: int) -> Dict[str, Any]:
    """Team H2H record only (streaks pulled with form pack)."""
    out: Dict[str, Any] = {
        "h2h": None,
        "h2hSummary": "",
    }
    try:
        data = await api._get(f"/event/{event_id}/h2h")
        duel = (data or {}).get("teamDuel") or {}
        hw = int(duel.get("homeWins") or 0)
        aw = int(duel.get("awayWins") or 0)
        dr = int(duel.get("draws") or 0)
        out["h2h"] = {"homeWins": hw, "awayWins": aw, "draws": dr, "total": hw + aw + dr}
        out["h2hSummary"] = f"H2H {hw}-{dr}-{aw} (home-draw-away)"
    except Exception as e:
        out["h2hError"] = str(e)
    return out


async def enrich_game(api: SofascoreAPI, game: Dict[str, Any]) -> Dict[str, Any]:
    home, away = split_match(game)
    date_iso = parse_date(game.get("date") or game.get("DATE"))
    match_label = game.get("match") or f"{home} vs {away}"
    base: Dict[str, Any] = {
        "match": match_label,
        "home_team": home,
        "away_team": away,
        "date": date_iso,
        "matched": False,
        "eventId": None,
        "homeMissing": [],
        "awayMissing": [],
        "lineupsConfirmed": None,
        "h2h": None,
        "h2hStreaks": [],
        "h2hSummary": "",
        "homeForm": None,
        "awayForm": None,
        "formSummary": "",
        "formSource": None,
        "keyStreaks": [],
        "streaksSummary": "",
        "summary": "",
        "error": None,
    }
    if not home or not away:
        base["error"] = "Missing home/away team"
        return base

    try:
        home_id = await search_team_id(api, home)
        await asyncio.sleep(0.35)
        away_id = await search_team_id(api, away)
        if not home_id and not away_id:
            base["error"] = "Could not find teams on SofaScore"
            return base

        events: List[Dict[str, Any]] = []
        if home_id:
            events.extend(await team_events(api, home_id))
            await asyncio.sleep(0.35)
        if away_id and not events:
            events.extend(await team_events(api, away_id))

        ev = pick_event(events, home, away, date_iso)
        if not ev:
            base["error"] = "No SofaScore fixture found for these teams (check date)"
            return base

        event_id = ev.get("id")
        base["eventId"] = event_id
        base["matched"] = True
        base["sofaHome"] = (ev.get("homeTeam") or {}).get("name")
        base["sofaAway"] = (ev.get("awayTeam") or {}).get("name")
        base["sofaHomeId"] = (ev.get("homeTeam") or {}).get("id") or home_id
        base["sofaAwayId"] = (ev.get("awayTeam") or {}).get("id") or away_id
        base["sofaDate"] = event_date_iso(ev)
        base["tournament"] = (ev.get("tournament") or {}).get("name")

        await asyncio.sleep(0.25)
        h2h_pack = await fetch_h2h_safe(api, int(event_id))
        base["h2h"] = h2h_pack.get("h2h")
        base["h2hSummary"] = h2h_pack.get("h2hSummary") or ""
        if h2h_pack.get("h2hError") and not base["h2h"]:
            base["h2hError"] = h2h_pack["h2hError"]

        await asyncio.sleep(0.25)
        form_pack = await fetch_form_and_streaks(
            api,
            int(event_id),
            base.get("sofaHomeId"),
            base.get("sofaAwayId"),
        )
        base["homeForm"] = form_pack.get("homeForm")
        base["awayForm"] = form_pack.get("awayForm")
        base["formSummary"] = form_pack.get("formSummary") or ""
        base["formSource"] = form_pack.get("formSource")
        base["keyStreaks"] = form_pack.get("keyStreaks") or []
        base["streaksSummary"] = form_pack.get("streaksSummary") or ""
        base["h2hStreaks"] = form_pack.get("h2hStreaks") or []
        base["generalStreaks"] = form_pack.get("generalStreaks") or []

        try:
            await asyncio.sleep(0.25)
            lu = await fetch_lineups_safe(api, int(event_id))
            home_miss = lu.get("homeMissing") or []
            away_miss = lu.get("awayMissing") or []
            base["homeMissing"] = home_miss
            base["awayMissing"] = away_miss
            base["lineupsConfirmed"] = lu.get("confirmed")
        except Exception as e:
            base["lineupError"] = str(e)
            home_miss, away_miss = [], []

        def fmt_miss(side: str, items: List[Dict[str, Any]]) -> str:
            if not items:
                return f"{side} 0"
            names = []
            for p in items[:4]:
                bit = p["name"]
                if p.get("description"):
                    bit += f" ({p['description']})"
                elif p.get("type"):
                    bit += f" ({p['type']})"
                names.append(bit)
            more = f" +{len(items) - 4}" if len(items) > 4 else ""
            return f"{side} {len(items)}: {', '.join(names)}{more}"

        parts = []
        if base.get("h2hSummary"):
            parts.append(base["h2hSummary"])
        if base.get("formSummary"):
            parts.append(f"Form {base['formSummary']}")
        if base.get("streaksSummary"):
            parts.append(f"Streaks {base['streaksSummary']}")
        if home_miss or away_miss:
            parts.append(" · ".join([fmt_miss("Home", home_miss), fmt_miss("Away", away_miss)]))
        elif not base.get("lineupError"):
            parts.append("No missing players listed")
        elif base.get("lineupError"):
            parts.append("Lineups not published yet")

        base["summary"] = " · ".join(parts)
        return base
    except Exception as e:
        base["error"] = str(e)
        return base


async def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON stdin: {e}"}))
        return 1

    games = payload.get("games") or []
    if not isinstance(games, list) or len(games) == 0:
        print(json.dumps({"error": "Need games: []", "results": []}))
        return 1

    max_games = int(payload.get("max_games") or 12)
    games = games[:max_games]

    api = SofascoreAPI()
    results: List[Dict[str, Any]] = []
    try:
        for i, game in enumerate(games):
            results.append(await enrich_game(api, game))
            if i < len(games) - 1:
                await asyncio.sleep(0.5)
    finally:
        await api.close()

    print(json.dumps({"results": results, "count": len(results)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
