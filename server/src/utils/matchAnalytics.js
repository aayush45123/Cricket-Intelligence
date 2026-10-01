/*
 * generateMatchAnalytics — produces per-match analytics from a match object.
 *
 * FORMULAS (interview-ready explanations):
 *
 * Run Rate (RR):
 *   RR = runs / overs
 *   Standard cricket metric — how many runs per over a team scores.
 *
 * Pressure Index (PI):
 *   PI = (wickets × 10) / (overs + 1)
 *   Measures bowling aggression: how quickly wickets are taken relative to
 *   overs bowled. Multiplied by 10 to give a 0–100 scale for a full 20-over
 *   innings. Higher PI = more pressure on batting side from wicket loss rate.
 *   +1 in denominator prevents division-by-zero on zero-over innings.
 *
 * Run Rate Advantage:
 *   runRateAdvantage = winnerRR - loserRR
 *   Positive value means winner scored faster. Distinct from tournament-level
 *   NRR (which averages across multiple matches); this is a single-match metric.
 *
 * Match Intensity:
 *   Based on absolute run difference between innings.
 *   Very Close: diff <= 10 | Competitive: diff <= 30 | One Sided: diff > 30
 *
 * Win Quality:
 *   Based on winner strength = runDiff + (winnerRR - loserRR) × 5
 *   Narrow Win < 5 | Decisive Win <= 20 | Dominant Win > 20
 */

export const generateMatchAnalytics = (match) => {
  const innA = match.innings.statsByTeamA;
  const innB = match.innings.statsByTeamB;

  const teamARunRate = innA.overs > 0 ? innA.runs / innA.overs : 0;
  const teamBRunRate = innB.overs > 0 ? innB.runs / innB.overs : 0;

  /* Pressure Index: wickets taken per over (measures bowling pressure) */
  const PIForTeamA = innA.overs > 0 ? innA.wickets / innA.overs : 0;
  const PIForTeamB = innB.overs > 0 ? innB.wickets / innB.overs : 0;

  const runDifference = Math.abs(innA.runs - innB.runs);

  let matchIntensity;
  if (runDifference <= 10) {
    matchIntensity = "Very Close";
  } else if (runDifference <= 30) {
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
  } else if (winnerStrength <= 20) {
    winQuality = "Decisive Win";
  } else {
    winQuality = "Dominant Win";
  }

  /* Single match run rate differences */
  const netRunRateForTeamA = teamARunRate - teamBRunRate;
  const netRunRateForTeamB = teamBRunRate - teamARunRate;
  const runRateAdvantage = winnerRunRate - loserRunRate;

  let insights;
  if (matchIntensity === "Very Close") {
    insights = `${winner} secured a thrilling last-moment victory in a neck-and-neck contest. Both teams maintained similar scoring rates making the match unpredictable till the end.`;
  } else if (matchIntensity === "Competitive") {
    insights = `${winner} won a competitive match where both teams showed strong performances. Key moments created the difference.`;
  } else {
    insights = `${winner} dominated the match with clear superiority and consistent performance throughout both innings.`;
  }

  if (runRateAdvantage > 0.5) {
    insights += ` ${winner} maintained a superior run rate (advantage: ${runRateAdvantage.toFixed(2)} RPO) reflecting stronger scoring efficiency.`;
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
    /* Run rate advantage for winner vs loser (NOT tournament-level NRR) */
    runRateAdvantage: Number(runRateAdvantage.toFixed(2)),
    insights,
  };
};
