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
