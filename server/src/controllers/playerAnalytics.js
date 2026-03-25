import Delivery from "../models/Deliveries.js";
import { computeBowlingStats } from "../utils/bowlingStats.js";

export const getTopWicketTakers = async (req, res) => {
  try {
    const topBowlers = await Delivery.aggregate([
      {
        $group: {
          _id: "$bowler",
          totalWickets: { $sum: "$bowler_wicket" },
        },
      },
      {
        $sort: { totalWickets: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 0,
          playerName: "$_id",
          totalWickets: 1,
        },
      },
    ]);

    res.json({
      status: "success",
      data: topBowlers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching top wicket takers",
      error: error.message,
    });
  }
};

export const getTopRunScorer = async (req, res) => {
  try {
    const topRunScorer = await Delivery.aggregate([
      {
        $group: {
          _id: "$batter",
          totalRuns: { $sum: "$runs_batter" },
        },
      },
      {
        $sort: { totalRuns: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 0,
          playerName: "$_id",
          totalRuns: 1,
        },
      },
    ]);

    res.json({
      status: "success",
      data: topRunScorer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching top run scorer",
      error: error.message,
    });
  }
};

export const getBowlingStats = async (req, res) => {
  try {
    const matches = await Delivery.find({});
    const stats = computeBowlingStats(matches);
    res.json({
      status: "success",
      results: stats.length,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching bowling stats",
      error: error.message,
    });
  }
};

export const specificBowlerStats = async (req, res) => {
  try {
    const { playerName } = req.params;
    const matches = await Delivery.find({ bowler: playerName });
    const stats = computeBowlingStats(matches);
    const playerStats = stats.find((stat) => stat.playerName === playerName);
    if (!playerStats) {
      return res.status(404).json({
        message: "Bowler not found",
      });
    }
    res.json({
      status: "success",
      data: playerStats,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching bowler stats",
      error: error.message,
    });
  }
};
