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
  Area,
  ComposedChart,
} from "recharts";
import styles from "./WormChart.module.css";

/* Merge innings1 and innings2 data by over number */
const mergeData = (innings1, innings2) => {
  const maxOver = Math.max(
    innings1[innings1.length - 1]?.over ?? 0,
    innings2[innings2.length - 1]?.over ?? 0,
  );
  const result = [];
  for (let ov = 1; ov <= maxOver; ov++) {
    const i1 = innings1.find((d) => d.over === ov);
    const i2 = innings2.find((d) => d.over === ov);
    result.push({
      over: ov,
      inn1: i1?.cumulative ?? null,
      inn2: i2?.cumulative ?? null,
      inn1Over: i1?.thisOver ?? null,
      inn2Over: i2?.thisOver ?? null,
    });
  }
  return result;
};

const CustomTooltip = ({ active, payload, label, team1, team2 }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipOver}>Over {label}</span>
      {payload.map((p) => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: p.color }} />
          <span className={styles.tooltipTeam}>
            {p.dataKey === "inn1" ? team1 : team2}
          </span>
          <span className={styles.tooltipVal}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const WormChart = ({ innings1, innings2, team1, team2, target }) => {
  const chartData = mergeData(innings1, innings2);

  return (
    <div className={styles.wrapper}>
      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span
            className={styles.legendLine}
            style={{ background: "var(--ci-brand)" }}
          />
          <span className={styles.legendLabel}>{team1} (Inn 1)</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendLine}
            style={{ background: "var(--ci-accent)", borderStyle: "dashed" }}
          />
          <span className={styles.legendLabel}>{team2} (Inn 2)</span>
        </div>
        {target > 0 && (
          <div className={styles.legendItem}>
            <span
              className={styles.legendLine}
              style={{ background: "var(--ci-text-muted)", opacity: 0.5 }}
            />
            <span className={styles.legendLabel}>Target ({target})</span>
          </div>
        )}
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 20, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="inn1Grad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--ci-brand)"
                  stopOpacity={0.18}
                />
                <stop
                  offset="100%"
                  stopColor="var(--ci-brand)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="inn2Grad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--ci-accent)"
                  stopOpacity={0.14}
                />
                <stop
                  offset="100%"
                  stopColor="var(--ci-accent)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="var(--ci-border)"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="over"
              label={{
                value: "Overs",
                position: "insideBottomRight",
                offset: -8,
                fill: "var(--ci-text-muted)",
                fontSize: 10,
                fontFamily: "var(--ci-font-mono)",
              }}
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

            {/* Target reference line */}
            {target > 0 && (
              <ReferenceLine
                y={target - 1}
                stroke="var(--ci-text-muted)"
                strokeDasharray="8 4"
                strokeOpacity={0.4}
                label={{
                  value: `Target ${target}`,
                  position: "right",
                  fill: "var(--ci-text-muted)",
                  fontSize: 9,
                  fontFamily: "var(--ci-font-mono)",
                }}
              />
            )}

            <Tooltip
              content={(props) => (
                <CustomTooltip {...props} team1={team1} team2={team2} />
              )}
              cursor={{ stroke: "var(--ci-border-medium)", strokeWidth: 1 }}
            />

            {/* Inn 1 area + line */}
            <Area
              type="monotone"
              dataKey="inn1"
              stroke="var(--ci-brand)"
              strokeWidth={2.5}
              fill="url(#inn1Grad)"
              dot={false}
              connectNulls
              activeDot={{ r: 4, fill: "var(--ci-brand)", strokeWidth: 0 }}
            />

            {/* Inn 2 area + line */}
            <Area
              type="monotone"
              dataKey="inn2"
              stroke="var(--ci-accent)"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              fill="url(#inn2Grad)"
              dot={false}
              connectNulls
              activeDot={{ r: 4, fill: "var(--ci-accent)", strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Per-over run breakdown */}
      <div className={styles.overGrid}>
        <div className={styles.overGridHeader}>
          <span>Over</span>
          <span style={{ color: "var(--ci-brand)" }}>{team1}</span>
          <span style={{ color: "var(--ci-accent)" }}>{team2}</span>
        </div>
        <div className={styles.overGridBody}>
          {chartData.map((d) => (
            <div key={d.over} className={styles.overRow}>
              <span className={styles.overNum}>{d.over}</span>
              <span
                className={`${styles.overRuns} ${d.inn1Over >= 15 ? styles.bigOver : ""}`}
              >
                {d.inn1Over != null ? `+${d.inn1Over}` : "—"}
              </span>
              <span
                className={`${styles.overRuns} ${d.inn2Over >= 15 ? styles.bigOver : ""}`}
                style={{ color: "var(--ci-accent)" }}
              >
                {d.inn2Over != null ? `+${d.inn2Over}` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WormChart;
