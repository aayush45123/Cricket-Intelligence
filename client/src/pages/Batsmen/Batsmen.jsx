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
      } catch (fetchError) {
        console.error("Error fetching batting analytics", fetchError);
        setError("Unable to load batting analytics right now.");
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
            Explore run-scoring impact, strike rate, and batting averages for
            each player.
          </p>
        </section>

        <section className={styles.grid}>
          {batsmen.map((batsman) => (
            <div className={styles.card} key={batsman.playerName}>
              <div className={styles.cardHeader}>
                <h3 className={styles.batsmanName}>{batsman.playerName}</h3>
              </div>

              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Total Runs</span>
                  <span className={styles.statValue}>{batsman.totalRuns}</span>
                </div>

                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Balls Faced</span>
                  <span className={styles.statValue}>
                    {batsman.totalBallsFaced}
                  </span>
                </div>
              </div>

              <button
                className={styles.button}
                onClick={() => navigate(`/players/${batsman.playerName}`)}
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
