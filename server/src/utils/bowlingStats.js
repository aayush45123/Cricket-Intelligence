export const computeBowlingStats = (matches) => {
  const playerStats = {};

  const calculateBowlingAverage = (runsConceded, wickets) => {
    if (wickets === 0) return runsConceded;
    return runsConceded / wickets;
  };

  const calculateBowlingEconomyRate = (runsConceded, ballsBowled) => {
    if (ballsBowled === 0) return 0;
    return (runsConceded / ballsBowled) * 6;
  };

  const calculateBowlingStrikeRate = (ballsBowled, wickets) => {
    if (ballsBowled === 0) return 0;
    return ballsBowled / wickets;
  };
  const bowlerCategory = (avg, eco, sr, balls) => {
    // 🚫 Ignore small sample size
    if (balls < 60) return "Insufficient Data"; // less than 10 overs

    let score = 0;

    // 🎯 Economy (weight: 40%)
    if (eco < 5.5) score += 40;
    else if (eco < 6.5) score += 30;
    else if (eco < 7.5) score += 20;
    else score += 10;

    // 🎯 Strike Rate (weight: 35%)
    if (sr < 20) score += 35;
    else if (sr < 30) score += 25;
    else if (sr < 40) score += 15;
    else score += 5;

    // 🎯 Average (weight: 25%)
    if (avg < 20) score += 25;
    else if (avg < 30) score += 18;
    else if (avg < 40) score += 10;
    else score += 5;

    // 🏆 Final classification
    if (score >= 85) return "Elite Bowler 🔥";
    else if (score >= 65) return "Excellent Bowler";
    else if (score >= 45) return "Good Bowler";
    else if (score >= 30) return "Average Bowler";
    else return "Below Average Bowler";
  };

  matches.forEach((match) => {
    match.innings.statsByTeamA.wicketsByTeamAPlayers.forEach((player) => {
      if (!playerStats[player.playerName]) {
        playerStats[player.playerName] = {
          totalWickets: 0,
          totalRunsConceded: 0,
          totalBallsBowled: 0,
        };
      }
      playerStats[player.playerName].totalWickets += player.wickets;
      playerStats[player.playerName].totalRunsConceded += player.runsConceded;
      playerStats[player.playerName].totalBallsBowled += player.ballsBowled;
    });

    match.innings.statsByTeamB.wicketsByTeamBPlayers.forEach((player) => {
      if (!playerStats[player.playerName]) {
        playerStats[player.playerName] = {
          totalWickets: 0,
          totalRunsConceded: 0,
          totalBallsBowled: 0,
        };
      }
      playerStats[player.playerName].totalWickets += player.wickets;
      playerStats[player.playerName].totalRunsConceded += player.runsConceded;
      playerStats[player.playerName].totalBallsBowled += player.ballsBowled;
    });
  });

  return Object.keys(playerStats).map((player) => {
    const stats = playerStats[player];

    const eco = calculateBowlingEconomyRate(
      stats.totalRunsConceded,
      stats.totalBallsBowled,
    );
    const avg = calculateBowlingAverage(
      stats.totalRunsConceded,
      stats.totalWickets,
    );
    const sr = calculateBowlingStrikeRate(
      stats.totalBallsBowled,
      stats.totalWickets,
    );

    return {
      playerName: player,
      totalWickets: stats.totalWickets,
      totalRunsConceded: stats.totalRunsConceded,
      totalBallsBowled: stats.totalBallsBowled,
      bowlingAverage: avg,
      bowlingEconomyRate: eco,
      bowlingStrikeRate: sr,
      category: bowlerCategory(avg, eco, sr, stats.totalBallsBowled),
    };
  });
};
