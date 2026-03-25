import React, { useEffect, useMemo, useState } from "react";
import styles from "./Bowlers.module.css";
import { useNavigate } from "react-router-dom";

const Bowlers = () => {
  const [bowlers, setBowlers] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/players/bowling-stats");
        const result = await res.json();
        setBowlers(result.data);
      } catch (fetchError) {
        console.error("Error fetching bowling analytics", fetchError);
        setError("Unable to load bowling analytics right now.");
      }
    };
    fetchData();
  }, []);
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Bowlers</h1>
          <p className={styles.heroSubtitle}>
            Explore wicket-taking impact, economy, and strike metrics for each
            bowler.
          </p>
        </section>

        <section className={styles.grid}>
          {bowlers.map((bowler) => (
            <div className={styles.card} key={bowler.playerName}>
              <h3 className={styles.bowlerName}>{bowler.playerName}</h3>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Total Wickets</span>
                  <span className={styles.statValue}>
                    {bowler.totalWickets}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Total Balls Bowled</span>
                  <span className={styles.statValue}>
                    {bowler.totalBallsBowled}
                  </span>
                </div>
                <button
                  className={styles.button}
                  onClick={() =>
                    navigate(`/players/bowling-analytics/${bowler.playerName}`)
                  }
                >
                  View Insight
                </button>{" "}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Bowlers;
