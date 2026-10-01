import express from "express";
import { getHeadToHead, getAllTeams } from "../controllers/teamH2HController.js";

const router = express.Router();

// GET /api/teams                      — all distinct teams
router.get("/", getAllTeams);

// GET /api/teams/head-to-head?teamA=...&teamB=...&season=2024
router.get("/head-to-head", getHeadToHead);

export default router;
