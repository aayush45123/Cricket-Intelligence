import React, { useState, useEffect } from "react";
import styles from "./Leaderboard.module.css";

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      const response = await fetch("/api/matches/teams/leaderboard");
      const data = await response.json();
      setTeams(data.teams);
    };

    fetchLeaderboardData();
  }, []);

  return (
    <div className={styles.leaderboard}>
      <h2>🏏 Team Leaderboard</h2>

      <div className={`${styles.grid} ${styles.header}`}>
        <span>Rank</span>
        <span>Team</span>
        <span>Played</span>
        <span>Wins</span>
        <span>Losses</span>
        <span>Win Rate</span>
      </div>

      {teams.map((team, index) => (
        <div className={`${styles.grid} ${styles.row}`} key={team.team}>
          <span>{index + 1}</span>
          <span>{team.team}</span>
          <span>{team.matchesPlayed}</span>
          <span>{team.wins}</span>
          <span>{team.losses}</span>
          <span>{team.winRate}%</span>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;
