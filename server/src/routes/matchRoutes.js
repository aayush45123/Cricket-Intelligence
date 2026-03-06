import express from "express";
import {
  createMatch,
  getMatches,
  getAnalyticsSummary,
  getTeamAnalytics,
} from "../controllers/matchController.js";

const router = express.Router();

router.post("/", createMatch);
router.get("/", getMatches);
router.get("/analytics", getAnalyticsSummary);
router.get("/teams/analytics", getTeamAnalytics);

export default router;
