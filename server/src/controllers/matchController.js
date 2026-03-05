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
      // PI is known as Pressure Index
      const PIForTeamA =
        match.innings.statsByTeamA.overs > 0
          ? match.innings.statsByTeamA.wickets /
            match.innings.statsByTeamA.overs
          : 0;
      const PIForTeamB =
        match.innings.statsByTeamB.overs > 0
          ? match.innings.statsByTeamB.wickets /
            match.innings.statsByTeamB.overs
          : 0;

      const runDifference = Math.abs(
        match.innings.statsByTeamA.runs - match.innings.statsByTeamB.runs,
      );
      let matchIntensity;

      if (runDifference < 5) {
        matchIntensity = "Very Close";
      } else if (runDifference <= 20) {
        matchIntensity = "Competitive";
      } else {
        matchIntensity = "One Sided";
      }

      const winner = match.result.winner;
      let winnerRunRate, loserRunRate;

      if (winner === match.teams.teamA.name) {
        winnerRunRate = teamARunRate;
        loserRunRate = teamBRunRate;
      } else {
        winnerRunRate = teamBRunRate;
        loserRunRate = teamARunRate;
      }
      const winnerStrength = runDifference + (winnerRunRate - loserRunRate) * 5;
      let winQiuality;
      if (winnerStrength < 5) {
        winQiuality = "Narrow/Close Win";
      } else if (winnerStrength <= 15) {
        winQiuality = "Decisive Win";
      } else {
        winQiuality = "Dominant Win";
      }
      const netRunRateForTeamA = teamARunRate - teamBRunRate;
      const netRunRateForTeamB = teamBRunRate - teamARunRate;

      return {
        ...match.toObject(),
        analysis: {
          runRateForTeamA: teamARunRate,
          runRateForTeamB: teamBRunRate,
          rundifference: runDifference,
          matchIntensity: matchIntensity,
          pressureIndexForTeamA: PIForTeamA,
          pressureIndexForTeamB: PIForTeamB,
          winnerStrength: winnerStrength,
          winQuality: winQiuality,
          netRunRateForTeamA: netRunRateForTeamA,
          netRunRateForTeamB: netRunRateForTeamB,
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
