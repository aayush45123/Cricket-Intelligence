import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import TossImpactChart from "../../components/charts/TossImpactChart/TossImpactChart";
import MatchIntensityChart from "../../components/charts/MatchIntensityChart/MatchIntensityChart";
import TeamWins from "../../components/charts/TeamWins/TeamWins";
import RunRateChart from "../../components/charts/RunRateChart/RunRateChart";
import TopRunScorer from "../../components/charts/TopRunScorer/TopRunScorer";
import HighestWicketTaker from "../../components/charts/HighestWicketTaker/HighestWicketTaker";
import {
  Trophy,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  Shield,
  Star,
  Landmark,
  ClipboardList,
} from "lucide-react";

const RECENT_SAMPLE_MATCHES = [
  { id: "ipl-1", teamA: "Chennai Super Kings", teamB: "Gujarat Titans", venue: "Narendra Modi Stadium", result: "CSK won by 5 wickets" },
  { id: "ipl-2", teamA: "Mumbai Indians", teamB: "Royal Challengers Bengaluru", venue: "Wankhede Stadium", result: "MI won by 6 wickets" },
  { id: "ipl-3", teamA: "Kolkata Knight Riders", teamB: "Sunrisers Hyderabad", venue: "MA Chidambaram Stadium", result: "KKR won by 8 wickets" },
];

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/matches/analytics");
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    };
    fetchData();
  }, []);

  if (!data) {
    return (
      <div className={styles.loadingWrapper}>
        <p className={styles.loadingText}>Loading Intelligence Dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardPage}>
      {/* ── Top Banner ────────────────────────────────────────── */}
      <div className={styles.headerBanner}>
        <div className={styles.titleArea}>
          <h1 className={styles.mainTitle}>Cricket Match Intelligence Dashboard</h1>
          <p className={styles.subTitle}>
            Enterprise analytics, predictive insights, and deep historical IPL trends.
          </p>
        </div>
        <div className={styles.bannerBadge}>
          <span>●</span> 15+ Seasons Analytical Engine Active
        </div>
      </div>

      {/* ── 1. Match Summary Cards ─────────────────────────────── */}
      <section>
        <h2 className={styles.sectionTitle}>
          <BarChart3 size={18} color="var(--ci-brand)" /> Match Summary Cards
        </h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>Total Matches</span>
              <span className={styles.cardIcon}>
                <Trophy size={16} color="var(--ci-brand)" />
              </span>
            </div>
            <div className={styles.cardValue}>{data?.totalMatches || 0}</div>
            <div className={styles.cardMeta}>↑ IPL Historic Dataset</div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>Avg Run Rate (1st Innings)</span>
              <span className={styles.cardIcon}>
                <Zap size={16} color="var(--ci-brand)" />
              </span>
            </div>
            <div className={styles.cardValue}>
              {data?.averageRunRateTeamA?.toFixed(2) || "8.42"}
            </div>
            <div className={styles.cardMeta}>Batting First Benchmark</div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>Avg Run Rate (2nd Innings)</span>
              <span className={styles.cardIcon}>
                <Target size={16} color="var(--ci-accent)" />
              </span>
            </div>
            <div className={styles.cardValue}>
              {data?.averageRunRateTeamB?.toFixed(2) || "8.26"}
            </div>
            <div className={styles.cardMeta}>Chasing Benchmark</div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>Avg Pressure Index</span>
              <span className={styles.cardIcon}>
                <TrendingUp size={16} color="var(--ci-amber)" />
              </span>
            </div>
            <div className={styles.cardValue}>
              {data?.averagePressureIndex?.toFixed(2) || "64.8"}
            </div>
            <div className={styles.cardMeta}>High Intensity Rate</div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>Most Dominant Match</span>
              <span className={styles.cardIcon}>
                <Trophy size={16} color="var(--ci-brand)" />
              </span>
            </div>
            <div className={styles.cardValue} style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              {data?.mostDominantMatch?.teams?.teamA?.name || "MI"} vs{" "}
              {data?.mostDominantMatch?.teams?.teamB?.name || "CSK"}
            </div>
            <div className={styles.cardMeta}>Peak Win Margin</div>
          </div>
        </div>
      </section>

      {/* ── 2. Win Trend / Run Rate Timeline ───────────────────── */}
      <section className={styles.timelineSection}>
        <h2 className={styles.sectionTitle}>
          <TrendingUp size={18} color="var(--ci-brand)" /> Win Trend / Run Rate Timeline
        </h2>
        <div className={styles.timelineGrid}>
          <TeamWins />
          <RunRateChart />
        </div>
      </section>

      {/* ── 3. Team Comparison & Player Impact ─────────────────── */}
      <section className={styles.splitGrid}>
        <div className={styles.cardPanel}>
          <h2 className={styles.sectionTitle}>
            <Shield size={18} color="var(--ci-accent)" /> Team Comparison
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <TossImpactChart />
            <MatchIntensityChart />
          </div>
        </div>

        <div className={styles.cardPanel}>
          <h2 className={styles.sectionTitle}>
            <Star size={18} color="var(--ci-amber)" /> Player Impact
          </h2>
          <div className={styles.playerImpactGrid}>
            <TopRunScorer />
            <HighestWicketTaker />
          </div>
        </div>
      </section>

      {/* ── 4. Venue Stats & Recent Matches ─────────────────────── */}
      <section className={styles.splitGrid}>
        <div className={styles.cardPanel}>
          <h2 className={styles.sectionTitle}>
            <Landmark size={18} color="var(--ci-brand)" /> Venue Stats
          </h2>
          <p style={{ color: "var(--ci-text-secondary)", fontSize: "0.9rem", marginBottom: "16px" }}>
            Pitch conditions, boundary dimensions, and win split metrics across top Indian venues.
          </p>
          <div className={styles.recentMatchFeed}>
            <div className={styles.recentMatchItem}>
              <div>
                <div className={styles.matchTeams}>Narendra Modi Stadium, Ahmedabad</div>
                <div className={styles.matchVenue}>Batting 1st Win Rate: 54% | Avg 1st Inn Score: 178</div>
              </div>
              <span className={styles.matchResultTag}>Pace Friendly</span>
            </div>
            <div className={styles.recentMatchItem}>
              <div>
                <div className={styles.matchTeams}>Wankhede Stadium, Mumbai</div>
                <div className={styles.matchVenue}>Batting 2nd Win Rate: 58% | Avg 1st Inn Score: 184</div>
              </div>
              <span className={styles.matchResultTag}>Chasing Ground</span>
            </div>
            <div className={styles.recentMatchItem}>
              <div>
                <div className={styles.matchTeams}>M. Chinnaswamy Stadium, Bengaluru</div>
                <div className={styles.matchVenue}>Avg Sixes per Match: 16.4 | High Scoring</div>
              </div>
              <span className={styles.matchResultTag}>Batter Paradise</span>
            </div>
          </div>
        </div>

        <div className={styles.cardPanel}>
          <h2 className={styles.sectionTitle}>
            <ClipboardList size={18} color="var(--ci-accent)" /> Recent Matches
          </h2>
          <div className={styles.recentMatchFeed}>
            {RECENT_SAMPLE_MATCHES.map((match) => (
              <div key={match.id} className={styles.recentMatchItem}>
                <div>
                  <div className={styles.matchTeams}>
                    {match.teamA} vs {match.teamB}
                  </div>
                  <div className={styles.matchVenue}>{match.venue}</div>
                </div>
                <span className={styles.matchResultTag}>{match.result}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
