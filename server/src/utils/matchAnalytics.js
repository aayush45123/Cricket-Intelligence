
export const generateMatchAnalytics =  (match) => {

  const teamARunRate =
    match.innings.statsByTeamA.overs > 0
      ? match.innings.statsByTeamA.runs / match.innings.statsByTeamA.overs
      : 0;
  const teamBRunRate =
    match.innings.statsByTeamB.overs > 0
      ? match.innings.statsByTeamB.runs / match.innings.statsByTeamB.overs
      : 0;
  // PI is known as Pressure Index
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
  let winQiuality;
  if (winnerStrength < 5) {
    winQiuality = "Narrow/Close Win";
  } else if (winnerStrength <= 15) {
    winQiuality = "Decisive Win";
  } else {
    winQiuality = "Dominant Win";
  }
  const netRunRateForTeamA = teamARunRate - teamBRunRate;
  const netRunRateForTeamB = teamBRunRate - teamARunRate;

  let insights;

  if (matchIntensity === "Very Close") {
    insights = `${winner} secured a thrilling last-moment victory in a very close contest. Both teams maintained similar scoring rates, keeping the match unpredictable until the final moments.`;
  } else if (matchIntensity === "Competitive") {
    insights = `${winner} won a competitive match where both teams displayed strong batting and bowling performances. The contest remained balanced, but the winning side managed to gain a slight advantage at key moments.`;
  } else {
    insights = `${winner} dominated the match with clear superiority. The winning team controlled the game through better scoring momentum and consistent performance, leaving little opportunity for the opposition to recover.`;
  }

  if (netRunRateForTeamA > 0 && winner === match.teams.teamA.name) {
    insights += ` Team A maintained a superior net run rate, indicating stronger overall scoring efficiency compared to their opponent.`;
  } else if (netRunRateForTeamB > 0 && winner === match.teams.teamB.name) {
    insights += ` Team B achieved a better net run rate, reflecting their ability to outscore the opposition across the innings.`;
  }

  return {
    runRateForTeamA: teamARunRate,
    runRateForTeamB: teamBRunRate,
    rundifference: runDifference,
    matchIntensity: matchIntensity,
    pressureIndexForTeamA: PIForTeamA,
    pressureIndexForTeamB: PIForTeamB,
    winnerStrength: winnerStrength,
    winQuality: winQiuality,
    netRunRateForTeamA: netRunRateForTeamA,
    netRunRateForTeamB: netRunRateForTeamB,
    insights: insights,
  };
};
