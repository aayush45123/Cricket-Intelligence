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

/* ── Normalise each metric to 0–100 (for bar width + radar only)
   Lower economy / higher dot% / lower SR / more wickets = better.
   These scores ONLY drive the visual bar width — raw values are
   always shown as the displayed number.                         */
const normalise = (bowling) => {
  const ecoScore = Math.max(
    0,
    Math.min(100, 100 - ((bowling.economy - 6) / 6) * 100),
  );
  const dotScore = Math.min(100, (bowling.dotBallPercent / 60) * 100);
  const srScore = Math.max(
    0,
    Math.min(100, 100 - ((bowling.strikeRate - 15) / 45) * 100),
  );
  const wktScore = Math.min(100, (bowling.totalWickets / 50) * 100);
  return { ecoScore, dotScore, srScore, wktScore };
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{payload[0].payload.metric}</span>
      <span className={styles.tooltipValue}>{payload[0].value.toFixed(1)}</span>
      <span className={styles.tooltipSub}>Performance Score /100</span>
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

  /* Score tiles:
     - barWidth  = normalised 0–100 score  → drives the bar width only
     - rawValue  = actual real metric       → the number shown to the user  */
  const scoreTiles = [
    {
      label: "Economy",
      rawValue: bowling.economy.toFixed(2),
      note: "runs / over",
      barWidth: ecoScore,
      color:
        ecoScore >= 70
          ? "var(--ci-brand)"
          : ecoScore >= 40
            ? "var(--ci-blue)"
            : "var(--ci-danger)",
    },
    {
      label: "Dot Ball %",
      rawValue: bowling.dotBallPercent.toFixed(1) + "%",
      note: "of deliveries",
      barWidth: dotScore,
      color:
        dotScore >= 70
          ? "var(--ci-brand)"
          : dotScore >= 40
            ? "var(--ci-blue)"
            : "var(--ci-danger)",
    },
    {
      label: "Strike Rate",
      rawValue: bowling.strikeRate > 0 ? bowling.strikeRate.toFixed(1) : "—",
      note: "balls / wicket",
      barWidth: srScore,
      color:
        srScore >= 70
          ? "var(--ci-brand)"
          : srScore >= 40
            ? "var(--ci-blue)"
            : "var(--ci-danger)",
    },
    {
      label: "Wickets",
      rawValue: bowling.totalWickets, // ← always the real wicket count e.g. 4
      note: "total taken",
      barWidth: wktScore, // ← 4/50 * 100 = 8, just moves the bar
      color:
        wktScore >= 70
          ? "var(--ci-brand)"
          : wktScore >= 40
            ? "var(--ci-blue)"
            : "var(--ci-danger)",
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

        <div className={styles.divider} />

        {/* Bar metrics — raw values */}
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
                  width={70}
                  tick={{
                    fontSize: 10,
                    fill: "var(--ci-text-muted)",
                    fontFamily: "var(--ci-font-mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
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

      {/* Performance breakdown — bar = normalised score, number = raw value */}
      <div className={styles.scoreTilesHeader}>
        <span className={styles.scoreTilesTitle}>Performance Breakdown</span>
        <span className={styles.scoreTilesHint}>
          bar width = relative score /100
        </span>
      </div>

      <div className={styles.scoreTiles}>
        {scoreTiles.map((d) => (
          <div className={styles.scoreTile} key={d.label}>
            <div className={styles.scoreTileMeta}>
              <span className={styles.scoreTileLabel}>{d.label}</span>
              <span className={styles.scoreTileNote}>{d.note}</span>
            </div>
            <div className={styles.scoreTileBar}>
              <div
                className={styles.scoreTileFill}
                style={{
                  width: `${Math.max(d.barWidth, 2)}%`,
                  background: d.color,
                }}
              />
            </div>
            {/* This always shows the REAL value — never the normalised score */}
            <span className={styles.scoreTileVal} style={{ color: d.color }}>
              {d.rawValue}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BowlingMetricsChart;
