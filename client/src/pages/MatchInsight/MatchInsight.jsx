import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./MatchInsight.module.css";

const MatchInsight = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!matchId) {
      setError("No match ID provided.");
      return;
    }

    const fetchInsights = async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}`);
        const result = await res.json();

        console.log("API response:", result); // ← helps debug in browser console

        if (res.ok && result.data) {
          setInsight(result.data);
        } else {
          setError(result.message || "Match data not available.");
        }
      } catch (err) {
        console.error("Error fetching match insights:", err);
        setError("Something went wrong. Please try again.");
      }
    };

    fetchInsights();
  }, [matchId]);

  if (error) {
    return (
      <div className={styles.loadingWrapper}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.backBtn} onClick={() => navigate("/matches")}>
          ← Back to Matches
        </button>
      </div>
    );
  }

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
              <span>Run Rate — {teams.teamA.name}</span>
              <span>{analytics.runRateForTeamA}</span>
            </div>
            <div className={styles.statCard}>
              <span>Run Rate — {teams.teamB.name}</span>
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
            <div className={styles.statCard}>
              <span>Run Difference</span>
              <span>{analytics.runDifference}</span>
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

        {/* DETAILED SCOREBOARD */}
        {innings.statsByTeamA.batters && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Detailed Scorecard</h2>

            {/* Team A INNINGS */}
            <div className={styles.inningsBlock}>
              <h3 className={styles.inningsHeading}>
                {teams.teamA.name} Innings
              </h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Batter</th>
                    <th>Runs</th>
                    <th>Balls</th>
                    <th>SR</th>
                    <th>Dismissal</th>
                  </tr>
                </thead>
                <tbody>
                  {innings.statsByTeamA.batters.map((p, i) => (
                    <tr key={i}>
                      <td>{p.playerName}</td>
                      <td>{p.runs}</td>
                      <td>{p.balls}</td>
                      <td>
                        {p.balls > 0
                          ? ((p.runs / p.balls) * 100).toFixed(1)
                          : "0.0"}
                      </td>
                      <td>
                        {p.dismissal && p.dismissal !== "null"
                          ? `${p.dismissal} b ${p.dismissedBy}`
                          : "Not Out"}
                      </td>
                    </tr>
                  ))}
                  <tr className={styles.totalRow}>
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td>
                      <strong>{innings.statsByTeamA.runs}</strong>
                    </td>
                    <td>
                      <strong>—</strong>
                    </td>
                    <td>
                      <strong>—</strong>
                    </td>
                    <td>
                      <strong>Extras: {innings.statsByTeamA.extras}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <h4 className={styles.subHeading}>Bowling</h4>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Bowler</th>
                    <th>Overs</th>
                    <th>Runs</th>
                    <th>Wickets</th>
                  </tr>
                </thead>
                <tbody>
                  {innings.statsByTeamA.bowlers &&
                    innings.statsByTeamA.bowlers.map((p, i) => (
                      <tr key={i}>
                        <td>{p.playerName}</td>
                        <td>{p.overs}</td>
                        <td>{p.runs}</td>
                        <td>{p.wickets}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Team B INNINGS */}
            <div className={styles.inningsBlock}>
              <h3 className={styles.inningsHeading}>
                {teams.teamB.name} Innings
              </h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Batter</th>
                    <th>Runs</th>
                    <th>Balls</th>
                    <th>SR</th>
                    <th>Dismissal</th>
                  </tr>
                </thead>
                <tbody>
                  {innings.statsByTeamB.batters.map((p, i) => (
                    <tr key={i}>
                      <td>{p.playerName}</td>
                      <td>{p.runs}</td>
                      <td>{p.balls}</td>
                      <td>
                        {p.balls > 0
                          ? ((p.runs / p.balls) * 100).toFixed(1)
                          : "0.0"}
                      </td>
                      <td>
                        {p.dismissal && p.dismissal !== "null"
                          ? `${p.dismissal} b ${p.dismissedBy}`
                          : "Not Out"}
                      </td>
                    </tr>
                  ))}
                  <tr className={styles.totalRow}>
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td>
                      <strong>{innings.statsByTeamB.runs}</strong>
                    </td>
                    <td>
                      <strong>—</strong>
                    </td>
                    <td>
                      <strong>—</strong>
                    </td>
                    <td>
                      <strong>Extras: {innings.statsByTeamB.extras}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <h4 className={styles.subHeading}>Bowling</h4>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Bowler</th>
                    <th>Overs</th>
                    <th>Runs</th>
                    <th>Wickets</th>
                  </tr>
                </thead>
                <tbody>
                  {innings.statsByTeamB.bowlers &&
                    innings.statsByTeamB.bowlers.map((p, i) => (
                      <tr key={i}>
                        <td>{p.playerName}</td>
                        <td>{p.overs}</td>
                        <td>{p.runs}</td>
                        <td>{p.wickets}</td>
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
