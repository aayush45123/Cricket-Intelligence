import crypto from "crypto";
import UserMatch from "../models/UserMatch.js";
import UserDelivery from "../models/UserDelivery.js";

/* ── Pure helpers ─────────────────────────────────────────── */
const phaseOf = (over) =>
  over <= 5 ? "Powerplay" : over <= 14 ? "Middle" : "Death";

const oversDisplay = (balls) =>
  parseFloat(`${Math.floor(balls / 6)}.${balls % 6}`);

/* ─────────────────────────────────────────────────────────────
   POST /api/live/setup
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
      totalOvers: parseInt(totalOvers),
      venue: venue || "",
      tossWinner: tossWinner || teamA,
      tossDecision: tossDecision || "bat",
      currentInnings: 1,
      status: "setup",
      innings1: {
        battingTeam: battingFirst,
        runs: 0,
        wickets: 0,
        balls: 0,
        extras: 0,
        overs: 0,
      },
      innings2: {
        battingTeam: bowlingFirst,
        runs: 0,
        wickets: 0,
        balls: 0,
        extras: 0,
        overs: 0,
      },
      shareToken: crypto.randomBytes(6).toString("hex"),
    });

    res.status(201).json({ status: "success", data: { match } });
  } catch (err) {
    res.status(500).json({ message: "Match setup failed", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   PATCH /api/live/:matchId/start
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
   ── BUG FIXES ──────────────────────────────────────────────
   1. Wide AND no-ball are NOT valid deliveries (don't count as balls)
   2. Strike rotation uses total runs, not just batter runs
   3. overCompleted flag returned so UI can force bowler change
   4. Persistence done with $inc/$set (not Mongoose change detection)
   5. Over completed → requires new bowler before next ball
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
      extra_type = null,
      runs_extras = 0,
      wicket = false,
      wicket_kind = null,
      player_out = null,
      newBatter = null,
    } = req.body;

    /* ── FIX 1: delivery validity ─────────────────────────
       Wide   → not a valid delivery (must be re-bowled, no ball count)
       No-ball → not a valid delivery (must be re-bowled, no ball count)
       Everything else → valid delivery                                   */
    const isWide = extra_type === "wide";
    const isNoball = extra_type === "noball";
    const isValid = !isWide && !isNoball; // ← FIXED (was: !isWide only)

    const runs_total = runs_batter + runs_extras;
    /* runs conceded to bowler: extras from wides count, byes/lb don't */
    const runs_bowler = isNoball
      ? runs_batter // no-ball: only batter runs count to bowler
      : isWide
        ? runs_extras // wide: all extras count to bowler
        : runs_batter; // normal: only batter runs count to bowler

    /* Current position before update */
    const inn = `innings${match.currentInnings}`;
    const innObj = match[inn];
    const currentOver = Math.floor(innObj.balls / 6); // 0-based
    const ballInOver = (innObj.balls % 6) + 1; // 1-based within over

    /* ── Check: if over just ended, bowler MUST change first ──
       (overRequired flag set in previous response)               */
    if (match.overRequiresBowlerChange) {
      return res.status(400).json({
        message: "Over complete — select new bowler before recording next ball",
        overRequiresBowlerChange: true,
      });
    }

    /* ── Save delivery ──────────────────────────────────── */
    await UserDelivery.create({
      matchId: match._id,
      userId: req.user._id,
      innings: match.currentInnings,
      over: currentOver,
      ball: ballInOver,
      batter: match.striker,
      non_striker: match.nonStriker,
      bowler: match.bowler,
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
      extra_type: extra_type || null,
      bowler_wicket: wicket && !isWide ? 1 : 0,
      wicket_kind: wicket ? wicket_kind : null,
      player_out: wicket ? player_out || match.striker : null,
      runs_target: match.currentInnings === 2 ? match.innings1.runs + 1 : 0,
      phase: phaseOf(currentOver),
    });

    /* ── FIX 4: use atomic updates for reliable persistence ─ */
    const incUpdate = {
      [`${inn}.runs`]: runs_total,
      [`${inn}.extras`]: runs_extras,
    };
    if (isValid) incUpdate[`${inn}.balls`] = 1;
    if (wicket && !isWide) incUpdate[`${inn}.wickets`] = 1;

    /* Apply $inc first, then re-read to get fresh values */
    await UserMatch.updateOne({ _id: match._id }, { $inc: incUpdate });
    const fresh = await UserMatch.findById(match._id);
    const freshInn = fresh[inn];

    /* ── FIX 2: strike rotation uses runs_total, not runs_batter ─
       Rule: rotate after ODD total runs (batter + bye/lb)
             wides: NEVER rotate
             no-ball: batter runs count for rotation                 */
    let striker = match.striker;
    let nonStriker = match.nonStriker;

    if (isValid) {
      /* Runs-based rotation (use total runs for byes/lb) */
      const runsForRotation = runs_total;
      if (runsForRotation % 2 !== 0) {
        [striker, nonStriker] = [nonStriker, striker];
      }

      /* End-of-over rotation: if the new balls count is divisible by 6 */
      if (freshInn.balls % 6 === 0 && freshInn.balls > 0) {
        [striker, nonStriker] = [nonStriker, striker];
      }
    }
    /* Wide: 2 wides DO rotate strike (even number) — no change needed.
       If 1+1 wides happened... but per ball, this just stays as is.   */

    /* ── Handle wicket ──────────────────────────────────── */
    if (wicket && !isWide) {
      if (!newBatter && freshInn.wickets < 10)
        return res
          .status(400)
          .json({ message: "newBatter required after a wicket" });
      /* Dismissed batter replaced by newBatter */
      const outBatter = player_out || match.striker;
      if (outBatter === striker) striker = newBatter || "";
      else nonStriker = newBatter || "";
    }

    /* ── FIX 3: over completion → force bowler change ─────
       Do NOT allow bowler to bowl consecutive overs.
       Set a flag on the match; UI must call /bowler before next ball. */
    const overCompleted =
      isValid && freshInn.balls % 6 === 0 && freshInn.balls > 0;
    const overRequiresBowlerChange = overCompleted;

    /* ── Match/innings end check ────────────────────────── */
    const maxBalls = fresh.totalOvers * 6;
    let matchStatus = fresh.status;
    let winner = fresh.winner;
    let winOutcome = fresh.winOutcome;
    let nextInnings = fresh.currentInnings;

    const inn1Ended =
      fresh.currentInnings === 1 &&
      (freshInn.wickets >= 10 || freshInn.balls >= maxBalls);

    const inn2Ended =
      fresh.currentInnings === 2 &&
      (() => {
        const target = fresh.innings1.runs + 1;
        return (
          freshInn.wickets >= 10 ||
          freshInn.balls >= maxBalls ||
          freshInn.runs >= target
        );
      })();

    if (inn1Ended) {
      matchStatus = "innings_break";
      nextInnings = 2;
      striker = nonStriker = ""; // clear for innings 2 setup
    } else if (inn2Ended) {
      matchStatus = "completed";
      const target = fresh.innings1.runs + 1;
      const inn2 = fresh.innings2;
      const refreshedInn2Runs = freshInn.runs; // already updated
      if (refreshedInn2Runs >= target) {
        const wktsLeft = 10 - freshInn.wickets;
        winner = freshInn.battingTeam;
        winOutcome = `won by ${wktsLeft} wicket${wktsLeft !== 1 ? "s" : ""}`;
      } else {
        const diff = fresh.innings1.runs - refreshedInn2Runs;
        winner = fresh.innings1.battingTeam;
        winOutcome = `won by ${diff} run${diff !== 1 ? "s" : ""}`;
      }
    }

    /* ── Persist live state atomically ─────────────────── */
    await UserMatch.updateOne(
      { _id: match._id },
      {
        $set: {
          striker,
          nonStriker,
          status: matchStatus,
          currentInnings: nextInnings,
          winner,
          winOutcome,
          overRequiresBowlerChange: overCompleted && !inn1Ended && !inn2Ended,
          [`${inn}.overs`]: oversDisplay(freshInn.balls),
        },
      },
    );

    const finalMatch = await UserMatch.findById(match._id);

    /* live scoring stats */
    const target =
      finalMatch.currentInnings === 2 ? finalMatch.innings1.runs + 1 : null;
    const ballsLeft =
      target !== null ? finalMatch.totalOvers * 6 - freshInn.balls : null;

    res.json({
      status: "success",
      data: {
        match: finalMatch,
        overCompleted,
        overRequiresBowlerChange: finalMatch.overRequiresBowlerChange,
        innEnded: inn1Ended || inn2Ended,
        striker: finalMatch.striker,
        nonStriker: finalMatch.nonStriker,
        bowler: finalMatch.bowler,
        scorecard: {
          runs: freshInn.runs,
          wickets: freshInn.wickets,
          overs: oversDisplay(freshInn.balls),
          balls: freshInn.balls,
          target,
          rrr:
            target !== null && ballsLeft > 0
              ? parseFloat(
                  (((target - freshInn.runs) / ballsLeft) * 6).toFixed(2),
                )
              : null,
        },
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
   PATCH /api/live/:matchId/bowler
   ── FIX 5: change bowler WITHOUT recording a delivery ──────
   Called after every over completes. Clears overRequiresBowlerChange.
   ───────────────────────────────────────────────────────────── */
export const changeBowler = async (req, res) => {
  try {
    const match = await UserMatch.findOne({
      _id: req.params.matchId,
      userId: req.user._id,
    });
    if (!match) return res.status(404).json({ message: "Match not found" });

    const { bowler } = req.body;
    if (!bowler)
      return res.status(400).json({ message: "bowler name required" });

    /* Prevent the same bowler bowling consecutive overs */
    if (bowler === match.bowler) {
      return res
        .status(400)
        .json({ message: "Same bowler cannot bowl consecutive overs" });
    }

    await UserMatch.updateOne(
      { _id: match._id },
      { $set: { bowler, overRequiresBowlerChange: false } },
    );

    const updated = await UserMatch.findById(match._id);
    res.json({ status: "success", data: { match: updated } });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Bowler change failed", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   DELETE /api/live/:matchId/undo
   Remove last delivery and revert scorecard atomically
   ───────────────────────────────────────────────────────────── */
export const undoLastBall = async (req, res) => {
  try {
    const match = await UserMatch.findOne({
      _id: req.params.matchId,
      userId: req.user._id,
    });
    if (!match) return res.status(404).json({ message: "Match not found" });

    const last = await UserDelivery.findOne({ matchId: match._id })
      .sort({ createdAt: -1 })
      .lean();
    if (!last) return res.status(400).json({ message: "Nothing to undo" });

    await UserDelivery.findByIdAndDelete(last._id);

    const inn = `innings${last.innings}`;

    /* Revert using $inc with negative values — atomic and reliable */
    const decUpdate = {
      [`${inn}.runs`]: -last.runs_total,
      [`${inn}.extras`]: -last.runs_extras,
    };
    if (last.valid_ball === 1) decUpdate[`${inn}.balls`] = -1;
    if (last.bowler_wicket === 1) decUpdate[`${inn}.wickets`] = -1;

    await UserMatch.updateOne(
      { _id: match._id },
      {
        $inc: decUpdate,
        $set: {
          /* If the undone ball dismissed someone, restore them as striker */
          ...(last.bowler_wicket === 1 && last.player_out
            ? { striker: last.player_out }
            : {}),
          overRequiresBowlerChange: false,
        },
      },
    );

    /* Recalculate overs display */
    const fresh = await UserMatch.findById(match._id);
    const freshBalls = fresh[inn].balls;
    await UserMatch.updateOne(
      { _id: match._id },
      { $set: { [`${inn}.overs`]: oversDisplay(freshBalls) } },
    );

    const updated = await UserMatch.findById(match._id);
    res.json({ status: "success", data: { match: updated, undone: last } });
  } catch (err) {
    res.status(500).json({ message: "Undo failed", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   PATCH /api/live/:matchId/innings-break
   Set openers for innings 2
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

    await UserMatch.updateOne(
      { _id: match._id },
      {
        $set: {
          striker,
          nonStriker,
          bowler,
          status: "live",
          currentInnings: 2,
          overRequiresBowlerChange: false,
        },
      },
    );

    const updated = await UserMatch.findById(match._id);
    res.json({ status: "success", data: { match: updated } });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Innings 2 start failed", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/live/:matchId/state
   Live polling endpoint — always reads fresh from DB
   ───────────────────────────────────────────────────────────── */
export const getMatchState = async (req, res) => {
  try {
    const match = await UserMatch.findOne({
      _id: req.params.matchId,
      userId: req.user._id,
    });
    if (!match) return res.status(404).json({ message: "Match not found" });

    /* Last 6 valid deliveries for the over-ball display */
    const recentBalls = await UserDelivery.find({ matchId: match._id })
      .sort({ createdAt: -1 })
      .limit(12) // fetch 12 to ensure we have current over's balls
      .lean();

    /* Only show balls from the current over */
    const inn =
      match.currentInnings <= 2 ? `innings${match.currentInnings}` : "innings2";
    const innObj = match[inn];
    const currentOverNum = Math.floor(innObj.balls / 6);

    const currentOverBalls = recentBalls
      .filter(
        (b) => b.innings === match.currentInnings && b.over === currentOverNum,
      )
      .reverse();

    const target = match.currentInnings === 2 ? match.innings1.runs + 1 : null;
    const ballsLeft =
      target !== null ? match.totalOvers * 6 - innObj.balls : null;
    const rrr =
      target !== null && ballsLeft > 0
        ? parseFloat((((target - innObj.runs) / ballsLeft) * 6).toFixed(2))
        : null;
    const currentRR =
      innObj.balls > 0
        ? parseFloat(((innObj.runs / innObj.balls) * 6).toFixed(2))
        : 0;

    res.json({
      status: "success",
      data: {
        match,
        target,
        rrr,
        currentRR,
        currentOverBalls,
        overRequiresBowlerChange: match.overRequiresBowlerChange || false,
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
   Post-match deep analytics
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

    const playerBatting = {};
    deliveries.forEach((d) => {
      if (!playerBatting[d.batter])
        playerBatting[d.batter] = {
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          dots: 0,
        };
      playerBatting[d.batter].runs += d.runs_batter || 0;
      if (d.valid_ball === 1) playerBatting[d.batter].balls++;
      if (d.runs_batter === 0 && d.valid_ball === 1)
        playerBatting[d.batter].dots++;
      if (d.runs_batter === 4) playerBatting[d.batter].fours++;
      if (d.runs_batter === 6) playerBatting[d.batter].sixes++;
    });

    const playerBowling = {};
    deliveries.forEach((d) => {
      if (!playerBowling[d.bowler])
        playerBowling[d.bowler] = { runs: 0, balls: 0, wickets: 0 };
      playerBowling[d.bowler].runs += d.runs_bowler || 0;
      if (d.valid_ball === 1) playerBowling[d.bowler].balls++;
      playerBowling[d.bowler].wickets += d.bowler_wicket || 0;
    });

    const battingStats = Object.entries(playerBatting)
      .map(([name, s]) => ({
        playerName: name,
        runs: s.runs,
        balls: s.balls,
        fours: s.fours,
        sixes: s.sixes,
        dots: s.dots,
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
   GET /api/live/share/:shareToken  — public read
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
