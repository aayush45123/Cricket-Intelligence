import React from "react";
import styles from "./VenueTopTeams.module.css";

const COLORS = [
  "var(--ci-accent)",
  "var(--ci-brand)",
  "var(--ci-blue)",
  "var(--ci-danger)",
  "var(--ci-text-secondary)",
  "var(--ci-text-secondary)",
  "var(--ci-text-secondary)",
  "var(--ci-text-secondary)",
];

const VenueTopTeams = ({ teams, totalMatches }) => {
  const max = teams[0]?.wins ?? 1;

  return (
    <div className={styles.wrapper}>
      <div className={styles.list}>
        {teams.map((t, i) => {
          const pct = (t.wins / max) * 100;
          const winRate =
            totalMatches > 0 ? ((t.wins / totalMatches) * 100).toFixed(0) : 0;
          const color = COLORS[i] ?? "var(--ci-text-muted)";

          return (
            <div key={t.team} className={styles.row}>
              <span
                className={styles.rank}
                style={{ color: i < 3 ? color : "var(--ci-text-disabled)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className={styles.teamInfo}>
                <span className={styles.teamName}>{t.team}</span>
                <div className={styles.bar}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>

              <div className={styles.winsBlock}>
                <span className={styles.wins} style={{ color }}>
                  {t.wins}
                </span>
                <span className={styles.winsSub}>wins</span>
              </div>

              <span className={styles.winRate}>{winRate}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VenueTopTeams;
