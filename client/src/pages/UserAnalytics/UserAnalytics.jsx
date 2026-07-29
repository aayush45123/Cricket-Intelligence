import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE } from "../../config";
import styles from "./UserAnalytics.module.css";
import { Trophy, Target, Zap, Shield, Swords, PlusCircle } from "lucide-react";

const UserAnalytics = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("batting"); // "batting", "bowling", "teams", "matchups"

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
        <div className={styles.loading}>Loading custom match analytics...</div>
      </div>
    );
  }

  const { summary = {}, topBatters = [], topBowlers = [], teamStats = [], matchups = [] } = data || {};

  return (
    <div className={styles.page}>
      {/* Hero Header */}
      <section className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>My Intelligence</div>
          <h1 className={styles.heroTitle}>Analyze My Matches</h1>
          <p className={styles.heroSub}>
            Comprehensive analytics, leaderboards, and player insights derived exclusively from your custom matches.
          </p>
        </div>
        <button className={styles.newMatchBtn} onClick={() => navigate("/my-matches/new")}>
          <PlusCircle size={16} /> New Match
        </button>
      </section>

      {/* KPI Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Trophy size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{summary.totalMatches || 0}</div>
            <div className={styles.statLabel}>Matches Recorded</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Zap size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{summary.totalRuns || 0}</div>
            <div className={styles.statLabel}>Total Runs Scored</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Target size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{summary.totalWickets || 0}</div>
            <div className={styles.statLabel}>Total Wickets Taken</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Shield size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{teamStats.length}</div>
            <div className={styles.statLabel}>Teams Represented</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabBtn} ${activeTab === "batting" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("batting")}
        >
          Top Batters ({topBatters.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "bowling" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("bowling")}
        >
          Top Bowlers ({topBowlers.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "teams" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("teams")}
        >
          Team Records ({teamStats.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "matchups" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("matchups")}
        >
          Batter vs Bowler ({matchups.length})
        </button>
      </div>

      {/* Content per active tab */}
      {summary.totalMatches === 0 ? (
        <div className={styles.empty}>
          <Trophy size={40} color="var(--ci-brand)" style={{ marginBottom: "12px" }} />
          <h3 className={styles.emptyTitle}>No match data available</h3>
          <p className={styles.emptySub}>
            Start and score custom matches to unlock your personalized player & team intelligence!
          </p>
          <button className={styles.newMatchBtn} onClick={() => navigate("/my-matches/new")}>
            <PlusCircle size={16} /> Start Your First Match
          </button>
        </div>
      ) : (
        <>
          {activeTab === "batting" && (
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Batter</th>
                    <th>Innings</th>
                    <th>Runs</th>
                    <th>Balls</th>
                    <th>Strike Rate</th>
                    <th>Average</th>
                    <th>4s</th>
                    <th>6s</th>
                  </tr>
                </thead>
                <tbody>
                  {topBatters.map((b, idx) => (
                    <tr key={idx}>
                      <td className={styles.playerName}>{b.name}</td>
                      <td>{b.innings}</td>
                      <td>
                        <span className={styles.badgeHighlight}>{b.runs}</span>
                      </td>
                      <td>{b.balls}</td>
                      <td>{b.strikeRate}</td>
                      <td>{b.average}</td>
                      <td>{b.fours}</td>
                      <td>{b.sixes}</td>
                    </tr>
                  ))}
                  {topBatters.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                        No batting records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "bowling" && (
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Bowler</th>
                    <th>Matches</th>
                    <th>Wickets</th>
                    <th>Overs</th>
                    <th>Runs Conceded</th>
                    <th>Economy</th>
                    <th>Average</th>
                  </tr>
                </thead>
                <tbody>
                  {topBowlers.map((b, idx) => (
                    <tr key={idx}>
                      <td className={styles.playerName}>{b.name}</td>
                      <td>{b.matches}</td>
                      <td>
                        <span className={styles.badgeHighlight}>{b.wickets}</span>
                      </td>
                      <td>{b.overs}</td>
                      <td>{b.runsConceded}</td>
                      <td>{b.economy}</td>
                      <td>{b.average}</td>
                    </tr>
                  ))}
                  {topBowlers.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                        No bowling records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "teams" && (
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
                        <td>
                          <span className={styles.badgeHighlight}>{t.won}</span>
                        </td>
                        <td>{t.lost}</td>
                        <td>{winPct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

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
                    <th>Strike Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {matchups.map((m, idx) => (
                    <tr key={idx}>
                      <td className={styles.playerName}>{m.batter}</td>
                      <td>{m.bowler}</td>
                      <td>
                        <span className={styles.badgeHighlight}>{m.runs}</span>
                      </td>
                      <td>{m.balls}</td>
                      <td>{m.outs}</td>
                      <td>{m.sr}</td>
                    </tr>
                  ))}
                  {matchups.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                        No player matchups recorded yet.
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
