/* ── InningsBreak.jsx ───────────────────────────────────────── */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./InningsBreak.module.css";

const InningsBreak = () => {
  const { matchId } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [striker, setStriker] = useState("");
  const [nonStr, setNonStr] = useState("");
  const [bowler, setBowler] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const { ok, data } = await authFetch(`/api/live/${matchId}/state`);
      if (ok) {
        setMatch(data.data.match);
        const chasing = data.data.match.innings2.battingTeam;
        const pl =
          chasing === data.data.match.teamA
            ? data.data.match.playersA
            : data.data.match.playersB;
        const bw =
          chasing === data.data.match.teamA
            ? data.data.match.playersB
            : data.data.match.playersA;
        setStriker(pl[0] || "");
        setNonStr(pl[1] || "");
        setBowler(bw[0] || "");
      }
      setLoading(false);
    })();
  }, [matchId, authFetch]);

  const handleStart = async () => {
    if (!striker || !nonStr || !bowler) {
      setError("All three fields required");
      return;
    }
    setSaving(true);
    const { ok, data } = await authFetch(`/api/live/${matchId}/innings-break`, {
      method: "PATCH",
      body: JSON.stringify({ striker, nonStriker: nonStr, bowler }),
    });
    setSaving(false);
    if (!ok) {
      setError(data.message);
      return;
    }
    navigate(`/my-matches/${matchId}/score`);
  };

  if (loading)
    return (
      <div className={styles.loading}>
        <div className={styles.ring} />
      </div>
    );
  if (!match) return <p className={styles.err}>Match not found.</p>;

  const inn1 = match.innings1;
  const chasing = match.innings2.battingTeam;
  const target = inn1.runs + 1;
  const chasingPl = chasing === match.teamA ? match.playersA : match.playersB;
  const bowlingPl = chasing === match.teamA ? match.playersB : match.playersA;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Innings Break</span>
          <h1 className={styles.title}>Innings 2</h1>
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>
              {inn1.battingTeam} scored
            </span>
            <span
              className={styles.summaryVal}
              style={{ color: "var(--ci-accent)" }}
            >
              {inn1.runs}/{inn1.wickets}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{chasing} need</span>
            <span
              className={styles.summaryVal}
              style={{ color: "var(--ci-brand)" }}
            >
              {target} to win
            </span>
          </div>
        </div>

        {error && <p className={styles.err}>{error}</p>}

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label}>Opening striker ({chasing})</label>
            <select
              className={styles.sel}
              value={striker}
              onChange={(e) => setStriker(e.target.value)}
            >
              {(chasingPl || []).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Non-striker ({chasing})</label>
            <select
              className={styles.sel}
              value={nonStr}
              onChange={(e) => setNonStr(e.target.value)}
            >
              {(chasingPl || [])
                .filter((p) => p !== striker)
                .map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Opening bowler ({inn1.battingTeam})
            </label>
            <select
              className={styles.sel}
              value={bowler}
              onChange={(e) => setBowler(e.target.value)}
            >
              {(bowlingPl || []).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className={styles.btn} onClick={handleStart} disabled={saving}>
          {saving ? "Starting..." : "Start Innings 2 →"}
        </button>
      </div>
    </div>
  );
};

export default InningsBreak;
