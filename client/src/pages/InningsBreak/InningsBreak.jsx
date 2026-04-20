import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./InningsBreak.module.css";

const InningsBreak = () => {
  const { matchId } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");

  useEffect(() => {
    const fetchMatch = async () => {
      const { ok, data } = await authFetch(`/api/live/${matchId}/state`);
      if (ok) setMatch(data.data.match);
      setLoading(false);
    };
    fetchMatch();
  }, [matchId]);

  const startSecondInnings = async () => {
    const { ok } = await authFetch(`/api/live/${matchId}/innings-break`, {
      method: "PATCH",
      body: JSON.stringify({ striker, nonStriker, bowler }),
    });

    if (ok) navigate(`/my-matches/${matchId}/score`);
  };

  if (loading) return <div>Loading...</div>;
  if (!match) return <div>Match not found</div>;

  const target = match.innings1.runs + 1;

  return (
    <div className={styles.page}>
      <h1>🏏 Innings Break</h1>

      <div className={styles.summary}>
        <h2>{match.innings1.battingTeam}</h2>
        <p>
          {match.innings1.runs}/{match.innings1.wickets}
        </p>
        <p>Overs: {match.innings1.overs}</p>
      </div>

      <div className={styles.target}>
        🎯 Target: <strong>{target}</strong>
      </div>

      <div className={styles.setup}>
        <h3>Start 2nd Innings</h3>

        <input
          placeholder="Striker"
          value={striker}
          onChange={(e) => setStriker(e.target.value)}
        />

        <input
          placeholder="Non Striker"
          value={nonStriker}
          onChange={(e) => setNonStriker(e.target.value)}
        />

        <input
          placeholder="Bowler"
          value={bowler}
          onChange={(e) => setBowler(e.target.value)}
        />

        <button onClick={startSecondInnings}>Start Innings 2 🚀</button>
      </div>
    </div>
  );
};

export default InningsBreak;
