import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./MatchDeepAnalytics.module.css";
import WormChart from "../../components/charts/WormChart/WormChart";
import WinProbabilityChart from "../../components/charts/WinProbabilityChart/WinProbabilityChart";
import MomentumChart from "../../components/charts/MomentumChart/MomentumChart";
import KeyMomentsTimeline from "../../components/charts/KeyMomentsTimeline/KeyMomentsTimeline";
import MatchStoryCard from "../../components/MatchStoryCard/MatchStoryCard";

const SectionHeader = ({ label, accent = "var(--ci-brand)", tag }) => (
  <div className={styles.sectionHeader}>
    <span className={styles.sectionAccent} style={{ background: accent }} />
    <h2 className={styles.sectionTitle}>{label}</h2>
    {tag && <span className={styles.sectionTag}>{tag}</span>}
  </div>
);

const SummaryTile = ({ label, value, sub, accent }) => (
  <div className={styles.summaryTile}>
    <span className={styles.summaryLabel}>{label}</span>
    <span className={styles.summaryValue} style={{ color: accent }}>
      {value}
    </span>
    {sub && <span className={styles.summarySub}>{sub}</span>}
  </div>
);

const MatchDeepAnalytics = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeInnings, setActiveInnings] = useState("both");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}/deep-analytics`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed");
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [matchId]);

  if (loading)
    return (
      <div className={styles.stateWrapper}>
        <div className={styles.loadingRing} />
        <p className={styles.stateText}>Crunching match data...</p>
      </div>
    );

  if (error)
    return (
      <div className={styles.stateWrapper}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
    );

  if (!data) return null;

  const {
    teams,
    summary,
    worm,
    winProbability,
    momentum,
    keyMoments,
    winner,
    target,
    venue,
    matchType,
  } = data;
  const finalProb = winProbability[winProbability.length - 1]?.prob ?? 50;
  const bigOvers = [
    ...(momentum.innings1 || []),
    ...(momentum.innings2 || []),
  ].filter((o) => o.isBigOver).length;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* TOP NAV */}
        <div className={styles.topNav}>
          <button
            className={styles.backBtn}
            onClick={() => navigate(`/matches/${matchId}`)}
          >
            ← Match Summary
          </button>
          <div className={styles.topNavRight}>
            {matchType && <span className={styles.badge}>{matchType}</span>}
            {venue && <span className={styles.venueBadge}>📍 {venue}</span>}
          </div>
        </div>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroTeams}>
            <div className={styles.heroTeamBlock}>
              <span
                className={styles.inningsPip}
                style={{ background: "var(--ci-brand)" }}
              />
              <span className={styles.heroTeamLabel}>Innings 1</span>
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

            <div className={styles.heroVsBlock}>
              <span className={styles.heroVs}>vs</span>
              {target > 0 && (
                <div className={styles.heroTargetBlock}>
                  <span className={styles.heroTargetLabel}>Target</span>
                  <span className={styles.heroTargetValue}>{target}</span>
                </div>
              )}
            </div>

            <div className={`${styles.heroTeamBlock} ${styles.right}`}>
              <span
                className={styles.inningsPip}
                style={{ background: "var(--ci-accent)" }}
              />
              <span className={styles.heroTeamLabel}>Innings 2</span>
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
            <span className={styles.winnerLabel}>🏆 Result</span>
            <span className={styles.winnerValue}>{winner}</span>
          </div>
        </section>

        {/* QUICK STATS */}
        <div className={styles.quickStats}>
          <SummaryTile
            label="Key Moments"
            value={keyMoments.length}
            sub="detected"
            accent="var(--ci-accent)"
          />
          <SummaryTile
            label="Big Overs"
            value={bigOvers}
            sub="15+ runs"
            accent="var(--ci-blue)"
          />
          <SummaryTile
            label="Total Wickets"
            value={summary.inn1.wickets + summary.inn2.wickets}
            sub={`${summary.inn1.wickets} + ${summary.inn2.wickets}`}
            accent="var(--ci-danger)"
          />
          <SummaryTile
            label="Final Win Prob"
            value={`${finalProb.toFixed(0)}%`}
            sub={teams.innings2}
            accent="var(--ci-brand)"
          />
        </div>

        {/* ── MATCH STORY ──────────────────────────────────────── */}
        <section className={styles.section}>
          <SectionHeader
            label="Match Story"
            accent="var(--ci-accent)"
            tag="Powered by Claude AI"
          />
          <MatchStoryCard data={data} />
        </section>

        {/* WORM GRAPH */}
        <section className={styles.section}>
          <SectionHeader
            label="Worm Graph — Runs vs Overs"
            accent="var(--ci-brand)"
            tag="Both Innings"
          />
          <WormChart
            innings1={worm.innings1}
            innings2={worm.innings2}
            team1={teams.innings1}
            team2={teams.innings2}
            target={target}
          />
        </section>

        {/* WIN PROBABILITY */}
        {winProbability.length > 0 && (
          <section className={styles.section}>
            <SectionHeader
              label="Win Probability — Ball by Ball"
              accent="var(--ci-blue)"
              tag="Innings 2"
            />
            <WinProbabilityChart
              data={winProbability}
              team={teams.innings2}
              target={target}
            />
          </section>
        )}

        {/* MOMENTUM */}
        <section className={styles.section}>
          <SectionHeader
            label="Momentum Shifts — Run Rate per Over"
            accent="var(--ci-accent)"
            tag="Per Over"
          />
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

        {/* KEY MOMENTS */}
        <section className={styles.section}>
          <SectionHeader
            label="Key Moments"
            accent="var(--ci-danger)"
            tag={`${keyMoments.length} events`}
          />
          <KeyMomentsTimeline
            moments={keyMoments}
            team1={teams.innings1}
            team2={teams.innings2}
          />
        </section>
      </main>
    </div>
  );
};

export default MatchDeepAnalytics;
