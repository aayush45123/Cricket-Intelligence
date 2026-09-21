import React, { useEffect, useState, useCallback } from "react";
import styles from "./Dashboard.module.css";
import TossImpactChart from "../../components/charts/TossImpactChart/TossImpactChart";
import MatchIntensityChart from "../../components/charts/MatchIntensityChart/MatchIntensityChart";
import TeamWins from "../../components/charts/TeamWins/TeamWins";
import RunRateChart from "../../components/charts/RunRateChart/RunRateChart";
import TopRunScorer from "../../components/charts/TopRunScorer/TopRunScorer";
import HighestWicketTaker from "../../components/charts/HighestWicketTaker/HighestWicketTaker";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/matches/analytics");
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      const result = await response.json();
      if (result && result.data) {
        setData(result.data);
      } else {
        throw new Error("Invalid analytics data structure received");
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.skeletonHero}>
            <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonSubtitle}`} />
          </div>

          <div className={styles.statsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`${styles.statCard} ${styles.skeletonCard}`}>
                <div className={`${styles.skeletonLine} ${styles.skeletonLabel}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonValue}`} />
              </div>
            ))}
          </div>

          <div className={styles.skeletonChartsGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={styles.skeletonChartCard} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <section className={styles.hero}>
            <h1 className={styles.heroTitle}>Cricket Intelligence Dashboard</h1>
            <p className={styles.heroSubtitle}>
              Advanced match intelligence, player performance metrics, and tactical analytics.
            </p>
          </section>
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3 className={styles.errorTitle}>Analytics Unavailable</h3>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryBtn} onClick={fetchData}>
              Retry Connection
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroTag}>Match Intelligence Platform</div>
          <h1 className={styles.heroTitle}>Cricket Intelligence Dashboard</h1>
          <p className={styles.heroSubtitle}>
            Explore aggregate tournament trends, match momentum indices, and player statistical profiles.
          </p>
        </section>

        {/* Section 1: KPI Overview Metrics */}
        <section className={styles.analyticsSection}>
          <h2 className={styles.sectionTitle}>Key Performance Indicators</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Matches Analyzed</span>
              <span className={styles.statValue}>
                {data?.totalMatches != null ? data.totalMatches.toLocaleString() : 0}
              </span>
              <span className={styles.statMeta}>Historical & live fixture database</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Avg Run Rate — 1st Innings</span>
              <span className={styles.statValue}>
                {data?.averageRunRateTeamA != null ? data.averageRunRateTeamA.toFixed(2) : "—"}
              </span>
              <span className={styles.statMeta}>Runs per over (Setting target)</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Avg Run Rate — 2nd Innings</span>
              <span className={styles.statValue}>
                {data?.averageRunRateTeamB != null ? data.averageRunRateTeamB.toFixed(2) : "—"}
              </span>
              <span className={styles.statMeta}>Runs per over (Chasing target)</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Avg Pressure Index</span>
              <span className={styles.statValue}>
                {data?.averagePressureIndex != null ? data.averagePressureIndex.toFixed(2) : "—"}
              </span>
              <span className={styles.statMeta}>Scoring gap volatility index</span>
            </div>
          </div>
        </section>

        {/* Section 2: Most Dominant Fixture */}
        {data?.mostDominantMatch && (
          <section className={styles.dominantSection}>
            <h2 className={styles.sectionTitle}>Peak Dominance Fixture</h2>
            <div className={styles.matchCard}>
              <div className={styles.matchTeam}>
                <span className={styles.teamName}>
                  {data.mostDominantMatch.teams?.teamA?.name || "Team A"}
                </span>
                {data.mostDominantMatch.runRateTeamA != null && (
                  <span className={styles.teamStats}>
                    {data.mostDominantMatch.inn1Runs != null ? `${data.mostDominantMatch.inn1Runs} runs • ` : ""}
                    {data.mostDominantMatch.runRateTeamA} RPO
                  </span>
                )}
              </div>

              <div className={styles.matchVsBadge}>
                <span className={styles.matchVs}>VS</span>
                {data.mostDominantMatch.winner && (
                  <span className={styles.winnerBadge}>
                    Winner: {data.mostDominantMatch.winner}
                  </span>
                )}
              </div>

              <div className={styles.matchTeam}>
                <span className={styles.teamName}>
                  {data.mostDominantMatch.teams?.teamB?.name || "Team B"}
                </span>
                {data.mostDominantMatch.runRateTeamB != null && (
                  <span className={styles.teamStats}>
                    {data.mostDominantMatch.inn2Runs != null ? `${data.mostDominantMatch.inn2Runs} runs • ` : ""}
                    {data.mostDominantMatch.runRateTeamB} RPO
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Section 3: Deep Visual Analytics Charts */}
        <section className={styles.chartsSection}>
          <h2 className={styles.sectionTitle}>Deep Visual Analytics</h2>
          <div className={styles.chartsGrid}>
            <TossImpactChart />
            <MatchIntensityChart />
            <TeamWins />
            <RunRateChart />
            <TopRunScorer />
            <HighestWicketTaker />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
