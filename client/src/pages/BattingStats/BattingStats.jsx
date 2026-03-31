import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./BattingStats.module.css";

const BattingStats = () => {
  const { playerName } = useParams();
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/players/batting-analytics/${playerName}`);
        const result = await res.json();
        setPlayer(result.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load player stats");
      }
    };
    fetchData();
  }, [playerName]);

  if (error) return <p className={styles.stateText}>{error}</p>;
  if (!player) return <p className={styles.stateText}>Loading...</p>;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <h1 className={styles.heroTitle}>{player.playerName}</h1>
          </div>
          <span className={styles.categoryBadge}>{player.category}</span>
        </section>

        <div className={styles.card}>
          <p className={styles.cardTitle}>Batting Statistics</p>
          <div className={styles.statsGrid}>
            <div className={styles.statItemHighlight}>
              <span className={styles.statLabel}>Total Runs</span>
              <span className={styles.statValue}>{player.totalRuns}</span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Balls Faced</span>
              <span className={styles.statValue}>{player.totalBalls}</span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Average</span>
              <span className={styles.statValue}>
                {player.battingAverage.toFixed(2)}
              </span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Strike Rate</span>
              <span className={styles.statValue}>
                {player.strikeRate.toFixed(2)}
              </span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Score</span>
              <span className={styles.statValue}>{player.score}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BattingStats;
