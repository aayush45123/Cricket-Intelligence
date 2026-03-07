import express from "express";
import {
  createMatch,
  getMatches,
  getAnalyticsSummary,
  getTeamAnalytics,
  getTeamLeaderboard
} from "../controllers/matchController.js";

const router = express.Router();

router.get("/analytics", getAnalyticsSummary);
router.get("/teams/analytics", getTeamAnalytics);
router.get("/teams/leaderboard", getTeamLeaderboard);
router.post("/", createMatch);
router.get("/", getMatches);

export default router;
