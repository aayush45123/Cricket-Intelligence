export const computeBattingStats = (matches) => {
  const playerStats = {};

  const calculateBattingAverage = (runs, dismissals) => {
    if (dismissals === 0) return runs;
    return runs / dismissals;
  };

  const calculateStrikeRate = (runs, balls) => {
    if (balls === 0) return 0;
    return (runs / balls) * 100;
  };

  const battingCategory = (avg, sr, runs, balls) => {
    // 🚫 Ignore small sample size
    if (balls < 50) return { category: "Insufficient Data", score: 0 };

    let score = 0;

    // 🎯 Strike Rate (MOST important in T20)
    if (sr > 160) score += 40;
    else if (sr > 140) score += 30;
    else if (sr > 120) score += 20;
    else score += 10;

    // 🎯 Average (consistency)
    if (avg > 50) score += 30;
    else if (avg > 40) score += 25;
    else if (avg > 30) score += 15;
    else score += 5;

    // 🎯 Total Runs (impact / volume)
    if (runs > 1000) score += 30;
    else if (runs > 500) score += 20;
    else if (runs > 200) score += 10;
    else score += 5;

    // 🏆 Final classification
    let category = "";

    if (score >= 85) category = "Elite Batter 🔥";
    else if (score >= 65) category = "Match Winner";
    else if (score >= 50) category = "Consistent Performer";
    else if (score >= 35) category = "Average Batter";
    else category = "Below Average Batter";

    return { category, score };
  };

  matches.forEach((match) => {
    match.innings.statsByTeamA.runsByTeamAPlayers.forEach((player) => {
      if (!playerStats[player.playerName]) {
        playerStats[player.playerName] = {
          totalRuns: 0,
          totalBalls: 0,
          totalDismissals: 0,
        };
      }
      playerStats[player.playerName].totalRuns += player.runs;
      playerStats[player.playerName].totalBalls += player.ballsFaced;
      if (player.dismissalType !== "not out") {
        playerStats[player.playerName].totalDismissals += 1;
      }
    });

    match.innings.statsByTeamB.runsByTeamBPlayers.forEach((player) => {
      if (!playerStats[player.playerName]) {
        playerStats[player.playerName] = {
          totalRuns: 0,
          totalBalls: 0,
          totalDismissals: 0,
        };
      }
      playerStats[player.playerName].totalRuns += player.runs;
      playerStats[player.playerName].totalBalls += player.ballsFaced;
      if (player.dismissalType !== "not out") {
        playerStats[player.playerName].totalDismissals += 1;
      }
    });
  });

  return Object.keys(playerStats).map((player) => {
    const stats = playerStats[player];
    const avg = calculateBattingAverage(stats.totalRuns, stats.totalDismissals);
    const sr = calculateStrikeRate(stats.totalRuns, stats.totalBalls);
    const { category, score } = battingCategory(
      avg,
      sr,
      stats.totalRuns,
      stats.totalBalls,
    );

    return {
      playerName: player,
      totalRuns: stats.totalRuns,
      totalBalls: stats.totalBalls,
      totalDismissals: stats.totalDismissals,
      battingAverage: avg,
      strikeRate: sr,
      category,
      score,
    };
  });
};
