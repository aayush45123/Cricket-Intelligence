import React, { useState } from "react";
import styles from "./BowlingComboChart.module.css";

const fmt = (v, d = 2) => (typeof v === "number" ? v.toFixed(d) : "—");

const econColor = (eco) =>
  eco < 7
    ? "var(--ci-brand)"
    : eco < 9
      ? "var(--ci-blue)"
      : eco < 11
        ? "var(--ci-accent)"
        : "var(--ci-danger)";

const BowlingComboChart = ({ data }) => {
  const [sort, setSort] = useState("wickets");

  const sorted = [...data].sort((a, b) => {
    if (sort === "wickets") return b.totalWickets - a.totalWickets;
    if (sort === "economy") return a.economy - b.economy;
    if (sort === "strikeRate")
      return (a.strikeRate || 999) - (b.strikeRate || 999);
    return 0;
  });

  const maxWkts = Math.max(...sorted.map((d) => d.totalWickets), 1);

  return (
    <div className={styles.wrapper}>
      {/* Sort controls */}
      <div className={styles.sortRow}>
        <span className={styles.sortLabel}>Sort by</span>
        {[
          ["wickets", "Wickets"],
          ["economy", "Economy"],
          ["strikeRate", "Strike Rate"],
        ].map(([v, l]) => (
          <button
            key={v}
            className={`${styles.sortBtn} ${sort === v ? styles.sortActive : ""}`}
            onClick={() => setSort(v)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Bowler rows */}
      <div className={styles.list}>
        {sorted.map((b, idx) => {
          const pct = (b.totalWickets / maxWkts) * 100;
          const ec = econColor(b.economy);
          return (
            <div key={b.bowler} className={styles.row}>
              <span
                className={styles.rank}
                style={{
                  color:
                    idx < 3 ? "var(--ci-accent)" : "var(--ci-text-disabled)",
                }}
              >
                {String(idx + 1).padStart(2, "0")}
              </span>

              <div className={styles.bowlerInfo}>
                <span className={styles.bowlerName}>{b.bowler}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${pct}%`,
                      background:
                        idx < 3 ? "var(--ci-danger)" : "var(--ci-danger)",
                      opacity: idx < 3 ? 0.9 : 0.45,
                    }}
                  />
                </div>
              </div>

              <div className={styles.stats}>
                <div className={styles.statBlock}>
                  <span className={styles.statLabel}>Wkts</span>
                  <span
                    className={styles.statVal}
                    style={{ color: "var(--ci-danger)" }}
                  >
                    {b.totalWickets}
                  </span>
                </div>
                <div className={styles.statBlock}>
                  <span className={styles.statLabel}>Eco</span>
                  <span className={styles.statVal} style={{ color: ec }}>
                    {fmt(b.economy)}
                  </span>
                </div>
                <div className={styles.statBlock}>
                  <span className={styles.statLabel}>SR</span>
                  <span className={styles.statVal}>
                    {b.strikeRate > 0 ? fmt(b.strikeRate, 1) : "—"}
                  </span>
                </div>
                <div className={styles.statBlock}>
                  <span className={styles.statLabel}>Matches</span>
                  <span className={styles.statVal}>{b.matches}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BowlingComboChart;
