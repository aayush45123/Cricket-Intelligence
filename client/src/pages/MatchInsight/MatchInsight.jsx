import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./MatchInsight.module.css";

const MatchInsight = () => {
  const { id } = useParams();
  const [insight, setInsight] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      const res = await fetch(`/api/matches/${id}/insights`);
      const data = await res.json();
      setInsight(data);
    };

    fetchInsights();
  }, [id]);

  if (!insight) {
    return (
      <div className={styles.loadingWrapper}>
        <p className={styles.loadingText}>Loading match insights...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            {insight.teams.teamA} vs {insight.teams.teamB}
          </h1>
          <p className={styles.heroSubtitle}>{insight.venue}</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Scorecard</h2>
          <div className={styles.scorecard}>
            <div className={styles.scoreRow}>
              <span className={styles.teamName}>{insight.teams.teamA}</span>
              <span className={styles.scoreValue}>
                {insight.innings.statsByTeamA.runs}/
                {insight.innings.statsByTeamA.wickets}
              </span>
              <span className={styles.overs}>
                {insight.innings.statsByTeamA.overs} overs
              </span>
            </div>

            <div className={styles.scoreDivider} />

            <div className={styles.scoreRow}>
              <span className={styles.teamName}>{insight.teams.teamB}</span>
              <span className={styles.scoreValue}>
                {insight.innings.statsByTeamB.runs}/
                {insight.innings.statsByTeamB.wickets}
              </span>
              <span className={styles.overs}>
                {insight.innings.statsByTeamB.overs} overs
              </span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Match Analytics</h2>
          <div className={styles.analyticsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Run Rate — Team A</span>
              <span className={styles.statValue}>
                {insight.analysis.runRateForTeamA}
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Run Rate — Team B</span>
              <span className={styles.statValue}>
                {insight.analysis.runRateForTeamB}
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Match Intensity</span>
              <span className={styles.statValue}>
                {insight.analysis.matchIntensity}
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Winner Strength</span>
              <span className={styles.statValue}>
                {insight.analysis.winnerStrength}
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Win Quality</span>
              <span className={styles.statValue}>
                {insight.analysis.winQuality}
              </span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Insight</h2>
          <div className={styles.insightBox}>
            <p className={styles.insightText}>{insight.analysis.insights}</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Scoreboard</h2>

          {/* FIRST INNINGS */}
          <div className={styles.inningsBlock}>
            <h3 className={styles.inningsTitle}>First Innings</h3>

            {/* Batting */}
            <h4 className={styles.subTitle}>Batting</h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Runs</th>
                  <th>Balls</th>
                  <th>SR</th>
                </tr>
              </thead>
              <tbody>
                {insight.innings.statsByTeamA.runByTeamAPlayers.map((p, i) => (
                  <tr key={i}>
                    <td>{p.playerName}</td>
                    <td>{p.runs}</td>
                    <td>{p.balls}</td>
                    <td>{((p.runs / p.balls) * 100).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Extras + Total */}
            <div className={styles.extraRow}>
              Extras: {insight.innings.statsByTeamA.extras}
            </div>
            <div className={styles.totalRow}>
              Total: {insight.innings.statsByTeamA.runs}/
              {insight.innings.statsByTeamA.wickets} (
              {insight.innings.statsByTeamA.overs} overs)
            </div>

            {/* Bowling */}
            <h4 className={styles.subTitle}>Bowling</h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Bowler</th>
                  <th>Wickets</th>
                  <th>Runs</th>
                  <th>Overs</th>
                  <th>Economy</th>
                </tr>
              </thead>
              <tbody>
                {insight.innings.statsByTeamB.wicketsByTeamBPlayers.map(
                  (p, i) => (
                    <tr key={i}>
                      <td>{p.playerName}</td>
                      <td>{p.wickets}</td>
                      <td>{p.runsConceded}</td>
                      <td>{(p.ballsBowled / 6).toFixed(1)}</td>
                      <td>
                        {(p.runsConceded / (p.ballsBowled / 6)).toFixed(2)}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {/* SECOND INNINGS */}
          <div className={styles.inningsBlock}>
            <h3 className={styles.inningsTitle}>Second Innings</h3>

            {/* Batting */}
            <h4 className={styles.subTitle}>Batting</h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Runs</th>
                  <th>Balls</th>
                  <th>SR</th>
                </tr>
              </thead>
              <tbody>
                {insight.innings.statsByTeamB.runByTeamBPlayers.map((p, i) => (
                  <tr key={i}>
                    <td>{p.playerName}</td>
                    <td>{p.runs}</td>
                    <td>{p.balls}</td>
                    <td>{((p.runs / p.balls) * 100).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Extras + Total */}
            <div className={styles.extraRow}>
              Extras: {insight.innings.statsByTeamB.extras}
            </div>
            <div className={styles.totalRow}>
              Total: {insight.innings.statsByTeamB.runs}/
              {insight.innings.statsByTeamB.wickets} (
              {insight.innings.statsByTeamB.overs} overs)
            </div>

            {/* Bowling */}
            <h4 className={styles.subTitle}>Bowling</h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Bowler</th>
                  <th>Wickets</th>
                  <th>Runs</th>
                  <th>Overs</th>
                  <th>Economy</th>
                </tr>
              </thead>
              <tbody>
                {insight.innings.statsByTeamA.wicketsByTeamAPlayers.map(
                  (p, i) => (
                    <tr key={i}>
                      <td>{p.playerName}</td>
                      <td>{p.wickets}</td>
                      <td>{p.runsConceded}</td>
                      <td>{(p.ballsBowled / 6).toFixed(1)}</td>
                      <td>
                        {(p.runsConceded / (p.ballsBowled / 6)).toFixed(2)}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MatchInsight;
