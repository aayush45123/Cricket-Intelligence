import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";

import iplMatchRoutes from "./routes/iplMatchRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import matchupRoutes from "./routes/matchupRoutes.js";
import teamStrategyRoutes from "./routes/teamStrategyRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import liveMatchRoutes from "./routes/liveMatchRoutes.js";
import compareRoutes from "./routes/compareRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

/* ── Security middleware ──────────────────────────────────── */
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  }),
);

/* Rate limiting — 300 requests per 15 min per IP */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});
app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));

/* ── Health ───────────────────────────────────────────────── */
app.get("/", (_req, res) => res.json({ status: "Cricket Intelligence API" }));

/* ── IPL analytics routes ─────────────────────────────────── */
app.use("/api/matches", iplMatchRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/matchups", matchupRoutes);
app.use("/api/strategy", teamStrategyRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/compare", compareRoutes);

/* ── User match engine ────────────────────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api/live", liveMatchRoutes);

/* ── 404 handler ──────────────────────────────────────────── */
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

/* ── Global error handler ─────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

connectDB().then(() =>
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)),
);
