# Cricket Intelligence — Environment Variables Reference

This document outlines all environment variables required by the frontend and backend services.

---

## Server Environment Variables (`server/.env`)

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `PORT` | No | `5000` | Port on which Express server listens | `5000` |
| `NODE_ENV` | No | `development` | Application mode (`development` or `production`) | `production` |
| `MONGO_URI` | **Yes** | — | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/cricket-intelligence` |
| `JWT_SECRET` | **Yes** | — | Secret key used to sign and verify JSON Web Tokens | `d3f0a8274...` |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173,...` | Comma-separated list of CORS origins allowed to access the API | `https://cricket-intelligence.vercel.app` |

### Security Recommendations
- **Rotate Secrets Regularly**: Never commit real database passwords or JWT secrets to Git history.
- **Strong JWT Secret**: Generate cryptographically secure keys (e.g. `openssl rand -hex 32`).
- **Restrict Origins**: In production, set `ALLOWED_ORIGINS` strictly to your production frontend domain to prevent unauthorized cross-origin requests.

---

## Client Environment Variables (`client/.env`)

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `VITE_API_BASE_URL` | No | `""` (relies on Vite proxy) | Base URL for Express backend in production | `https://api.cricket-intelligence.com` |
