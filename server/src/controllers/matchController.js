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
    const analysis = matches.map((match) => {
      const fullAnalytics = generateMatchAnalytics(match);

      const totalRunRateTeamA = analysis.reduce(
        (sum, match) => sum + match.runRateForTeamA,
        0,
      );
      const totalRunRateTeamB = analysis.reduce(
        (sum, match) => sum + match.runRateForTeamB,
        0,
      );
      const averageRunRateTeamA = totalRunRateTeamA / totalMatches;
      const averageRunRateTeamB = totalRunRateTeamB / totalMatches;

      const totalPI = analysis.reduce(
        (sum, match) => sum + match.PIForTeamA + match.PIForTeamB,
        0,
      );
      const averagePI = totalPI / (totalMatches * 2);

      const dominantMatch = analysis.reduce((max, match) => {
        return match.winnerStrength > max.winnerStrength ? match : max;
      });
      return {
        averageRunRateTeamA: averageRunRateTeamA,
        averageRunRateTeamB: averageRunRateTeamB,
        averagePI: averagePI,
        mostDominantMatch: dominantMatch,
      };
    });
    res.status(200).json({
      status: "Success",
      mess: " analytics summary fetched ",
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching analytics summary",
      error: error.message,
    });
  }
};
