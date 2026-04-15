import Delivery from "../models/Deliveries.js";

/* ─────────────────────────────────────────────────────────────
   GET /api/search?q=&role=&team=&minSR=&maxSR=&minEco=&maxEco=&limit=
   Universal player search + filter
   ───────────────────────────────────────────────────────────── */
export const searchPlayers = async (req, res) => {
  try {
    const {
      q = "",
      role = "all", // "batter" | "bowler" | "allrounder" | "all"
      team = "",
      minSR = 0,
      maxSR = 999,
      minEco = 0,
      maxEco = 99,
      limit = 50,
    } = req.query;

    const nameRegex = q ? new RegExp(q, "i") : null;

    /* ── Batting stats per player ─────────────────────────── */
    const battingPipeline = [
      ...(nameRegex ? [{ $match: { batter: nameRegex } }] : []),
      ...(team ? [{ $match: { batting_team: new RegExp(team, "i") } }] : []),
      {
        $group: {
          _id: "$batter",
          totalRuns: { $sum: "$runs_batter" },
          totalBalls: { $sum: 1 },
          fours: { $sum: { $cond: [{ $eq: ["$runs_batter", 4] }, 1, 0] } },
          sixes: { $sum: { $cond: [{ $eq: ["$runs_batter", 6] }, 1, 0] } },
          dotBalls: { $sum: { $cond: [{ $eq: ["$runs_batter", 0] }, 1, 0] } },
          teams: { $addToSet: "$batting_team" },
          matches: { $addToSet: "$match_id" },
        },
      },
      {
        $project: {
          _id: 0,
          playerName: "$_id",
          totalRuns: 1,
          totalBalls: 1,
          fours: 1,
          sixes: 1,
          teams: 1,
          totalMatches: { $size: "$matches" },
          strikeRate: {
            $cond: [
              { $gt: ["$totalBalls", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$totalRuns", "$totalBalls"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          boundaryPercent: {
            $cond: [
              { $gt: ["$totalRuns", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $add: [
                              { $multiply: ["$fours", 4] },
                              { $multiply: ["$sixes", 6] },
                            ],
                          },
                          "$totalRuns",
                        ],
                      },
                      100,
                    ],
                  },
                  1,
                ],
              },
              0,
            ],
          },
          dotBallPercent: {
            $cond: [
              { $gt: ["$totalBalls", 0] },
              {
                $round: [
                  {
                    $multiply: [{ $divide: ["$dotBalls", "$totalBalls"] }, 100],
                  },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
    ];

    /* ── Bowling stats per player ─────────────────────────── */
    const bowlingPipeline = [
      ...(nameRegex ? [{ $match: { bowler: nameRegex } }] : []),
      ...(team ? [{ $match: { bowling_team: new RegExp(team, "i") } }] : []),
      {
        $group: {
          _id: "$bowler",
          totalWickets: { $sum: "$bowler_wicket" },
          totalBalls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
          totalRuns: { $sum: "$runs_bowler" },
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
          teams: { $addToSet: "$bowling_team" },
          matches: { $addToSet: "$match_id" },
        },
      },
      {
        $project: {
          _id: 0,
          playerName: "$_id",
          totalWickets: 1,
          totalBalls: 1,
          totalRuns: 1,
          teams: 1,
          totalMatches: { $size: "$matches" },
          economy: {
            $cond: [
              { $gt: ["$totalBalls", 0] },
              {
                $round: [
                  {
                    $multiply: [{ $divide: ["$totalRuns", "$totalBalls"] }, 6],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          bowlingStrikeRate: {
            $cond: [
              { $gt: ["$totalWickets", 0] },
              { $round: [{ $divide: ["$totalBalls", "$totalWickets"] }, 2] },
              0,
            ],
          },
          dotBallPercent: {
            $cond: [
              { $gt: ["$totalBalls", 0] },
              {
                $round: [
                  {
                    $multiply: [{ $divide: ["$dotBalls", "$totalBalls"] }, 100],
                  },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
    ];

    const [batters, bowlers] = await Promise.all([
      Delivery.aggregate(battingPipeline),
      Delivery.aggregate(bowlingPipeline),
    ]);

    /* ── Merge into unified player objects ────────────────── */
    const playerMap = {};

    batters.forEach((b) => {
      if (!playerMap[b.playerName])
        playerMap[b.playerName] = {
          playerName: b.playerName,
          teams: [],
          batting: null,
          bowling: null,
        };
      playerMap[b.playerName].batting = b;
      playerMap[b.playerName].teams = [
        ...new Set([...playerMap[b.playerName].teams, ...(b.teams || [])]),
      ];
    });

    bowlers.forEach((b) => {
      if (!playerMap[b.playerName])
        playerMap[b.playerName] = {
          playerName: b.playerName,
          teams: [],
          batting: null,
          bowling: null,
        };
      playerMap[b.playerName].bowling = b;
      playerMap[b.playerName].teams = [
        ...new Set([...playerMap[b.playerName].teams, ...(b.teams || [])]),
      ];
    });

    /* ── Assign role + apply filters ─────────────────────── */
    let results = Object.values(playerMap).map((p) => {
      const hasBat = !!p.batting;
      const hasBwl = !!p.bowling;
      const assignedRole =
        hasBat && hasBwl ? "All-Rounder" : hasBat ? "Batter" : "Bowler";
      return { ...p, role: assignedRole };
    });

    /* Role filter */
    if (role !== "all") {
      const roleMap = {
        batter: "Batter",
        bowler: "Bowler",
        allrounder: "All-Rounder",
      };
      const target = roleMap[role];
      if (target) results = results.filter((p) => p.role === target);
    }

    /* SR filter */
    const srMin = parseFloat(minSR);
    const srMax = parseFloat(maxSR);
    if (srMin > 0 || srMax < 999) {
      results = results.filter((p) => {
        if (!p.batting) return false;
        return p.batting.strikeRate >= srMin && p.batting.strikeRate <= srMax;
      });
    }

    /* Economy filter */
    const ecoMin = parseFloat(minEco);
    const ecoMax = parseFloat(maxEco);
    if (ecoMin > 0 || ecoMax < 99) {
      results = results.filter((p) => {
        if (!p.bowling) return false;
        return p.bowling.economy >= ecoMin && p.bowling.economy <= ecoMax;
      });
    }

    /* Sort: all-rounders first, then by total runs/wickets */
    results.sort((a, b) => {
      const scoreA =
        (a.batting?.totalRuns || 0) + (a.bowling?.totalWickets || 0) * 30;
      const scoreB =
        (b.batting?.totalRuns || 0) + (b.bowling?.totalWickets || 0) * 30;
      return scoreB - scoreA;
    });

    const limited = results.slice(0, parseInt(limit));

    res.json({
      status: "success",
      total: results.length,
      showing: limited.length,
      data: limited,
    });
  } catch (err) {
    console.error("searchPlayers error:", err);
    res
      .status(500)
      .json({ message: "Error searching players", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/search/teams
   All distinct teams (for the team filter dropdown)
   ───────────────────────────────────────────────────────────── */
export const getTeamsForFilter = async (req, res) => {
  try {
    const teams = await Delivery.distinct("batting_team");
    res.json({ status: "success", data: teams.filter(Boolean).sort() });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching teams", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/search/quick?q=
   Fast name-only search — for the navbar modal (top 8 results)
   ───────────────────────────────────────────────────────────── */
export const quickSearch = async (req, res) => {
  try {
    const { q = "" } = req.query;
    if (!q || q.length < 2) return res.json({ status: "success", data: [] });

    const regex = new RegExp(q, "i");

    const [batters, bowlers] = await Promise.all([
      Delivery.distinct("batter", { batter: regex }),
      Delivery.distinct("bowler", { bowler: regex }),
    ]);

    const combined = [...new Set([...batters, ...bowlers])]
      .filter(Boolean)
      .sort()
      .slice(0, 8);

    res.json({ status: "success", data: combined });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Quick search failed", error: err.message });
  }
};
