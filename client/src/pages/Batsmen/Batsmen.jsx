import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Batsmen.module.css";

const Batsmen = () => {
  const [batsmen, setBatsmen] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/matches/players/batting-analytics");
        const result = await res.json();
        setBatsmen(result.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load batting analytics");
      }
    };
    fetchData();
  }, []);

  if (error) return <p className={styles.stateText}>{error}</p>;
  if (!batsmen.length) return <p className={styles.stateText}>Loading...</p>;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Batsmen</h1>
          <p className={styles.heroSubtitle}>
            Run-scoring impact, strike rates, and batting profiles for every
            player.
          </p>
        </section>

        <section className={styles.grid}>
          {batsmen.map((batsman) => (
            <div className={styles.card} key={batsman.playerName}>
              <div className={styles.cardHeader}>
                <h3 className={styles.playerName}>{batsman.playerName}</h3>
                <span className={styles.categoryBadge}>{batsman.category}</span>
              </div>

              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Total Runs</span>
                  <span className={styles.statValue}>{batsman.totalRuns}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Strike Rate</span>
                  <span className={styles.statValue}>
                    {batsman.strikeRate.toFixed(1)}
                  </span>
                </div>
              </div>

              <button
                className={styles.button}
                onClick={() =>
                  navigate(
                    `/players/batting-analytics/${encodeURIComponent(batsman.playerName)}`,
                  )
                }
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

export default Batsmen;
