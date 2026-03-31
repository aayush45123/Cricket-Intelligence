import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./TossImpactChart.module.css";

const COLORS = ["#1a6b3c", "#f0a500"];

const TossImpactChart = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchTossImpact = async () => {
      try {
        const res = await fetch("/api/matches/analytics/toss-impact");
        const result = await res.json();

        const data = [
          { name: "Bat First Wins", value: result.data?.batFirstWins || 0 },
          { name: "Bowl First Wins", value: result.data?.bowlFirstWins || 0 },
        ];

        setChartData(data);
      } catch (error) {
        console.error("Error fetching toss analytics", error);
      }
    };

    fetchTossImpact();
  }, []);

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Toss Decision Impact</h3>
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

export default TossImpactChart;
