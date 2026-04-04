import React, { useState } from "react";
import styles from "./KeyMomentsTimeline.module.css";

const TYPE_CONFIG = {
  wicket: {
    icon: "💥",
    label: "Wicket",
    color: "var(--ci-danger)",
    bg: "rgba(255, 77, 109, 0.08)",
    border: "rgba(255, 77, 109, 0.28)",
  },
  bigOver: {
    icon: "🔥",
    label: "Big Over",
    color: "var(--ci-accent)",
    bg: "rgba(245, 155, 0, 0.08)",
    border: "rgba(245, 155, 0, 0.28)",
  },
  wicketCluster: {
    icon: "⚡",
    label: "Collapse",
    color: "var(--ci-blue)",
    bg: "rgba(61, 142, 255, 0.08)",
    border: "rgba(61, 142, 255, 0.28)",
  },
};

const FILTERS = ["all", "wicket", "bigOver", "wicketCluster"];

const KeyMomentsTimeline = ({ moments, team1, team2 }) => {
  const [filter, setFilter] = useState("all");
  const [inningsFilter, setInningsFilter] = useState("all");

  const filtered = moments.filter((m) => {
    const typeOk = filter === "all" || m.type === filter;
    const innOk =
      inningsFilter === "all" || m.innings === parseInt(inningsFilter);
    return typeOk && innOk;
  });

  return (
    <div className={styles.wrapper}>
      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          {FILTERS.map((f) => {
            const cfg = f !== "all" ? TYPE_CONFIG[f] : null;
            return (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`}
                style={
                  filter === f && cfg
                    ? {
                        color: cfg.color,
                        borderColor: cfg.border,
                        background: cfg.bg,
                      }
                    : {}
                }
                onClick={() => setFilter(f)}
              >
                {cfg ? cfg.icon + " " + cfg.label : "All"}
              </button>
            );
          })}
        </div>

        <div className={styles.filterGroup}>
          {[
            ["all", "Both"],
            ["1", "Inn 1"],
            ["2", "Inn 2"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={`${styles.filterBtn} ${inningsFilter === v ? styles.filterActive : ""}`}
              onClick={() => setInningsFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>

        <span className={styles.filterCount}>{filtered.length} events</span>
      </div>

      {/* Summary pills */}
      <div className={styles.summaryPills}>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const count = moments.filter((m) => m.type === type).length;
          if (!count) return null;
          return (
            <div
              key={type}
              className={styles.pill}
              style={{ borderColor: cfg.border, background: cfg.bg }}
            >
              <span>{cfg.icon}</span>
              <span style={{ color: cfg.color }}>{count}</span>
              <span className={styles.pillLabel}>
                {cfg.label}
                {count !== 1 ? "s" : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>No events match the current filter</div>
      ) : (
        <div className={styles.timeline}>
          {/* Innings 1 group */}
          {(inningsFilter === "all" || inningsFilter === "1") && (
            <div className={styles.inningsGroup}>
              <div className={styles.inningsGroupHeader}>
                <span
                  className={styles.inningsPip}
                  style={{ background: "var(--ci-brand)" }}
                />
                <span className={styles.inningsGroupLabel}>
                  Innings 1 — {team1}
                </span>
              </div>
              <div className={styles.events}>
                {filtered
                  .filter((m) => m.innings === 1)
                  .map((m, i) => (
                    <MomentCard key={i} moment={m} />
                  ))}
                {filtered.filter((m) => m.innings === 1).length === 0 && (
                  <span className={styles.emptyInnings}>No events</span>
                )}
              </div>
            </div>
          )}

          {/* Innings 2 group */}
          {(inningsFilter === "all" || inningsFilter === "2") && (
            <div className={styles.inningsGroup}>
              <div className={styles.inningsGroupHeader}>
                <span
                  className={styles.inningsPip}
                  style={{ background: "var(--ci-accent)" }}
                />
                <span className={styles.inningsGroupLabel}>
                  Innings 2 — {team2}
                </span>
              </div>
              <div className={styles.events}>
                {filtered
                  .filter((m) => m.innings === 2)
                  .map((m, i) => (
                    <MomentCard key={i} moment={m} />
                  ))}
                {filtered.filter((m) => m.innings === 2).length === 0 && (
                  <span className={styles.emptyInnings}>No events</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MomentCard = ({ moment }) => {
  const cfg = TYPE_CONFIG[moment.type] ?? TYPE_CONFIG.wicket;
  return (
    <div
      className={`${styles.card} ${moment.severity === "high" ? styles.cardHigh : ""}`}
      style={{ borderColor: cfg.border }}
    >
      {/* Left accent bar */}
      <span className={styles.cardAccent} style={{ background: cfg.color }} />

      {/* Icon + type */}
      <div className={styles.cardMeta}>
        <span className={styles.cardIcon}>{cfg.icon}</span>
        <span className={styles.cardType} style={{ color: cfg.color }}>
          {cfg.label}
        </span>
        <span className={styles.cardOver}>{moment.label}</span>
      </div>

      {/* Description */}
      <p className={styles.cardDesc}>{moment.description}</p>

      {/* Extra data */}
      {moment.runs && (
        <span className={styles.cardRuns} style={{ color: cfg.color }}>
          +{moment.runs} runs
        </span>
      )}
      {moment.count && (
        <span className={styles.cardRuns} style={{ color: cfg.color }}>
          {moment.count} wickets
        </span>
      )}
    </div>
  );
};

export default KeyMomentsTimeline;
