import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import styles from "./TopRunScorer.module.css";
import { API_BASE } from "../../../config";

const TopRunScorer = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/players/top-run-scorers`);
        const result = await res.json();

        const data = result.data.map((player) => ({
          name: player.playerName,
          runs: player.totalRuns,
        }));

        setChartData(data);
      } catch (error) {
        console.error("Error fetching top run scorers", error);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Top Run Scorers</h3>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={Math.max(320, chartData.length * 38)}>
          <BarChart
            layout="vertical"
            data={chartData}
            barCategoryGap="18%"
            margin={{ top: 8, right: 32, left: 10, bottom: 8 }}
          >
            <CartesianGrid
              horizontal={false}
              stroke="var(--ci-border)"
              strokeDasharray="4 4"
            />
            <XAxis
              type="number"
              tick={{
                fontSize: 11,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{
                fontSize: 11,
                fill: "var(--ci-text-primary)",
                fontFamily: "var(--ci-font)",
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--ci-bg-tertiary)" }}
              contentStyle={{
                background: "var(--ci-bg-primary)",
                border: "1px solid var(--ci-border)",
                borderRadius: "var(--ci-radius-sm)",
                fontSize: "0.8rem",
                color: "var(--ci-text-primary)",
                boxShadow: "var(--ci-shadow-sm)",
              }}
              formatter={(val) => [val + " runs", "Runs"]}
            />
            <Bar dataKey="runs" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {chartData.map((entry, index) => {
                const palette = ["#00c896","#06b6d4","#6366f1","#f59e0b","#10b981","#8b5cf6","#ec4899","#3b82f6","#f97316","#14b8a6"];
                return <Cell key={index} fill={palette[index % palette.length]} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopRunScorer;
