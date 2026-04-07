import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./VenueWinSplitChart.module.css";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{d.name}</span>
      <span className={styles.tooltipVal}>{d.value.toFixed(1)}%</span>
      <span className={styles.tooltipWins}>{d.payload.wins} wins</span>
    </div>
  );
};

const VenueWinSplitChart = ({
  battingFirstWinPct,
  chasingWinPct,
  battingFirstWins,
  chasingWins,
}) => {
  const data = [
    {
      name: "Batting First",
      value: battingFirstWinPct,
      wins: battingFirstWins,
      color: "var(--ci-brand)",
    },
    {
      name: "Chasing",
      value: chasingWinPct,
      wins: chasingWins,
      color: "var(--ci-accent)",
    },
  ];

  const dominant =
    battingFirstWinPct > chasingWinPct ? "Batting First" : "Chasing";
  const dominantColor =
    battingFirstWinPct > chasingWinPct ? "var(--ci-brand)" : "var(--ci-accent)";

  return (
    <div className={styles.wrapper}>
      <div className={styles.chartRow}>
        <div className={styles.donut}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius="58%"
                outerRadius="82%"
                startAngle={90}
                endAngle={-270}
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.donutCenter}>
            <span style={{ color: dominantColor }} className={styles.donutPct}>
              {Math.max(battingFirstWinPct, chasingWinPct).toFixed(0)}%
            </span>
            <span className={styles.donutSub}>{dominant}</span>
          </div>
        </div>

        <div className={styles.breakdown}>
          {data.map((d) => (
            <div key={d.name} className={styles.breakItem}>
              <div className={styles.breakTop}>
                <span
                  className={styles.breakDot}
                  style={{ background: d.color }}
                />
                <span className={styles.breakLabel}>{d.name}</span>
                <span className={styles.breakPct} style={{ color: d.color }}>
                  {d.value.toFixed(1)}%
                </span>
              </div>
              <div className={styles.breakBar}>
                <div
                  className={styles.breakFill}
                  style={{ width: `${d.value}%`, background: d.color }}
                />
              </div>
              <span className={styles.breakWins}>{d.wins} wins</span>
            </div>
          ))}

          {/* Verdict */}
          <div className={styles.verdict}>
            {Math.abs(battingFirstWinPct - chasingWinPct) > 15
              ? `Strong advantage for ${dominant.toLowerCase()}.`
              : Math.abs(battingFirstWinPct - chasingWinPct) > 8
                ? `Slight edge for ${dominant.toLowerCase()}.`
                : "Very evenly contested ground."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueWinSplitChart;
