import Delivery from "../models/Deliveries.js";

/* ─────────────────────────────────────────────────────────────
   GET /api/teams/head-to-head?teamA=Mumbai+Indians&teamB=Chennai+Super+Kings&season=2024
   
   Returns head-to-head records between two teams.
   Aggregates from match-level data (one record per match_id).
   ───────────────────────────────────────────────────────────── */
export const getHeadToHead = async (req, res) => {
  try {
    const { teamA, teamB, season } = req.query;

    if (!teamA || !teamB) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Both teamA and teamB query parameters are required.",
        },
      });
    }

    const tA = decodeURIComponent(teamA).trim();
    const tB = decodeURIComponent(teamB).trim();

    if (tA === tB) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "teamA and teamB must be different teams.",
        },
      });
    }

    // Base filter: deliveries that involve BOTH teams in the same match.
    // We match deliveries where batting_team OR bowling_team is one of the two teams.
    const baseMatch = {
      $or: [
        {
          $and: [
            { batting_team: tA },
            { bowling_team: tB },
          ],
        },
        {
          $and: [
            { batting_team: tB },
            { bowling_team: tA },
          ],
        },
      ],
    };

    if (season) {
      // Validate season format
      if (!/^\d{4}(\/\d{2})?$/.test(season.trim())) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid season format. Use YYYY or YYYY/YY." },
        });
      }
      baseMatch.season = season.trim();
    }

    // Step 1: Get one record per match (distinct match_id)
    const matchSummaries = await Delivery.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: "$match_id",
          date: { $first: "$date" },
          season: { $first: "$season" },
          venue: { $first: "$venue" },
          city: { $first: "$city" },
          winner: { $first: "$match_won_by" },
          tossWinner: { $first: "$toss_winner" },
          tossDecision: { $first: "$toss_decision" },
          // First innings batting team
          inn1BattingTeam: {
            $first: {
              $cond: [{ $eq: ["$innings", 1] }, "$batting_team", null],
            },
          },
        },
      },
      { $sort: { date: -1 } },
    ]);

    if (!matchSummaries.length) {
      return res.json({
        success: true,
        data: {
          teamA: tA,
          teamB: tB,
          totalMatches: 0,
          teamAWins: 0,
          teamBWins: 0,
          noResult: 0,
          recentMatches: [],
          venueBreakdown: [],
          seasonBreakdown: [],
          tossAnalysis: { teamATossWins: 0, teamBTossWins: 0, tossWinMatchWinPct: 0 },
        },
      });
    }

    // Step 2: Compute aggregated stats
    let teamAWins = 0;
    let teamBWins = 0;
    let noResult = 0;
    let tossWinMatchWin = 0;
    let teamATossWins = 0;
    let teamBTossWins = 0;

    const venueMap = {};
    const seasonMap = {};

    matchSummaries.forEach((m) => {
      const winner = m.winner;

      if (!winner) {
        noResult++;
      } else if (winner === tA) {
        teamAWins++;
      } else if (winner === tB) {
        teamBWins++;
      } else {
        noResult++;
      }

      // Toss analysis
      if (m.tossWinner === tA) teamATossWins++;
      else if (m.tossWinner === tB) teamBTossWins++;
      if (m.tossWinner && m.tossWinner === winner) tossWinMatchWin++;

      // Venue breakdown
      const v = m.venue || "Unknown";
      if (!venueMap[v]) venueMap[v] = { venue: v, matches: 0, teamAWins: 0, teamBWins: 0 };
      venueMap[v].matches++;
      if (winner === tA) venueMap[v].teamAWins++;
      else if (winner === tB) venueMap[v].teamBWins++;

      // Season breakdown
      const s = m.season || "Unknown";
      if (!seasonMap[s]) seasonMap[s] = { season: s, matches: 0, teamAWins: 0, teamBWins: 0 };
      seasonMap[s].matches++;
      if (winner === tA) seasonMap[s].teamAWins++;
      else if (winner === tB) seasonMap[s].teamBWins++;
    });

    const totalMatches = matchSummaries.length;

    // Recent 10 matches for the history table
    const recentMatches = matchSummaries.slice(0, 10).map((m) => ({
      matchId: m._id,
      date: m.date,
      season: m.season,
      venue: m.venue,
      city: m.city,
      winner: m.winner || "No Result",
      tossWinner: m.tossWinner,
      tossDecision: m.tossDecision,
    }));

    const venueBreakdown = Object.values(venueMap)
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 10);

    const seasonBreakdown = Object.values(seasonMap).sort((a, b) =>
      b.season.localeCompare(a.season)
    );

    res.json({
      success: true,
      data: {
        teamA: tA,
        teamB: tB,
        totalMatches,
        teamAWins,
        teamBWins,
        noResult,
        teamAWinPct:
          totalMatches > 0
            ? parseFloat(((teamAWins / totalMatches) * 100).toFixed(1))
            : 0,
        teamBWinPct:
          totalMatches > 0
            ? parseFloat(((teamBWins / totalMatches) * 100).toFixed(1))
            : 0,
        tossAnalysis: {
          teamATossWins,
          teamBTossWins,
          tossWinMatchWinPct:
            totalMatches > 0
              ? parseFloat(((tossWinMatchWin / totalMatches) * 100).toFixed(1))
              : 0,
        },
        recentMatches,
        venueBreakdown,
        seasonBreakdown,
      },
    });
  } catch (error) {
    console.error("getHeadToHead error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message },
    });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/teams
   All distinct teams for the dropdown selectors
   ───────────────────────────────────────────────────────────── */
export const getAllTeams = async (_req, res) => {
  try {
    const [battingTeams, bowlingTeams] = await Promise.all([
      Delivery.distinct("batting_team"),
      Delivery.distinct("bowling_team"),
    ]);

    const teams = [...new Set([...battingTeams, ...bowlingTeams])]
      .filter(Boolean)
      .sort();

    res.json({ success: true, total: teams.length, data: teams });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message },
    });
  }
};
