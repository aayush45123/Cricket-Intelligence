import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#2e7d32", "#1976d2"];

const TossImpactChart = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchTossImpact = async () => {
      try {
        const res = await fetch("/api/matches/analytics/toss-impact");
        const result = await res.json();

        const data = [
          {
            name: "Bat First Wins",
            value: result.data.batFirstWins,
          },
          {
            name: "Bowl First Wins",
            value: result.data.bowlFirstWins,
          },
        ];

        setChartData(data);
      } catch (error) {
        console.error("Error fetching toss analytics", error);
      }
    };

    fetchTossImpact();
  }, []);

  return (
    <div style={{ width: "100%", height: 350 }}>
      <h3>Toss Decision Impact</h3>

      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            outerRadius={120}
            label
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TossImpactChart;
