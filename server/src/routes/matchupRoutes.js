// import express from "express";
// import {
//   getAllBatters,
//   getAllBowlers,
//   getMatchup,
//   getTopBoylersForBatter,
//   getBattersVsBowler,
// } from "../controllers/matchupController.js";

// const router = express.Router();

// // Lookup lists for dropdowns
// router.get("/batters",              getAllBatters);
// router.get("/bowlers",              getAllBowlers);

// // Head-to-head deep analytics
// // e.g. GET /api/matchups/V Kohli/JJ Bumrah
// router.get("/:batter/:bowler",      getMatchup);

// // Contextual rankings
// // "Who has troubled this batter most?"
// router.get("/top/:batter",          getTopBoylersForBatter);

// // "Which batters has this bowler dominated?"
// router.get("/dominated/:bowler",    getBattersVsBowler);

// export default router;

import express from "express";
import {
  getAllBatters,
  getAllBowlers,
  getMatchup,
  getTopBoylersForBatter,
  getBattersVsBowler,
} from "../controllers/matchupController.js";
import {
  comparePlayers,
  getAllPlayers,
} from "../controllers/compareController.js";

const router = express.Router();

/* ── Static lookup routes (MUST be before param routes) ─────── */
router.get("/batters", getAllBatters);
router.get("/bowlers", getAllBowlers);
router.get("/search/players", getAllPlayers); // all players for compare dropdown

/* ── Player comparison ──────────────────────────────────────── */
// NOTE: 3-segment path — no conflict with 2-segment /:batter/:bowler
router.get("/compare/:playerA/:playerB", comparePlayers);

/* ── Head-to-head (2-segment param route) ───────────────────── */
router.get("/:batter/:bowler", getMatchup);

/* ── Contextual rankings ────────────────────────────────────── */
router.get("/top/:batter", getTopBoylersForBatter);
router.get("/dominated/:bowler", getBattersVsBowler);

export default router;
