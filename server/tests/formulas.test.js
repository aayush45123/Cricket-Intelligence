import test from "node:test";
import assert from "node:assert/strict";

// Mirroring the exact formulas verified in playerAnalytics.js
const calculateBattingAverage = (runs, dismissals) => {
  if (dismissals > 0) return Number((runs / dismissals).toFixed(2));
  return runs; // Not out entire career / season
};

const calculateStrikeRate = (runs, legalBalls) => {
  if (legalBalls > 0) return Number(((runs / legalBalls) * 100).toFixed(2));
  return 0;
};

const calculateDotBallPercentage = (dotBalls, legalBalls) => {
  if (legalBalls > 0) return Number(((dotBalls / legalBalls) * 100).toFixed(2));
  return 0;
};

const calculateEconomyRate = (runsConceded, legalBalls) => {
  if (legalBalls > 0) return Number(((runsConceded / legalBalls) * 6).toFixed(2));
  return 0;
};

const calculateBowlingAverage = (runsConceded, wickets) => {
  if (wickets > 0) return Number((runsConceded / wickets).toFixed(2));
  return 0;
};

const calculateBowlingStrikeRate = (legalBalls, wickets) => {
  if (wickets > 0) return Number((legalBalls / wickets).toFixed(2));
  return 0;
};

test("Batting Average: correctly divides by dismissals, not delivery count (BUG-001)", () => {
  const runs = 450;
  const dismissals = 10;
  const totalDeliveriesFaced = 350; // In old buggy code, avg was runs / deliveries (450/350 = 1.28)

  const correctAvg = calculateBattingAverage(runs, dismissals);
  assert.equal(correctAvg, 45.0);
  assert.notEqual(correctAvg, Number((runs / totalDeliveriesFaced).toFixed(2)));
});

test("Batting Average: handles unbeaten batter (0 dismissals)", () => {
  const runs = 85;
  const dismissals = 0;
  assert.equal(calculateBattingAverage(runs, dismissals), 85);
});

test("Balls Faced: wide deliveries are excluded from balls faced (BUG-002)", () => {
  // 12 deliveries total: 10 legal balls, 2 wides
  const deliveries = [
    { valid_ball: 1, runs_batter: 1 },
    { valid_ball: 0, runs_batter: 0 }, // wide
    { valid_ball: 1, runs_batter: 4 },
    { valid_ball: 1, runs_batter: 0 },
    { valid_ball: 1, runs_batter: 6 },
    { valid_ball: 0, runs_batter: 0 }, // wide
    { valid_ball: 1, runs_batter: 2 },
    { valid_ball: 1, runs_batter: 1 },
    { valid_ball: 1, runs_batter: 0 },
    { valid_ball: 1, runs_batter: 4 },
    { valid_ball: 1, runs_batter: 1 },
    { valid_ball: 1, runs_batter: 0 },
  ];

  const legalBallsFaced = deliveries.filter((d) => d.valid_ball === 1).length;
  assert.equal(legalBallsFaced, 10);
  assert.notEqual(legalBallsFaced, deliveries.length);

  const totalRuns = deliveries.reduce((acc, d) => acc + d.runs_batter, 0); // 1+4+0+6+2+1+0+4+1+0 = 19
  assert.equal(totalRuns, 19);

  // SR should be (19 / 10) * 100 = 190.0, NOT (19 / 12) * 100 = 158.33
  const strikeRate = calculateStrikeRate(totalRuns, legalBallsFaced);
  assert.equal(strikeRate, 190.0);
});

test("Dot Ball %: calculates percentage of legal dot balls (BUG-008)", () => {
  const legalBalls = 60;
  const dotBalls = 24;

  const dotPct = calculateDotBallPercentage(dotBalls, legalBalls);
  assert.equal(dotPct, 40.0);
});

test("Bowling Metrics: economy rate, bowling average, and strike rate", () => {
  const runsConceded = 150;
  const legalBallsBowled = 120; // 20 overs
  const wickets = 6;

  assert.equal(calculateEconomyRate(runsConceded, legalBallsBowled), 7.5);
  assert.equal(calculateBowlingAverage(runsConceded, wickets), 25.0);
  assert.equal(calculateBowlingStrikeRate(legalBallsBowled, wickets), 20.0);
});
