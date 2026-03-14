import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    format: {
      type: String,
      enum: ["T20", "ODI", "TEST", "T10"],
      required: true,
    },

    date: { type: Date, required: true },

    venue: { type: String, required: true },

    teams: {
      teamA: {
        name: { type: String, required: true },

        squad: [
          {
            type: String, // player name
          },
        ],
      },

      teamB: {
        name: { type: String, required: true },

        squad: [
          {
            type: String,
          },
        ],
      },
    },

    // Toss information
    toss: {
      wonBy: {
        type: String,
        enum: ["teamA", "teamB"],
        required: true,
      },

      decision: {
        type: String,
        enum: ["bat", "bowl"],
        required: true,
      },
    },

    // Batting order
    battingFirst: {
      type: String,
      enum: ["teamA", "teamB"],
      required: true,
    },

    battingSecond: {
      type: String,
      enum: ["teamA", "teamB"],
      required: true,
    },

    innings: {
      statsByTeamA: {
        runs: { type: Number, required: true },
        wickets: { type: Number, required: true },
        overs: { type: Number, required: true },
      },

      statsByTeamB: {
        runs: { type: Number, required: true },
        wickets: { type: Number, required: true },
        overs: { type: Number, required: true },
      },
    },

    result: {
      winner: { type: String, required: true },
      margin: { type: String, required: true },
    },
  },

  {
    timestamps: true,
  },
);

const Match = mongoose.model("Match", matchSchema);

export default Match;
