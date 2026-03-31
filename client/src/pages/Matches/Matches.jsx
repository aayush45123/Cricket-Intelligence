import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Matches.module.css";

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch("/api/matches");
        const result = await res.json();

        setMatches(result.data || []);
      } catch (err) {
        console.error(err);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Matches</h1>

        <section className={styles.grid}>
          {loading ? (
            <p>Loading...</p>
          ) : matches.length === 0 ? (
            <p>No matches found</p>
          ) : (
            matches.map((match) => (
              <div key={match.matchId} className={styles.card}>
                <h3>
                  {match.teamA} vs {match.teamB}
                </h3>

                <p>{match.venue}</p>
                <p>{new Date(match.date).toLocaleDateString()}</p>
                <p>Winner: {match.winner}</p>

                <button onClick={() => navigate(`/matches/${match.matchId}`)}>
                  View Insight
                </button>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default Matches;
