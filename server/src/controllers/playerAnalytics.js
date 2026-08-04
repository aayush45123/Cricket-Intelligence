import Delivery from "../models/Deliveries.js";
import UserDelivery from "../models/UserDelivery.js";

const buildBowlingStatsFromDeliveries = (rows) => {
  return rows.map((row) => {
    const totalWickets = row.totalWickets || 0;
    const totalBallsBowled = row.totalBallsBowled || 0;
    const totalRunsConceded = row.totalRunsConceded || 0;

    const bowlingEconomyRate =
      totalBallsBowled > 0 ? (totalRunsConceded / totalBallsBowled) * 6 : 0;
    const bowlingAverage =
      totalWickets > 0 ? totalRunsConceded / totalWickets : totalRunsConceded;
    const bowlingStrikeRate =
      totalWickets > 0 ? totalBallsBowled / totalWickets : 0;

    return {
      playerName: row.playerName,
      totalWickets,
      totalRunsConceded,
      totalBallsBowled,
      bowlingAverage,
      bowlingEconomyRate,
      bowlingStrikeRate,
    };
  });
};

export const getTopWicketTakers = async (req, res) => {
  try {
    const [iplBowlers, userBowlers] = await Promise.all([
      Delivery.aggregate([
        { $group: { _id: "$bowler", totalWickets: { $sum: "$bowler_wicket" } } },
      ]),
      UserDelivery.aggregate([
        { $group: { _id: "$bowler", totalWickets: { $sum: { $cond: [{ $and: ["$isWicket", { $ne: ["$wicketType", "run out"] }] }, 1, { $ifNull: ["$bowler_wicket", 0] }] } } } },
      ]),
    ]);

    const map = {};
    [...iplBowlers, ...userBowlers].forEach((b) => {
      if (!b._id) return;
      map[b._id] = (map[b._id] || 0) + (b.totalWickets || 0);
    });

    const topBowlers = Object.entries(map)
      .map(([playerName, totalWickets]) => ({ playerName, totalWickets }))
      .sort((a, b) => b.totalWickets - a.totalWickets)
      .slice(0, 10);

    res.json({ status: "success", data: topBowlers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching top wicket takers", error: error.message });
  }
};

export const getTopRunScorer = async (req, res) => {
  try {
    const [iplScorers, userScorers] = await Promise.all([
      Delivery.aggregate([
        { $group: { _id: "$batter", totalRuns: { $sum: "$runs_batter" } } },
      ]),
      UserDelivery.aggregate([
        { $group: { _id: "$batter", totalRuns: { $sum: { $ifNull: ["$runs_batter", "$runsBatter"] } } } },
      ]),
    ]);

    const map = {};
    [...iplScorers, ...userScorers].forEach((b) => {
      if (!b._id) return;
      map[b._id] = (map[b._id] || 0) + (b.totalRuns || 0);
    });

    const topRunScorer = Object.entries(map)
      .map(([playerName, totalRuns]) => ({ playerName, totalRuns }))
      .sort((a, b) => b.totalRuns - a.totalRuns)
      .slice(0, 10);

    res.json({ status: "success", data: topRunScorer });
  } catch (error) {
    res.status(500).json({ message: "Error fetching top run scorers", error: error.message });
  }
};

export const getAllPlayers = async (req, res) => {
  try {
    const [iplBatters, iplBowlers, userBatters, userBowlers] = await Promise.all([
      Delivery.distinct("batter"),
      Delivery.distinct("bowler"),
      UserDelivery.distinct("batter"),
      UserDelivery.distinct("bowler"),
    ]);

    const all = Array.from(new Set([...iplBatters, ...iplBowlers, ...userBatters, ...userBowlers])).filter(Boolean).sort();
    res.json({ status: "success", data: all });
  } catch (error) {
    res.status(500).json({ message: "Error fetching players", error: error.message });
  }
};

export const getBowlingStats = async (req, res) => {
  try {
    const statsByBowler = await Delivery.aggregate([
      {
        $group: {
          _id: "$bowler",
          totalWickets: { $sum: "$bowler_wicket" },
          totalRunsConceded: { $sum: "$runs_bowler" },
          totalBallsBowled: {
            $sum: {
              $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          playerName: "$_id",
          totalWickets: 1,
          totalRunsConceded: 1,
          totalBallsBowled: 1,
        },
      },
      {
        $sort: { totalWickets: -1, totalRunsConceded: 1 },
      },
    ]);

    const stats = buildBowlingStatsFromDeliveries(statsByBowler);

    res.json({
      status: "success",
      results: stats.length,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching bowling stats",
      error: error.message,
    });
  }
};

// ── UPDATED specificBowlerStats function ─────────────────────
// Replace this function in your playerAnalytics.js controller.
// The only change: adds dotBalls + dotBallPercent + category to the response.

export const specificBowlerStats = async (req, res) => {
  try {
    const playerName = decodeURIComponent(req.params.playerName);

    const statsByBowler = await Delivery.aggregate([
      { $match: { bowler: playerName } },
      {
        $group: {
          _id: "$bowler",
          totalWickets: { $sum: "$bowler_wicket" },
          totalRunsConceded: { $sum: "$runs_bowler" },
          totalBallsBowled: {
            $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] },
          },
          // ← NEW: count dot balls for BowlingMetricsChart
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
      {
        $project: {
          _id: 0,
          playerName: "$_id",
          totalWickets: 1,
          totalRunsConceded: 1,
          totalBallsBowled: 1,
          dotBalls: 1,
        },
      },
    ]);

    if (!statsByBowler.length) {
      return res.status(404).json({ message: "Bowler not found" });
    }

    const row = statsByBowler[0];
    const totalWickets = row.totalWickets || 0;
    const totalBallsBowled = row.totalBallsBowled || 0;
    const totalRunsConceded = row.totalRunsConceded || 0;
    const dotBalls = row.dotBalls || 0;

    const bowlingEconomyRate =
      totalBallsBowled > 0 ? (totalRunsConceded / totalBallsBowled) * 6 : 0;
    const bowlingAverage =
      totalWickets > 0 ? totalRunsConceded / totalWickets : totalRunsConceded;
    const bowlingStrikeRate =
      totalWickets > 0 ? totalBallsBowled / totalWickets : 0;
    // ← NEW: percentage of dot balls
    const dotBallPercent =
      totalBallsBowled > 0 ? (dotBalls / totalBallsBowled) * 100 : 0;

    res.json({
      status: "success",
      data: {
        playerName: row.playerName,
        category: "Bowling Profile", // ← used by badge in BowlingStats
        totalWickets,
        totalRunsConceded,
        totalBallsBowled,
        bowlingAverage,
        bowlingEconomyRate,
        bowlingStrikeRate,
        dotBalls,
        dotBallPercent, // ← NEW field
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching bowler stats",
      error: error.message,
    });
  }
};
export const teamLeaderboard = async (req, res) => {
  try {
    const matches = await Delivery.aggregate([
      {
        $group: {
          _id: "$match_id",
          team1: { $first: "$batting_team" },
          team2: { $first: "$bowling_team" },
          winner: { $first: "$match_won_by" },
        },
      },
    ]);

    const teamStats = {};

    matches.forEach((match) => {
      const { team1, team2, winner } = match;

      if (!teamStats[team1]) {
        teamStats[team1] = { matches: 0, wins: 0 };
      }
      if (!teamStats[team2]) {
        teamStats[team2] = { matches: 0, wins: 0 };
      }

      teamStats[team1].matches++;
      teamStats[team2].matches++;

      if (winner && teamStats[winner]) {
        teamStats[winner].wins++;
      }
    });

    const result = Object.keys(teamStats).map((team) => {
      const matches = teamStats[team].matches;
      const wins = teamStats[team].wins;
      const losses = matches - wins;
      const winRate = matches > 0 ? (wins / matches) * 100 : 0;

      return {
        teamName: team,
        matchesPlayed: matches,
        totalWins: wins,
        losses,
        winRate,
      };
    });

    result.sort(
      (a, b) =>
        b.totalWins - a.totalWins ||
        b.winRate - a.winRate ||
        a.teamName.localeCompare(b.teamName),
    );

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);

    res.status(500).json({
      message: "Error fetching leaderboard",
      error: error.message,
    });
  }
};

const buildBattingStatsFromDeliveries = (rows) => {
  return rows.map((row) => {
    const totalRuns = row.totalRuns || 0;
    const totalBalls = row.totalBalls || 0;

    const strikeRate = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;
    const battingAverage = totalBalls > 0 ? totalRuns / row.innings : 0;

    return {
      playerName: row._id,
      totalRuns,
      totalBalls,
      strikeRate,
      battingAverage,
      innings: row.innings || 0,
      score: row.maxScore || 0,
      category: "Batsman",
    };
  });
};

export const getBattingStats = async (req, res) => {
  try {
    const statsByBatter = await Delivery.aggregate([
      {
        $match: { batter: { $exists: true, $ne: null } },
      },
      {
        $group: {
          _id: "$batter",
          totalRuns: { $sum: "$runs_batter" },
          totalBalls: { $sum: 1 },
          innings: { $sum: 1 },
          maxScore: { $max: "$runs_batter" },
        },
      },
      {
        $sort: { totalRuns: -1 },
      },
    ]);

    const stats = buildBattingStatsFromDeliveries(statsByBatter);

    res.json({
      status: "success",
      results: stats.length,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching batting stats",
      error: error.message,
    });
  }
};

export const specificBatterStats = async (req, res) => {
  try {
    const playerName = decodeURIComponent(req.params.playerName);

    const statsByBatter = await Delivery.aggregate([
      {
        $match: { batter: playerName },
      },
      {
        $group: {
          _id: "$batter",
          totalRuns: { $sum: "$runs_batter" },
          totalBalls: { $sum: 1 },
          innings: { $sum: 1 },
          maxScore: { $max: "$runs_batter" },
        },
      },
    ]);

    if (!statsByBatter.length) {
      return res.status(404).json({
        message: "Batsman not found",
      });
    }

    const playerStats = buildBattingStatsFromDeliveries(statsByBatter)[0];

    res.json({
      status: "success",
      data: playerStats,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching batsman stats",
      error: error.message,
    });
  }
};



export const getPlayerFullStats = async (req, res) => {
  try {
    const playerName = decodeURIComponent(req.params.playerName);

    // BATTING DATA (IPL + User)
    const [battingOverallIPL, battingOverallUser, battingPhasesIPL, battingPhasesUser] = await Promise.all([
      Delivery.aggregate([
        { $match: { batter: playerName } },
        {
          $group: {
            _id: null,
            totalRuns: { $sum: "$runs_batter" },
            totalBalls: { $sum: 1 },
            dotBalls: { $sum: { $cond: [{ $eq: ["$runs_batter", 0] }, 1, 0] } },
            boundaryRuns: { $sum: { $cond: [{ $in: ["$runs_batter", [4, 6]] }, "$runs_batter", 0] } },
          },
        },
      ]),
      UserDelivery.aggregate([
        { $match: { batter: playerName } },
        {
          $group: {
            _id: null,
            totalRuns: { $sum: "$runs_batter" },
            totalBalls: { $sum: 1 },
            dotBalls: { $sum: { $cond: [{ $eq: ["$runs_batter", 0] }, 1, 0] } },
            boundaryRuns: { $sum: { $cond: [{ $in: ["$runs_batter", [4, 6]] }, "$runs_batter", 0] } },
          },
        },
      ]),
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
        { $group: { _id: "$phase", runs: { $sum: "$runs_batter" }, balls: { $sum: 1 } } },
      ]),
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
        { $group: { _id: "$phase", runs: { $sum: "$runs_batter" }, balls: { $sum: 1 } } },
      ]),
    ]);

    const bIPL = battingOverallIPL[0] || {};
    const bUser = battingOverallUser[0] || {};

    const totalRuns = (bIPL.totalRuns || 0) + (bUser.totalRuns || 0);
    const totalBalls = (bIPL.totalBalls || 0) + (bUser.totalBalls || 0);
    const dotBalls = (bIPL.dotBalls || 0) + (bUser.dotBalls || 0);
    const boundaryRuns = (bIPL.boundaryRuns || 0) + (bUser.boundaryRuns || 0);

    let battingStats = null;
    if (totalBalls > 0) {
      const combinedPhases = [...battingPhasesIPL, ...battingPhasesUser];
      const phaseOrder = ["Powerplay", "Middle", "Death"];
      const phaseStats = phaseOrder.map((phase) => {
        const matching = combinedPhases.filter((x) => x._id === phase);
        const r = matching.reduce((s, m) => s + (m.runs || 0), 0);
        const b = matching.reduce((s, m) => s + (m.balls || 0), 0);
        return {
          phase,
          strikeRate: b > 0 ? (r / b) * 100 : 0,
        };
      });

      battingStats = {
        totalRuns,
        totalBalls,
        strikeRate: (totalRuns / totalBalls) * 100,
        dotBallPercent: (dotBalls / totalBalls) * 100,
        boundaryPercent: totalRuns > 0 ? (boundaryRuns / totalRuns) * 100 : 0,
        phaseStats,
      };
    }

    // BOWLING DATA (IPL + User)
    const [bowlingIPL, bowlingUser] = await Promise.all([
      Delivery.aggregate([
        { $match: { bowler: playerName } },
        {
          $group: {
            _id: null,
            totalWickets: { $sum: "$bowler_wicket" },
            totalRuns: { $sum: "$runs_bowler" },
            totalBalls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
            dotBalls: { $sum: { $cond: [{ $eq: ["$runs_bowler", 0] }, 1, 0] } },
          },
        },
      ]),
      UserDelivery.aggregate([
        { $match: { bowler: playerName } },
        {
          $group: {
            _id: null,
            totalWickets: { $sum: "$bowler_wicket" },
            totalRuns: { $sum: "$runs_bowler" },
            totalBalls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
            dotBalls: { $sum: { $cond: [{ $eq: ["$runs_bowler", 0] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const wIPL = bowlingIPL[0] || {};
    const wUser = bowlingUser[0] || {};

    const totalWickets = (wIPL.totalWickets || 0) + (wUser.totalWickets || 0);
    const totalRunsBowl = (wIPL.totalRuns || 0) + (wUser.totalRuns || 0);
    const totalBallsBowl = (wIPL.totalBalls || 0) + (wUser.totalBalls || 0);
    const dotBallsBowl = (wIPL.dotBalls || 0) + (wUser.dotBalls || 0);

    let bowlingStats = null;
    if (totalBallsBowl > 0) {
      bowlingStats = {
        totalWickets,
        economy: (totalRunsBowl / totalBallsBowl) * 6,
        strikeRate: totalWickets > 0 ? totalBallsBowl / totalWickets : 0,
        dotBallPercent: (dotBallsBowl / totalBallsBowl) * 100,
      };
    }

    // IMPACT SCORE
    let impactScore = 0;
    if (battingStats) {
      impactScore += battingStats.totalRuns * (battingStats.strikeRate / 100);
      impactScore -= battingStats.dotBallPercent;
    }
    if (bowlingStats) {
      impactScore += bowlingStats.totalWickets * 20;
    }

    res.json({
      status: "success",
      playerName,
      batting: battingStats || "No data available for batting",
      bowling: bowlingStats || "No data available for bowling",
      impactScore: impactScore.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching player full stats",
      error: error.message,
    });
  }
};
