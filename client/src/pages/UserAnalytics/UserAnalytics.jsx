import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE } from "../../config";
import styles from "./UserAnalytics.module.css";
import {
  Trophy, Target, Zap, Shield, Swords, PlusCircle,
  TrendingUp, Activity, BarChart3, Users
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";

const BRAND_COLORS = [
  "var(--ci-brand)", "var(--ci-accent)", "#6366f1", "#f59e0b",
  "#ef4444", "#10b981", "#8b5cf6", "#ec4899"
];

const UserAnalytics = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    (async () => {
      try {
        const { ok, data: resData } = await authFetch(`${API_BASE}/api/live/user-analytics`);
        if (ok && resData?.data) {
          setData(resData.data);
        }
      } catch (err) {
        console.error("Failed to load user analytics:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [authFetch]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading analytics...</div>
      </div>
    );
  }

  const {
    summary = {},
    topBatters = [],
    topBowlers = [],
    teamStats = [],
    matchups = []
  } = data || {};

  const hasData = (summary.totalMatches || 0) > 0;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "batting", label: `Batters (${topBatters.length})` },
    { id: "bowling", label: `Bowlers (${topBowlers.length})` },
    { id: "teams", label: `Teams (${teamStats.length})` },
    { id: "matchups", label: `Batter vs Bowler (${matchups.length})` },
  ];

  const topBattersChart = topBatters.slice(0, 10).map((b) => ({
    name: b.name,
    runs: b.runs,
    strikeRate: b.strikeRate,
  }));

  const topBowlersChart = topBowlers.slice(0, 10).map((b) => ({
    name: b.name,
    wickets: b.wickets,
    economy: b.economy,
  }));

  const teamWinChart = teamStats.slice(0, 8).map((t) => ({
    name: t.team.length > 12 ? t.team.slice(0, 12) + "…" : t.team,
    won: t.won,
    lost: t.lost,
  }));

  const srBarData = topBatters.slice(0, 8).map((b) => ({
    name: b.name,
    sr: b.strikeRate,
    avg: b.average,
  }));

  const econBarData = topBowlers.slice(0, 8).map((b) => ({
    name: b.name,
    economy: b.economy,
    avg: b.average,
  }));

  return (
    <div className={styles.page}>
      {/* Hero Header */}
      <section className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>My Intelligence</div>
          <h1 className={styles.heroTitle}>My Match Analytics</h1>
          <p className={styles.heroSub}>
            Deep insights from your personal matches — runs, wickets, performance trends & more.
          </p>
        </div>
        <button className={styles.newMatchBtn} onClick={() => navigate("/my-matches/new")}>
          <PlusCircle size={16} /> New Match
        </button>
      </section>

      {/* KPI Cards */}
      <div className={styles.statsGrid}>
        {[
          { icon: Trophy, label: "Matches Recorded", value: summary.totalMatches || 0, accent: "var(--ci-brand)" },
          { icon: Zap, label: "Total Runs Scored", value: summary.totalRuns || 0, accent: "#f59e0b" },
          { icon: Target, label: "Total Wickets", value: summary.totalWickets || 0, accent: "var(--ci-accent)" },
          { icon: Shield, label: "Teams Represented", value: teamStats.length, accent: "#6366f1" },
          { icon: Users, label: "Players Tracked", value: topBatters.length + topBowlers.length, accent: "#10b981" },
          { icon: Activity, label: "Matchups Recorded", value: matchups.length, accent: "#ec4899" },
        ].map(({ icon: Icon, label, value, accent }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: accent, background: accent + "18" }}>
              <Icon size={22} />
            </div>
            <div>
              <div className={styles.statValue}>{value}</div>
              <div className={styles.statLabel}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {!hasData ? (
        <div className={styles.empty}>
          <Trophy size={40} color="var(--ci-brand)" style={{ marginBottom: "12px" }} />
          <h3 className={styles.emptyTitle}>No match data yet</h3>
          <p className={styles.emptySub}>
            Score custom matches ball-by-ball to unlock your personalized analytics!
          </p>
          <button className={styles.newMatchBtn} onClick={() => navigate("/my-matches/new")}>
            <PlusCircle size={16} /> Start Your First Match
          </button>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className={styles.tabsContainer}>
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ─── OVERVIEW TAB ─── */}
          {activeTab === "overview" && (
            <div className={styles.overviewGrid}>
              {/* Top Batters chart */}
              <div className={styles.chartCard}>
                <div className={styles.chartTitle}>
                  <BarChart3 size={16} color="var(--ci-brand)" /> Top Run Scorers
                </div>
                {topBattersChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      layout="vertical"
                      data={topBattersChart}
                      margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
                    >
                      <CartesianGrid horizontal={false} stroke="var(--ci-border)" strokeDasharray="4 4" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "var(--ci-text-primary)", fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "var(--ci-bg-primary)", border: "1px solid var(--ci-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--ci-text-primary)" }}
                        formatter={(v) => [v + " runs", "Runs"]}
                      />
                      <Bar dataKey="runs" radius={[0, 4, 4, 0]}>
                        {topBattersChart.map((_, i) => (
                          <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className={styles.emptyChart}>No batting data</div>}
              </div>

              {/* Top Bowlers chart */}
              <div className={styles.chartCard}>
                <div className={styles.chartTitle}>
                  <Target size={16} color="var(--ci-accent)" /> Top Wicket Takers
                </div>
                {topBowlersChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      layout="vertical"
                      data={topBowlersChart}
                      margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
                    >
                      <CartesianGrid horizontal={false} stroke="var(--ci-border)" strokeDasharray="4 4" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "var(--ci-text-primary)", fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "var(--ci-bg-primary)", border: "1px solid var(--ci-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--ci-text-primary)" }}
                        formatter={(v) => [v + " wkts", "Wickets"]}
                      />
                      <Bar dataKey="wickets" radius={[0, 4, 4, 0]}>
                        {topBowlersChart.map((_, i) => (
                          <Cell key={i} fill={BRAND_COLORS[(i + 2) % BRAND_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className={styles.emptyChart}>No bowling data</div>}
              </div>

              {/* Team wins chart */}
              {teamWinChart.length > 0 && (
                <div className={styles.chartCard} style={{ gridColumn: "1 / -1" }}>
                  <div className={styles.chartTitle}>
                    <Trophy size={16} color="var(--ci-brand)" /> Team Win/Loss Record
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={teamWinChart} margin={{ top: 4, right: 16, left: -16, bottom: 4 }}>
                      <CartesianGrid vertical={false} stroke="var(--ci-border)" strokeDasharray="4 4" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "var(--ci-bg-primary)", border: "1px solid var(--ci-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--ci-text-primary)" }} />
                      <Legend />
                      <Bar dataKey="won" fill="var(--ci-brand)" name="Won" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="lost" fill="#ef4444" name="Lost" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Strike Rate chart */}
              {srBarData.length > 0 && (
                <div className={styles.chartCard}>
                  <div className={styles.chartTitle}>
                    <Zap size={16} color="#f59e0b" /> Batter Strike Rates
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart layout="vertical" data={srBarData} margin={{ top: 4, right: 20, left: 10, bottom: 4 }}>
                      <CartesianGrid horizontal={false} stroke="var(--ci-border)" strokeDasharray="4 4" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "var(--ci-text-primary)", fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "var(--ci-bg-primary)", border: "1px solid var(--ci-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--ci-text-primary)" }} />
                      <Bar dataKey="sr" fill="#f59e0b" name="Strike Rate" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Economy rate chart */}
              {econBarData.length > 0 && (
                <div className={styles.chartCard}>
                  <div className={styles.chartTitle}>
                    <Activity size={16} color="var(--ci-accent)" /> Bowler Economy Rates
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart layout="vertical" data={econBarData} margin={{ top: 4, right: 20, left: 10, bottom: 4 }}>
                      <CartesianGrid horizontal={false} stroke="var(--ci-border)" strokeDasharray="4 4" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "var(--ci-text-primary)", fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "var(--ci-bg-primary)", border: "1px solid var(--ci-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--ci-text-primary)" }} />
                      <Bar dataKey="economy" fill="var(--ci-accent)" name="Economy" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ─── BATTING TAB ─── */}
          {activeTab === "batting" && (
            <>
              {topBattersChart.length > 0 && (
                <div className={styles.tableCard} style={{ marginBottom: 20 }}>
                  <div className={styles.chartTitle} style={{ padding: "16px 20px 0" }}>
                    <BarChart3 size={16} color="var(--ci-brand)" /> Runs Leaderboard
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(260, topBattersChart.length * 36)}>
                    <BarChart layout="vertical" data={topBattersChart} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
                      <CartesianGrid horizontal={false} stroke="var(--ci-border)" strokeDasharray="4 4" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "var(--ci-text-primary)", fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "var(--ci-bg-primary)", border: "1px solid var(--ci-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--ci-text-primary)" }} />
                      <Bar dataKey="runs" radius={[0, 4, 4, 0]}>
                        {topBattersChart.map((_, i) => (
                          <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className={styles.tableCard}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Batter</th>
                      <th>Innings</th>
                      <th>Runs</th>
                      <th>Balls</th>
                      <th>SR</th>
                      <th>Avg</th>
                      <th>4s</th>
                      <th>6s</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBatters.map((b, idx) => (
                      <tr key={idx}>
                        <td style={{ color: "var(--ci-text-muted)", fontSize: "0.78rem" }}>{idx + 1}</td>
                        <td className={styles.playerName}>{b.name}</td>
                        <td>{b.innings}</td>
                        <td><span className={styles.badgeHighlight}>{b.runs}</span></td>
                        <td>{b.balls}</td>
                        <td style={{ color: b.strikeRate > 150 ? "var(--ci-brand)" : "" }}>{b.strikeRate}</td>
                        <td>{b.average}</td>
                        <td>{b.fours}</td>
                        <td>{b.sixes}</td>
                      </tr>
                    ))}
                    {topBatters.length === 0 && (
                      <tr><td colSpan={9} style={{ textAlign: "center", padding: "20px" }}>No records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ─── BOWLING TAB ─── */}
          {activeTab === "bowling" && (
            <>
              {topBowlersChart.length > 0 && (
                <div className={styles.tableCard} style={{ marginBottom: 20 }}>
                  <div className={styles.chartTitle} style={{ padding: "16px 20px 0" }}>
                    <Target size={16} color="var(--ci-accent)" /> Wickets Leaderboard
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(260, topBowlersChart.length * 36)}>
                    <BarChart layout="vertical" data={topBowlersChart} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
                      <CartesianGrid horizontal={false} stroke="var(--ci-border)" strokeDasharray="4 4" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "var(--ci-text-primary)", fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "var(--ci-bg-primary)", border: "1px solid var(--ci-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--ci-text-primary)" }} />
                      <Bar dataKey="wickets" radius={[0, 4, 4, 0]}>
                        {topBowlersChart.map((_, i) => (
                          <Cell key={i} fill={BRAND_COLORS[(i + 2) % BRAND_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className={styles.tableCard}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Bowler</th>
                      <th>Matches</th>
                      <th>Wickets</th>
                      <th>Overs</th>
                      <th>Runs</th>
                      <th>Economy</th>
                      <th>Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBowlers.map((b, idx) => (
                      <tr key={idx}>
                        <td style={{ color: "var(--ci-text-muted)", fontSize: "0.78rem" }}>{idx + 1}</td>
                        <td className={styles.playerName}>{b.name}</td>
                        <td>{b.matches}</td>
                        <td><span className={styles.badgeHighlight}>{b.wickets}</span></td>
                        <td>{b.overs}</td>
                        <td>{b.runsConceded}</td>
                        <td style={{ color: b.economy < 7 ? "var(--ci-brand)" : "" }}>{b.economy}</td>
                        <td>{b.average}</td>
                      </tr>
                    ))}
                    {topBowlers.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>No records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ─── TEAMS TAB ─── */}
          {activeTab === "teams" && (
            <>
              {teamWinChart.length > 0 && (
                <div className={styles.tableCard} style={{ marginBottom: 20 }}>
                  <div className={styles.chartTitle} style={{ padding: "16px 20px 0" }}>
                    <Trophy size={16} color="var(--ci-brand)" /> Team Win/Loss Records
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={teamWinChart} margin={{ top: 8, right: 16, left: -16, bottom: 4 }}>
                      <CartesianGrid vertical={false} stroke="var(--ci-border)" strokeDasharray="4 4" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "var(--ci-bg-primary)", border: "1px solid var(--ci-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--ci-text-primary)" }} />
                      <Legend />
                      <Bar dataKey="won" fill="var(--ci-brand)" name="Won" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="lost" fill="#ef4444" name="Lost" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className={styles.tableCard}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Played</th>
                      <th>Won</th>
                      <th>Lost</th>
                      <th>Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamStats.map((t, idx) => {
                      const winPct = t.played > 0 ? ((t.won / t.played) * 100).toFixed(0) : "0";
                      return (
                        <tr key={idx}>
                          <td className={styles.playerName}>{t.team}</td>
                          <td>{t.played}</td>
                          <td><span className={styles.badgeHighlight}>{t.won}</span></td>
                          <td>{t.lost}</td>
                          <td style={{ color: Number(winPct) >= 60 ? "var(--ci-brand)" : "" }}>{winPct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ─── MATCHUPS TAB ─── */}
          {activeTab === "matchups" && (
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Batter</th>
                    <th>Bowler</th>
                    <th>Runs</th>
                    <th>Balls</th>
                    <th>Outs</th>
                    <th>SR</th>
                  </tr>
                </thead>
                <tbody>
                  {matchups.map((m, idx) => (
                    <tr key={idx}>
                      <td className={styles.playerName}>{m.batter}</td>
                      <td>{m.bowler}</td>
                      <td><span className={styles.badgeHighlight}>{m.runs}</span></td>
                      <td>{m.balls}</td>
                      <td>{m.outs}</td>
                      <td>{m.sr}</td>
                    </tr>
                  ))}
                  {matchups.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                        No matchups recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserAnalytics;
