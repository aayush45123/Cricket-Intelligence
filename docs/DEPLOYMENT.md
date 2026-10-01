# Cricket Intelligence — Deployment Guide

This guide describes how to deploy the Cricket Intelligence platform to production environments.

---

## Architecture Overview

- **Frontend**: Single Page Application (React 19 + Vite + React Router). Deployed to Vercel, Netlify, or Cloudflare Pages.
- **Backend**: Node.js + Express API server with MongoDB connection pooling. Deployed to Render, Railway, AWS ECS/EC2, or any Linux VPS.
- **Database**: MongoDB Atlas M10+ cluster with configured replica sets and secondary reads for heavy analytical aggregation pipelines.

---

## 1. Database Setup (MongoDB Atlas)

1. **Create Atlas Cluster**:
   - Recommended tier: M10 (or higher) to handle aggregations over 278,000+ delivery documents smoothly.
2. **Network Access**:
   - Add your backend host IP or allow access from `0.0.0.0/0` (secured with strong user credentials).
3. **Database Indexes**:
   - The indexes defined in [Deliveries.js](file:///c:/Users/aayush/OneDrive/Desktop/cricket-intelligence/Cricket-Intelligence/server/src/models/Deliveries.js) are built automatically in the background on startup.
   - For pre-building via `mongosh`:
     ```js
     use cricket-intelligence;
     db.deliveries.createIndex({ batter: 1, valid_ball: 1 }, { background: true });
     db.deliveries.createIndex({ bowler: 1, valid_ball: 1 }, { background: true });
     db.deliveries.createIndex({ match_id: 1, innings: 1 }, { background: true });
     db.deliveries.createIndex({ season: 1 }, { background: true });
     db.deliveries.createIndex({ batting_team: 1, season: 1 }, { background: true });
     db.deliveries.createIndex({ bowling_team: 1, season: 1 }, { background: true });
     ```

---

## 2. Backend Deployment (Render / Railway)

### Environment Variables
Set the following environment variables in your deployment dashboard:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cricket-intelligence?retryWrites=true&w=majority
JWT_SECRET=<generate_a_64_character_random_hex_string>
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

### Build & Start Commands
- **Root Directory**: `server`
- **Build Command**: `npm install --omit=dev`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

---

## 3. Frontend Deployment (Vercel)

### Configuration
1. Import repository into Vercel.
2. Set **Root Directory**: `client`
3. Set **Framework Preset**: `Vite`
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `dist`

### Environment Variables
```env
VITE_API_BASE_URL=https://your-backend-api.onrender.com
```

### SPA Routing
Ensure [vercel.json](file:///c:/Users/aayush/OneDrive/Desktop/cricket-intelligence/Cricket-Intelligence/client/vercel.json) is included in the `client` folder to route all subpaths to `index.html`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 4. Verification Checklist

- [ ] `/api/health` returns `200 OK`
- [ ] `/api/ready` returns `status: ready` with database connected
- [ ] CORS is restricted to frontend domain in browser console
- [ ] Authentication rate limiter blocks brute force attempts after 20 attempts
- [ ] Season filter operates cleanly on `/matches` and `/head-to-head`
- [ ] Direct URL refresh on `/matches/1426312` or `/head-to-head` loads without 404
