import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./MatchSetup.module.css";

const MatchSetup = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    teamA: "",
    teamB: "",
    playersA: "",
    playersB: "",
    totalOvers: 20,
    venue: "",
  });

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      playersA: form.playersA.split(",").map((p) => p.trim()),
      playersB: form.playersB.split(",").map((p) => p.trim()),
    };

    const res = await authFetch("/api/user-matches", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      navigate(`/my-matches/${res.data.data._id}/score`);
    }
  };

  return (
    <div className={styles.page}>
      <h1>Create Match</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          name="teamA"
          placeholder="Team A"
          value={form.teamA}
          onChange={update}
          required
        />

        <input
          name="teamB"
          placeholder="Team B"
          value={form.teamB}
          onChange={update}
          required
        />

        <textarea
          name="playersA"
          placeholder="Players Team A (comma separated)"
          value={form.playersA}
          onChange={update}
        />

        <textarea
          name="playersB"
          placeholder="Players Team B (comma separated)"
          value={form.playersB}
          onChange={update}
        />

        <input
          type="number"
          name="totalOvers"
          value={form.totalOvers}
          onChange={update}
        />

        <input
          name="venue"
          placeholder="Venue"
          value={form.venue}
          onChange={update}
        />

        <button type="submit">Start Match</button>
      </form>
    </div>
  );
};

export default MatchSetup;
