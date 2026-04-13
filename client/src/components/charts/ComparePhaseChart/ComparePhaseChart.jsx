import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import styles from "./ComparePhaseChart.module.css";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipPhase}>{label}</span>
      {payload.map((p) => (
        <div key={p.name} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: p.color }} />
          <span className={styles.tooltipName}>{p.name.split(" ").pop()}</span>
          <span className={styles.tooltipVal} style={{ color: p.color }}>
            {p.value}
          </span>
        </div>
      ))}
      <span className={styles.tooltipSub}>Strike Rate</span>
    </div>
  );
};

const ComparePhaseChart = ({ phasesA, phasesB, nameA, nameB }) => {
  const phaseOrder = ["Powerplay", "Middle", "Death"];

  const chartData = phaseOrder.map((phase) => {
    const pA = phasesA?.find((p) => p.phase === phase);
    const pB = phasesB?.find((p) => p.phase === phase);
    return {
      phase,
      [nameA]: pA?.strikeRate ?? 0,
      [nameB]: pB?.strikeRate ?? 0,
    };
  });

  return (
    <div className={styles.wrapper}>
      {/* Phase summary tiles */}
      <div className={styles.tiles}>
        {phaseOrder.map((phase) => {
          const srA = phasesA?.find((p) => p.phase === phase)?.strikeRate ?? 0;
          const srB = phasesB?.find((p) => p.phase === phase)?.strikeRate ?? 0;
          const aWins = srA > srB;
          const bWins = srB > srA;
          const phaseColor =
            phase === "Powerplay"
              ? "var(--ci-brand)"
              : phase === "Middle"
                ? "var(--ci-blue)"
                : "var(--ci-accent)";
          return (
            <div
              key={phase}
              className={styles.tile}
              style={{ borderColor: phaseColor + "33" }}
            >
              <span
                className={styles.tilePhaseDot}
                style={{ background: phaseColor }}
              />
              <span className={styles.tilePhase}>{phase}</span>
              <div className={styles.tileSRs}>
                <span
                  style={{
                    color: aWins ? "var(--ci-brand)" : "var(--ci-text-muted)",
                    fontWeight: aWins ? 700 : 400,
                  }}
                >
                  {srA.toFixed(1)}
                </span>
                <span className={styles.tileSep}>vs</span>
                <span
                  style={{
                    color: bWins ? "var(--ci-accent)" : "var(--ci-text-muted)",
                    fontWeight: bWins ? 700 : 400,
                  }}
                >
                  {srB.toFixed(1)}
                </span>
              </div>
              {aWins && (
                <span
                  className={styles.tileWinner}
                  style={{ color: "var(--ci-brand)" }}
                >
                  {nameA.split(" ").pop()} ↑
                </span>
              )}
              {bWins && (
                <span
                  className={styles.tileWinner}
                  style={{ color: "var(--ci-accent)" }}
                >
                  {nameB.split(" ").pop()} ↑
                </span>
              )}
              {!aWins && !bWins && (
                <span
                  className={styles.tileWinner}
                  style={{ color: "var(--ci-text-disabled)" }}
                >
                  Even
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Grouped bar chart */}
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            barGap={4}
            barCategoryGap="30%"
            margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
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
              label={{
                value: "SR",
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
            <Bar
              dataKey={nameA}
              fill="var(--ci-brand)"
              opacity={0.85}
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey={nameB}
              fill="var(--ci-accent)"
              opacity={0.85}
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComparePhaseChart;
