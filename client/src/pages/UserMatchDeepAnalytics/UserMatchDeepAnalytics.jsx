import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./UserMatchDeepAnalytics.module.css";
import WormChart from "../../components/charts/WormChart/WormChart";
import WinProbabilityChart from "../../components/charts/WinProbabilityChart/WinProbabilityChart";
import MomentumChart from "../../components/charts/MomentumChart/MomentumChart";
import KeyMomentsTimeline from "../../components/charts/KeyMomentsTimeline/KeyMomentsTimeline";
import MatchStoryCard from "../../components/MatchStoryCard/MatchStoryCard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import { API_BASE } from "../../config";
import { Trophy, Target, Zap, Shield, TrendingUp, Activity, Users, BarChart3 } from "lucide-react";

const COLORS = ["var(--ci-brand)", "var(--ci-accent)", "#6366f1", "#f59e0b", "#ef4444", "#10b981"];

const SectionHeader = ({ label, accent = "var(--ci-brand)", tag }) => (
  <div className={styles.sectionHeader}>
    <span className={styles.sectionAccent} style={{ background: accent }} />
    <h2 className={styles.sectionTitle}>{label}</h2>
    {tag && <span className={styles.sectionTag}>{tag}</span>}
  </div>
);

const SummaryTile = ({ label, value, sub, accent, icon: Icon }) => (
  <div className={styles.summaryTile}>
    {Icon && <div className={styles.tileIcon} style={{ color: accent || "var(--ci-brand)" }}><Icon size={18} /></div>}
    <span className={styles.summaryLabel}>{label}</span>
    <span className={styles.summaryValue} style={{ color: accent || "var(--ci-brand)" }}>{value}</span>
    {sub && <span className={styles.summarySub}>{sub}</span>}
  </div>
);

const UserMatchDeepAnalytics = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeInnings, setActiveInnings] = useState("both");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    (async () => {
      try {
        // Fetch deep analytics (no auth needed, open endpoint)
        const deepRes = await fetch(
          `${API_BASE}/api/matches/${matchId}/deep-analytics`
        );
        const deepJson = await deepRes.json();
        if (deepRes.ok && deepJson?.data) {
          setData(deepJson.data);
        }
        // Also fetch the match analytics for batting/bowling scorecards
        const { ok: matchOk, data: matchData } = await authFetch(
          `${API_BASE}/api/live/${matchId}/analytics`
        );
        if (matchOk && matchData?.data) {
          setMatchResult(matchData.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [matchId, authFetch]);

  if (loading)
    return (
      <div className={styles.stateWrapper}>
        <div className={styles.loadingRing} />
        <p className={styles.stateText}>Computing deep match analytics...</p>
      </div>
    );

  if (error || !data)
    return (
      <div className={styles.stateWrapper}>
        <p className={styles.errorText}>{error || "No data available"}</p>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
      </div>
    );

  const { teams, summary, worm, winProbability, momentum, keyMoments, winner, target, venue, matchType } = data;
  const battingStats = matchResult?.battingStats || [];
  const bowlingStats = matchResult?.bowlingStats || [];

  const finalProb = winProbability?.[winProbability.length - 1]?.prob ?? 50;
  const bigOvers = [
    ...(momentum?.innings1 || []),
    ...(momentum?.innings2 || []),
  ].filter((o) => o.isBigOver).length;

  const inn1RR = summary?.inn1?.overs > 0 ? (summary.inn1.runs / summary.inn1.overs).toFixed(2) : "0.00";
  const inn2RR = summary?.inn2?.overs > 0 ? (summary.inn2.runs / summary.inn2.overs).toFixed(2) : "0.00";

  // Phase breakdown from batting stats
  const battingBarData = battingStats.slice(0, 8).map((b) => ({
    name: b.playerName,
    runs: b.runs,
    balls: b.balls,
    sr: b.strikeRate,
  }));

  const bowlingBarData = bowlingStats.slice(0, 8).map((b) => ({
    name: b.playerName,
    wickets: b.wickets,
    economy: b.economy,
    runs: b.runs,
  }));

  // Performance radar data for top batter/bowler
  const radarBatting = battingStats.slice(0, 1).map((b) => [
    { metric: "Runs", value: Math.min(100, (b.runs / 150) * 100) },
    { metric: "Strike Rate", value: Math.min(100, b.strikeRate / 2) },
    { metric: "4s", value: Math.min(100, b.fours * 10) },
    { metric: "6s", value: Math.min(100, b.sixes * 15) },
    { metric: "Impact", value: Math.min(100, b.runs > 50 ? 80 : b.runs * 1.5) },
  ])[0] || [];

  const storyData = {
    teams,
    summary,
    winner,
    target,
    keyMoments: keyMoments || [],
    momentum,
    winProbability: winProbability || [],
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "worm", label: "Worm & Run Rate" },
    { id: "momentum", label: "Momentum" },
    { id: "players", label: "Player Stats" },
    { id: "moments", label: "Key Moments" },
    { id: "story", label: "Match Story" },
  ];

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Top Nav */}
        <div className={styles.topNav}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className={styles.navBreadcrumb}>
            <span className={styles.navTag}>{matchType || "Custom"}</span>
            {venue && <span className={styles.navVenue}>📍 {venue}</span>}
          </div>
        </div>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroTeams}>
            <div className={styles.heroTeam}>
              <span className={styles.inningsPip} style={{ background: "var(--ci-brand)" }} />
              <span className={styles.heroLabel}>Innings 1</span>
              <h2 className={styles.heroTeamName}>{teams?.innings1}</h2>
              <span className={styles.heroScore} style={{ color: "var(--ci-brand)" }}>
                {summary?.inn1?.runs}/{summary?.inn1?.wickets}
              </span>
              <span className={styles.heroOvers}>({summary?.inn1?.overs} ov)</span>
            </div>
            <div className={styles.heroMid}>
              <span className={styles.heroVs}>vs</span>
              {target > 0 && (
                <div className={styles.targetBlock}>
                  <span className={styles.targetLabel}>Target</span>
                  <span className={styles.targetVal}>{target}</span>
                </div>
              )}
            </div>
            <div className={`${styles.heroTeam} ${styles.right}`}>
              <span className={styles.inningsPip} style={{ background: "var(--ci-accent)" }} />
              <span className={styles.heroLabel}>Innings 2</span>
              <h2 className={styles.heroTeamName}>{teams?.innings2}</h2>
              <span className={styles.heroScore} style={{ color: "var(--ci-accent)" }}>
                {summary?.inn2?.runs}/{summary?.inn2?.wickets}
              </span>
              <span className={styles.heroOvers}>({summary?.inn2?.overs} ov)</span>
            </div>
          </div>
          <div className={styles.winnerStrip}>
            <span className={styles.winnerLabel}>Result</span>
            <span className={styles.winnerVal}>{winner} {matchResult?.outcome || ""}</span>
          </div>
        </section>

        {/* Summary KPIs */}
        <div className={styles.summaryGrid}>
          <SummaryTile icon={Zap} label="Run Rate Inn 1" value={inn1RR} sub="runs/over" accent="var(--ci-brand)" />
          <SummaryTile icon={Target} label="Run Rate Inn 2" value={inn2RR} sub="runs/over" accent="var(--ci-accent)" />
          <SummaryTile icon={Activity} label="Big Overs" value={bigOvers} sub="15+ runs in an over" accent="var(--ci-amber)" />
          <SummaryTile
            icon={TrendingUp}
            label="Chasing Win Prob"
            value={`${finalProb.toFixed(0)}%`}
            sub="final ball probability"
            accent={finalProb > 50 ? "var(--ci-brand)" : "#ef4444"}
          />
          <SummaryTile icon={Shield} label="Wickets Inn 1" value={summary?.inn1?.wickets} sub="bowling team" accent="var(--ci-accent)" />
          <SummaryTile icon={Users} label="Wickets Inn 2" value={summary?.inn2?.wickets} sub="bowling team" accent="#f59e0b" />
        </div>

        {/* Tabs */}
        <div className={styles.tabsRow}>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: Overview */}
        {activeTab === "overview" && (
          <>
            <section className={styles.section}>
              <SectionHeader label="Win Probability — Innings 2" accent="var(--ci-accent)" tag="Ball by ball" />
              {winProbability?.length > 0 ? (
                <WinProbabilityChart data={winProbability} team={teams?.innings2} />
              ) : (
                <div className={styles.emptyChart}>Win probability not available (match may be incomplete)</div>
              )}
            </section>

            <section className={styles.section}>
              <SectionHeader label="Runs Comparison" accent="var(--ci-brand)" />
              <div className={styles.compareGrid}>
                {[
                  { label: teams?.innings1, runs: summary?.inn1?.runs, wkts: summary?.inn1?.wickets, rr: inn1RR, color: "var(--ci-brand)" },
                  { label: teams?.innings2, runs: summary?.inn2?.runs, wkts: summary?.inn2?.wickets, rr: inn2RR, color: "var(--ci-accent)" },
                ].map((team) => (
                  <div key={team.label} className={styles.compareCard} style={{ borderColor: team.color + "44" }}>
                    <div className={styles.compareTeam} style={{ color: team.color }}>{team.label}</div>
                    <div className={styles.compareRuns}>{team.runs}/{team.wkts}</div>
                    <div className={styles.compareRR}>RR: {team.rr}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <SectionHeader label="Over-by-Over Scoring" accent="var(--ci-brand)" tag="Both Innings" />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={[...Array(Math.max(
                    momentum?.innings1?.length || 0,
                    momentum?.innings2?.length || 0
                  ))].map((_, i) => ({
                    over: i + 1,
                    inn1: momentum?.innings1?.[i]?.runs ?? 0,
                    inn2: momentum?.innings2?.[i]?.runs ?? 0,
                  }))}
                  margin={{ top: 8, right: 16, left: -16, bottom: 4 }}
                >
                  <CartesianGrid vertical={false} stroke="var(--ci-border)" strokeDasharray="4 4" />
                  <XAxis dataKey="over" tick={{ fontSize: 10, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--ci-bg-primary)", border: "1px solid var(--ci-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--ci-text-primary)" }}
                    formatter={(val, name) => [val + " runs", name === "inn1" ? teams?.innings1 : teams?.innings2]}
                  />
                  <Legend formatter={(v) => v === "inn1" ? teams?.innings1 : teams?.innings2} />
                  <Bar dataKey="inn1" fill="var(--ci-brand)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="inn2" fill="var(--ci-accent)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </>
        )}

        {/* TAB: Worm */}
        {activeTab === "worm" && (
          <section className={styles.section}>
            <SectionHeader label="Worm Graph — Cumulative Runs" accent="var(--ci-brand)" tag="Over by over" />
            <WormChart
              innings1={worm?.innings1 || []}
              innings2={worm?.innings2 || []}
              team1={teams?.innings1}
              team2={teams?.innings2}
              target={target}
            />
          </section>
        )}

        {/* TAB: Momentum */}
        {activeTab === "momentum" && (
          <section className={styles.section}>
            <SectionHeader label="Momentum Shifts" accent="var(--ci-accent)" />
            <div className={styles.inningsToggle}>
              {[["both", "Both Innings"], ["1", "Innings 1"], ["2", "Innings 2"]].map(([v, l]) => (
                <button
                  key={v}
                  className={`${styles.toggleBtn} ${activeInnings === v ? styles.toggleActive : ""}`}
                  onClick={() => setActiveInnings(v)}
                >
                  {l}
                </button>
              ))}
            </div>
            <MomentumChart
              innings1={momentum?.innings1 || []}
              innings2={momentum?.innings2 || []}
              team1={teams?.innings1}
              team2={teams?.innings2}
              activeInnings={activeInnings}
            />
          </section>
        )}

        {/* TAB: Players */}
        {activeTab === "players" && (
          <>
            {/* Top Batters Chart */}
            <section className={styles.section}>
              <SectionHeader label="Top Batters" accent="var(--ci-brand)" tag="Runs scored" />
              {battingBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    layout="vertical"
                    data={battingBarData}
                    margin={{ top: 8, right: 24, left: 10, bottom: 8 }}
                  >
                    <CartesianGrid horizontal={false} stroke="var(--ci-border)" strokeDasharray="4 4" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "var(--ci-text-primary)", fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "var(--ci-bg-primary)", border: "1px solid var(--ci-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--ci-text-primary)" }} />
                    <Bar dataKey="runs" radius={[0, 4, 4, 0]}>
                      {battingBarData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className={styles.emptyChart}>No batting data available</div>}
            </section>

            {/* Top Bowlers Chart */}
            <section className={styles.section}>
              <SectionHeader label="Top Bowlers" accent="var(--ci-accent)" tag="Wickets taken" />
              {bowlingBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    layout="vertical"
                    data={bowlingBarData}
                    margin={{ top: 8, right: 24, left: 10, bottom: 8 }}
                  >
                    <CartesianGrid horizontal={false} stroke="var(--ci-border)" strokeDasharray="4 4" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "var(--ci-text-primary)", fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "var(--ci-bg-primary)", border: "1px solid var(--ci-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--ci-text-primary)" }} />
                    <Bar dataKey="wickets" radius={[0, 4, 4, 0]}>
                      {bowlingBarData.map((_, i) => (
                        <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className={styles.emptyChart}>No bowling data available</div>}
            </section>

            {/* Batting Scorecard */}
            <section className={styles.section}>
              <SectionHeader label="Batting Scorecard" accent="var(--ci-brand)" />
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>Dots</th><th>SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {battingStats.map((b) => (
                      <tr key={b.playerName} className={styles.tr}>
                        <td className={styles.playerName}>{b.playerName}</td>
                        <td className={styles.runsBadge}>{b.runs}</td>
                        <td>{b.balls}</td>
                        <td>{b.fours}</td>
                        <td>{b.sixes}</td>
                        <td>{b.dots}</td>
                        <td className={b.strikeRate > 150 ? styles.highlight : ""}>{b.strikeRate}</td>
                      </tr>
                    ))}
                    {battingStats.length === 0 && (
                      <tr><td colSpan={7} className={styles.emptyRow}>No batting data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Bowling Scorecard */}
            <section className={styles.section}>
              <SectionHeader label="Bowling Scorecard" accent="#ef4444" />
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Eco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bowlingStats.map((b) => (
                      <tr key={b.playerName} className={styles.tr}>
                        <td className={styles.playerName}>{b.playerName}</td>
                        <td>{b.overs}</td>
                        <td>{b.runs}</td>
                        <td className={b.wickets > 0 ? styles.wicketBadge : ""}>{b.wickets}</td>
                        <td className={b.economy < 7 ? styles.highlight : ""}>{b.economy}</td>
                      </tr>
                    ))}
                    {bowlingStats.length === 0 && (
                      <tr><td colSpan={5} className={styles.emptyRow}>No bowling data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Economy vs Wickets scatter chart */}
            {bowlingBarData.length > 0 && (
              <section className={styles.section}>
                <SectionHeader label="Economy Rate Comparison" accent="var(--ci-amber)" tag="Lower is better" />
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={bowlingBarData} margin={{ top: 8, right: 16, left: -16, bottom: 4 }}>
                    <CartesianGrid vertical={false} stroke="var(--ci-border)" strokeDasharray="4 4" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--ci-text-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "var(--ci-bg-primary)", border: "1px solid var(--ci-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--ci-text-primary)" }} />
                    <Bar dataKey="economy" fill="var(--ci-amber)" radius={[3, 3, 0, 0]} name="Economy Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </section>
            )}
          </>
        )}

        {/* TAB: Key Moments */}
        {activeTab === "moments" && (
          <section className={styles.section}>
            <SectionHeader label="Key Match Moments" accent="var(--ci-amber)" tag="Wickets • Big Overs • Clusters" />
            {keyMoments?.length > 0 ? (
              <KeyMomentsTimeline keyMoments={keyMoments} team1={teams?.innings1} team2={teams?.innings2} />
            ) : (
              <div className={styles.emptyChart}>No significant moments detected yet.</div>
            )}
          </section>
        )}

        {/* TAB: Match Story */}
        {activeTab === "story" && (
          <section className={styles.section}>
            <SectionHeader label="AI Match Story" accent="var(--ci-accent)" />
            <MatchStoryCard data={storyData} />
          </section>
        )}
      </main>
    </div>
  );
};

export default UserMatchDeepAnalytics;
