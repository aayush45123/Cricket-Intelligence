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
  ReferenceLine,
  Cell,
} from "recharts";
import styles from "./MomentumChart.module.css";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipOver}>Over {label}</span>
      <div className={styles.tooltipRows}>
        {payload.map((p) => (
          <div key={p.dataKey} className={styles.tooltipRow}>
            <span
              className={styles.tooltipDot}
              style={{ background: p.color }}
            />
            <span className={styles.tooltipKey}>{p.name}</span>
            <span className={styles.tooltipVal}>
              {typeof p.value === "number"
                ? p.value.toFixed(p.dataKey === "runRate" ? 1 : 0)
                : p.value}
            </span>
          </div>
        ))}
        {d.wickets > 0 && (
          <div className={styles.tooltipWicket}>
            💥 {d.wickets} wicket{d.wickets > 1 ? "s" : ""} in this over
          </div>
        )}
        {d.isBigOver && <div className={styles.tooltipBig}>🔥 Big over!</div>}
      </div>
    </div>
  );
};

/* Merge both innings for "both" view with a separator gap */
const mergeInnings = (inn1, inn2) => {
  const maxOver = Math.max(inn1.length, inn2.length, 20);
  return [
    ...inn1.map((d) => ({ ...d, inningsId: 1 })),
    { over: "—", runs: null, runRate: null, wickets: null, isSeparator: true },
    ...inn2.map((d) => ({ ...d, inningsId: 2, over: `(2) ${d.over}` })),
  ];
};

const MomentumChart = ({ innings1, innings2, team1, team2, activeInnings }) => {
  const chartData =
    activeInnings === "1"
      ? innings1.map((d) => ({ ...d, inningsId: 1 }))
      : activeInnings === "2"
        ? innings2.map((d) => ({ ...d, inningsId: 2 }))
        : mergeInnings(innings1, innings2);

  // Average run rates
  const avg1 =
    innings1.reduce((s, d) => s + d.runRate, 0) / (innings1.length || 1);
  const avg2 =
    innings2.reduce((s, d) => s + d.runRate, 0) / (innings2.length || 1);
  const showAvg = activeInnings !== "both";
  const avgRR =
    activeInnings === "1" ? avg1 : activeInnings === "2" ? avg2 : null;

  return (
    <div className={styles.wrapper}>
      {/* Summary strip */}
      <div className={styles.summaryStrip}>
        <div className={styles.summaryItem}>
          <span
            className={styles.summaryLabel}
            style={{ color: "var(--ci-brand)" }}
          >
            {team1}
          </span>
          <span className={styles.summaryVal}>Avg RR: {avg1.toFixed(2)}</span>
          <span className={styles.summaryVal}>
            Big overs: {innings1.filter((d) => d.isBigOver).length}
          </span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span
            className={styles.summaryLabel}
            style={{ color: "var(--ci-accent)" }}
          >
            {team2}
          </span>
          <span className={styles.summaryVal}>Avg RR: {avg2.toFixed(2)}</span>
          <span className={styles.summaryVal}>
            Big overs: {innings2.filter((d) => d.isBigOver).length}
          </span>
        </div>
      </div>

      {/* Main chart */}
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
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
              label={{
                value: "Runs",
                angle: -90,
                position: "insideLeft",
                fill: "var(--ci-text-muted)",
                fontSize: 9,
                fontFamily: "var(--ci-font-mono)",
              }}
            />
            <YAxis
              yAxisId="rr"
              orientation="right"
              tickFormatter={(v) => v.toFixed(1)}
              tick={{
                fontSize: 9,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "RR",
                angle: 90,
                position: "insideRight",
                fill: "var(--ci-text-muted)",
                fontSize: 9,
                fontFamily: "var(--ci-font-mono)",
              }}
            />

            {showAvg && (
              <ReferenceLine
                yAxisId="rr"
                y={avgRR}
                stroke="var(--ci-text-muted)"
                strokeDasharray="6 4"
                strokeOpacity={0.5}
                label={{
                  value: `Avg ${avgRR?.toFixed(2)}`,
                  position: "right",
                  fill: "var(--ci-text-muted)",
                  fontSize: 9,
                  fontFamily: "var(--ci-font-mono)",
                }}
              />
            )}

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--ci-bg-tertiary)" }}
            />

            {/* Runs bars — coloured by innings + special on big/wicket overs */}
            <Bar
              yAxisId="runs"
              dataKey="runs"
              name="Runs"
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            >
              {chartData.map((d, i) => {
                if (d.isSeparator) return <Cell key={i} fill="transparent" />;
                const base =
                  d.inningsId === 1 ? "var(--ci-brand)" : "var(--ci-accent)";
                const fill = d.isWicketOver
                  ? "var(--ci-danger)"
                  : d.isBigOver
                    ? "var(--ci-blue)"
                    : base;
                return <Cell key={i} fill={fill} opacity={0.85} />;
              })}
            </Bar>

            {/* Run rate line */}
            <Line
              yAxisId="rr"
              type="monotone"
              dataKey="runRate"
              name="Run Rate"
              stroke="var(--ci-text-muted)"
              strokeWidth={1.5}
              dot={false}
              connectNulls
              activeDot={{
                r: 3,
                fill: "var(--ci-text-secondary)",
                strokeWidth: 0,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "var(--ci-brand)" }}
          />
          <span>{team1} (Inn 1)</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "var(--ci-accent)" }}
          />
          <span>{team2} (Inn 2)</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "var(--ci-danger)" }}
          />
          <span>Wicket Over</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "var(--ci-blue)" }}
          />
          <span>Big Over (15+)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendLine} />
          <span>Run Rate</span>
        </div>
      </div>
    </div>
  );
};

export default MomentumChart;
