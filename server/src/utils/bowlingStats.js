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

  const bowlerCategory = (avg, eco, sr) => {
    if (avg < 25 && eco < 6 && sr < 30) return "Elite Bowler";
    else if (avg < 30 && eco < 7 && sr < 40) return "Good Bowler";
    else if (avg < 35 && eco < 8 && sr < 50) return "Average Bowler";
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
      category: bowlerCategory(avg, eco, sr),
    };
  });
};
