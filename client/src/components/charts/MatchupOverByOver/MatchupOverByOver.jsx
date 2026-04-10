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
  ReferenceLine,
} from "recharts";
import styles from "./MatchupOverByOver.module.css";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipOver}>Over {label}</span>
      <span
        className={styles.tooltipRuns}
        style={{
          color: d.dismissals > 0 ? "var(--ci-danger)" : "var(--ci-brand)",
        }}
      >
        {d.runs} runs
      </span>
      <span className={styles.tooltipBalls}>
        {d.balls} balls · SR {d.strikeRate}
      </span>
      {d.dismissals > 0 && (
        <span className={styles.tooltipWkt}>💥 Dismissed {d.dismissals}×</span>
      )}
    </div>
  );
};

const MatchupOverByOver = ({ data }) => {
  const avgSR = data.reduce((s, d) => s + d.strikeRate, 0) / (data.length || 1);

  return (
    <div className={styles.wrapper}>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 16, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              stroke="var(--ci-border)"
              strokeDasharray="4 4"
              vertical={false}
            />
            <XAxis
              dataKey="over"
              tick={{
                fontSize: 9,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Over",
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
                fontSize: 9,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="sr"
              orientation="right"
              tickFormatter={(v) => v.toFixed(0)}
              tick={{
                fontSize: 9,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine
              yAxisId="sr"
              y={avgSR}
              stroke="var(--ci-text-muted)"
              strokeDasharray="6 4"
              strokeOpacity={0.5}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--ci-bg-tertiary)" }}
            />
            <Bar
              yAxisId="runs"
              dataKey="runs"
              maxBarSize={28}
              radius={[3, 3, 0, 0]}
            >
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.dismissals > 0
                      ? "var(--ci-danger)"
                      : d.runs >= 10
                        ? "var(--ci-brand)"
                        : "var(--ci-brand-dim)"
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
              strokeWidth={1.5}
              dot={false}
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
          <span>Runs (bar)</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "var(--ci-danger)" }}
          />
          <span>Dismissal over</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendLine} />
          <span>Strike Rate (line)</span>
        </div>
      </div>
    </div>
  );
};

export default MatchupOverByOver;
