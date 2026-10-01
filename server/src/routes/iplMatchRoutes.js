import express from "express";
import {
  getAllMatches,
  getMatchById,
  getTossImpactAnalytics,
  getMatchIntensityAnalytics,
  getAvailableSeasons,
} from "../controllers/iplMatchController.js";
import { getAnalyticsSummary } from "../controllers/matchController.js";

const router = express.Router();

// Static routes first (before param routes)
router.get("/analytics/seasons", getAvailableSeasons);
router.get("/analytics", getAnalyticsSummary);
router.get("/analytics/toss-impact", getTossImpactAnalytics);
router.get("/analytics/match-intensity", getMatchIntensityAnalytics);
router.get("/", getAllMatches);

// Param route last
router.get("/:matchId", getMatchById);

export default router;
