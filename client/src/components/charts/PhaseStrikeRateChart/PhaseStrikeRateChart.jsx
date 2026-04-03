import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import styles from "./PhaseStrikeRateChart.module.css";

const PHASE_COLORS = {
  Powerplay: "var(--ci-brand)",
  Middle: "var(--ci-blue)",
  Death: "var(--ci-accent)",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipPhase}>{d.phase}</span>
      <span className={styles.tooltipValue}>{d.strikeRate.toFixed(1)}</span>
      <span className={styles.tooltipLabel}>Strike Rate</span>
    </div>
  );
};

const PhaseStrikeRateChart = ({ phases }) => {
  const chartData = phases.map((p) => ({
    phase: p.phase,
    strikeRate: parseFloat(p.strikeRate.toFixed(2)),
  }));

  // average SR across phases
  const avgSR =
    chartData.reduce((s, d) => s + d.strikeRate, 0) / chartData.length;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>Phase Strike Rate</h3>
        <span className={styles.avgBadge}>Avg {avgSR.toFixed(1)}</span>
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            barCategoryGap="38%"
            margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--ci-border)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="phase"
              tick={{
                fontSize: 10,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{
                fontSize: 10,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
              domain={[0, "auto"]}
            />
            <ReferenceLine
              y={avgSR}
              stroke="var(--ci-text-disabled)"
              strokeDasharray="6 4"
              strokeWidth={1}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--ci-bg-tertiary)" }}
            />
            <Bar dataKey="strikeRate" radius={[5, 5, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.phase}
                  fill={PHASE_COLORS[entry.phase] || "var(--ci-brand)"}
                  opacity={0.9}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Phase legend */}
      <div className={styles.legend}>
        {chartData.map((d) => (
          <div className={styles.legendItem} key={d.phase}>
            <span
              className={styles.legendDot}
              style={{ background: PHASE_COLORS[d.phase] }}
            />
            <span className={styles.legendLabel}>{d.phase}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhaseStrikeRateChart;
