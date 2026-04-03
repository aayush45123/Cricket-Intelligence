import React from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import styles from "./BowlingMetricsChart.module.css";

/* Normalise each bowling metric to a 0–100 score for radar display.
   Lower economy / higher dot% / lower SR = better score. */
const normalise = (bowling) => {
  // economy: ideal ≈ 6, terrible ≈ 12+  → score = 100 - clamp((eco-6)/6*100, 0, 100)
  const ecoScore = Math.max(
    0,
    Math.min(100, 100 - ((bowling.economy - 6) / 6) * 100),
  );

  // dotBallPercent: higher = better, max realistic ~60%
  const dotScore = Math.min(100, (bowling.dotBallPercent / 50) * 100);

  // strikeRate: lower = better. ideal ~15, bad ~60+
  const srScore = Math.max(
    0,
    Math.min(100, 100 - ((bowling.strikeRate - 15) / 45) * 100),
  );

  // wickets: relative — we scale 0–30 to 0–100
  const wktScore = Math.min(100, (bowling.totalWickets / 30) * 100);

  return { ecoScore, dotScore, srScore, wktScore };
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{payload[0].payload.metric}</span>
      <span className={styles.tooltipValue}>{payload[0].value.toFixed(1)}</span>
      <span className={styles.tooltipSub}>Normalised Score</span>
    </div>
  );
};

const BarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{payload[0].payload.label}</span>
      <span className={styles.tooltipValue}>{payload[0].value}</span>
    </div>
  );
};

const BowlingMetricsChart = ({ bowling }) => {
  const { ecoScore, dotScore, srScore, wktScore } = normalise(bowling);

  const radarData = [
    { metric: "Economy", score: parseFloat(ecoScore.toFixed(1)) },
    { metric: "Dot Ball %", score: parseFloat(dotScore.toFixed(1)) },
    { metric: "Strike Rate", score: parseFloat(srScore.toFixed(1)) },
    { metric: "Wickets", score: parseFloat(wktScore.toFixed(1)) },
  ];

  const barData = [
    {
      label: "Economy",
      value: parseFloat(bowling.economy.toFixed(2)),
      color: "var(--ci-danger)",
    },
    {
      label: "Bowling SR",
      value: parseFloat(bowling.strikeRate.toFixed(2)),
      color: "var(--ci-accent)",
    },
    {
      label: "Dot Ball %",
      value: parseFloat(bowling.dotBallPercent.toFixed(2)),
      color: "var(--ci-blue)",
    },
  ];

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Bowling Profile</h3>

      <div className={styles.chartsRow}>
        {/* Radar */}
        <div className={styles.radarBlock}>
          <span className={styles.chartLabel}>Skill Radar</span>
          <div className={styles.radarChart}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={radarData}
                margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
              >
                <PolarGrid
                  stroke="var(--ci-border)"
                  strokeDasharray="4 4"
                  gridType="polygon"
                />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{
                    fontSize: 10,
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
                  dataKey="score"
                  stroke="var(--ci-danger)"
                  fill="var(--ci-danger)"
                  fillOpacity={0.12}
                  strokeWidth={1.5}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Bar metrics */}
        <div className={styles.barBlock}>
          <span className={styles.chartLabel}>Raw Metrics</span>
          <div className={styles.barChart}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 0, right: 8, bottom: 0, left: 16 }}
                barCategoryGap="28%"
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="var(--ci-border)"
                  strokeDasharray="4 4"
                />
                <XAxis
                  type="number"
                  tick={{
                    fontSize: 10,
                    fill: "var(--ci-text-muted)",
                    fontFamily: "var(--ci-font-mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, "auto"]}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{
                    fontSize: 10,
                    fill: "var(--ci-text-muted)",
                    fontFamily: "var(--ci-font-mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  content={<BarTooltip />}
                  cursor={{ fill: "var(--ci-bg-tertiary)" }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {barData.map((d) => (
                    <Cell key={d.label} fill={d.color} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Score tiles */}
      <div className={styles.scoreTiles}>
        {radarData.map((d) => {
          const pct = d.score;
          const color =
            pct >= 70
              ? "var(--ci-brand)"
              : pct >= 40
                ? "var(--ci-blue)"
                : "var(--ci-danger)";
          return (
            <div className={styles.scoreTile} key={d.metric}>
              <span className={styles.scoreTileLabel}>{d.metric}</span>
              <div className={styles.scoreTileBar}>
                <div
                  className={styles.scoreTileFill}
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <span className={styles.scoreTileVal} style={{ color }}>
                {pct.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BowlingMetricsChart;
