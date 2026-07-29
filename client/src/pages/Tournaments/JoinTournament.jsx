import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE } from "../../config";
import styles from "./JoinTournament.module.css";
import {
  Award,
  Users,
  MapPin,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  Shield,
} from "lucide-react";

const JoinTournament = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { authFetch, isAuthenticated, loading: authLoading } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [players, setPlayers] = useState([{ email: "" }]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [unregisteredList, setUnregisteredList] = useState([]);
  const [success, setSuccess] = useState(false);

  /* Fetch tournament info via invite code */
  useEffect(() => {
    const fetchTournament = async () => {
      setFetchLoading(true);
      setFetchError("");
      try {
        const { ok, data } = await authFetch(
          `${API_BASE}/api/tournaments/join/${inviteCode.toUpperCase()}`
        );
        if (ok && data?.data?.tournament) {
          setTournament(data.data.tournament);
        } else {
          setFetchError(
            data?.message ||
              "Tournament not found. Please check your invite link."
          );
        }
      } catch (err) {
        setFetchError("Failed to load tournament. Please try again.");
      } finally {
        setFetchLoading(false);
      }
    };

    if (inviteCode) fetchTournament();
  }, [inviteCode, authFetch]);

  const addPlayer = () => {
    if (players.length >= 15) return;
    setPlayers([...players, { email: "" }]);
  };

  const removePlayer = (idx) => {
    if (players.length <= 1) return;
    setPlayers(players.filter((_, i) => i !== idx));
  };

  const updatePlayer = (idx, email) => {
    const updated = [...players];
    updated[idx] = { email };
    setPlayers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setUnregisteredList([]);

    if (!teamName.trim()) {
      setSubmitError("Please enter your team name.");
      return;
    }

    const filledPlayers = players.filter((p) => p.email.trim() !== "");
    if (filledPlayers.length === 0) {
      setSubmitError("Please add at least one player email to register your team.");
      return;
    }

    setSubmitting(true);
    try {
      const { ok, data } = await authFetch(
        `${API_BASE}/api/tournaments/join/${inviteCode.toUpperCase()}/register-team`,
        {
          method: "POST",
          body: JSON.stringify({
            teamName: teamName.trim(),
            captainName: captainName.trim(),
            players: filledPlayers,
          }),
        }
      );

      if (ok) {
        setSuccess(true);
        // Refresh tournament so teams list updates
        const refresh = await authFetch(
          `${API_BASE}/api/tournaments/join/${inviteCode.toUpperCase()}`
        );
        if (refresh.ok) setTournament(refresh.data?.data?.tournament);
        return;
      }

      // Handle unregistered player error (code: UNREGISTERED_PLAYERS)
      if (data?.code === "UNREGISTERED_PLAYERS" && data?.missingAccounts) {
        setUnregisteredList(data.missingAccounts);
        setSubmitError(
          "Some players don't have a Cricket Intelligence account yet. They must sign up first before they can join any tournament."
        );
      } else {
        setSubmitError(data?.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render States ──────────────────────────── */

  if (authLoading || fetchLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageState}>Loading tournament details...</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={styles.page}>
        <div className={styles.pageState}>
          <div>
            <AlertTriangle
              size={40}
              color="var(--ci-text-muted)"
              style={{ margin: "0 auto 12px", display: "block" }}
            />
            <p>{fetchError}</p>
            <button
              onClick={() => navigate("/tournaments")}
              style={{
                marginTop: "16px",
                background: "var(--ci-brand)",
                color: "#000",
                border: "none",
                borderRadius: "6px",
                padding: "10px 20px",
                cursor: "pointer",
                fontWeight: "700",
              }}
            >
              View My Tournaments
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.pageState}>
          <div>
            <ShieldCheck
              size={40}
              color="var(--ci-brand)"
              style={{ margin: "0 auto 12px", display: "block" }}
            />
            <p style={{ fontWeight: "700", fontSize: "1.1rem", marginBottom: "8px" }}>
              Sign in to Register Your Team
            </p>
            <p style={{ color: "var(--ci-text-muted)", marginBottom: "20px" }}>
              You must be logged in to register a team for{" "}
              <strong>{tournament?.title}</strong>.
            </p>
            <Link
              to="/login"
              style={{
                background: "var(--ci-brand)",
                color: "#000",
                borderRadius: "6px",
                padding: "10px 24px",
                fontWeight: "700",
                textDecoration: "none",
              }}
            >
              Sign In / Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Tournament Banner */}
      <div className={styles.banner}>
        <div>
          <div className={styles.bannerEyebrow}>
            <Award size={13} style={{ display: "inline", marginRight: "4px" }} />
            Tournament Registration
          </div>
          <h1 className={styles.bannerTitle}>{tournament?.title}</h1>
          <div className={styles.bannerMeta}>
            <span className={styles.metaPill}>{tournament?.format}</span>
            {tournament?.location && (
              <span className={styles.metaPill}>
                <MapPin size={12} /> {tournament?.location}
              </span>
            )}
            <span className={styles.metaPill}>
              <Users size={12} /> {tournament?.teams?.length || 0} Teams Registered
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "monospace", fontSize: "1.4rem", fontWeight: "800", color: "var(--ci-brand)" }}>
            {tournament?.inviteCode}
          </div>
          <div className={styles.creatorBadge}>
            Tournament by {tournament?.creatorId?.name || "Organizer"}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      {success ? (
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <CheckCircle size={30} />
          </div>
          <h2 className={styles.successTitle}>Team Registered Successfully! 🎉</h2>
          <p className={styles.successSub}>
            <strong>{teamName}</strong> is now part of{" "}
            <strong>{tournament?.title}</strong>.
            <br />
            Your verified squad has been locked in.
          </p>
          <button
            style={{
              marginTop: "20px",
              background: "var(--ci-brand)",
              color: "#000",
              border: "none",
              borderRadius: "6px",
              padding: "10px 22px",
              cursor: "pointer",
              fontWeight: "700",
            }}
            onClick={() => navigate("/tournaments")}
          >
            View My Tournaments
          </button>
        </div>
      ) : (
        <div className={styles.layout}>
          {/* Registration Form */}
          <div className={styles.formPanel}>
            <h2 className={styles.sectionTitle}>
              <Shield size={18} color="var(--ci-brand)" />
              Register Your Team
            </h2>

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Team Name *</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. Warriors XI"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Captain / Contact Name</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Player Emails (Registered CI Accounts) *
                </label>

                <div
                  style={{
                    background: "rgba(255,160,50,0.07)",
                    border: "1px solid rgba(255,160,50,0.25)",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    marginBottom: "12px",
                    fontSize: "0.82rem",
                    color: "#ffb050",
                    display: "flex",
                    gap: "8px",
                    alignItems: "flex-start",
                  }}
                >
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                  <span>
                    All players <strong>must have an active Cricket Intelligence account</strong>.
                    Enter their registered email addresses below. Players without an account must{" "}
                    <Link to="/register" style={{ color: "var(--ci-brand)" }}>
                      sign up first
                    </Link>
                    .
                  </span>
                </div>

                {players.map((p, idx) => (
                  <div key={idx} className={styles.playerInputRow}>
                    <input
                      className={styles.playerEmail}
                      type="email"
                      placeholder={`Player ${idx + 1} email address`}
                      value={p.email}
                      onChange={(e) => updatePlayer(idx, e.target.value)}
                    />
                    {players.length > 1 && (
                      <button
                        type="button"
                        className={styles.removePlayerBtn}
                        onClick={() => removePlayer(idx)}
                        title="Remove player"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {players.length < 15 && (
                  <button
                    type="button"
                    className={styles.addPlayerBtn}
                    onClick={addPlayer}
                  >
                    <Plus size={15} /> Add Another Player
                  </button>
                )}
              </div>

              {/* Errors */}
              {submitError && (
                <div className={`${styles.alert} ${styles.alertError}`}>
                  <div style={{ fontWeight: "600", marginBottom: unregisteredList.length ? "8px" : "0" }}>
                    {submitError}
                  </div>
                  {unregisteredList.length > 0 && (
                    <>
                      <ul className={styles.unregisteredList}>
                        {unregisteredList.map((acc, i) => (
                          <li key={i}>{acc}</li>
                        ))}
                      </ul>
                      <div className={styles.signupHint}>
                        These players need to create a free account first:{" "}
                        <Link to="/register">Sign up here →</Link>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitting}
              >
                {submitting ? (
                  "Verifying players & registering..."
                ) : (
                  <>
                    <CheckCircle size={16} /> Register Team
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Side Panel */}
          <div className={styles.sidePanel}>
            {/* Rules */}
            <div className={styles.sidePanelCard}>
              <div className={styles.sidePanelTitle}>
                <Info size={16} color="var(--ci-brand)" />
                CricHeroes-Style Rules
              </div>

              {[
                "Enter the email of each player who already has a Cricket Intelligence account.",
                "Players without an account CANNOT be added — they must register first.",
                "Duplicate teams or teams already registered will be rejected.",
                "The organizer can see all registered teams and squads.",
                "Once registered, your squad is locked to this tournament entry.",
              ].map((rule, i) => (
                <div key={i} className={styles.ruleItem}>
                  <span className={styles.ruleNum}>{i + 1}</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>

            {/* Teams already registered */}
            {tournament?.teams?.length > 0 && (
              <div className={styles.sidePanelCard}>
                <div className={styles.sidePanelTitle}>
                  <Users size={16} color="var(--ci-brand)" />
                  Registered Teams ({tournament.teams.length})
                </div>
                {tournament.teams.map((t, i) => (
                  <div key={i} className={styles.teamRow}>
                    <span className={styles.teamRowName}>{t.teamName}</span>
                    <span className={styles.teamRowCount}>
                      {t.players?.length || 0} players
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinTournament;
