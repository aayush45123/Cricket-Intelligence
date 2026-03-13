import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";

const Dashboard = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/matches/analytics");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchData();
  }, []);
  return (
    <div>
      <div>
        <h1>Welcome to the Cricket Intelligence Dashboard</h1>
        <p>
          Explore insights, player statistics, and match analyses to enhance
          your cricket experience.
        </p>
      </div>
      <div>
        <h3>Analytics</h3>
        <h4>Total Matches: {data?.totalMatches || 0}</h4>
        <h4>Average Run Rate Team A: {data.data.averageRunRateTeamA || 0}</h4>
        <h4>Average Run Rate Team B: {data.data.averageRunRateTeamB || 0}</h4>
        <h4>Average Pressure Index: {data.data.averagePressureIndex || 0}</h4>
        <h4>Most Dominant Match: {data.data.mostDominantMatch || "N/A"}</h4>
      </div>
    </div>
  );
};

export default Dashboard;
