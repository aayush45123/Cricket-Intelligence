import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#2e7d32", "#1976d2", "#fbc02d"];

const MatchIntensityChart = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchMatchIntensity = async () => {
      try {
        const res = await fetch("/api/matches/analytics/match-intensity");
        const result = await res.json();

        const data = [
          {
            name: "Very Close Matches",
            value: result.data.veryCloseCount,
          },
          {
            name: "Competitive Matches",
            value: result.data.competitiveCount,
          },
          {
            name: "One Sided Matches",
            value: result.data.oneSidedCount,
          },
        ];

        setChartData(data);
      } catch (error) {
        console.error("Error fetching match intensity analytics", error);
      }
    };

    fetchMatchIntensity();
  }, []);

  return (
    <div style={{ width: "100%", height: "350px" }}>
      <h3>Match Intensity</h3>

      <ResponsiveContainer width="100%" height={300}>
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

export default MatchIntensityChart;
