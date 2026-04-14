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
import styles from "./PhaseCompareChart.module.css";

const PHASE_COLORS = {
  Powerplay: "var(--ci-brand)",
  Middle: "var(--ci-blue)",
  Death: "var(--ci-accent)",
};

const CustomTooltip = ({ active, payload, label, mode }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipPhase}>{label}</span>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipKey}>
          {mode === "batting" ? "Run Rate" : "Economy"}
        </span>
        <span
          className={styles.tooltipVal}
          style={{ color: PHASE_COLORS[label] }}
        >
          {mode === "batting" ? d.runRate : d.economy}
        </span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipKey}>Wickets</span>
        <span className={styles.tooltipVal}>{d.wickets}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipKey}>Dot Ball %</span>
        <span className={styles.tooltipVal}>{d.dotPct}%</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipKey}>Balls</span>
        <span className={styles.tooltipVal}>{d.balls.toLocaleString()}</span>
      </div>
    </div>
  );
};

const PhaseCompareChart = ({ phases, mode = "batting" }) => {
  const metricKey = mode === "batting" ? "runRate" : "economy";
  const metricLabel = mode === "batting" ? "Run Rate" : "Economy";
  const accent = mode === "batting" ? "var(--ci-brand)" : "var(--ci-danger)";

  return (
    <div className={styles.wrapper}>
      {/* Summary tiles */}
      <div className={styles.phaseTiles}>
        {phases.map((p) => {
          const color = PHASE_COLORS[p.phase];
          return (
            <div
              key={p.phase}
              className={styles.tile}
              style={{ borderColor: color + "33" }}
            >
              <span
                className={styles.tilePhaseDot}
                style={{ background: color }}
              />
              <span className={styles.tilePhase}>{p.phase}</span>
              <span className={styles.tileMetric} style={{ color }}>
                {p[metricKey]}
              </span>
              <span className={styles.tileMetricLabel}>{metricLabel}</span>
              <div className={styles.tileSubRow}>
                <span className={styles.tileSub}>W: {p.wickets}</span>
                <span className={styles.tileSub}>Dot: {p.dotPct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={phases}
            barCategoryGap="38%"
            margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              stroke="var(--ci-border)"
              strokeDasharray="4 4"
              vertical={false}
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
            />
            <Tooltip
              content={(props) => <CustomTooltip {...props} mode={mode} />}
              cursor={{ fill: "var(--ci-bg-tertiary)" }}
            />
            <Bar dataKey={metricKey} radius={[5, 5, 0, 0]}>
              {phases.map((p) => (
                <Cell
                  key={p.phase}
                  fill={PHASE_COLORS[p.phase]}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PhaseCompareChart;
