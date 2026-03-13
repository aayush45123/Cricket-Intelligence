import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/matches/analytics");
      const result = await response.json();
      setData(result.data); // important
    };

    fetchData();
  }, []);

  if (!data) {
    return <h2>Loading Dashboard...</h2>;
  }
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
        <h4>
          Average Run Rate Team A: {data.averageRunRateTeamA?.toFixed(2) || 0}
        </h4>
        <h4>
          Average Run Rate Team B: {data.averageRunRateTeamB?.toFixed(2) || 0}
        </h4>
        <h4>
          Average Pressure Index: {data.averagePressureIndex?.toFixed(2) || 0}
        </h4>
        <h4>
          Most Dominant Match:
          {data?.mostDominantMatch?.teams?.teamA} vs
          {data?.mostDominantMatch?.teams?.teamB}
        </h4>{" "}
      </div>
    </div>
  );
};

export default Dashboard;
