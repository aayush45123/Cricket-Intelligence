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
  },
);

const Delivery = mongoose.model("Delivery", deliverySchema);

export default Delivery;
