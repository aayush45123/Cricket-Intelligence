import express from "express";
import {
  createTournament,
  getMyTournaments,
  getTournamentByInvite,
  registerTeam,
} from "../controllers/tournamentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Public / Optional Auth */
router.get("/join/:inviteCode", getTournamentByInvite);

/* Protected routes */
router.use(protect);

router.post("/", createTournament);
router.get("/", getMyTournaments);
router.post("/join/:inviteCode/register-team", registerTeam);

export default router;
