import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const BattingStats = () => {
  const { playerName } = useParams();
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/matches/players/batting-analytics/${playerName}`,
        );
        const result = await res.json();
        setPlayer(result.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load player stats");
      }
    };
    fetchData();
  }, [playerName]);

  if (error) return <p>{error}</p>;
  if (!player) return <p>Loading...</p>;

  return (
    <div>
      <h1>{player.playerName}</h1>
      <p>Total Runs: {player.totalRuns}</p>
      <p>Balls: {player.totalBalls}</p>
      <p>Average: {player.battingAverage.toFixed(2)}</p>
      <p>Strike Rate: {player.strikeRate.toFixed(2)}</p>
      <p>Category: {player.category}</p>
      <p>Score: {player.score}</p>
    </div>
  );
};

export default BattingStats;
