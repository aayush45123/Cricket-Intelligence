import React, { useState } from "react";
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
import styles from "./WinProbabilityChart.module.css";

const CustomTooltip = ({ active, payload, team }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipBall}>Ball {d.label}</span>
      <div className={styles.tooltipProbRow}>
        <span className={styles.tooltipTeam}>{team}</span>
        <span
          className={styles.tooltipProb}
          style={{
            color: d.prob >= 50 ? "var(--ci-brand)" : "var(--ci-danger)",
          }}
        >
          {d.prob.toFixed(1)}%
        </span>
      </div>
      <div className={styles.tooltipMeta}>
        <span>{d.runs} runs</span>
        <span className={styles.tooltipDot}>·</span>
        <span>{d.wickets} wkts</span>
        <span className={styles.tooltipDot}>·</span>
        <span>Need {d.runsNeeded}</span>
      </div>
    </div>
  );
};

const sampleData = (data, maxPoints = 60) => {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0 || i === data.length - 1);
};

const WinProbabilityChart = ({ data, team, target }) => {
  const [showFull, setShowFull] = useState(false);
  const chartData = showFull ? data : sampleData(data);

  const swings = data.reduce((acc, d, i) => {
    if (i === 0) return acc;
    const delta = Math.abs(d.prob - data[i - 1].prob);
    if (delta >= 15) acc.push({ ...d, delta: delta.toFixed(1) });
    return acc;
  }, []);

  const finalProb = data[data.length - 1]?.prob ?? 50;
  const teamWon = finalProb >= 50;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.teamChasing}>
            {team} chasing {target}
          </span>
          <div className={styles.finalProb}>
            <span
              style={{
                color: teamWon ? "var(--ci-brand)" : "var(--ci-danger)",
              }}
            >
              {finalProb.toFixed(0)}%
            </span>
            <span className={styles.finalProbSub}>final probability</span>
          </div>
        </div>
        <button
          className={styles.sampleToggle}
          onClick={() => setShowFull((v) => !v)}
        >
          {showFull ? "← Sampled" : "Full Detail →"} ({data.length} balls)
        </button>
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="wpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--ci-blue)"
                  stopOpacity={0.28}
                />
                <stop
                  offset="50%"
                  stopColor="var(--ci-blue)"
                  stopOpacity={0.08}
                />
                <stop
                  offset="100%"
                  stopColor="var(--ci-blue)"
                  stopOpacity={0.01}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="var(--ci-border)"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              tick={{
                fontSize: 9,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              label={{
                value: "Over.Ball",
                position: "insideBottomRight",
                offset: -4,
                fill: "var(--ci-text-muted)",
                fontSize: 9,
                fontFamily: "var(--ci-font-mono)",
              }}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{
                fontSize: 9,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font-mono)",
              }}
              axisLine={false}
              tickLine={false}
            />

            {/* Bands */}
            <ReferenceLine
              y={75}
              stroke="var(--ci-brand)"
              strokeOpacity={0.12}
              strokeDasharray="4 4"
            />
            <ReferenceLine
              y={50}
              stroke="var(--ci-text-disabled)"
              strokeDasharray="8 4"
              strokeOpacity={0.7}
              label={{
                value: "50% — even",
                position: "right",
                fill: "var(--ci-text-muted)",
                fontSize: 9,
                fontFamily: "var(--ci-font-mono)",
              }}
            />
            <ReferenceLine
              y={25}
              stroke="var(--ci-danger)"
              strokeOpacity={0.12}
              strokeDasharray="4 4"
            />

            <Tooltip
              content={(props) => <CustomTooltip {...props} team={team} />}
              cursor={{ stroke: "var(--ci-border-medium)", strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="prob"
              stroke="var(--ci-blue)"
              strokeWidth={2.5}
              fill="url(#wpGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "var(--ci-blue)", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Zone legend */}
      <div className={styles.zoneLegend}>
        <div className={styles.zoneItem}>
          <span
            className={styles.zoneDot}
            style={{ background: "var(--ci-brand)" }}
          />
          <span>75–100% Dominant</span>
        </div>
        <div className={styles.zoneItem}>
          <span
            className={styles.zoneDot}
            style={{ background: "var(--ci-blue)" }}
          />
          <span>50–75% Ahead</span>
        </div>
        <div className={styles.zoneItem}>
          <span
            className={styles.zoneDot}
            style={{ background: "var(--ci-accent)" }}
          />
          <span>25–50% Behind</span>
        </div>
        <div className={styles.zoneItem}>
          <span
            className={styles.zoneDot}
            style={{ background: "var(--ci-danger)" }}
          />
          <span>0–25% Critical</span>
        </div>
      </div>

      {/* Major swings */}
      {swings.length > 0 && (
        <div className={styles.swingsBlock}>
          <span className={styles.swingsTitle}>Major Probability Swings</span>
          <div className={styles.swingsList}>
            {swings.slice(0, 5).map((s, i) => (
              <div key={i} className={styles.swingItem}>
                <span className={styles.swingBall}>Ball {s.label}</span>
                <span className={styles.swingDelta}>±{s.delta}%</span>
                <div className={styles.swingBar}>
                  <div
                    className={styles.swingFill}
                    style={{
                      width: `${s.prob}%`,
                      background:
                        s.prob >= 50 ? "var(--ci-brand)" : "var(--ci-danger)",
                    }}
                  />
                </div>
                <span
                  className={styles.swingProb}
                  style={{
                    color:
                      s.prob >= 50 ? "var(--ci-brand)" : "var(--ci-danger)",
                  }}
                >
                  {s.prob.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WinProbabilityChart;
