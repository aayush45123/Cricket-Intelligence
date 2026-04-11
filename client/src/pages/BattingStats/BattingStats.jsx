import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./BattingStats.module.css";
import PhaseStrikeRateChart  from "../../components/charts/PhaseStrikeRateChart/PhaseStrikeRateChart";
import BattingBreakdownChart from "../../components/charts/BattingBreakdownChart/BattingBreakdownChart";

/* ── Helpers ─────────────────────────────────────────────────── */
const fmt = (v, d = 2) =>
  typeof v === "number" ? v.toFixed(d) : "—";

const SectionHeader = ({ label, accent = "var(--ci-brand)" }) => (
  <div className={styles.sectionHeader}>
    <span className={styles.sectionAccent} style={{ background: accent }} />
    <h2 className={styles.sectionTitle}>{label}</h2>
  </div>
);

/* ── Component ───────────────────────────────────────────────── */
const BattingStats = () => {
  const { playerName } = useParams();
  const navigate = useNavigate();

  /* We fetch two endpoints and merge:
     1. /batting-analytics/:name  → basic stats (avg, score, innings)
     2. /player/:name             → detailed stats (phases, dotBall%, boundary%) */
  const [basic,    setBasic]   = useState(null);
  const [detailed, setDetailed]= useState(null);
  const [error,    setError]   = useState(null);
  const [loading,  setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, dRes] = await Promise.all([
          fetch(`/api/players/batting-analytics/${playerName}`),
          fetch(`/api/players/player/${playerName}`),
        ]);

        const [bData, dData] = await Promise.all([
          bRes.json(), dRes.json(),
        ]);

        if (bData.data)  setBasic(bData.data);
        if (dData.batting && typeof dData.batting !== "string")
          setDetailed(dData.batting);
        if (dData.impactScore) {
          setDetailed((prev) => prev ? { ...prev, impactScore: dData.impactScore } : prev);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load batting stats.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [playerName]);

  /* ── States ──────────────────────────────────────────────────── */
  if (loading) return (
    <div className={styles.stateWrapper}>
      <div className={styles.loadingRing} />
      <p className={styles.stateText}>Loading batting stats...</p>
    </div>
  );

  if (error || (!basic && !detailed)) return (
    <div className={styles.stateWrapper}>
      <p className={styles.errorText}>{error || "No batting data found."}</p>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
    </div>
  );

  /* Merge data — prefer detailed where available */
  const totalRuns    = detailed?.totalRuns    ?? basic?.totalRuns    ?? 0;
  const totalBalls   = detailed?.totalBalls   ?? basic?.totalBalls   ?? 0;
  const strikeRate   = detailed?.strikeRate   ?? basic?.strikeRate   ?? 0;
  const battingAvg   = basic?.battingAverage  ?? 0;
  const score        = basic?.score           ?? 0;
  const dotBallPct   = detailed?.dotBallPercent   ?? null;
  const boundaryPct  = detailed?.boundaryPercent  ?? null;
  const playerLabel  = basic?.playerName ?? decodeURIComponent(playerName);
  const category     = basic?.category ?? "Batsman";

  /* Phase stats — sorted powerplay → middle → death */
  const phaseOrder = ["Powerplay", "Middle", "Death"];
  const phases = detailed?.phaseStats
    ? [...detailed.phaseStats].sort(
        (a, b) => phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase)
      )
    : [];

  /* Batting quality verdict */
  const verdict =
    strikeRate > 150 ? { label: "Elite Striker",  color: "var(--ci-brand)"  } :
    strikeRate > 130 ? { label: "Strong Striker",  color: "var(--ci-brand)"  } :
    strikeRate > 110 ? { label: "Solid Batter",    color: "var(--ci-blue)"   } :
                       { label: "Anchor",           color: "var(--ci-accent)" };

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
              {playerLabel.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
            </div>
            <div className={styles.heroText}>
              <div className={styles.heroBadgeRow}>
                <span className={styles.categoryBadge}>🏏 {category}</span>
                <span
                  className={styles.verdictBadge}
                  style={{ color: verdict.color, borderColor: verdict.color + "44", background: verdict.color + "10" }}
                >
                  {verdict.label}
                </span>
              </div>
              <h1 className={styles.heroTitle}>{playerLabel}</h1>
            </div>
          </div>
        </section>

        {/* ── KEY STATS ─────────────────────────────────────────── */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statTile} ${styles.statTileHighlight}`}>
            <span className={styles.statLabel}>Total Runs</span>
            <span className={styles.statValue} style={{ color: "var(--ci-brand)" }}>{totalRuns}</span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statLabel}>Balls Faced</span>
            <span className={styles.statValue}>{totalBalls}</span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statLabel}>Strike Rate</span>
            <span
              className={styles.statValue}
              style={{ color: strikeRate > 130 ? "var(--ci-brand)" : strikeRate < 100 ? "var(--ci-danger)" : "var(--ci-accent)" }}
            >
              {fmt(strikeRate)}
            </span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statLabel}>Average</span>
            <span className={styles.statValue}>{fmt(battingAvg)}</span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statLabel}>Best Score</span>
            <span className={styles.statValue} style={{ color: "var(--ci-accent)" }}>{score}</span>
          </div>
          {dotBallPct !== null && (
            <div className={styles.statTile}>
              <span className={styles.statLabel}>Dot Ball %</span>
              <span className={styles.statValue}>{fmt(dotBallPct)}%</span>
            </div>
          )}
          {boundaryPct !== null && (
            <div className={styles.statTile}>
              <span className={styles.statLabel}>Boundary %</span>
              <span className={styles.statValue} style={{ color: "var(--ci-brand)" }}>{fmt(boundaryPct)}%</span>
            </div>
          )}
        </div>

        {/* ── CHARTS ROW ────────────────────────────────────────── */}
        {(phases.length > 0 || (dotBallPct !== null && boundaryPct !== null)) && (
          <div className={styles.chartsRow}>

            {/* Phase Strike Rate */}
            {phases.length > 0 && (
              <section className={styles.section}>
                <SectionHeader label="Phase Strike Rate" accent="var(--ci-brand)" />
                <PhaseStrikeRateChart phases={phases} />
              </section>
            )}

            {/* Batting Breakdown donuts */}
            {dotBallPct !== null && boundaryPct !== null && (
              <section className={styles.section}>
                <SectionHeader label="Batting Breakdown" accent="var(--ci-blue)" />
                <BattingBreakdownChart
                  dotBallPercent={dotBallPct}
                  boundaryPercent={boundaryPct}
                  totalRuns={totalRuns}
                  totalBalls={totalBalls}
                />
              </section>
            )}
          </div>
        )}

        {/* ── PHASE TILES ───────────────────────────────────────── */}
        {phases.length > 0 && (
          <section className={styles.section}>
            <SectionHeader label="Phase Summary" accent="var(--ci-accent)" />
            <div className={styles.phaseTiles}>
              {phases.map((p) => {
                const phaseColor =
                  p.phase === "Powerplay" ? "var(--ci-brand)"  :
                  p.phase === "Middle"    ? "var(--ci-blue)"   :
                                           "var(--ci-accent)";
                return (
                  <div
                    key={p.phase}
                    className={styles.phaseTile}
                    style={{ borderColor: phaseColor + "33" }}
                  >
                    <span className={styles.phaseDot} style={{ background: phaseColor }} />
                    <span className={styles.phaseLabel}>{p.phase}</span>
                    <span className={styles.phaseValue} style={{ color: phaseColor }}>
                      {fmt(p.strikeRate)}
                    </span>
                    <span className={styles.phaseUnit}>SR</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* No detailed data fallback */}
        {phases.length === 0 && dotBallPct === null && (
          <div className={styles.noDetailBanner}>
            <span>📊</span>
            <span>Full phase and breakdown analytics not available for this player.</span>
          </div>
        )}

      </main>
    </div>
  );
};

export default BattingStats;