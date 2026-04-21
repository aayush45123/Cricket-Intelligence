import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./MatchResult.module.css";
import WormChart from "../../components/charts/WormChart/WormChart";
import MomentumChart from "../../components/charts/MomentumChart/MomentumChart";
// import MatchStoryCard from "../../components/charts/MatchStoryCard/MatchStoryCard";

const SectionHeader = ({ label, accent }) => (
  <div className={styles.sectionHeader}>
    <span className={styles.sectionAccent} style={{ background: accent }} />
    <h2 className={styles.sectionTitle}>{label}</h2>
  </div>
);

const MatchResult = () => {
  const { matchId } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeInnings, setActiveInnings] = useState("both");

  useEffect(() => {
    (async () => {
      const { ok, data: d } = await authFetch(`/api/live/${matchId}/analytics`);
      if (ok) setData(d.data);
      else setError(d.message || "Failed to load");
      setLoading(false);
    })();
  }, [matchId, authFetch]);

  if (loading)
    return (
      <div className={styles.stateWrapper}>
        <div className={styles.loadingRing} />
        <p className={styles.stateText}>Generating analytics...</p>
      </div>
    );

  if (error)
    return (
      <div className={styles.stateWrapper}>
        <p className={styles.errorText}>{error}</p>
        <button
          className={styles.backBtn}
          onClick={() => navigate("/my-matches")}
        >
          ← My Matches
        </button>
      </div>
    );

  if (!data) return null;

  const {
    match,
    teams,
    summary,
    worm,
    momentum,
    battingStats,
    bowlingStats,
    winner,
    outcome,
  } = data;

  /* Build a MatchStoryCard-compatible data object */
  const storyData = {
    teams,
    summary,
    winner,
    target: summary.inn1.runs + 1,
    keyMoments: [],
    momentum,
    winProbability: [],
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Back */}
        <button
          className={styles.backBtn}
          onClick={() => navigate("/my-matches")}
        >
          ← My Matches
        </button>

        {/* Hero result */}
        <section className={styles.hero}>
          <div className={styles.heroTeams}>
            <div className={styles.heroTeam}>
              <span
                className={styles.inningsPip}
                style={{ background: "var(--ci-brand)" }}
              />
              <span className={styles.heroLabel}>Innings 1</span>
              <h2 className={styles.heroTeamName}>{teams.innings1}</h2>
              <span
                className={styles.heroScore}
                style={{ color: "var(--ci-brand)" }}
              >
                {summary.inn1.runs}/{summary.inn1.wickets}
              </span>
              <span className={styles.heroOvers}>
                ({summary.inn1.overs} ov)
              </span>
            </div>

            <div className={styles.heroMid}>
              <span className={styles.heroVs}>vs</span>
              <div className={styles.targetBlock}>
                <span className={styles.targetLabel}>Target</span>
                <span className={styles.targetVal}>
                  {summary.inn1.runs + 1}
                </span>
              </div>
            </div>

            <div className={`${styles.heroTeam} ${styles.right}`}>
              <span
                className={styles.inningsPip}
                style={{ background: "var(--ci-accent)" }}
              />
              <span className={styles.heroLabel}>Innings 2</span>
              <h2 className={styles.heroTeamName}>{teams.innings2}</h2>
              <span
                className={styles.heroScore}
                style={{ color: "var(--ci-accent)" }}
              >
                {summary.inn2.runs}/{summary.inn2.wickets}
              </span>
              <span className={styles.heroOvers}>
                ({summary.inn2.overs} ov)
              </span>
            </div>
          </div>

          <div className={styles.winnerStrip}>
            <span className={styles.winnerLabel}>Result</span>
            <span className={styles.winnerVal}>
              {winner} {outcome}
            </span>
          </div>
        </section>

        {/* AI Match Story */}
        <section className={styles.section}>
          <SectionHeader label="Match Story" accent="var(--ci-accent)" />
          <MatchStoryCard data={storyData} />
        </section>

        {/* Worm */}
        <section className={styles.section}>
          <SectionHeader
            label="Worm Graph — Runs vs Overs"
            accent="var(--ci-brand)"
          />
          <WormChart
            innings1={worm.innings1}
            innings2={worm.innings2}
            team1={teams.innings1}
            team2={teams.innings2}
            target={summary.inn1.runs + 1}
          />
        </section>

        {/* Momentum */}
        <section className={styles.section}>
          <SectionHeader label="Momentum Shifts" accent="var(--ci-accent)" />
          <div className={styles.inningsToggle}>
            {[
              ["both", "Both"],
              ["1", "Innings 1"],
              ["2", "Innings 2"],
            ].map(([v, l]) => (
              <button
                key={v}
                className={`${styles.toggleBtn} ${activeInnings === v ? styles.toggleActive : ""}`}
                onClick={() => setActiveInnings(v)}
              >
                {l}
              </button>
            ))}
          </div>
          <MomentumChart
            innings1={momentum.innings1}
            innings2={momentum.innings2}
            team1={teams.innings1}
            team2={teams.innings2}
            activeInnings={activeInnings}
          />
        </section>

        {/* Batting scorecard */}
        <section className={styles.section}>
          <SectionHeader label="Batting Scorecard" accent="var(--ci-brand)" />
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Batter</th>
                  <th className={styles.th}>R</th>
                  <th className={styles.th}>B</th>
                  <th className={styles.th}>4s</th>
                  <th className={styles.th}>6s</th>
                  <th className={styles.th}>SR</th>
                </tr>
              </thead>
              <tbody>
                {battingStats.map((b) => (
                  <tr key={b.playerName} className={styles.tr}>
                    <td className={styles.td}>{b.playerName}</td>
                    <td className={`${styles.td} ${styles.runs}`}>{b.runs}</td>
                    <td className={styles.td}>{b.balls}</td>
                    <td className={styles.td}>{b.fours}</td>
                    <td className={styles.td}>{b.sixes}</td>
                    <td
                      className={`${styles.td} ${b.strikeRate > 150 ? styles.highlight : ""}`}
                    >
                      {b.strikeRate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bowling scorecard */}
        <section className={styles.section}>
          <SectionHeader label="Bowling Scorecard" accent="var(--ci-danger)" />
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Bowler</th>
                  <th className={styles.th}>O</th>
                  <th className={styles.th}>R</th>
                  <th className={styles.th}>W</th>
                  <th className={styles.th}>Eco</th>
                </tr>
              </thead>
              <tbody>
                {bowlingStats.map((b) => (
                  <tr key={b.playerName} className={styles.tr}>
                    <td className={styles.td}>{b.playerName}</td>
                    <td className={styles.td}>{b.overs}</td>
                    <td className={styles.td}>{b.runs}</td>
                    <td
                      className={`${styles.td} ${b.wickets > 0 ? styles.wickets : ""}`}
                    >
                      {b.wickets}
                    </td>
                    <td
                      className={`${styles.td} ${b.economy < 7 ? styles.highlight : ""}`}
                    >
                      {b.economy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Share */}
        {match?.shareToken && (
          <div className={styles.shareRow}>
            <span className={styles.shareLabel}>Share this match</span>
            <button
              className={styles.shareBtn}
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/match/${match.shareToken}`,
                );
                alert("Link copied!");
              }}
            >
              Copy Share Link
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MatchResult;
