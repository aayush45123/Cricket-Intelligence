import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE } from "../../config";
import styles from "./TournamentDetail.module.css";
import {
  ArrowLeft,
  Calendar,
  Users,
  Award,
  BarChart2,
  Copy,
  Clock,
  Play,
  CheckCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
  Trophy,
  Zap,
  MapPin,
  Shield,
  Star,
  Printer,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const TournamentDetail = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Fixtures State
  const [viewMode, setViewMode] = useState("calendar"); // 'calendar' | 'timeline'
  const [stageFilter, setStageFilter] = useState("all");
  const [organizerOverride, setOrganizerOverride] = useState(false);

  // Modals
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Live Timer tick
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTournamentData = async () => {
    try {
      const { ok, data } = await authFetch(`${API_BASE}/api/tournaments/${tournamentId}`);
      if (ok && data?.data?.tournament) {
        setTournament(data.data.tournament);
      }
    } catch (err) {
      console.error("Error fetching tournament:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const { ok, data } = await authFetch(`${API_BASE}/api/tournaments/${tournamentId}/analytics`);
      if (ok && data?.data?.analytics) {
        setAnalytics(data.data.analytics);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  useEffect(() => {
    fetchTournamentData();
    fetchAnalyticsData();
  }, [tournamentId]);

  const copyInviteLink = () => {
    if (!tournament?.inviteCode) return;
    const link = `${window.location.origin}/tournaments/join/${tournament.inviteCode}`;
    navigator.clipboard.writeText(link);
    alert(`Tournament Invite Link copied to clipboard!\n\n${link}`);
  };

  const handleGenerateFixtures = async () => {
    try {
      const { ok, data } = await authFetch(`${API_BASE}/api/tournaments/${tournamentId}/fixtures/generate`, {
        method: "POST",
      });
      if (ok) {
        alert("Fixtures successfully generated & scheduled!");
        fetchTournamentData();
      } else {
        alert(data?.message || "Failed to generate fixtures");
      }
    } catch (err) {
      alert("Error generating fixtures");
    }
  };

  const handleSimulateFixture = async (fixtureId) => {
    setSimulating(true);
    try {
      const { ok, data } = await authFetch(`${API_BASE}/api/tournaments/${tournamentId}/fixtures/${fixtureId}/simulate`, {
        method: "POST",
      });
      if (ok) {
        setShowStartModal(false);
        alert(data?.message || "Match simulation complete!");
        fetchTournamentData();
        fetchAnalyticsData();
      } else {
        alert(data?.message || "Simulation failed");
      }
    } catch (err) {
      alert("Simulation error");
    } finally {
      setSimulating(false);
    }
  };

  const handleCompleteTournament = async () => {
    if (!window.confirm("Are you sure you want to declare the tournament completed?")) return;
    try {
      const { ok } = await authFetch(`${API_BASE}/api/tournaments/${tournamentId}/complete`, {
        method: "POST",
      });
      if (ok) {
        alert("Tournament marked as completed!");
        fetchTournamentData();
        fetchAnalyticsData();
      }
    } catch (err) {
      alert("Error completing tournament");
    }
  };

  const getCountdown = (scheduledAt) => {
    if (!scheduledAt) return { expired: true, text: "Time not set" };
    const target = new Date(scheduledAt).getTime();
    const diff = target - now;

    if (diff <= 0) return { expired: true, text: "Match Ready / In Progress", diffMins: 0 };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const diffMins = diff / (1000 * 60);

    return {
      expired: false,
      text: `${days > 0 ? `${days}d ` : ""}${hours}h ${mins}m ${secs}s`,
      diffMins,
    };
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ textAlign: "center", padding: "80px" }}>
        <h2>Loading Tournament Hub...</h2>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className={styles.container} style={{ textAlign: "center", padding: "80px" }}>
        <h2>Tournament not found</h2>
        <button className={styles.btnSecondary} onClick={() => navigate("/tournaments")}>
          <ArrowLeft size={16} /> Back to Tournaments
        </button>
      </div>
    );
  }

  const isOwner = tournament.creatorId?._id === user?._id || tournament.creatorId === user?._id;
  const registeredTeamsCount = tournament.teams?.length || 0;
  const minTeamsRequired = tournament.registration?.minTeamsRequired || 2;
  const canStartFixtures = registeredTeamsCount >= minTeamsRequired;

  // Filter fixtures
  const fixtures = tournament.fixtures || [];
  const filteredFixtures = fixtures.filter((f) => {
    if (stageFilter === "all") return true;
    return f.stage?.toLowerCase().includes(stageFilter.toLowerCase());
  });

  // Group by date for calendar view
  const calendarGrouped = filteredFixtures.reduce((acc, f) => {
    const dateKey = f.scheduledAt
      ? new Date(f.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      : "Unscheduled";
    acc[dateKey] = acc[dateKey] || [];
    acc[dateKey].push(f);
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate("/tournaments")}>
        <ArrowLeft size={16} /> All Tournaments
      </button>

      {/* Header Banner */}
      <div className={styles.headerCard}>
        <div className={styles.headerMain}>
          {tournament.tournamentLogo ? (
            <img src={tournament.tournamentLogo} alt={tournament.title} className={styles.logo} />
          ) : (
            <div className={styles.logoPlaceholder}>{tournament.title.charAt(0)}</div>
          )}
          <div className={styles.titleGroup}>
            <h1>{tournament.title}</h1>
            <div className={styles.metaTags}>
              <span className={styles.tag}>{tournament.tournamentType || "League"}</span>
              <span className={styles.tag}>{tournament.format || "T20"}</span>
              {tournament.location && (
                <span className={styles.tag}>
                  <MapPin size={12} style={{ display: "inline", marginRight: "3px" }} />
                  {tournament.location}
                </span>
              )}
              {tournament.organizerName && <span className={styles.tag}>Organizer: {tournament.organizerName}</span>}
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <span className={`${styles.statusBadge} ${styles[tournament.status || "upcoming"]}`}>
            {tournament.status?.replace("_", " ")}
          </span>
          <button className={styles.btnSecondary} onClick={copyInviteLink}>
            <Copy size={14} /> Share Link
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "overview" ? styles.active : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <FileText size={16} /> Overview & Rules
        </button>
        <button
          className={`${styles.tab} ${activeTab === "teams" ? styles.active : ""}`}
          onClick={() => setActiveTab("teams")}
        >
          <Users size={16} /> Teams & Squads ({registeredTeamsCount})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "fixtures" ? styles.active : ""}`}
          onClick={() => setActiveTab("fixtures")}
        >
          <Calendar size={16} /> Fixtures & Calendar ({fixtures.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "standings" ? styles.active : ""}`}
          onClick={() => setActiveTab("standings")}
        >
          <BarChart2 size={16} /> Points Table
        </button>
        <button
          className={`${styles.tab} ${activeTab === "brackets" ? styles.active : ""}`}
          onClick={() => setActiveTab("brackets")}
        >
          <Shield size={16} /> Playoff Brackets
        </button>
        <button
          className={`${styles.tab} ${activeTab === "analytics" ? styles.active : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <Zap size={16} /> Analytics Dashboard
        </button>
        <button
          className={`${styles.tab} ${activeTab === "awards" ? styles.active : ""}`}
          onClick={() => setActiveTab("awards")}
        >
          <Trophy size={16} /> Awards & Completion Report
        </button>
      </div>

      {/* TAB 1: OVERVIEW & RULES */}
      {activeTab === "overview" && (
        <div className={styles.tabContent}>
          {!canStartFixtures && (
            <div className={styles.warningBanner}>
              <AlertTriangle size={20} />
              <div>
                <strong>Registration Incomplete</strong>: Minimum {minTeamsRequired} teams required to start fixture generation. Currently only {registeredTeamsCount} team(s) registered. Share the invitation link to register more squads.
              </div>
            </div>
          )}

          <div className={styles.inviteBox}>
            <div>
              <div style={{ fontWeight: 600, color: "#fff", marginBottom: "4px" }}>
                Team Registration Link
              </div>
              <div className={styles.inviteUrl}>
                {window.location.origin}/tournaments/join/{tournament.inviteCode}
              </div>
            </div>
            <button className={styles.btnPrimary} onClick={copyInviteLink}>
              <Copy size={14} /> Copy Registration Link
            </button>
          </div>

          <div className={styles.grid2}>
            {/* Tournament Rules */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <Shield size={18} color="var(--ci-brand)" /> Match Rules & Settings
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Overs Per Innings</span>
                <span className={styles.val}>{tournament.rules?.overs || 20} Overs</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Powerplay Overs</span>
                <span className={styles.val}>{tournament.rules?.powerplayOvers || 6} Overs</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Super Over Enabled</span>
                <span className={styles.val}>{tournament.rules?.superOver ? "Yes" : "No"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>DLS Method</span>
                <span className={styles.val}>{tournament.rules?.dlsEnabled ? "Enabled" : "Disabled"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Tie Resolution Rule</span>
                <span className={styles.val}>{tournament.rules?.tieRules || "Super Over"}</span>
              </div>
            </div>

            {/* Smart Scheduler Settings */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <Calendar size={18} color="var(--ci-brand)" /> Smart Scheduler Parameters
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Tournament Dates</span>
                <span className={styles.val}>
                  {tournament.dates?.startDate
                    ? new Date(tournament.dates.startDate).toLocaleDateString()
                    : "TBD"}{" "}
                  —{" "}
                  {tournament.dates?.endDate
                    ? new Date(tournament.dates.endDate).toLocaleDateString()
                    : "TBD"}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Number of Grounds</span>
                <span className={styles.val}>{tournament.schedule?.grounds || 1} Grounds</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Daily Window</span>
                <span className={styles.val}>
                  {tournament.schedule?.dailyStartTime || "09:00"} to {tournament.schedule?.dailyEndTime || "18:00"}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Match Duration</span>
                <span className={styles.val}>{tournament.schedule?.matchDurationMinutes || 120} Mins</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Rest Gap Between Matches</span>
                <span className={styles.val}>{tournament.schedule?.restGapMinutes || 60} Mins</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Max Matches Per Team / Day</span>
                <span className={styles.val}>{tournament.schedule?.maxMatchesPerTeamPerDay || 2}</span>
              </div>
            </div>
          </div>

          {/* Organizer Control Box */}
          {isOwner && (
            <div className={styles.card} style={{ background: "rgba(15, 23, 42, 0.6)" }}>
              <div className={styles.cardTitle}>
                <Zap size={18} color="#eab308" /> Organizer Controls
              </div>
              <p style={{ color: "#94a3b8", fontSize: "0.88rem" }}>
                Generate or reschedule match fixtures automatically based on team count and ground availability.
              </p>
              <div className={styles.organizerActions}>
                <button
                  className={styles.btnPrimary}
                  onClick={handleGenerateFixtures}
                  disabled={!canStartFixtures}
                >
                  <RefreshCw size={14} /> Generate & Schedule Fixtures
                </button>
                <button className={styles.btnSecondary} onClick={handleCompleteTournament}>
                  <Trophy size={14} /> Mark Tournament Completed
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEAMS & SQUADS */}
      {activeTab === "teams" && (
        <div className={styles.tabContent}>
          {registeredTeamsCount === 0 ? (
            <div className={styles.card} style={{ textAlign: "center", padding: "40px" }}>
              <Users size={40} color="#94a3b8" style={{ marginBottom: "12px" }} />
              <h3>No teams registered yet</h3>
              <p style={{ color: "#94a3b8" }}>Share the invite link so team captains can submit their squads.</p>
            </div>
          ) : (
            <div className={styles.teamsGrid}>
              {tournament.teams.map((t, idx) => (
                <div key={idx} className={styles.teamCard}>
                  <div className={styles.teamHeader}>
                    {t.teamLogo ? (
                      <img src={t.teamLogo} alt={t.teamName} className={styles.teamLogo} />
                    ) : (
                      <div className={styles.teamLogoPlaceholder}>{t.teamName.charAt(0)}</div>
                    )}
                    <div>
                      <h4 className={styles.teamName}>{t.teamName}</h4>
                      <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                        Captain: {t.captainName || "Not specified"}
                      </span>
                    </div>
                  </div>

                  {t.jerseyColors?.length > 0 && (
                    <div style={{ marginBottom: "10px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginRight: "6px" }}>Jersey:</span>
                      {t.jerseyColors.map((c, i) => (
                        <span key={i} className={styles.colorPill} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  )}

                  <div className={styles.playerList}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#38bdf8", marginBottom: "6px" }}>
                      Verified Squad ({t.players?.length || 0})
                    </div>
                    {(t.players || []).map((p, pIdx) => (
                      <div key={pIdx} className={styles.playerItem}>
                        <span>{p.name}</span>
                        <span style={{ color: "#4ade80", fontSize: "0.75rem" }}>✓ Verified Account</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FIXTURES, CALENDAR & TIMELINE */}
      {activeTab === "fixtures" && (
        <div className={styles.tabContent}>
          <div className={styles.controlsBar}>
            <div className={styles.viewSwitch}>
              <button
                className={`${styles.viewBtn} ${viewMode === "calendar" ? styles.active : ""}`}
                onClick={() => setViewMode("calendar")}
              >
                Calendar View
              </button>
              <button
                className={`${styles.viewBtn} ${viewMode === "timeline" ? styles.active : ""}`}
                onClick={() => setViewMode("timeline")}
              >
                Timeline View
              </button>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {isOwner && (
                <label style={{ fontSize: "0.82rem", color: "#eab308", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <input
                    type="checkbox"
                    checked={organizerOverride}
                    onChange={(e) => setOrganizerOverride(e.target.checked)}
                  />
                  Organizer Mode: Unlock "Start Match" Early
                </label>
              )}

              <select
                style={{
                  background: "#0f172a",
                  color: "#fff",
                  border: "1px solid #334155",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                }}
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
              >
                <option value="all">All Stages</option>
                <option value="league">League Matches</option>
                <option value="knockout">Knockout / Playoffs</option>
              </select>
            </div>
          </div>

          {fixtures.length === 0 ? (
            <div className={styles.card} style={{ textAlign: "center", padding: "40px" }}>
              <Calendar size={40} color="#94a3b8" style={{ marginBottom: "12px" }} />
              <h3>No fixtures generated yet</h3>
              <p style={{ color: "#94a3b8" }}>
                Once minimum teams register, click "Generate & Schedule Fixtures" in the Overview tab.
              </p>
            </div>
          ) : viewMode === "calendar" ? (
            /* CALENDAR VIEW */
            Object.keys(calendarGrouped).map((dateStr, idx) => (
              <div key={idx} style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "1.1rem", color: "#38bdf8", marginBottom: "12px" }}>
                  📅 {dateStr}
                </h3>
                <div className={styles.fixturesList}>
                  {calendarGrouped[dateStr].map((f) => {
                    const cd = getCountdown(f.scheduledAt);
                    const canStart = f.status !== "completed" && (cd.expired || cd.diffMins <= 0 || organizerOverride);
                    const isUpcomingSoon = !cd.expired && cd.diffMins <= 30 && cd.diffMins > 0;

                    return (
                      <div key={f.fixtureId} className={styles.fixtureCard}>
                        <div className={styles.fixtureHeader}>
                          <span>Match #{f.matchNumber} • {f.stage?.toUpperCase()}</span>
                          <span>
                            {f.scheduledAt
                              ? new Date(f.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : "Time TBD"}{" "}
                            ({f.ground || "Ground 1"})
                          </span>
                        </div>

                        <div className={styles.matchTeams}>
                          <div className={styles.teamCol}>{f.teams.teamA.name}</div>
                          <div className={styles.vsCol}>VS</div>
                          <div className={styles.teamCol}>{f.teams.teamB.name}</div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
                          <div>
                            {f.status === "completed" ? (
                              <span style={{ color: "#4ade80", fontSize: "0.85rem", fontWeight: 600 }}>
                                ✓ Winner: {f.result?.winner} ({f.result?.margin})
                              </span>
                            ) : (
                              <div className={styles.countdownBadge}>
                                <Clock size={14} />
                                {cd.expired ? "Scheduled Time Reached" : `Starts in ${cd.text}`}
                              </div>
                            )}
                          </div>

                          <div style={{ display: "flex", gap: "8px" }}>
                            {f.status === "completed" ? (
                              <button
                                className={styles.btnSecondary}
                                onClick={() => {
                                  setSelectedFixture(f);
                                  setShowScorecardModal(true);
                                }}
                              >
                                View Scorecard
                              </button>
                            ) : (
                              <button
                                className={`${styles.startBtn} ${!canStart ? styles.disabled : ""}`}
                                onClick={() => {
                                  if (canStart) {
                                    setSelectedFixture(f);
                                    setShowStartModal(true);
                                  }
                                }}
                              >
                                {isUpcomingSoon
                                  ? "Preparing Match..."
                                  : !canStart
                                  ? "Coming Soon"
                                  : "START MATCH"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            /* TIMELINE VIEW */
            <div className={styles.fixturesList}>
              {filteredFixtures.map((f, idx) => {
                const cd = getCountdown(f.scheduledAt);
                const canStart = f.status !== "completed" && (cd.expired || cd.diffMins <= 0 || organizerOverride);

                return (
                  <div key={f.fixtureId} className={styles.fixtureCard}>
                    <div className={styles.fixtureHeader}>
                      <span>Day {Math.floor(idx / 3) + 1} • Match #{f.matchNumber}</span>
                      <span>{f.stage}</span>
                    </div>

                    <div className={styles.matchTeams}>
                      <div className={styles.teamCol}>{f.teams.teamA.name}</div>
                      <div className={styles.vsCol}>VS</div>
                      <div className={styles.teamCol}>{f.teams.teamB.name}</div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                        {f.scheduledAt ? new Date(f.scheduledAt).toLocaleString() : "Date TBD"} @ {f.ground || "Ground 1"}
                      </span>

                      {f.status === "completed" ? (
                        <button
                          className={styles.btnSecondary}
                          onClick={() => {
                            setSelectedFixture(f);
                            setShowScorecardModal(true);
                          }}
                        >
                          View Scorecard
                        </button>
                      ) : (
                        <button
                          className={`${styles.startBtn} ${!canStart ? styles.disabled : ""}`}
                          onClick={() => {
                            if (canStart) {
                              setSelectedFixture(f);
                              setShowStartModal(true);
                            }
                          }}
                        >
                          {!canStart ? "Coming Soon" : "START MATCH"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STANDINGS / POINTS TABLE */}
      {activeTab === "standings" && (
        <div className={styles.tabContent}>
          <div className={styles.tableWrapper}>
            <table className={styles.standingsTable}>
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>L</th>
                  <th>T</th>
                  <th>Pts</th>
                  <th>NRR</th>
                  <th>Runs For</th>
                  <th>Runs Against</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(tournament.standings || []).map((row, idx) => (
                  <tr key={idx} className={row.qualified ? styles.qualifiedRow : ""}>
                    <td style={{ fontWeight: "bold" }}>{idx + 1}</td>
                    <td style={{ fontWeight: "600", color: "#fff" }}>{row.teamName}</td>
                    <td>{row.played}</td>
                    <td>{row.wins}</td>
                    <td>{row.losses}</td>
                    <td>{row.ties}</td>
                    <td style={{ fontWeight: "bold", color: "#38bdf8" }}>{row.points}</td>
                    <td style={{ color: row.netRunRate >= 0 ? "#4ade80" : "#fca5a5" }}>
                      {row.netRunRate > 0 ? `+${row.netRunRate}` : row.netRunRate}
                    </td>
                    <td>{row.runsFor}</td>
                    <td>{row.runsAgainst}</td>
                    <td>
                      {idx < 4 && row.played > 0 ? (
                        <span style={{ color: "#4ade80", fontSize: "0.8rem", fontWeight: 600 }}>
                          🏆 Playoff Seed #{idx + 1}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: KNOCKOUT BRACKET */}
      {activeTab === "brackets" && (
        <div className={styles.tabContent}>
          <div className={styles.bracketContainer}>
            {/* Quarter Finals */}
            <div className={styles.bracketRound}>
              <div className={styles.bracketTitle}>Quarter Finals</div>
              {(fixtures.filter((f) => /quarter/i.test(f.stage)) || []).map((f, i) => (
                <div key={i} className={styles.bracketMatch}>
                  <div className={`${styles.bracketTeam} ${f.result?.winner === f.teams.teamA.name ? styles.w : ""}`}>
                    <span>{f.teams.teamA.name}</span>
                    <span>{f.result?.teamAScore?.runs || ""}</span>
                  </div>
                  <div className={`${styles.bracketTeam} ${f.result?.winner === f.teams.teamB.name ? styles.w : ""}`}>
                    <span>{f.teams.teamB.name}</span>
                    <span>{f.result?.teamBScore?.runs || ""}</span>
                  </div>
                </div>
              ))}
              {fixtures.filter((f) => /quarter/i.test(f.stage)).length === 0 && (
                <div style={{ color: "#94a3b8", fontSize: "0.85rem", textAlign: "center" }}>N/A for format</div>
              )}
            </div>

            {/* Semi Finals */}
            <div className={styles.bracketRound}>
              <div className={styles.bracketTitle}>Semi Finals</div>
              {(fixtures.filter((f) => /semi/i.test(f.stage)) || []).map((f, i) => (
                <div key={i} className={styles.bracketMatch}>
                  <div className={`${styles.bracketTeam} ${f.result?.winner === f.teams.teamA.name ? styles.w : ""}`}>
                    <span>{f.teams.teamA.name}</span>
                    <span>{f.result?.teamAScore?.runs || ""}</span>
                  </div>
                  <div className={`${styles.bracketTeam} ${f.result?.winner === f.teams.teamB.name ? styles.w : ""}`}>
                    <span>{f.teams.teamB.name}</span>
                    <span>{f.result?.teamBScore?.runs || ""}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Final */}
            <div className={styles.bracketRound}>
              <div className={styles.bracketTitle}>Grand Final</div>
              {(fixtures.filter((f) => /final/i.test(f.stage) && !/semi|quarter/i.test(f.stage)) || []).map((f, i) => (
                <div key={i} className={styles.bracketMatch} style={{ borderColor: "#eab308" }}>
                  <div className={`${styles.bracketTeam} ${f.result?.winner === f.teams.teamA.name ? styles.w : ""}`}>
                    <span>{f.teams.teamA.name}</span>
                    <span>{f.result?.teamAScore?.runs || ""}</span>
                  </div>
                  <div className={`${styles.bracketTeam} ${f.result?.winner === f.teams.teamB.name ? styles.w : ""}`}>
                    <span>{f.teams.teamB.name}</span>
                    <span>{f.result?.teamBScore?.runs || ""}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ANALYTICS DASHBOARD */}
      {activeTab === "analytics" && (
        <div className={styles.tabContent}>
          {analytics ? (
            <div>
              <div className={styles.analyticsGrid}>
                {/* Orange Cap */}
                <div className={styles.capCard}>
                  <div style={{ color: "#eab308", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase" }}>
                    🍊 Orange Cap (Highest Runs)
                  </div>
                  <h3 style={{ fontSize: "1.4rem", margin: "8px 0 4px", color: "#fff" }}>
                    {analytics.orangeCap?.name || "TBD"}
                  </h3>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#facc15" }}>
                    {analytics.orangeCap?.runs || 0} Runs ({analytics.orangeCap?.balls || 0} balls)
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#cbd5e1", marginTop: "6px" }}>
                    SR: {analytics.orangeCap?.strikeRate || 0} | 4s: {analytics.orangeCap?.fours || 0} | 6s: {analytics.orangeCap?.sixes || 0}
                  </div>
                </div>

                {/* Purple Cap */}
                <div className={styles.purpleCard}>
                  <div style={{ color: "#c084fc", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase" }}>
                    💜 Purple Cap (Highest Wickets)
                  </div>
                  <h3 style={{ fontSize: "1.4rem", margin: "8px 0 4px", color: "#fff" }}>
                    {analytics.purpleCap?.name || "TBD"}
                  </h3>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#c084fc" }}>
                    {analytics.purpleCap?.wickets || 0} Wickets
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#cbd5e1", marginTop: "6px" }}>
                    Overs: {analytics.purpleCap?.overs || 0} | Econ: {analytics.purpleCap?.economy || 0}
                  </div>
                </div>
              </div>

              {/* Performers */}
              <div className={styles.grid2}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Boundary Performers</div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Most Sixes</span>
                    <span className={styles.val}>{analytics.boundaryStats?.mostSixes?.name} ({analytics.boundaryStats?.mostSixes?.sixes || 0} 6s)</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Most Fours</span>
                    <span className={styles.val}>{analytics.boundaryStats?.mostFours?.name} ({analytics.boundaryStats?.mostFours?.fours || 0} 4s)</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Best Strike Rate</span>
                    <span className={styles.val}>{analytics.boundaryStats?.bestStrikeRate?.name} ({analytics.boundaryStats?.bestStrikeRate?.strikeRate})</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Best Economy</span>
                    <span className={styles.val}>{analytics.boundaryStats?.bestEconomy?.name} ({analytics.boundaryStats?.bestEconomy?.economy})</span>
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardTitle}>Player Impact Rankings</div>
                  {(analytics.impactScores || []).slice(0, 5).map((p, idx) => (
                    <div key={idx} className={styles.infoRow}>
                      <span className={styles.label}>#{idx + 1} {p.name}</span>
                      <span className={styles.val} style={{ color: "#38bdf8" }}>{p.impactScore} pts ({p.runs}r, {p.wickets}w)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.card} style={{ textAlign: "center", padding: "40px" }}>
              Loading analytics...
            </div>
          )}
        </div>
      )}

      {/* TAB 7: AWARDS & COMPLETION REPORT */}
      {activeTab === "awards" && (
        <div className={styles.tabContent}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.3rem", color: "#fff", margin: 0 }}>Tournament Honors & Awards</h2>
            <button className={styles.btnPrimary} onClick={() => window.print()}>
              <Printer size={16} /> Print / Export PDF Report
            </button>
          </div>

          <div className={styles.awardGrid}>
            <div className={styles.awardCard}>
              <div className={styles.awardIcon}>🏆</div>
              <div style={{ color: "#eab308", fontWeight: 700, fontSize: "0.85rem" }}>CHAMPION</div>
              <h3 style={{ color: "#fff", margin: "6px 0" }}>{tournament.champion || "TBD"}</h3>
            </div>
            <div className={styles.awardCard}>
              <div className={styles.awardIcon}>🥈</div>
              <div style={{ color: "#cbd5e1", fontWeight: 700, fontSize: "0.85rem" }}>RUNNER-UP</div>
              <h3 style={{ color: "#fff", margin: "6px 0" }}>{tournament.runnerUp || "TBD"}</h3>
            </div>
            <div className={styles.awardCard}>
              <div className={styles.awardIcon}>🌟</div>
              <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.85rem" }}>PLAYER OF TOURNAMENT</div>
              <h3 style={{ color: "#fff", margin: "6px 0" }}>{analytics?.awards?.playerOfTournament || "TBD"}</h3>
            </div>
            <div className={styles.awardCard}>
              <div className={styles.awardIcon}>🚀</div>
              <div style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.85rem" }}>EMERGING PLAYER</div>
              <h3 style={{ color: "#fff", margin: "6px 0" }}>{analytics?.awards?.emergingPlayer || "TBD"}</h3>
            </div>
            <div className={styles.awardCard}>
              <div className={styles.awardIcon}>🏏</div>
              <div style={{ color: "#facc15", fontWeight: 700, fontSize: "0.85rem" }}>BEST BATTER</div>
              <h3 style={{ color: "#fff", margin: "6px 0" }}>{analytics?.awards?.bestBatter || "TBD"}</h3>
            </div>
            <div className={styles.awardCard}>
              <div className={styles.awardIcon}>🎯</div>
              <div style={{ color: "#c084fc", fontWeight: 700, fontSize: "0.85rem" }}>BEST BOWLER</div>
              <h3 style={{ color: "#fff", margin: "6px 0" }}>{analytics?.awards?.bestBowler || "TBD"}</h3>
            </div>
            <div className={styles.awardCard}>
              <div className={styles.awardIcon}>🧤</div>
              <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.85rem" }}>BEST FIELDER</div>
              <h3 style={{ color: "#fff", margin: "6px 0" }}>{analytics?.awards?.bestFielder || "TBD"}</h3>
            </div>
            <div className={styles.awardCard}>
              <div className={styles.awardIcon}>🤝</div>
              <div style={{ color: "#f43f5e", fontWeight: 700, fontSize: "0.85rem" }}>FAIR PLAY AWARD</div>
              <h3 style={{ color: "#fff", margin: "6px 0" }}>{analytics?.awards?.fairPlayAward || "TBD"}</h3>
            </div>
          </div>
        </div>
      )}

      {/* START MATCH SELECTION MODAL */}
      {showStartModal && selectedFixture && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 style={{ margin: "0 0 12px", color: "#fff" }}>Match Center & Engine Choice</h2>
            <p style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>
              {selectedFixture.teams.teamA.name} vs {selectedFixture.teams.teamB.name} ({selectedFixture.stage})
            </p>

            <div style={{ display: "grid", gap: "16px", margin: "24px 0" }}>
              <button
                className={styles.card}
                style={{ textAlign: "left", cursor: "pointer", background: "rgba(2, 132, 199, 0.15)", border: "1px solid #0284c7" }}
                onClick={() => {
                  setShowStartModal(false);
                  navigate("/my-matches/new");
                }}
              >
                <div style={{ fontWeight: 700, color: "#38bdf8", fontSize: "1.05rem" }}>🔴 Live Ball-by-Ball Scoring</div>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginTop: "4px" }}>
                  Score ball-by-ball in real-time, record wickets, commentary, wagon wheel, and live win probability.
                </div>
              </button>

              <button
                className={styles.card}
                style={{ textAlign: "left", cursor: "pointer", background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981" }}
                onClick={() => handleSimulateFixture(selectedFixture.fixtureId)}
                disabled={simulating}
              >
                <div style={{ fontWeight: 700, color: "#34d399", fontSize: "1.05rem" }}>
                  {simulating ? "⚡ Simulating Match..." : "⚡ Statistical Match Simulation Engine"}
                </div>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginTop: "4px" }}>
                  Instantly simulate match ball-by-ball using team strength, pitch type, toss, and player statistics!
                </div>
              </button>
            </div>

            <button className={styles.btnSecondary} onClick={() => setShowStartModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* VIEW SCORECARD MODAL */}
      {showScorecardModal && selectedFixture && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: "780px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, color: "#fff", fontSize: "1.3rem" }}>Match Scorecard</h2>
              <button className={styles.btnSecondary} onClick={() => setShowScorecardModal(false)}>
                Close
              </button>
            </div>

            <div style={{ background: "rgba(15, 23, 42, 0.8)", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4ade80" }}>
                Winner: {selectedFixture.result?.winner} ({selectedFixture.result?.margin})
              </div>
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "4px" }}>
                Player of the Match: 🌟 {selectedFixture.result?.playerOfTheMatch || "N/A"}
              </div>
            </div>

            {/* Innings 1 Card */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#38bdf8", marginBottom: "8px" }}>
                {selectedFixture.teams.teamA.name} Score: {selectedFixture.result?.teamAScore?.runs}/{selectedFixture.result?.teamAScore?.wickets} ({selectedFixture.result?.teamAScore?.overs} overs)
              </h4>
              <div className={styles.tableWrapper}>
                <table className={styles.standingsTable}>
                  <thead>
                    <tr>
                      <th>Batter</th>
                      <th>R</th>
                      <th>B</th>
                      <th>4s</th>
                      <th>6s</th>
                      <th>SR</th>
                      <th>Dismissal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedFixture.result?.teamAScore?.battingCard || []).map((b, i) => (
                      <tr key={i}>
                        <td style={{ color: "#fff" }}>{b.name}</td>
                        <td style={{ fontWeight: "bold" }}>{b.runs}</td>
                        <td>{b.balls}</td>
                        <td>{b.fours}</td>
                        <td>{b.sixes}</td>
                        <td>{b.strikeRate}</td>
                        <td style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{b.dismissal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Innings 2 Card */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#38bdf8", marginBottom: "8px" }}>
                {selectedFixture.teams.teamB.name} Score: {selectedFixture.result?.teamBScore?.runs}/{selectedFixture.result?.teamBScore?.wickets} ({selectedFixture.result?.teamBScore?.overs} overs)
              </h4>
              <div className={styles.tableWrapper}>
                <table className={styles.standingsTable}>
                  <thead>
                    <tr>
                      <th>Batter</th>
                      <th>R</th>
                      <th>B</th>
                      <th>4s</th>
                      <th>6s</th>
                      <th>SR</th>
                      <th>Dismissal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedFixture.result?.teamBScore?.battingCard || []).map((b, i) => (
                      <tr key={i}>
                        <td style={{ color: "#fff" }}>{b.name}</td>
                        <td style={{ fontWeight: "bold" }}>{b.runs}</td>
                        <td>{b.balls}</td>
                        <td>{b.fours}</td>
                        <td>{b.sixes}</td>
                        <td>{b.strikeRate}</td>
                        <td style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{b.dismissal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commentary Highlights */}
            <div>
              <h4 style={{ color: "#eab308", marginBottom: "8px" }}>Key Match Highlights</h4>
              <div style={{ background: "#0f172a", padding: "12px 16px", borderRadius: "10px", fontSize: "0.85rem", color: "#cbd5e1" }}>
                {(selectedFixture.result?.commentaryHighlights || []).map((h, i) => (
                  <div key={i} style={{ padding: "4px 0" }}>• {h}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetail;
