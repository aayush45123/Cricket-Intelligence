import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./BowlingStats.module.css";

const BowlingStats = () => {
  const { playerName } = useParams();
  const [bowler, setBowler] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/players/bowling-stats/${playerName}`);
        const result = await res.json();
        setBowler(result.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load player stats");
      }
    };
    fetchData();
  }, [playerName]);

  if (error) return <p className={styles.stateText}>{error}</p>;
  if (!bowler) return <p className={styles.stateText}>Loading...</p>;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <h1 className={styles.heroTitle}>{bowler.playerName}</h1>
          </div>
          <span className={styles.categoryBadge}>{bowler.category}</span>
        </section>

        <div className={styles.card}>
          <p className={styles.cardTitle}>Bowling Statistics</p>
          <div className={styles.statsGrid}>
            <div className={styles.statItemHighlight}>
              <span className={styles.statLabel}>Total Wickets</span>
              <span className={styles.statValue}>{bowler.totalWickets}</span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Balls Bowled</span>
              <span className={styles.statValue}>
                {bowler.totalBallsBowled}
              </span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Economy</span>
              <span className={styles.statValue}>
                {bowler.bowlingEconomyRate.toFixed(2)}
              </span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Strike Rate</span>
              <span className={styles.statValue}>
                {bowler.bowlingStrikeRate.toFixed(2)}
              </span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Average</span>
              <span className={styles.statValue}>
                {bowler.bowlingAverage.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BowlingStats;
