import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./MatchupDetail.module.css";
import MatchupRunDistribution from "../../components/charts/MatchupRunDistribution/MatchupRunDistribution";
import MatchupPhaseChart from "../../components/charts/MatchupPhase/MatchupPhase";
import MatchupSeasonTrend from "../../components/charts/MatchupSeasonTrend/MatchupSeasonTrend";
import MatchupOverByOver from "../../components/charts/MatchupOverByOver/MatchupOverByOver";
import MatchupPerMatch from "../../components/charts/MatchupPreMatch/MatchupPreMatch";

/* ── Helpers ──────────────────────────────────────────────────── */
const verdict = (sr, dismissals, balls) => {
  if (!balls || balls < 6)
    return { label: "Insufficient Data", color: "var(--ci-text-muted)" };
  if (dismissals >= 3 && sr < 100)
    return { label: "Bowler Dominates", color: "var(--ci-danger)" };
  if (dismissals >= 2 && sr < 120)
    return { label: "Bowler Ahead", color: "var(--ci-accent)" };
  if (sr > 160 && dismissals === 0)
    return { label: "Batter Dominates", color: "var(--ci-brand)" };
  if (sr > 130) return { label: "Batter Ahead", color: "var(--ci-brand)" };
  return { label: "Closely Contested", color: "var(--ci-blue)" };
};

const StatTile = ({ label, value, unit, accent, sub }) => (
  <div className={styles.statTile}>
    <span className={styles.statLabel}>{label}</span>
    <span className={styles.statValue} style={{ color: accent }}>
      {value}
      {unit && <span className={styles.statUnit}>{unit}</span>}
    </span>
    {sub && <span className={styles.statSub}>{sub}</span>}
  </div>
);

const SectionHeader = ({ label, accent, tag }) => (
  <div className={styles.sectionHeader}>
    <span className={styles.sectionAccent} style={{ background: accent }} />
    <h2 className={styles.sectionTitle}>{label}</h2>
    {tag && <span className={styles.sectionTag}>{tag}</span>}
  </div>
);

/* ── Main ─────────────────────────────────────────────────────── */
const MatchupDetail = () => {
  const { batter, bowler } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(
          `/api/matchups/${encodeURIComponent(batter)}/${encodeURIComponent(bowler)}`,
        );
        const contentType = res.headers.get("content-type") || "";
        const result = contentType.includes("application/json")
          ? await res.json()
          : null;

        if (!res.ok) {
          throw new Error(
            result?.message || `Failed to fetch matchup (${res.status})`,
          );
        }

        setData(result?.data || null);
      } catch (err) {
        setError(err?.message || "Error fetching matchup");
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [batter, bowler]);

  if (loading)
    return (
      <div className={styles.stateWrapper}>
        <div className={styles.loadingRing} />
        <p className={styles.stateText}>Analysing head-to-head data...</p>
      </div>
    );

  if (error)
    return (
      <div className={styles.stateWrapper}>
        <p className={styles.errorText}>{error}</p>
        <button
          className={styles.backBtn}
          onClick={() => navigate("/matchups")}
        >
          ← Back to Search
        </button>
      </div>
    );

  if (!data) return null;

  const {
    summary,
    runDistribution,
    phaseBreakdown,
    overByOver,
    perMatch,
    seasonTrend,
    dismissals,
  } = data;
  const vd = verdict(
    summary.strikeRate,
    summary.totalDismissals,
    summary.totalBalls,
  );
  const decodedBatter = decodeURIComponent(batter);
  const decodedBowler = decodeURIComponent(bowler);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* TOP NAV */}
        <div className={styles.topNav}>
          <button
            className={styles.backBtn}
            onClick={() => navigate("/matchups")}
          >
            ← New Matchup
          </button>
        </div>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroPlayers}>
            <div className={styles.heroPlayer}>
              <div
                className={styles.heroAvatar}
                style={{
                  borderColor: "var(--ci-brand)",
                  background: "var(--ci-brand-subtle)",
                }}
              >
                {decodedBatter
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className={styles.heroPlayerInfo}>
                <span
                  className={styles.heroRole}
                  style={{ color: "var(--ci-brand)" }}
                >
                  🏏 Batter
                </span>
                <h1 className={styles.heroName}>{decodedBatter}</h1>
              </div>
            </div>

            <div className={styles.heroMidBlock}>
              <div
                className={styles.heroVerdictBadge}
                style={{
                  color: vd.color,
                  borderColor: vd.color + "44",
                  background: vd.color + "10",
                }}
              >
                {vd.label}
              </div>
              <span className={styles.heroVs}>vs</span>
              <span className={styles.heroMatchCount}>
                {summary.totalMatches} encounters
              </span>
            </div>

            <div className={`${styles.heroPlayer} ${styles.heroPlayerRight}`}>
              <div
                className={styles.heroPlayerInfo}
                style={{ alignItems: "flex-end" }}
              >
                <span
                  className={styles.heroRole}
                  style={{ color: "var(--ci-danger)" }}
                >
                  ⚡ Bowler
                </span>
                <h1 className={styles.heroName}>{decodedBowler}</h1>
              </div>
              <div
                className={styles.heroAvatar}
                style={{
                  borderColor: "var(--ci-danger)",
                  background: "rgba(255,77,109,0.08)",
                }}
              >
                {decodedBowler
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>
            </div>
          </div>
        </section>

        {/* KEY STATS */}
        <div className={styles.statsGrid}>
          <StatTile
            label="Runs Scored"
            value={summary.totalRuns}
            accent="var(--ci-brand)"
            sub="by batter"
          />
          <StatTile
            label="Balls Faced"
            value={summary.totalBalls}
            accent="var(--ci-text-primary)"
            sub="legal deliveries"
          />
          <StatTile
            label="Strike Rate"
            value={summary.strikeRate}
            accent={
              summary.strikeRate > 130
                ? "var(--ci-brand)"
                : summary.strikeRate < 100
                  ? "var(--ci-danger)"
                  : "var(--ci-accent)"
            }
          />
          <StatTile
            label="Dismissals"
            value={summary.totalDismissals}
            accent="var(--ci-danger)"
            sub={`avg ${summary.battingAverage}`}
          />
          <StatTile
            label="Dot Balls"
            value={summary.dotBalls}
            unit=""
            accent="var(--ci-text-secondary)"
            sub={`${summary.dotBallPct}% of balls`}
          />
          <StatTile
            label="Boundaries"
            value={`${summary.fours}×4, ${summary.sixes}×6`}
            accent="var(--ci-accent)"
            sub="fours and sixes"
          />
        </div>

        {/* DISMISSAL BREAKDOWN */}
        {dismissals.length > 0 && (
          <section className={styles.section}>
            <SectionHeader
              label="How the Batter Got Out"
              accent="var(--ci-danger)"
              tag={`${summary.totalDismissals} dismissals`}
            />
            <div className={styles.dismissalGrid}>
              {dismissals.map((d) => (
                <div key={d.kind} className={styles.dismissalItem}>
                  <span className={styles.dismissalKind}>{d.kind}</span>
                  <div className={styles.dismissalBar}>
                    <div
                      className={styles.dismissalFill}
                      style={{
                        width: `${(d.count / summary.totalDismissals) * 100}%`,
                      }}
                    />
                  </div>
                  <span
                    className={styles.dismissalCount}
                    style={{ color: "var(--ci-danger)" }}
                  >
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RUN DIST + PHASE */}
        <div className={styles.twoCol}>
          <section className={styles.section}>
            <SectionHeader label="Run Distribution" accent="var(--ci-brand)" />
            <MatchupRunDistribution
              data={runDistribution}
              totalBalls={summary.totalBalls}
            />
          </section>
          <section className={styles.section}>
            <SectionHeader label="Phase Breakdown" accent="var(--ci-blue)" />
            <MatchupPhaseChart data={phaseBreakdown} />
          </section>
        </div>

        {/* OVER BY OVER */}
        {overByOver.length > 0 && (
          <section className={styles.section}>
            <SectionHeader
              label="Over-by-Over Map"
              accent="var(--ci-accent)"
              tag="aggregated across all encounters"
            />
            <MatchupOverByOver data={overByOver} />
          </section>
        )}

        {/* SEASON TREND */}
        {seasonTrend.length > 1 && (
          <section className={styles.section}>
            <SectionHeader
              label="Season Trend"
              accent="var(--ci-blue)"
              tag="how the battle evolved"
            />
            <MatchupSeasonTrend data={seasonTrend} />
          </section>
        )}

        {/* PER MATCH */}
        {perMatch.length > 0 && (
          <section className={styles.section}>
            <SectionHeader
              label="Match-by-Match Log"
              accent="var(--ci-text-secondary)"
              tag={`${perMatch.length} matches`}
            />
            <MatchupPerMatch
              data={perMatch}
              batter={decodedBatter}
              bowler={decodedBowler}
            />
          </section>
        )}
      </main>
    </div>
  );
};

export default MatchupDetail;
