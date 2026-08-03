import Tournament from "../models/Tournament.js";
import User from "../models/User.js";
import {
  advanceBracket,
  buildCompletionReport,
  buildStandings,
  buildTournamentFixtures,
  getRegistrationState,
  hydrateTournamentLifecycle,
  isTournamentCompleted,
  scheduleFixtures,
  simulateFixtureResult,
} from "../utils/tournamentEngine.js";

const generateInviteCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TRN-";
  for (let index = 0; index < 6; index += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const toDateOrNull = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeTeamArray = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

const ensureOwner = (req, tournament) => {
  if (
    !tournament.creatorId ||
    String(tournament.creatorId) !== String(req.user._id)
  ) {
    const error = new Error("You are not allowed to manage this tournament");
    error.statusCode = 403;
    throw error;
  }
};

const loadTournament = async (tournamentId) =>
  Tournament.findById(tournamentId).populate("creatorId", "name email");

const syncTournamentLifecycle = async (tournament) => {
  hydrateTournamentLifecycle(tournament);
  tournament.standings = buildStandings(tournament, tournament.fixtures || []);

  if (isTournamentCompleted(tournament)) {
    tournament.status = "completed";
    tournament.report = buildCompletionReport(tournament);
    tournament.champion =
      tournament.standings[0]?.teamName || tournament.champion || "";
    tournament.runnerUp =
      tournament.standings[1]?.teamName || tournament.runnerUp || "";
  } else if ((tournament.fixtures || []).length > 0) {
    tournament.status = tournament.fixtures.some(
      (fixture) => fixture.status === "scheduled",
    )
      ? "scheduled"
      : tournament.status;
  }

  await tournament.save();
  return tournament;
};

export const createTournament = async (req, res) => {
  try {
    const {
      title,
      format,
      location,
      description,
      tournamentType,
      tournamentLogo,
      organizerName,
      registration,
      dates,
      rules,
      schedule,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Tournament title is required" });
    }

    let inviteCode = generateInviteCode();
    let exists = await Tournament.findOne({ inviteCode });
    while (exists) {
      inviteCode = generateInviteCode();
      exists = await Tournament.findOne({ inviteCode });
    }

    const registrationWindow = registration || {};
    const tournamentDates = dates || {};

    const tournament = await Tournament.create({
      title: title.trim(),
      format: format || "T20",
      tournamentType: tournamentType || "League",
      tournamentLogo: tournamentLogo ? String(tournamentLogo).trim() : "",
      organizerName: organizerName
        ? String(organizerName).trim()
        : req.user.name || "",
      location: location ? location.trim() : "",
      description: description ? description.trim() : "",
      creatorId: req.user._id,
      inviteCode,
      status: "upcoming",
      registration: {
        opensAt: toDateOrNull(registrationWindow.opensAt),
        closesAt: toDateOrNull(registrationWindow.closesAt),
        maxTeams: Number(registrationWindow.maxTeams) || 0,
        minTeamsRequired: Number(registrationWindow.minTeamsRequired) || 0,
        status: "open",
      },
      dates: {
        startDate: toDateOrNull(tournamentDates.startDate),
        endDate: toDateOrNull(tournamentDates.endDate),
      },
      rules: {
        overs: Number(rules?.overs) || 20,
        powerplayOvers: Number(rules?.powerplayOvers) || 6,
        superOver: rules?.superOver ?? true,
        dlsEnabled: rules?.dlsEnabled ?? true,
        tieRules: rules?.tieRules || "Super Over",
      },
      schedule: {
        startDate: toDateOrNull(schedule?.startDate),
        endDate: toDateOrNull(schedule?.endDate),
        grounds: Number(schedule?.grounds) || 1,
        dailyStartTime: schedule?.dailyStartTime || "09:00",
        dailyEndTime: schedule?.dailyEndTime || "18:00",
        matchDurationMinutes: Number(schedule?.matchDurationMinutes) || 120,
        restGapMinutes: Number(schedule?.restGapMinutes) || 60,
        maxMatchesPerTeamPerDay: Number(schedule?.maxMatchesPerTeamPerDay) || 2,
      },
    });

    await syncTournamentLifecycle(tournament);

    res.status(201).json({
      status: "success",
      data: { tournament },
    });
  } catch (err) {
    console.error("🔥 CREATE TOURNAMENT ERROR:", err);
    res
      .status(500)
      .json({ message: err.message || "Failed to create tournament" });
  }
};

export const getMyTournaments = async (req, res) => {
  try {
    const userId = req.user._id;

    const tournaments = await Tournament.find({
      $or: [{ creatorId: userId }, { "teams.players.userId": userId }],
    })
      .populate("creatorId", "name email")
      .sort({ createdAt: -1 });

    const hydrated = [];
    for (const tournament of tournaments) {
      hydrated.push(await syncTournamentLifecycle(tournament));
    }

    res.json({
      status: "success",
      data: { tournaments: hydrated },
    });
  } catch (err) {
    console.error("🔥 GET TOURNAMENTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch tournaments" });
  }
};

export const getTournamentById = async (req, res) => {
  try {
    const tournament = await loadTournament(req.params.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    ensureOwner(req, tournament);
    const hydrated = await syncTournamentLifecycle(tournament);

    res.json({
      status: "success",
      data: { tournament: hydrated },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    console.error("🔥 GET TOURNAMENT ERROR:", err);
    res
      .status(statusCode)
      .json({ message: err.message || "Failed to fetch tournament" });
  }
};

export const getTournamentByInvite = async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const tournament = await Tournament.findOne({
      inviteCode: inviteCode.toUpperCase(),
    }).populate("creatorId", "name email");

    if (!tournament) {
      return res
        .status(404)
        .json({ message: "Tournament not found. Please check invite code." });
    }

    await syncTournamentLifecycle(tournament);

    res.json({
      status: "success",
      data: { tournament },
    });
  } catch (err) {
    console.error("🔥 GET TOURNAMENT INVITE ERROR:", err);
    res.status(500).json({ message: "Failed to fetch tournament" });
  }
};

export const registerTeam = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const {
      teamName,
      captainName,
      players,
      teamLogo,
      jerseyColors,
      captainContact,
    } = req.body;

    if (!teamName || !teamName.trim()) {
      return res.status(400).json({ message: "Team name is required" });
    }

    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({
        message: "At least one player is required to register a team",
      });
    }

    const tournament = await Tournament.findOne({
      inviteCode: inviteCode.toUpperCase(),
    });
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    const registrationState = getRegistrationState(tournament);
    if (registrationState.closed) {
      return res.status(409).json({
        message: "Registration is closed for this tournament",
        code: registrationState.reason,
      });
    }

    const maxTeams = Number(tournament.registration?.maxTeams) || 0;
    if (maxTeams > 0 && tournament.teams.length >= maxTeams) {
      tournament.registration.status = "full";
      tournament.registration.closedAt = new Date();
      await tournament.save();
      return res
        .status(409)
        .json({ message: "Tournament registration is full" });
    }

    const teamExists = tournament.teams.some(
      (team) => team.teamName.toLowerCase() === teamName.trim().toLowerCase(),
    );
    if (teamExists) {
      return res.status(409).json({
        message: `Team '${teamName}' is already registered in this tournament`,
      });
    }

    const validatedPlayers = [];
    const missingAccounts = [];

    for (const player of players) {
      const email = player.email
        ? String(player.email).trim().toLowerCase()
        : "";
      if (!email) {
        missingAccounts.push(player.name || "Unnamed player (no email)");
        continue;
      }

      const registeredUser = await User.findOne({ email });
      if (!registeredUser) {
        missingAccounts.push(email);
        continue;
      }

      validatedPlayers.push({
        userId: registeredUser._id,
        name: registeredUser.name,
        email: registeredUser.email,
      });
    }

    if (missingAccounts.length > 0) {
      return res.status(400).json({
        status: "error",
        code: "UNREGISTERED_PLAYERS",
        message: `The following player(s) do not have an active Cricket Intelligence account: ${missingAccounts.join(
          ", ",
        )}. Every player must first sign up on Cricket Intelligence before joining a tournament squad.`,
        missingAccounts,
      });
    }

    tournament.teams.push({
      teamName: teamName.trim(),
      captainId: req.user._id,
      captainName: captainName ? captainName.trim() : req.user.name,
      captainContact: captainContact ? String(captainContact).trim() : "",
      teamLogo: teamLogo ? String(teamLogo).trim() : "",
      jerseyColors: normalizeTeamArray(jerseyColors),
      players: validatedPlayers,
    });

    if (maxTeams > 0 && tournament.teams.length >= maxTeams) {
      tournament.registration.status = "full";
      tournament.registration.closedAt = new Date();
      tournament.status = "registration_closed";
    }

    await syncTournamentLifecycle(tournament);

    res.status(201).json({
      status: "success",
      message: "Team registered successfully!",
      data: { tournament, team: tournament.teams[tournament.teams.length - 1] },
    });
  } catch (err) {
    console.error("🔥 REGISTER TEAM ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to register team" });
  }
};

export const refreshTournamentLifecycle = async (req, res) => {
  try {
    const tournament = await loadTournament(req.params.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    ensureOwner(req, tournament);
    const refreshed = await syncTournamentLifecycle(tournament);

    res.json({
      status: "success",
      data: { tournament: refreshed },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: err.message || "Failed to refresh tournament" });
  }
};

export const generateTournamentFixtures = async (req, res) => {
  try {
    const tournament = await loadTournament(req.params.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    ensureOwner(req, tournament);

    if (
      tournament.teams.length <
      Number(tournament.registration?.minTeamsRequired || 0)
    ) {
      return res
        .status(400)
        .json({ message: "Minimum teams required have not been met" });
    }

    const fixtures = buildTournamentFixtures(tournament);
    tournament.fixtures = scheduleFixtures(tournament, fixtures);
    tournament.standings = buildStandings(tournament, tournament.fixtures);
    tournament.status = "scheduled";
    await tournament.save();

    res.json({
      status: "success",
      data: { tournament },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: err.message || "Failed to generate fixtures" });
  }
};

export const rescheduleTournament = async (req, res) => {
  try {
    const tournament = await loadTournament(req.params.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    ensureOwner(req, tournament);
    tournament.fixtures = scheduleFixtures(
      tournament,
      tournament.fixtures || [],
    );
    tournament.standings = buildStandings(tournament, tournament.fixtures);
    await tournament.save();

    res.json({
      status: "success",
      data: { tournament },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: err.message || "Failed to schedule tournament" });
  }
};

export const recordFixtureResult = async (req, res) => {
  try {
    const { tournamentId, fixtureId } = req.params;
    const tournament = await loadTournament(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    ensureOwner(req, tournament);

    const fixture = tournament.fixtures.find(
      (entry) => entry.fixtureId === fixtureId,
    );
    if (!fixture) {
      return res.status(404).json({ message: "Fixture not found" });
    }

    const payload = req.body?.result || req.body || {};
    const simulatedResult = payload.simulate
      ? simulateFixtureResult(fixture, tournament)
      : null;
    const resolvedResult = simulatedResult || payload;

    if (!resolvedResult?.winner) {
      return res
        .status(400)
        .json({ message: "Winner is required to complete a fixture" });
    }

    fixture.result = {
      winner: resolvedResult.winner,
      margin: resolvedResult.margin || "",
      teamAScore: {
        runs: Number(resolvedResult.teamAScore?.runs || 0),
        wickets: Number(resolvedResult.teamAScore?.wickets || 0),
        overs: Number(resolvedResult.teamAScore?.overs || 0),
      },
      teamBScore: {
        runs: Number(resolvedResult.teamBScore?.runs || 0),
        wickets: Number(resolvedResult.teamBScore?.wickets || 0),
        overs: Number(resolvedResult.teamBScore?.overs || 0),
      },
    };
    fixture.status = "completed";

    tournament.fixtures = advanceBracket(
      tournament.fixtures,
      fixtureId,
      resolvedResult.winner,
    );
    const updatedFixture = tournament.fixtures.find(
      (entry) => entry.fixtureId === fixtureId,
    );
    if (updatedFixture) {
      updatedFixture.result = fixture.result;
      updatedFixture.status = "completed";
      updatedFixture.scheduledAt =
        updatedFixture.scheduledAt || fixture.scheduledAt || new Date();
    }

    tournament.standings = buildStandings(tournament, tournament.fixtures);

    if (isTournamentCompleted(tournament)) {
      tournament.status = "completed";
      tournament.champion =
        tournament.standings[0]?.teamName ||
        resolvedResult.winner ||
        tournament.champion ||
        "";
      tournament.runnerUp =
        tournament.standings[1]?.teamName || tournament.runnerUp || "";
      tournament.report = buildCompletionReport(tournament);
    } else if (tournament.status !== "completed") {
      tournament.status = "ongoing";
    }

    await tournament.save();

    res.json({
      status: "success",
      data: { tournament, fixture: updatedFixture || fixture },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: err.message || "Failed to record fixture result" });
  }
};

export const completeTournament = async (req, res) => {
  try {
    const tournament = await loadTournament(req.params.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    ensureOwner(req, tournament);
    tournament.status = "completed";
    tournament.standings = buildStandings(
      tournament,
      tournament.fixtures || [],
    );
    tournament.champion =
      tournament.standings[0]?.teamName || tournament.champion || "";
    tournament.runnerUp =
      tournament.standings[1]?.teamName || tournament.runnerUp || "";
    tournament.report = buildCompletionReport(tournament);
    await tournament.save();

    res.json({
      status: "success",
      data: { tournament },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: err.message || "Failed to complete tournament" });
  }
};
