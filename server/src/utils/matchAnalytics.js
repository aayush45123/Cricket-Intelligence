export const generateMatchAnalytics = (match) => {
  const teamARunRate =
    match.innings.statsByTeamA.overs > 0
      ? match.innings.statsByTeamA.runs / match.innings.statsByTeamA.overs
      : 0;

  const teamBRunRate =
    match.innings.statsByTeamB.overs > 0
      ? match.innings.statsByTeamB.runs / match.innings.statsByTeamB.overs
      : 0;

  // Pressure Index
  const PIForTeamA =
    match.innings.statsByTeamA.overs > 0
      ? match.innings.statsByTeamA.wickets / match.innings.statsByTeamA.overs
      : 0;

  const PIForTeamB =
    match.innings.statsByTeamB.overs > 0
      ? match.innings.statsByTeamB.wickets / match.innings.statsByTeamB.overs
      : 0;

  const runDifference = Math.abs(
    match.innings.statsByTeamA.runs - match.innings.statsByTeamB.runs,
  );

  let matchIntensity;

  if (runDifference < 5) {
    matchIntensity = "Very Close";
  } else if (runDifference <= 20) {
    matchIntensity = "Competitive";
  } else {
    matchIntensity = "One Sided";
  }

  const winner = match.result.winner;

  let winnerRunRate, loserRunRate;

  if (winner === match.teams.teamA.name) {
    winnerRunRate = teamARunRate;
    loserRunRate = teamBRunRate;
  } else {
    winnerRunRate = teamBRunRate;
    loserRunRate = teamARunRate;
  }

  const winnerStrength = runDifference + (winnerRunRate - loserRunRate) * 5;

  let winQuality;

  if (winnerStrength < 5) {
    winQuality = "Narrow Win";
  } else if (winnerStrength <= 15) {
    winQuality = "Decisive Win";
  } else {
    winQuality = "Dominant Win";
  }

  const netRunRateForTeamA = teamARunRate - teamBRunRate;
  const netRunRateForTeamB = teamBRunRate - teamARunRate;

  let insights;

  if (matchIntensity === "Very Close") {
    insights = `${winner} secured a thrilling last-moment victory. Both teams maintained similar scoring rates making the match unpredictable till the end.`;
  } else if (matchIntensity === "Competitive") {
    insights = `${winner} won a competitive match where both teams showed strong performances. Key moments created the difference.`;
  } else {
    insights = `${winner} dominated the match with clear superiority and consistent performance throughout the innings.`;
  }

  if (netRunRateForTeamA > 0 && winner === match.teams.teamA.name) {
    insights += ` ${match.teams.teamA.name} maintained a superior net run rate indicating stronger scoring efficiency.`;
  } else if (netRunRateForTeamB > 0 && winner === match.teams.teamB.name) {
    insights += ` ${match.teams.teamB.name} achieved a higher net run rate reflecting better overall scoring dominance.`;
  }

  return {
    runRateForTeamA: Number(teamARunRate.toFixed(2)),
    runRateForTeamB: Number(teamBRunRate.toFixed(2)),
    runDifference,
    matchIntensity,
    pressureIndexForTeamA: Number(PIForTeamA.toFixed(2)),
    pressureIndexForTeamB: Number(PIForTeamB.toFixed(2)),
    winnerStrength: Number(winnerStrength.toFixed(2)),
    winQuality,
    netRunRateForTeamA: Number(netRunRateForTeamA.toFixed(2)),
    netRunRateForTeamB: Number(netRunRateForTeamB.toFixed(2)),
    insights,
  };
};
