import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE } from "../../config";
import styles from "./Tournaments.module.css";
import {
  Award,
  Plus,
  Copy,
  Users,
  MapPin,
  LogIn,
  ArrowRight,
} from "lucide-react";

const Tournaments = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Join Tournament
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    format: "T20",
    tournamentType: "League",
    organizerName: "",
    location: "",
    description: "",
    registrationOpensAt: "",
    registrationClosesAt: "",
    maxTeams: "",
    minTeamsRequired: "",
    startDate: "",
    endDate: "",
    grounds: "2",
    dailyStartTime: "09:00",
    dailyEndTime: "18:00",
    matchDurationMinutes: "120",
    restGapMinutes: "60",
    maxMatchesPerTeamPerDay: "2",
    overs: "20",
    powerplayOvers: "6",
    superOver: true,
    dlsEnabled: true,
    tieRules: "Super Over",
  });

  const fetchTournaments = async () => {
    try {
      const { ok, data } = await authFetch(`${API_BASE}/api/tournaments`);
      if (ok && data?.data?.tournaments) {
        setTournaments(data.data.tournaments);
      }
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [authFetch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setCreating(true);
    try {
      const { ok, data } = await authFetch(`${API_BASE}/api/tournaments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          format: formData.format,
          tournamentType: formData.tournamentType,
          organizerName: formData.organizerName,
          location: formData.location,
          description: formData.description,
          registration: {
            opensAt: formData.registrationOpensAt || null,
            closesAt: formData.registrationClosesAt || null,
            maxTeams: Number(formData.maxTeams) || 0,
            minTeamsRequired: Number(formData.minTeamsRequired) || 0,
          },
          dates: {
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
          },
          schedule: {
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
            grounds: Number(formData.grounds) || 1,
            dailyStartTime: formData.dailyStartTime,
            dailyEndTime: formData.dailyEndTime,
            matchDurationMinutes: Number(formData.matchDurationMinutes) || 120,
            restGapMinutes: Number(formData.restGapMinutes) || 60,
            maxMatchesPerTeamPerDay:
              Number(formData.maxMatchesPerTeamPerDay) || 2,
          },
          rules: {
            overs: Number(formData.overs) || 20,
            powerplayOvers: Number(formData.powerplayOvers) || 6,
            superOver: Boolean(formData.superOver),
            dlsEnabled: Boolean(formData.dlsEnabled),
            tieRules: formData.tieRules,
          },
        }),
      });

      if (ok) {
        setShowModal(false);
        setFormData({
          title: "",
          format: "T20",
          tournamentType: "League",
          organizerName: "",
          location: "",
          description: "",
          registrationOpensAt: "",
          registrationClosesAt: "",
          maxTeams: "",
          minTeamsRequired: "",
          startDate: "",
          endDate: "",
          grounds: "2",
          dailyStartTime: "09:00",
          dailyEndTime: "18:00",
          matchDurationMinutes: "120",
          restGapMinutes: "60",
          maxMatchesPerTeamPerDay: "2",
          overs: "20",
          powerplayOvers: "6",
          superOver: true,
          dlsEnabled: true,
          tieRules: "Super Over",
        });
        fetchTournaments();
      } else {
        alert(data?.message || "Failed to create tournament");
      }
    } catch (err) {
      console.error(err);
      alert("Creation failed");
    } finally {
      setCreating(false);
    }
  };

  const copyInviteLink = (inviteCode) => {
    const link = `${window.location.origin}/tournaments/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    alert(`Tournament Registration Link copied to clipboard!\n\n${link}`);
  };

  /**
   * Parse whatever the user pastes:
   *   - Full URL:  https://app.com/tournaments/join/TRN-ABCDE
   *   - Just code: TRN-ABCDE  or  trn-abcde  (case-insensitive)
   */
  const extractInviteCode = (raw) => {
    const cleaned = raw.trim();
    // Try to extract from a URL path
    const urlMatch = cleaned.match(/\/tournaments\/join\/([A-Za-z0-9-]+)/i);
    if (urlMatch) return urlMatch[1].toUpperCase();
    // Otherwise treat entire string as code
    const codeMatch = cleaned.match(/^[A-Za-z0-9-]+$/);
    if (codeMatch) return cleaned.toUpperCase();
    return null;
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setJoinError("");
    const code = extractInviteCode(joinInput);
    if (!code) {
      setJoinError(
        "Please enter a valid invite link or code (e.g. TRN-ABCDE).",
      );
      return;
    }
    navigate(`/tournaments/join/${code}`);
  };

  return (
    <div className={styles.page}>
      {/* Hero Header */}
      <section className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Tournament Engine</div>
          <h1 className={styles.heroTitle}>Tournaments</h1>
          <p className={styles.heroSub}>
            Create your tournament, generate shareable registration links, and
            register squads with verified Cricket Intelligence accounts.
          </p>
        </div>
        <button
          className={styles.primaryBtn}
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} /> Create Tournament
        </button>
      </section>

      {/* Join Tournament Panel */}
      <div className={styles.joinPanel}>
        <div className={styles.joinLeft}>
          <LogIn size={18} color="var(--ci-brand)" />
          <div>
            <div className={styles.joinTitle}>Join a Tournament</div>
            <div className={styles.joinSub}>
              Paste an invite link or enter an invite code to register your team
            </div>
          </div>
        </div>
        <form className={styles.joinForm} onSubmit={handleJoin}>
          <input
            className={styles.joinInput}
            type="text"
            placeholder="Paste invite link or enter code (e.g. TRN-AB1234)"
            value={joinInput}
            onChange={(e) => {
              setJoinInput(e.target.value);
              setJoinError("");
            }}
          />
          <button type="submit" className={styles.joinBtn}>
            Join <ArrowRight size={15} />
          </button>
        </form>
        {joinError && <div className={styles.joinError}>{joinError}</div>}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 className={styles.modalTitle}>Create New Tournament</h2>
            <form onSubmit={handleCreate}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tournament Title *</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. Premier Champions Trophy 2026"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Format</label>
                <select
                  className={styles.input}
                  value={formData.format}
                  onChange={(e) =>
                    setFormData({ ...formData, format: e.target.value })
                  }
                >
                  <option value="T20">T20 (20 Overs)</option>
                  <option value="T10">T10 (10 Overs)</option>
                  <option value="15-Overs">15 Overs</option>
                  <option value="50-Over">50 Overs (ODI)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tournament Type</label>
                <select
                  className={styles.input}
                  value={formData.tournamentType}
                  onChange={(e) =>
                    setFormData({ ...formData, tournamentType: e.target.value })
                  }
                >
                  <option value="League">League</option>
                  <option value="Knockout">Knockout</option>
                  <option value="League + Knockout">League + Knockout</option>
                  <option value="Double Elimination">Double Elimination</option>
                  <option value="Round Robin">Round Robin</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Organizer Name</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. City Cricket Association"
                  value={formData.organizerName}
                  onChange={(e) =>
                    setFormData({ ...formData, organizerName: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Location / Venue</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. National Sports Complex"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. Annual weekend knockout tournament"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Registration Opens</label>
                <input
                  className={styles.input}
                  type="datetime-local"
                  value={formData.registrationOpensAt}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registrationOpensAt: e.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Registration Closes</label>
                <input
                  className={styles.input}
                  type="datetime-local"
                  value={formData.registrationClosesAt}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registrationClosesAt: e.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Minimum Teams Required
                </label>
                <input
                  className={styles.input}
                  type="number"
                  min="2"
                  value={formData.minTeamsRequired}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minTeamsRequired: e.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Maximum Teams</label>
                <input
                  className={styles.input}
                  type="number"
                  min="2"
                  value={formData.maxTeams}
                  onChange={(e) =>
                    setFormData({ ...formData, maxTeams: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Tournament Start Date
                </label>
                <input
                  className={styles.input}
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tournament End Date</label>
                <input
                  className={styles.input}
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Number of Grounds</label>
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  value={formData.grounds}
                  onChange={(e) =>
                    setFormData({ ...formData, grounds: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Daily Playing Window Start
                </label>
                <input
                  className={styles.input}
                  type="time"
                  value={formData.dailyStartTime}
                  onChange={(e) =>
                    setFormData({ ...formData, dailyStartTime: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Daily Playing Window End
                </label>
                <input
                  className={styles.input}
                  type="time"
                  value={formData.dailyEndTime}
                  onChange={(e) =>
                    setFormData({ ...formData, dailyEndTime: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Match Duration (minutes)
                </label>
                <input
                  className={styles.input}
                  type="number"
                  min="30"
                  value={formData.matchDurationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      matchDurationMinutes: e.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Rest Gap Between Matches (minutes)
                </label>
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  value={formData.restGapMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, restGapMinutes: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Max Matches Per Team Per Day
                </label>
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  value={formData.maxMatchesPerTeamPerDay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxMatchesPerTeamPerDay: e.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Overs</label>
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  value={formData.overs}
                  onChange={(e) =>
                    setFormData({ ...formData, overs: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Powerplay Overs</label>
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  value={formData.powerplayOvers}
                  onChange={(e) =>
                    setFormData({ ...formData, powerplayOvers: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tie Rules</label>
                <select
                  className={styles.input}
                  value={formData.tieRules}
                  onChange={(e) =>
                    setFormData({ ...formData, tieRules: e.target.value })
                  }
                >
                  <option value="Super Over">Super Over</option>
                  <option value="Most Boundaries">Most Boundaries</option>
                  <option value="Shared Points">Shared Points</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <input
                    type="checkbox"
                    checked={formData.superOver}
                    onChange={(e) =>
                      setFormData({ ...formData, superOver: e.target.checked })
                    }
                    style={{ marginRight: "8px" }}
                  />
                  Super Over Enabled
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <input
                    type="checkbox"
                    checked={formData.dlsEnabled}
                    onChange={(e) =>
                      setFormData({ ...formData, dlsEnabled: e.target.checked })
                    }
                    style={{ marginRight: "8px" }}
                  />
                  DLS Enabled
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Tournament"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            color: "var(--ci-text-muted)",
          }}
        >
          Loading tournaments...
        </div>
      ) : tournaments.length === 0 ? (
        <div className={styles.empty}>
          <Award
            size={44}
            color="var(--ci-brand)"
            style={{ marginBottom: "12px" }}
          />
          <h3>No tournaments created yet</h3>
          <p style={{ color: "var(--ci-text-muted)", marginBottom: "20px" }}>
            Create your first tournament and share the invite link so teams can
            register their verified player squads.
          </p>
          <button
            className={styles.primaryBtn}
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} /> Create First Tournament
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {tournaments.map((t) => (
            <div key={t._id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <h3 className={styles.title}>{t.title}</h3>
                  <div className={styles.meta}>
                    <span>{t.tournamentType || "League"}</span>
                    <span>{t.format}</span>
                    {t.location && (
                      <span>
                        <MapPin
                          size={12}
                          style={{ display: "inline", marginRight: "2px" }}
                        />
                        {t.location}
                      </span>
                    )}
                  </div>
                </div>
                <span className={styles.badge}>{t.status}</span>
              </div>

              <div className={styles.teamsCount}>
                <Users
                  size={14}
                  style={{ display: "inline", marginRight: "6px" }}
                />
                {t.teams?.length || 0} Teams Registered
              </div>

              <div className={styles.teamsCount} style={{ marginTop: "8px" }}>
                Fixtures: {t.fixtures?.length || 0} | Standings:{" "}
                {t.standings?.length || 0}
              </div>

              <div className={styles.shareBox}>
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--ci-text-muted)",
                    }}
                  >
                    Code:{" "}
                  </span>
                  <span className={styles.inviteCode}>{t.inviteCode}</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className={styles.copyBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyInviteLink(t.inviteCode);
                    }}
                  >
                    <Copy
                      size={12}
                      style={{ display: "inline", marginRight: "4px" }}
                    />{" "}
                    Share Link
                  </button>
                  <button
                    className={styles.primaryBtn}
                    style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                    onClick={() => navigate(`/tournaments/${t._id}`)}
                  >
                    Open Hub <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tournaments;
