import Tournament from "../models/Tournament.js";
import User from "../models/User.js";
import crypto from "crypto";

/* Generate random invite code */
const generateInviteCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TRN-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/* ───────────────────────────────────────────── */
/* 🟢 CREATE TOURNAMENT */
/* ───────────────────────────────────────────── */
export const createTournament = async (req, res) => {
  try {
    const { title, format, location, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Tournament title is required" });
    }

    let inviteCode = generateInviteCode();
    let exists = await Tournament.findOne({ inviteCode });
    while (exists) {
      inviteCode = generateInviteCode();
      exists = await Tournament.findOne({ inviteCode });
    }

    const tournament = await Tournament.create({
      title: title.trim(),
      format: format || "T20",
      location: location ? location.trim() : "",
      description: description ? description.trim() : "",
      creatorId: req.user._id,
      inviteCode,
    });

    res.status(201).json({
      status: "success",
      data: { tournament },
    });
  } catch (err) {
    console.error("🔥 CREATE TOURNAMENT ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to create tournament" });
  }
};

/* ───────────────────────────────────────────── */
/* 🔵 GET MY TOURNAMENTS */
/* ───────────────────────────────────────────── */
export const getMyTournaments = async (req, res) => {
  try {
    const userId = req.user._id;

    // Created by user OR user is in a team squad
    const tournaments = await Tournament.find({
      $or: [
        { creatorId: userId },
        { "teams.players.userId": userId },
      ],
    }).sort({ createdAt: -1 });

    res.json({
      status: "success",
      data: { tournaments },
    });
  } catch (err) {
    console.error("🔥 GET TOURNAMENTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch tournaments" });
  }
};

/* ───────────────────────────────────────────── */
/* 🟡 GET TOURNAMENT BY INVITE CODE (PUBLIC/AUTH) */
/* ───────────────────────────────────────────── */
export const getTournamentByInvite = async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const tournament = await Tournament.findOne({ inviteCode: inviteCode.toUpperCase() })
      .populate("creatorId", "name email");

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found. Please check invite code." });
    }

    res.json({
      status: "success",
      data: { tournament },
    });
  } catch (err) {
    console.error("🔥 GET TOURNAMENT INVITE ERROR:", err);
    res.status(500).json({ message: "Failed to fetch tournament" });
  }
};

/* ───────────────────────────────────────────── */
/* 🟣 REGISTER TEAM TO TOURNAMENT (STRICT PLAYER CHECK) */
/* ───────────────────────────────────────────── */
export const registerTeam = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const { teamName, captainName, players } = req.body;

    if (!teamName || !teamName.trim()) {
      return res.status(400).json({ message: "Team name is required" });
    }

    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ message: "At least one player is required to register a team" });
    }

    const tournament = await Tournament.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // Check duplicate team name
    const teamExists = tournament.teams.some(
      (t) => t.teamName.toLowerCase() === teamName.trim().toLowerCase()
    );
    if (teamExists) {
      return res.status(409).json({ message: `Team '${teamName}' is already registered in this tournament` });
    }

    // STRICT ACCOUNT VERIFICATION: All players must be registered Cricket Intelligence users
    const validatedPlayers = [];
    const missingAccounts = [];

    for (const p of players) {
      const email = p.email ? p.email.trim().toLowerCase() : "";
      if (!email) {
        missingAccounts.push(p.name || "Unnamed player (no email)");
        continue;
      }

      const registeredUser = await User.findOne({ email });
      if (!registeredUser) {
        missingAccounts.push(email);
      } else {
        validatedPlayers.push({
          userId: registeredUser._id,
          name: registeredUser.name,
          email: registeredUser.email,
        });
      }
    }

    if (missingAccounts.length > 0) {
      return res.status(400).json({
        status: "error",
        code: "UNREGISTERED_PLAYERS",
        message: `The following player(s) do not have an active Cricket Intelligence account: ${missingAccounts.join(
          ", "
        )}. CricHeroes policy requires every player to first sign up on Cricket Intelligence before joining a tournament squad!`,
        missingAccounts,
      });
    }

    const newTeam = {
      teamName: teamName.trim(),
      captainId: req.user._id,
      captainName: captainName ? captainName.trim() : req.user.name,
      players: validatedPlayers,
    };

    tournament.teams.push(newTeam);
    await tournament.save();

    res.status(201).json({
      status: "success",
      message: "Team registered successfully!",
      data: { tournament, team: newTeam },
    });
  } catch (err) {
    console.error("🔥 REGISTER TEAM ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to register team" });
  }
};
