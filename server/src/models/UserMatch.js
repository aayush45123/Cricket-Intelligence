import mongoose from "mongoose";

const inningsSchema = new mongoose.Schema(
  {
    battingTeam: { type: String, default: "" },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 }, // total valid balls faced
    extras: { type: Number, default: 0 },
  },
  { _id: false },
);

const userMatchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    teamA: { type: String, required: true, trim: true },
    teamB: { type: String, required: true, trim: true },
    playersA: [{ type: String, trim: true }],
    playersB: [{ type: String, trim: true }],

    totalOvers: { type: Number, required: true, min: 1, max: 50 },
    venue: { type: String, default: "" },
    matchDate: { type: Date, default: Date.now },

    tossWinner: { type: String, default: "" },
    tossDecision: { type: String, enum: ["bat", "field"], default: "bat" },

    currentInnings: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["setup", "live", "innings_break", "completed"],
      default: "setup",
    },

    innings1: { type: inningsSchema, default: () => ({}) },
    innings2: { type: inningsSchema, default: () => ({}) },

    striker: { type: String, default: "" },
    nonStriker: { type: String, default: "" },
    bowler: { type: String, default: "" },

    /* FIX 3: tracks whether the new over requires a bowler change */
    overRequiresBowlerChange: { type: Boolean, default: false },

    winner: { type: String, default: "" },
    winOutcome: { type: String, default: "" },

    shareToken: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

userMatchSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("UserMatch", userMatchSchema);
