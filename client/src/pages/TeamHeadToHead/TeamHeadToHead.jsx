import React, { useState, useEffect } from "react";
import styles from "./TeamHeadToHead.module.css";
import { API_BASE } from "../../config";
import {
  Trophy,
  ArrowRightLeft,
  Calendar,
  MapPin,
  TrendingUp,
  Percent,
  Shield,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const MARQUEE_RIVALRIES = [
  { a: "Chennai Super Kings", b: "Mumbai Indians", label: "MI vs CSK (El Clásico)" },
  { a: "Royal Challengers Bangalore", b: "Chennai Super Kings", label: "RCB vs CSK" },
  { a: "Kolkata Knight Riders", b: "Royal Challengers Bangalore", label: "KKR vs RCB" },
  { a: "Mumbai Indians", b: "Kolkata Knight Riders", label: "MI vs KKR" },
  { a: "Delhi Capitals", b: "Punjab Kings", label: "DC vs PBKS" },
];

const TEAM_COLORS = {
  "Chennai Super Kings": "#F59E0B",
  "Mumbai Indians": "#2563EB",
  "Royal Challengers Bangalore": "#DC2626",
  "Royal Challengers Bengaluru": "#DC2626",
  "Kolkata Knight Riders": "#7C3AED",
  "Delhi Capitals": "#0284C7",
  "Delhi Daredevils": "#0284C7",
  "Punjab Kings": "#E11D48",
  "Kings XI Punjab": "#E11D48",
  "Rajasthan Royals": "#DB2777",
  "Sunrisers Hyderabad": "#EA580C",
  "Gujarat Titans": "#0D9488",
  "Lucknow Super Giants": "#06B6D4",
  "Rising Pune Supergiant": "#9333EA",
  "Rising Pune Supergiants": "#9333EA",
  "Gujarat Lions": "#F97316",
  "Deccan Chargers": "#475569",
  "Kochi Tuskers Kerala": "#65A30D",
  "Pune Warriors": "#4B5563",
};

const getTeamColor = (name, fallback) => TEAM_COLORS[name] || fallback;

const getInitials = (name) => {
  if (!name) return "T";
  return name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 3)
    .map((w) => w[0])
    .join("");
};

const TeamHeadToHead = () => {
  const [teams, setTeams] = useState([]);
  const [teamA, setTeamA] = useState("Chennai Super Kings");
  const [teamB, setTeamB] = useState("Mumbai Indians");
  const [h2hData, setH2hData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all available teams
  useEffect(() => {
    let mounted = true;
    const fetchTeams = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/teams`);
        if (res.ok) {
          const json = await res.json();
          if (mounted && json.data) {
            setTeams(json.data);
            if (!json.data.includes(teamA) && json.data.length > 0) {
              setTeamA(json.data[0]);
            }
            if (!json.data.includes(teamB) && json.data.length > 1) {
              setTeamB(json.data[1]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load teams:", err);
      }
    };
    fetchTeams();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch H2H comparison whenever teamA or teamB changes
  useEffect(() => {
    if (!teamA || !teamB || teamA === teamB) {
      setH2hData(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetchH2H = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_BASE}/api/teams/head-to-head?teamA=${encodeURIComponent(teamA)}&teamB=${encodeURIComponent(teamB)}`;
        const res = await fetch(url);
        const json = await res.json();
        if (mounted) {
          if (json.success) {
            setH2hData(json.data);
          } else {
            setError(json.message || "Failed to load head-to-head records");
          }
        }
      } catch (err) {
        if (mounted) {
          setError("Network error while loading head-to-head records");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchH2H();
    return () => {
      mounted = false;
    };
  }, [teamA, teamB]);

  const swapTeams = () => {
    const temp = teamA;
    setTeamA(teamB);
    setTeamB(temp);
  };

  const colorA = getTeamColor(teamA, "#0D9488");
  const colorB = getTeamColor(teamB, "#2563EB");

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroEyebrow}>IPL Franchise Intelligence</div>
          <h1 className={styles.heroTitle}>Team Head-to-Head</h1>
          <p className={styles.heroSub}>
            Historical match records, win rates, toss decisions, venue supremacy, and
            season-by-season rivalry analysis.
          </p>

          {/* Marquee Rivalry Quick Links */}
          <div className={styles.rivalryPills}>
            <span className={styles.rivalryLabel}>Popular Rivalries:</span>
            {MARQUEE_RIVALRIES.map((r, i) => (
              <button
                key={i}
                className={`${styles.rivalryPill} ${
                  (teamA === r.a && teamB === r.b) || (teamA === r.b && teamB === r.a)
                    ? styles.rivalryPillActive
                    : ""
                }`}
                onClick={() => {
                  setTeamA(r.a);
                  setTeamB(r.b);
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </section>

        {/* TEAM SELECTORS */}
        <section className={styles.selectorCard}>
          <div className={styles.selectBlock}>
            <label className={styles.selectLabel}>Team 1</label>
            <select
              className={styles.teamSelect}
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
            >
              {teams.map((t) => (
                <option key={t} value={t} disabled={t === teamB}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <button
            className={styles.swapBtn}
            onClick={swapTeams}
            title="Swap Teams"
            aria-label="Swap Teams"
          >
            <ArrowRightLeft size={18} />
          </button>

          <div className={styles.selectBlock}>
            <label className={styles.selectLabel}>Team 2</label>
            <select
              className={styles.teamSelect}
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
            >
              {teams.map((t) => (
                <option key={t} value={t} disabled={t === teamA}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </section>

        {teamA === teamB && (
          <div className={styles.emptyNotice}>
            Please select two different teams to view head-to-head records.
          </div>
        )}

        {loading && (
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner} />
            <p>Analyzing head-to-head encounters...</p>
          </div>
        )}

        {error && !loading && <div className={styles.errorNotice}>{error}</div>}

        {!loading && !error && h2hData && (
          <>
            {/* MATCHUP SHOWDOWN BANNER */}
            <section className={styles.showdownCard}>
              <div className={styles.teamSide} style={{ "--team-color": colorA }}>
                <div
                  className={styles.teamBadge}
                  style={{ background: colorA + "18", color: colorA, borderColor: colorA + "55" }}
                >
                  {getInitials(teamA)}
                </div>
                <h2 className={styles.showdownTeamName}>{teamA}</h2>
                <div className={styles.bigScore} style={{ color: colorA }}>
                  {h2hData.teamA.wins}
                </div>
                <div className={styles.winPctLabel}>{h2hData.teamA.winPct}% Win Rate</div>
              </div>

              <div className={styles.vsCenter}>
                <div className={styles.vsBadge}>VS</div>
                <div className={styles.totalMatchesCount}>
                  <strong>{h2hData.totalMatches}</strong> Matches
                </div>
                {h2hData.noResult > 0 && (
                  <span className={styles.noResultBadge}>
                    {h2hData.noResult} No Result / Tied
                  </span>
                )}
              </div>

              <div className={styles.teamSide} style={{ "--team-color": colorB }}>
                <div
                  className={styles.teamBadge}
                  style={{ background: colorB + "18", color: colorB, borderColor: colorB + "55" }}
                >
                  {getInitials(teamB)}
                </div>
                <h2 className={styles.showdownTeamName}>{teamB}</h2>
                <div className={styles.bigScore} style={{ color: colorB }}>
                  {h2hData.teamB.wins}
                </div>
                <div className={styles.winPctLabel}>{h2hData.teamB.winPct}% Win Rate</div>
              </div>

              {/* Dominance Progress Bar */}
              <div className={styles.dominanceBarWrapper}>
                <div
                  className={styles.barFillA}
                  style={{
                    width: `${h2hData.totalMatches > 0 ? (h2hData.teamA.wins / h2hData.totalMatches) * 100 : 50}%`,
                    background: colorA,
                  }}
                />
                <div
                  className={styles.barFillB}
                  style={{
                    width: `${h2hData.totalMatches > 0 ? (h2hData.teamB.wins / h2hData.totalMatches) * 100 : 50}%`,
                    background: colorB,
                  }}
                />
              </div>
            </section>

            {/* KEY METRICS COMPARISON GRID */}
            <section className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statCardHeader}>
                  <Trophy size={16} className={styles.statIcon} />
                  <span>Total Wins</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statVal} style={{ color: colorA }}>
                    {h2hData.teamA.wins}
                  </span>
                  <span className={styles.statDivider}>vs</span>
                  <span className={styles.statVal} style={{ color: colorB }}>
                    {h2hData.teamB.wins}
                  </span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardHeader}>
                  <Percent size={16} className={styles.statIcon} />
                  <span>Win Percentage</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statVal} style={{ color: colorA }}>
                    {h2hData.teamA.winPct}%
                  </span>
                  <span className={styles.statDivider}>vs</span>
                  <span className={styles.statVal} style={{ color: colorB }}>
                    {h2hData.teamB.winPct}%
                  </span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardHeader}>
                  <Award size={16} className={styles.statIcon} />
                  <span>Batting 1st Wins</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statVal} style={{ color: colorA }}>
                    {h2hData.teamA.batFirstWins}
                  </span>
                  <span className={styles.statDivider}>vs</span>
                  <span className={styles.statVal} style={{ color: colorB }}>
                    {h2hData.teamB.batFirstWins}
                  </span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardHeader}>
                  <Shield size={16} className={styles.statIcon} />
                  <span>Chasing (Bowl 1st) Wins</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statVal} style={{ color: colorA }}>
                    {h2hData.teamA.bowlFirstWins}
                  </span>
                  <span className={styles.statDivider}>vs</span>
                  <span className={styles.statVal} style={{ color: colorB }}>
                    {h2hData.teamB.bowlFirstWins}
                  </span>
                </div>
              </div>
            </section>

            {/* SEASON-BY-SEASON TIMELINE CHART */}
            {h2hData.seasonBreakdown && h2hData.seasonBreakdown.length > 0 && (
              <section className={styles.chartSection}>
                <div className={styles.sectionHeader}>
                  <TrendingUp size={18} className={styles.sectionIcon} />
                  <h3 className={styles.sectionTitle}>Season-by-Season Wins</h3>
                </div>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={h2hData.seasonBreakdown}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <XAxis dataKey="season" stroke="var(--ci-text-muted)" fontSize={12} />
                      <YAxis allowDecimals={false} stroke="var(--ci-text-muted)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--ci-bg-secondary)",
                          borderColor: "var(--ci-border)",
                          borderRadius: 8,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="teamAWins" name={teamA} fill={colorA} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="teamBWins" name={teamB} fill={colorB} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* VENUE BREAKDOWN */}
            {h2hData.venueBreakdown && h2hData.venueBreakdown.length > 0 && (
              <section className={styles.venueSection}>
                <div className={styles.sectionHeader}>
                  <MapPin size={18} className={styles.sectionIcon} />
                  <h3 className={styles.sectionTitle}>Venue Records</h3>
                </div>
                <div className={styles.venueGrid}>
                  {h2hData.venueBreakdown.map((v, i) => (
                    <div key={i} className={styles.venueCard}>
                      <h4 className={styles.venueName}>{v.venue}</h4>
                      <div className={styles.venueMeta}>{v.matches} matches played</div>
                      <div className={styles.venueScoreRow}>
                        <div className={styles.venueTeamScore}>
                          <span style={{ color: colorA }}>{teamA}:</span>{" "}
                          <strong>{v.teamAWins}</strong>
                        </div>
                        <div className={styles.venueTeamScore}>
                          <span style={{ color: colorB }}>{teamB}:</span>{" "}
                          <strong>{v.teamBWins}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* RECENT ENCOUNTERS */}
            {h2hData.recentMatches && h2hData.recentMatches.length > 0 && (
              <section className={styles.recentSection}>
                <div className={styles.sectionHeader}>
                  <Calendar size={18} className={styles.sectionIcon} />
                  <h3 className={styles.sectionTitle}>Recent Encounters</h3>
                </div>
                <div className={styles.recentList}>
                  {h2hData.recentMatches.map((m, idx) => {
                    const isWinnerA = m.winner === teamA;
                    const isWinnerB = m.winner === teamB;
                    return (
                      <div key={idx} className={styles.recentCard}>
                        <div className={styles.recentHeader}>
                          <span className={styles.recentDate}>{m.date}</span>
                          <span className={styles.recentSeason}>IPL {m.season}</span>
                        </div>
                        <div className={styles.recentVenue}>
                          <MapPin size={13} /> {m.venue}
                        </div>
                        <div className={styles.recentResult}>
                          <span className={styles.winnerLabel}>Winner:</span>{" "}
                          <span
                            className={styles.winnerName}
                            style={{
                              color: isWinnerA ? colorA : isWinnerB ? colorB : "inherit",
                              fontWeight: 700,
                            }}
                          >
                            {m.winner || "No Result"}
                          </span>
                          {m.winMargin > 0 && (
                            <span className={styles.marginPill}>
                              by {m.winMargin} {m.marginType}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default TeamHeadToHead;
