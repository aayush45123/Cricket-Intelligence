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
import styles from "./VenuescoredistributionChart.module.css";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipRange}>{label}</span>
      <span className={styles.tooltipCount}>{payload[0].value}</span>
      <span className={styles.tooltipSub}>innings</span>
    </div>
  );
};

const VenueScoreDistribution = ({ data }) => {
  const maxCount = Math.max(...data.map((d) => d.count));
  const totalInnings = data.reduce((s, d) => s + d.count, 0);
  const mostCommon = data.find((d) => d.count === maxCount);

  return (
    <div className={styles.wrapper}>
      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Most Common Range</span>
          <span className={styles.metaVal} style={{ color: "var(--ci-brand)" }}>
            {mostCommon?.range}
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Total 1st Innings</span>
          <span className={styles.metaVal}>{totalInnings}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Score Bands</span>
          <span className={styles.metaVal}>{data.length}</span>
        </div>
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barCategoryGap="18%"
            margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
          >
            <CartesianGrid
              stroke="var(--ci-border)"
              strokeDasharray="4 4"
              vertical={false}
            />
            <XAxis
              dataKey="range"
              tick={{
                fontSize: 9,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
              angle={-35}
              textAnchor="end"
              height={40}
            />
            <YAxis
              tick={{
                fontSize: 9,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Innings",
                angle: -90,
                position: "insideLeft",
                fill: "var(--ci-text-muted)",
                fontSize: 9,
                fontFamily: "var(--ci-font-mono)",
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--ci-bg-tertiary)" }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.count === maxCount
                      ? "var(--ci-brand)"
                      : d.count >= maxCount * 0.7
                        ? "var(--ci-brand-dark)"
                        : "var(--ci-bg-quaternary)"
                  }
                  stroke={
                    d.count === maxCount ? "var(--ci-brand)" : "transparent"
                  }
                  strokeWidth={1}
                  opacity={0.9}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VenueScoreDistribution;
