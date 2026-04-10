// ── MatchupRunDistribution.jsx ──────────────────────────────────
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import styles from "./MatchupRunDistribution.module.css";

const COLORS = {
  0: "var(--ci-text-disabled)",
  1: "var(--ci-blue)",
  2: "var(--ci-blue)",
  3: "var(--ci-accent)",
  4: "var(--ci-brand)",
  "6+": "var(--ci-brand)",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipRun}>
        {label === "0" ? "Dot balls" : `${label} runs`}
      </span>
      <span className={styles.tooltipCount}>{d.count} balls</span>
      <span className={styles.tooltipPct}>{d.pct}% of deliveries</span>
    </div>
  );
};

const MatchupRunDistribution = ({ data, totalBalls }) => (
  <div className={styles.wrapper}>
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barCategoryGap="22%"
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid
            stroke="var(--ci-border)"
            strokeDasharray="4 4"
            vertical={false}
          />
          <XAxis
            dataKey="run"
            tick={{
              fontSize: 10,
              fill: "var(--ci-text-muted)",
              fontFamily: "var(--ci-font-mono)",
            }}
            axisLine={false}
            tickLine={false}
            label={{
              value: "Runs per ball",
              position: "insideBottomRight",
              offset: -4,
              fill: "var(--ci-text-muted)",
              fontSize: 9,
              fontFamily: "var(--ci-font-mono)",
            }}
          />
          <YAxis
            tick={{
              fontSize: 10,
              fill: "var(--ci-text-muted)",
              fontFamily: "var(--ci-font-mono)",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "var(--ci-bg-tertiary)" }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell
                key={d.run}
                fill={COLORS[d.run] || "var(--ci-text-muted)"}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div className={styles.pills}>
      {data.map((d) => (
        <div key={d.run} className={styles.pill}>
          <span
            className={styles.pillDot}
            style={{ background: COLORS[d.run] || "var(--ci-text-muted)" }}
          />
          <span className={styles.pillRun}>
            {d.run === "0" ? "Dot" : `${d.run}`}
          </span>
          <span className={styles.pillPct}>{d.pct}%</span>
        </div>
      ))}
    </div>
  </div>
);

export default MatchupRunDistribution;
