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
              $cond: [{ $ifNull: ["$wicket_kind", false] }, 1, 0],
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
        },
        statsByTeamB: {
          runs: teamB.runs,
          wickets: teamB.wickets,
          overs: ballsToOvers(teamB.balls),
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
    res
      .status(500)
      .json({
        message: "Error fetching match analytics",
        error: error.message,
      });
  }
};
