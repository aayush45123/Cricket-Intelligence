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
} from "recharts";
import styles from "./VenueseasontrendChart.module.css";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipSeason}>{label}</span>
      <span className={styles.tooltipScore}>{payload[0].value}</span>
      <span className={styles.tooltipSub}>avg 1st innings</span>
      <span className={styles.tooltipMatches}>
        {payload[0].payload.matches} matches
      </span>
    </div>
  );
};

const VenueSeasonTrend = ({ data }) => {
  const avg = data.reduce((s, d) => s + d.avgScore, 0) / data.length;
  const max = Math.max(...data.map((d) => d.avgScore));
  const min = Math.min(...data.map((d) => d.avgScore));

  return (
    <div className={styles.wrapper}>
      <div className={styles.summaryRow}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>All-time Avg</span>
          <span
            className={styles.summaryVal}
            style={{ color: "var(--ci-brand)" }}
          >
            {avg.toFixed(1)}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Peak Season</span>
          <span
            className={styles.summaryVal}
            style={{ color: "var(--ci-accent)" }}
          >
            {max}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Lowest Season</span>
          <span
            className={styles.summaryVal}
            style={{ color: "var(--ci-danger)" }}
          >
            {min}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Seasons</span>
          <span className={styles.summaryVal}>{data.length}</span>
        </div>
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 20, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--ci-brand-dark)" />
                <stop offset="100%" stopColor="var(--ci-accent)" />
              </linearGradient>
            </defs>
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
              domain={["auto", "auto"]}
              tick={{
                fontSize: 9,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine
              y={avg}
              stroke="var(--ci-text-disabled)"
              strokeDasharray="6 4"
              strokeOpacity={0.6}
              label={{
                value: `Avg ${avg.toFixed(0)}`,
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
              type="monotone"
              dataKey="avgScore"
              stroke="url(#trendGrad)"
              strokeWidth={2.5}
              dot={{
                r: 4,
                fill: "var(--ci-bg-secondary)",
                stroke: "var(--ci-brand)",
                strokeWidth: 2,
              }}
              activeDot={{ r: 6, fill: "var(--ci-brand)", strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VenueSeasonTrend;
