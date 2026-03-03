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
    const runRateForMatches = matches.map((match) => {
      const teamARunRate =
        match.innings.statsByTeamA.overs > 0
          ? match.innings.statsByTeamA.runs / match.innings.statsByTeamA.overs
          : 0;
      const teamBRunRate =
        match.innings.statsByTeamB.overs > 0
          ? match.innings.statsByTeamB.runs / match.innings.statsByTeamB.overs
          : 0;
      return {
        ...match.toObject(),
        analysis: {
          runRateForTeamA: teamARunRate,
          runRateForTeamB: teamBRunRate,
        },
      };
    });
    res.status(200).json({
      status: "Success",
      mess: " matches fetched ",
      data: runRateForMatches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching matches",
      error: error.message,
    });
  }
};
