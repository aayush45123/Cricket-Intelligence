import express from "express";
import {
  searchPlayers,
  getTeamsForFilter,
  quickSearch,
} from "../controllers/searchController.js";

const router = express.Router();

router.get("/", searchPlayers); // GET /api/search?q=&role=&team=&minSR=&maxSR=&minEco=&maxEco=
router.get("/teams", getTeamsForFilter); // GET /api/search/teams
router.get("/quick", quickSearch); // GET /api/search/quick?q=  (navbar modal)

export default router;
