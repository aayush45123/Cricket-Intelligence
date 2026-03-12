import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Matches.module.css";

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      const res = await fetch("/api/matches");
      const data = await res.json();
      setMatches(data.data);
    };

    fetchMatches();
  }, []);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}> List of Matches</h3>

      {matches.map((match) => (
        <div className={styles.card} key={match._id}>
          <div className={styles.teams}>
            {match.teams.teamA.name} vs {match.teams.teamB.name}
          </div>

          <div className={styles.info}>Venue: {match.venue}</div>
          <div className={styles.info}>Format: {match.format}</div>
          <div className={styles.info}>
            Date: {new Date(match.date).toLocaleDateString()}
          </div>

          <button
            className={styles.button}
            onClick={() => navigate(`/matches/${match._id}`)}
          >
            View Insight
          </button>
        </div>
      ))}
    </div>
  );
};

export default Matches;
