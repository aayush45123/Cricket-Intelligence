import Delivery from "../models/Deliveries.js";

const buildBowlingStatsFromDeliveries = (rows) => {
  return rows.map((row) => {
    const totalWickets = row.totalWickets || 0;
    const totalBallsBowled = row.totalBallsBowled || 0;
    const totalRunsConceded = row.totalRunsConceded || 0;

    const bowlingEconomyRate =
      totalBallsBowled > 0 ? (totalRunsConceded / totalBallsBowled) * 6 : 0;
    const bowlingAverage =
      totalWickets > 0 ? totalRunsConceded / totalWickets : totalRunsConceded;
    const bowlingStrikeRate =
      totalWickets > 0 ? totalBallsBowled / totalWickets : 0;

    return {
      playerName: row.playerName,
      totalWickets,
      totalRunsConceded,
      totalBallsBowled,
      bowlingAverage,
      bowlingEconomyRate,
      bowlingStrikeRate,
    };
  });
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
    const statsByBowler = await Delivery.aggregate([
      {
        $group: {
          _id: "$bowler",
          totalWickets: { $sum: "$bowler_wicket" },
          totalRunsConceded: { $sum: "$runs_bowler" },
          totalBallsBowled: {
            $sum: {
              $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          playerName: "$_id",
          totalWickets: 1,
          totalRunsConceded: 1,
          totalBallsBowled: 1,
        },
      },
      {
        $sort: { totalWickets: -1, totalRunsConceded: 1 },
      },
    ]);

    const stats = buildBowlingStatsFromDeliveries(statsByBowler);

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
    const playerName = decodeURIComponent(req.params.playerName);

    const statsByBowler = await Delivery.aggregate([
      {
        $match: { bowler: playerName },
      },
      {
        $group: {
          _id: "$bowler",
          totalWickets: { $sum: "$bowler_wicket" },
          totalRunsConceded: { $sum: "$runs_bowler" },
          totalBallsBowled: {
            $sum: {
              $cond: [{ $eq: ["$valid_ball", 1] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          playerName: "$_id",
          totalWickets: 1,
          totalRunsConceded: 1,
          totalBallsBowled: 1,
        },
      },
    ]);

    if (!statsByBowler.length) {
      return res.status(404).json({
        message: "Bowler not found",
      });
    }

    const playerStats = buildBowlingStatsFromDeliveries(statsByBowler)[0];

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
