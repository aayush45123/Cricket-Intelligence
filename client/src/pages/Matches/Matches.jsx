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
        <h1 className={styles.heading}>Matches</h1>

        <section className={styles.grid}>
          {loading ? (
            <p className={styles.statusText}>Loading...</p>
          ) : matches.length === 0 ? (
            <p className={styles.statusText}>No matches found</p>
          ) : (
            matches.map((match) => (
              <div key={match.matchId} className={styles.card}>
                <h3 className={styles.cardTitle}>
                  {match.teamA} <span className={styles.vs}>vs</span>{" "}
                  {match.teamB}
                </h3>
                <p className={styles.cardMeta}>{match.venue}</p>
                <p className={styles.cardMeta}>
                  {new Date(match.date).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className={styles.cardWinner}>
                  Winner: <span>{match.winner || "—"}</span>
                </p>
                <button
                  className={styles.insightBtn}
                  onClick={() => navigate(`/matches/${match.matchId}`)}
                >
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
