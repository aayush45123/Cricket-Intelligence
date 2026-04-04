import express from "express";
import { getDeepMatchAnalytics } from "../controllers/DeepMatchAnalyticsController.js";
const router = express.Router();

/* =========================================
   🔥 DEEP MATCH ANALYTICS
   Example:
   /api/matches/335982/deep-analytics
========================================= */
router.get("/:matchId/deep-analytics", getDeepMatchAnalytics);

export default router;
