import React from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import styles from "./CompareRadarChart.module.css";

/* Normalise metric to 0–100 */
const norm = (val, min, max) => {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
};

const CompareRadarChart = ({ dataA, dataB, nameA, nameB }) => {
  const batA = dataA.batting;
  const batB = dataB.batting;
  const bwlA = dataA.bowling;
  const bwlB = dataB.bowling;

  /* Build normalised axes — use the larger of the two as 100% */
  const metrics = [
    {
      label: "Bat SR",
      a: batA
        ? norm(
            batA.strikeRate,
            0,
            Math.max(batA.strikeRate ?? 0, batB?.strikeRate ?? 0, 1),
          )
        : 0,
      b: batB
        ? norm(
            batB.strikeRate,
            0,
            Math.max(batA?.strikeRate ?? 0, batB.strikeRate ?? 0, 1),
          )
        : 0,
    },
    {
      label: "Boundary%",
      a: batA
        ? norm(
            batA.boundaryPercent,
            0,
            Math.max(batA.boundaryPercent ?? 0, batB?.boundaryPercent ?? 0, 1),
          )
        : 0,
      b: batB
        ? norm(
            batB.boundaryPercent,
            0,
            Math.max(batA?.boundaryPercent ?? 0, batB.boundaryPercent ?? 0, 1),
          )
        : 0,
    },
    {
      label: "Runs",
      a: batA
        ? norm(
            batA.totalRuns,
            0,
            Math.max(batA.totalRuns ?? 0, batB?.totalRuns ?? 0, 1),
          )
        : 0,
      b: batB
        ? norm(
            batB.totalRuns,
            0,
            Math.max(batA?.totalRuns ?? 0, batB.totalRuns ?? 0, 1),
          )
        : 0,
    },
    {
      label: "Wickets",
      a: bwlA
        ? norm(
            bwlA.totalWickets,
            0,
            Math.max(bwlA.totalWickets ?? 0, bwlB?.totalWickets ?? 0, 1),
          )
        : 0,
      b: bwlB
        ? norm(
            bwlB.totalWickets,
            0,
            Math.max(bwlA?.totalWickets ?? 0, bwlB.totalWickets ?? 0, 1),
          )
        : 0,
    },
    {
      label: "Bowl Eco",
      /* lower economy = better → invert */
      a: bwlA
        ? norm(
            1 / (bwlA.economy || 1),
            0,
            1 / Math.min(bwlA?.economy || 99, bwlB?.economy || 99),
          )
        : 0,
      b: bwlB
        ? norm(
            1 / (bwlB.economy || 1),
            0,
            1 / Math.min(bwlA?.economy || 99, bwlB?.economy || 99),
          )
        : 0,
    },
    {
      label: "Dot Ball%",
      a:
        (batA ? (batA.dotBallPercent ?? 0) : 0) < 1
          ? 0
          : /* bowling dot ball better */ bwlA
            ? norm(
                bwlA.dotBallPercent ?? 0,
                0,
                Math.max(
                  bwlA?.dotBallPercent ?? 0,
                  bwlB?.dotBallPercent ?? 0,
                  1,
                ),
              )
            : norm(100 - (batA?.dotBallPercent ?? 50), 0, 100),
      b:
        (batB ? (batB.dotBallPercent ?? 0) : 0) < 1
          ? 0
          : bwlB
            ? norm(
                bwlB.dotBallPercent ?? 0,
                0,
                Math.max(
                  bwlA?.dotBallPercent ?? 0,
                  bwlB?.dotBallPercent ?? 0,
                  1,
                ),
              )
            : norm(100 - (batB?.dotBallPercent ?? 50), 0, 100),
    },
  ].map((m) => ({
    metric: m.label,
    [nameA]: parseFloat(m.a.toFixed(1)),
    [nameB]: parseFloat(m.b.toFixed(1)),
  }));

  const shortA = nameA.split(" ").pop();
  const shortB = nameB.split(" ").pop();

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className={styles.tooltip}>
        <span className={styles.tooltipLabel}>{label}</span>
        {payload.map((p) => (
          <div key={p.name} className={styles.tooltipRow}>
            <span
              className={styles.tooltipDot}
              style={{ background: p.color }}
            />
            <span className={styles.tooltipName}>
              {p.name.split(" ").pop()}
            </span>
            <span className={styles.tooltipVal}>{p.value}</span>
          </div>
        ))}
        <span className={styles.tooltipNote}>normalised score /100</span>
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ background: "var(--ci-brand)" }}
          />
          <span>{nameA}</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ background: "var(--ci-accent)" }}
          />
          <span>{nameB}</span>
        </div>
        <span className={styles.legendNote}>
          Values normalised 0–100 relative to each other
        </span>
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={metrics}
            margin={{ top: 16, right: 40, bottom: 16, left: 40 }}
          >
            <PolarGrid
              stroke="var(--ci-border)"
              strokeDasharray="4 4"
              gridType="polygon"
            />
            <PolarAngleAxis
              dataKey="metric"
              tick={{
                fontSize: 11,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />

            <Radar
              name={nameA}
              dataKey={nameA}
              stroke="var(--ci-brand)"
              fill="var(--ci-brand)"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--ci-brand)", strokeWidth: 0 }}
            />
            <Radar
              name={nameB}
              dataKey={nameB}
              stroke="var(--ci-accent)"
              fill="var(--ci-accent)"
              fillOpacity={0.12}
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--ci-accent)", strokeWidth: 0 }}
            />

            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CompareRadarChart;
