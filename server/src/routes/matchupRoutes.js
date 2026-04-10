import express from "express";
import {
  getAllBatters,
  getAllBowlers,
  getMatchup,
  getTopBoylersForBatter,
  getBattersVsBowler,
} from "../controllers/matchupController.js";

const router = express.Router();

// Lookup lists for dropdowns
router.get("/batters",              getAllBatters);
router.get("/bowlers",              getAllBowlers);

// Head-to-head deep analytics
// e.g. GET /api/matchups/V Kohli/JJ Bumrah
router.get("/:batter/:bowler",      getMatchup);

// Contextual rankings
// "Who has troubled this batter most?"
router.get("/top/:batter",          getTopBoylersForBatter);

// "Which batters has this bowler dominated?"
router.get("/dominated/:bowler",    getBattersVsBowler);

export default router;