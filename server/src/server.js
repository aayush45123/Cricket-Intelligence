import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import matchRoutes from "./routes/matchRoutes.js";

dotenv.config();

const app = express();
app.get("/", (req, res) => {
  res.send("Hello World!");
});
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use("/api/matches", matchRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
