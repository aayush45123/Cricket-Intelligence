import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const RunRateChart = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/matches/analytics");
        const result = await res.json();

        const data = [
          {
            name: "Team A",
            runRate: Number(result.data.averageRunRateTeamA.toFixed(2)),
          },
          {
            name: "Team B",
            runRate: Number(result.data.averageRunRateTeamB.toFixed(2)),
          },
        ];

        setChartData(data);
      } catch (error) {
        console.error("Error fetching run rate analytics", error);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div style={{ width: "100%", height: 350 }}>
      <h3>Run Rate Comparison</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="runRate" fill="#1976d2" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RunRateChart;
