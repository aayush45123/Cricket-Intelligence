import Delivery from "../models/Deliveries.js";
import UserDelivery from "../models/UserDelivery.js";

/* ── Shared aggregation for one player's full stats ─────────── */
const fetchPlayerStats = async (playerName) => {
  const [battingOverallIPL, battingPhasesIPL, bowlingIPL, battingOverallUser, battingPhasesUser, bowlingUser] = await Promise.all([
    /* overall batting IPL */
    Delivery.aggregate([
      { $match: { batter: playerName } },
      {
        $group: {
          _id: null,
          totalRuns: { $sum: "$runs_batter" },
          totalBalls: { $sum: 1 },
          dotBalls: { $sum: { $cond: [{ $eq: ["$runs_batter", 0] }, 1, 0] } },
          boundaryRuns: {
            $sum: {
              $cond: [{ $in: ["$runs_batter", [4, 6]] }, "$runs_batter", 0],
            },
          },
          fours: { $sum: { $cond: [{ $eq: ["$runs_batter", 4] }, 1, 0] } },
          sixes: { $sum: { $cond: [{ $eq: ["$runs_batter", 6] }, 1, 0] } },
          matches: { $addToSet: "$match_id" },
        },
      },
    ]),

    /* phase batting IPL */
    Delivery.aggregate([
      { $match: { batter: playerName } },
      {
        $addFields: {
          phase: {
            $switch: {
              branches: [
                { case: { $lte: ["$over", 5] }, then: "Powerplay" },
                { case: { $lte: ["$over", 14] }, then: "Middle" },
              ],
              default: "Death",
            },
          },
        },
      },
      {
        $group: {
          _id: "$phase",
          runs: { $sum: "$runs_batter" },
          balls: { $sum: 1 },
        },
      },
    ]),

    /* bowling IPL */
    Delivery.aggregate([
      { $match: { bowler: playerName } },
      {
        $group: {
          _id: null,
          totalWickets: { $sum: "$bowler_wicket" },
          totalRuns: { $sum: "$runs_bowler" },
          totalBalls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
          dotBalls: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$valid_ball", 1] },
                    { $eq: ["$runs_bowler", 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    /* overall batting User */
    UserDelivery.aggregate([
      { $match: { batter: playerName } },
      {
        $group: {
          _id: null,
          totalRuns: { $sum: "$runs_batter" },
          totalBalls: { $sum: 1 },
          dotBalls: { $sum: { $cond: [{ $eq: ["$runs_batter", 0] }, 1, 0] } },
          boundaryRuns: {
            $sum: {
              $cond: [{ $in: ["$runs_batter", [4, 6]] }, "$runs_batter", 0],
            },
          },
          fours: { $sum: { $cond: [{ $eq: ["$runs_batter", 4] }, 1, 0] } },
          sixes: { $sum: { $cond: [{ $eq: ["$runs_batter", 6] }, 1, 0] } },
          matches: { $addToSet: "$matchId" },
        },
      },
    ]),

    /* phase batting User */
    UserDelivery.aggregate([
      { $match: { batter: playerName } },
      {
        $addFields: {
          phase: {
            $switch: {
              branches: [
                { case: { $lte: ["$over", 5] }, then: "Powerplay" },
                { case: { $lte: ["$over", 14] }, then: "Middle" },
              ],
              default: "Death",
            },
          },
        },
      },
      {
        $group: {
          _id: "$phase",
          runs: { $sum: "$runs_batter" },
          balls: { $sum: 1 },
        },
      },
    ]),

    /* bowling User */
    UserDelivery.aggregate([
      { $match: { bowler: playerName } },
      {
        $group: {
          _id: null,
          totalWickets: { $sum: "$bowler_wicket" },
          totalRuns: { $sum: "$runs_bowler" },
          totalBalls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
          dotBalls: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$valid_ball", 1] },
                    { $eq: ["$runs_bowler", 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const bIPL = battingOverallIPL[0] || {};
  const bUser = battingOverallUser[0] || {};
  const wIPL = bowlingIPL[0] || {};
  const wUser = bowlingUser[0] || {};

  const totalRuns = (bIPL.totalRuns || 0) + (bUser.totalRuns || 0);
  const totalBalls = (bIPL.totalBalls || 0) + (bUser.totalBalls || 0);
  const dotBalls = (bIPL.dotBalls || 0) + (bUser.dotBalls || 0);
  const boundaryRuns = (bIPL.boundaryRuns || 0) + (bUser.boundaryRuns || 0);
  const fours = (bIPL.fours || 0) + (bUser.fours || 0);
  const sixes = (bIPL.sixes || 0) + (bUser.sixes || 0);
  const totalMatches = (bIPL.matches?.length || 0) + (bUser.matches?.length || 0);

  const bat = totalBalls > 0 ? {
    totalRuns, totalBalls, dotBalls, boundaryRuns, fours, sixes, totalMatches
  } : null;

  const totalWickets = (wIPL.totalWickets || 0) + (wUser.totalWickets || 0);
  const totalRunsBowl = (wIPL.totalRuns || 0) + (wUser.totalRuns || 0);
  const totalBallsBowl = (wIPL.totalBalls || 0) + (wUser.totalBalls || 0);
  const dotBallsBowl = (wIPL.dotBalls || 0) + (wUser.dotBalls || 0);

  const bwl = totalBallsBowl > 0 ? {
    totalWickets, totalRuns: totalRunsBowl, totalBalls: totalBallsBowl, dotBalls: dotBallsBowl
  } : null;

  const combinedPhases = [...battingPhasesIPL, ...battingPhasesUser];

  const phaseOrder = ["Powerplay", "Middle", "Death"];
  const phaseStats = phaseOrder.map((phase) => {
    const matching = combinedPhases.filter((x) => x._id === phase);
    const runs = matching.reduce((s, m) => s + (m.runs || 0), 0);
    const balls = matching.reduce((s, m) => s + (m.balls || 0), 0);
    return {
      phase,
      runs,
      balls,
      strikeRate:
        balls > 0 ? parseFloat(((runs / balls) * 100).toFixed(1)) : 0,
    };
  });

  return {
    playerName,
    batting: bat
      ? {
          totalRuns: bat.totalRuns,
          totalBalls: bat.totalBalls,
          totalMatches: bat.totalMatches,
          strikeRate:
            bat.totalBalls > 0
              ? parseFloat(((bat.totalRuns / bat.totalBalls) * 100).toFixed(2))
              : 0,
          dotBallPercent:
            bat.totalBalls > 0
              ? parseFloat(((bat.dotBalls / bat.totalBalls) * 100).toFixed(1))
              : 0,
          boundaryPercent:
            bat.totalRuns > 0
              ? parseFloat(
                  ((bat.boundaryRuns / bat.totalRuns) * 100).toFixed(1),
                )
              : 0,
          fours: bat.fours,
          sixes: bat.sixes,
          phaseStats,
        }
      : null,
    bowling:
      bwl && bwl.totalBalls > 0
        ? {
            totalWickets: bwl.totalWickets,
            economy: parseFloat(
              ((bwl.totalRuns / bwl.totalBalls) * 6).toFixed(2),
            ),
            strikeRate:
              bwl.totalWickets > 0
                ? parseFloat((bwl.totalBalls / bwl.totalWickets).toFixed(2))
                : 0,
            dotBallPercent: parseFloat(
              ((bwl.dotBalls / bwl.totalBalls) * 100).toFixed(1),
            ),
            totalBalls: bwl.totalBalls,
          }
        : null,
  };
};

/* ─────────────────────────────────────────────────────────────
   GET /api/matchups/compare/:playerA/:playerB
   ───────────────────────────────────────────────────────────── */
export const comparePlayers = async (req, res) => {
  try {
    const playerA = decodeURIComponent(req.params.playerA);
    const playerB = decodeURIComponent(req.params.playerB);

    const [statsA, statsB] = await Promise.all([
      fetchPlayerStats(playerA),
      fetchPlayerStats(playerB),
    ]);

    if (!statsA.batting && !statsA.bowling) {
      return res.status(404).json({ message: `No data found for ${playerA}` });
    }
    if (!statsB.batting && !statsB.bowling) {
      return res.status(404).json({ message: `No data found for ${playerB}` });
    }

    /* ── Determine roles ─────────────────────────────── */
    const roleOf = (s) => {
      if (s.batting && s.bowling) return "All-Rounder";
      if (s.batting) return "Batsman";
      if (s.bowling) return "Bowler";
      return "Player";
    };

    res.json({
      status: "success",
      data: {
        playerA: { ...statsA, role: roleOf(statsA) },
        playerB: { ...statsB, role: roleOf(statsB) },
      },
    });
  } catch (err) {
    console.error("comparePlayers error:", err);
    res
      .status(500)
      .json({ message: "Error comparing players", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/matchups/search/players
   All distinct players (batters ∪ bowlers) for the compare dropdown
   ───────────────────────────────────────────────────────────── */
export const getAllPlayers = async (req, res) => {
  try {
    const [batters, bowlers] = await Promise.all([
      Delivery.distinct("batter"),
      Delivery.distinct("bowler"),
    ]);
    const players = [...new Set([...batters, ...bowlers])]
      .filter(Boolean)
      .sort();
    res.json({ status: "success", data: players });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching players", error: err.message });
  }
};
