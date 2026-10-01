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

/* ── Static lookup routes (MUST be before any param routes) ─── */
router.get("/batters", getAllBatters);
router.get("/bowlers", getAllBowlers);
router.get("/search/players", getAllPlayers); // all players for compare dropdown

/* ── 3-segment routes (must be before 2-segment /:batter/:bowler) ─ */
// Player general comparison
router.get("/compare/:playerA/:playerB", comparePlayers);

// Contextual rankings — these are STATIC prefix routes, so they MUST be
// registered before the catch-all /:batter/:bowler to avoid shadowing.
// FIX (BUG-005): Moved above /:batter/:bowler
router.get("/top-bowlers-for/:batter", getTopBoylersForBatter);
router.get("/dominated-by/:bowler", getBattersVsBowler);

/* ── 2-segment catch-all param route (head-to-head) ────────── */
// NOTE: This must remain LAST among param routes
router.get("/:batter/:bowler", getMatchup);

export default router;
