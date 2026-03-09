import React from "react";
import { useState, useEffect } from "react";

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    // Simulate an API call to fetch leaderboard data
    const fetchLeaderboardData = async () => {
      // Replace this with your actual API call
      const response = await fetch("/api/matches/teams/leaderboard");
      const data = await response.json();
      setTeams(data.teams);
    };

    fetchLeaderboardData();
  }, []);

  return (
    <div>
      <h2>Leaderboard</h2>
      <span>Teams</span>
      <span>Matches Played</span>
      <span>Wins</span>
      <span>Losses</span>
      <span>NRR</span>
      {teams.map((team) => (
        <div key={team.team}>
          <span>{team.team}</span>
          <span>{team.matchesPlayed}</span>
          <span>{team.wins}</span>
          <span>{team.losses}</span>
          <span>{team.winRate}</span>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;
