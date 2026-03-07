import express from "express";
import {
  createMatch,
  getMatches,
  getAnalyticsSummary,
  getTeamAnalytics,
  getTeamLeaderboard,
  getSpecificMatchInsights,
} from "../controllers/matchController.js";

const router = express.Router();

router.get("/analytics", getAnalyticsSummary);
router.get("/teams/analytics", getTeamAnalytics);
router.get("/teams/leaderboard", getTeamLeaderboard);
router.get("/:id/insights", getSpecificMatchInsights);
router.post("/", createMatch);
router.get("/", getMatches);

export default router;
