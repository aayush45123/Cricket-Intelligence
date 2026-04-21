import express from "express";
import {
  setupMatch,
  startMatch,
  recordBall,
  changeBowler, // NEW — separate from recording a ball
  undoLastBall,
  startInnings2,
  getMatchState,
  getMatchAnalytics,
  getMyMatches,
  getSharedMatch,
} from "../controllers/liveMatchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Public */
router.get("/share/:shareToken", getSharedMatch);

/* Protected */
router.use(protect);

router.get("/my-matches", getMyMatches);
router.post("/setup", setupMatch);
router.patch("/:matchId/start", startMatch);
router.post("/:matchId/ball", recordBall);
router.patch("/:matchId/bowler", changeBowler); // NEW — change bowler, no ball
router.delete("/:matchId/undo", undoLastBall);
router.patch("/:matchId/innings-break", startInnings2);
router.get("/:matchId/state", getMatchState);
router.get("/:matchId/analytics", getMatchAnalytics);

export default router;
