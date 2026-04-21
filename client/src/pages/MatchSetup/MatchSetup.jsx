import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./MatchSetup.module.css";

const DEFAULT_PLAYERS = 11;

const makePlayers = (teamName, count) =>
  Array.from({ length: count }, (_, i) => `${teamName} Player ${i + 1}`);

const MatchSetup = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=teams, 2=players, 3=toss+openers
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /* Step 1 */
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [totalOvers, setTotalOvers] = useState(20);
  const [venue, setVenue] = useState("");

  /* Step 2 */
  const [playersA, setPlayersA] = useState([]);
  const [playersB, setPlayersB] = useState([]);

  /* Step 3 */
  const [tossWinner, setTossWinner] = useState("");
  const [tossDecision, setTossDecision] = useState("bat");
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");

  /* Created match id */
  const [matchId, setMatchId] = useState(null);

  /* ── Step 1 → 2 ────────────────────────────────────────── */
  const handleStep1 = () => {
    if (!teamA.trim() || !teamB.trim()) {
      setError("Both team names are required");
      return;
    }
    if (teamA.trim() === teamB.trim()) {
      setError("Team names must be different");
      return;
    }
    setPlayersA(makePlayers(teamA.trim(), DEFAULT_PLAYERS));
    setPlayersB(makePlayers(teamB.trim(), DEFAULT_PLAYERS));
    setTossWinner(teamA.trim());
    setError(null);
    setStep(2);
  };

  /* ── Step 2 → 3: create match lobby ────────────────────── */
  const handleStep2 = async () => {
    setLoading(true);
    setError(null);
    const { ok, data } = await authFetch("/api/live/setup", {
      method: "POST",
      body: JSON.stringify({
        teamA: teamA.trim(),
        teamB: teamB.trim(),
        playersA,
        playersB,
        totalOvers: parseInt(totalOvers),
        venue: venue.trim(),
        tossWinner,
        tossDecision,
      }),
    });
    setLoading(false);
    if (!ok) {
      setError(data.message || "Setup failed");
      return;
    }
    setMatchId(data.data.match._id);

    /* Pre-fill openers */
    const battingFirst =
      tossDecision === "bat"
        ? tossWinner
        : tossWinner === teamA.trim()
          ? teamB.trim()
          : teamA.trim();
    const firstBatters = battingFirst === teamA.trim() ? playersA : playersB;
    const firstBowlers = battingFirst === teamA.trim() ? playersB : playersA;
    setStriker(firstBatters[0] || "");
    setNonStriker(firstBatters[1] || "");
    setBowler(firstBowlers[0] || "");
    setStep(3);
  };

  /* ── Step 3: start match ────────────────────────────────── */
  const handleStep3 = async () => {
    if (!striker || !nonStriker || !bowler) {
      setError("All three player fields required");
      return;
    }
    setLoading(true);
    setError(null);
    const { ok, data } = await authFetch(`/api/live/${matchId}/start`, {
      method: "PATCH",
      body: JSON.stringify({ striker, nonStriker, bowler }),
    });
    setLoading(false);
    if (!ok) {
      setError(data.message || "Start failed");
      return;
    }
    navigate(`/my-matches/${matchId}/score`);
  };

  const updatePlayerA = (i, val) =>
    setPlayersA((prev) => {
      const a = [...prev];
      a[i] = val;
      return a;
    });
  const updatePlayerB = (i, val) =>
    setPlayersB((prev) => {
      const a = [...prev];
      a[i] = val;
      return a;
    });

  const battingFirst =
    tossDecision === "bat"
      ? tossWinner
      : tossWinner === teamA.trim()
        ? teamB.trim()
        : teamA.trim();
  const bowlingFirst =
    battingFirst === teamA.trim() ? teamB.trim() : teamA.trim();
  const openerPool = battingFirst === teamA.trim() ? playersA : playersB;
  const bowlerPool = battingFirst === teamA.trim() ? playersB : playersA;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Stepper */}
        <div className={styles.stepper}>
          {["Teams & Overs", "Players", "Toss & Openers"].map((label, i) => (
            <div
              key={label}
              className={`${styles.step} ${step === i + 1 ? styles.stepActive : ""} ${step > i + 1 ? styles.stepDone : ""}`}
            >
              <span className={styles.stepNum}>
                {step > i + 1 ? "✓" : i + 1}
              </span>
              <span className={styles.stepLabel}>{label}</span>
            </div>
          ))}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {/* ── STEP 1: Teams ─────────────────────────────── */}
        {step === 1 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Match Setup</h2>

            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Team A name</label>
                <input
                  className={styles.input}
                  placeholder="e.g. Mumbai Mavericks"
                  value={teamA}
                  onChange={(e) => setTeamA(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Team B name</label>
                <input
                  className={styles.input}
                  placeholder="e.g. Delhi Dragons"
                  value={teamB}
                  onChange={(e) => setTeamB(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Total overs</label>
                <select
                  className={styles.input}
                  value={totalOvers}
                  onChange={(e) => setTotalOvers(e.target.value)}
                >
                  {[5, 10, 15, 20, 25, 30, 40, 50].map((o) => (
                    <option key={o} value={o}>
                      {o} overs
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Venue (optional)</label>
                <input
                  className={styles.input}
                  placeholder="e.g. Wankhede Stadium"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </div>
            </div>

            <button className={styles.nextBtn} onClick={handleStep1}>
              Next →
            </button>
          </div>
        )}

        {/* ── STEP 2: Players ───────────────────────────── */}
        {step === 2 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Player Names</h2>
            <p className={styles.cardSub}>
              Edit player names for each team. Tap a name to change it.
            </p>

            <div className={styles.playerCols}>
              <div className={styles.playerCol}>
                <h3 className={styles.colTitle}>{teamA}</h3>
                {playersA.map((p, i) => (
                  <div key={i} className={styles.playerRow}>
                    <span className={styles.playerNum}>{i + 1}</span>
                    <input
                      className={styles.playerInput}
                      value={p}
                      onChange={(e) => updatePlayerA(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className={styles.playerCol}>
                <h3 className={styles.colTitle}>{teamB}</h3>
                {playersB.map((p, i) => (
                  <div key={i} className={styles.playerRow}>
                    <span className={styles.playerNum}>{i + 1}</span>
                    <input
                      className={styles.playerInput}
                      value={p}
                      onChange={(e) => updatePlayerB(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.btnRow}>
              <button className={styles.backBtn} onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                className={styles.nextBtn}
                onClick={handleStep2}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Match →"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Toss + Openers ────────────────────── */}
        {step === 3 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Toss & Opening Players</h2>

            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Toss winner</label>
                <select
                  className={styles.input}
                  value={tossWinner}
                  onChange={(e) => setTossWinner(e.target.value)}
                >
                  <option value={teamA}>{teamA}</option>
                  <option value={teamB}>{teamB}</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Toss decision</label>
                <select
                  className={styles.input}
                  value={tossDecision}
                  onChange={(e) => setTossDecision(e.target.value)}
                >
                  <option value="bat">Bat first</option>
                  <option value="field">Field first</option>
                </select>
              </div>
            </div>

            <div className={styles.tossResult}>
              <span className={styles.tossResultText}>
                {battingFirst} bat first vs {bowlingFirst}
              </span>
            </div>

            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Opening striker ({battingFirst})
                </label>
                <select
                  className={styles.input}
                  value={striker}
                  onChange={(e) => setStriker(e.target.value)}
                >
                  {openerPool.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Non-striker ({battingFirst})
                </label>
                <select
                  className={styles.input}
                  value={nonStriker}
                  onChange={(e) => setNonStriker(e.target.value)}
                >
                  {openerPool
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
                  Opening bowler ({bowlingFirst})
                </label>
                <select
                  className={styles.input}
                  value={bowler}
                  onChange={(e) => setBowler(e.target.value)}
                >
                  {bowlerPool.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.btnRow}>
              <button className={styles.backBtn} onClick={() => setStep(2)}>
                ← Back
              </button>
              <button
                className={styles.nextBtn}
                onClick={handleStep3}
                disabled={loading}
              >
                {loading ? "Starting..." : "Start Match →"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MatchSetup;
