import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./TeamStrategyDetail.module.css";
import BattingOrderChart from "../../components/charts/BattingOrderChart/BattingOrderChart";
import PhaseCompareChart from "../../components/charts/PhaseCompareChart/PhaseCompareChart";
import BowlingComboChart from "../../components/charts/BowlingComboChart/BowlingComboChart";
import RunRateByOverChart from "../../components/charts/RunRateByOverChart/RunRateByOverChart";

/* ── Helpers ─────────────────────────────────────────────────── */
const SectionHeader = ({ label, accent, tag }) => (
  <div className={styles.sectionHeader}>
    <span className={styles.sectionAccent} style={{ background: accent }} />
    <h2 className={styles.sectionTitle}>{label}</h2>
    {tag && <span className={styles.sectionTag}>{tag}</span>}
  </div>
);

const StatTile = ({ label, value, unit, accent, sub }) => (
  <div className={styles.statTile}>
    <span className={styles.statLabel}>{label}</span>
    <span className={styles.statValue} style={{ color: accent }}>
      {value}
      {unit && <span className={styles.statUnit}>{unit}</span>}
    </span>
    {sub && <span className={styles.statSub}>{sub}</span>}
  </div>
);

/* ── Main ─────────────────────────────────────────────────────── */
const TeamStrategyDetail = () => {
  const { team } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/strategy/${team}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed");
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [team]);

  if (loading)
    return (
      <div className={styles.stateWrapper}>
        <div className={styles.loadingRing} />
        <p className={styles.stateText}>Analysing team strategy...</p>
      </div>
    );

  if (error)
    return (
      <div className={styles.stateWrapper}>
        <p className={styles.errorText}>{error}</p>
        <button
          className={styles.backBtn}
          onClick={() => navigate("/strategy")}
        >
          ← Back
        </button>
      </div>
    );

  if (!data) return null;

  const {
    summary,
    toss,
    battingOrder,
    battingPhases,
    bowlingCombination,
    bowlingPhases,
    runRateByOver,
  } = data;
  const decodedTeam = decodeURIComponent(team);

  /* Best powerplay phase */
  const pp = battingPhases.find((p) => p.phase === "Powerplay");
  const death = battingPhases.find((p) => p.phase === "Death");
  const bestBowler = bowlingCombination[0];

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* TOP NAV */}
        <button
          className={styles.backBtn}
          onClick={() => navigate("/strategy")}
        >
          ← All Teams
        </button>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.heroAvatar}>
              {decodedTeam
                .split(" ")
                .filter((w) => /^[A-Z]/.test(w))
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </div>
            <div className={styles.heroInfo}>
              <span className={styles.heroEyebrow}>Team Strategy Report</span>
              <h1 className={styles.heroTitle}>{decodedTeam}</h1>
            </div>
          </div>

          {/* Quick verdict chips */}
          <div className={styles.verdictChips}>
            {toss.preferBatFirst && (
              <span
                className={styles.chip}
                style={{
                  color: "var(--ci-brand)",
                  borderColor: "var(--ci-border-brand)",
                  background: "var(--ci-brand-subtle)",
                }}
              >
                🏏 Prefers Batting First
              </span>
            )}
            {!toss.preferBatFirst && (
              <span
                className={styles.chip}
                style={{
                  color: "var(--ci-accent)",
                  borderColor: "var(--ci-border-accent)",
                  background: "var(--ci-accent-subtle)",
                }}
              >
                ⚡ Prefers Fielding First
              </span>
            )}
            {pp && pp.runRate > 8 && (
              <span
                className={styles.chip}
                style={{
                  color: "var(--ci-blue)",
                  borderColor: "var(--ci-blue-glow)",
                  background: "var(--ci-blue-glow)",
                }}
              >
                🔥 Strong Powerplay
              </span>
            )}
            {death && death.runRate > 10 && (
              <span
                className={styles.chip}
                style={{
                  color: "var(--ci-danger)",
                  borderColor: "rgba(255,77,109,0.3)",
                  background: "rgba(255,77,109,0.08)",
                }}
              >
                💥 Death Overs Finisher
              </span>
            )}
          </div>
        </section>

        {/* KEY STATS */}
        <div className={styles.statsGrid}>
          <StatTile
            label="Total Matches"
            value={summary.totalMatches}
            accent="var(--ci-text-primary)"
          />
          <StatTile
            label="Wins"
            value={summary.wins}
            accent="var(--ci-brand)"
            sub={`${summary.winRate}% win rate`}
          />
          <StatTile
            label="Losses"
            value={summary.losses}
            accent="var(--ci-danger)"
          />
          <StatTile
            label="Toss Win Rate"
            value={`${toss.winPctAfterToss}%`}
            accent="var(--ci-blue)"
            sub="wins after toss win"
          />
          <StatTile
            label="Bat First"
            value={toss.batFirstCount}
            accent="var(--ci-brand)"
            sub="times chose to bat"
          />
          <StatTile
            label="Field First"
            value={toss.fieldFirstCount}
            accent="var(--ci-accent)"
            sub="times chose to field"
          />
          {bestBowler && (
            <StatTile
              label="Best Bowler"
              value={bestBowler.bowler.split(" ").pop()}
              accent="var(--ci-danger)"
              sub={`${bestBowler.totalWickets} wickets`}
            />
          )}
        </div>

        {/* BATTING ORDER */}
        <section className={styles.section}>
          <SectionHeader
            label="Best Batting Order"
            accent="var(--ci-brand)"
            tag="Runs & SR by position"
          />
          <BattingOrderChart data={battingOrder} />
        </section>

        {/* PHASE ANALYSIS — batting vs bowling side by side */}
        <div className={styles.twoCol}>
          <section className={styles.section}>
            <SectionHeader
              label="Batting — Phase Performance"
              accent="var(--ci-brand)"
            />
            <PhaseCompareChart phases={battingPhases} mode="batting" />
          </section>
          <section className={styles.section}>
            <SectionHeader
              label="Bowling — Phase Performance"
              accent="var(--ci-danger)"
            />
            <PhaseCompareChart phases={bowlingPhases} mode="bowling" />
          </section>
        </div>

        {/* RUN RATE BY OVER */}
        {runRateByOver.length > 0 && (
          <section className={styles.section}>
            <SectionHeader
              label="Run Rate by Over"
              accent="var(--ci-accent)"
              tag="Avg across all matches"
            />
            <RunRateByOverChart data={runRateByOver} />
          </section>
        )}

        {/* BOWLING COMBINATION */}
        {bowlingCombination.length > 0 && (
          <section className={styles.section}>
            <SectionHeader
              label="Best Bowling Combination"
              accent="var(--ci-danger)"
              tag="Top 10 bowlers"
            />
            <BowlingComboChart data={bowlingCombination} />
          </section>
        )}
      </main>
    </div>
  );
};

export default TeamStrategyDetail;
