import express from "express";
import {
  comparePlayers,
  getAllPlayers,
} from "../controllers/compareController.js";

const router = express.Router();

/* GET /api/compare/players — all player names for dropdowns */
router.get("/players", getAllPlayers);

/* GET /api/compare/:playerA/:playerB — head-to-head comparison */
router.get("/:playerA/:playerB", comparePlayers);

export default router;
