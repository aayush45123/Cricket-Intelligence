import express from "express";
import {
  getAllMatches,
  getMatchById,
} from "../controllers/iplMatchController.js";

const router = express.Router();

router.get("/", getAllMatches);
router.get("/:matchId", getMatchById);

export default router;
