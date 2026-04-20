import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./MatchResult.module.css";

const MatchResult = () => {
  const { matchId } = useParams();
  const { authFetch } = useAuth();

  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { ok, data } = await authFetch(`/api/live/${matchId}/analytics`);
      if (ok) setData(data.data);
    };
    fetchAnalytics();
  }, [matchId]);

  if (!data) return <div>Loading result...</div>;

  return (
    <div className={styles.page}>
      <h1>🏆 Match Result</h1>

      {/* Winner */}
      <div className={styles.winner}>
        <h2>{data.winner}</h2>
        <p>{data.outcome}</p>
      </div>

      {/* Score Summary */}
      <div className={styles.summary}>
        <div>
          <h3>{data.teams.innings1}</h3>
          <p>
            {data.summary.inn1.runs}/{data.summary.inn1.wickets}
          </p>
        </div>
        <div>
          <h3>{data.teams.innings2}</h3>
          <p>
            {data.summary.inn2.runs}/{data.summary.inn2.wickets}
          </p>
        </div>
      </div>

      {/* Top Batters */}
      <div className={styles.section}>
        <h3>🔥 Top Batters</h3>
        {data.battingStats.slice(0, 5).map((p) => (
          <div key={p.playerName} className={styles.card}>
            {p.playerName} - {p.runs} ({p.balls}) SR: {p.strikeRate}
          </div>
        ))}
      </div>

      {/* Top Bowlers */}
      <div className={styles.section}>
        <h3>🎯 Top Bowlers</h3>
        {data.bowlingStats.slice(0, 5).map((p) => (
          <div key={p.playerName} className={styles.card}>
            {p.playerName} - {p.wickets} wickets | Eco: {p.economy}
          </div>
        ))}
      </div>

      {/* Worm Chart (simple) */}
      <div className={styles.section}>
        <h3>📈 Worm Chart</h3>
        {data.worm.innings1.map((o, i) => (
          <p key={i}>
            Over {o.over}: {o.cumulative} runs
          </p>
        ))}
      </div>
    </div>
  );
};

export default MatchResult;
