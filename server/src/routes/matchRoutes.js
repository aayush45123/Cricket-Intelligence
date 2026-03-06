import express from "express";
import {
  createMatch,
  getMatches,
  getAnalyticsSummary,
  getTeamAnalytics,
} from "../controllers/matchController.js";

const router = express.Router();

router.get("/analytics", getAnalyticsSummary);
router.get("/teams/analytics", getTeamAnalytics);
router.post("/", createMatch);
router.get("/", getMatches);

export default router;
