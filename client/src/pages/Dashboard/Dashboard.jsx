import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";

const Dashboard = () => {
  const [data, setData] = useState();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/dashboard");
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
      <Navbar></Navbar>
      <div>
        <h1>Welcome to the Cricket Intelligence Dashboard</h1>
        <p>
          Explore insights, player statistics, and match analyses to enhance
          your cricket experience.
        </p>
      </div>
      <div></div>
    </div>
  );
};

export default Dashboard;
