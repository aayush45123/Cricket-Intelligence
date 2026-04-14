import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import styles from "./RunRateByOverChart.module.css";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipOver}>Over {label}</span>
      <div className={styles.tooltipRow}>
        <span
          className={styles.tooltipDot}
          style={{ background: "var(--ci-accent)" }}
        />
        <span className={styles.tooltipKey}>Run Rate</span>
        <span
          className={styles.tooltipVal}
          style={{ color: "var(--ci-accent)" }}
        >
          {d.runRate}
        </span>
      </div>
      <div className={styles.tooltipRow}>
        <span
          className={styles.tooltipDot}
          style={{ background: "var(--ci-blue)" }}
        />
        <span className={styles.tooltipKey}>Avg Runs</span>
        <span className={styles.tooltipVal}>{d.avgRuns}</span>
      </div>
    </div>
  );
};

const RunRateByOverChart = ({ data }) => {
  const avgRR = data.reduce((s, d) => s + d.runRate, 0) / (data.length || 1);

  /* Phase background zones */
  const ppEnd = data.find((d) => d.over === 6);
  const midEnd = data.find((d) => d.over === 15);

  return (
    <div className={styles.wrapper}>
      <div className={styles.zoneLegend}>
        <div className={styles.zoneItem}>
          <span
            className={styles.zoneDot}
            style={{ background: "var(--ci-brand)" }}
          />
          <span>Powerplay (1–6)</span>
        </div>
        <div className={styles.zoneItem}>
          <span
            className={styles.zoneDot}
            style={{ background: "var(--ci-blue)" }}
          />
          <span>Middle (7–15)</span>
        </div>
        <div className={styles.zoneItem}>
          <span
            className={styles.zoneDot}
            style={{ background: "var(--ci-accent)" }}
          />
          <span>Death (16–20)</span>
        </div>
        <span className={styles.avgLabel}>Avg RR: {avgRR.toFixed(2)}</span>
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="rrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--ci-accent)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="100%"
                  stopColor="var(--ci-accent)"
                  stopOpacity={0.02}
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
              tick={{
                fontSize: 9,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
            />

            {/* Phase separators */}
            <ReferenceLine
              x={6}
              stroke="var(--ci-brand-dim)"
              strokeDasharray="4 3"
              strokeOpacity={0.5}
              label={{
                value: "PP End",
                position: "top",
                fill: "var(--ci-brand)",
                fontSize: 8,
                fontFamily: "var(--ci-font-mono)",
              }}
            />
            <ReferenceLine
              x={15}
              stroke="var(--ci-blue)"
              strokeDasharray="4 3"
              strokeOpacity={0.4}
              label={{
                value: "Mid End",
                position: "top",
                fill: "var(--ci-blue)",
                fontSize: 8,
                fontFamily: "var(--ci-font-mono)",
              }}
            />
            {/* Average RR */}
            <ReferenceLine
              y={avgRR}
              stroke="var(--ci-text-disabled)"
              strokeDasharray="6 4"
              strokeOpacity={0.7}
              label={{
                value: `Avg ${avgRR.toFixed(1)}`,
                position: "right",
                fill: "var(--ci-text-muted)",
                fontSize: 8,
                fontFamily: "var(--ci-font-mono)",
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--ci-border-medium)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="runRate"
              stroke="var(--ci-accent)"
              strokeWidth={2.5}
              fill="url(#rrGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "var(--ci-accent)", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RunRateByOverChart;
