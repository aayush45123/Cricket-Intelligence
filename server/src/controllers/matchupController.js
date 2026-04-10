import Delivery from "../models/Deliveries.js";

const asNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;
const asText = (value) => (value == null ? "" : String(value));

/* ─────────────────────────────────────────────────────────────
   GET /api/matchups/batters
   Distinct batter names (for search dropdown)
   ───────────────────────────────────────────────────────────── */
export const getAllBatters = async (req, res) => {
  try {
    const batters = await Delivery.distinct("batter");
    res.json({ status: "success", data: batters.filter(Boolean).sort() });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching batters", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/matchups/bowlers
   Distinct bowler names (for search dropdown)
   ───────────────────────────────────────────────────────────── */
export const getAllBowlers = async (req, res) => {
  try {
    const bowlers = await Delivery.distinct("bowler");
    res.json({ status: "success", data: bowlers.filter(Boolean).sort() });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching bowlers", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/matchups/:batter/:bowler
   Full head-to-head analytics
   ───────────────────────────────────────────────────────────── */
export const getMatchup = async (req, res) => {
  try {
    const batter = decodeURIComponent(req.params.batter);
    const bowler = decodeURIComponent(req.params.bowler);

    const deliveries = await Delivery.find({ batter, bowler })
      .sort({ match_id: 1, innings: 1, ball_no: 1 })
      .lean();

    if (!deliveries.length) {
      return res.status(404).json({
        message: `No delivery data found for ${batter} vs ${bowler}.`,
      });
    }

    /* ── Core totals ──────────────────────────────────────────── */
    const totalBalls = deliveries.filter(
      (d) => asNumber(d.valid_ball) === 1,
    ).length;
    const totalRuns = deliveries.reduce(
      (s, d) => s + asNumber(d.runs_batter),
      0,
    );
    const totalDismissals = deliveries.filter(
      (d) => asNumber(d.bowler_wicket) === 1,
    ).length;
    const strikeRate = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;
    const dotBalls = deliveries.filter(
      (d) => asNumber(d.valid_ball) === 1 && asNumber(d.runs_batter) === 0,
    ).length;
    const fours = deliveries.filter(
      (d) => asNumber(d.runs_batter) === 4,
    ).length;
    const sixes = deliveries.filter(
      (d) => asNumber(d.runs_batter) === 6,
    ).length;

    /* ── Run distribution (0,1,2,3,4,6) ──────────────────────── */
    const runBuckets = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 6: 0 };
    deliveries.forEach((d) => {
      if (asNumber(d.valid_ball) !== 1) return;
      const r = asNumber(d.runs_batter);
      const key = r >= 6 ? 6 : r >= 4 ? 4 : r;
      runBuckets[key] = (runBuckets[key] || 0) + 1;
    });

    const runDistribution = Object.entries(runBuckets).map(([run, count]) => ({
      run: run === "6" ? "6+" : run,
      count,
      pct:
        totalBalls > 0
          ? parseFloat(((count / totalBalls) * 100).toFixed(1))
          : 0,
    }));

    /* ── Per-match breakdown ──────────────────────────────────── */
    const matchMap = {};
    deliveries.forEach((d) => {
      const id = d.match_id;
      if (!matchMap[id]) {
        matchMap[id] = {
          matchId: id,
          date: d.date,
          season: d.season,
          venue: d.venue,
          battingTeam: d.batting_team,
          bowlingTeam: d.bowling_team,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          dismissals: 0,
        };
      }
      const m = matchMap[id];
      if (asNumber(d.valid_ball) === 1) m.balls++;
      m.runs += asNumber(d.runs_batter);
      if (asNumber(d.runs_batter) === 4) m.fours++;
      if (asNumber(d.runs_batter) === 6) m.sixes++;
      if (asNumber(d.bowler_wicket) === 1) m.dismissals++;
    });

    const perMatch = Object.values(matchMap)
      .map((m) => ({
        ...m,
        strikeRate:
          m.balls > 0 ? parseFloat(((m.runs / m.balls) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => asText(a.date).localeCompare(asText(b.date)));

    /* ── Phase breakdown (Powerplay/Middle/Death) ─────────────── */
    const phases = {
      Powerplay: { runs: 0, balls: 0, dismissals: 0 },
      Middle: { runs: 0, balls: 0, dismissals: 0 },
      Death: { runs: 0, balls: 0, dismissals: 0 },
    };
    deliveries.forEach((d) => {
      const ov = asNumber(d.over);
      const phase = ov <= 5 ? "Powerplay" : ov <= 14 ? "Middle" : "Death";
      if (asNumber(d.valid_ball) === 1) phases[phase].balls++;
      phases[phase].runs += asNumber(d.runs_batter);
      if (asNumber(d.bowler_wicket) === 1) phases[phase].dismissals++;
    });

    const phaseBreakdown = Object.entries(phases).map(([phase, p]) => ({
      phase,
      runs: p.runs,
      balls: p.balls,
      dismissals: p.dismissals,
      strikeRate:
        p.balls > 0 ? parseFloat(((p.runs / p.balls) * 100).toFixed(1)) : 0,
    }));

    /* ── Over-by-over ─────────────────────────────────────────── */
    const overMap = {};
    deliveries.forEach((d) => {
      const ov = asNumber(d.over);
      if (!overMap[ov])
        overMap[ov] = { over: ov + 1, runs: 0, balls: 0, dismissals: 0 };
      if (asNumber(d.valid_ball) === 1) overMap[ov].balls++;
      overMap[ov].runs += asNumber(d.runs_batter);
      if (asNumber(d.bowler_wicket) === 1) overMap[ov].dismissals++;
    });

    const overByOver = Object.values(overMap)
      .map((o) => ({
        ...o,
        strikeRate:
          o.balls > 0 ? parseFloat(((o.runs / o.balls) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => a.over - b.over);

    /* ── Season trend ─────────────────────────────────────────── */
    const seasonMap = {};
    perMatch.forEach((m) => {
      const s = m.season || "Unknown";
      if (!seasonMap[s])
        seasonMap[s] = {
          season: s,
          runs: 0,
          balls: 0,
          dismissals: 0,
          matches: 0,
        };
      seasonMap[s].runs += m.runs;
      seasonMap[s].balls += m.balls;
      seasonMap[s].dismissals += m.dismissals;
      seasonMap[s].matches += 1;
    });

    const seasonTrend = Object.values(seasonMap)
      .map((s) => ({
        ...s,
        strikeRate:
          s.balls > 0 ? parseFloat(((s.runs / s.balls) * 100).toFixed(1)) : 0,
        avgRuns:
          s.matches > 0 ? parseFloat((s.runs / s.matches).toFixed(1)) : 0,
      }))
      .sort((a, b) =>
        asText(a.season).localeCompare(asText(b.season), undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );

    /* ── Dismissal types ──────────────────────────────────────── */
    const dismissalTypes = {};
    deliveries
      .filter((d) => asNumber(d.bowler_wicket) === 1)
      .forEach((d) => {
        const kind = d.wicket_kind || "Unknown";
        dismissalTypes[kind] = (dismissalTypes[kind] || 0) + 1;
      });

    const dismissals = Object.entries(dismissalTypes)
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      status: "success",
      data: {
        batter,
        bowler,
        summary: {
          totalRuns,
          totalBalls,
          totalDismissals,
          strikeRate: parseFloat(strikeRate.toFixed(2)),
          dotBalls,
          dotBallPct:
            totalBalls > 0
              ? parseFloat(((dotBalls / totalBalls) * 100).toFixed(1))
              : 0,
          fours,
          sixes,
          battingAverage:
            totalDismissals > 0
              ? parseFloat((totalRuns / totalDismissals).toFixed(2))
              : totalRuns,
          totalMatches: perMatch.length,
        },
        runDistribution,
        phaseBreakdown,
        overByOver,
        perMatch,
        seasonTrend,
        dismissals,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching matchup", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/matchups/top/:batter
   Top bowlers who have troubled this batter most
   (most dismissals, then highest dot-ball %)
   ───────────────────────────────────────────────────────────── */
export const getTopBoylersForBatter = async (req, res) => {
  try {
    const batter = decodeURIComponent(req.params.batter);

    const raw = await Delivery.aggregate([
      { $match: { batter } },
      {
        $group: {
          _id: "$bowler",
          totalRuns: { $sum: "$runs_batter" },
          totalBalls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
          totalDismissals: { $sum: "$bowler_wicket" },
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
      { $match: { totalBalls: { $gte: 6 } } }, // min 1 over faced
      {
        $project: {
          _id: 0,
          bowler: "$_id",
          totalRuns: 1,
          totalBalls: 1,
          totalDismissals: 1,
          dotBalls: 1,
          strikeRate: {
            $cond: [
              { $gt: ["$totalBalls", 0] },
              { $multiply: [{ $divide: ["$totalRuns", "$totalBalls"] }, 100] },
              0,
            ],
          },
          dotBallPct: {
            $cond: [
              { $gt: ["$totalBalls", 0] },
              { $multiply: [{ $divide: ["$dotBalls", "$totalBalls"] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { totalDismissals: -1, dotBallPct: -1 } },
      { $limit: 10 },
    ]);

    res.json({ status: "success", data: raw });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching top bowlers", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/matchups/dominated/:bowler
   Batters this bowler has dominated most
   ───────────────────────────────────────────────────────────── */
export const getBattersVsBowler = async (req, res) => {
  try {
    const bowler = decodeURIComponent(req.params.bowler);

    const raw = await Delivery.aggregate([
      { $match: { bowler } },
      {
        $group: {
          _id: "$batter",
          totalRuns: { $sum: "$runs_batter" },
          totalBalls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
          totalDismissals: { $sum: "$bowler_wicket" },
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
      { $match: { totalBalls: { $gte: 6 } } },
      {
        $project: {
          _id: 0,
          batter: "$_id",
          totalRuns: 1,
          totalBalls: 1,
          totalDismissals: 1,
          dotBalls: 1,
          strikeRate: {
            $cond: [
              { $gt: ["$totalBalls", 0] },
              { $multiply: [{ $divide: ["$totalRuns", "$totalBalls"] }, 100] },
              0,
            ],
          },
          dotBallPct: {
            $cond: [
              { $gt: ["$totalBalls", 0] },
              { $multiply: [{ $divide: ["$dotBalls", "$totalBalls"] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { totalDismissals: -1, totalRuns: 1 } },
      { $limit: 10 },
    ]);

    res.json({ status: "success", data: raw });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Error fetching batters vs bowler",
        error: err.message,
      });
  }
};
