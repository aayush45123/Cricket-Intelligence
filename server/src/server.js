import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import iplMatchRoutes from "./routes/iplMatchRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import matchupRoutes from "./routes/matchupRoutes.js";
import teamStrategyRoutes from "./routes/teamStrategyRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import authRoutes from "./routes/authRoutes.js"; // NEW
import liveMatchRoutes from "./routes/liveMatchRoutes.js"; // NEW

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

/* Health */
app.get("/", (_req, res) => res.send("Cricket Intelligence API"));

/* IPL analytics (existing — unchanged) */
app.use("/api/matches", iplMatchRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/matchups", matchupRoutes);
app.use("/api/strategy", teamStrategyRoutes);
app.use("/api/search", searchRoutes);

/* User match engine (new) */
app.use("/api/auth", authRoutes);
app.use("/api/live", liveMatchRoutes);

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

connectDB().then(() =>
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`)),
);
