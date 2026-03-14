import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import TossImpactChart from "../../components/charts/TossImpactChart/TossImpactChart";

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/matches/analytics");
      const result = await response.json();
      setData(result.data);
    };

    fetchData();
  }, []);

  if (!data) {
    return (
      <div className={styles.loadingWrapper}>
        <p className={styles.loadingText}>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Cricket Intelligence Dashboard</h1>
          <p className={styles.heroSubtitle}>
            Explore insights, player statistics, and match analyses to enhance
            your cricket experience.
          </p>
        </section>

        <section className={styles.analyticsSection}>
          <h2 className={styles.sectionTitle}>Analytics</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Matches</span>
              <span className={styles.statValue}>
                {data?.totalMatches || 0}
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Avg Run Rate — Team A</span>
              <span className={styles.statValue}>
                {data.averageRunRateTeamA?.toFixed(2) || 0}
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Avg Run Rate — Team B</span>
              <span className={styles.statValue}>
                {data.averageRunRateTeamB?.toFixed(2) || 0}
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Avg Pressure Index</span>
              <span className={styles.statValue}>
                {data.averagePressureIndex?.toFixed(2) || 0}
              </span>
            </div>
          </div>
        </section>

        <section className={styles.dominantSection}>
          <h2 className={styles.sectionTitle}>Most Dominant Match</h2>
          <div className={styles.matchCard}>
            <span className={styles.teamName}>
              {data?.mostDominantMatch?.teams?.teamA?.name}
            </span>
            <span className={styles.matchVs}>vs</span>
            <span className={styles.teamName}>
              {data?.mostDominantMatch?.teams?.teamB?.name}
            </span>
          </div>
        </section>
        <div>
          <h2>Analytics</h2>
          <TossImpactChart></TossImpactChart>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
