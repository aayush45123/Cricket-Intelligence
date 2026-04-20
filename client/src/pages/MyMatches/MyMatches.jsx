import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./MyMatches.module.css";

const MyMatches = () => {
  const { authFetch } = useAuth();
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    const res = await authFetch("/api/user-matches");
    if (res.ok) setMatches(res.data.data);
  };

  const getStatusColor = (status) => {
    if (status === "live") return "#00ffae";
    if (status === "completed") return "#888";
    if (status === "innings_break") return "#ffcc00";
    return "#aaa";
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>My Matches</h1>

        <button
          className={styles.newBtn}
          onClick={() => navigate("/my-matches/new")}
        >
          + New Match
        </button>
      </div>

      <div className={styles.grid}>
        {matches.map((m) => (
          <div key={m._id} className={styles.card}>
            <h3>
              {m.teamA} vs {m.teamB}
            </h3>

            <p className={styles.meta}>
              {new Date(m.matchDate).toLocaleDateString()}
            </p>

            <p
              className={styles.status}
              style={{ color: getStatusColor(m.status) }}
            >
              {m.status.toUpperCase()}
            </p>

            {/* SCORE */}
            <div className={styles.score}>
              {m.innings1.runs}/{m.innings1.wickets}
            </div>

            <div className={styles.actions}>
              {m.status !== "completed" ? (
                <button onClick={() => navigate(`/my-matches/${m._id}/score`)}>
                  Resume
                </button>
              ) : (
                <button onClick={() => navigate(`/my-matches/${m._id}/result`)}>
                  View Result
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyMatches;
