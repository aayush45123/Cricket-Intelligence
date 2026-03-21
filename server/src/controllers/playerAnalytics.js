import Delivery from "../models/Delivery.js";

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
      message: "Error fetching top scorers",
      error: error.message,
    });
  }
};
