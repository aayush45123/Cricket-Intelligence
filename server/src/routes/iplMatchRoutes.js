import express from "express";
import {
  getAllMatches,
  getMatchById,
  getTossImpactAnalytics,
  getMatchIntensityAnalytics,
} from "../controllers/iplMatchController.js";
import { getAnalyticsSummary } from "../controllers/matchController.js";

const router = express.Router();

router.get("/", getAllMatches);
router.get("/analytics", getAnalyticsSummary);
router.get("/analytics/toss-impact", getTossImpactAnalytics);
router.get("/analytics/match-intensity", getMatchIntensityAnalytics);
router.get("/:matchId", getMatchById);

export default router;
