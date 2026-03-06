import Match from "../models/Match.js";
import { generateMatchAnalytics } from "../utils/matchAnalytics.js";

export const createMatch = async (req, res) => {
  try {
    const matchData = req.body;
    const newMatch = new Match(matchData);
    const savedMatch = await newMatch.save();

    res.status(201).json({
      status: "Success",
      mess: " match added ",
      data: savedMatch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating match",
      error: error.message,
    });
  }
};

export const getMatches = async (req, res) => {
  try {
    const matches = await Match.find();
    const analyticsForMatches = matches.map((match) => {
      const analysis = generateMatchAnalytics(match);

      return {
        ...match.toObject(),
        analysis: analysis,
      };
    });
    res.status(200).json({
      status: "Success",
      mess: " matches fetched ",
      data: analyticsForMatches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching matches",
      error: error.message,
    });
  }
};



export const getAnalyticsSummary = async (req, res) => {
  try {
    const matches = await Match.find();
    const totalMatches = matches.length;

    const analytics = matches.map((match) => generateMatchAnalytics(match));

    const totalRunRateTeamA = analytics.reduce(
      (sum, match) => sum + match.runRateForTeamA,
      0,
    );

    const totalRunRateTeamB = analytics.reduce(
      (sum, match) => sum + match.runRateForTeamB,
      0,
    );

    const averageRunRateTeamA = totalRunRateTeamA / totalMatches;
    const averageRunRateTeamB = totalRunRateTeamB / totalMatches;

    const totalPI = analytics.reduce(
      (sum, match) =>
        sum + match.pressureIndexForTeamA + match.pressureIndexForTeamB,
      0,
    );

    const averagePI = totalPI / (totalMatches * 2);

    const dominantMatch = analytics.reduce((max, match) => {
      return match.winnerStrength > max.winnerStrength ? match : max;
    });

    res.status(200).json({
      status: "Success",
      message: "Analytics summary fetched",
      data: {
        totalMatches,
        averageRunRateTeamA,
        averageRunRateTeamB,
        averagePressureIndex: averagePI,
        mostDominantMatch: dominantMatch,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching analytics summary",
      error: error.message,
    });
  }
};
