import mongoose from "mongoose";

/*
  Field names are intentionally identical to the IPL Delivery model
  so that all existing analytics functions work by simply swapping
  the model reference:  Delivery  →  UserDelivery
*/
const userDeliverySchema = new mongoose.Schema(
  {
    /* Match reference */
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserMatch",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* Innings position */
    innings: { type: Number, required: true }, // 1 or 2
    over: { type: Number, required: true }, // 0-based (0 = first over)
    ball: { type: Number, required: true }, // 1-based within the over

    /* Players */
    batter: { type: String, required: true },
    non_striker: { type: String, default: "" },
    bowler: { type: String, required: true },
    batting_team: { type: String, default: "" },
    bowling_team: { type: String, default: "" },

    /* Runs */
    runs_batter: { type: Number, default: 0 },
    runs_extras: { type: Number, default: 0 },
    runs_total: { type: Number, default: 0 },
    runs_bowler: { type: Number, default: 0 }, // = runs_batter (extras don't count to bowler)

    /* Ball validity */
    valid_ball: { type: Number, default: 1 }, // 0 for wide / no-ball

    /* Extra type */
    extra_type: { type: String, default: null }, // "wide" | "noball" | "bye" | "legbye" | null

    /* Wicket */
    bowler_wicket: { type: Number, default: 0 }, // 1 if bowler's wicket, 0 otherwise
    wicket_kind: { type: String, default: null },
    player_out: { type: String, default: null },

    /* Target (set on first ball of innings 2) */
    runs_target: { type: Number, default: 0 },

    /* Phase helpers (computed on insert) */
    phase: {
      type: String,
      enum: ["Powerplay", "Middle", "Death"],
      default: "Powerplay",
    },
  },
  { timestamps: true },
);

/* Indexed for fast retrieval by match + innings order */
userDeliverySchema.index({ matchId: 1, innings: 1, over: 1, ball: 1 });

export default mongoose.model("UserDelivery", userDeliverySchema);
