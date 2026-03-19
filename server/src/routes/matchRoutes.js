import express from "express";
import {
  createMatch,
  getMatches,
  getAnalyticsSummary,
  getTeamAnalytics,
  getTeamLeaderboard,
  getSpecificMatchInsights,
  getTossImpactAnalytics,
  getMatchIntensityAnalytics,
  topRunScorers,
  highestWicketTakers,
  playerBowlingAnalytics,
  specificPlayerBowlingAnalytics,
  playerBattingAnalytics,
  specificPlayerBattingAnalytics,
} from "../controllers/matchController.js";

const router = express.Router();

router.get("/analytics", getAnalyticsSummary);
router.get("/teams/analytics", getTeamAnalytics);
router.get("/teams/leaderboard", getTeamLeaderboard);
router.get("/:id/insights", getSpecificMatchInsights);
router.get("/analytics/toss-impact", getTossImpactAnalytics);
router.get("/analytics/match-intensity", getMatchIntensityAnalytics);
router.get("/players/top-scorers", topRunScorers);
router.get("/players/highest-wicket-takers", highestWicketTakers);
router.get("/players/bowling-analytics", playerBowlingAnalytics); // ALL
router.get(
  "/players/bowling-analytics/:playerName",
  specificPlayerBowlingAnalytics,
);
router.get("/players/batting-analytics", playerBattingAnalytics);
router.get(
  "/players/batting-analytics/:playerName",
  specificPlayerBattingAnalytics,
);

router.post("/", createMatch);
router.get("/", getMatches);

export default router;
