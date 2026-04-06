import express from "express";
import { getDeepMatchAnalytics } from "../controllers/deepMatchAnalytics.controller.js";

// Import your existing match controllers here
// import { getMatches, getMatchById, getMatchAnalytics, ... } from "../controllers/match.controller.js";

const router = express.Router();

// ── Existing match routes (uncomment and adjust to match your codebase) ──────
// router.get("/",                          getMatches);
// router.get("/analytics",                 getMatchAnalytics);
// router.get("/analytics/toss-impact",     getTossImpact);
// router.get("/analytics/match-intensity", getMatchIntensity);
// router.get("/:matchId",                  getMatchById);

// ── Deep Analytics ────────────────────────────────────────────────────────────
router.get("/:matchId/deep-analytics", getDeepMatchAnalytics);

export default router;
