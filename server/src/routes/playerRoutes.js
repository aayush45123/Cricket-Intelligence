import express from "express";
import {
  getTopWicketTakers,
  getTopRunScorer,
  getBowlingStats,
  specificBowlerStats,
  teamLeaderboard,
  getBattingStats,
  specificBatterStats,
  getAllPlayers,
} from "../controllers/playerAnalytics.js";

const router = express.Router();

router.get("/top-wicket-takers", getTopWicketTakers);
router.get("/top-run-scorers", getTopRunScorer);
router.get("/bowling-stats", getBowlingStats);
router.get("/bowling-stats/:playerName", specificBowlerStats);
router.get("/bowler-stats/:playerName", specificBowlerStats);
router.get("/batting-analytics", getBattingStats);
router.get("/batting-analytics/:playerName", specificBatterStats);
router.get("/team-leaderboard", teamLeaderboard);
router.get("/", getAllPlayers);

export default router;
