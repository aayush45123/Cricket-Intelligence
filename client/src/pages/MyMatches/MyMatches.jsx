import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./MyMatches.module.css";

const STATUS_COLORS = {
  live: "var(--ci-brand)",
  innings_break: "var(--ci-accent)",
  completed: "var(--ci-text-muted)",
  setup: "var(--ci-blue)",
};

const STATUS_LABELS = {
  live: "Live",
  innings_break: "Innings Break",
  completed: "Completed",
  setup: "Setup",
};

const MyMatches = () => {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { ok, data } = await authFetch("/api/live/my-matches");
      if (ok) setMatches(data.data.matches || []);
      setLoading(false);
    })();
  }, [authFetch]);

  const fmtDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.heroEyebrow}>My Matches</div>
            <h1 className={styles.heroTitle}>Match Engine</h1>
            <p className={styles.heroSub}>
              Score your own matches ball-by-ball and get the same analytics as
              IPL.
            </p>
          </div>
          <button
            className={styles.newMatchBtn}
            onClick={() => navigate("/my-matches/new")}
          >
            + Start New Match
          </button>
        </section>

        {/* Loading */}
        {loading && (
          <div className={styles.stateWrapper}>
            <div className={styles.loadingRing} />
            <p className={styles.stateText}>Loading matches...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && matches.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🏏</div>
            <h3 className={styles.emptyTitle}>No matches yet</h3>
            <p className={styles.emptySub}>
              Start your first match to score it live and unlock post-match
              analytics.
            </p>
            <button
              className={styles.newMatchBtn}
              onClick={() => navigate("/my-matches/new")}
            >
              Start First Match
            </button>
          </div>
        )}

        {/* Match list */}
        {!loading && matches.length > 0 && (
          <section className={styles.list}>
            {matches.map((m) => {
              const statusColor =
                STATUS_COLORS[m.status] || "var(--ci-text-muted)";
              const isLive =
                m.status === "live" || m.status === "innings_break";
              const isDone = m.status === "completed";

              return (
                <div key={m._id} className={styles.card}>
                  {/* Status pip */}
                  <div
                    className={styles.cardAccent}
                    style={{ background: statusColor }}
                  />

                  <div className={styles.cardMain}>
                    <div className={styles.cardTop}>
                      <div className={styles.teams}>
                        <span className={styles.teamA}>{m.teamA}</span>
                        <span className={styles.vs}>vs</span>
                        <span className={styles.teamB}>{m.teamB}</span>
                      </div>
                      <span
                        className={styles.statusBadge}
                        style={{
                          color: statusColor,
                          borderColor: statusColor + "44",
                          background: statusColor + "10",
                        }}
                      >
                        {isLive && <span className={styles.liveDot} />}
                        {STATUS_LABELS[m.status] || m.status}
                      </span>
                    </div>

                    <div className={styles.cardMeta}>
                      <span>{m.totalOvers} overs</span>
                      {m.venue && <span>{m.venue}</span>}
                      <span>{fmtDate(m.createdAt)}</span>
                    </div>

                    {/* Scores for completed / live */}
                    {(m.innings1?.runs > 0 || m.innings2?.runs > 0) && (
                      <div className={styles.scores}>
                        <span className={styles.inningsScore}>
                          {m.innings1.battingTeam}: {m.innings1.runs}/
                          {m.innings1.wickets}
                          <span className={styles.inningsOvers}>
                            ({m.innings1.overs} ov)
                          </span>
                        </span>
                        {m.innings2?.runs > 0 && (
                          <span className={styles.inningsScore}>
                            {m.innings2.battingTeam}: {m.innings2.runs}/
                            {m.innings2.wickets}
                            <span className={styles.inningsOvers}>
                              ({m.innings2.overs} ov)
                            </span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Winner */}
                    {isDone && m.winner && (
                      <p className={styles.winner}>
                        {m.winner} {m.winOutcome}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={styles.cardActions}>
                    {m.status === "setup" && (
                      <Link
                        to={`/my-matches/${m._id}/score`}
                        className={styles.actionBtn}
                        style={{ color: "var(--ci-blue)" }}
                      >
                        Start Scoring
                      </Link>
                    )}
                    {isLive && (
                      <Link
                        to={`/my-matches/${m._id}/score`}
                        className={styles.actionBtn}
                        style={{ color: "var(--ci-brand)" }}
                      >
                        Resume Live
                      </Link>
                    )}
                    {m.status === "innings_break" && (
                      <Link
                        to={`/my-matches/${m._id}/innings-break`}
                        className={styles.actionBtn}
                        style={{ color: "var(--ci-accent)" }}
                      >
                        Set Innings 2
                      </Link>
                    )}
                    {isDone && (
                      <Link
                        to={`/my-matches/${m._id}/result`}
                        className={styles.actionBtn}
                        style={{ color: "var(--ci-brand)" }}
                      >
                        View Analytics
                      </Link>
                    )}
                    {m.shareToken && (
                      <button
                        className={styles.shareBtn}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/match/${m.shareToken}`,
                          );
                          alert("Share link copied!");
                        }}
                      >
                        Copy Link
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
};

export default MyMatches;
