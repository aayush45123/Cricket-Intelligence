import crypto from "crypto";
import UserMatch from "../models/UserMatch.js";
import UserDelivery from "../models/UserDelivery.js";

/* ── Helpers ─────────────────────────────────────────────── */
const phaseOf = (over) =>
  over <= 5 ? "Powerplay" : over <= 14 ? "Middle" : "Death";

const oversDisplay = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

const checkMatchEnd = (match, inn) => {
  const { runs, wickets, balls } = match[inn];
  const maxBalls = match.totalOvers * 6;

  /* Innings 1 ends: overs complete or all out */
  if (match.currentInnings === 1) {
    return wickets >= 10 || balls >= maxBalls;
  }

  /* Innings 2 ends: overs complete, all out, or target achieved */
  const target = match.innings1.runs + 1;
  return wickets >= 10 || balls >= maxBalls || runs >= target;
};

/* ─────────────────────────────────────────────────────────────
   POST /api/live/setup
   Create match lobby
   ───────────────────────────────────────────────────────────── */
export const setupMatch = async (req, res) => {
  try {
    const {
      teamA,
      teamB,
      playersA,
      playersB,
      totalOvers,
      venue,
      tossWinner,
      tossDecision,
    } = req.body;

    if (!teamA || !teamB || !totalOvers)
      return res
        .status(400)
        .json({ message: "teamA, teamB and totalOvers are required" });

    /* Who bats first? */
    const battingFirst =
      tossDecision === "bat"
        ? tossWinner
        : tossWinner === teamA
          ? teamB
          : teamA;
    const bowlingFirst = battingFirst === teamA ? teamB : teamA;

    const match = await UserMatch.create({
      userId: req.user._id,
      teamA,
      teamB,
      playersA: playersA || [],
      playersB: playersB || [],
      totalOvers,
      venue: venue || "",
      tossWinner: tossWinner || teamA,
      tossDecision: tossDecision || "bat",
      currentInnings: 1,
      status: "setup",
      innings1: { battingTeam: battingFirst },
      innings2: { battingTeam: bowlingFirst },
      shareToken: crypto.randomBytes(6).toString("hex"),
    });

    res.status(201).json({ status: "success", data: { match } });
  } catch (err) {
    res.status(500).json({ message: "Match setup failed", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   PATCH /api/live/:matchId/start
   Set opening players and move status to "live"
   ───────────────────────────────────────────────────────────── */
export const startMatch = async (req, res) => {
  try {
    const match = await UserMatch.findOne({
      _id: req.params.matchId,
      userId: req.user._id,
    });
    if (!match) return res.status(404).json({ message: "Match not found" });
    if (match.status !== "setup")
      return res.status(400).json({ message: "Match already started" });

    const { striker, nonStriker, bowler } = req.body;
    if (!striker || !nonStriker || !bowler)
      return res
        .status(400)
        .json({ message: "striker, nonStriker and bowler required" });

    match.striker = striker;
    match.nonStriker = nonStriker;
    match.bowler = bowler;
    match.status = "live";
    await match.save();

    res.json({ status: "success", data: { match } });
  } catch (err) {
    res.status(500).json({ message: "Start failed", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /api/live/:matchId/ball
   Record one delivery — the main engine
   ───────────────────────────────────────────────────────────── */
export const recordBall = async (req, res) => {
  try {
    const match = await UserMatch.findOne({
      _id: req.params.matchId,
      userId: req.user._id,
    });
    if (!match) return res.status(404).json({ message: "Match not found" });
    if (match.status !== "live")
      return res.status(400).json({ message: "Match is not live" });

    const {
      runs_batter = 0,
      extra_type = null, // "wide" | "noball" | "bye" | "legbye" | null
      runs_extras = 0,
      wicket = false,
      wicket_kind = null,
      player_out = null,
      newBatter = null, // next batter after a wicket
      newBowler = null, // optional — change bowler mid-match
    } = req.body;

    const inn = `innings${match.currentInnings}`;
    const innObj = match[inn];
    const isWide = extra_type === "wide";
    const isNoball = extra_type === "noball";
    const isValid = !isWide; // no-ball counts as a valid delivery for batter

    const runs_total = runs_batter + runs_extras;
    const runs_bowler = isWide ? 0 : runs_batter; // extras (bye/lb) don't count to bowler

    /* Current over/ball before update */
    const currentOver = Math.floor(innObj.balls / 6);
    const currentBall = (innObj.balls % 6) + 1;

    /* ── Save delivery ────────────────────────────────────── */
    await UserDelivery.create({
      matchId: match._id,
      userId: req.user._id,
      innings: match.currentInnings,
      over: currentOver,
      ball: currentBall,
      batter: match.striker,
      non_striker: match.nonStriker,
      bowler: newBowler || match.bowler,
      batting_team: innObj.battingTeam,
      bowling_team:
        match.currentInnings === 1
          ? match.innings2.battingTeam
          : match.innings1.battingTeam,
      runs_batter,
      runs_extras,
      runs_total,
      runs_bowler,
      valid_ball: isValid ? 1 : 0,
      extra_type,
      bowler_wicket: wicket && !isWide ? 1 : 0,
      wicket_kind: wicket ? wicket_kind : null,
      player_out: wicket ? player_out || match.striker : null,
      runs_target: match.currentInnings === 2 ? match.innings1.runs + 1 : 0,
      phase: phaseOf(currentOver),
    });

    /* ── Update scorecard ─────────────────────────────────── */
    innObj.runs += runs_total;
    innObj.extras += runs_extras;
    if (isValid) innObj.balls += 1;
    if (wicket && !isWide) innObj.wickets += 1;
    innObj.overs = parseFloat(oversDisplay(innObj.balls));

    /* ── Strike rotation ─────────────────────────────────── */
    if (isValid) {
      /* Odd runs → strike rotates */
      if (runs_batter % 2 !== 0) {
        [match.striker, match.nonStriker] = [match.nonStriker, match.striker];
      }
      /* End of over → rotate strike */
      if (innObj.balls % 6 === 0 && innObj.balls > 0) {
        [match.striker, match.nonStriker] = [match.nonStriker, match.striker];
      }
    }

    /* ── Handle wicket ────────────────────────────────────── */
    if (wicket && !isWide) {
      if (!newBatter && innObj.wickets < 10)
        return res
          .status(400)
          .json({ message: "newBatter is required after a wicket" });
      /* Dismissed batter is replaced by newBatter */
      const outBatter = player_out || match.striker;
      if (outBatter === match.striker) match.striker = newBatter || "";
      else match.nonStriker = newBatter || "";
    }

    /* ── Bowler change ────────────────────────────────────── */
    if (newBowler) match.bowler = newBowler;

    /* ── Check end of innings ─────────────────────────────── */
    const innEnded = checkMatchEnd(match, inn);

    if (innEnded) {
      if (match.currentInnings === 1) {
        match.currentInnings = 2;
        match.status = "innings_break";
        /* Reset live players for innings 2 setup */
        match.striker = match.nonStriker = match.bowler = "";
      } else {
        /* Match over */
        match.status = "completed";

        const target = match.innings1.runs + 1;
        const inn2 = match.innings2;
        const surplus = inn2.runs - match.innings1.runs;

        if (inn2.runs >= target) {
          const wktsLeft = 10 - inn2.wickets;
          match.winner = inn2.battingTeam;
          match.winOutcome = `won by ${wktsLeft} wicket${wktsLeft !== 1 ? "s" : ""}`;
        } else {
          match.winner = match.innings1.battingTeam;
          match.winOutcome = `won by ${Math.abs(surplus)} run${Math.abs(surplus) !== 1 ? "s" : ""}`;
        }
      }
    }

    match.markModified("innings1");
    match.markModified("innings2");
    await match.save();

    res.json({
      status: "success",
      data: {
        match,
        innEnded,
        scorecard: {
          innings: match.currentInnings <= 2 ? match.currentInnings : 2,
          runs: innObj.runs,
          wickets: innObj.wickets,
          overs: innObj.overs,
          target: match.currentInnings === 2 ? match.innings1.runs + 1 : null,
          rrr:
            match.currentInnings === 2 && innObj.balls < match.totalOvers * 6
              ? parseFloat(
                  (
                    ((match.innings1.runs + 1 - innObj.runs) /
                      Math.max(1, match.totalOvers * 6 - innObj.balls)) *
                    6
                  ).toFixed(2),
                )
              : null,
        },
        striker: match.striker,
        nonStriker: match.nonStriker,
        bowler: match.bowler,
      },
    });
  } catch (err) {
    console.error("recordBall error:", err);
    res
      .status(500)
      .json({ message: "Ball recording failed", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   DELETE /api/live/:matchId/undo
   Remove the last ball — undo system
   ───────────────────────────────────────────────────────────── */
export const undoLastBall = async (req, res) => {
  try {
    const match = await UserMatch.findOne({
      _id: req.params.matchId,
      userId: req.user._id,
    });
    if (!match) return res.status(404).json({ message: "Match not found" });

    /* Find and remove the last delivery */
    const last = await UserDelivery.findOne({ matchId: match._id })
      .sort({ createdAt: -1 })
      .lean();

    if (!last) return res.status(400).json({ message: "Nothing to undo" });

    await UserDelivery.findByIdAndDelete(last._id);

    /* Revert scorecard */
    const inn = `innings${last.innings}`;
    const innObj = match[inn];

    innObj.runs = Math.max(0, innObj.runs - last.runs_total);
    innObj.extras = Math.max(0, innObj.extras - last.runs_extras);
    if (last.valid_ball === 1) innObj.balls = Math.max(0, innObj.balls - 1);
    if (last.bowler_wicket === 1)
      innObj.wickets = Math.max(0, innObj.wickets - 1);
    innObj.overs = parseFloat(oversDisplay(innObj.balls));

    /* Restore batter who was dismissed */
    if (last.bowler_wicket === 1 && last.player_out) {
      match.striker = last.player_out;
    }

    match.markModified("innings1");
    match.markModified("innings2");
    await match.save();

    res.json({ status: "success", data: { match, undone: last } });
  } catch (err) {
    res.status(500).json({ message: "Undo failed", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   PATCH /api/live/:matchId/innings-break
   Set opening players for innings 2 after innings break
   ───────────────────────────────────────────────────────────── */
export const startInnings2 = async (req, res) => {
  try {
    const match = await UserMatch.findOne({
      _id: req.params.matchId,
      userId: req.user._id,
    });
    if (!match) return res.status(404).json({ message: "Match not found" });
    if (match.status !== "innings_break")
      return res.status(400).json({ message: "Not in innings break" });

    const { striker, nonStriker, bowler } = req.body;
    if (!striker || !nonStriker || !bowler)
      return res
        .status(400)
        .json({ message: "striker, nonStriker and bowler required" });

    match.striker = striker;
    match.nonStriker = nonStriker;
    match.bowler = bowler;
    match.status = "live";
    await match.save();

    res.json({ status: "success", data: { match } });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Innings 2 start failed", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/live/:matchId/state
   Full live state (polling endpoint for scoreboard)
   ───────────────────────────────────────────────────────────── */
export const getMatchState = async (req, res) => {
  try {
    const match = await UserMatch.findOne({
      _id: req.params.matchId,
      userId: req.user._id,
    });
    if (!match) return res.status(404).json({ message: "Match not found" });

    /* Last 6 deliveries for the over-by-over display */
    const recentBalls = await UserDelivery.find({ matchId: match._id })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const inn =
      match.currentInnings <= 2 ? `innings${match.currentInnings}` : "innings2";
    const innObj = match[inn];
    const target = match.currentInnings === 2 ? match.innings1.runs + 1 : null;
    const ballsLeft =
      target !== null ? match.totalOvers * 6 - innObj.balls : null;
    const rrr =
      target !== null && ballsLeft > 0
        ? parseFloat((((target - innObj.runs) / ballsLeft) * 6).toFixed(2))
        : null;

    res.json({
      status: "success",
      data: {
        match,
        target,
        rrr,
        currentRR:
          innObj.balls > 0
            ? parseFloat(((innObj.runs / innObj.balls) * 6).toFixed(2))
            : 0,
        recentBalls: recentBalls.reverse(),
        striker: match.striker,
        nonStriker: match.nonStriker,
        bowler: match.bowler,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "State fetch failed", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/live/:matchId/analytics
   Post-match deep analytics — reuses existing engine with UserDelivery
   ───────────────────────────────────────────────────────────── */
export const getMatchAnalytics = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const match = await UserMatch.findOne({
      _id: matchId,
      userId: req.user._id,
    });
    if (!match) return res.status(404).json({ message: "Match not found" });

    const deliveries = await UserDelivery.find({ matchId })
      .sort({ innings: 1, over: 1, ball: 1 })
      .lean();

    if (!deliveries.length)
      return res.status(404).json({ message: "No delivery data yet" });

    const inn1 = deliveries.filter((d) => d.innings === 1);
    const inn2 = deliveries.filter((d) => d.innings === 2);

    /* ── Build worm ────────────────────────────────────────── */
    const buildWorm = (dels) => {
      const overMap = {};
      dels.forEach((d) => {
        if (!overMap[d.over]) overMap[d.over] = 0;
        overMap[d.over] += d.runs_total || 0;
      });
      let cum = 0;
      return Object.keys(overMap)
        .map(Number)
        .sort((a, b) => a - b)
        .map((ov) => {
          cum += overMap[ov];
          return { over: ov + 1, thisOver: overMap[ov], cumulative: cum };
        });
    };

    /* ── Build momentum ────────────────────────────────────── */
    const buildMomentum = (dels) => {
      const overMap = {};
      dels.forEach((d) => {
        if (!overMap[d.over])
          overMap[d.over] = { runs: 0, wickets: 0, validBalls: 0 };
        overMap[d.over].runs += d.runs_total || 0;
        overMap[d.over].wickets += d.bowler_wicket || 0;
        overMap[d.over].validBalls += d.valid_ball || 0;
      });
      return Object.keys(overMap)
        .map(Number)
        .sort((a, b) => a - b)
        .map((ov) => {
          const o = overMap[ov];
          return {
            over: ov + 1,
            runs: o.runs,
            wickets: o.wickets,
            runRate:
              o.validBalls > 0
                ? parseFloat(((o.runs / o.validBalls) * 6).toFixed(2))
                : 0,
            isBigOver: o.runs >= 15,
            isWicketOver: o.wickets > 0,
          };
        });
    };

    /* ── Build player batting stats ────────────────────────── */
    const playerBatting = {};
    deliveries.forEach((d) => {
      if (!playerBatting[d.batter])
        playerBatting[d.batter] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
      playerBatting[d.batter].runs += d.runs_batter || 0;
      playerBatting[d.batter].balls += d.valid_ball || 0;
      if (d.runs_batter === 4) playerBatting[d.batter].fours++;
      if (d.runs_batter === 6) playerBatting[d.batter].sixes++;
    });

    /* ── Build player bowling stats ────────────────────────── */
    const playerBowling = {};
    deliveries.forEach((d) => {
      if (!playerBowling[d.bowler])
        playerBowling[d.bowler] = { runs: 0, balls: 0, wickets: 0 };
      playerBowling[d.bowler].runs += d.runs_bowler || 0;
      playerBowling[d.bowler].balls += d.valid_ball || 0;
      playerBowling[d.bowler].wickets += d.bowler_wicket || 0;
    });

    const battingStats = Object.entries(playerBatting)
      .map(([name, s]) => ({
        playerName: name,
        runs: s.runs,
        balls: s.balls,
        fours: s.fours,
        sixes: s.sixes,
        strikeRate:
          s.balls > 0 ? parseFloat(((s.runs / s.balls) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.runs - a.runs);

    const bowlingStats = Object.entries(playerBowling)
      .map(([name, s]) => ({
        playerName: name,
        runs: s.runs,
        balls: s.balls,
        wickets: s.wickets,
        economy:
          s.balls > 0 ? parseFloat(((s.runs / s.balls) * 6).toFixed(2)) : 0,
        overs: `${Math.floor(s.balls / 6)}.${s.balls % 6}`,
      }))
      .sort((a, b) => b.wickets - a.wickets || a.economy - b.economy);

    res.json({
      status: "success",
      data: {
        matchId,
        match,
        teams: {
          innings1: match.innings1.battingTeam,
          innings2: match.innings2.battingTeam,
        },
        target: match.innings1.runs + 1,
        winner: match.winner,
        outcome: match.winOutcome,
        summary: {
          inn1: {
            runs: match.innings1.runs,
            wickets: match.innings1.wickets,
            overs: match.innings1.overs,
          },
          inn2: {
            runs: match.innings2.runs,
            wickets: match.innings2.wickets,
            overs: match.innings2.overs,
          },
        },
        worm: { innings1: buildWorm(inn1), innings2: buildWorm(inn2) },
        momentum: {
          innings1: buildMomentum(inn1),
          innings2: buildMomentum(inn2),
        },
        battingStats,
        bowlingStats,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Analytics failed", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/live/my-matches
   User's match history
   ───────────────────────────────────────────────────────────── */
export const getMyMatches = async (req, res) => {
  try {
    const matches = await UserMatch.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ status: "success", data: { matches } });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch matches", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/live/share/:shareToken
   Public read-only match view (no auth required)
   ───────────────────────────────────────────────────────────── */
export const getSharedMatch = async (req, res) => {
  try {
    const match = await UserMatch.findOne({
      shareToken: req.params.shareToken,
    }).lean();
    if (!match) return res.status(404).json({ message: "Match not found" });
    res.json({ status: "success", data: { match } });
  } catch (err) {
    res.status(500).json({ message: "Share fetch failed", error: err.message });
  }
};
