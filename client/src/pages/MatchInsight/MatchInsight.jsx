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

  if (!insight)
    return <h2 className={styles.loading}>Loading match insights...</h2>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {insight.teams.teamA} vs {insight.teams.teamB}
      </h2>

      <p className={styles.venue}>Venue: {insight.venue}</p>

      {/* SCORECARD */}
      <div className={styles.scorecard}>
        <h3>Scorecard</h3>

        <div className={styles.teamScore}>
          <span className={styles.team}>{insight.teams.teamA}</span>
          <span>
            {insight.innings.statsByTeamA.runs}/
            {insight.innings.statsByTeamA.wickets} (
            {insight.innings.statsByTeamA.overs} overs)
          </span>
        </div>

        <div className={styles.teamScore}>
          <span className={styles.team}>{insight.teams.teamB}</span>
          <span>
            {insight.innings.statsByTeamB.runs}/
            {insight.innings.statsByTeamB.wickets} (
            {insight.innings.statsByTeamB.overs} overs)
          </span>
        </div>
      </div>

      {/* ANALYTICS */}
      <div className={styles.analytics}>
        <h3>Match Analytics</h3>

        <p>Run Rate Team A: {insight.analysis.runRateForTeamA}</p>
        <p>Run Rate Team B: {insight.analysis.runRateForTeamB}</p>

        <p>Match Intensity: {insight.analysis.matchIntensity}</p>
        <p>Winner Strength: {insight.analysis.winnerStrength}</p>
        <p>Win Quality: {insight.analysis.winQuality}</p>
      </div>

      <div className={styles.insightBox}>
        <h3>Insight</h3>
        <p>{insight.analysis.insights}</p>
      </div>
    </div>
  );
};

export default MatchInsight;
