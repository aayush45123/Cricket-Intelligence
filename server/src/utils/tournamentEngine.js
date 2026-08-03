import crypto from "crypto";

const LEAGUE_STAGE_PATTERN = /league|round robin|group/i;

const roundLabelForSize = (totalTeams, roundIndex) => {
  const remainingTeams = Math.max(2, Math.ceil(totalTeams / 2 ** roundIndex));
  if (remainingTeams >= 8) return "Quarter Final";
  if (remainingTeams === 4) return "Semi Final";
  if (remainingTeams === 2)
    return roundIndex === 0 && totalTeams === 2 ? "Final" : "Final";
  return `Round ${roundIndex + 1}`;
};

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const createFixtureId = () => crypto.randomBytes(5).toString("hex");

export const getTeamNames = (tournament) =>
  (tournament?.teams || []).map((team) => team.teamName).filter(Boolean);

export const getRegistrationState = (tournament, now = new Date()) => {
  const registration = tournament?.registration || {};
  const maxTeams = registration.maxTeams || 0;
  const totalTeams = tournament?.teams?.length || 0;
  const openByDate =
    !registration.opensAt || new Date(registration.opensAt) <= now;
  const closeByDate =
    registration.closesAt && new Date(registration.closesAt) <= now;
  const full = maxTeams > 0 && totalTeams >= maxTeams;

  if (!openByDate) {
    return {
      status: "upcoming",
      closed: true,
      reason: "registration_not_open_yet",
    };
  }

  if (full) {
    return {
      status: "full",
      closed: true,
      reason: "maximum_teams_reached",
    };
  }

  if (closeByDate) {
    return {
      status: "closed",
      closed: true,
      reason: "registration_window_closed",
    };
  }

  return {
    status: registration.status || "open",
    closed: registration.status === "closed",
    reason: null,
  };
};

const formatSlotTime = (date, timeString) => {
  const [hours, minutes] = String(timeString || "09:00")
    .split(":")
    .map((value) => Number.parseInt(value, 10));
  const slot = new Date(date);
  slot.setHours(
    Number.isFinite(hours) ? hours : 9,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0,
  );
  return slot;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const sameDayKey = (date) => new Date(date).toISOString().slice(0, 10);

const toOversBalls = (oversValue) => {
  const raw = Number(oversValue || 0);
  if (!Number.isFinite(raw)) return 0;
  const [wholePart, fractionPart = "0"] = raw.toString().split(".");
  return (
    Number.parseInt(wholePart, 10) * 6 +
    Math.min(5, Number.parseInt(fractionPart, 10) || 0)
  );
};

const fromBallsToOvers = (balls) => {
  const whole = Math.floor(balls / 6);
  const remainder = balls % 6;
  return Number(`${whole}.${remainder}`);
};

const isPlaceholderName = (team) =>
  Boolean(team?.placeholder) ||
  /^(winner|loser|qualified|seed|top|runner|bye|league position)/i.test(
    team?.name || "",
  );

const cloneFixtureTeams = (teamA, teamB) => ({
  teamA: {
    name: teamA.name,
    placeholder: Boolean(teamA.placeholder),
    sourceFixtureId: teamA.sourceFixtureId || null,
    sourceOutcome: teamA.sourceOutcome || null,
  },
  teamB: {
    name: teamB.name,
    placeholder: Boolean(teamB.placeholder),
    sourceFixtureId: teamB.sourceFixtureId || null,
    sourceOutcome: teamB.sourceOutcome || null,
  },
});

export const buildRoundRobinFixtures = (teams, stage = "league") => {
  const fixtures = [];
  let matchNumber = 1;

  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      fixtures.push({
        fixtureId: createFixtureId(),
        stage,
        round: 1,
        matchNumber,
        bracket: "main",
        status: "pending",
        teams: cloneFixtureTeams(
          { name: teams[i], placeholder: false },
          { name: teams[j], placeholder: false },
        ),
        result: {
          winner: "",
          margin: "",
          teamAScore: { runs: 0, wickets: 0, overs: 0 },
          teamBScore: { runs: 0, wickets: 0, overs: 0 },
        },
      });

      matchNumber += 1;
    }
  }

  return fixtures;
};

const buildKnockoutRounds = (
  participants,
  stageLabel,
  roundIndex,
  matchStartNumber,
  bracket = "main",
) => {
  const fixtures = [];
  const winners = [];
  let matchNumber = matchStartNumber;

  for (let i = 0; i < participants.length; i += 2) {
    const teamA = participants[i];
    const teamB = participants[i + 1] || {
      name: "BYE",
      placeholder: true,
      sourceFixtureId: null,
      sourceOutcome: null,
    };

    const fixtureId = createFixtureId();
    fixtures.push({
      fixtureId,
      stage: stageLabel,
      round: roundIndex + 1,
      matchNumber,
      bracket,
      status: "pending",
      teams: cloneFixtureTeams(teamA, teamB),
      result: {
        winner: "",
        margin: "",
        teamAScore: { runs: 0, wickets: 0, overs: 0 },
        teamBScore: { runs: 0, wickets: 0, overs: 0 },
      },
    });

    winners.push({
      name: `Winner of ${fixtureId}`,
      placeholder: true,
      sourceFixtureId: fixtureId,
      sourceOutcome: "winner",
    });

    matchNumber += 1;
  }

  return { fixtures, winners, nextMatchNumber: matchNumber };
};

export const buildKnockoutFixtures = (teams, stagePrefix = "knockout") => {
  const fixtures = [];
  let participants = teams.map((teamName) => ({
    name: teamName,
    placeholder: false,
    sourceFixtureId: null,
    sourceOutcome: null,
  }));
  let roundIndex = 0;
  let matchNumber = 1;

  while (participants.length > 1) {
    const stageLabel = roundLabelForSize(
      participants.length * 2 ** roundIndex,
      roundIndex,
    );
    const round = buildKnockoutRounds(
      participants,
      stagePrefix || stageLabel,
      roundIndex,
      matchNumber,
    );
    fixtures.push(...round.fixtures);
    participants = round.winners;
    matchNumber = round.nextMatchNumber;
    roundIndex += 1;
  }

  return fixtures;
};

export const buildLeagueKnockoutFixtures = (teams, qualifiedCount = 4) => {
  const leagueFixtures = buildRoundRobinFixtures(teams, "league");
  const playoffSeeds = Array.from(
    { length: Math.max(2, qualifiedCount) },
    (_, index) => ({
      name: `Qualified Team ${index + 1}`,
      placeholder: true,
      sourceFixtureId: null,
      sourceOutcome: null,
    }),
  );
  const playoffFixtures = buildKnockoutFixtures(
    playoffSeeds.map((team) => team.name),
    "playoff",
  );

  return [...leagueFixtures, ...playoffFixtures];
};

export const buildDoubleEliminationFixtures = (teams) => {
  const winnersBracket = buildKnockoutFixtures(teams, "winners-bracket");
  const losersSeeds = winnersBracket
    .filter((fixture) => fixture.round === 1)
    .map((fixture, index) => ({
      name: `Loser of ${fixture.fixtureId}`,
      placeholder: true,
      sourceFixtureId: fixture.fixtureId,
      sourceOutcome: "loser",
    }));

  const losersBracket =
    losersSeeds.length > 1
      ? buildKnockoutFixtures(
          losersSeeds.map((team) => team.name),
          "losers-bracket",
        )
      : [];

  const grandFinal =
    teams.length >= 2
      ? [
          {
            fixtureId: createFixtureId(),
            stage: "grand-final",
            round: 1,
            matchNumber: winnersBracket.length + losersBracket.length + 1,
            bracket: "grand-final",
            status: "pending",
            teams: cloneFixtureTeams(
              {
                name: "Winner of Winners Bracket",
                placeholder: true,
                sourceFixtureId: null,
                sourceOutcome: null,
              },
              {
                name: "Winner of Losers Bracket",
                placeholder: true,
                sourceFixtureId: null,
                sourceOutcome: null,
              },
            ),
            result: {
              winner: "",
              margin: "",
              teamAScore: { runs: 0, wickets: 0, overs: 0 },
              teamBScore: { runs: 0, wickets: 0, overs: 0 },
            },
          },
        ]
      : [];

  return [...winnersBracket, ...losersBracket, ...grandFinal];
};

export const buildTournamentFixtures = (tournament) => {
  const teams = getTeamNames(tournament);
  const normalizedType = String(
    tournament?.tournamentType || "League",
  ).toLowerCase();

  if (normalizedType.includes("double")) {
    return buildDoubleEliminationFixtures(teams);
  }

  if (
    normalizedType.includes("league") &&
    normalizedType.includes("knockout")
  ) {
    return buildLeagueKnockoutFixtures(teams, 4);
  }

  if (
    normalizedType.includes("knockout") ||
    normalizedType.includes("elimination")
  ) {
    return buildKnockoutFixtures(teams, "knockout");
  }

  return buildRoundRobinFixtures(teams, "league");
};

const getDailySlots = (dayStart, dayEnd, matchDurationMinutes, grounds) => {
  const slots = [];
  const startMinutes = dayStart.getHours() * 60 + dayStart.getMinutes();
  const endMinutes = dayEnd.getHours() * 60 + dayEnd.getMinutes();
  const interval = Math.max(30, Number(matchDurationMinutes) || 120);

  for (
    let start = startMinutes;
    start + interval <= endMinutes;
    start += interval
  ) {
    for (let ground = 1; ground <= Math.max(1, grounds); ground += 1) {
      const slotStart = new Date(dayStart);
      slotStart.setHours(Math.floor(start / 60), start % 60, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + interval);
      slots.push({ slotStart, slotEnd, ground });
    }
  }

  return slots;
};

const canPlaceFixture = (
  fixture,
  slotStart,
  teamSchedule,
  teamDailyCounts,
  restGapMinutes,
  maxMatchesPerTeamPerDay,
) => {
  const names = [
    fixture?.teams?.teamA?.name,
    fixture?.teams?.teamB?.name,
  ].filter((name, index) => {
    const team = index === 0 ? fixture?.teams?.teamA : fixture?.teams?.teamB;
    return name && !isPlaceholderName(team) && name !== "BYE";
  });

  if (names.length === 0) {
    return true;
  }

  const dayKey = sameDayKey(slotStart);
  return names.every((name) => {
    const teamSlots = teamSchedule.get(name) || [];
    const teamCounts = teamDailyCounts.get(name) || {};
    const matchesToday = teamCounts[dayKey] || 0;

    if (matchesToday >= maxMatchesPerTeamPerDay) {
      return false;
    }

    return teamSlots.every((previousSlot) => {
      const diffMinutes =
        Math.abs(slotStart.getTime() - previousSlot.getTime()) / 60000;
      return diffMinutes >= restGapMinutes;
    });
  });
};

export const scheduleFixtures = (tournament, fixtures) => {
  const schedule = tournament?.schedule || {};
  const dates = tournament?.dates || {};
  const startDate = dates.startDate ? new Date(dates.startDate) : null;
  const endDate = dates.endDate ? new Date(dates.endDate) : null;

  if (!startDate || !endDate) {
    return fixtures.map((fixture) => ({
      ...fixture,
      status:
        fixture.status === "completed"
          ? fixture.status
          : fixture.status || "pending",
    }));
  }

  const grounds = Math.max(1, Number(schedule.grounds) || 1);
  const matchDurationMinutes = Math.max(
    30,
    Number(schedule.matchDurationMinutes) || 120,
  );
  const restGapMinutes = Math.max(0, Number(schedule.restGapMinutes) || 0);
  const maxMatchesPerTeamPerDay = Math.max(
    1,
    Number(schedule.maxMatchesPerTeamPerDay) || 2,
  );

  const teamSchedule = new Map();
  const teamDailyCounts = new Map();
  const slotAssignments = new Map();
  const allSlots = [];

  for (let day = new Date(startDate); day <= endDate; day = addDays(day, 1)) {
    const dayStart = formatSlotTime(day, schedule.dailyStartTime || "09:00");
    const dayEnd = formatSlotTime(day, schedule.dailyEndTime || "18:00");
    allSlots.push(
      ...getDailySlots(dayStart, dayEnd, matchDurationMinutes, grounds),
    );
  }

  const scheduledFixtures = fixtures.map((fixture) => ({ ...fixture }));

  scheduledFixtures.forEach((fixture) => {
    let assigned = false;

    for (const slot of allSlots) {
      const slotKey = `${slot.slotStart.toISOString()}-${slot.ground}`;
      const assignmentCount = slotAssignments.get(slotKey) || 0;

      if (assignmentCount >= 1) {
        continue;
      }

      if (
        !canPlaceFixture(
          fixture,
          slot.slotStart,
          teamSchedule,
          teamDailyCounts,
          restGapMinutes,
          maxMatchesPerTeamPerDay,
        )
      ) {
        continue;
      }

      fixture.scheduledAt = slot.slotStart;
      fixture.venue = tournament?.location || fixture.venue || "";
      fixture.ground = `Ground ${slot.ground}`;
      fixture.status =
        fixture.status === "completed" ? fixture.status : "scheduled";
      slotAssignments.set(slotKey, 1);

      [fixture.teams.teamA, fixture.teams.teamB].forEach((team) => {
        if (!team?.name || isPlaceholderName(team) || team.name === "BYE") {
          return;
        }

        const currentSlots = teamSchedule.get(team.name) || [];
        currentSlots.push(slot.slotStart);
        teamSchedule.set(team.name, currentSlots);

        const dailyCounts = teamDailyCounts.get(team.name) || {};
        const dayKey = sameDayKey(slot.slotStart);
        dailyCounts[dayKey] = (dailyCounts[dayKey] || 0) + 1;
        teamDailyCounts.set(team.name, dailyCounts);
      });

      assigned = true;
      break;
    }

    if (!assigned) {
      fixture.status =
        fixture.status === "completed" ? fixture.status : "pending";
    }
  });

  return scheduledFixtures;
};

export const buildStandings = (tournament, fixtures) => {
  const teamNames = getTeamNames(tournament);
  const standingsMap = new Map();

  teamNames.forEach((teamName) => {
    standingsMap.set(teamName, {
      teamName,
      played: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      noResult: 0,
      points: 0,
      runsFor: 0,
      runsAgainst: 0,
      oversForBalls: 0,
      oversAgainstBalls: 0,
      netRunRate: 0,
      qualified: false,
      eliminated: false,
    });
  });

  const totalOversPerMatch = Number(tournament?.rules?.overs) || 20;

  fixtures.forEach((fixture) => {
    if (fixture.status !== "completed") return;
    if (!LEAGUE_STAGE_PATTERN.test(String(fixture.stage || ""))) return;

    const teamAName = fixture.teams?.teamA?.name;
    const teamBName = fixture.teams?.teamB?.name;
    const result = fixture.result || {};
    const scoreA = result.teamAScore || {};
    const scoreB = result.teamBScore || {};

    const ballsA = toOversBalls(scoreA.overs) || totalOversPerMatch * 6;
    const ballsB = toOversBalls(scoreB.overs) || totalOversPerMatch * 6;

    if (teamAName && standingsMap.has(teamAName)) {
      const team = standingsMap.get(teamAName);
      team.played += 1;
      team.runsFor += Number(scoreA.runs || 0);
      team.runsAgainst += Number(scoreB.runs || 0);
      team.oversForBalls += ballsA;
      team.oversAgainstBalls += ballsB;
    }

    if (teamBName && standingsMap.has(teamBName)) {
      const team = standingsMap.get(teamBName);
      team.played += 1;
      team.runsFor += Number(scoreB.runs || 0);
      team.runsAgainst += Number(scoreA.runs || 0);
      team.oversForBalls += ballsB;
      team.oversAgainstBalls += ballsA;
    }

    if (!result.winner || result.winner === "TIE") {
      if (teamAName && standingsMap.has(teamAName)) {
        const team = standingsMap.get(teamAName);
        team.ties += 1;
        team.points += 1;
      }
      if (teamBName && standingsMap.has(teamBName)) {
        const team = standingsMap.get(teamBName);
        team.ties += 1;
        team.points += 1;
      }
      return;
    }

    if (result.winner === teamAName) {
      if (teamAName && standingsMap.has(teamAName)) {
        const team = standingsMap.get(teamAName);
        team.wins += 1;
        team.points += 2;
      }
      if (teamBName && standingsMap.has(teamBName)) {
        standingsMap.get(teamBName).losses += 1;
      }
      return;
    }

    if (result.winner === teamBName) {
      if (teamBName && standingsMap.has(teamBName)) {
        const team = standingsMap.get(teamBName);
        team.wins += 1;
        team.points += 2;
      }
      if (teamAName && standingsMap.has(teamAName)) {
        standingsMap.get(teamAName).losses += 1;
      }
    }
  });

  const standings = Array.from(standingsMap.values()).map((team) => {
    const oversFor = team.oversForBalls > 0 ? team.oversForBalls / 6 : 1;
    const oversAgainst = team.oversAgainstBalls > 0 ? team.oversAgainstBalls / 6 : 1;
    const nrr = (team.runsFor / oversFor) - (team.runsAgainst / oversAgainst);
    return {
      ...team,
      netRunRate: Number.isFinite(nrr) ? Number(nrr.toFixed(3)) : 0,
    };
  });

  standings.sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    if (right.netRunRate !== left.netRunRate) return right.netRunRate - left.netRunRate;
    if (right.wins !== left.wins) return right.wins - left.wins;
    return left.teamName.localeCompare(right.teamName);
  });

  // Mark qualification status for top 4
  standings.forEach((team, idx) => {
    if (idx < 4 && team.played > 0) {
      team.qualified = true;
    }
  });

  return standings;
};

const hashToNumber = (value) => {
  const hex = crypto
    .createHash("sha1")
    .update(String(value || ""))
    .digest("hex")
    .slice(0, 8);
  return Number.parseInt(hex, 16);
};

const generateSquadPlayers = (teamObj, teamName) => {
  if (teamObj && Array.isArray(teamObj.players) && teamObj.players.length >= 6) {
    return teamObj.players.map((p) => p.name);
  }
  const defaultRoster = [
    `${teamName} Captain`,
    `${teamName} Opener A`,
    `${teamName} Opener B`,
    `${teamName} Batter 3`,
    `${teamName} Allrounder 1`,
    `${teamName} Allrounder 2`,
    `${teamName} Wicketkeeper`,
    `${teamName} Spinner 1`,
    `${teamName} Pacer 1`,
    `${teamName} Pacer 2`,
    `${teamName} Pacer 3`,
  ];
  return defaultRoster;
};

export const simulateFixtureResult = (fixture, tournament) => {
  const teamAName = fixture?.teams?.teamA?.name;
  const teamBName = fixture?.teams?.teamB?.name;

  if (
    !teamAName ||
    !teamBName ||
    isPlaceholderName(fixture?.teams?.teamA) ||
    isPlaceholderName(fixture?.teams?.teamB)
  ) {
    return null;
  }

  const format = String(tournament?.format || "T20").toUpperCase();
  const maxOvers = Number(tournament?.rules?.overs) || (format === "T10" ? 10 : format === "ODI" ? 50 : 20);

  const teamAObj = (tournament?.teams || []).find((t) => t.teamName === teamAName);
  const teamBObj = (tournament?.teams || []).find((t) => t.teamName === teamBName);

  const squadA = generateSquadPlayers(teamAObj, teamAName);
  const squadB = generateSquadPlayers(teamBObj, teamBName);

  const seed = hashToNumber(
    `${tournament?.inviteCode || ""}:${fixture.fixtureId}:${teamAName}:${teamBName}`,
  );

  const tossWinner = (seed % 2 === 0) ? teamAName : teamBName;
  const tossDecision = (seed % 3 === 0) ? "bowl" : "bat";

  const baseRuns = format === "T10" ? 105 : format === "ODI" ? 260 : 170;
  const swing = (seed % 35) - 17;
  
  let teamARuns = Math.max(50, baseRuns + swing);
  let teamBRuns = Math.max(50, baseRuns - swing + ((seed % 7) - 3));

  if (teamARuns === teamBRuns) {
    teamARuns += 1;
  }

  const winner = teamARuns > teamBRuns ? teamAName : teamBName;
  const margin = teamARuns > teamBRuns 
    ? `${teamARuns - teamBRuns} runs` 
    : `${Math.min(9, 3 + (seed % 5))} wickets`;

  // Build Innings Scorecard for Team A
  const wicketsA = Math.min(10, 4 + (seed % 6));
  const oversA = maxOvers;
  const battingCardA = squadA.slice(0, 7).map((pName, idx) => {
    const pSeed = (seed + idx * 13) % 45;
    const runs = idx === 0 ? 35 + pSeed : idx === 1 ? 25 + (pSeed % 20) : idx === 2 ? 40 + (pSeed % 25) : 10 + (pSeed % 15);
    const fours = Math.floor(runs / 10) + (pSeed % 3);
    const sixes = Math.floor(runs / 18) + (pSeed % 2);
    const balls = Math.max(fours + sixes + 5, Math.floor(runs * 0.75));
    const sr = Number(((runs / (balls || 1)) * 100).toFixed(1));
    return {
      name: pName,
      runs,
      balls,
      fours,
      sixes,
      strikeRate: sr,
      dismissal: idx < wicketsA ? `c ${squadB[(idx + 4) % squadB.length]} b ${squadB[(idx + 7) % squadB.length]}` : "not out",
    };
  });

  const bowlingCardB = squadB.slice(7, 11).map((bName, idx) => {
    const bSeed = (seed + idx * 7) % 25;
    const overs = Math.floor(maxOvers / 4);
    const wickets = idx === 0 ? Math.min(4, Math.floor(wicketsA / 2)) : Math.floor(wicketsA / 3);
    const runs = 20 + bSeed;
    const econ = Number((runs / overs).toFixed(2));
    return {
      name: bName,
      overs,
      maidens: bSeed % 2 === 0 ? 1 : 0,
      runs,
      wickets,
      economy: econ,
    };
  });

  // Build Innings Scorecard for Team B
  const wicketsB = winner === teamBName ? Math.min(9, 2 + (seed % 5)) : Math.min(10, 6 + (seed % 4));
  const oversB = winner === teamBName ? Number((maxOvers - 0.4).toFixed(1)) : maxOvers;
  const battingCardB = squadB.slice(0, 7).map((pName, idx) => {
    const pSeed = (seed * 3 + idx * 11) % 42;
    const runs = idx === 0 ? 28 + pSeed : idx === 1 ? 42 + (pSeed % 22) : idx === 2 ? 30 + (pSeed % 20) : 8 + (pSeed % 12);
    const fours = Math.floor(runs / 10) + (pSeed % 2);
    const sixes = Math.floor(runs / 20) + (pSeed % 2);
    const balls = Math.max(fours + sixes + 4, Math.floor(runs * 0.78));
    const sr = Number(((runs / (balls || 1)) * 100).toFixed(1));
    return {
      name: pName,
      runs,
      balls,
      fours,
      sixes,
      strikeRate: sr,
      dismissal: idx < wicketsB ? `b ${squadA[(idx + 8) % squadA.length]}` : "not out",
    };
  });

  const bowlingCardA = squadA.slice(7, 11).map((bName, idx) => {
    const bSeed = (seed * 2 + idx * 9) % 28;
    const overs = Math.floor(maxOvers / 4);
    const wickets = idx === 0 ? Math.min(4, Math.floor(wicketsB / 2)) : Math.floor(wicketsB / 3);
    const runs = 18 + bSeed;
    const econ = Number((runs / overs).toFixed(2));
    return {
      name: bName,
      overs,
      maidens: bSeed % 3 === 0 ? 1 : 0,
      runs,
      wickets,
      economy: econ,
    };
  });

  // Pick Player of the Match
  const topBatA = battingCardA.reduce((prev, current) => (prev.runs > current.runs ? prev : current), battingCardA[0]);
  const topBatB = battingCardB.reduce((prev, current) => (prev.runs > current.runs ? prev : current), battingCardB[0]);
  const potm = winner === teamAName ? topBatA?.name : topBatB?.name;

  const commentaryHighlights = [
    `Toss: ${tossWinner} won the toss and elected to ${tossDecision} first.`,
    `Innings 1: ${teamAName} posted ${teamARuns}/${wicketsA} in ${oversA} overs. Top scorer: ${topBatA?.name} (${topBatA?.runs} off ${topBatA?.balls}b).`,
    `Innings 2: ${teamBName} scored ${teamBRuns}/${wicketsB} in ${oversB} overs. Top scorer: ${topBatB?.name} (${topBatB?.runs} off ${topBatB?.balls}b).`,
    `Result: ${winner} won by ${margin}.`,
    `Player of the Match: ${potm}.`,
  ];

  return {
    winner,
    margin,
    tossWinner,
    tossDecision,
    playerOfTheMatch: potm,
    simulated: true,
    teamAScore: {
      runs: teamARuns,
      wickets: wicketsA,
      overs: oversA,
      battingCard: battingCardA,
      bowlingCard: bowlingCardA,
      extras: 6 + (seed % 5),
    },
    teamBScore: {
      runs: teamBRuns,
      wickets: wicketsB,
      overs: oversB,
      battingCard: battingCardB,
      bowlingCard: bowlingCardB,
      extras: 4 + (seed % 6),
    },
    commentaryHighlights,
  };
};

export const advanceBracket = (fixtures, fixtureId, winnerName) => {
  const updatedFixtures = fixtures.map((fixture) => ({
    ...fixture,
    teams: {
      teamA: { ...fixture.teams.teamA },
      teamB: { ...fixture.teams.teamB },
    },
  }));

  updatedFixtures.forEach((fixture) => {
    [fixture.teams.teamA, fixture.teams.teamB].forEach((team) => {
      if (!team.placeholder || team.sourceFixtureId !== fixtureId) {
        return;
      }

      if (team.sourceOutcome === "loser") {
        team.name = `Loser of ${fixtureId}`;
      } else {
        team.name = winnerName;
      }
      team.placeholder = false;
      team.sourceFixtureId = null;
      team.sourceOutcome = null;
    });
  });

  return updatedFixtures;
};

export const populatePlayoffSeeds = (tournament) => {
  const standings = tournament.standings || [];
  if (standings.length === 0) return tournament.fixtures;

  const topTeams = standings.map((s) => s.teamName);
  const updated = (tournament.fixtures || []).map((f) => ({
    ...f,
    teams: {
      teamA: { ...f.teams.teamA },
      teamB: { ...f.teams.teamB },
    },
  }));

  updated.forEach((fixture) => {
    if (!LEAGUE_STAGE_PATTERN.test(String(fixture.stage || ""))) {
      // It's a playoff/knockout fixture
      if (fixture.teams.teamA.placeholder && /Qualified Team 1/i.test(fixture.teams.teamA.name)) {
        if (topTeams[0]) {
          fixture.teams.teamA.name = topTeams[0];
          fixture.teams.teamA.placeholder = false;
        }
      }
      if (fixture.teams.teamB.placeholder && /Qualified Team 4/i.test(fixture.teams.teamB.name)) {
        if (topTeams[3]) {
          fixture.teams.teamB.name = topTeams[3];
          fixture.teams.teamB.placeholder = false;
        }
      }
      if (fixture.teams.teamA.placeholder && /Qualified Team 2/i.test(fixture.teams.teamA.name)) {
        if (topTeams[1]) {
          fixture.teams.teamA.name = topTeams[1];
          fixture.teams.teamA.placeholder = false;
        }
      }
      if (fixture.teams.teamB.placeholder && /Qualified Team 3/i.test(fixture.teams.teamB.name)) {
        if (topTeams[2]) {
          fixture.teams.teamB.name = topTeams[2];
          fixture.teams.teamB.placeholder = false;
        }
      }
    }
  });

  return updated;
};

export const calculateTournamentAnalytics = (tournament) => {
  const fixtures = tournament?.fixtures || [];
  const completed = fixtures.filter((f) => f.status === "completed");

  const batterStatsMap = new Map();
  const bowlerStatsMap = new Map();
  const teamWinMap = new Map();
  let tossBatWins = 0;
  let tossBowlWins = 0;
  let tossWinnerMatchWins = 0;

  completed.forEach((fixture) => {
    const res = fixture.result || {};
    const winner = res.winner;
    const tossWinner = res.tossWinner;
    const tossDecision = res.tossDecision;

    if (winner && tossWinner) {
      if (winner === tossWinner) tossWinnerMatchWins += 1;
      if (tossDecision === "bat" && winner === tossWinner) tossBatWins += 1;
      if (tossDecision === "bowl" && winner === tossWinner) tossBowlWins += 1;
    }

    [res.teamAScore, res.teamBScore].forEach((score) => {
      if (!score) return;
      
      // Batting Stats
      (score.battingCard || []).forEach((b) => {
        const existing = batterStatsMap.get(b.name) || {
          name: b.name,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          innings: 0,
          highestScore: 0,
        };
        existing.runs += Number(b.runs || 0);
        existing.balls += Number(b.balls || 0);
        existing.fours += Number(b.fours || 0);
        existing.sixes += Number(b.sixes || 0);
        existing.innings += 1;
        existing.highestScore = Math.max(existing.highestScore, Number(b.runs || 0));
        batterStatsMap.set(b.name, existing);
      });

      // Bowling Stats
      (score.bowlingCard || []).forEach((bw) => {
        const existing = bowlerStatsMap.get(bw.name) || {
          name: bw.name,
          wickets: 0,
          overs: 0,
          runs: 0,
          maidens: 0,
          innings: 0,
        };
        existing.wickets += Number(bw.wickets || 0);
        existing.overs += Number(bw.overs || 0);
        existing.runs += Number(bw.runs || 0);
        existing.maidens += Number(bw.maidens || 0);
        existing.innings += 1;
        bowlerStatsMap.set(bw.name, existing);
      });
    });
  });

  // Calculate Batting Leaderboard (Orange Cap)
  const orangeCapList = Array.from(batterStatsMap.values()).map((b) => ({
    ...b,
    strikeRate: b.balls > 0 ? Number(((b.runs / b.balls) * 100).toFixed(1)) : 0,
    average: b.innings > 0 ? Number((b.runs / b.innings).toFixed(1)) : b.runs,
  })).sort((a, b) => b.runs - a.runs);

  // Calculate Bowling Leaderboard (Purple Cap)
  const purpleCapList = Array.from(bowlerStatsMap.values()).map((bw) => ({
    ...bw,
    economy: bw.overs > 0 ? Number((bw.runs / bw.overs).toFixed(2)) : 0,
  })).sort((a, b) => b.wickets - a.wickets || a.economy - b.economy);

  // Boundaries Leaderboard
  const mostSixes = [...orangeCapList].sort((a, b) => b.sixes - a.sixes)[0] || null;
  const mostFours = [...orangeCapList].sort((a, b) => b.fours - a.fours)[0] || null;
  const bestStrikeRate = [...orangeCapList].filter(b => b.runs >= 20).sort((a, b) => b.strikeRate - a.strikeRate)[0] || null;
  const bestEconomy = [...purpleCapList].filter(b => b.overs >= 2).sort((a, b) => a.economy - b.economy)[0] || null;

  // Impact Score List
  const impactScores = Array.from(batterStatsMap.keys()).map((pName) => {
    const bat = batterStatsMap.get(pName) || { runs: 0, fours: 0, sixes: 0 };
    const bowl = bowlerStatsMap.get(pName) || { wickets: 0 };
    const impact = bat.runs + (bowl.wickets * 25) + (bat.sixes * 2) + bat.fours;
    return { name: pName, impactScore: impact, runs: bat.runs, wickets: bowl.wickets };
  }).sort((a, b) => b.impactScore - a.impactScore);

  // Auto Awards Evaluation
  const champion = tournament?.champion || tournament?.standings?.[0]?.teamName || "TBD";
  const runnerUp = tournament?.runnerUp || tournament?.standings?.[1]?.teamName || "TBD";
  const playerOfTournament = impactScores[0]?.name || "TBD";
  const emergingPlayer = orangeCapList[1]?.name || purpleCapList[1]?.name || "TBD";
  const bestBatter = orangeCapList[0]?.name || "TBD";
  const bestBowler = purpleCapList[0]?.name || "TBD";
  const bestFielder = impactScores[2]?.name || "TBD";
  const fairPlayAward = tournament?.standings?.[0]?.teamName || "TBD";

  return {
    totalMatchesCompleted: completed.length,
    orangeCap: orangeCapList[0] || null,
    purpleCap: purpleCapList[0] || null,
    orangeCapList: orangeCapList.slice(0, 10),
    purpleCapList: purpleCapList.slice(0, 10),
    boundaryStats: {
      mostSixes,
      mostFours,
      bestStrikeRate,
      bestEconomy,
    },
    tossAnalytics: {
      tossBatWins,
      tossBowlWins,
      tossWinnerMatchWins,
      winRateTossWinner: completed.length > 0 ? Number(((tossWinnerMatchWins / completed.length) * 100).toFixed(1)) : 0,
    },
    impactScores: impactScores.slice(0, 10),
    awards: {
      champion,
      runnerUp,
      playerOfTournament,
      emergingPlayer,
      bestBatter,
      bestBowler,
      bestFielder,
      fairPlayAward,
    },
  };
};

export const isTournamentCompleted = (tournament) => {
  const fixtures = tournament?.fixtures || [];
  return (
    fixtures.length > 0 &&
    fixtures.every((fixture) => fixture.status === "completed")
  );
};

export const buildCompletionReport = (tournament) => {
  const standings = tournament?.standings || [];
  const fixtures = tournament?.fixtures || [];
  const analytics = calculateTournamentAnalytics(tournament);

  const champion = tournament?.champion || standings[0]?.teamName || "TBD";
  const totalMatches = fixtures.length;
  const completedMatches = fixtures.filter((f) => f.status === "completed").length;

  const summary = `${tournament?.title || "Tournament"} successfully concluded! Total ${completedMatches} of ${totalMatches} matches completed. Champion: ${champion}.`;

  return {
    generatedAt: new Date(),
    summary,
    shareableLink: tournament?.inviteCode
      ? `/tournaments/join/${slugify(tournament.inviteCode)}`
      : "",
    analytics,
    standings,
  };
};

export const hydrateTournamentLifecycle = (tournament) => {
  const now = new Date();
  const registration = getRegistrationState(tournament, now);
  const updated = tournament;

  updated.registration = {
    ...updated.registration?.toObject?.(),
    ...updated.registration,
    status: registration.status,
  };

  if (registration.closed && !updated.registration.closedAt) {
    updated.registration.closedAt = now;
  }

  if (registration.status === "open") {
    updated.status = updated.status === "completed" ? updated.status : "registration_open";
  } else if (registration.closed && updated.fixtures?.length > 0) {
    updated.status = updated.status === "completed" ? updated.status : "scheduled";
  }

  if (
    (registration.closed || registration.status === "full") &&
    updated.teams.length >= (updated.registration?.minTeamsRequired || 0)
  ) {
    if (!updated.fixtures || updated.fixtures.length === 0) {
      const fixtures = buildTournamentFixtures(updated);
      updated.fixtures = scheduleFixtures(updated, fixtures);
      updated.standings = buildStandings(updated, updated.fixtures);
      updated.status = updated.fixtures.some((fixture) => fixture.status === "scheduled")
        ? "scheduled"
        : updated.status;
    }
  }

  // Check if all league matches are done to populate playoffs
  const leagueFixtures = (updated.fixtures || []).filter(f => LEAGUE_STAGE_PATTERN.test(String(f.stage || "")));
  if (leagueFixtures.length > 0 && leagueFixtures.every(f => f.status === "completed")) {
    updated.fixtures = populatePlayoffSeeds(updated);
  }

  if (isTournamentCompleted(updated)) {
    updated.status = "completed";
    updated.standings = buildStandings(updated, updated.fixtures);
    const analytics = calculateTournamentAnalytics(updated);
    updated.champion = updated.champion || analytics.awards.champion;
    updated.runnerUp = updated.runnerUp || analytics.awards.runnerUp;
    updated.awards = { ...updated.awards, ...analytics.awards };
    updated.report = buildCompletionReport(updated);
  }

  return updated;
};
