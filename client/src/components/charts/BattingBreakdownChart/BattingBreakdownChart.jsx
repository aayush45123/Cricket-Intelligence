import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./BattingBreakdownChart.module.css";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{d.name}</span>
      <span className={styles.tooltipValue}>{d.value.toFixed(1)}%</span>
    </div>
  );
};

const BattingBreakdownChart = ({
  dotBallPercent,
  boundaryPercent,
  totalRuns,
  totalBalls,
}) => {
  // Run composition donut (% of runs per category)
  const boundaryRunPct = parseFloat(boundaryPercent) || 0;
  const otherRunPct = Math.max(0, 100 - boundaryRunPct);

  const runData = [
    { name: "Boundary Runs", value: parseFloat(boundaryRunPct.toFixed(2)) },
    { name: "Non-Boundary Runs", value: parseFloat(otherRunPct.toFixed(2)) },
  ];

  // Ball composition donut
  const dotPct = parseFloat(dotBallPercent) || 0;
  const scoringPct = Math.max(0, 100 - dotPct);

  const ballData = [
    { name: "Scoring Balls", value: parseFloat(scoringPct.toFixed(2)) },
    { name: "Dot Balls", value: parseFloat(dotPct.toFixed(2)) },
  ];

  const runColors = ["var(--ci-brand)", "var(--ci-bg-tertiary)"];
  const ballColors = ["var(--ci-blue)", "var(--ci-bg-tertiary)"];

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Batting Breakdown</h3>

      <div className={styles.donutRow}>
        {/* Run composition */}
        <div className={styles.donutBlock}>
          <div className={styles.donutChart}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={runData}
                  dataKey="value"
                  innerRadius="62%"
                  outerRadius="85%"
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {runData.map((_, i) => (
                    <Cell key={i} fill={runColors[i]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.donutCenter}>
              <span
                className={styles.donutValue}
                style={{ color: "var(--ci-brand)" }}
              >
                {boundaryRunPct.toFixed(0)}%
              </span>
              <span className={styles.donutSub}>Boundary</span>
            </div>
          </div>
          <span className={styles.donutLabel}>Run Composition</span>
        </div>

        {/* Divider */}
        <div className={styles.donutDivider} />

        {/* Ball composition */}
        <div className={styles.donutBlock}>
          <div className={styles.donutChart}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ballData}
                  dataKey="value"
                  innerRadius="62%"
                  outerRadius="85%"
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {ballData.map((_, i) => (
                    <Cell key={i} fill={ballColors[i]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.donutCenter}>
              <span
                className={styles.donutValue}
                style={{ color: "var(--ci-blue)" }}
              >
                {scoringPct.toFixed(0)}%
              </span>
              <span className={styles.donutSub}>Scoring</span>
            </div>
          </div>
          <span className={styles.donutLabel}>Ball Composition</span>
        </div>
      </div>

      {/* Summary rows */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <span
            className={styles.summaryDot}
            style={{ background: "var(--ci-brand)" }}
          />
          <span className={styles.summaryLabel}>Boundary Runs</span>
          <span className={styles.summaryValue}>
            {boundaryRunPct.toFixed(1)}%
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span
            className={styles.summaryDot}
            style={{ background: "var(--ci-blue)" }}
          />
          <span className={styles.summaryLabel}>Scoring Balls</span>
          <span className={styles.summaryValue}>{scoringPct.toFixed(1)}%</span>
        </div>
        <div className={styles.summaryItem}>
          <span
            className={styles.summaryDot}
            style={{ background: "var(--ci-text-disabled)" }}
          />
          <span className={styles.summaryLabel}>Dot Balls</span>
          <span className={styles.summaryValue}>{dotPct.toFixed(1)}%</span>
        </div>
        <div className={styles.summaryItem}>
          <span
            className={styles.summaryDot}
            style={{ background: "var(--ci-accent)" }}
          />
          <span className={styles.summaryLabel}>Total Balls</span>
          <span className={styles.summaryValue}>{totalBalls}</span>
        </div>
      </div>
    </div>
  );
};

export default BattingBreakdownChart;
