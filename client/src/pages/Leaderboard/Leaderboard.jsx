import React from "react";
import { useState, useEffect } from "react";

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    // Simulate an API call to fetch leaderboard data
    const fetchLeaderboardData = async () => {
      // Replace this with your actual API call
      const response = await fetch("/api/matches/leaderboard");
      const data = await response.json();
      setTeams(data);
    };

    fetchLeaderboardData();
  }, []);

  return (
    <div>
      <h2>Leaderboard</h2>
      <ul>
        {teams.map((team) => (
          <li key={team.id}>
            {team.name}: {team.score}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
