import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import styles from "./MatchupSeasonTrend.module.css";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipSeason}>{label}</span>
      {payload.map((p) => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: p.color }} />
          <span className={styles.tooltipKey}>{p.name}</span>
          <span className={styles.tooltipVal}>
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
      <span className={styles.tooltipMeta}>
        {d.matches} match{d.matches !== 1 ? "es" : ""} · {d.dismissals}{" "}
        dismissal{d.dismissals !== 1 ? "s" : ""}
      </span>
    </div>
  );
};

const MatchupSeasonTrend = ({ data }) => (
  <div className={styles.wrapper}>
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 20, left: -8, bottom: 0 }}
        >
          <CartesianGrid
            stroke="var(--ci-border)"
            strokeDasharray="4 4"
            vertical={false}
          />
          <XAxis
            dataKey="season"
            tick={{
              fontSize: 9,
              fill: "var(--ci-text-muted)",
              fontFamily: "var(--ci-font-mono)",
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="sr"
            tick={{
              fontSize: 9,
              fill: "var(--ci-text-muted)",
              fontFamily: "var(--ci-font-mono)",
            }}
            axisLine={false}
            tickLine={false}
            label={{
              value: "SR",
              angle: -90,
              position: "insideLeft",
              fill: "var(--ci-text-muted)",
              fontSize: 9,
              fontFamily: "var(--ci-font-mono)",
            }}
          />
          <YAxis
            yAxisId="runs"
            orientation="right"
            tick={{
              fontSize: 9,
              fill: "var(--ci-text-muted)",
              fontFamily: "var(--ci-font-mono)",
            }}
            axisLine={false}
            tickLine={false}
            label={{
              value: "Avg Runs",
              angle: 90,
              position: "insideRight",
              fill: "var(--ci-text-muted)",
              fontSize: 9,
              fontFamily: "var(--ci-font-mono)",
            }}
          />
          <ReferenceLine
            yAxisId="sr"
            y={100}
            stroke="var(--ci-text-disabled)"
            strokeDasharray="6 4"
            strokeOpacity={0.5}
            label={{
              value: "SR 100",
              position: "right",
              fill: "var(--ci-text-muted)",
              fontSize: 9,
              fontFamily: "var(--ci-font-mono)",
            }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "var(--ci-border-medium)", strokeWidth: 1 }}
          />
          <Line
            yAxisId="sr"
            type="monotone"
            dataKey="strikeRate"
            name="Strike Rate"
            stroke="var(--ci-brand)"
            strokeWidth={2.5}
            dot={{
              r: 4,
              fill: "var(--ci-bg-secondary)",
              stroke: "var(--ci-brand)",
              strokeWidth: 2,
            }}
            activeDot={{ r: 6, fill: "var(--ci-brand)", strokeWidth: 0 }}
            connectNulls
          />
          <Line
            yAxisId="runs"
            type="monotone"
            dataKey="avgRuns"
            name="Avg Runs"
            stroke="var(--ci-accent)"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
    <div className={styles.legend}>
      <div className={styles.legendItem}>
        <span
          className={styles.legendLine}
          style={{ background: "var(--ci-brand)" }}
        />
        <span>Strike Rate</span>
      </div>
      <div className={styles.legendItem}>
        <span
          className={styles.legendLine}
          style={{ background: "var(--ci-accent)", opacity: 0.7 }}
        />
        <span>Avg Runs per Match</span>
      </div>
    </div>
  </div>
);

export default MatchupSeasonTrend;
