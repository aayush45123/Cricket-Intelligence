import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./MatchInsight.module.css";

const MatchInsight = () => {
  const { matchId } = useParams();
  const [insight, setInsight] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}`);
        const result = await res.json();

        if (res.ok) {
          setInsight(result.data);
        }
      } catch (error) {
        console.error("Error fetching match insights:", error);
      }
    };

    fetchInsights();
  }, [matchId]);

  if (!insight) {
    return (
      <div className={styles.loadingWrapper}>
        <p className={styles.loadingText}>Loading match insights...</p>
      </div>
    );
  }

  const { teams, innings, analytics, result } = insight;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            {teams.teamA.name} vs {teams.teamB.name}
          </h1>
          <p className={styles.heroSubtitle}>Winner: {result.winner}</p>
        </section>

        {/* SCORECARD */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Scorecard</h2>

          <div className={styles.scorecard}>
            <div className={styles.scoreRow}>
              <span>{teams.teamA.name}</span>
              <span>
                {innings.statsByTeamA.runs}/{innings.statsByTeamA.wickets}
              </span>
              <span>{innings.statsByTeamA.overs} overs</span>
            </div>

            <div className={styles.scoreDivider} />

            <div className={styles.scoreRow}>
              <span>{teams.teamB.name}</span>
              <span>
                {innings.statsByTeamB.runs}/{innings.statsByTeamB.wickets}
              </span>
              <span>{innings.statsByTeamB.overs} overs</span>
            </div>
          </div>
        </section>

        {/* ANALYTICS */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Match Analytics</h2>

          <div className={styles.analyticsGrid}>
            <div className={styles.statCard}>
              <span>Run Rate — Team A</span>
              <span>{analytics.runRateForTeamA}</span>
            </div>

            <div className={styles.statCard}>
              <span>Run Rate — Team B</span>
              <span>{analytics.runRateForTeamB}</span>
            </div>

            <div className={styles.statCard}>
              <span>Match Intensity</span>
              <span>{analytics.matchIntensity}</span>
            </div>

            <div className={styles.statCard}>
              <span>Winner Strength</span>
              <span>{analytics.winnerStrength}</span>
            </div>

            <div className={styles.statCard}>
              <span>Win Quality</span>
              <span>{analytics.winQuality}</span>
            </div>
          </div>
        </section>

        {/* INSIGHT TEXT */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Insight</h2>
          <div className={styles.insightBox}>
            <p className={styles.insightText}>{analytics.insights}</p>
          </div>
        </section>

        {/* ⚠️ ADVANCED TABLES (SAFE RENDER) */}
        {/* Only render if backend supports player-level stats */}
        {innings.statsByTeamA.runByTeamAPlayers && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Detailed Scoreboard</h2>

            {/* FIRST INNINGS */}
            <div className={styles.inningsBlock}>
              <h3>First Innings</h3>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Runs</th>
                    <th>Balls</th>
                  </tr>
                </thead>
                <tbody>
                  {innings.statsByTeamA.runByTeamAPlayers.map((p, i) => (
                    <tr key={i}>
                      <td>{p.playerName}</td>
                      <td>{p.runs}</td>
                      <td>{p.balls}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default MatchInsight;
