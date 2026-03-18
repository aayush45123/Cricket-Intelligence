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
import styles from "./HighestWicketTaker.module.css";

const HighestWicketTaker = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/matches/players/highest-wicket-takers");
        const result = await res.json();

        const data = result.data
          .sort((a, b) => b.totalWickets - a.totalWickets       )
          .map((player) => ({
            name: player.playerName,
            runs: player.totalWickets,
          }));

        setChartData(data);
      } catch (error) {
        console.error("Error fetching highest wicket takers", error);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Top Wicket Takers</h3>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            barCategoryGap="35%"
            margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--ci-border)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="name"
              tick={{
                fontSize: 11,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{
                fontSize: 11,
                fill: "var(--ci-text-muted)",
                fontFamily: "var(--ci-font)",
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
            />
            <Bar dataKey="runs" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    index % 2 === 0 ? "var(--ci-brand)" : "var(--ci-brand-dark)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HighestWicketTaker;
