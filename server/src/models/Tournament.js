import mongoose from "mongoose";

const tournamentPlayerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false },
);

const scheduledTeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    placeholder: { type: Boolean, default: false },
    sourceFixtureId: { type: String, default: null },
    sourceOutcome: { type: String, default: null },
  },
  { _id: false },
);

const fixtureResultSchema = new mongoose.Schema(
  {
    winner: { type: String, default: "" },
    margin: { type: String, default: "" },
    teamAScore: {
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
    },
    teamBScore: {
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
    },
  },
  { _id: false },
);

const fixtureSchema = new mongoose.Schema(
  {
    fixtureId: { type: String, required: true },
    stage: { type: String, required: true },
    round: { type: Number, default: 1 },
    matchNumber: { type: Number, default: 1 },
    bracket: { type: String, default: "main" },
    scheduledAt: { type: Date, default: null },
    venue: { type: String, default: "" },
    ground: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "scheduled", "live", "completed", "cancelled"],
      default: "pending",
    },
    teams: {
      teamA: { type: scheduledTeamSchema, required: true },
      teamB: { type: scheduledTeamSchema, required: true },
    },
    result: { type: fixtureResultSchema, default: () => ({}) },
  },
  { timestamps: true },
);

const standingSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true, trim: true },
    played: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    ties: { type: Number, default: 0 },
    noResult: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    runsFor: { type: Number, default: 0 },
    runsAgainst: { type: Number, default: 0 },
    netRunRate: { type: Number, default: 0 },
    qualified: { type: Boolean, default: false },
    eliminated: { type: Boolean, default: false },
  },
  { _id: false },
);

const tournamentTeamSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true, trim: true },
    captainId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    captainName: { type: String, default: "" },
    teamLogo: { type: String, default: "" },
    jerseyColors: [{ type: String, trim: true }],
    captainContact: { type: String, default: "" },
    players: [tournamentPlayerSchema],
  },
  { timestamps: true },
);

const registrationSchema = new mongoose.Schema(
  {
    opensAt: { type: Date, default: null },
    closesAt: { type: Date, default: null },
    maxTeams: { type: Number, default: 0 },
    minTeamsRequired: { type: Number, default: 0 },
    closedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["open", "closed", "full"],
      default: "open",
    },
  },
  { _id: false },
);

const scheduleSchema = new mongoose.Schema(
  {
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    grounds: { type: Number, default: 1 },
    dailyStartTime: { type: String, default: "09:00" },
    dailyEndTime: { type: String, default: "18:00" },
    matchDurationMinutes: { type: Number, default: 120 },
    restGapMinutes: { type: Number, default: 60 },
    maxMatchesPerTeamPerDay: { type: Number, default: 2 },
  },
  { _id: false },
);

const matchRulesSchema = new mongoose.Schema(
  {
    overs: { type: Number, default: 20 },
    powerplayOvers: { type: Number, default: 6 },
    superOver: { type: Boolean, default: true },
    dlsEnabled: { type: Boolean, default: true },
    tieRules: { type: String, default: "Super Over" },
  },
  { _id: false },
);

const tournamentReportSchema = new mongoose.Schema(
  {
    generatedAt: { type: Date, default: null },
    summary: { type: String, default: "" },
    shareableLink: { type: String, default: "" },
  },
  { _id: false },
);

const tournamentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    tournamentLogo: { type: String, default: "" },
    organizerName: { type: String, default: "" },
    tournamentType: { type: String, default: "League" },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    format: { type: String, default: "T20" },
    location: { type: String, default: "" },
    description: { type: String, default: "" },
    inviteCode: { type: String, unique: true, required: true, index: true },
    status: {
      type: String,
      enum: [
        "draft",
        "upcoming",
        "registration_open",
        "registration_closed",
        "scheduled",
        "ongoing",
        "playoffs",
        "completed",
      ],
      default: "upcoming",
    },
    registration: { type: registrationSchema, default: () => ({}) },
    dates: {
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
    },
    rules: { type: matchRulesSchema, default: () => ({}) },
    schedule: { type: scheduleSchema, default: () => ({}) },
    teams: [tournamentTeamSchema],
    fixtures: [fixtureSchema],
    standings: [standingSchema],
    qualifiedTeams: [{ type: String, trim: true }],
    champion: { type: String, default: "" },
    runnerUp: { type: String, default: "" },
    awards: {
      playerOfTournament: { type: String, default: "" },
      emergingPlayer: { type: String, default: "" },
      bestBatter: { type: String, default: "" },
      bestBowler: { type: String, default: "" },
      bestFielder: { type: String, default: "" },
      fairPlayAward: { type: String, default: "" },
    },
    report: { type: tournamentReportSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export default mongoose.model("Tournament", tournamentSchema);
