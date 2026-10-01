# Cricket Intelligence — API Reference

This document provides a comprehensive specification of the Cricket Intelligence REST APIs.

---

## Base URLs

- **Local Development**: `http://localhost:5000`
- **Vite Proxy**: `/api/*` proxies to the server backend in development.

---

## Authentication & Headers

Protected routes require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <jwt_token>
```

---

## Health & System Status

### `GET /api/health`
Check if the server process is alive.

- **Response `200 OK`**:
```json
{
  "status": "ok",
  "timestamp": "2026-10-01T15:00:00.000Z",
  "uptime": 124.5
}
```

### `GET /api/ready`
Readiness probe verifying that MongoDB is connected and ready to accept queries.

- **Response `200 OK`**:
```json
{
  "status": "ready",
  "database": "connected"
}
```

---

## IPL Match Analytics (`/api/matches`)

### `GET /api/matches`
Retrieve IPL matches with optional season filtering and pagination.

- **Query Parameters**:
  - `season` *(optional, string)*: Filter by IPL season (e.g. `2024`, `2023`).
  - `page` *(optional, integer, default: 1)*: Page number.
  - `limit` *(optional, integer, default: 20, max: 100)*: Items per page.

- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 20,
  "pagination": {
    "totalMatches": 1024,
    "totalPages": 52,
    "currentPage": 1,
    "limit": 20
  },
  "data": [
    {
      "matchId": 1426312,
      "date": "2024-05-26",
      "season": "2024",
      "teamA": "Kolkata Knight Riders",
      "teamB": "Sunrisers Hyderabad",
      "venue": "MA Chidambaram Stadium, Chepauk, Chennai",
      "winner": "Kolkata Knight Riders"
    }
  ]
}
```

### `GET /api/matches/seasons`
Returns all distinct available IPL seasons in descending order.

- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 17,
  "data": ["2024", "2023", "2022", "...", "2008"]
}
```

### `GET /api/matches/:id`
Fetch match metadata and detailed innings scorecard.

- **URL Parameters**:
  - `id`: Match ID.

### `GET /api/matches/analytics/toss-impact`
Toss analytics showing whether choosing to bat or bowl first wins more matches. Supports `?season=YYYY`.

### `GET /api/matches/analytics/match-intensity`
Match intensity categorization (Very Close, Competitive, One Sided). Supports `?season=YYYY`.

---

## Team Analytics & Head-to-Head (`/api/teams`)

### `GET /api/teams`
Returns all distinct team names present in the historical dataset.

### `GET /api/teams/head-to-head`
Compare historical head-to-head records between two franchises.

- **Query Parameters**:
  - `teamA` *(required)*: e.g. `Chennai Super Kings`
  - `teamB` *(required)*: e.g. `Mumbai Indians`

- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "totalMatches": 36,
    "noResult": 0,
    "teamA": {
      "name": "Chennai Super Kings",
      "wins": 16,
      "winPct": 44.44,
      "tossWins": 18,
      "batFirstWins": 7,
      "bowlFirstWins": 9
    },
    "teamB": {
      "name": "Mumbai Indians",
      "wins": 20,
      "winPct": 55.56,
      "tossWins": 18,
      "batFirstWins": 11,
      "bowlFirstWins": 9
    },
    "seasonBreakdown": [
      { "season": "2024", "matches": 1, "teamAWins": 1, "teamBWins": 0 }
    ],
    "venueBreakdown": [
      { "venue": "Wankhede Stadium, Mumbai", "matches": 12, "teamAWins": 4, "teamBWins": 8 }
    ],
    "recentMatches": [
      {
        "match_id": 1426268,
        "date": "2024-04-14",
        "season": "2024",
        "venue": "Wankhede Stadium, Mumbai",
        "winner": "Chennai Super Kings",
        "winMargin": 20,
        "marginType": "runs"
      }
    ]
  }
}
```

---

## Player Analytics (`/api/players`)

### `GET /api/players/top-run-scorers`
Top run scorers leaderboard. Supports `?season=YYYY`, `?limit=N`, `?page=N`.

### `GET /api/players/top-wicket-takers`
Top wicket takers leaderboard. Supports `?season=YYYY`, `?limit=N`, `?page=N`.

### `GET /api/players/batting-analytics/:playerName`
Detailed career batting analytics including:
- `runs`: Total runs scored
- `balls`: Legal balls faced (`valid_ball = 1`, excluding wides)
- `dismissals`: Total times out
- `average`: `runs / dismissals`
- `strikeRate`: `(runs / balls) * 100`
- `dotBallPercentage`: `(dotBalls / balls) * 100`
- `phaseBreakdown`: Powerplay, Middle, Death breakdown

### `GET /api/players/bowling-stats/:playerName`
Detailed career bowling analytics including:
- `wickets`: Bowler-credited dismissals
- `balls`: Legal balls bowled
- `overs`: `Math.floor(balls / 6) + (balls % 6) / 10`
- `runsConceded`: Runs scored against bowler
- `economy`: `(runsConceded / balls) * 6`
- `average`: `runsConceded / wickets`

---

## Matchup Analytics (`/api/matchups`)

### `GET /api/matchups/:batter/:bowler`
Ball-by-ball head-to-head records between a specific batter and bowler:
- Runs scored
- Balls faced
- Dismissals
- Strike rate
- Dot balls
- Boundaries (4s and 6s)

### `GET /api/matchups/top-bowlers-for/:batter`
Top dismissers and most restrictive bowlers against the batter.

### `GET /api/matchups/dominated-by/:bowler`
Batters most frequently dismissed or dominated by the bowler.

---

## Error Handling

Standard error format:
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

Common status codes:
- `400 Bad Request`: Missing or invalid parameters.
- `401 Unauthorized`: Missing or invalid JWT token.
- `404 Not Found`: Resource does not exist.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Server exception handled by centralized error middleware.
