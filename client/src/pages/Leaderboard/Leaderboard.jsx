import React from "react";
import { useState, useEffect } from "react";

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    // Simulate an API call to fetch leaderboard data
    const fetchLeaderboardData = async () => {
      // Replace this with your actual API call
      const response = await fetch("/api/leaderboard");
      const data = await response.json();
      setPlayers(data);
    };

    fetchLeaderboardData();
  }, []);

  return (
    <div>
      <h2>Leaderboard</h2>
      <ul>
        {players.map((player) => (
          <li key={player.id}>
            {player.name}: {player.score}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
