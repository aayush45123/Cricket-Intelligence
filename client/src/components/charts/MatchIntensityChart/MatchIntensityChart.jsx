import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./MatchIntensityChart.module.css";

const COLORS = ["#1a6b3c", "#1976d2", "#f0a500"];

const MatchIntensityChart = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchMatchIntensity = async () => {
      try {
        const res = await fetch("/api/matches/analytics/match-intensity");
        const result = await res.json();

        const counts = result.data || {};

        const data = [
          { name: "Very Close", value: counts.veryCloseCount || 0 },
          { name: "Competitive", value: counts.competitiveCount || 0 },
          { name: "One Sided", value: counts.oneSidedCount || 0 },
        ];

        setChartData(data);
      } catch (error) {
        console.error("Error fetching match intensity analytics", error);
      }
    };

    fetchMatchIntensity();
  }, []);

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Match Intensity</h3>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              innerRadius={48}
              paddingAngle={3}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--ci-bg-primary)",
                border: "1px solid var(--ci-border)",
                borderRadius: "var(--ci-radius-sm)",
                fontSize: "0.8rem",
                color: "var(--ci-text-primary)",
                boxShadow: "var(--ci-shadow-sm)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MatchIntensityChart;
