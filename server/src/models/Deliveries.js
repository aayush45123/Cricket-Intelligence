import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
  {
    match_id: Number,
    date: String,
    match_type: String,
    event_name: String,

    innings: Number,
    batting_team: String,
    bowling_team: String,

    over: Number,
    ball: Number,
    ball_no: Number,

    batter: String,
    bat_pos: Number,
    runs_batter: Number,
    balls_faced: Number,

    bowler: String,
    valid_ball: Number,

    runs_extras: Number,
    runs_total: Number,
    runs_bowler: Number,
    runs_not_boundary: Boolean,

    extra_type: String,

    non_striker: String,
    non_striker_pos: Number,

    wicket_kind: String,
    player_out: String,
    fielders: String,

    runs_target: Number,

    review_batter: String,
    team_reviewed: String,
    review_decision: String,
    umpire: String,
    umpires_call: Boolean,

    player_of_match: String,
    match_won_by: String,
    win_outcome: String,

    toss_winner: String,
    toss_decision: String,

    venue: String,
    city: String,

    day: Number,
    month: Number,
    year: Number,

    season: String,
    gender: String,
    team_type: String,

    superover_winner: String,
    result_type: String,
    method: String,

    balls_per_over: Number,
    overs: Number,

    event_match_no: String,
    stage: String,
    match_number: String,

    team_runs: Number,
    team_balls: Number,
    team_wicket: Number,

    new_batter: String,
    batter_runs: Number,
    batter_balls: Number,

    bowler_wicket: Number,

    batting_partners: String,
    next_batter: String,

    striker_out: Boolean,
  },
  {
    timestamps: false,
  }
);

/* ─────────────────────────────────────────────────────────────
   Performance Indexes
   
   Existing (created manually via mongosh):
     batter_1, bowler_1, match_id_1
   
   Additional indexes declared here so they can be created via
   mongoose.syncIndexes() or a migration script.
   
   NOTE: Do not call createIndexes() automatically in production
   on large collections — schedule during low-traffic windows.
   ───────────────────────────────────────────────────────────── */

// Single-field indexes for common filter patterns
deliverySchema.index({ batting_team: 1 }, { background: true });
deliverySchema.index({ bowling_team: 1 }, { background: true });
deliverySchema.index({ venue: 1 }, { background: true });
deliverySchema.index({ season: 1 }, { background: true });

// Compound indexes for season-filtered queries
deliverySchema.index({ batter: 1, season: 1 }, { background: true });
deliverySchema.index({ bowler: 1, season: 1 }, { background: true });
deliverySchema.index({ batting_team: 1, season: 1 }, { background: true });
deliverySchema.index({ bowling_team: 1, season: 1 }, { background: true });

// Compound index for match deep analytics
deliverySchema.index({ match_id: 1, innings: 1 }, { background: true });

// Compound for H2H queries
deliverySchema.index({ batting_team: 1, bowling_team: 1, season: 1 }, { background: true });

const Delivery = mongoose.model("Delivery", deliverySchema);

export default Delivery;
