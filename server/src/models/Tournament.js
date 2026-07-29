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
  { _id: false }
);

const tournamentTeamSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true, trim: true },
    captainId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    captainName: { type: String, default: "" },
    players: [tournamentPlayerSchema],
  },
  { timestamps: true }
);

const tournamentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
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
      enum: ["upcoming", "ongoing", "completed"],
      default: "upcoming",
    },
    teams: [tournamentTeamSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Tournament", tournamentSchema);
