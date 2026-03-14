import express from "express";
import {
  createMatch,
  getMatches,
  getAnalyticsSummary,
  getTeamAnalytics,
  getTeamLeaderboard,
  getSpecificMatchInsights,
  getTossImpactAnalytics,
} from "../controllers/matchController.js";

const router = express.Router();

router.get("/analytics", getAnalyticsSummary);
router.get("/teams/analytics", getTeamAnalytics);
router.get("/teams/leaderboard", getTeamLeaderboard);
router.get("/:id/insights", getSpecificMatchInsights);
router.get("/analytics/toss-impact", getTossImpactAnalytics);
router.post("/", createMatch);
router.get("/", getMatches);

export default router;
