import express from "express";
import {
  getTopRunScorers,
  getTopWicketTakers,
  getTopRunScorer,
} from "../controllers/playerAnalytics.js";

const router = express.Router();

router.get("/top-scorers", getTopRunScorers);
router.get("/top-wicket-takers", getTopWicketTakers);
router.get("/top-run-scorers", getTopRunScorer);

export default router;
