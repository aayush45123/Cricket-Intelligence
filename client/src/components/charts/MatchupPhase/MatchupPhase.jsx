import React from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./MatchupPhase.module.css";

const PHASE_COLORS = {
  Powerplay: "var(--ci-brand)",
  Middle: "var(--ci-blue)",
  Death: "var(--ci-accent)",
};

const MatchupPhase = ({ data }) => {
  // Normalise SR to 0-100 (200 SR = 100%)
  const radarData = data.map((p) => ({
    phase: p.phase,
    SR: Math.min(100, parseFloat(((p.strikeRate / 200) * 100).toFixed(1))),
    rawSR: p.strikeRate,
    runs: p.runs,
    balls: p.balls,
    dismissals: p.dismissals,
  }));

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <div className={styles.radar}>
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
                dataKey="phase"
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
                dataKey="SR"
                stroke="var(--ci-brand)"
                fill="var(--ci-brand)"
                fillOpacity={0.15}
                strokeWidth={2}
                dot={{ r: 4, fill: "var(--ci-brand)", strokeWidth: 0 }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--ci-bg-primary)",
                  border: "1px solid var(--ci-border-medium)",
                  borderRadius: "var(--ci-radius-sm)",
                  fontFamily: "var(--ci-font-mono)",
                  fontSize: "0.72rem",
                  color: "var(--ci-text-primary)",
                }}
                formatter={(v, n, props) => [
                  `SR: ${props.payload.rawSR}`,
                  props.payload.phase,
                ]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.phaseList}>
          {data.map((p) => {
            const color = PHASE_COLORS[p.phase] || "var(--ci-text-muted)";
            return (
              <div key={p.phase} className={styles.phaseItem}>
                <div className={styles.phaseTop}>
                  <span
                    className={styles.phaseDot}
                    style={{ background: color }}
                  />
                  <span className={styles.phaseLabel}>{p.phase}</span>
                  <span className={styles.phaseSR} style={{ color }}>
                    {p.strikeRate}
                  </span>
                </div>
                <div className={styles.phaseMeta}>
                  <span>{p.runs}r</span>
                  <span>·</span>
                  <span>{p.balls}b</span>
                  {p.dismissals > 0 && (
                    <>
                      <span>·</span>
                      <span style={{ color: "var(--ci-danger)" }}>
                        {p.dismissals}w
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MatchupPhase;
