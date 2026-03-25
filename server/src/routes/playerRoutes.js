import express from "express";
import {
  getTopWicketTakers,
  getTopRunScorer,
} from "../controllers/playerAnalytics.js";

const router = express.Router();

router.get("/top-wicket-takers", getTopWicketTakers);
router.get("/top-run-scorers", getTopRunScorer);

export default router;
