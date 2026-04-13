import React from "react";
import styles from "./CompareBarChart.module.css";

const fmt = (v) =>
  typeof v === "number" ? (Number.isInteger(v) ? v : v.toFixed(1)) : "—";

const CompareBarChart = ({
  metrics,
  nameA,
  nameB,
  accentA = "var(--ci-brand)",
  accentB = "var(--ci-accent)",
}) => {
  return (
    <div className={styles.wrapper}>
      {/* Header row */}
      <div className={styles.header}>
        <span className={styles.playerLabel} style={{ color: accentA }}>
          {nameA}
        </span>
        <span className={styles.headerMid} />
        <span
          className={styles.playerLabel}
          style={{ color: accentB, textAlign: "right" }}
        >
          {nameB}
        </span>
      </div>

      {metrics.map((m) => {
        const max = Math.max(m.a || 0, m.b || 0, 0.001);
        const pctA = ((m.a || 0) / max) * 100;
        const pctB = ((m.b || 0) / max) * 100;

        const aWins = m.higherIsBetter ? m.a > m.b : m.a < m.b;
        const bWins = m.higherIsBetter ? m.b > m.a : m.b < m.a;

        return (
          <div key={m.label} className={styles.row}>
            {/* A value + bar */}
            <div className={styles.sideA}>
              <span
                className={styles.val}
                style={{ color: aWins ? accentA : "var(--ci-text-secondary)" }}
              >
                {fmt(m.a)}
              </span>
              <div className={styles.trackA}>
                <div
                  className={styles.fillA}
                  style={{
                    width: `${pctA}%`,
                    background: accentA,
                    opacity: aWins ? 0.9 : 0.45,
                  }}
                />
              </div>
            </div>

            {/* Label */}
            <div className={styles.mid}>
              <span className={styles.metricLabel}>{m.label}</span>
              {aWins && (
                <span className={styles.winPip} style={{ color: accentA }}>
                  ◀
                </span>
              )}
              {bWins && (
                <span className={styles.winPip} style={{ color: accentB }}>
                  ▶
                </span>
              )}
            </div>

            {/* B value + bar */}
            <div className={styles.sideB}>
              <div className={styles.trackB}>
                <div
                  className={styles.fillB}
                  style={{
                    width: `${pctB}%`,
                    background: accentB,
                    opacity: bWins ? 0.9 : 0.45,
                  }}
                />
              </div>
              <span
                className={styles.val}
                style={{ color: bWins ? accentB : "var(--ci-text-secondary)" }}
              >
                {fmt(m.b)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CompareBarChart;
