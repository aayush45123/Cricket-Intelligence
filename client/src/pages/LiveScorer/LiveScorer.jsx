import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./LiveScorer.module.css";

/* ── Run button config ────────────────────────────────────── */
const RUN_BTNS = [
  { label: "0", runs: 0, extra: null },
  { label: "1", runs: 1, extra: null },
  { label: "2", runs: 2, extra: null },
  { label: "3", runs: 3, extra: null },
  { label: "4", runs: 4, extra: null, boundary: true },
  { label: "6", runs: 6, extra: null, boundary: true },
];

const EXTRA_BTNS = [
  { label: "Wide", extra: "wide", runs: 0 },
  { label: "No Ball", extra: "noball", runs: 0 },
  { label: "Bye", extra: "bye", runs: 0 },
  { label: "Leg Bye", extra: "legbye", runs: 0 },
];

/* ── Helpers ─────────────────────────────────────────────── */
const fmtOvers = (balls) =>
  balls === undefined ? "0.0" : `${Math.floor(balls / 6)}.${balls % 6}`;

/* ── Main Component ──────────────────────────────────────── */
const LiveScorer = () => {
  const { matchId } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  /* Wicket modal */
  const [wicketMode, setWicketMode] = useState(false);
  const [wicketKind, setWicketKind] = useState("caught");
  const [playerOut, setPlayerOut] = useState("");
  const [newBatter, setNewBatter] = useState("");
  const [pendingRuns, setPendingRuns] = useState(0);

  /* Extra runs input (for "Wide+4" etc.) */
  const [extraRuns, setExtraRuns] = useState(0);

  /* New bowler change */
  const [bowlerChangeMode, setBowlerChangeMode] = useState(false);
  const [newBowler, setNewBowler] = useState("");

  const pollingRef = useRef(null);

  const fetchState = useCallback(async () => {
    const { ok, data } = await authFetch(`/api/live/${matchId}/state`);
    if (ok) setState(data.data);
    setLoading(false);
  }, [matchId, authFetch]);

  useEffect(() => {
    fetchState();
    /* Poll every 5s for shared-screen support */
    pollingRef.current = setInterval(fetchState, 5000);
    return () => clearInterval(pollingRef.current);
  }, [fetchState]);

  const postBall = useCallback(
    async (payload) => {
      setPosting(true);
      setError(null);
      const { ok, data } = await authFetch(`/api/live/${matchId}/ball`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (ok) {
        setState((prev) => ({ ...prev, ...data.data }));
        await fetchState();
        if (data.data.match?.status === "innings_break")
          navigate(`/my-matches/${matchId}/innings-break`);
        if (data.data.match?.status === "completed")
          navigate(`/my-matches/${matchId}/result`);
      } else {
        setError(data.message || "Ball recording failed");
      }
      setPosting(false);
    },
    [matchId, authFetch, fetchState, navigate],
  );

  const handleRun = (runs_batter, extra_type = null, runs_extras = 0) => {
    if (extra_type === "wide" || extra_type === "noball") {
      postBall({ runs_batter: 0, extra_type, runs_extras: 1 + runs_extras });
      return;
    }
    postBall({ runs_batter, extra_type, runs_extras });
  };

  const handleWicket = () => {
    if (!playerOut) return;
    if (!newBatter && state?.match?.innings1?.wickets < 9) return;
    setWicketMode(false);
    postBall({
      runs_batter: pendingRuns,
      wicket: true,
      wicket_kind: wicketKind,
      player_out: playerOut,
      newBatter,
    });
    setPlayerOut("");
    setNewBatter("");
    setPendingRuns(0);
  };

  const handleUndo = async () => {
    setPosting(true);
    const { ok } = await authFetch(`/api/live/${matchId}/undo`, {
      method: "DELETE",
    });
    if (ok) await fetchState();
    setPosting(false);
  };

  if (loading)
    return (
      <div className={styles.stateWrapper}>
        <div className={styles.loadingRing} />
        <p className={styles.stateText}>Loading match...</p>
      </div>
    );

  if (!state) return <p className={styles.stateText}>Match not found.</p>;

  const {
    match,
    striker,
    nonStriker,
    bowler,
    target,
    rrr,
    currentRR,
    recentBalls,
  } = state;
  const inn =
    match.currentInnings <= 2 ? `innings${match.currentInnings}` : "innings2";
  const innObj = match[inn];
  const battingPlayers = inn === "innings1" ? match.playersA : match.playersB;
  const bowlingPlayers = inn === "innings1" ? match.playersB : match.playersA;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* ── SCOREBOARD ────────────────────────────────────── */}
        <section className={styles.scoreboard}>
          <div className={styles.scoreTop}>
            <span className={styles.teamName}>{innObj.battingTeam}</span>
            <span className={styles.score}>
              {innObj.runs}/{innObj.wickets}
            </span>
            <span className={styles.overs}>({fmtOvers(innObj.balls)} ov)</span>
          </div>

          {target && (
            <div className={styles.chaseBar}>
              <span className={styles.chaseTarget}>Target {target}</span>
              <span className={styles.chaseNeed}>
                Need {target - innObj.runs} off{" "}
                {match.totalOvers * 6 - innObj.balls} balls
              </span>
              {rrr && <span className={styles.rrr}>RRR {rrr}</span>}
            </div>
          )}

          <div className={styles.rateRow}>
            <span className={styles.rateLabel}>CRR</span>
            <span className={styles.rateVal}>{currentRR || 0}</span>
          </div>

          {/* Recent balls this over */}
          <div className={styles.overDots}>
            {(recentBalls || []).map((b, i) => {
              const isWide = b.extra_type === "wide";
              const isNB = b.extra_type === "noball";
              const isWicket = b.bowler_wicket === 1;
              const isFour = b.runs_batter === 4;
              const isSix = b.runs_batter === 6;
              return (
                <span
                  key={i}
                  className={`${styles.dot}
                    ${isWicket ? styles.dotWicket : ""}
                    ${isFour ? styles.dotFour : ""}
                    ${isSix ? styles.dotSix : ""}
                    ${isWide || isNB ? styles.dotExtra : ""}
                  `}
                >
                  {isWicket ? "W" : isWide ? "Wd" : isNB ? "NB" : b.runs_batter}
                </span>
              );
            })}
          </div>
        </section>

        {/* ── PLAYERS ───────────────────────────────────────── */}
        <section className={styles.players}>
          <div className={styles.batter}>
            <span className={styles.playerRole}>Striker</span>
            <span className={styles.playerName}>{striker || "—"}</span>
          </div>
          <div className={styles.batter}>
            <span className={styles.playerRole}>Non-striker</span>
            <span className={styles.playerName}>{nonStriker || "—"}</span>
          </div>
          <div
            className={styles.batter}
            style={{ borderColor: "var(--ci-danger)" }}
          >
            <span className={styles.playerRole}>Bowler</span>
            <span className={styles.playerName}>{bowler || "—"}</span>
          </div>
        </section>

        {/* Error */}
        {error && <p className={styles.error}>{error}</p>}

        {/* ── RUN BUTTONS ───────────────────────────────────── */}
        <section className={styles.controls}>
          <div className={styles.runGrid}>
            {RUN_BTNS.map((b) => (
              <button
                key={b.label}
                className={`${styles.runBtn} ${b.boundary ? styles.boundary : ""}`}
                onClick={() => handleRun(b.runs)}
                disabled={posting || wicketMode}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Extras row */}
          <div className={styles.extraGrid}>
            {EXTRA_BTNS.map((b) => (
              <button
                key={b.label}
                className={styles.extraBtn}
                onClick={() => handleRun(0, b.extra, parseInt(extraRuns || 0))}
                disabled={posting || wicketMode}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Extra runs input (for bye/leg-bye with runs) */}
          <div className={styles.extraRunsRow}>
            <label className={styles.extraRunsLabel}>
              Extra runs (for bye / lb)
            </label>
            <input
              className={styles.extraRunsInput}
              type="number"
              min="0"
              max="7"
              value={extraRuns}
              onChange={(e) => setExtraRuns(e.target.value)}
            />
          </div>

          {/* Action buttons */}
          <div className={styles.actionRow}>
            <button
              className={styles.wicketBtn}
              onClick={() => {
                setWicketMode(true);
                setPlayerOut(striker);
              }}
              disabled={posting || wicketMode}
            >
              Wicket
            </button>
            <button
              className={styles.undoBtn}
              onClick={handleUndo}
              disabled={posting}
            >
              Undo
            </button>
            <button
              className={styles.bowlerBtn}
              onClick={() => setBowlerChangeMode(true)}
              disabled={posting}
            >
              Change Bowler
            </button>
          </div>
        </section>

        {/* ── WICKET MODAL ──────────────────────────────────── */}
        {wicketMode && (
          <div className={styles.modal}>
            <div className={styles.modalCard}>
              <h2 className={styles.modalTitle}>Wicket</h2>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Dismissal type</label>
                <select
                  className={styles.modalSelect}
                  value={wicketKind}
                  onChange={(e) => setWicketKind(e.target.value)}
                >
                  {[
                    "caught",
                    "bowled",
                    "lbw",
                    "run out",
                    "stumped",
                    "hit wicket",
                    "obstructing the field",
                  ].map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Batter dismissed</label>
                <select
                  className={styles.modalSelect}
                  value={playerOut}
                  onChange={(e) => setPlayerOut(e.target.value)}
                >
                  <option value={striker}>{striker} (striker)</option>
                  <option value={nonStriker}>{nonStriker} (non-striker)</option>
                </select>
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>
                  Runs scored on this ball
                </label>
                <input
                  type="number"
                  min="0"
                  max="6"
                  className={styles.modalSelect}
                  value={pendingRuns}
                  onChange={(e) => setPendingRuns(parseInt(e.target.value))}
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>New batter</label>
                <select
                  className={styles.modalSelect}
                  value={newBatter}
                  onChange={(e) => setNewBatter(e.target.value)}
                >
                  <option value="">Select new batter...</option>
                  {(battingPlayers || [])
                    .filter((p) => p !== striker && p !== nonStriker)
                    .map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.modalConfirm}
                  onClick={handleWicket}
                  disabled={!newBatter && innObj.wickets < 9}
                >
                  Confirm Wicket
                </button>
                <button
                  className={styles.modalCancel}
                  onClick={() => {
                    setWicketMode(false);
                    setError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BOWLER CHANGE ─────────────────────────────────── */}
        {bowlerChangeMode && (
          <div className={styles.modal}>
            <div className={styles.modalCard}>
              <h2 className={styles.modalTitle}>Change bowler</h2>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Select new bowler</label>
                <select
                  className={styles.modalSelect}
                  value={newBowler}
                  onChange={(e) => setNewBowler(e.target.value)}
                >
                  <option value="">Select...</option>
                  {(bowlingPlayers || [])
                    .filter((p) => p !== bowler)
                    .map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                </select>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.modalConfirm}
                  disabled={!newBowler}
                  onClick={async () => {
                    /* Change bowler by passing newBowler with a dot ball */
                    await postBall({ runs_batter: 0, newBowler });
                    setBowlerChangeMode(false);
                    setNewBowler("");
                  }}
                >
                  Confirm
                </button>
                <button
                  className={styles.modalCancel}
                  onClick={() => setBowlerChangeMode(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LiveScorer;
