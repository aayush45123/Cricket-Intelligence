import Delivery from "../models/Deliveries.js";

/* ─────────────────────────────────────────────────────────────
   GET /api/strategy/teams
   All distinct teams for the listing page
   ───────────────────────────────────────────────────────────── */
export const getAllTeams = async (req, res) => {
  try {
    const teams = await Delivery.aggregate([
      {
        $group: {
          _id: "$batting_team",
          matches: { $addToSet: "$match_id" },
          totalRuns: { $sum: "$runs_total" },
          totalWins: {
            $sum: {
              $cond: [{ $eq: ["$batting_team", "$match_won_by"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          teamName: "$_id",
          totalMatches: { $size: "$matches" },
          totalRuns: 1,
          totalWins: 1,
        },
      },
      { $sort: { totalWins: -1 } },
    ]);

    res.json({ status: "success", data: teams });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching teams", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/strategy/:team
   Full strategy analytics for one team
   ───────────────────────────────────────────────────────────── */
export const getTeamStrategy = async (req, res) => {
  try {
    const team = decodeURIComponent(req.params.team);

    const [
      battingOrderRaw,
      phaseRaw,
      bowlerComboRaw,
      bowlerPhaseRaw,
      winLossRaw,
      tossRaw,
      overTimeRaw,
    ] = await Promise.all([
      /* 1. Batting order — runs + SR by bat_pos (position 1-11) */
      Delivery.aggregate([
        { $match: { batting_team: team } },
        {
          $group: {
            _id: "$bat_pos",
            runs: { $sum: "$runs_batter" },
            balls: { $sum: 1 },
            fours: { $sum: { $cond: [{ $eq: ["$runs_batter", 4] }, 1, 0] } },
            sixes: { $sum: { $cond: [{ $eq: ["$runs_batter", 6] }, 1, 0] } },
            topScorers: {
              $push: { batter: "$batter", runs: "$runs_batter" },
            },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 11 },
        {
          $project: {
            _id: 0,
            position: "$_id",
            runs: 1,
            balls: 1,
            fours: 1,
            sixes: 1,
            strikeRate: {
              $cond: [
                { $gt: ["$balls", 0] },
                { $multiply: [{ $divide: ["$runs", "$balls"] }, 100] },
                0,
              ],
            },
          },
        },
      ]),

      /* 2. Phase performance (batting) */
      Delivery.aggregate([
        { $match: { batting_team: team } },
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
            runs: { $sum: "$runs_total" },
            balls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
            wickets: { $sum: "$bowler_wicket" },
            boundaries: {
              $sum: { $cond: [{ $in: ["$runs_batter", [4, 6]] }, 1, 0] },
            },
            dotBalls: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$valid_ball", 1] },
                      { $eq: ["$runs_batter", 0] },
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

      /* 3. Best bowling combinations — top bowler pairs by wickets */
      Delivery.aggregate([
        { $match: { bowling_team: team } },
        {
          $group: {
            _id: { match: "$match_id", bowler: "$bowler" },
            wickets: { $sum: "$bowler_wicket" },
            runs: { $sum: "$runs_bowler" },
            balls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
          },
        },
        {
          $group: {
            _id: "$_id.bowler",
            totalWickets: { $sum: "$wickets" },
            totalRuns: { $sum: "$runs" },
            totalBalls: { $sum: "$balls" },
            matches: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            bowler: "$_id",
            totalWickets: 1,
            totalRuns: 1,
            totalBalls: 1,
            matches: 1,
            economy: {
              $cond: [
                { $gt: ["$totalBalls", 0] },
                { $multiply: [{ $divide: ["$totalRuns", "$totalBalls"] }, 6] },
                0,
              ],
            },
            strikeRate: {
              $cond: [
                { $gt: ["$totalWickets", 0] },
                { $divide: ["$totalBalls", "$totalWickets"] },
                0,
              ],
            },
          },
        },
        { $sort: { totalWickets: -1 } },
        { $limit: 10 },
      ]),

      /* 4. Bowling phase performance */
      Delivery.aggregate([
        { $match: { bowling_team: team } },
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
            runs: { $sum: "$runs_bowler" },
            balls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
            wickets: { $sum: "$bowler_wicket" },
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

      /* 5. Win / loss summary */
      Delivery.aggregate([
        { $match: { $or: [{ batting_team: team }, { bowling_team: team }] } },
        {
          $group: {
            _id: "$match_id",
            winner: { $first: "$match_won_by" },
            batting: { $first: "$batting_team" },
            bowling: { $first: "$bowling_team" },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            wins: { $sum: { $cond: [{ $eq: ["$winner", team] }, 1, 0] } },
          },
        },
      ]),

      /* 6. Toss impact */
      Delivery.aggregate([
        { $match: { $or: [{ batting_team: team }, { bowling_team: team }] } },
        {
          $group: {
            _id: "$match_id",
            tossWinner: { $first: "$toss_winner" },
            tossDecision: { $first: "$toss_decision" },
            winner: { $first: "$match_won_by" },
          },
        },
        {
          $group: {
            _id: null,
            tossWon: {
              $sum: { $cond: [{ $eq: ["$tossWinner", team] }, 1, 0] },
            },
            tossWonMatchWon: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$tossWinner", team] },
                      { $eq: ["$winner", team] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            batFirst: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$tossWinner", team] },
                      { $eq: ["$tossDecision", "bat"] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            fieldFirst: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$tossWinner", team] },
                      { $eq: ["$tossDecision", "field"] },
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

      /* 7. Run rate over time (avg runs per over across all matches) */
      Delivery.aggregate([
        { $match: { batting_team: team } },
        {
          $group: {
            _id: "$over",
            runs: { $sum: "$runs_total" },
            balls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
            matches: { $addToSet: "$match_id" },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 20 },
        {
          $project: {
            _id: 0,
            over: { $add: ["$_id", 1] },
            runs: 1,
            balls: 1,
            matchCount: { $size: "$matches" },
            avgRuns: {
              $cond: [
                { $gt: [{ $size: "$matches" }, 0] },
                { $divide: ["$runs", { $size: "$matches" }] },
                0,
              ],
            },
            runRate: {
              $cond: [
                { $gt: ["$balls", 0] },
                { $multiply: [{ $divide: ["$runs", "$balls"] }, 6] },
                0,
              ],
            },
          },
        },
      ]),
    ]);

    /* ── Post-process phase data ──────────────────────────────── */
    const phaseOrder = ["Powerplay", "Middle", "Death"];

    const battingPhases = phaseOrder.map((phase) => {
      const p = phaseRaw.find((x) => x._id === phase) || {
        runs: 0,
        balls: 0,
        wickets: 0,
        boundaries: 0,
        dotBalls: 0,
      };
      return {
        phase,
        runs: p.runs,
        balls: p.balls,
        wickets: p.wickets,
        boundaries: p.boundaries,
        dotBalls: p.dotBalls,
        runRate:
          p.balls > 0 ? parseFloat(((p.runs / p.balls) * 6).toFixed(2)) : 0,
        dotPct:
          p.balls > 0
            ? parseFloat(((p.dotBalls / p.balls) * 100).toFixed(1))
            : 0,
      };
    });

    const bowlingPhases = phaseOrder.map((phase) => {
      const p = bowlerPhaseRaw.find((x) => x._id === phase) || {
        runs: 0,
        balls: 0,
        wickets: 0,
        dotBalls: 0,
      };
      return {
        phase,
        runs: p.runs,
        balls: p.balls,
        wickets: p.wickets,
        dotBalls: p.dotBalls,
        economy:
          p.balls > 0 ? parseFloat(((p.runs / p.balls) * 6).toFixed(2)) : 0,
        dotPct:
          p.balls > 0
            ? parseFloat(((p.dotBalls / p.balls) * 100).toFixed(1))
            : 0,
      };
    });

    /* ── Win/loss ────────────────────────────────────────────── */
    const wl = winLossRaw[0] || { total: 0, wins: 0 };
    const losses = wl.total - wl.wins;
    const winRate =
      wl.total > 0 ? parseFloat(((wl.wins / wl.total) * 100).toFixed(1)) : 0;

    /* ── Toss ────────────────────────────────────────────────── */
    const toss = tossRaw[0] || {
      tossWon: 0,
      tossWonMatchWon: 0,
      batFirst: 0,
      fieldFirst: 0,
    };

    /* ── Batting order — round floats ────────────────────────── */
    const battingOrder = battingOrderRaw.map((b) => ({
      ...b,
      strikeRate: parseFloat((b.strikeRate || 0).toFixed(1)),
    }));

    res.json({
      status: "success",
      data: {
        team,
        summary: {
          totalMatches: wl.total,
          wins: wl.wins,
          losses,
          winRate,
        },
        toss: {
          tossWon: toss.tossWon,
          tossWonMatchWon: toss.tossWonMatchWon,
          winPctAfterToss:
            toss.tossWon > 0
              ? parseFloat(
                  ((toss.tossWonMatchWon / toss.tossWon) * 100).toFixed(1),
                )
              : 0,
          preferBatFirst: toss.batFirst >= toss.fieldFirst,
          batFirstCount: toss.batFirst,
          fieldFirstCount: toss.fieldFirst,
        },
        battingOrder,
        battingPhases,
        bowlingCombination: bowlerComboRaw.map((b) => ({
          ...b,
          economy: parseFloat((b.economy || 0).toFixed(2)),
          strikeRate: parseFloat((b.strikeRate || 0).toFixed(2)),
        })),
        bowlingPhases,
        runRateByOver: overTimeRaw.map((o) => ({
          ...o,
          avgRuns: parseFloat((o.avgRuns || 0).toFixed(1)),
          runRate: parseFloat((o.runRate || 0).toFixed(2)),
        })),
      },
    });
  } catch (err) {
    console.error("getTeamStrategy error:", err);
    res
      .status(500)
      .json({ message: "Error fetching team strategy", error: err.message });
  }
};
