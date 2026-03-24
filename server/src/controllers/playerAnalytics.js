import Delivery from "../models/Deliveries.js";

export const getTopRunScorers = async (req, res) => {
  try {
    const topPlayers = await Delivery.aggregate([
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
      data: topPlayers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching top run scorers",
      error: error.message,
    });
  }
};
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
        $limit: 1,
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
