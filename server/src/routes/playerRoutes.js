import express from "express";
import {
  getTopRunScorers,
  getTopWicketTakers,
} from "../controllers/playerAnalytics.js";

const router = express.Router();

router.get("/top-scorers", getTopRunScorers);
router.get("/top-wicket-takers", getTopWicketTakers);

export default router;
