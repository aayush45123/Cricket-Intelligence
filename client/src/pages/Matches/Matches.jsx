import React, { useState, useEffect } from "react";
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
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Matches</h1>
          <p className={styles.heroSubtitle}>
            Browse all matches and view detailed insights.
          </p>
        </section>

        <section className={styles.grid}>
          {matches.map((match) => (
            <div className={styles.card} key={match._id}>
              <div className={styles.cardHeader}>
                <span className={styles.teamNames}>
                  {match.teams.teamA.name} vs {match.teams.teamB.name}
                </span>
                <span className={styles.formatBadge}>{match.format}</span>
              </div>

              <div className={styles.cardBody}>
                <span className={styles.metaItem}>{match.venue}</span>
                <span className={styles.metaDivider} />
                <span className={styles.metaItem}>
                  {new Date(match.date).toLocaleDateString()}
                </span>
              </div>

              <button
                className={styles.button}
                onClick={() => navigate(`/matches/${match._id}`)}
              >
                View Insight
              </button>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Matches;
