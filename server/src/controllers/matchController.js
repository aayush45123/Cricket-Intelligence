import Match from "../models/Match.js";

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
    res.status(201).json({
      status: "Success",
      mess: " match added ",
      data: savedMatch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching matches",
      error: error.message,
    });
  }
};
