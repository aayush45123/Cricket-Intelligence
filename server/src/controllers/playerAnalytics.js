import Delivery from "../models/Deliveries.js";

/*
 * BOWLING FORMULAS (interview-ready):
 *
 * Economy Rate = (runs conceded / valid balls bowled) × 6
 *   How many runs per over a bowler concedes on average.
 *
 * Bowling Average = total runs conceded / total wickets
 *   Runs given up per wicket — lower is better.
 *
 * Bowling Strike Rate = valid balls bowled / total wickets
 *   How many balls between each wicket — lower is better.
 *
 * Dot Ball % = (dot balls / valid balls) × 100
 *   Percentage of balls where batter scores 0 — measures control.
 */

const buildBowlingStats = (rows) =>
  rows.map((row) => {
    const totalWickets = row.totalWickets || 0;
    const totalBalls = row.totalBallsBowled || 0;
    const totalRuns = row.totalRunsConceded || 0;
    const dotBalls = row.dotBalls || 0;

    return {
      playerName: row.playerName,
      totalWickets,
      totalRunsConceded: totalRuns,
      totalBallsBowled: totalBalls,
      overs: `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`,
      bowlingEconomyRate:
        totalBalls > 0 ? parseFloat(((totalRuns / totalBalls) * 6).toFixed(2)) : 0,
      bowlingAverage:
        totalWickets > 0
          ? parseFloat((totalRuns / totalWickets).toFixed(2))
          : null, // null = no wickets taken yet
      bowlingStrikeRate:
        totalWickets > 0
          ? parseFloat((totalBalls / totalWickets).toFixed(2))
          : null,
      dotBalls,
      dotBallPercent:
        totalBalls > 0
          ? parseFloat(((dotBalls / totalBalls) * 100).toFixed(1))
          : 0,
    };
  });

/* ── Top wicket takers (IPL dataset) ─────────────────────── */
export const getTopWicketTakers = async (req, res) => {
  try {
    const topBowlers = await Delivery.aggregate([
      {
        $group: {
          _id: "$bowler",
          totalWickets: { $sum: "$bowler_wicket" },
          totalBallsBowled: {
            $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] },
          },
          totalRunsConceded: { $sum: "$runs_bowler" },
        },
      },
      { $sort: { totalWickets: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          playerName: "$_id",
          totalWickets: 1,
          totalBallsBowled: 1,
          totalRunsConceded: 1,
        },
      },
    ]);

    res.json({ status: "success", data: buildBowlingStats(topBowlers) });
  } catch (error) {
    console.error("getTopWicketTakers error:", error.message);
    res.status(500).json({ message: "Error fetching top wicket takers", error: error.message });
  }
};

/* ── Top run scorers (IPL dataset) ───────────────────────── */
export const getTopRunScorer = async (req, res) => {
  try {
    const topBatters = await Delivery.aggregate([
      /* Only count valid deliveries for balls faced */
      {
        $group: {
          _id: "$batter",
          totalRuns: { $sum: "$runs_batter" },
          totalBalls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
        },
      },
      { $sort: { totalRuns: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          playerName: "$_id",
          totalRuns: 1,
          totalBalls: 1,
          strikeRate: {
            $cond: [
              { $gt: ["$totalBalls", 0] },
              { $round: [{ $multiply: [{ $divide: ["$totalRuns", "$totalBalls"] }, 100] }, 2] },
              0,
            ],
          },
        },
      },
    ]);

    res.json({ status: "success", data: topBatters });
  } catch (error) {
    console.error("getTopRunScorer error:", error.message);
    res.status(500).json({ message: "Error fetching top run scorers", error: error.message });
  }
};

/* ── All bowling stats ─────────────────────────────────────── */
export const getBowlingStats = async (req, res) => {
  try {
    const statsByBowler = await Delivery.aggregate([
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
      { $sort: { totalWickets: -1, totalRunsConceded: 1 } },
    ]);

    const stats = buildBowlingStats(statsByBowler);
    res.json({ status: "success", results: stats.length, data: stats });
  } catch (error) {
    console.error("getBowlingStats error:", error.message);
    res.status(500).json({ message: "Error fetching bowling stats", error: error.message });
  }
};

/* ── Specific bowler stats ─────────────────────────────────── */
export const specificBowlerStats = async (req, res) => {
  try {
    const playerName = decodeURIComponent(req.params.playerName);

    const [stats] = await Delivery.aggregate([
      { $match: { bowler: playerName } },
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

    if (!stats) {
      return res.status(404).json({ message: "Bowler not found" });
    }

    const [built] = buildBowlingStats([stats]);
    res.json({
      status: "success",
      data: { ...built, category: "Bowling Profile" },
    });
  } catch (error) {
    console.error("specificBowlerStats error:", error.message);
    res.status(500).json({ message: "Error fetching bowler stats", error: error.message });
  }
};

/* ── Team leaderboard (from IPL deliveries) ────────────────── */
export const teamLeaderboard = async (req, res) => {
  try {
    const matchLevel = await Delivery.aggregate([
      {
        $group: {
          _id: "$match_id",
          battingTeam: { $first: "$batting_team" },
          bowlingTeam: { $first: "$bowling_team" },
          winner: { $first: "$match_won_by" },
        },
      },
    ]);

    const teamStats = {};

    matchLevel.forEach(({ battingTeam, bowlingTeam, winner }) => {
      [battingTeam, bowlingTeam].forEach((team) => {
        if (!team) return;
        if (!teamStats[team]) teamStats[team] = { matches: 0, wins: 0 };
      });
      if (battingTeam) teamStats[battingTeam].matches++;
      if (bowlingTeam) teamStats[bowlingTeam].matches++;
      if (winner && teamStats[winner]) teamStats[winner].wins++;
    });

    const result = Object.entries(teamStats)
      .map(([teamName, s]) => {
        const losses = s.matches - s.wins;
        const winRate = s.matches > 0 ? parseFloat(((s.wins / s.matches) * 100).toFixed(1)) : 0;
        return { teamName, matchesPlayed: s.matches, totalWins: s.wins, losses, winRate };
      })
      .sort((a, b) => b.totalWins - a.totalWins || b.winRate - a.winRate);

    res.json({ status: "success", data: result });
  } catch (error) {
    console.error("teamLeaderboard error:", error.message);
    res.status(500).json({ message: "Error fetching leaderboard", error: error.message });
  }
};

/*
 * BATTING FORMULAS (interview-ready):
 *
 * Strike Rate = (runs / valid balls faced) × 100
 *   Runs scored per 100 deliveries — key T20 metric.
 *
 * Batting Average = total runs / total dismissals
 *   Runs between each dismissal — higher is better.
 *   NOTE: We compute this from delivery-level data where each match+innings
 *   constitutes one appearance. We count bowler_wicket events as dismissals.
 *
 * Innings High Score = maximum runs scored in a single match innings
 *   Computed by first grouping deliveries by (batter, match_id, innings)
 *   then taking the max of that grouped sum.
 *
 * Dot Ball % = (dot balls / valid balls) × 100
 *   Percentage of balls faced where batter scores 0.
 *
 * Boundary % = (4s×4 + 6s×6) / total runs × 100
 *   Proportion of runs coming from boundaries.
 */

/* ── All batting stats ─────────────────────────────────────── */
export const getBattingStats = async (req, res) => {
  try {
    /*
     * Step 1: group by (batter, match_id, innings) to get per-innings score.
     * Step 2: group by batter to compute career totals.
     * This gives us: correct ball count (valid only), correct dismissal count,
     * and correct innings high score.
     */
    const statsByBatter = await Delivery.aggregate([
      {
        $group: {
          _id: {
            batter: "$batter",
            match_id: "$match_id",
            innings: "$innings",
          },
          inningsRuns: { $sum: "$runs_batter" },
          inningsBalls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
          dismissed: {
            $sum: { $cond: [{ $eq: ["$bowler_wicket", 1] }, 1, 0] },
          },
          dotBalls: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$valid_ball", 1] }, { $eq: ["$runs_batter", 0] }] },
                1,
                0,
              ],
            },
          },
          fours: { $sum: { $cond: [{ $eq: ["$runs_batter", 4] }, 1, 0] } },
          sixes: { $sum: { $cond: [{ $eq: ["$runs_batter", 6] }, 1, 0] } },
        },
      },
      /* Step 2: career totals per batter */
      {
        $group: {
          _id: "$_id.batter",
          totalRuns: { $sum: "$inningsRuns" },
          totalBalls: { $sum: "$inningsBalls" },
          totalDismissals: { $sum: "$dismissed" },
          totalInnings: { $sum: 1 },
          highScore: { $max: "$inningsRuns" },
          totalDotBalls: { $sum: "$dotBalls" },
          totalFours: { $sum: "$fours" },
          totalSixes: { $sum: "$sixes" },
        },
      },
      { $sort: { totalRuns: -1 } },
      {
        $project: {
          _id: 0,
          playerName: "$_id",
          totalRuns: 1,
          totalBalls: 1,
          totalInnings: 1,
          totalDismissals: 1,
          highScore: 1,
          totalFours: 1,
          totalSixes: 1,
          strikeRate: {
            $cond: [
              { $gt: ["$totalBalls", 0] },
              { $round: [{ $multiply: [{ $divide: ["$totalRuns", "$totalBalls"] }, 100] }, 2] },
              0,
            ],
          },
          battingAverage: {
            $cond: [
              { $gt: ["$totalDismissals", 0] },
              { $round: [{ $divide: ["$totalRuns", "$totalDismissals"] }, 2] },
              "$totalRuns", // not out all innings — average = total runs
            ],
          },
          dotBallPercent: {
            $cond: [
              { $gt: ["$totalBalls", 0] },
              { $round: [{ $multiply: [{ $divide: ["$totalDotBalls", "$totalBalls"] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
    ]);

    res.json({ status: "success", results: statsByBatter.length, data: statsByBatter });
  } catch (error) {
    console.error("getBattingStats error:", error.message);
    res.status(500).json({ message: "Error fetching batting stats", error: error.message });
  }
};

/* ── Specific batter stats ─────────────────────────────────── */
export const specificBatterStats = async (req, res) => {
  try {
    const playerName = decodeURIComponent(req.params.playerName);

    const perInnings = await Delivery.aggregate([
      { $match: { batter: playerName } },
      {
        $group: {
          _id: { match_id: "$match_id", innings: "$innings" },
          inningsRuns: { $sum: "$runs_batter" },
          inningsBalls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
          dismissed: { $sum: { $cond: [{ $eq: ["$bowler_wicket", 1] }, 1, 0] } },
          dotBalls: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$valid_ball", 1] }, { $eq: ["$runs_batter", 0] }] },
                1,
                0,
              ],
            },
          },
          fours: { $sum: { $cond: [{ $eq: ["$runs_batter", 4] }, 1, 0] } },
          sixes: { $sum: { $cond: [{ $eq: ["$runs_batter", 6] }, 1, 0] } },
        },
      },
      {
        $group: {
          _id: null,
          totalRuns: { $sum: "$inningsRuns" },
          totalBalls: { $sum: "$inningsBalls" },
          totalDismissals: { $sum: "$dismissed" },
          totalInnings: { $sum: 1 },
          highScore: { $max: "$inningsRuns" },
          totalDotBalls: { $sum: "$dotBalls" },
          totalFours: { $sum: "$fours" },
          totalSixes: { $sum: "$sixes" },
        },
      },
    ]);

    if (!perInnings.length) {
      return res.status(404).json({ message: "Batsman not found" });
    }

    const b = perInnings[0];
    const strikeRate =
      b.totalBalls > 0 ? parseFloat(((b.totalRuns / b.totalBalls) * 100).toFixed(2)) : 0;
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
        playerName,
        totalRuns: b.totalRuns,
        totalBalls: b.totalBalls,
        totalInnings: b.totalInnings,
        totalDismissals: b.totalDismissals,
        highScore: b.highScore,
        totalFours: b.totalFours,
        totalSixes: b.totalSixes,
        strikeRate,
        battingAverage,
        dotBallPercent,
        category: "Batsman",
      },
    });
  } catch (error) {
    console.error("specificBatterStats error:", error.message);
    res.status(500).json({ message: "Error fetching batsman stats", error: error.message });
  }
};

/* ── All players (distinct names) ─────────────────────────── */
export const getAllPlayers = async (req, res) => {
  try {
    const [batters, bowlers] = await Promise.all([
      Delivery.distinct("batter"),
      Delivery.distinct("bowler"),
    ]);
    const players = [...new Set([...batters, ...bowlers])].filter(Boolean).sort();
    res.json({ status: "success", total: players.length, data: players });
  } catch (error) {
    console.error("getAllPlayers error:", error.message);
    res.status(500).json({ message: "Error fetching players", error: error.message });
  }
};

/* ── Full player profile (batting + bowling + impact) ─────── */
export const getPlayerFullStats = async (req, res) => {
  try {
    const playerName = decodeURIComponent(req.params.playerName);

    const [battingPhases, battingOverall, bowling] = await Promise.all([
      /* Phase breakdown */
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
            balls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
            dotBalls: {
              $sum: {
                $cond: [{ $and: [{ $eq: ["$valid_ball", 1] }, { $eq: ["$runs_batter", 0] }] }, 1, 0],
              },
            },
            fours: { $sum: { $cond: [{ $eq: ["$runs_batter", 4] }, 1, 0] } },
            sixes: { $sum: { $cond: [{ $eq: ["$runs_batter", 6] }, 1, 0] } },
          },
        },
      ]),

      /* Overall batting (grouped by match+innings for correct averages) */
      Delivery.aggregate([
        { $match: { batter: playerName } },
        {
          $group: {
            _id: { match_id: "$match_id", innings: "$innings" },
            inningsRuns: { $sum: "$runs_batter" },
            inningsBalls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
            dismissed: { $sum: { $cond: [{ $eq: ["$bowler_wicket", 1] }, 1, 0] } },
            dotBalls: {
              $sum: {
                $cond: [{ $and: [{ $eq: ["$valid_ball", 1] }, { $eq: ["$runs_batter", 0] }] }, 1, 0],
              },
            },
            fours: { $sum: { $cond: [{ $eq: ["$runs_batter", 4] }, 1, 0] } },
            sixes: { $sum: { $cond: [{ $eq: ["$runs_batter", 6] }, 1, 0] } },
          },
        },
        {
          $group: {
            _id: null,
            totalRuns: { $sum: "$inningsRuns" },
            totalBalls: { $sum: "$inningsBalls" },
            totalDismissals: { $sum: "$dismissed" },
            highScore: { $max: "$inningsRuns" },
            totalDotBalls: { $sum: "$dotBalls" },
            boundaryRuns: {
              $sum: { $add: [{ $multiply: ["$fours", 4] }, { $multiply: ["$sixes", 6] }] },
            },
          },
        },
      ]),

      /* Bowling */
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
                  { $and: [{ $eq: ["$valid_ball", 1] }, { $eq: ["$runs_bowler", 0] }] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const b = battingOverall[0] || null;
    const bw = bowling[0] || null;

    let battingStats = null;
    if (b) {
      const sr = b.totalBalls > 0 ? (b.totalRuns / b.totalBalls) * 100 : 0;
      const dotPct = b.totalBalls > 0 ? (b.totalDotBalls / b.totalBalls) * 100 : 0;
      const bndPct = b.totalRuns > 0 ? (b.boundaryRuns / b.totalRuns) * 100 : 0;
      battingStats = {
        totalRuns: b.totalRuns,
        totalBalls: b.totalBalls,
        totalDismissals: b.totalDismissals,
        highScore: b.highScore,
        strikeRate: parseFloat(sr.toFixed(2)),
        battingAverage:
          b.totalDismissals > 0
            ? parseFloat((b.totalRuns / b.totalDismissals).toFixed(2))
            : b.totalRuns,
        dotBallPercent: parseFloat(dotPct.toFixed(1)),
        boundaryPercent: parseFloat(bndPct.toFixed(1)),
        phaseStats: ["Powerplay", "Middle", "Death"].map((phase) => {
          const p = battingPhases.find((x) => x._id === phase) || {
            runs: 0,
            balls: 0,
            dotBalls: 0,
            fours: 0,
            sixes: 0,
          };
          return {
            phase,
            runs: p.runs,
            balls: p.balls,
            fours: p.fours,
            sixes: p.sixes,
            strikeRate:
              p.balls > 0 ? parseFloat(((p.runs / p.balls) * 100).toFixed(1)) : 0,
            dotPct:
              p.balls > 0 ? parseFloat(((p.dotBalls / p.balls) * 100).toFixed(1)) : 0,
          };
        }),
      };
    }

    let bowlingStats = null;
    if (bw && bw.totalBalls > 0) {
      bowlingStats = {
        totalWickets: bw.totalWickets,
        totalBalls: bw.totalBalls,
        economy: parseFloat(((bw.totalRuns / bw.totalBalls) * 6).toFixed(2)),
        bowlingAverage:
          bw.totalWickets > 0
            ? parseFloat((bw.totalRuns / bw.totalWickets).toFixed(2))
            : null,
        strikeRate:
          bw.totalWickets > 0
            ? parseFloat((bw.totalBalls / bw.totalWickets).toFixed(2))
            : null,
        dotBallPercent: parseFloat(((bw.dotBalls / bw.totalBalls) * 100).toFixed(1)),
      };
    }

    /*
     * Impact Score formula (portfolio-defensible):
     *   batting contribution = totalRuns × (strikeRate / 100)
     *   bowling contribution = totalWickets × 20
     *   penalty = dotBallPercent (high dots for batting = negative pressure on team)
     * Scaled to give a meaningful ~0-1000 range for IPL players.
     */
    let impactScore = 0;
    if (battingStats) {
      impactScore += battingStats.totalRuns * (battingStats.strikeRate / 100);
      impactScore -= battingStats.dotBallPercent * 2;
    }
    if (bowlingStats) {
      impactScore += bowlingStats.totalWickets * 20;
    }

    res.json({
      status: "success",
      playerName,
      batting: battingStats || null,
      bowling: bowlingStats || null,
      impactScore: parseFloat(impactScore.toFixed(2)),
    });
  } catch (error) {
    console.error("getPlayerFullStats error:", error.message);
    res.status(500).json({ message: "Error fetching player full stats", error: error.message });
  }
};
