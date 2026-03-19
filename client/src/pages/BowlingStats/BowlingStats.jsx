import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const BowlingStats = () => {
  const { playerName } = useParams();
  const [bowler, setBowler] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/matches/players/bowling-analytics/${playerName}`,
        );
        const result = await res.json();
        setBowler(result.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load player stats");
      }
    };
    fetchData();
  }, [playerName]);

  if (error) return <p>{error}</p>;
  if (!bowler) return <p>Loading...</p>;

  return (
    <div>
      <h1>{bowler.playerName}</h1>
      <p>Total Wickets: {bowler.totalWickets}</p>
      <p>Total Balls Bowled: {bowler.totalBallsBowled}</p>
      <p>Economy: {bowler.bowlingEconomyRate.toFixed(2)}</p>
      <p>Strike Rate: {bowler.bowlingStrikeRate.toFixed(2)}</p>
      <p>Average: {bowler.bowlingAverage.toFixed(2)}</p>
      <p>Category: {bowler.category}</p>
    </div>
  );
};

export default BowlingStats;
