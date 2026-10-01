# 🏏 Cricket Intelligence — Production Audit

**Date:** 2026-10-01  
**Codebase:** ~280+ commits, MERN stack

---

## 1. Architecture Summary

- **Frontend:** React 19 + Vite 8 beta + React Router 7 + Recharts 3 + Vanilla CSS
- **Backend:** Node.js + Express 5 (ESM) + Mongoose 9
- **Database:** MongoDB Atlas — collections: deliveries(278K+), matches, userdeliveries, users, tournaments
- **Auth:** JWT Bearer (localStorage) + bcrypt(12)
- **Deployment:** Vercel (frontend) + Render (backend) + MongoDB Atlas

**Backend route inventory (10 files, ~47 endpoints):**
/api/matches → iplMatchRoutes + matchRoutes  
/api/players → playerRoutes  
/api/venues → venueRoutes  
/api/matchups → matchupRoutes  
/api/strategy → teamStrategyRoutes  
/api/search → searchRoutes  
/api/auth → authRoutes  
/api/live → liveMatchRoutes  
/api/tournaments → tournamentRoutes  

---

## 2. Feature Status

| Feature | Status | Notes |
|---|---|---|
| JWT Auth | ✅ Working | Token in localStorage (XSS risk) |
| IPL Match listing | ✅ Working | |
| Match scorecard | ✅ Working | |
| Match deep analytics | ✅ Working | |
| Player listing | ✅ Working | |
| Batting stats | ⚠️ Bug | Avg formula wrong, balls-faced wrong |
| Bowling stats | ✅ Working | |
| Player detail | ✅ Working | |
| Batter vs bowler | ✅ Working | |
| Player comparison | ✅ Working | |
| Venue analytics | ✅ Working | |
| Team strategy | ✅ Working | |
| Team leaderboard | ✅ Working | |
| Global search | ✅ Working | |
| Live match engine | ✅ Working | |
| Tournament system | ✅ Working | |
| Season filter | ❌ Missing | |
| Team head-to-head | ❌ Missing | |
| Pagination | ❌ Missing | |
| Dark/light theme | ❌ Missing | |
| PDF/CSV export | ❌ Missing | |
| Health endpoints | ❌ Missing | |
| Rate limiting | ❌ Missing | |
| Helmet headers | ❌ Missing | |
| CORS restricted | ❌ Missing | |
| .env.example | ❌ Missing | |
| Error handler | ❌ Missing | |
| Test suite | ❌ Missing | |

---

## 3. Critical Bugs

### BUG-001: Batting average formula incorrect
File: server/src/controllers/playerAnalytics.js

battingAverage = totalRuns / row.innings  
row.innings = { sum: 1 } = total deliveries, NOT innings played  
Fix: compute dismissals separately, use totalRuns / dismissals

### BUG-002: Balls-faced counts wides as valid balls
File: playerAnalytics.js — getBattingStats, getPlayerFullStats  
{ sum: 1 } counts all deliveries. Should filter valid_ball === 1.

### BUG-003: Real credentials committed to .env
File: server/.env  
MongoDB Atlas URI with password and weak JWT secret committed.  
ACTION: Rotate credentials, add to .gitignore, create .env.example

### BUG-004: cors() accepts all origins
File: server/src/server.js line 25  
app.use(cors()) — no origin restriction. Must restrict in production.

### BUG-005: Route conflict in matchupRoutes
/top/:batter and /dominated/:bowler registered AFTER /:batter/:bowler  
Express matches /:batter/:bowler first — top/dominated unreachable.

### BUG-006: DB connects after server starts
connectDB() called inside app.listen callback.  
First requests may hit unconnected DB. Connect first, then listen.

### BUG-007: Both iplMatchRoutes and matchRoutes on /api/matches
Potential route shadowing. matchRoutes serves user Match model CRUD.

---

## 4. Security Risks

- Real MongoDB URI + credentials in committed .env (CRITICAL)
- Weak/predictable JWT secret in .env (CRITICAL)  
- CORS wildcard (HIGH)
- JWT in localStorage, XSS-accessible (HIGH)
- No Helmet security headers (HIGH)
- No rate limiting on auth (HIGH)
- Stack traces leaked in error responses (MEDIUM)
- No input validation middleware (MEDIUM)

---

## 5. Analytics Bugs

| Metric | Bug |
|---|---|
| Batting average | runs / deliveries instead of runs / dismissals |
| Balls faced | Counts wides; should filter valid_ball = 1 |
| Strike rate | Understated due to wrong balls denominator |
| Dot ball % batting | Counts wides as dot balls |

---

## 6. Performance Issues

- No early  filter in getBattingStats/getBowlingStats → full scan
- getAllPlayers: 4 parallel distinct() calls
- teamLeaderboard: loads all matches then sorts in memory
- getAllMatches: no pagination, returns all matches
- No compound indexes for season/team/venue filter queries
- connectDB() race condition on startup

## Missing Indexes
- { batting_team: 1 }
- { bowling_team: 1 }
- { venue: 1 }
- { season: 1 }
- { match_id: 1, innings: 1 } compound
- { batter: 1, season: 1 } compound
- { bowler: 1, season: 1 } compound

---

## 7. Recommended Implementation Sequence

Phase 1 — Stabilization (critical fixes)
Phase 2 — Season filter + H2H + pagination  
Phase 3 — Production hardening (security, indexes, health endpoints)  
Phase 4 — UX (theme toggle, responsive, components)  
Phase 5 — Advanced analytics (CSV export, season comparison)  
Phase 6 — Predictive features (ML win probability)
