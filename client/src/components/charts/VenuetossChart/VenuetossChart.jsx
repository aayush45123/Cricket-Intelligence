import React from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import styles from "./VenueTossChart.module.css";

const VenueTossChart = ({
  tossImpact,
  fieldWinPct,
  fieldCount,
  batWinPct,
  batCount,
}) => {
  const impactLevel =
    tossImpact > 58
      ? {
          label: "High Impact",
          color: "var(--ci-blue)",
          verdict: "Winning the toss gives a significant edge at this venue.",
        }
      : tossImpact < 42
        ? {
            label: "Low Impact",
            color: "var(--ci-text-muted)",
            verdict: "The toss result barely influences match outcomes here.",
          }
        : {
            label: "Moderate",
            color: "var(--ci-accent)",
            verdict: "The toss provides a slight but not decisive advantage.",
          };

  const decisions = [
    {
      label: "Field First",
      pct: fieldWinPct,
      count: fieldCount,
      color: "var(--ci-brand)",
    },
    {
      label: "Bat First",
      pct: batWinPct,
      count: batCount,
      color: "var(--ci-accent)",
    },
  ];

  // Radial bar data
  const radialData = [
    { name: "Toss Win%", value: tossImpact, fill: impactLevel.color },
  ];

  return (
    <div className={styles.wrapper}>
      {/* Radial gauge */}
      <div className={styles.gaugeRow}>
        <div className={styles.gauge}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="55%"
              outerRadius="90%"
              startAngle={180}
              endAngle={0}
              data={radialData}
              barSize={14}
            >
              <RadialBar
                background={{ fill: "var(--ci-bg-tertiary)" }}
                dataKey="value"
                cornerRadius={8}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--ci-bg-primary)",
                  border: "1px solid var(--ci-border-medium)",
                  borderRadius: "var(--ci-radius-sm)",
                  fontFamily: "var(--ci-font-mono)",
                  fontSize: "0.72rem",
                  color: "var(--ci-text-primary)",
                }}
                formatter={(v) => [`${v.toFixed(1)}%`, "Toss → Win"]}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className={styles.gaugeCenter}>
            <span
              className={styles.gaugePct}
              style={{ color: impactLevel.color }}
            >
              {tossImpact.toFixed(0)}%
            </span>
            <span className={styles.gaugeSub}>
              toss winners
              <br />
              also won
            </span>
          </div>
        </div>

        <div className={styles.gaugeRight}>
          <span
            className={styles.impactBadge}
            style={{ color: impactLevel.color }}
          >
            {impactLevel.label}
          </span>
          <p className={styles.verdict}>{impactLevel.verdict}</p>
        </div>
      </div>

      {/* Decision breakdown */}
      <div className={styles.decisionsTitle}>Win Rate by Toss Decision</div>
      <div className={styles.decisions}>
        {decisions.map((d) => (
          <div key={d.label} className={styles.decisionCard}>
            <span className={styles.decisionLabel}>{d.label}</span>
            <span className={styles.decisionPct} style={{ color: d.color }}>
              {d.pct.toFixed(1)}%
            </span>
            <div className={styles.decisionBar}>
              <div
                className={styles.decisionFill}
                style={{ width: `${d.pct}%`, background: d.color }}
              />
            </div>
            <span className={styles.decisionCount}>{d.count} times chosen</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VenueTossChart;
