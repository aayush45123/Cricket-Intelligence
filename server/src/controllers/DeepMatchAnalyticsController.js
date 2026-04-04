import Delivery from "../models/Deliveries.js";


const buildWorm = (deliveries) => {
  const overMap = {};
  deliveries.forEach((d) => {
    const ov = d.over;
    if (!overMap[ov]) overMap[ov] = 0;
    overMap[ov] += d.runs_total ?? 0;
  });

  let cumulative = 0;
  return Object.keys(overMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((over) => {
      const thisOver = overMap[over];
      cumulative += thisOver;
      return { over: over + 1, thisOver, cumulative };
    });
};

/* ─────────────────────────────────────────────────────────────
   HELPER — build per-over momentum for one innings
   ───────────────────────────────────────────────────────────── */
const buildMomentum = (deliveries) => {
  const overMap = {};
  deliveries.forEach((d) => {
    const ov = d.over;
    if (!overMap[ov]) {
      overMap[ov] = {
        runs: 0,
        wickets: 0,
        dots: 0,
        validBalls: 0,
        team: d.batting_team,
      };
    }
    overMap[ov].runs += d.runs_total ?? 0;
    overMap[ov].wickets += d.bowler_wicket ?? 0;
    overMap[ov].validBalls += d.valid_ball ?? 0;
    if ((d.runs_batter ?? 0) === 0 && (d.runs_extras ?? 0) === 0) {
      overMap[ov].dots += 1;
    }
  });

  return Object.keys(overMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((over) => {
      const o = overMap[over];
      return {
        over: over + 1,
        runs: o.runs,
        wickets: o.wickets,
        dots: o.dots,
        runRate:
          o.validBalls > 0
            ? parseFloat(((o.runs / o.validBalls) * 6).toFixed(2))
            : 0,
        isBigOver: o.runs >= 15,
        isWicketOver: o.wickets > 0,
        team: o.team,
      };
    });
};

/* ─────────────────────────────────────────────────────────────
   HELPER — win probability at each valid ball in innings 2
   Formula:  logistic on (currentRR / requiredRR) weighted by
             wickets-in-hand and completion fraction.
   ───────────────────────────────────────────────────────────── */
const buildWinProbability = (inn2, target, totalValidBalls) => {
  const validBalls = inn2.filter((d) => (d.valid_ball ?? 0) === 1);
  let runs = 0;
  let wickets = 0;
  let ballsBowled = 0;
  const points = [];

  validBalls.forEach((d) => {
    runs += d.runs_total ?? 0;
    ballsBowled += 1;
    if ((d.bowler_wicket ?? 0) === 1) wickets += 1;

    const runsNeeded = Math.max(0, target - runs);
    const ballsLeft = Math.max(0, totalValidBalls - ballsBowled);
    const wicketsLeft = Math.max(0, 10 - wickets);

    let prob = 50;

    if (runsNeeded <= 0) {
      prob = 100; // already won
    } else if (ballsLeft === 0 || wicketsLeft === 0) {
      prob = 0; // lost
    } else {
      const requiredRR = (runsNeeded / ballsLeft) * 6;
      const currentRR = ballsBowled > 0 ? (runs / ballsBowled) * 6 : 6;
      const rrRatio = currentRR / (requiredRR + 0.001);
      const wicketWeight = wicketsLeft / 10;
      // Logistic: centres at rrRatio=1, steepness=3
      const logistic = 1 / (1 + Math.exp(-3 * (rrRatio - 1)));
      prob = logistic * 100 * wicketWeight;
      prob = Math.max(3, Math.min(97, prob));
    }

    points.push({
      over: d.over + 1,
      ballInOver: d.ball,
      label: `${d.over + 1}.${d.ball}`,
      prob: parseFloat(prob.toFixed(1)),
      runs,
      wickets,
      runsNeeded,
      ballsLeft,
    });
  });

  return points;
};

/* ─────────────────────────────────────────────────────────────
   HELPER — detect key moments from all deliveries
   ───────────────────────────────────────────────────────────── */
const buildKeyMoments = (inn1, inn2) => {
  const moments = [];

  const processInnings = (deliveries, inningsNum) => {
    // Wickets
    deliveries
      .filter((d) => (d.bowler_wicket ?? 0) === 1)
      .forEach((d) => {
        moments.push({
          type: "wicket",
          innings: inningsNum,
          over: d.over + 1,
          ball: d.ball,
          label: `${d.over + 1}.${d.ball}`,
          description: `${d.player_out || "Batter"} out — ${d.wicket_kind || "dismissed"} by ${d.bowler}`,
          team: d.bowling_team,
          severity: "high",
        });
      });

    // Big overs (15+ runs in an over)
    const overMap = {};
    deliveries.forEach((d) => {
      const ov = d.over;
      if (!overMap[ov]) overMap[ov] = { runs: 0, team: d.batting_team };
      overMap[ov].runs += d.runs_total ?? 0;
    });

    Object.entries(overMap).forEach(([ov, data]) => {
      if (data.runs >= 15) {
        moments.push({
          type: "bigOver",
          innings: inningsNum,
          over: parseInt(ov) + 1,
          ball: 6,
          label: `Over ${parseInt(ov) + 1}`,
          description: `${data.team} blasted ${data.runs} runs in over ${parseInt(ov) + 1}`,
          runs: data.runs,
          team: data.team,
          severity: data.runs >= 20 ? "high" : "medium",
        });
      }
    });

    // Wicket cluster — 2+ wickets in a 3-over window
    const overKeys = Object.keys(overMap)
      .map(Number)
      .sort((a, b) => a - b);
    overKeys.forEach((ov, idx) => {
      if (idx < overKeys.length - 2) {
        const window = [ov, ov + 1, ov + 2];
        const clusterWickets = deliveries.filter(
          (d) => window.includes(d.over) && (d.bowler_wicket ?? 0) === 1,
        ).length;

        if (clusterWickets >= 2) {
          moments.push({
            type: "wicketCluster",
            innings: inningsNum,
            over: ov + 1,
            ball: 1,
            label: `Overs ${ov + 1}–${ov + 3}`,
            description: `${clusterWickets} wickets fell in overs ${ov + 1}–${ov + 3} — collapse!`,
            count: clusterWickets,
            team:
              deliveries.find((d) => d.innings === inningsNum)?.bowling_team ||
              "",
            severity: clusterWickets >= 3 ? "high" : "medium",
          });
        }
      }
    });
  };

  processInnings(inn1, 1);
  processInnings(inn2, 2);

  // Deduplicate wicket clusters (overlapping windows produce dupes)
  const seen = new Set();
  const deduped = moments.filter((m) => {
    const key = `${m.type}-${m.innings}-${m.over}-${m.ball}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.sort(
    (a, b) => a.innings - b.innings || a.over - b.over || a.ball - b.ball,
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN CONTROLLER
   GET /api/matches/:matchId/deep-analytics
   ───────────────────────────────────────────────────────────── */
export const getDeepMatchAnalytics = async (req, res) => {
  try {
    const matchId = req.params.matchId;

    // Fetch all deliveries for this match, ordered
    const deliveries = await Delivery.find({ match_id: matchId })
      .sort({ innings: 1, ball_no: 1 })
      .lean();

    if (!deliveries.length) {
      return res
        .status(404)
        .json({ message: "Match not found or no delivery data." });
    }

    const inn1 = deliveries.filter((d) => d.innings === 1);
    const inn2 = deliveries.filter((d) => d.innings === 2);

    // Team names
    const teamInnings1 = inn1[0]?.batting_team || "Team A";
    const teamInnings2 = inn2[0]?.batting_team || "Team B";

    // Target = runs_target field on innings 2 deliveries
    const target = inn2[0]?.runs_target ?? 0;

    // Total valid balls in innings 1 (= total overs available for innings 2)
    const totalValidBalls = inn1.filter(
      (d) => (d.valid_ball ?? 0) === 1,
    ).length;

    // Summary totals
    const inn1Total = inn1.reduce((s, d) => s + (d.runs_total ?? 0), 0);
    const inn2Total = inn2.reduce((s, d) => s + (d.runs_total ?? 0), 0);
    const inn1Wickets = inn1.filter((d) => (d.bowler_wicket ?? 0) === 1).length;
    const inn2Wickets = inn2.filter((d) => (d.bowler_wicket ?? 0) === 1).length;
    const inn1Overs = Math.max(...inn1.map((d) => d.over), 0) + 1;
    const inn2Overs = Math.max(...inn2.map((d) => d.over), 0) + 1;

    const winner = deliveries[0]?.match_won_by || "TBD";
    const venue = deliveries[0]?.venue || "";
    const matchDate = deliveries[0]?.date || "";
    const matchType = deliveries[0]?.match_type || "";

    res.json({
      status: "success",
      data: {
        matchId,
        matchType,
        venue,
        matchDate,
        teams: {
          innings1: teamInnings1,
          innings2: teamInnings2,
        },
        target,
        winner,
        summary: {
          inn1: { runs: inn1Total, wickets: inn1Wickets, overs: inn1Overs },
          inn2: { runs: inn2Total, wickets: inn2Wickets, overs: inn2Overs },
        },
        worm: {
          innings1: buildWorm(inn1),
          innings2: buildWorm(inn2),
        },
        winProbability: buildWinProbability(inn2, target, totalValidBalls),
        momentum: {
          innings1: buildMomentum(inn1),
          innings2: buildMomentum(inn2),
        },
        keyMoments: buildKeyMoments(inn1, inn2),
      },
    });
  } catch (error) {
    console.error("Deep analytics error:", error);
    res.status(500).json({
      message: "Error fetching deep match analytics",
      error: error.message,
    });
  }
};
