import express from "express";
import {
  createTournament,
  completeTournament,
  generateTournamentFixtures,
  getMyTournaments,
  getTournamentById,
  getTournamentByInvite,
  refreshTournamentLifecycle,
  recordFixtureResult,
  rescheduleTournament,
  registerTeam,
  simulateTournamentFixture,
  getTournamentAnalytics,
  getTournamentReport,
} from "../controllers/tournamentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Public / Optional Auth */
router.get("/join/:inviteCode", getTournamentByInvite);

/* Protected routes */
router.use(protect);

router.post("/", createTournament);
router.get("/", getMyTournaments);
router.get("/:tournamentId", getTournamentById);
router.get("/:tournamentId/analytics", getTournamentAnalytics);
router.get("/:tournamentId/report", getTournamentReport);
router.post("/:tournamentId/refresh", refreshTournamentLifecycle);
router.post("/:tournamentId/fixtures/generate", generateTournamentFixtures);
router.post("/:tournamentId/fixtures/reschedule", rescheduleTournament);
router.patch("/:tournamentId/fixtures/:fixtureId/result", recordFixtureResult);
router.post("/:tournamentId/fixtures/:fixtureId/simulate", simulateTournamentFixture);
router.post("/:tournamentId/complete", completeTournament);
router.post("/join/:inviteCode/register-team", registerTeam);

export default router;
