import test from "node:test";
import assert from "node:assert/strict";
import { generateMatchAnalytics } from "../src/utils/matchAnalytics.js";

test("generateMatchAnalytics: Close match calculation", () => {
  const mockMatch = {
    teams: {
      teamA: { name: "Mumbai Indians" },
      teamB: { name: "Chennai Super Kings" },
    },
    innings: {
      statsByTeamA: { runs: 160, wickets: 6, overs: 20 },
      statsByTeamB: { runs: 158, wickets: 8, overs: 20 },
    },
    result: {
      winner: "Mumbai Indians",
    },
  };

  const analytics = generateMatchAnalytics(mockMatch);

  assert.equal(analytics.runRateForTeamA, 8.0);
  assert.equal(analytics.runRateForTeamB, 7.9);
  assert.equal(analytics.runDifference, 2);
  assert.equal(analytics.matchIntensity, "Very Close");
  assert.equal(analytics.pressureIndexForTeamA, 0.3); // 6 / 20
  assert.equal(analytics.pressureIndexForTeamB, 0.4); // 8 / 20
  assert.equal(analytics.netRunRateForTeamA, 0.1);
  assert.equal(analytics.netRunRateForTeamB, -0.1);
  // winnerStrength = 2 + (8.0 - 7.9) * 5 = 2 + 0.5 = 2.5
  assert.equal(analytics.winnerStrength, 2.5);
  assert.equal(analytics.winQuality, "Narrow Win");
  assert.ok(analytics.insights.includes("Mumbai Indians secured a thrilling last-moment victory"));
});

test("generateMatchAnalytics: One sided match calculation", () => {
  const mockMatch = {
    teams: {
      teamA: { name: "Kolkata Knight Riders" },
      teamB: { name: "Royal Challengers Bangalore" },
    },
    innings: {
      statsByTeamA: { runs: 220, wickets: 3, overs: 20 },
      statsByTeamB: { runs: 140, wickets: 10, overs: 18 },
    },
    result: {
      winner: "Kolkata Knight Riders",
    },
  };

  const analytics = generateMatchAnalytics(mockMatch);

  assert.equal(analytics.runRateForTeamA, 11.0);
  assert.equal(analytics.runDifference, 80);
  assert.equal(analytics.matchIntensity, "One Sided");
  assert.equal(analytics.winQuality, "Dominant Win");
  assert.ok(analytics.insights.includes("dominated the match"));
});

test("generateMatchAnalytics: Division by zero safety check when overs is 0", () => {
  const mockMatch = {
    teams: {
      teamA: { name: "Delhi Capitals" },
      teamB: { name: "Punjab Kings" },
    },
    innings: {
      statsByTeamA: { runs: 0, wickets: 0, overs: 0 },
      statsByTeamB: { runs: 0, wickets: 0, overs: 0 },
    },
    result: {
      winner: "Delhi Capitals",
    },
  };

  const analytics = generateMatchAnalytics(mockMatch);

  assert.equal(analytics.runRateForTeamA, 0);
  assert.equal(analytics.runRateForTeamB, 0);
  assert.equal(analytics.pressureIndexForTeamA, 0);
  assert.equal(analytics.pressureIndexForTeamB, 0);
  assert.equal(analytics.runDifference, 0);
  assert.equal(analytics.matchIntensity, "Very Close");
});
