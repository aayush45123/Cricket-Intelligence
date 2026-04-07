import Delivery from "../models/Deliveries.js";

/* ── Pitch classification ──────────────────────────────────── */
const classifyPitch = (avgRuns) => {
  if (avgRuns > 170) return { type: "Batting Friendly", code: "batting" };
  if (avgRuns < 150) return { type: "Bowling Friendly", code: "bowling" };
  return { type: "Balanced", code: "balanced" };
};

/* ─────────────────────────────────────────────────────────────
   GET /api/venues
   All venues with summary stats
   ───────────────────────────────────────────────────────────── */
export const getAllVenues = async (req, res) => {
  try {
    const raw = await Delivery.aggregate([
      {
        $group: {
          _id: { matchId: "$match_id", venue: "$venue", city: "$city" },
          innings1Runs: {
            $sum: { $cond: [{ $eq: ["$innings", 1] }, "$runs_total", 0] },
          },
          innings2Runs: {
            $sum: { $cond: [{ $eq: ["$innings", 2] }, "$runs_total", 0] },
          },
          innings1Wickets: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$innings", 1] },
                    { $eq: ["$bowler_wicket", 1] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          innings2Wickets: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$innings", 2] },
                    { $eq: ["$bowler_wicket", 1] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          winner: { $first: "$match_won_by" },
          battingFirst: { $first: "$batting_team" }, // inn1 batting team
          tossWinner: { $first: "$toss_winner" },
          tossDecision: { $first: "$toss_decision" },
        },
      },
      {
        $group: {
          _id: "$_id.venue",
          city: { $first: "$_id.city" },
          totalMatches: { $sum: 1 },
          totalInn1Runs: { $sum: "$innings1Runs" },
          totalInn2Runs: { $sum: "$innings2Runs" },
          totalInn1Wickets: { $sum: "$innings1Wickets" },
          totalInn2Wickets: { $sum: "$innings2Wickets" },
          matches: {
            $push: {
              winner: "$winner",
              battingFirst: "$battingFirst",
              tossWinner: "$tossWinner",
              tossDecision: "$tossDecision",
            },
          },
        },
      },
      { $sort: { totalMatches: -1 } },
    ]);

    const venues = raw.map((v) => {
      const avgInn1 = v.totalMatches > 0 ? v.totalInn1Runs / v.totalMatches : 0;
      const avgInn2 = v.totalMatches > 0 ? v.totalInn2Runs / v.totalMatches : 0;
      const avgRuns = (avgInn1 + avgInn2) / 2;
      const avgWickets =
        v.totalMatches > 0
          ? (v.totalInn1Wickets + v.totalInn2Wickets) / v.totalMatches
          : 0;

      // Batting first vs chasing wins
      let battingFirstWins = 0;
      let chasingWins = 0;
      let tossWinMatchWin = 0;

      v.matches.forEach((m) => {
        if (m.winner === m.battingFirst) battingFirstWins++;
        else chasingWins++;
        if (m.tossWinner === m.winner) tossWinMatchWin++;
      });

      const battingFirstPct =
        v.totalMatches > 0 ? (battingFirstWins / v.totalMatches) * 100 : 50;
      const tossBias =
        v.totalMatches > 0 ? (tossWinMatchWin / v.totalMatches) * 100 : 50;

      const pitch = classifyPitch(avgInn1);

      return {
        venue: v._id,
        city: v.city,
        totalMatches: v.totalMatches,
        avgFirstInningsScore: parseFloat(avgInn1.toFixed(1)),
        avgSecondInningsScore: parseFloat(avgInn2.toFixed(1)),
        avgWicketsPerMatch: parseFloat(avgWickets.toFixed(1)),
        battingFirstWinPct: parseFloat(battingFirstPct.toFixed(1)),
        chasingWinPct: parseFloat((100 - battingFirstPct).toFixed(1)),
        tossWinMatchWinPct: parseFloat(tossBias.toFixed(1)),
        pitchType: pitch.type,
        pitchCode: pitch.code,
      };
    });

    res.json({ status: "success", total: venues.length, data: venues });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching venues", error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/venues/:venue
   Deep analytics for one venue
   ───────────────────────────────────────────────────────────── */
export const getVenueDetails = async (req, res) => {
  try {
    const venue = decodeURIComponent(req.params.venue);

    /* Per-match data */
    const matchData = await Delivery.aggregate([
      { $match: { venue } },
      {
        $group: {
          _id: { matchId: "$match_id", innings: "$innings" },
          runs: { $sum: "$runs_total" },
          wickets: { $sum: "$bowler_wicket" },
          overs: { $max: "$over" },
          battingTeam: { $first: "$batting_team" },
          bowlingTeam: { $first: "$bowling_team" },
          winner: { $first: "$match_won_by" },
          tossWinner: { $first: "$toss_winner" },
          tossDecision: { $first: "$toss_decision" },
          matchType: { $first: "$match_type" },
          date: { $first: "$date" },
          season: { $first: "$season" },
        },
      },
      { $sort: { "_id.matchId": 1, "_id.innings": 1 } },
    ]);

    if (!matchData.length) {
      return res.status(404).json({ message: "Venue not found or no data." });
    }

    /* Group by match */
    const matchMap = {};
    matchData.forEach((d) => {
      const id = d._id.matchId;
      if (!matchMap[id]) matchMap[id] = { inn1: null, inn2: null, meta: d };
      if (d._id.innings === 1) matchMap[id].inn1 = d;
      if (d._id.innings === 2) matchMap[id].inn2 = d;
    });

    const matches = Object.values(matchMap);
    const totalMatches = matches.length;

    /* Aggregated stats */
    let totalInn1Runs = 0,
      totalInn2Runs = 0;
    let totalInn1Wickets = 0,
      totalInn2Wickets = 0;
    let battingFirstWins = 0,
      chasingWins = 0;
    let tossWinMatchWins = 0;
    let tossFieldWins = 0,
      tossBatWins = 0;
    let tossFieldCount = 0,
      tossBatCount = 0;
    const seasonMap = {};
    const teamWins = {};

    matches.forEach((m) => {
      const inn1 = m.inn1;
      const inn2 = m.inn2;
      const meta = m.meta;

      if (inn1) {
        totalInn1Runs += inn1.runs;
        totalInn1Wickets += inn1.wickets;
      }
      if (inn2) {
        totalInn2Runs += inn2.runs;
        totalInn2Wickets += inn2.wickets;
      }

      const winner = meta.winner;
      const battingFirst = inn1?.battingTeam || "";

      if (winner === battingFirst) battingFirstWins++;
      else chasingWins++;

      if (winner === meta.tossWinner) tossWinMatchWins++;

      if (meta.tossDecision === "field") {
        tossFieldCount++;
        if (winner === meta.tossWinner) tossFieldWins++;
      } else {
        tossBatCount++;
        if (winner === meta.tossWinner) tossBatWins++;
      }

      // Season avg first innings score
      const season = meta.season || "Unknown";
      if (!seasonMap[season]) seasonMap[season] = { runs: 0, matches: 0 };
      if (inn1) {
        seasonMap[season].runs += inn1.runs;
        seasonMap[season].matches++;
      }

      // Team wins at venue
      if (winner) {
        teamWins[winner] = (teamWins[winner] || 0) + 1;
      }
    });

    const avgInn1 = totalMatches > 0 ? totalInn1Runs / totalMatches : 0;
    const avgInn2 = totalMatches > 0 ? totalInn2Runs / totalMatches : 0;
    const avgWickets =
      totalMatches > 0
        ? (totalInn1Wickets + totalInn2Wickets) / totalMatches
        : 0;
    const pitch = classifyPitch(avgInn1);

    /* Toss decision effectiveness */
    const tossFieldWinPct =
      tossFieldCount > 0 ? (tossFieldWins / tossFieldCount) * 100 : 0;
    const tossBatWinPct =
      tossBatCount > 0 ? (tossBatWins / tossBatCount) * 100 : 0;
    const tossImpact =
      totalMatches > 0 ? (tossWinMatchWins / totalMatches) * 100 : 50;

    /* Season trend */
    const seasonTrend = Object.entries(seasonMap)
      .map(([season, d]) => ({
        season,
        avgScore:
          d.matches > 0 ? parseFloat((d.runs / d.matches).toFixed(1)) : 0,
        matches: d.matches,
      }))
      .sort((a, b) => a.season.localeCompare(b.season));

    /* Top teams at venue */
    const topTeams = Object.entries(teamWins)
      .map(([team, wins]) => ({ team, wins }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 8);

    /* Score distribution for histogram (bucket by 10-run intervals) */
    const scoreBuckets = {};
    matches.forEach((m) => {
      if (!m.inn1) return;
      const bucket = Math.floor(m.inn1.runs / 10) * 10;
      const key = `${bucket}–${bucket + 9}`;
      scoreBuckets[key] = (scoreBuckets[key] || 0) + 1;
    });
    const scoreDistribution = Object.entries(scoreBuckets)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => parseInt(a.range) - parseInt(b.range));

    res.json({
      status: "success",
      data: {
        venue,
        city: matchData[0]?.battingTeam ? (matchData[0]?._id?.city ?? "") : "",
        totalMatches,
        pitchType: pitch.type,
        pitchCode: pitch.code,
        avgFirstInningsScore: parseFloat(avgInn1.toFixed(1)),
        avgSecondInningsScore: parseFloat(avgInn2.toFixed(1)),
        avgWicketsPerMatch: parseFloat(avgWickets.toFixed(1)),
        battingFirstWins,
        chasingWins,
        battingFirstWinPct: parseFloat(
          ((battingFirstWins / totalMatches) * 100).toFixed(1),
        ),
        chasingWinPct: parseFloat(
          ((chasingWins / totalMatches) * 100).toFixed(1),
        ),
        tossImpact: parseFloat(tossImpact.toFixed(1)),
        tossDecisionBreakdown: {
          field: {
            count: tossFieldCount,
            winPct: parseFloat(tossFieldWinPct.toFixed(1)),
          },
          bat: {
            count: tossBatCount,
            winPct: parseFloat(tossBatWinPct.toFixed(1)),
          },
        },
        seasonTrend,
        topTeams,
        scoreDistribution,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching venue details", error: error.message });
  }
};
