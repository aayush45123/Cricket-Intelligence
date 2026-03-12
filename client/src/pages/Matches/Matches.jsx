import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchMatches = async () => {
      const res = await fetch("/api/matches");
      const data = await res.json();
      setMatches(data.data);
    };
    fetchMatches();
  }, []);

  return (
    <div>
      <h3>List of Matches</h3>
      {matches.map((match, index) => {
        return (
          <div key={match._id}>
            <h4>
              {match.teams.teamA.name} vs {match.teams.teamB.name}
            </h4>
            <h4>{match.venue}</h4>
            <h4>{match.format}</h4>
            <p>{match.date}</p>
            <button onClick={() => navigate(`/matches/${match._id}`)}>
              View Details
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Matches;
