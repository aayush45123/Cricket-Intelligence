// ── teamStrategyRoutes.js ─────────────────────────────────────
import express from "express";
import {
  getAllTeams,
  getTeamStrategy,
} from "../controllers/teamStrategy.controller.js";

const router = express.Router();

router.get("/", getAllTeams); // GET /api/strategy
router.get("/:team", getTeamStrategy); // GET /api/strategy/:team

export default router;
