import express from "express";
import { getTopRunScorers } from "../controllers/playerAnalytics.js";

const router = express.Router();

router.get("/top-scorers", getTopRunScorers);

export default router;
