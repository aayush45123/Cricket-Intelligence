import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import playerRoutes from "./routes/playerRoutes.js";
import iplMatchRoutes from "./routes/iplMatchRoutes.js";
import matches from "./routes/matchRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import matchupRoutes from "./routes/matchupRoutes.js";
import teamStrategyRoutes from "./routes/teamStrategyRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/", (req, res) => res.send("Cricket Intelligence API"));

app.use("/api/matches", iplMatchRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/matches", matches);
app.use("/api/venues", venueRoutes);
app.use("/api/matchups", matchupRoutes);
app.use("/api/strategy", teamStrategyRoutes);
app.use("/api/search", searchRoutes);

connectDB();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
