import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./PlayerDetail.module.css";
import PhaseStrikeRateChart from "../../components/charts/PhaseStrikeRateChart/PhaseStrikeRateChart";
import BattingBreakdownChart from "../../components/charts/BattingBreakdownChart/BattingBreakdownChart";
import BowlingMetricsChart from "../../components/charts/BowlingMetricsChart/BowlingMetricsChart";

/* ── Helpers ──────────────────────────────────────────────── */
const deriveRole = (batting, bowling) => {
  const hasBatting = batting && typeof batting !== "string";
  const hasBowling = bowling && typeof bowling !== "string";
  if (hasBatting && hasBowling) return "All-Rounder";
  if (hasBatting) return "Batsman";
  if (hasBowling) return "Bowler";
  return "Player";
};

const roleColor = (role) => {
  if (role === "All-Rounder") return "var(--ci-accent)";
  if (role === "Batsman") return "var(--ci-brand)";
  if (role === "Bowler") return "var(--ci-danger)";
  return "var(--ci-blue)";
};

const impactTier = (score) => {
  const n = parseFloat(score);
  if (n >= 800) return { label: "Elite", color: "var(--ci-brand)" };
  if (n >= 500) return { label: "Excellent", color: "var(--ci-accent)" };
  if (n >= 250) return { label: "Good", color: "var(--ci-blue)" };
  return { label: "Developing", color: "var(--ci-text-muted)" };
};

const fmt = (v, d = 2) => (typeof v === "number" ? v.toFixed(d) : "—");

/* ── Sub-components ───────────────────────────────────────── */
const StatTile = ({ label, value, highlight, unit }) => (
  <div
    className={`${styles.statTile} ${highlight ? styles.statTileHighlight : ""}`}
  >
    <span className={styles.statTileLabel}>{label}</span>
    <span className={styles.statTileValue}>
      {value}
      {unit && <span className={styles.statTileUnit}>{unit}</span>}
    </span>
  </div>
);

const SectionHeader = ({ label, accent }) => (
  <div className={styles.sectionHeader}>
    <span className={styles.sectionAccent} style={{ background: accent }} />
    <h2 className={styles.sectionTitle}>{label}</h2>
  </div>
);

/* ── Main Component ───────────────────────────────────────── */
const PlayerDetail = () => {
  const { playerName } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const res = await fetch(`/api/players/player/${playerName}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed to load");
        setData(result);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [playerName]);

  if (loading)
    return (
      <div className={styles.stateWrapper}>
        <p className={styles.stateText}>Loading player data...</p>
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

  const hasBatting = data.batting && typeof data.batting !== "string";
  const hasBowling = data.bowling && typeof data.bowling !== "string";
  const role = deriveRole(data.batting, data.bowling);
  const tier = impactTier(data.impactScore);

  // Sort phases into a logical order
  const phaseOrder = ["Powerplay", "Middle", "Death"];
  const sortedPhases = hasBatting
    ? [...(data.batting.phaseStats || [])].sort(
        (a, b) => phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase),
      )
    : [];

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* ── HERO ──────────────────────────────────────────── */}
        <section className={styles.hero}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>

          <div className={styles.heroBody}>
            <div className={styles.heroAvatar}>
              {data.playerName
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </div>

            <div className={styles.heroText}>
              <div className={styles.heroMeta}>
                <span
                  className={styles.roleBadge}
                  style={{
                    color: roleColor(role),
                    borderColor: roleColor(role) + "55",
                    background: roleColor(role) + "10",
                  }}
                >
                  {role}
                </span>
              </div>
              <h1 className={styles.heroTitle}>{data.playerName}</h1>
              <p className={styles.heroSub}>
                Comprehensive performance analytics across all innings
              </p>
            </div>
          </div>
        </section>

        {/* ── IMPACT SCORE ──────────────────────────────────── */}
        <section className={styles.impactSection}>
          <div className={styles.impactCard}>
            <div className={styles.impactLeft}>
              <SectionHeader label="Impact Score" accent="var(--ci-accent)" />
              <p className={styles.impactDesc}>
                Composite metric combining batting run contribution weighted by
                strike rate, wickets taken, and dot-ball pressure reduction.
              </p>
              <div className={styles.impactTierRow}>
                <span
                  className={styles.impactTierLabel}
                  style={{ color: tier.color }}
                >
                  {tier.label}
                </span>
                <span className={styles.impactTierSub}>Performance Tier</span>
              </div>
            </div>

            <div className={styles.impactRight}>
              <div className={styles.impactMeter}>
                <svg viewBox="0 0 120 70" className={styles.impactArc}>
                  {/* Track */}
                  <path
                    d="M10,65 A55,55 0 0,1 110,65"
                    fill="none"
                    stroke="var(--ci-border)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Fill — capped at 1000 for visual */}
                  <path
                    d="M10,65 A55,55 0 0,1 110,65"
                    fill="none"
                    stroke={tier.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="172.8"
                    strokeDashoffset={
                      172.8 -
                      Math.min(parseFloat(data.impactScore) / 1000, 1) * 172.8
                    }
                    style={{
                      transition:
                        "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </svg>
                <div className={styles.impactNumber}>
                  <span style={{ color: tier.color }}>{data.impactScore}</span>
                  <span className={styles.impactNumberSub}>/ 1000</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── BATTING ───────────────────────────────────────── */}
        {hasBatting && (
          <section className={styles.section}>
            <SectionHeader label="Batting Analytics" accent="var(--ci-brand)" />

            {/* Stats row */}
            <div className={styles.statGrid}>
              <StatTile
                label="Total Runs"
                value={data.batting.totalRuns}
                highlight
              />
              <StatTile label="Balls Faced" value={data.batting.totalBalls} />
              <StatTile
                label="Strike Rate"
                value={fmt(data.batting.strikeRate)}
              />
              <StatTile
                label="Dot Ball %"
                value={fmt(data.batting.dotBallPercent)}
                unit="%"
              />
              <StatTile
                label="Boundary %"
                value={fmt(data.batting.boundaryPercent)}
                unit="%"
              />
            </div>

            {/* Charts row */}
            <div className={styles.chartsRow}>
              {sortedPhases.length > 0 && (
                <PhaseStrikeRateChart phases={sortedPhases} />
              )}
              <BattingBreakdownChart
                dotBallPercent={data.batting.dotBallPercent}
                boundaryPercent={data.batting.boundaryPercent}
                totalRuns={data.batting.totalRuns}
                totalBalls={data.batting.totalBalls}
              />
            </div>

            {/* Phase detail tiles */}
            {sortedPhases.length > 0 && (
              <div className={styles.phaseTiles}>
                {sortedPhases.map((p) => {
                  const phaseColor =
                    p.phase === "Powerplay"
                      ? "var(--ci-brand)"
                      : p.phase === "Middle"
                        ? "var(--ci-blue)"
                        : "var(--ci-accent)";
                  return (
                    <div
                      className={styles.phaseTile}
                      key={p.phase}
                      style={{ borderColor: phaseColor + "33" }}
                    >
                      <span
                        className={styles.phaseDot}
                        style={{ background: phaseColor }}
                      />
                      <span className={styles.phaseLabel}>{p.phase}</span>
                      <span
                        className={styles.phaseValue}
                        style={{ color: phaseColor }}
                      >
                        {fmt(p.strikeRate)}
                      </span>
                      <span className={styles.phaseUnit}>SR</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── BOWLING ───────────────────────────────────────── */}
        {hasBowling && (
          <section className={styles.section}>
            <SectionHeader
              label="Bowling Analytics"
              accent="var(--ci-danger)"
            />

            <div className={styles.statGrid}>
              <StatTile
                label="Wickets"
                value={data.bowling.totalWickets}
                highlight
              />
              <StatTile label="Economy" value={fmt(data.bowling.economy)} />
              <StatTile
                label="Bowling SR"
                value={fmt(data.bowling.strikeRate)}
              />
              <StatTile
                label="Dot Ball %"
                value={fmt(data.bowling.dotBallPercent)}
                unit="%"
              />
            </div>

            <div className={styles.chartsRow}>
              <BowlingMetricsChart bowling={data.bowling} />
            </div>
          </section>
        )}

        {/* ── NO DATA STATES ────────────────────────────────── */}
        {!hasBatting && (
          <div className={styles.noDataBanner}>
            <span className={styles.noDataIcon}>🏏</span>
            <span className={styles.noDataText}>
              No batting data recorded for this player
            </span>
          </div>
        )}

        {!hasBowling && (
          <div className={styles.noDataBanner}>
            <span className={styles.noDataIcon}>⚡</span>
            <span className={styles.noDataText}>
              No bowling data recorded for this player
            </span>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlayerDetail;
