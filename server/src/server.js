import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import playerRoutes from "./routes/playerRoutes.js";
import iplMatchRoutes from "./routes/iplMatchRoutes.js";
import matches from "./routes/matchRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/matches", iplMatchRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/matches", matches);

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
