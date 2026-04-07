import express from "express";
import { getDeepMatchAnalytics } from "../controllers/DeepMatchAnalyticsController.js";

// Import your existing match controllers here
// import { getMatches, getMatchById, getMatchAnalytics, ... } from "../controllers/match.controller.js";

const router = express.Router();


router.get("/:matchId/deep-analytics", getDeepMatchAnalytics);

export default router;
