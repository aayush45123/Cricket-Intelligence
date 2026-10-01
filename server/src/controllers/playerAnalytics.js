import Delivery from "../models/Deliveries.js";
import UserDelivery from "../models/UserDelivery.js";

// ── Helper: shape bowling aggregation rows into response objects ──────────────
const buildBowlingStatsFromDeliveries = (rows) => {
  return rows.map((row) => {
    const totalWickets = row.totalWickets || 0;
    const totalBallsBowled = row.totalBallsBowled || 0;
    const totalRunsConceded = row.totalRunsConceded || 0;
    const dotBalls = row.dotBalls || 0;

    return {
      playerName: row.playerName,
      totalWickets,
      totalRunsConceded,
      totalBallsBowled,
      overs: `${Math.floor(totalBallsBowled / 6)}.${totalBallsBowled % 6}`,
      bowlingEconomyRate:
        totalBallsBowled > 0
          ? parseFloat(((totalRunsConceded / totalBallsBowled) * 6).toFixed(2))
          : 0,
      bowlingAverage:
        totalWickets > 0
          ? parseFloat((totalRunsConceded / totalWickets).toFixed(2))
          : null,
      bowlingStrikeRate:
        totalWickets > 0
          ? parseFloat((totalBallsBowled / totalWickets).toFixed(2))
          : null,
      dotBalls,
      dotBallPercent:
        totalBallsBowled > 0
          ? parseFloat(((dotBalls / totalBallsBowled) * 100).toFixed(1))
          : 0,
    };
  });
};

// ── Top wicket takers (simple leaderboard) ────────────────────────────────────
export const getTopWicketTakers = async (req, res) => {
  try {
    const [iplBowlers, userBowlers] = await Promise.all([
      Delivery.aggregate([
        { $group: { _id: "$bowler", totalWickets: { $sum: "$bowler_wicket" } } },
      ]),
      UserDelivery.aggregate([
        {
          $group: {
            _id: "$bowler",
            totalWickets: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      "$isWicket",
                      { $ne: ["$wicketType", "run out"] },
                    ],
                  },
                  1,
                  { $ifNull: ["$bowler_wicket", 0] },
                ],
              },
            },
          },
        },
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

// ── Top run scorers (simple leaderboard) ─────────────────────────────────────
export const getTopRunScorer = async (req, res) => {
  try {
    const [iplScorers, userScorers] = await Promise.all([
      Delivery.aggregate([
        { $group: { _id: "$batter", totalRuns: { $sum: "$runs_batter" } } },
      ]),
      UserDelivery.aggregate([
        {
          $group: {
            _id: "$batter",
            totalRuns: { $sum: { $ifNull: ["$runs_batter", "$runsBatter"] } },
          },
        },
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

// ── List all distinct players ─────────────────────────────────────────────────
export const getAllPlayers = async (req, res) => {
  try {
    const [iplBatters, iplBowlers, userBatters, userBowlers] = await Promise.all([
      Delivery.distinct("batter"),
      Delivery.distinct("bowler"),
      UserDelivery.distinct("batter"),
      UserDelivery.distinct("bowler"),
    ]);

    const all = Array.from(
      new Set([...iplBatters, ...iplBowlers, ...userBatters, ...userBowlers])
    )
      .filter(Boolean)
      .sort();

    res.json({ status: "success", data: all });
  } catch (error) {
    res.status(500).json({ message: "Error fetching players", error: error.message });
  }
};

// ── Paginated bowling stats (all players) ─────────────────────────────────────
export const getBowlingStats = async (req, res) => {
  try {
    const { season, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const matchFilter = {};
    if (season) matchFilter.season = season;

    const pipeline = [
      ...(Object.keys(matchFilter).length ? [{ $match: matchFilter }] : []),
      {
        $group: {
          _id: "$bowler",
          totalWickets: { $sum: "$bowler_wicket" },
          totalRunsConceded: { $sum: "$runs_bowler" },
          totalBallsBowled: {
            $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] },
          },
          dotBalls: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$valid_ball", 1] }, { $eq: ["$runs_bowler", 0] }] },
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
      { $sort: { totalWickets: -1, totalRunsConceded: 1 } },
      { $skip: skip },
      { $limit: limitNum },
    ];

    const statsByBowler = await Delivery.aggregate(pipeline);
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

// ── Specific bowler profile ───────────────────────────────────────────────────
export const specificBowlerStats = async (req, res) => {
  try {
    const playerName = decodeURIComponent(req.params.playerName);
    const { season } = req.query;

    const matchFilter = { bowler: playerName };
    if (season) matchFilter.season = season;

    const statsByBowler = await Delivery.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$bowler",
          totalWickets: { $sum: "$bowler_wicket" },
          totalRunsConceded: { $sum: "$runs_bowler" },
          totalBallsBowled: {
            $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] },
          },
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
    const dotBallPercent =
      totalBallsBowled > 0 ? (dotBalls / totalBallsBowled) * 100 : 0;

    res.json({
      status: "success",
      data: {
        playerName: row.playerName,
        category: "Bowling Profile",
        totalWickets,
        totalRunsConceded,
        totalBallsBowled,
        bowlingAverage: parseFloat(bowlingAverage.toFixed(2)),
        bowlingEconomyRate: parseFloat(bowlingEconomyRate.toFixed(2)),
        bowlingStrikeRate: parseFloat(bowlingStrikeRate.toFixed(2)),
        dotBalls,
        dotBallPercent: parseFloat(dotBallPercent.toFixed(1)),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching bowler stats",
      error: error.message,
    });
  }
};

// ── Team leaderboard ──────────────────────────────────────────────────────────
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

      if (!teamStats[team1]) teamStats[team1] = { matches: 0, wins: 0 };
      if (!teamStats[team2]) teamStats[team2] = { matches: 0, wins: 0 };

      teamStats[team1].matches++;
      teamStats[team2].matches++;

      if (winner && teamStats[winner]) {
        teamStats[winner].wins++;
      }
    });

    const result = Object.keys(teamStats).map((team) => {
      const { matches, wins } = teamStats[team];
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
        a.teamName.localeCompare(b.teamName)
    );

    res.json({ status: "success", data: result });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({
      message: "Error fetching leaderboard",
      error: error.message,
    });
  }
};

// ── Helper: shape batting aggregation rows ────────────────────────────────────
const buildBattingStatsFromDeliveries = (rows) => {
  return rows.map((row) => {
    const totalRuns = row.totalRuns || 0;
    const totalBalls = row.totalBalls || 0;
    const innings = row.innings || 0;

    const strikeRate = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;
    const battingAverage = innings > 0 ? totalRuns / innings : 0;

    return {
      playerName: row._id,
      totalRuns,
      totalBalls,
      strikeRate: parseFloat(strikeRate.toFixed(2)),
      battingAverage: parseFloat(battingAverage.toFixed(2)),
      innings,
      score: row.maxScore || 0,
      category: "Batsman",
    };
  });
};

// ── Paginated batting stats (all players) ─────────────────────────────────────
export const getBattingStats = async (req, res) => {
  try {
    const statsByBatter = await Delivery.aggregate([
      { $match: { batter: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$batter",
          totalRuns: { $sum: "$runs_batter" },
          totalBalls: { $sum: 1 },
          innings: { $sum: 1 },
          maxScore: { $max: "$runs_batter" },
        },
      },
      { $sort: { totalRuns: -1 } },
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

// ── Specific batter profile ───────────────────────────────────────────────────
export const specificBatterStats = async (req, res) => {
  try {
    const playerName = decodeURIComponent(req.params.playerName);
    const { season } = req.query;

    const matchFilter = { batter: playerName };
    if (season) matchFilter.season = season;

    const statsByBatter = await Delivery.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$batter",
          totalRuns: { $sum: "$runs_batter" },
          totalBalls: { $sum: 1 },
          totalDismissals: { $sum: "$player_dismissed" },
          totalDotBalls: {
            $sum: { $cond: [{ $eq: ["$runs_batter", 0] }, 1, 0] },
          },
          highScore: { $max: "$runs_batter" },
          innings: { $sum: 1 },
        },
      },
    ]);

    if (!statsByBatter.length) {
      return res.status(404).json({ message: "Batsman not found" });
    }

    const b = statsByBatter[0];
    const strikeRate =
      b.totalBalls > 0
        ? parseFloat(((b.totalRuns / b.totalBalls) * 100).toFixed(2))
        : 0;
    const battingAverage =
      b.totalDismissals > 0
        ? parseFloat((b.totalRuns / b.totalDismissals).toFixed(2))
        : b.totalRuns;
    const dotBallPercent =
      b.totalBalls > 0
        ? parseFloat(((b.totalDotBalls / b.totalBalls) * 100).toFixed(1))
        : 0;

    res.json({
      status: "success",
      data: {
        playerName: b._id,
        category: "Batting Profile",
        totalRuns: b.totalRuns,
        totalBalls: b.totalBalls,
        innings: b.innings,
        highScore: b.highScore,
        totalDismissals: b.totalDismissals,
        strikeRate,
        battingAverage,
        dotBallPercent,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching batsman stats",
      error: error.message,
    });
  }
};

// ── Full player profile (batting + bowling combined) ─────────────────────────
export const getPlayerFullStats = async (req, res) => {
  try {
    const playerName = decodeURIComponent(req.params.playerName);
    const { season } = req.query;

    const batterFilter = { batter: playerName };
    const bowlerFilter = { bowler: playerName };
    if (season) {
      batterFilter.season = season;
      bowlerFilter.season = season;
    }

    const phaseAddFields = {
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
    };

    const [battingOverallIPL, battingOverallUser, battingPhasesIPL, battingPhasesUser] =
      await Promise.all([
        // Overall batting (IPL)
        Delivery.aggregate([
          { $match: batterFilter },
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
            },
          },
        ]),
        // Overall batting (User)
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
            },
          },
        ]),
        // Phase batting (IPL)
        Delivery.aggregate([
          { $match: batterFilter },
          phaseAddFields,
          { $group: { _id: "$phase", runs: { $sum: "$runs_batter" }, balls: { $sum: 1 } } },
        ]),
        // Phase batting (User)
        UserDelivery.aggregate([
          { $match: { batter: playerName } },
          phaseAddFields,
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
          runs: r,
          balls: b,
          strikeRate: b > 0 ? parseFloat(((r / b) * 100).toFixed(1)) : 0,
        };
      });

      battingStats = {
        totalRuns,
        totalBalls,
        strikeRate: parseFloat(((totalRuns / totalBalls) * 100).toFixed(2)),
        dotBallPercent: parseFloat(((dotBalls / totalBalls) * 100).toFixed(1)),
        boundaryPercent:
          totalRuns > 0
            ? parseFloat(((boundaryRuns / totalRuns) * 100).toFixed(1))
            : 0,
        phaseStats,
      };
    }

    // BOWLING DATA (IPL + User)
    const [bowlingIPL, bowlingUser] = await Promise.all([
      Delivery.aggregate([
        { $match: bowlerFilter },
        {
          $group: {
            _id: null,
            totalWickets: { $sum: "$bowler_wicket" },
            totalRunsBowled: { $sum: "$runs_bowler" },
            totalBallsBowled: {
              $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] },
            },
            dotBalls: {
              $sum: { $cond: [{ $eq: ["$runs_bowler", 0] }, 1, 0] },
            },
          },
        },
      ]),
      UserDelivery.aggregate([
        { $match: { bowler: playerName } },
        {
          $group: {
            _id: null,
            totalWickets: { $sum: "$bowler_wicket" },
            totalRunsBowled: { $sum: "$runs_bowler" },
            totalBallsBowled: {
              $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] },
            },
            dotBalls: {
              $sum: { $cond: [{ $eq: ["$runs_bowler", 0] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const bwIPL = bowlingIPL[0] || {};
    const bwUser = bowlingUser[0] || {};

    const totalWickets = (bwIPL.totalWickets || 0) + (bwUser.totalWickets || 0);
    const totalRunsBowl = (bwIPL.totalRunsBowled || 0) + (bwUser.totalRunsBowled || 0);
    const totalBallsBowl = (bwIPL.totalBallsBowled || 0) + (bwUser.totalBallsBowled || 0);
    const dotBallsBowl = (bwIPL.dotBalls || 0) + (bwUser.dotBalls || 0);

    let bowlingStats = null;
    if (totalBallsBowl > 0) {
      bowlingStats = {
        totalWickets,
        totalRunsBowled: totalRunsBowl,
        totalBallsBowled: totalBallsBowl,
        economy: parseFloat(((totalRunsBowl / totalBallsBowl) * 6).toFixed(2)),
        strikeRate:
          totalWickets > 0
            ? parseFloat((totalBallsBowl / totalWickets).toFixed(2))
            : null,
        dotBallPercent: parseFloat(
          ((dotBallsBowl / totalBallsBowl) * 100).toFixed(1)
        ),
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
      success: true,
      playerName,
      batting: battingStats || "No data available for batting",
      bowling: bowlingStats || "No data available for bowling",
      impactScore: parseFloat(impactScore.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching player full stats",
      error: error.message,
    });
  }
};
