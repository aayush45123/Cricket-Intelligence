import express from "express";
import {
  getTopWicketTakers,
  getTopRunScorer,
  getBowlingStats,
  specificBowlerStats,
  teamLeaderboard,
} from "../controllers/playerAnalytics.js";

const router = express.Router();

router.get("/top-wicket-takers", getTopWicketTakers);
router.get("/top-run-scorers", getTopRunScorer);
router.get("/bowling-stats", getBowlingStats);
router.get("/bowling-stats/:playerName", specificBowlerStats);
router.get("/bowler-stats/:playerName", specificBowlerStats);
router.get("/team-leaderboard", teamLeaderboard);

export default router;
