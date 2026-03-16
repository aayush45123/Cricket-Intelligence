import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TeamWinsChart = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/matches/teams/leaderboard");
        const result = await res.json();

        const data = result.teams.map((team) => ({
          name: team.team,
          wins: team.wins,
        }));

        setChartData(data);
      } catch (error) {
        console.error("Error fetching team wins", error);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div style={{ width: "100%", height: 350 }}>
      <h3>Team Wins</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="wins" fill="#2e7d32" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TeamWinsChart;
