import Match from "../models/Match.js";
import Delivery from "../models/Deliveries.js";
import { generateMatchAnalytics } from "../utils/matchAnalytics.js";
import { computeBowlingStats } from "../utils/bowlingStats.js";
import { computeBattingStats } from "../utils/battingStats.js";

const VALID_MATCH_FORMATS = ["T20", "ODI", "TEST", "T10"];

export const createMatch = async (req, res) => {
  try {
    const matchData = req.body;
    const newMatch = new Match(matchData);
    const savedMatch = await newMatch.save();
    res
      .status(201)
      .json({ status: "Success", message: "Match added", data: savedMatch });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error creating match",
        error: error.message,
      });
  }
};

export const getMatches = async (req, res) => {
  try {
    const matches = await Match.find();
    const analyticsForMatches = matches.map((match) => ({
      ...match.toObject(),
      analysis: generateMatchAnalytics(match),
    }));
    res
      .status(200)
      .json({
        status: "Success",
        message: "Matches fetched",
        data: analyticsForMatches,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching matches",
        error: error.message,
      });
  }
};

/* ─────────────────────────────────────────────────────────────
   FIXED: getAnalyticsSummary
   Root cause of the bug:
     { $eq: ["$batting_team", "$batting_team"] }  ← always true
     { $eq: ["$bowling_team", "$bowling_team"] }  ← always true
   Both accumulated ALL runs/balls for every delivery,
   making runsTeamA === runsTeamB and runRateTeamA === runRateTeamB.

   Fix: group first by (match_id, innings) to separate the two
   innings cleanly, then compute per-innings stats from the
   batting_team that actually batted that innings.
   ───────────────────────────────────────────────────────────── */
export const getAnalyticsSummary = async (req, res) => {
  try {
    /* Step 1 — per-innings totals (group by match + innings) */
    const inningsTotals = await Delivery.aggregate([
      {
        $group: {
          _id: {
            matchId: "$match_id",
            innings: "$innings",
            battingTeam: "$batting_team",
            bowlingTeam: "$bowling_team",
          },
          runs: { $sum: "$runs_total" },
          balls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
        },
      },
    ]);

    /* Step 2 — collapse into one object per match */
    const matchMap = {};

    inningsTotals.forEach(({ _id, runs, balls }) => {
      const id = _id.matchId;
      if (!matchMap[id]) {
        matchMap[id] = {
          matchId: id,
          inn1: { runs: 0, balls: 0, battingTeam: "", bowlingTeam: "" },
          inn2: { runs: 0, balls: 0, battingTeam: "", bowlingTeam: "" },
        };
      }

      const inningsKey = _id.innings === 1 ? "inn1" : "inn2";
      matchMap[id][inningsKey] = {
        runs,
        balls,
        battingTeam: _id.battingTeam,
        bowlingTeam: _id.bowlingTeam,
      };
    });

    const matches = Object.values(matchMap);
    const totalMatches = matches.length;

    if (totalMatches === 0) {
      return res.status(200).json({
        status: "Success",
        message: "No matches available",
        data: {
          totalMatches: 0,
          averageRunRateTeamA: 0,
          averageRunRateTeamB: 0,
          averagePressureIndex: 0,
          mostDominantMatch: null,
        },
      });
    }

    /* Step 3 — compute run rates per match */
    const analytics = matches.map((m) => {
      const rrInn1 = m.inn1.balls > 0 ? (m.inn1.runs / m.inn1.balls) * 6 : 0;
      const rrInn2 = m.inn2.balls > 0 ? (m.inn2.runs / m.inn2.balls) * 6 : 0;

      return {
        match: m,
        analysis: {
          runRateForTeamA: parseFloat(rrInn1.toFixed(2)), // Team batting first (inn1)
          runRateForTeamB: parseFloat(rrInn2.toFixed(2)), // Team batting second (inn2)
          inn1Runs: m.inn1.runs,
          inn2Runs: m.inn2.runs,
          inn1Balls: m.inn1.balls,
          inn2Balls: m.inn2.balls,
          teamA: m.inn1.battingTeam,
          teamB: m.inn2.battingTeam,
        },
      };
    });

    /* Step 4 — averages */
    const avgRRTeamA =
      analytics.reduce((s, x) => s + x.analysis.runRateForTeamA, 0) /
      totalMatches;
    const avgRRTeamB =
      analytics.reduce((s, x) => s + x.analysis.runRateForTeamB, 0) /
      totalMatches;
    const avgPI =
      analytics.reduce(
        (s, x) =>
          s + Math.abs(x.analysis.runRateForTeamA - x.analysis.runRateForTeamB),
        0,
      ) / totalMatches;

    /* Step 5 — most dominant match (largest run-rate gap) */
    const dominant = analytics.reduce((max, x) => {
      const diff = Math.abs(
        x.analysis.runRateForTeamA - x.analysis.runRateForTeamB,
      );
      const maxDiff = Math.abs(
        max.analysis.runRateForTeamA - max.analysis.runRateForTeamB,
      );
      return diff > maxDiff ? x : max;
    });

    res.status(200).json({
      status: "Success",
      message: "Analytics summary fetched",
      data: {
        totalMatches,
        averageRunRateTeamA: parseFloat(avgRRTeamA.toFixed(2)),
        averageRunRateTeamB: parseFloat(avgRRTeamB.toFixed(2)),
        averagePressureIndex: parseFloat(avgPI.toFixed(2)),
        mostDominantMatch: {
          teams: {
            teamA: { name: dominant.analysis.teamA },
            teamB: { name: dominant.analysis.teamB },
          },
          winner: dominant.match.winner || "TBD",
          runRateTeamA: dominant.analysis.runRateForTeamA,
          runRateTeamB: dominant.analysis.runRateForTeamB,
          inn1Runs: dominant.analysis.inn1Runs,
          inn2Runs: dominant.analysis.inn2Runs,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching analytics summary",
      error: error.message,
    });
  }
};

export const getTeamAnalytics = async (req, res) => {
  try {
    const matches = await Match.find();
    const stats = {};
    matches.forEach((match) => {
      const teamA = match.teams.teamA.name;
      const teamB = match.teams.teamB.name;

      if (!stats[teamA])
        stats[teamA] = {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          totalRunRate: 0,
        };
      if (!stats[teamB])
        stats[teamB] = {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          totalRunRate: 0,
        };

      stats[teamA].matchesPlayed++;
      stats[teamB].matchesPlayed++;

      const winner = match.result.winner;
      if (winner === teamA) {
        stats[teamA].wins++;
        stats[teamB].losses++;
      } else {
        stats[teamB].wins++;
        stats[teamA].losses++;
      }

      const analytics = generateMatchAnalytics(match);
      stats[teamA].totalRunRate += analytics.runRateForTeamA;
      stats[teamB].totalRunRate += analytics.runRateForTeamB;
    });

    const teams = Object.keys(stats).map((team) => ({
      team,
      matchesPlayed: stats[team].matchesPlayed,
      wins: stats[team].wins,
      losses: stats[team].losses,
      averageRunRate: stats[team].totalRunRate / stats[team].matchesPlayed,
    }));

    res.status(200).json({ success: true, teams });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching team analytics",
        error: error.message,
      });
  }
};

export const getTeamLeaderboard = async (req, res) => {
  try {
    const requestedFormat = req.query.format?.toUpperCase();
    if (requestedFormat && !VALID_MATCH_FORMATS.includes(requestedFormat)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid match format",
          validFormats: VALID_MATCH_FORMATS,
        });
    }

    const query = requestedFormat ? { format: requestedFormat } : {};
    const matches = await Match.find(query);
    const stats = {};

    matches.forEach((match) => {
      const teamA = match.teams.teamA.name;
      const teamB = match.teams.teamB.name;

      if (!stats[teamA])
        stats[teamA] = { matchesPlayed: 0, wins: 0, losses: 0 };
      if (!stats[teamB])
        stats[teamB] = { matchesPlayed: 0, wins: 0, losses: 0 };

      stats[teamA].matchesPlayed++;
      stats[teamB].matchesPlayed++;

      const winner = match.result.winner;
      if (winner === teamA) {
        stats[teamA].wins++;
        stats[teamB].losses++;
      } else {
        stats[teamB].wins++;
        stats[teamA].losses++;
      }
    });

    const teams = Object.keys(stats)
      .map((team) => ({
        team,
        matchesPlayed: stats[team].matchesPlayed,
        wins: stats[team].wins,
        losses: stats[team].losses,
        winRate: (stats[team].wins / stats[team].matchesPlayed) * 100,
      }))
      .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);

    res
      .status(200)
      .json({ success: true, format: requestedFormat || "ALL", teams });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching team analytics",
        error: error.message,
      });
  }
};

export const getSpecificMatchInsights = async (req, res) => {
  try {
    const id = req.params.id;
    const match = await Match.findById(id);
    if (!match) {
      return res
        .status(404)
        .json({ success: false, message: "Match not found" });
    }
    const insights = generateMatchAnalytics(match);
    res.status(200).json({
      success: true,
      match_id: id,
      teams: { teamA: match.teams.teamA.name, teamB: match.teams.teamB.name },
      venue: match.venue,
      innings: match.innings,
      analysis: insights,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching match insights",
        error: error.message,
      });
  }
};

export const getTossImpactAnalytics = async (req, res) => {
  try {
    const matches = await Match.find();
    let batFirstWins = 0;
    let bowlFirstWins = 0;

    matches.forEach((match) => {
      const tossWinner =
        match.toss.wonBy === "teamA"
          ? match.teams.teamA.name
          : match.teams.teamB.name;

      if (match.result.winner === tossWinner) {
        if (match.toss.decision === "bat") batFirstWins++;
        else bowlFirstWins++;
      }
    });

    res
      .status(200)
      .json({ status: "success", data: { batFirstWins, bowlFirstWins } });
  } catch (error) {
    res.status(500).json({ message: "Error calculating toss impact" });
  }
};

export const getMatchIntensityAnalytics = async (req, res) => {
  try {
    const matches = await Match.find();
    let veryCloseCount = 0;
    let competitiveCount = 0;
    let oneSidedCount = 0;

    matches.forEach((match) => {
      const analytics = generateMatchAnalytics(match);
      if (analytics.matchIntensity === "Very Close") veryCloseCount++;
      else if (analytics.matchIntensity === "Competitive") competitiveCount++;
      else oneSidedCount++;
    });

    res
      .status(200)
      .json({
        status: "success",
        data: { veryCloseCount, competitiveCount, oneSidedCount },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        status: "error",
        message: "Error fetching match intensity analytics",
        error: error.message,
      });
  }
};

export const topRunScorers = async (req, res) => {
  try {
    const matches = await Match.find();
    const playerRuns = {};

    matches.forEach((match) => {
      match.innings.statsByTeamA.runByTeamAPlayers.forEach((player) => {
        if (!playerRuns[player.playerName]) playerRuns[player.playerName] = 0;
        playerRuns[player.playerName] += player.runs;
      });
      match.innings.statsByTeamB.runByTeamBPlayers.forEach((player) => {
        if (!playerRuns[player.playerName]) playerRuns[player.playerName] = 0;
        playerRuns[player.playerName] += player.runs;
      });
    });

    const topScorers = Object.keys(playerRuns)
      .sort((a, b) => playerRuns[b] - playerRuns[a])
      .slice(0, 10)
      .map((player) => ({ playerName: player, totalRuns: playerRuns[player] }));

    res
      .status(200)
      .json({
        status: "Success",
        message: "Top run scorers fetched",
        data: topScorers,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        status: "error",
        message: "Error fetching top run scorers",
        error: error.message,
      });
  }
};

export const highestWicketTakers = async (req, res) => {
  try {
    const matches = await Match.find();
    const playerWicket = {};

    matches.forEach((match) => {
      match.innings.statsByTeamA.wicketsByTeamAPlayers.forEach((player) => {
        if (!playerWicket[player.playerName])
          playerWicket[player.playerName] = 0;
        playerWicket[player.playerName] += player.wickets;
      });
      match.innings.statsByTeamB.wicketsByTeamBPlayers.forEach((player) => {
        if (!playerWicket[player.playerName])
          playerWicket[player.playerName] = 0;
        playerWicket[player.playerName] += player.wickets;
      });
    });

    const topWicketTakers = Object.keys(playerWicket)
      .sort((a, b) => playerWicket[b] - playerWicket[a])
      .slice(0, 10)
      .map((player) => ({
        playerName: player,
        totalWickets: playerWicket[player],
      }));

    res.status(200).json({ status: "success", data: topWicketTakers });
  } catch (error) {
    res
      .status(500)
      .json({
        status: "error",
        message: "Error fetching top wicket takers",
        error: error.message,
      });
  }
};

export const playerBowlingAnalytics = async (req, res) => {
  try {
    const matches = await Match.find();
    const playerAnalytics = computeBowlingStats(matches);
    res
      .status(200)
      .json({
        status: "success",
        results: playerAnalytics.length,
        data: playerAnalytics,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        status: "error",
        message: "Error fetching bowling analytics",
        error: error.message,
      });
  }
};

export const specificPlayerBowlingAnalytics = async (req, res) => {
  try {
    const { playerName } = req.params;
    const matches = await Match.find();
    const playerAnalytics = computeBowlingStats(matches);
    const player = playerAnalytics.find((p) => p.playerName === playerName);
    if (!player)
      return res
        .status(404)
        .json({ status: "fail", message: "Player not found" });
    res.status(200).json({ status: "success", data: player });
  } catch (error) {
    res
      .status(500)
      .json({
        status: "error",
        message: "Error fetching player bowling analytics",
        error: error.message,
      });
  }
};

export const playerBattingAnalytics = async (req, res) => {
  try {
    const matches = await Match.find();
    const playerAnalytics = computeBattingStats(matches);
    res
      .status(200)
      .json({
        status: "success",
        results: playerAnalytics.length,
        data: playerAnalytics,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        status: "error",
        message: "Error fetching batting analytics",
        error: error.message,
      });
  }
};

export const specificPlayerBattingAnalytics = async (req, res) => {
  try {
    const { playerName } = req.params;
    const matches = await Match.find();
    const playerAnalytics = computeBattingStats(matches);
    const player = playerAnalytics.find((p) => p.playerName === playerName);
    if (!player)
      return res
        .status(404)
        .json({ status: "fail", message: "Player not found" });
    res.status(200).json({ status: "success", data: player });
  } catch (error) {
    res
      .status(500)
      .json({
        status: "error",
        message: "Error fetching player batting analytics",
        error: error.message,
      });
  }
};
