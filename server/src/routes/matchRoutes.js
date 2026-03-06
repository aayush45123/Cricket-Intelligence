import express from "express";
import {
  createMatch,
  getMatches,
  getAnalyticsSummary,
} from "../controllers/matchController.js";

const router = express.Router();

router.post("/", createMatch);
router.get("/", getMatches);
router.get("/analytics", getAnalyticsSummary);

export default router;
