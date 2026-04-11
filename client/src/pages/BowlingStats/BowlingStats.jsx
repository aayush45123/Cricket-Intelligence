import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./BowlingStats.module.css";
import BowlingMetricsChart from "../../components/charts/BowlingMetricsChart/BowlingMetricsChart";

/* ── Helpers ─────────────────────────────────────────────────── */
const fmt = (v, d = 2) => (typeof v === "number" ? v.toFixed(d) : "—");

const bowlingVerdict = (economy, wickets, sr) => {
  if (wickets === 0)
    return { label: "No Wickets Yet", color: "var(--ci-text-muted)" };
  if (economy < 7 && wickets >= 100)
    return { label: "Elite Bowler", color: "var(--ci-brand)" };
  if (economy < 8 && wickets >= 50)
    return { label: "Excellent", color: "var(--ci-brand)" };
  if (economy < 9 && wickets >= 20)
    return { label: "Good Bowler", color: "var(--ci-blue)" };
  if (economy > 10) return { label: "Expensive", color: "var(--ci-danger)" };
  return { label: "Solid Contributor", color: "var(--ci-accent)" };
};

const SectionHeader = ({ label, accent = "var(--ci-danger)" }) => (
  <div className={styles.sectionHeader}>
    <span className={styles.sectionAccent} style={{ background: accent }} />
    <h2 className={styles.sectionTitle}>{label}</h2>
  </div>
);

/* ── Component ───────────────────────────────────────────────── */
const BowlingStats = () => {
  const { playerName } = useParams();
  const navigate = useNavigate();
  const [bowler, setBowler] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use the updated endpoint that now returns dotBallPercent
        const res = await fetch(`/api/players/bowler-stats/${playerName}`);
        if (!res.ok)
          throw new Error(`Request failed with status ${res.status}`);
        const result = await res.json();
        setBowler(result?.data ?? null);
      } catch (err) {
        console.error(err);
        setError("Unable to load player stats");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [playerName]);

  /* ── States ──────────────────────────────────────────────────── */
  if (loading)
    return (
      <div className={styles.stateWrapper}>
        <div className={styles.loadingRing} />
        <p className={styles.stateText}>Loading bowling stats...</p>
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

  if (!bowler)
    return (
      <div className={styles.stateWrapper}>
        <p className={styles.stateText}>Bowler not found.</p>
      </div>
    );

  const playerLabel = bowler.playerName ?? decodeURIComponent(playerName);
  const vd = bowlingVerdict(
    bowler.bowlingEconomyRate,
    bowler.totalWickets,
    bowler.bowlingStrikeRate,
  );

  /* BowlingMetricsChart needs: { totalWickets, economy, strikeRate, dotBallPercent } */
  const chartBowling = {
    totalWickets: bowler.totalWickets,
    economy: bowler.bowlingEconomyRate,
    strikeRate: bowler.bowlingStrikeRate,
    dotBallPercent: bowler.dotBallPercent ?? 0,
  };

  /* Economy quality color */
  const econColor =
    bowler.bowlingEconomyRate < 7
      ? "var(--ci-brand)"
      : bowler.bowlingEconomyRate < 9
        ? "var(--ci-accent)"
        : "var(--ci-danger)";

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* ── BACK ──────────────────────────────────────────────── */}
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.heroAvatar}>
              {playerLabel
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className={styles.heroText}>
              <div className={styles.heroBadgeRow}>
                <span className={styles.categoryBadge}>⚡ Bowling Profile</span>
                <span
                  className={styles.verdictBadge}
                  style={{
                    color: vd.color,
                    borderColor: vd.color + "44",
                    background: vd.color + "10",
                  }}
                >
                  {vd.label}
                </span>
              </div>
              <h1 className={styles.heroTitle}>{playerLabel}</h1>
            </div>
          </div>
        </section>

        {/* ── KEY STATS ─────────────────────────────────────────── */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statTile} ${styles.statTileHighlight}`}>
            <span className={styles.statLabel}>Total Wickets</span>
            <span
              className={styles.statValue}
              style={{ color: "var(--ci-accent)" }}
            >
              {bowler.totalWickets}
            </span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statLabel}>Balls Bowled</span>
            <span className={styles.statValue}>{bowler.totalBallsBowled}</span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statLabel}>Economy</span>
            <span className={styles.statValue} style={{ color: econColor }}>
              {fmt(bowler.bowlingEconomyRate)}
            </span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statLabel}>Strike Rate</span>
            <span className={styles.statValue}>
              {bowler.bowlingStrikeRate > 0
                ? fmt(bowler.bowlingStrikeRate)
                : "—"}
            </span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statLabel}>Average</span>
            <span className={styles.statValue}>
              {fmt(bowler.bowlingAverage)}
            </span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statLabel}>Runs Conceded</span>
            <span className={styles.statValue}>{bowler.totalRunsConceded}</span>
          </div>
          {bowler.dotBallPercent != null && (
            <div className={styles.statTile}>
              <span className={styles.statLabel}>Dot Ball %</span>
              <span
                className={styles.statValue}
                style={{ color: "var(--ci-blue)" }}
              >
                {fmt(bowler.dotBallPercent)}%
              </span>
            </div>
          )}
        </div>

        {/* ── BOWLING METRICS CHART ─────────────────────────────── */}
        <section className={styles.section}>
          <SectionHeader label="Bowling Profile" accent="var(--ci-danger)" />
          <BowlingMetricsChart bowling={chartBowling} />
        </section>

        {/* ── PERFORMANCE CONTEXT TILES ─────────────────────────── */}
        <section className={styles.section}>
          <SectionHeader
            label="Performance Context"
            accent="var(--ci-accent)"
          />
          <div className={styles.contextGrid}>
            <div
              className={styles.contextCard}
              style={{ borderColor: econColor + "44" }}
            >
              <span className={styles.contextIcon}>💨</span>
              <div className={styles.contextBody}>
                <span className={styles.contextLabel}>Economy Rate</span>
                <span
                  className={styles.contextVal}
                  style={{ color: econColor }}
                >
                  {fmt(bowler.bowlingEconomyRate)} runs/over
                </span>
                <span className={styles.contextNote}>
                  {bowler.bowlingEconomyRate < 7
                    ? "Excellent — keeps runs dry."
                    : bowler.bowlingEconomyRate < 9
                      ? "Good — slightly expensive."
                      : "Expensive — needs improvement."}
                </span>
              </div>
            </div>

            <div
              className={styles.contextCard}
              style={{ borderColor: "rgba(61,142,255,0.3)" }}
            >
              <span className={styles.contextIcon}>⚫</span>
              <div className={styles.contextBody}>
                <span className={styles.contextLabel}>Dot Ball Pressure</span>
                <span
                  className={styles.contextVal}
                  style={{ color: "var(--ci-blue)" }}
                >
                  {fmt(bowler.dotBallPercent ?? 0)}% dots
                </span>
                <span className={styles.contextNote}>
                  {(bowler.dotBallPercent ?? 0) > 40
                    ? "Strong — builds pressure well."
                    : (bowler.dotBallPercent ?? 0) > 25
                      ? "Decent dot ball percentage."
                      : "Low dot ball percentage."}
                </span>
              </div>
            </div>

            <div
              className={styles.contextCard}
              style={{ borderColor: "rgba(245,155,0,0.3)" }}
            >
              <span className={styles.contextIcon}>🎯</span>
              <div className={styles.contextBody}>
                <span className={styles.contextLabel}>Strike Rate</span>
                <span
                  className={styles.contextVal}
                  style={{ color: "var(--ci-accent)" }}
                >
                  {bowler.bowlingStrikeRate > 0
                    ? `${fmt(bowler.bowlingStrikeRate)} balls/wkt`
                    : "No wickets"}
                </span>
                <span className={styles.contextNote}>
                  {bowler.bowlingStrikeRate > 0 && bowler.bowlingStrikeRate < 20
                    ? "Lethal — takes wickets fast."
                    : bowler.bowlingStrikeRate < 30
                      ? "Good wicket-taking pace."
                      : "Needs more breakthroughs."}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BowlingStats;
