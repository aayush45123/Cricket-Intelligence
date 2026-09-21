import Delivery from "../models/Deliveries.js";
import { generateMatchAnalytics } from "../utils/matchAnalytics.js";

/* ─────────────────────────────────────────────────────────────
   GET /api/matches
   All distinct matches — grouped from deliveries
   ───────────────────────────────────────────────────────────── */
export const getAllMatches = async (req, res) => {
  try {
    const matches = await Delivery.aggregate([
      {
        $group: {
          _id: "$match_id",
          date: { $first: "$date" },
          teamA: { $first: "$batting_team" },
          teamB: { $first: "$bowling_team" },
          venue: { $first: "$venue" },
          city: { $first: "$city" },
          winner: { $first: "$match_won_by" },
          season: { $first: "$season" },
          matchType: { $first: "$match_type" },
        },
      },
      {
        $project: {
          _id: 0,
          matchId: "$_id",
          date: 1,
          teamA: 1,
          teamB: 1,
          venue: 1,
          city: 1,
          winner: 1,
          season: 1,
          matchType: 1,
        },
      },
      { $sort: { date: -1 } },
    ]);

    res.json({ status: "success", total: matches.length, data: matches });
  } catch (error) {
    console.error("getAllMatches error:", error.message);
    res.status(500).json({ message: "Error fetching matches", error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/matches/:matchId
   Full scorecard + analytics for one match
   ───────────────────────────────────────────────────────────── */
export const getMatchById = async (req, res) => {
  try {
    const { matchId } = req.params;

    /* Handle both Number and String storage in DB */
    const matchIdNum = Number(matchId);
    const matchQuery = isNaN(matchIdNum)
      ? { match_id: matchId }
      : { match_id: { $in: [matchIdNum, matchId] } };

    const sampleDoc = await Delivery.findOne(matchQuery).lean();
    if (!sampleDoc) {
      return res.status(404).json({ message: "Match not found" });
    }

    /* Group by team × innings to get deterministic scorecard */
    const matchStats = await Delivery.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            match: "$match_id",
            innings: "$innings",
            team: "$batting_team",
          },
          runs: { $sum: "$runs_total" },
          wickets: {
            $sum: {
              $cond: [{ $eq: [{ $ifNull: ["$bowler_wicket", 0] }, 1] }, 1, 0],
            },
          },
          balls: {
            $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] },
          },
        },
      },
      /* Sort by innings so teamA = innings 1, teamB = innings 2 */
      { $sort: { "_id.innings": 1 } },
    ]);

    if (!matchStats.length) {
      return res.status(404).json({ message: "Insufficient match data" });
    }

    const ballsToOvers = (balls) =>
      Number((Math.floor(balls / 6) + (balls % 6) / 10).toFixed(1));

    /* innings 1 is the team that batted first */
    const inn1Stats = matchStats.find((s) => s._id.innings === 1);
    const inn2Stats = matchStats.find((s) => s._id.innings === 2);

    if (!inn1Stats || !inn2Stats) {
      return res.status(404).json({ message: "Incomplete innings data" });
    }

    const teamAName = inn1Stats._id.team;
    const teamBName = inn2Stats._id.team;

    /* Detailed batting stats per player */
    const batterStats = await Delivery.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { batter: "$batter", batting_team: "$batting_team", innings: "$innings" },
          runs: { $sum: "$runs_batter" },
          balls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
          fours: { $sum: { $cond: [{ $eq: ["$runs_batter", 4] }, 1, 0] } },
          sixes: { $sum: { $cond: [{ $eq: ["$runs_batter", 6] }, 1, 0] } },
          dismissals: {
            $push: { wicket_kind: "$wicket_kind", bowler: "$bowler" },
          },
        },
      },
      {
        $project: {
          _id: 1,
          runs: 1,
          balls: 1,
          fours: 1,
          sixes: 1,
          strikeRate: {
            $cond: [
              { $gt: ["$balls", 0] },
              { $round: [{ $multiply: [{ $divide: ["$runs", "$balls"] }, 100] }, 1] },
              0,
            ],
          },
          dismissalEvent: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$dismissals",
                  as: "d",
                  cond: { $ne: ["$$d.wicket_kind", null] },
                },
              },
              0,
            ],
          },
        },
      },
      { $sort: { "_id.innings": 1, runs: -1 } },
    ]);

    /* Detailed bowling stats per bowler */
    const bowlerStats = await Delivery.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { bowler: "$bowler", bowling_team: "$bowling_team", innings: "$innings" },
          runs: { $sum: "$runs_bowler" },
          wickets: { $sum: "$bowler_wicket" },
          balls: { $sum: { $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0] } },
          dots: {
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
          _id: 1,
          runs: 1,
          wickets: 1,
          balls: 1,
          dots: 1,
          economy: {
            $cond: [
              { $gt: ["$balls", 0] },
              { $round: [{ $multiply: [{ $divide: ["$runs", "$balls"] }, 6] }, 2] },
              0,
            ],
          },
        },
      },
      { $sort: { "_id.innings": 1, wickets: -1 } },
    ]);

    /* Extras per team */
    const extrasData = await Delivery.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { batting_team: "$batting_team", innings: "$innings" },
          extras: { $sum: "$runs_extras" },
        },
      },
    ]);

    const extrasForTeam = (teamName, innings) =>
      extrasData.find(
        (e) => e._id.batting_team === teamName && e._id.innings === innings,
      )?.extras || 0;

    const mapBatters = (team, innings) =>
      batterStats
        .filter((b) => b._id.batting_team === team && b._id.innings === innings)
        .map((b) => ({
          playerName: b._id.batter,
          runs: b.runs,
          balls: b.balls,
          fours: b.fours,
          sixes: b.sixes,
          strikeRate: b.strikeRate,
          dismissal: b.dismissalEvent?.wicket_kind || "Not Out",
          dismissedBy: b.dismissalEvent?.bowler || null,
        }));

    const mapBowlers = (bowlingTeam, innings) =>
      bowlerStats
        .filter((b) => b._id.bowling_team === bowlingTeam && b._id.innings === innings)
        .map((b) => ({
          playerName: b._id.bowler,
          runs: b.runs,
          wickets: b.wickets,
          overs: ballsToOvers(b.balls),
          economy: b.economy,
          dots: b.dots,
        }));

    const matchObject = {
      teams: {
        teamA: { name: teamAName },
        teamB: { name: teamBName },
      },
      innings: {
        statsByTeamA: {
          runs: inn1Stats.runs,
          wickets: inn1Stats.wickets,
          overs: ballsToOvers(inn1Stats.balls),
          extras: extrasForTeam(teamAName, 1),
          batters: mapBatters(teamAName, 1),
          bowlers: mapBowlers(teamBName, 1),
        },
        statsByTeamB: {
          runs: inn2Stats.runs,
          wickets: inn2Stats.wickets,
          overs: ballsToOvers(inn2Stats.balls),
          extras: extrasForTeam(teamBName, 2),
          batters: mapBatters(teamBName, 2),
          bowlers: mapBowlers(teamAName, 2),
        },
      },
      result: { winner: sampleDoc.match_won_by },
    };

    const analytics = generateMatchAnalytics(matchObject);

    res.json({
      status: "success",
      data: {
        matchId,
        venue: sampleDoc.venue,
        date: sampleDoc.date,
        season: sampleDoc.season,
        matchType: sampleDoc.match_type,
        tossWinner: sampleDoc.toss_winner,
        tossDecision: sampleDoc.toss_decision,
        playerOfMatch: sampleDoc.player_of_match,
        ...matchObject,
        analytics,
      },
    });
  } catch (error) {
    console.error("getMatchById error:", error.message);
    res.status(500).json({ message: "Error fetching match analytics", error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/matches/analytics/toss-impact
   ───────────────────────────────────────────────────────────── */
export const getTossImpactAnalytics = async (req, res) => {
  try {
    const matches = await Delivery.aggregate([
      {
        $group: {
          _id: "$match_id",
          tossWinner: { $first: "$toss_winner" },
          tossDecision: { $first: "$toss_decision" },
          winner: { $first: "$match_won_by" },
        },
      },
    ]);

    let batFirstWins = 0;
    let bowlFirstWins = 0;
    let tossWinnerMatchWins = 0;
    const total = matches.length;

    matches.forEach((match) => {
      if (!match.tossWinner || !match.winner) return;
      if (match.tossWinner === match.winner) {
        tossWinnerMatchWins++;
        if (match.tossDecision === "bat") batFirstWins++;
        else bowlFirstWins++;
      }
    });

    res.json({
      status: "success",
      data: {
        totalMatches: total,
        batFirstWins,
        bowlFirstWins,
        tossWinnerMatchWins,
        tossWinMatchPct: total > 0
          ? parseFloat(((tossWinnerMatchWins / total) * 100).toFixed(1))
          : 0,
      },
    });
  } catch (error) {
    console.error("getTossImpactAnalytics error:", error.message);
    res.status(500).json({ message: "Error calculating toss impact", error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/matches/analytics/match-intensity
   ───────────────────────────────────────────────────────────── */
export const getMatchIntensityAnalytics = async (req, res) => {
  try {
    const matches = await Delivery.aggregate([
      {
        $group: {
          _id: { match: "$match_id", battingTeam: "$batting_team" },
          runs: { $sum: "$runs_total" },
        },
      },
      {
        $group: {
          _id: "$_id.match",
          teams: {
            $push: { team: "$_id.battingTeam", runs: "$runs" },
          },
        },
      },
    ]);

    let veryCloseCount = 0;
    let competitiveCount = 0;
    let oneSidedCount = 0;

    matches.forEach((match) => {
      if (!match.teams || match.teams.length < 2) return;
      const runDiff = Math.abs(
        (match.teams[0]?.runs || 0) - (match.teams[1]?.runs || 0),
      );
      if (runDiff <= 10) veryCloseCount++;
      else if (runDiff <= 30) competitiveCount++;
      else oneSidedCount++;
    });

    res.json({
      status: "success",
      data: {
        total: matches.length,
        veryCloseCount,
        competitiveCount,
        oneSidedCount,
      },
    });
  } catch (error) {
    console.error("getMatchIntensityAnalytics error:", error.message);
    res.status(500).json({ message: "Error fetching match intensity analytics", error: error.message });
  }
};
