import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./PlayerCompareDetail.module.css";
import CompareRadarChart from "../../components/charts/CompareRadarChart/CompareRadarChart";
import CompareBarChart from "../../components/charts/CompareBarChart/CompareBarChart";
import ComparePhaseChart from "../../components/charts/ComparePhaseChart/ComparePhaseChart";

/* ── Helpers ─────────────────────────────────────────────────── */
const fmt = (v, d = 2) => (typeof v === "number" ? v.toFixed(d) : "—");

const roleColor = (role) =>
  role === "All-Rounder"
    ? "var(--ci-accent)"
    : role === "Batsman"
      ? "var(--ci-brand)"
      : role === "Bowler"
        ? "var(--ci-danger)"
        : "var(--ci-blue)";

/* Win/loss/tie for a single metric pair */
const winner = (vA, vB, higherIsBetter = true) => {
  if (vA == null || vB == null) return "tie";
  const diff = higherIsBetter ? vA - vB : vB - vA;
  if (diff > 0.5) return "A";
  if (diff < -0.5) return "B";
  return "tie";
};

const WinPip = ({ who, pA, pB }) => {
  if (who === "tie") return <span className={styles.pipTie}>—</span>;
  const color = who === "A" ? "var(--ci-brand)" : "var(--ci-accent)";
  const name = who === "A" ? pA : pB;
  return (
    <span className={styles.pip} style={{ color }}>
      {name.split(" ")[0]} wins
    </span>
  );
};

const SectionHeader = ({ label, accent }) => (
  <div className={styles.sectionHeader}>
    <span className={styles.sectionAccent} style={{ background: accent }} />
    <h2 className={styles.sectionTitle}>{label}</h2>
  </div>
);

const MetricRow = ({
  label,
  valA,
  valB,
  displayA,
  displayB,
  higherIsBetter = true,
}) => {
  const who = winner(valA, valB, higherIsBetter);
  return (
    <div className={styles.metricRow}>
      <span
        className={styles.metricVal}
        style={{
          color: who === "A" ? "var(--ci-brand)" : "var(--ci-text-secondary)",
        }}
      >
        {displayA ?? fmt(valA)}
      </span>
      <div className={styles.metricMid}>
        <span className={styles.metricLabel}>{label}</span>
        <WinPip who={who} pA={pA} pB={pB} />
      </div>
      <span
        className={styles.metricVal}
        style={{
          color: who === "B" ? "var(--ci-accent)" : "var(--ci-text-secondary)",
          textAlign: "right",
        }}
      >
        {displayB ?? fmt(valB)}
      </span>
    </div>
  );
};

/* Need access to player names inside MetricRow — hoist via closure */
let pA = "",
  pB = "";

/* ── Main ─────────────────────────────────────────────────────── */
const PlayerCompareDetail = () => {
  const { playerA, playerB } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/matchups/compare/${playerA}/${playerB}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed");
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [playerA, playerB]);

  if (loading)
    return (
      <div className={styles.stateWrapper}>
        <div className={styles.loadingRing} />
        <p className={styles.stateText}>Comparing players...</p>
      </div>
    );

  if (error)
    return (
      <div className={styles.stateWrapper}>
        <p className={styles.errorText}>{error}</p>
        <button
          className={styles.backBtn}
          onClick={() => navigate("/matchups", { state: { tab: "compare" } })}
        >
          ← Back
        </button>
      </div>
    );

  if (!data) return null;

  const { playerA: dA, playerB: dB } = data;
  pA = dA.playerName;
  pB = dB.playerName;

  const batA = dA.batting;
  const batB = dB.batting;
  const bwlA = dA.bowling;
  const bwlB = dB.bowling;

  const hasBatting = batA || batB;
  const hasBowling = bwlA || bwlB;

  /* Category tally */
  const scoreA = { wins: 0, losses: 0 };
  const battingMetrics = hasBatting
    ? [
        {
          label: "Total Runs",
          a: batA?.totalRuns,
          b: batB?.totalRuns,
          hi: true,
        },
        {
          label: "Strike Rate",
          a: batA?.strikeRate,
          b: batB?.strikeRate,
          hi: true,
        },
        {
          label: "Boundary %",
          a: batA?.boundaryPercent,
          b: batB?.boundaryPercent,
          hi: true,
        },
        {
          label: "Dot Ball %",
          a: batA?.dotBallPercent,
          b: batB?.dotBallPercent,
          hi: false,
        },
        { label: "Fours", a: batA?.fours, b: batB?.fours, hi: true },
        { label: "Sixes", a: batA?.sixes, b: batB?.sixes, hi: true },
      ]
    : [];

  const bowlingMetrics = hasBowling
    ? [
        {
          label: "Wickets",
          a: bwlA?.totalWickets,
          b: bwlB?.totalWickets,
          hi: true,
        },
        { label: "Economy", a: bwlA?.economy, b: bwlB?.economy, hi: false },
        {
          label: "Strike Rate",
          a: bwlA?.strikeRate,
          b: bwlB?.strikeRate,
          hi: false,
        },
        {
          label: "Dot Ball %",
          a: bwlA?.dotBallPercent,
          b: bwlB?.dotBallPercent,
          hi: true,
        },
      ]
    : [];

  [...battingMetrics, ...bowlingMetrics].forEach(({ a, b, hi }) => {
    const w = winner(a, b, hi);
    if (w === "A") scoreA.wins++;
    if (w === "B") scoreA.losses++;
  });

  const overallWinner =
    scoreA.wins > scoreA.losses
      ? dA.playerName
      : scoreA.losses > scoreA.wins
        ? dB.playerName
        : "Draw";
  const overallColor =
    scoreA.wins > scoreA.losses
      ? "var(--ci-brand)"
      : scoreA.losses > scoreA.wins
        ? "var(--ci-accent)"
        : "var(--ci-text-muted)";

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* TOP NAV */}
        <button
          className={styles.backBtn}
          onClick={() => navigate("/matchups", { state: { tab: "compare" } })}
        >
          ← Back to Comparison
        </button>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroCard}>
            <div className={styles.heroPlayer}>
              <div
                className={styles.avatar}
                style={{
                  borderColor: "var(--ci-brand)",
                  background: "var(--ci-brand-subtle)",
                  color: "var(--ci-brand)",
                }}
              >
                {pA
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className={styles.playerInfo}>
                <span
                  className={styles.playerRole}
                  style={{ color: roleColor(dA.role) }}
                >
                  {dA.role}
                </span>
                <h1 className={styles.playerName}>{pA}</h1>
                <span
                  className={styles.playerScore}
                  style={{ color: "var(--ci-brand)" }}
                >
                  {scoreA.wins}W · {scoreA.losses}L
                </span>
              </div>
            </div>

            <div className={styles.heroCenter}>
              <div
                className={styles.overallVerdict}
                style={{ color: overallColor }}
              >
                {overallWinner === "Draw"
                  ? "Draw"
                  : `${overallWinner.split(" ")[0]} ahead`}
              </div>
              <span className={styles.heroVs}>vs</span>
              <span className={styles.categoryCount}>
                {battingMetrics.length + bowlingMetrics.length} categories
              </span>
            </div>

            <div className={`${styles.heroPlayer} ${styles.heroPlayerRight}`}>
              <div
                className={styles.playerInfo}
                style={{ alignItems: "flex-end" }}
              >
                <span
                  className={styles.playerRole}
                  style={{ color: roleColor(dB.role) }}
                >
                  {dB.role}
                </span>
                <h1 className={styles.playerName}>{pB}</h1>
                <span
                  className={styles.playerScore}
                  style={{ color: "var(--ci-accent)" }}
                >
                  {scoreA.losses}W · {scoreA.wins}L
                </span>
              </div>
              <div
                className={styles.avatar}
                style={{
                  borderColor: "var(--ci-accent)",
                  background: "var(--ci-accent-subtle)",
                  color: "var(--ci-accent)",
                }}
              >
                {pB
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>
            </div>
          </div>
        </section>

        {/* RADAR CHART */}
        <section className={styles.section}>
          <SectionHeader
            label="Skill Radar — Overall Profile"
            accent="var(--ci-blue)"
          />
          <CompareRadarChart dataA={dA} dataB={dB} nameA={pA} nameB={pB} />
        </section>

        {/* BATTING COMPARISON */}
        {hasBatting && (
          <>
            <section className={styles.section}>
              <SectionHeader
                label="Batting Comparison"
                accent="var(--ci-brand)"
              />
              <CompareBarChart
                metrics={battingMetrics.map((m) => ({
                  label: m.label,
                  a: m.a ?? 0,
                  b: m.b ?? 0,
                  higherIsBetter: m.hi,
                }))}
                nameA={pA}
                nameB={pB}
              />
            </section>

            <section className={styles.section}>
              <SectionHeader
                label="Batting Metrics — Side by Side"
                accent="var(--ci-brand)"
              />
              <div className={styles.metricsCard}>
                {battingMetrics.map((m) => (
                  <MetricRow
                    key={m.label}
                    label={m.label}
                    valA={m.a}
                    valB={m.b}
                    higherIsBetter={m.hi}
                  />
                ))}
              </div>
            </section>

            {/* Phase chart — only if both have phase data */}
            {batA?.phaseStats?.length > 0 && batB?.phaseStats?.length > 0 && (
              <section className={styles.section}>
                <SectionHeader
                  label="Phase Strike Rate"
                  accent="var(--ci-blue)"
                />
                <ComparePhaseChart
                  phasesA={batA.phaseStats}
                  phasesB={batB.phaseStats}
                  nameA={pA}
                  nameB={pB}
                />
              </section>
            )}
          </>
        )}

        {/* BOWLING COMPARISON */}
        {hasBowling && (
          <>
            <section className={styles.section}>
              <SectionHeader
                label="Bowling Comparison"
                accent="var(--ci-danger)"
              />
              <CompareBarChart
                metrics={bowlingMetrics.map((m) => ({
                  label: m.label,
                  a: m.a ?? 0,
                  b: m.b ?? 0,
                  higherIsBetter: m.hi,
                }))}
                nameA={pA}
                nameB={pB}
                accentA="var(--ci-brand)"
                accentB="var(--ci-accent)"
              />
            </section>

            <section className={styles.section}>
              <SectionHeader
                label="Bowling Metrics — Side by Side"
                accent="var(--ci-danger)"
              />
              <div className={styles.metricsCard}>
                {bowlingMetrics.map((m) => (
                  <MetricRow
                    key={m.label}
                    label={m.label}
                    valA={m.a}
                    valB={m.b}
                    higherIsBetter={m.hi}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* FINAL VERDICT */}
        <section className={styles.verdictSection}>
          <div
            className={styles.verdictCard}
            style={{ borderColor: overallColor + "44" }}
          >
            <div className={styles.verdictTop}>
              <span className={styles.verdictIcon}>🏆</span>
              <span className={styles.verdictLabel}>Overall Verdict</span>
            </div>
            <div className={styles.verdictName} style={{ color: overallColor }}>
              {overallWinner}
            </div>
            <p className={styles.verdictSub}>
              {overallWinner === "Draw"
                ? "Both players are evenly matched across all compared metrics."
                : `${overallWinner} wins ${Math.max(scoreA.wins, scoreA.losses)} of ${battingMetrics.length + bowlingMetrics.length} categories compared.`}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PlayerCompareDetail;
