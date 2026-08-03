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
      netRunRate: 0,
      qualified: false,
      eliminated: false,
    });
  });

  fixtures.forEach((fixture) => {
    if (fixture.status !== "completed") {
      return;
    }

    if (!LEAGUE_STAGE_PATTERN.test(String(fixture.stage || ""))) {
      return;
    }

    const teamAName = fixture.teams?.teamA?.name;
    const teamBName = fixture.teams?.teamB?.name;
    const result = fixture.result || {};
    const scoreA = result.teamAScore || {};
    const scoreB = result.teamBScore || {};

    if (teamAName && standingsMap.has(teamAName)) {
      const team = standingsMap.get(teamAName);
      team.played += 1;
      team.runsFor += Number(scoreA.runs || 0);
      team.runsAgainst += Number(scoreB.runs || 0);
    }

    if (teamBName && standingsMap.has(teamBName)) {
      const team = standingsMap.get(teamBName);
      team.played += 1;
      team.runsFor += Number(scoreB.runs || 0);
      team.runsAgainst += Number(scoreA.runs || 0);
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
    const runsForBalls = Math.max(1, team.played * 6 * 20);
    const runsAgainstBalls = Math.max(1, team.played * 6 * 20);
    const nrr =
      team.runsFor / runsForBalls - team.runsAgainst / runsAgainstBalls;
    return {
      ...team,
      netRunRate: Number.isFinite(nrr) ? Number(nrr.toFixed(3)) : 0,
    };
  });

  standings.sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    if (right.netRunRate !== left.netRunRate)
      return right.netRunRate - left.netRunRate;
    if (right.wins !== left.wins) return right.wins - left.wins;
    return left.teamName.localeCompare(right.teamName);
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

export const simulateFixtureResult = (fixture, tournament) => {
  const teamA = fixture?.teams?.teamA?.name;
  const teamB = fixture?.teams?.teamB?.name;

  if (
    !teamA ||
    !teamB ||
    isPlaceholderName(fixture?.teams?.teamA) ||
    isPlaceholderName(fixture?.teams?.teamB)
  ) {
    return null;
  }

  const format = String(tournament?.format || "T20").toUpperCase();
  const baseRuns =
    format === "T10"
      ? 95
      : format === "ODI"
        ? 245
        : format === "TEST"
          ? 420
          : 165;
  const seed = hashToNumber(
    `${tournament?.inviteCode || ""}:${fixture.fixtureId}:${teamA}:${teamB}`,
  );
  const swing = (seed % 41) - 20;
  const teamARuns = Math.max(60, baseRuns + swing);
  const teamBRuns = Math.max(60, baseRuns - swing);
  const winner =
    teamARuns === teamBRuns
      ? seed % 2 === 0
        ? teamA
        : teamB
      : teamARuns > teamBRuns
        ? teamA
        : teamB;
  const margin = `${Math.abs(teamARuns - teamBRuns)} runs`;

  return {
    winner,
    margin,
    teamAScore: {
      runs: teamARuns,
      wickets: Math.min(10, 7 + (seed % 4)),
      overs:
        format === "TEST"
          ? 90
          : format === "ODI"
            ? 50
            : format === "T10"
              ? 10
              : 20,
    },
    teamBScore: {
      runs: teamBRuns,
      wickets: Math.min(10, 6 + ((seed >> 2) % 5)),
      overs:
        format === "TEST"
          ? 86
          : format === "ODI"
            ? 49.4
            : format === "T10"
              ? 9.5
              : 20,
    },
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
  const champion = tournament?.champion || standings[0]?.teamName || "";
  const totalMatches = fixtures.length;
  const completedMatches = fixtures.filter(
    (fixture) => fixture.status === "completed",
  ).length;
  const summary = `${tournament?.title || "Tournament"} completed with ${completedMatches} of ${totalMatches} matches finished. Champion: ${champion || "TBD"}.`;

  return {
    generatedAt: new Date(),
    summary,
    shareableLink: tournament?.inviteCode
      ? `/tournaments/join/${slugify(tournament.inviteCode)}`
      : "",
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
    updated.status =
      updated.status === "completed" ? updated.status : "registration_open";
  } else if (registration.closed && updated.fixtures?.length > 0) {
    updated.status =
      updated.status === "completed" ? updated.status : "scheduled";
  }

  if (
    (registration.closed || registration.status === "full") &&
    updated.teams.length >= (updated.registration?.minTeamsRequired || 0)
  ) {
    if (!updated.fixtures || updated.fixtures.length === 0) {
      const fixtures = buildTournamentFixtures(updated);
      updated.fixtures = scheduleFixtures(updated, fixtures);
      updated.standings = buildStandings(updated, updated.fixtures);
      updated.status = updated.fixtures.some(
        (fixture) => fixture.status === "scheduled",
      )
        ? "scheduled"
        : updated.status;
    }
  }

  if (isTournamentCompleted(updated)) {
    updated.status = "completed";
    updated.standings = buildStandings(updated, updated.fixtures);
    updated.report = buildCompletionReport(updated);
  }

  return updated;
};
