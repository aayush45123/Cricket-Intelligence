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

    if (totalMatches === 0) {
      return res.status(200).json({
        status: "Success",
        message: "No matches available",
        data: {
          totalMatches: 0,
          averageRunRateTeamA: 0,
          averageRunRateTeamB: 0,
          averagePressureIndex: 0,
          mostDominantMatch: null,
        },
      });
    }

    // Generate analytics for each match
    const analytics = matches.map((match) => {
      const analysis = generateMatchAnalytics(match);
      return {
        match,
        analysis,
      };
    });

    // Calculate run rates
    const totalRunRateTeamA = analytics.reduce(
      (sum, item) => sum + item.analysis.runRateForTeamA,
      0,
    );

    const totalRunRateTeamB = analytics.reduce(
      (sum, item) => sum + item.analysis.runRateForTeamB,
      0,
    );

    const averageRunRateTeamA = totalRunRateTeamA / totalMatches;
    const averageRunRateTeamB = totalRunRateTeamB / totalMatches;

    // Calculate pressure index
    const totalPI = analytics.reduce(
      (sum, item) =>
        sum +
        item.analysis.pressureIndexForTeamA +
        item.analysis.pressureIndexForTeamB,
      0,
    );

    const averagePI = totalPI / (totalMatches * 2);

    // Find most dominant match
    const dominantMatch = analytics.reduce((max, item) => {
      return item.analysis.winnerStrength > max.analysis.winnerStrength
        ? item
        : max;
    });

    res.status(200).json({
      status: "Success",
      message: "Analytics summary fetched",
      data: {
        totalMatches,
        averageRunRateTeamA: Number(averageRunRateTeamA.toFixed(2)),
        averageRunRateTeamB: Number(averageRunRateTeamB.toFixed(2)),
        averagePressureIndex: Number(averagePI.toFixed(2)),
        mostDominantMatch: {
          teams: dominantMatch.match.teams,
          venue: dominantMatch.match.venue,
          result: dominantMatch.match.result,
          winnerStrength: dominantMatch.analysis.winnerStrength,
          winQuality: dominantMatch.analysis.winQuality,
        },
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
export const getTeamAnalytics = async (req, res) => {
  try {
    const matches = await Match.find();
    const stats = {};
    matches.forEach((match) => {
      const teamA = match.teams.teamA.name;
      const teamB = match.teams.teamB.name;

      if (!stats[teamA]) {
        stats[teamA] = {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          totalRunRate: 0,
        };
      }
      if (!stats[teamB]) {
        stats[teamB] = {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          totalRunRate: 0,
        };
      }

      stats[teamA].matchesPlayed++;
      stats[teamB].matchesPlayed++;

      const winner = match.result.winner;

      if (winner === teamA) {
        stats[teamA].wins++;
        stats[teamB].losses++;
      } else {
        stats[teamB].wins++;
        stats[teamA].losses++;
      }

      const analytics = generateMatchAnalytics(match);
      stats[teamA].totalRunRate += analytics.runRateForTeamA;
      stats[teamB].totalRunRate += analytics.runRateForTeamB;
    });
    const teams = Object.keys(stats).map((team) => ({
      team,
      matchesPlayed: stats[team].matchesPlayed,
      wins: stats[team].wins,
      losses: stats[team].losses,
      averageRunRate: stats[team].totalRunRate / stats[team].matchesPlayed,
    }));
    res.status(200).json({
      success: true,
      teams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching team analytics",
      error: error.message,
    });
  }
};

export const getTeamLeaderboard = async (req, res) => {
  try {
    const matches = await Match.find();
    const stats = {};
    matches.forEach((match) => {
      const teamA = match.teams.teamA.name;
      const teamB = match.teams.teamB.name;

      if (!stats[teamA]) {
        stats[teamA] = {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
        };
      }
      if (!stats[teamB]) {
        stats[teamB] = {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
        };
      }
      stats[teamA].matchesPlayed++;
      stats[teamB].matchesPlayed++;

      const winner = match.result.winner;

      if (winner === teamA) {
        stats[teamA].wins++;
        stats[teamB].losses++;
      } else {
        stats[teamB].wins++;
        stats[teamA].losses++;
      }
    });
    const teams = Object.keys(stats).map((team) => ({
      team,
      matchesPlayed: stats[team].matchesPlayed,
      wins: stats[team].wins,
      losses: stats[team].losses,
      winRate: (stats[team].wins / stats[team].matchesPlayed) * 100,
    }));
    res.status(200).json({
      success: true,
      teams: teams.sort((a, b) => b.winRate - a.winRate),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching team analytics",
      error: error.message,
    });
  }
};

export const getSpecificMatchInsights = async (req, res) => {
  try {
    const id = req.params.id;
    const match = await Match.findById(id);
    if (!match) {
      res.status(404).json({
        success: false,
        message: "Match not found",
      });
    } else {
      const insights = generateMatchAnalytics(match);
      res.status(200).json({
        success: true,
        match_id: id,
        teams: {
          teamA: match.teams.teamA.name,
          teamB: match.teams.teamB.name,
        },
        venue: match.venue,
        innings: match.innings,
        analysis: insights,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching match insights",
      error: error.message,
    });
  }
};
export const getTossImpactAnalytics = async (req, res) => {
  try {
    const matches = await Match.find();

    let batFirstWins = 0;
    let bowlFirstWins = 0;

    matches.forEach((match) => {
      const tossWinner =
        match.toss.wonBy === "teamA"
          ? match.teams.teamA.name
          : match.teams.teamB.name;

      if (match.result.winner === tossWinner) {
        if (match.toss.decision === "bat") {
          batFirstWins++;
        } else {
          bowlFirstWins++;
        }
      }
    });

    res.status(200).json({
      status: "success",
      data: {
        batFirstWins,
        bowlFirstWins,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error calculating toss impact",
    });
  }
};
