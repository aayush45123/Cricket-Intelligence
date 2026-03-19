import React from "react";
import { useEffect } from "react";
import { useState } from "react";

const Batsmen = () => {
  const [data, setdata] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/matches/players/bowling-analytics");
        const result = await res.json();
        setBowlers(result.data);
      } catch (fetchError) {
        console.error("Error fetching bowling analytics", fetchError);
        setError("Unable to load bowling analytics right now.");
      }
    };
    fetchData();
  }, []);
  return <div>Batsmen</div>;
};
export default Batsmen;
