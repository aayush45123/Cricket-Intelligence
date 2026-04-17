import Delivery from "../models/Deliveries.js";
import { generateMatchAnalytics } from "../utils/matchAnalytics.js";

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
        },
      },
      { $sort: { date: -1 } },
    ]);

    res.json({ status: "success", data: matches });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching matches", error: error.message });
  }
};

export const getMatchById = async (req, res) => {
  try {
    const { matchId } = req.params;

    // ✅ Handle both string and number storage in DB
    const matchIdNum = Number(matchId);
    const matchQuery = isNaN(matchIdNum)
      ? { match_id: matchId }
      : { match_id: { $in: [matchIdNum, matchId] } };

    // Debug: confirm records exist
    const sampleDoc = await Delivery.findOne(matchQuery);
    if (!sampleDoc) {
      console.log(`No delivery found for match_id: ${matchId}`);
      return res.status(404).json({ message: "Match not found" });
    }
    console.log(
      "Sample doc match_id:",
      sampleDoc.match_id,
      typeof sampleDoc.match_id,
    );

    const matchStats = await Delivery.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            match: "$match_id",
            team: "$batting_team",
          },
          runs: { $sum: "$runs_total" },
          wickets: {
            $sum: {
              $cond: [{ $eq: [{ $ifNull: ["$bowler_wicket", 0] }, 1] }, 1, 0],
            },
          },
          balls: {
            $sum: {
              $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0],
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.match",
          teams: {
            $push: {
              team: "$_id.team",
              runs: "$runs",
              wickets: "$wickets",
              balls: "$balls",
            },
          },
        },
      },
    ]);

    console.log("matchStats:", JSON.stringify(matchStats, null, 2));

    if (!matchStats.length || matchStats[0].teams.length < 2) {
      return res.status(404).json({ message: "Insufficient match data" });
    }

    const matchData = matchStats[0];

    const ballsToOvers = (balls) =>
      Number((Math.floor(balls / 6) + (balls % 6) / 10).toFixed(1));

    const teamA = matchData.teams[0];
    const teamB = matchData.teams[1];

    const meta = await Delivery.findOne(matchQuery);

    // Fetch detailed batting stats by batter
    const batterStats = await Delivery.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { batter: "$batter", batting_team: "$batting_team" },
          runs: { $sum: "$runs_batter" },
          balls: { $sum: 1 },
          dismissals: {
            $push: {
              wicket_kind: "$wicket_kind",
              bowler: "$bowler",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          runs: 1,
          balls: 1,
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
      { $sort: { runs: -1 } },
    ]);

    // Fetch detailed bowling stats by bowler
    const bowlerStats = await Delivery.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { bowler: "$bowler", bowling_team: "$bowling_team" },
          runs: { $sum: "$runs_bowler" },
          wickets: { $sum: "$bowler_wicket" },
          balls: {
            $sum: {
              $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0],
            },
          },
        },
      },
      { $sort: { wickets: -1 } },
    ]);

    // Fetch extras
    const extrasData = await Delivery.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$batting_team",
          extras: { $sum: "$runs_extras" },
        },
      },
    ]);

    const matchObject = {
      teams: {
        teamA: { name: teamA.team },
        teamB: { name: teamB.team },
      },
      innings: {
        statsByTeamA: {
          runs: teamA.runs,
          wickets: teamA.wickets,
          overs: ballsToOvers(teamA.balls),
          batters: batterStats
            .filter((b) => b._id.batting_team === teamA.team)
            .map((b) => ({
              playerName: b._id.batter,
              runs: b.runs,
              balls: b.balls,
              dismissal: b.dismissalEvent?.wicket_kind || "Not Out",
              dismissedBy: b.dismissalEvent?.bowler,
            })),
          bowlers: bowlerStats
            .filter((b) => b._id.bowling_team === teamB.team)
            .map((b) => ({
              playerName: b._id.bowler,
              runs: b.runs,
              wickets: b.wickets,
              overs: ballsToOvers(b.balls),
            })),
          extras: extrasData.find((e) => e._id === teamA.team)?.extras || 0,
        },
        statsByTeamB: {
          runs: teamB.runs,
          wickets: teamB.wickets,
          overs: ballsToOvers(teamB.balls),
          batters: batterStats
            .filter((b) => b._id.batting_team === teamB.team)
            .map((b) => ({
              playerName: b._id.batter,
              runs: b.runs,
              balls: b.balls,
              dismissal: b.dismissalEvent?.wicket_kind || "Not Out",
              dismissedBy: b.dismissalEvent?.bowler,
            })),
          bowlers: bowlerStats
            .filter((b) => b._id.bowling_team === teamA.team)
            .map((b) => ({
              playerName: b._id.bowler,
              runs: b.runs,
              wickets: b.wickets,
              overs: ballsToOvers(b.balls),
            })),
          extras: extrasData.find((e) => e._id === teamB.team)?.extras || 0,
        },
      },
      result: {
        winner: meta.match_won_by,
      },
    };

    const analytics = generateMatchAnalytics(matchObject);

    res.json({
      status: "success",
      data: {
        matchId,
        ...matchObject,
        analytics,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching match analytics",
      error: error.message,
    });
  }
};

export const getTossImpactAnalytics = async (req, res) => {
  try {
    const matches = await Delivery.aggregate([
      {
        $group: {
          _id: "$match_id",
          tossWinner: { $first: "$toss_winner" },
          tossDecision: { $first: "$toss_decision" },
          winner: { $first: "$match_won_by" },
          teamA: { $first: "$batting_team" },
        },
      },
    ]);

    let batFirstWins = 0;
    let bowlFirstWins = 0;

    matches.forEach((match) => {
      if (!match.tossWinner || !match.winner) return;

      const tossWinnerName = match.tossWinner;
      const matchWinner = match.winner;
      const decision = match.tossDecision || "bat";

      if (tossWinnerName === matchWinner) {
        if (decision === "bat") {
          batFirstWins++;
        } else {
          bowlFirstWins++;
        }
      }
    });

    res.json({
      status: "success",
      data: {
        batFirstWins,
        bowlFirstWins,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error calculating toss impact",
      error: error.message,
    });
  }
};

export const getMatchIntensityAnalytics = async (req, res) => {
  try {
    const matches = await Delivery.aggregate([
      {
        $group: {
          _id: {
            match: "$match_id",
            battingTeam: "$batting_team",
          },
          runs: { $sum: "$runs_total" },
        },
      },
      {
        $group: {
          _id: "$_id.match",
          teams: {
            $push: {
              team: "$_id.battingTeam",
              runs: "$runs",
            },
          },
        },
      },
    ]);

    let veryCloseCount = 0;
    let competitiveCount = 0;
    let oneSidedCount = 0;

    matches.forEach((match) => {
      if (!match.teams || match.teams.length < 2) return;

      const team1Runs = match.teams[0]?.runs || 0;
      const team2Runs = match.teams[1]?.runs || 0;
      const runDiff = Math.abs(team1Runs - team2Runs);

      if (runDiff <= 10) {
        veryCloseCount++;
      } else if (runDiff <= 30) {
        competitiveCount++;
      } else {
        oneSidedCount++;
      }
    });

    res.json({
      status: "success",
      data: {
        veryCloseCount,
        competitiveCount,
        oneSidedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching match intensity analytics",
      error: error.message,
    });
  }
};
