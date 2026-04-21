import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./LiveScorer.module.css";

/* ── Dot display labels ───────────────────────────────────── */
const dotLabel = (b) => {
  if (b.bowler_wicket === 1) return "W";
  if (b.extra_type === "wide") return "Wd";
  if (b.extra_type === "noball") return "NB";
  if (b.extra_type === "bye") return `${b.runs_total}B`;
  if (b.extra_type === "legbye") return `${b.runs_total}Lb`;
  return String(b.runs_batter);
};

const dotClass = (b, styles) => {
  if (b.bowler_wicket === 1) return `${styles.dot} ${styles.dotWicket}`;
  if (b.extra_type === "wide" || b.extra_type === "noball")
    return `${styles.dot} ${styles.dotExtra}`;
  if (b.runs_batter === 4) return `${styles.dot} ${styles.dotFour}`;
  if (b.runs_batter === 6) return `${styles.dot} ${styles.dotSix}`;
  if (b.runs_batter === 0) return `${styles.dot} ${styles.dotDot}`;
  return styles.dot;
};

/* ── Main component ───────────────────────────────────────── */
const LiveScorer = () => {
  const { matchId } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  /* Core state — always sourced from server, never computed locally */
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  /* Modals */
  const [wicketMode, setWicketMode] = useState(false);
  const [wicketKind, setWicketKind] = useState("caught");
  const [playerOut, setPlayerOut] = useState("");
  const [newBatter, setNewBatter] = useState("");
  const [pendingRuns, setPendingRuns] = useState(0);

  const [extraRuns, setExtraRuns] = useState(0);

  /* FIX 3: Bowler change modal — shows automatically after over */
  const [bowlerModal, setBowlerModal] = useState(false);
  const [newBowler, setNewBowler] = useState("");
  const [bowlerError, setBowlerError] = useState(null);

  const pollingRef = useRef(null);

  /* ── Fetch state from server (source of truth) ─────────── */
  const fetchState = useCallback(
    async (silent = false) => {
      if (!silent) setError(null);
      const { ok, data } = await authFetch(`/api/live/${matchId}/state`);
      if (ok) {
        setState(data.data);
        /* FIX 3: auto-open bowler change modal if over completed */
        if (data.data.overRequiresBowlerChange && !bowlerModal) {
          setBowlerModal(true);
          setNewBowler("");
          setBowlerError(null);
        }
      }
      setLoading(false);
    },
    [matchId, authFetch, bowlerModal],
  );

  useEffect(() => {
    fetchState();
    /* FIX 4: poll every 8s for multi-device support */
    pollingRef.current = setInterval(() => fetchState(true), 8000);
    return () => clearInterval(pollingRef.current);
  }, [fetchState]);

  /* ── Post a ball ────────────────────────────────────────── */
  const postBall = useCallback(
    async (payload) => {
      setPosting(true);
      setError(null);
      const { ok, data } = await authFetch(`/api/live/${matchId}/ball`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (ok) {
        setState(
          data.data.match
            ? {
                ...state,
                match: data.data.match,
                striker: data.data.striker,
                nonStriker: data.data.nonStriker,
                bowler: data.data.bowler,
              }
            : state,
        );

        /* FIX 3: over completed → open bowler change modal */
        if (data.data.overCompleted && !data.data.innEnded) {
          setBowlerModal(true);
          setNewBowler("");
          setBowlerError(null);
        }

        /* Navigate on innings/match end */
        if (data.data.match?.status === "innings_break")
          navigate(`/my-matches/${matchId}/innings-break`);
        if (data.data.match?.status === "completed")
          navigate(`/my-matches/${matchId}/result`);

        /* Always re-fetch to get fresh server state */
        await fetchState(true);
      } else {
        if (data?.overRequiresBowlerChange) {
          setBowlerModal(true);
          setNewBowler("");
        } else {
          setError(data.message || "Ball recording failed");
        }
      }
      setPosting(false);
    },
    [matchId, authFetch, fetchState, navigate, state],
  );

  /* ── FIX 5: change bowler WITHOUT recording a ball ─────── */
  const handleBowlerChange = async () => {
    if (!newBowler) {
      setBowlerError("Select a bowler");
      return;
    }
    if (newBowler === state?.bowler) {
      setBowlerError("Same bowler can't bowl consecutive overs");
      return;
    }
    setBowlerError(null);

    const { ok, data } = await authFetch(`/api/live/${matchId}/bowler`, {
      method: "PATCH",
      body: JSON.stringify({ bowler: newBowler }),
    });

    if (ok) {
      setBowlerModal(false);
      setNewBowler("");
      await fetchState(true);
    } else {
      setBowlerError(data.message || "Failed to change bowler");
    }
  };

  /* ── Run buttons ────────────────────────────────────────── */
  const handleRun = (runs_batter, extra_type = null, runs_extras = 0) => {
    if (bowlerModal) return; // FIX 3: block until bowler changed
    if (extra_type === "wide") {
      /* Wide: runs_batter always 0, extras = 1 + any additional */
      postBall({
        runs_batter: 0,
        extra_type,
        runs_extras: 1 + parseInt(runs_extras || 0),
      });
      return;
    }
    if (extra_type === "noball") {
      /* No-ball: batter can still score, +1 extra penalty */
      postBall({
        runs_batter,
        extra_type,
        runs_extras: 1 + parseInt(runs_extras || 0),
      });
      return;
    }
    postBall({
      runs_batter,
      extra_type,
      runs_extras: parseInt(runs_extras || 0),
    });
  };

  /* ── Wicket confirm ─────────────────────────────────────── */
  const handleWicket = () => {
    const inn =
      state?.match?.currentInnings === 1
        ? state?.match?.innings1
        : state?.match?.innings2;
    if (!playerOut) return;
    if (!newBatter && inn?.wickets < 9) return;
    setWicketMode(false);
    postBall({
      runs_batter: pendingRuns,
      wicket: true,
      wicket_kind: wicketKind,
      player_out: playerOut,
      newBatter: inn?.wickets >= 9 ? null : newBatter,
    });
    setPlayerOut("");
    setNewBatter("");
    setPendingRuns(0);
  };

  /* ── Undo ───────────────────────────────────────────────── */
  const handleUndo = async () => {
    setPosting(true);
    const { ok } = await authFetch(`/api/live/${matchId}/undo`, {
      method: "DELETE",
    });
    if (ok) await fetchState();
    setPosting(false);
  };

  /* ── Render states ──────────────────────────────────────── */
  if (loading)
    return (
      <div className={styles.stateWrapper}>
        <div className={styles.loadingRing} />
        <p className={styles.stateText}>Loading match...</p>
      </div>
    );

  if (!state)
    return (
      <div className={styles.stateWrapper}>
        <p className={styles.stateText}>Match not found or session expired.</p>
        <button className={styles.refreshBtn} onClick={() => fetchState()}>
          Retry
        </button>
      </div>
    );

  const {
    match,
    striker,
    nonStriker,
    bowler,
    target,
    rrr,
    currentRR,
    currentOverBalls = [],
    overRequiresBowlerChange,
  } = state;
  const inn =
    match.currentInnings <= 2 ? `innings${match.currentInnings}` : "innings2";
  const innObj = match[inn];

  const battingPlayers = inn === "innings1" ? match.playersA : match.playersB;
  const bowlingPlayers = inn === "innings1" ? match.playersB : match.playersA;

  const maxBalls = match.totalOvers * 6;
  const ballsUsed = innObj.balls;
  const ballsLeft = maxBalls - ballsUsed;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* ── FIX 3: Over complete banner ────────────────────── */}
        {overRequiresBowlerChange && !bowlerModal && (
          <div className={styles.overBanner}>
            <span className={styles.overBannerText}>
              Over complete — select new bowler
            </span>
            <button
              className={styles.overBannerBtn}
              onClick={() => {
                setBowlerModal(true);
                setNewBowler("");
              }}
            >
              Change Bowler
            </button>
          </div>
        )}

        {/* ── SCOREBOARD ─────────────────────────────────────── */}
        <section className={styles.scoreboard}>
          <div className={styles.scoreTop}>
            <div className={styles.scoreLeft}>
              <span className={styles.teamName}>{innObj.battingTeam}</span>
              <span className={styles.score}>
                {innObj.runs}/{innObj.wickets}
              </span>
            </div>
            <div className={styles.scoreRight}>
              <span className={styles.overs}>
                {Math.floor(ballsUsed / 6)}.{ballsUsed % 6} / {match.totalOvers}{" "}
                overs
              </span>
              <span className={styles.ballsLeft}>{ballsLeft} balls left</span>
            </div>
          </div>

          {target && (
            <div className={styles.chaseBar}>
              <span className={styles.chaseTarget}>Target {target}</span>
              <span className={styles.chaseNeed}>
                Need {Math.max(0, target - innObj.runs)} off {ballsLeft} balls
              </span>
              {rrr && (
                <span
                  className={styles.rrr}
                  style={{
                    color:
                      rrr > 12
                        ? "var(--ci-danger)"
                        : rrr > 9
                          ? "var(--ci-accent)"
                          : "var(--ci-brand)",
                  }}
                >
                  RRR {rrr}
                </span>
              )}
            </div>
          )}

          <div className={styles.rateRow}>
            <div className={styles.rateBlock}>
              <span className={styles.rateLabel}>CRR</span>
              <span className={styles.rateVal}>{currentRR}</span>
            </div>
            {target && rrr && (
              <div className={styles.rateBlock}>
                <span className={styles.rateLabel}>RRR</span>
                <span
                  className={styles.rateVal}
                  style={{
                    color:
                      rrr > currentRR ? "var(--ci-danger)" : "var(--ci-brand)",
                  }}
                >
                  {rrr}
                </span>
              </div>
            )}
            <div className={styles.rateBlock}>
              <span className={styles.rateLabel}>Extras</span>
              <span className={styles.rateVal}>{innObj.extras}</span>
            </div>
          </div>

          {/* This over's balls */}
          <div className={styles.overRow}>
            <span className={styles.overLabel}>This over</span>
            <div className={styles.overDots}>
              {currentOverBalls.map((b, i) => (
                <span key={i} className={dotClass(b, styles)}>
                  {dotLabel(b)}
                </span>
              ))}
              {/* Empty slots */}
              {Array.from(
                { length: Math.max(0, 6 - currentOverBalls.length) },
                (_, i) => (
                  <span
                    key={`empty-${i}`}
                    className={`${styles.dot} ${styles.dotEmpty}`}
                  />
                ),
              )}
            </div>
          </div>
        </section>

        {/* ── PLAYERS ───────────────────────────────────────── */}
        <section className={styles.players}>
          <div className={`${styles.playerCard} ${styles.playerCardBat}`}>
            <span className={styles.playerRole}>Striker</span>
            <span className={styles.playerName}>{striker || "—"}</span>
          </div>
          <div className={`${styles.playerCard} ${styles.playerCardNS}`}>
            <span className={styles.playerRole}>Non-striker</span>
            <span className={styles.playerName}>{nonStriker || "—"}</span>
          </div>
          <div className={`${styles.playerCard} ${styles.playerCardBowl}`}>
            <span className={styles.playerRole}>Bowler</span>
            <span className={styles.playerName}>{bowler || "—"}</span>
          </div>
        </section>

        {/* Error */}
        {error && <p className={styles.error}>{error}</p>}

        {/* ── CONTROLS ──────────────────────────────────────── */}
        <section
          className={`${styles.controls} ${overRequiresBowlerChange ? styles.controlsBlocked : ""}`}
        >
          {overRequiresBowlerChange && (
            <div className={styles.blockedOverlay}>
              <span>Select new bowler to continue</span>
              <button
                onClick={() => setBowlerModal(true)}
                className={styles.blockedBtn}
              >
                Change Bowler
              </button>
            </div>
          )}

          {/* Run buttons */}
          <div className={styles.runGrid}>
            {[0, 1, 2, 3, 4, 6].map((r) => (
              <button
                key={r}
                className={`${styles.runBtn} ${r === 4 || r === 6 ? styles.boundary : ""}`}
                onClick={() => handleRun(r)}
                disabled={posting || wicketMode || overRequiresBowlerChange}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Extra runs input */}
          <div className={styles.extraRunsRow}>
            <label className={styles.extraRunsLabel}>
              Extra runs on Wide / No-Ball
            </label>
            <input
              type="number"
              min="0"
              max="7"
              className={styles.extraRunsInput}
              value={extraRuns}
              onChange={(e) => setExtraRuns(e.target.value)}
            />
          </div>

          {/* Extras */}
          <div className={styles.extraGrid}>
            {[
              { label: "Wide", extra: "wide", runsForBowl: 0 },
              { label: "No Ball", extra: "noball", runsForBowl: 0 },
              { label: "Bye", extra: "bye", runsForBowl: 0 },
              { label: "Leg Bye", extra: "legbye", runsForBowl: 0 },
            ].map((b) => (
              <button
                key={b.extra}
                className={styles.extraBtn}
                onClick={() => handleRun(0, b.extra, extraRuns)}
                disabled={posting || wicketMode || overRequiresBowlerChange}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Action row */}
          <div className={styles.actionRow}>
            <button
              className={styles.wicketBtn}
              onClick={() => {
                setWicketMode(true);
                setPlayerOut(striker || "");
                setPendingRuns(0);
              }}
              disabled={posting || wicketMode || overRequiresBowlerChange}
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
              className={styles.bowlerChangeBtn}
              onClick={() => {
                setBowlerModal(true);
                setNewBowler("");
                setBowlerError(null);
              }}
              disabled={posting}
            >
              Change Bowler
            </button>
          </div>
        </section>

        {/* ── FIX 3: BOWLER CHANGE MODAL ─────────────────────
             Shows automatically after every over completes.
             Blocked from closing until a valid bowler is selected.  */}
        {bowlerModal && (
          <div className={styles.modal}>
            <div className={styles.modalCard}>
              <div className={styles.modalHeader}>
                <h2
                  className={styles.modalTitle}
                  style={{ color: "var(--ci-accent)" }}
                >
                  {overRequiresBowlerChange
                    ? "Over complete — new bowler required"
                    : "Change Bowler"}
                </h2>
                <span className={styles.modalSub}>
                  {overRequiresBowlerChange
                    ? `Current over ended. ${bowler} cannot bowl consecutive overs.`
                    : `Currently: ${bowler}`}
                </span>
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>
                  Select new bowler ({bowler} cannot be selected)
                </label>
                <select
                  className={styles.modalSelect}
                  value={newBowler}
                  onChange={(e) => {
                    setNewBowler(e.target.value);
                    setBowlerError(null);
                  }}
                >
                  <option value="">Choose bowler...</option>
                  {(bowlingPlayers || [])
                    .filter((p) => p !== bowler)
                    .map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                </select>
              </div>

              {bowlerError && (
                <p className={styles.modalError}>{bowlerError}</p>
              )}

              <div className={styles.modalActions}>
                <button
                  className={styles.modalConfirm}
                  onClick={handleBowlerChange}
                  disabled={!newBowler}
                  style={{
                    color: "var(--ci-accent)",
                    borderColor: "var(--ci-border-accent)",
                    background: "var(--ci-accent-subtle)",
                  }}
                >
                  Confirm New Bowler
                </button>
                {/* Only allow cancel if NOT required (mid-over voluntary change) */}
                {!overRequiresBowlerChange && (
                  <button
                    className={styles.modalCancel}
                    onClick={() => {
                      setBowlerModal(false);
                      setNewBowler("");
                      setBowlerError(null);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── WICKET MODAL ──────────────────────────────────── */}
        {wicketMode && (
          <div className={styles.modal}>
            <div className={styles.modalCard}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Wicket</h2>
              </div>

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
                  onChange={(e) =>
                    setPendingRuns(parseInt(e.target.value || 0))
                  }
                />
              </div>

              {innObj.wickets < 9 && (
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
              )}

              <div className={styles.modalActions}>
                <button
                  className={styles.modalConfirm}
                  onClick={handleWicket}
                  disabled={!playerOut || (innObj.wickets < 9 && !newBatter)}
                >
                  Confirm Wicket
                </button>
                <button
                  className={styles.modalCancel}
                  onClick={() => {
                    setWicketMode(false);
                    setPendingRuns(0);
                    setNewBatter("");
                  }}
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
