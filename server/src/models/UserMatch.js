import mongoose from "mongoose";

const userMatchSchema = new mongoose.Schema(
  {
    /* Owner */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* Teams */
    teamA: { type: String, required: true, trim: true },
    teamB: { type: String, required: true, trim: true },
    playersA: [{ type: String, trim: true }],
    playersB: [{ type: String, trim: true }],

    /* Match config */
    totalOvers: { type: Number, required: true, min: 1, max: 50 },
    venue: { type: String, default: "" },
    matchDate: { type: Date, default: Date.now },

    /* Toss */
    tossWinner: { type: String, default: "" },
    tossDecision: { type: String, enum: ["bat", "field"], default: "bat" },

    /* Live state */
    currentInnings: { type: Number, default: 1 }, // 1 or 2
    status: {
      type: String,
      enum: ["setup", "live", "innings_break", "completed"],
      default: "setup",
    },

    /* Scorecard (maintained server-side for instant reads) */
    innings1: {
      battingTeam: { type: String, default: "" },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      overs: { type: Number, default: 0 }, // 0-indexed, e.g. 14.3 = over 14, ball 3
      balls: { type: Number, default: 0 }, // total valid balls
      extras: { type: Number, default: 0 },
    },
    innings2: {
      battingTeam: { type: String, default: "" },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
      balls: { type: Number, default: 0 },
      extras: { type: Number, default: 0 },
    },

    /* Live batters / bowler (names) */
    striker: { type: String, default: "" },
    nonStriker: { type: String, default: "" },
    bowler: { type: String, default: "" },

    /* Result */
    winner: { type: String, default: "" },
    winOutcome: { type: String, default: "" }, // e.g. "won by 23 runs"

    /* Share token (for /match/shareToken public view) */
    shareToken: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

/* Compound index for list queries */
userMatchSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("UserMatch", userMatchSchema);
