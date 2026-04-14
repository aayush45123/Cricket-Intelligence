import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import styles from "./BattingOrderChart.module.css";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipTitle}>Position {label}</span>
      <div className={styles.tooltipRow}>
        <span
          className={styles.tooltipDot}
          style={{ background: "var(--ci-brand)" }}
        />
        <span className={styles.tooltipKey}>Runs</span>
        <span className={styles.tooltipVal}>{d.runs.toLocaleString()}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span
          className={styles.tooltipDot}
          style={{ background: "var(--ci-accent)" }}
        />
        <span className={styles.tooltipKey}>Strike Rate</span>
        <span className={styles.tooltipVal}>{d.strikeRate}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span
          className={styles.tooltipDot}
          style={{ background: "var(--ci-blue)" }}
        />
        <span className={styles.tooltipKey}>Balls</span>
        <span className={styles.tooltipVal}>{d.balls.toLocaleString()}</span>
      </div>
    </div>
  );
};

const BattingOrderChart = ({ data }) => {
  const maxRuns = Math.max(...data.map((d) => d.runs), 1);

  return (
    <div className={styles.wrapper}>
      {/* Position tiles */}
      <div className={styles.tiles}>
        {data.map((d) => {
          const pct = (d.runs / maxRuns) * 100;
          const isTop3 = d.position <= 3;
          return (
            <div
              key={d.position}
              className={styles.tile}
              style={{
                borderColor: isTop3
                  ? "var(--ci-brand)" + "44"
                  : "var(--ci-border)",
              }}
            >
              <div
                className={styles.tilePos}
                style={{
                  color: isTop3 ? "var(--ci-brand)" : "var(--ci-text-muted)",
                }}
              >
                #{d.position}
              </div>
              <div className={styles.tileBar}>
                <div
                  className={styles.tileFill}
                  style={{
                    height: `${pct}%`,
                    background: isTop3
                      ? "var(--ci-brand)"
                      : "var(--ci-brand-dim)",
                  }}
                />
              </div>
              <div className={styles.tileRuns}>
                {(d.runs / 1000).toFixed(1)}k
              </div>
              <div className={styles.tileSR}>{d.strikeRate}</div>
            </div>
          );
        })}
      </div>

      {/* Main chart */}
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 24, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              stroke="var(--ci-border)"
              strokeDasharray="4 4"
              vertical={false}
            />
            <XAxis
              dataKey="position"
              tickFormatter={(v) => `#${v}`}
              tick={{
                fontSize: 10,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Batting Position",
                position: "insideBottomRight",
                offset: -4,
                fill: "var(--ci-text-muted)",
                fontSize: 9,
                fontFamily: "var(--ci-font-mono)",
              }}
            />
            <YAxis
              yAxisId="runs"
              tick={{
                fontSize: 10,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="sr"
              orientation="right"
              tick={{
                fontSize: 10,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "SR",
                angle: 90,
                position: "insideRight",
                fill: "var(--ci-text-muted)",
                fontSize: 9,
                fontFamily: "var(--ci-font-mono)",
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--ci-bg-tertiary)" }}
            />
            <Bar
              yAxisId="runs"
              dataKey="runs"
              maxBarSize={40}
              radius={[4, 4, 0, 0]}
            >
              {data.map((d) => (
                <Cell
                  key={d.position}
                  fill={
                    d.position <= 3 ? "var(--ci-brand)" : "var(--ci-brand-dim)"
                  }
                  opacity={0.85}
                />
              ))}
            </Bar>
            <Line
              yAxisId="sr"
              type="monotone"
              dataKey="strikeRate"
              stroke="var(--ci-accent)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--ci-accent)", strokeWidth: 0 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "var(--ci-brand)" }}
          />
          <span>Total Runs (bar)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendLine} />
          <span>Strike Rate (line)</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "var(--ci-brand)", opacity: 0.5 }}
          />
          <span>Top 3 positions highlighted</span>
        </div>
      </div>
    </div>
  );
};

export default BattingOrderChart;
