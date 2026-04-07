import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./VenueDetails.module.css";
import VenueWinSplitChart from "../../components/charts/VenuewinsplitChart/VenuewinsplitChart";
import VenueTossChart from "../../components/charts/VenuetossChart/VenuetossChart";
import VenueSeasonTrend from "../../components/charts/VenueseasontrendChart/VenueseasontrendChart";
import VenueScoreDistribution from "../../components/charts/VenuescoredistributionChart/VenuescoredistributionChart";
import VenueTopTeams from "../../components/charts/VenuetopteamsChart/VenuetopteamsChart";

const PITCH_META = {
  batting: {
    label: "Batting Friendly",
    color: "var(--ci-brand)",
    bg: "var(--ci-brand-subtle)",
    border: "var(--ci-border-brand)",
    icon: "🏏",
    desc: "High-scoring ground. Batsmen dominate. Expect big first-innings totals and chasing sides to be competitive.",
  },
  bowling: {
    label: "Bowling Friendly",
    color: "var(--ci-danger)",
    bg: "rgba(255,77,109,0.07)",
    border: "rgba(255,77,109,0.28)",
    icon: "⚡",
    desc: "Bowlers enjoy extra movement. Low totals are common. Taking wickets early is the key to winning here.",
  },
  balanced: {
    label: "Balanced Pitch",
    color: "var(--ci-accent)",
    bg: "var(--ci-accent-subtle)",
    border: "var(--ci-border-accent)",
    icon: "⚖️",
    desc: "Neither side has a clear advantage. Strategy and execution determine outcomes more than conditions.",
  },
};

const StatTile = ({ label, value, unit, accent, sub }) => (
  <div className={styles.statTile} style={{ "--ta": accent }}>
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

const VenueDetail = () => {
  const { venue } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/venues/${venue}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [venue]);

  if (loading)
    return (
      <div className={styles.stateWrapper}>
        <div className={styles.loadingRing} />
        <p className={styles.stateText}>Loading venue analytics...</p>
      </div>
    );

  if (error)
    return (
      <div className={styles.stateWrapper}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
    );

  if (!data) return null;

  const pm = PITCH_META[data.pitchCode] ?? PITCH_META.balanced;
  const tossImpactStrong = data.tossImpact > 58;
  const tossImpactWeak = data.tossImpact < 42;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* TOP NAV */}
        <div className={styles.topNav}>
          <button
            className={styles.backBtn}
            onClick={() => navigate("/venues")}
          >
            ← All Venues
          </button>
          {data.city && (
            <span className={styles.cityLabel}>📍 {data.city}</span>
          )}
        </div>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.pitchIcon}>{pm.icon}</div>
            <div>
              <h1 className={styles.heroVenue}>{data.venue}</h1>
              <div className={styles.heroBadgeRow}>
                <span
                  className={styles.pitchBadge}
                  style={{
                    color: pm.color,
                    borderColor: pm.border,
                    background: pm.bg,
                  }}
                >
                  {pm.label}
                </span>
                <span className={styles.matchCount}>
                  {data.totalMatches} matches
                </span>
              </div>
            </div>
          </div>
          {/* Pitch verdict card */}
          <div
            className={styles.verdictCard}
            style={{ borderColor: pm.border, background: pm.bg }}
          >
            <span className={styles.verdictTitle} style={{ color: pm.color }}>
              Pitch Verdict
            </span>
            <p className={styles.verdictDesc}>{pm.desc}</p>
            <div className={styles.verdictAvg}>
              Avg 1st Inn Score:
              <strong style={{ color: pm.color }}>
                {" "}
                {data.avgFirstInningsScore}
              </strong>
            </div>
          </div>
        </section>

        {/* KEY STATS */}
        <div className={styles.statsGrid}>
          <StatTile
            label="Avg 1st Inn"
            value={data.avgFirstInningsScore}
            accent="var(--ci-brand)"
            sub="runs scored"
          />
          <StatTile
            label="Avg 2nd Inn"
            value={data.avgSecondInningsScore}
            accent="var(--ci-accent)"
            sub="runs scored"
          />
          <StatTile
            label="Avg Wickets"
            value={data.avgWicketsPerMatch}
            accent="var(--ci-danger)"
            sub="per match"
          />
          <StatTile
            label="Bat First Wins"
            value={data.battingFirstWinPct}
            unit="%"
            accent="var(--ci-brand)"
            sub={`${data.battingFirstWins} wins`}
          />
          <StatTile
            label="Chase Wins"
            value={data.chasingWinPct}
            unit="%"
            accent="var(--ci-accent)"
            sub={`${data.chasingWins} wins`}
          />
          <StatTile
            label="Toss → Win"
            value={data.tossImpact}
            unit="%"
            accent={
              tossImpactStrong
                ? "var(--ci-blue)"
                : tossImpactWeak
                  ? "var(--ci-text-muted)"
                  : "var(--ci-text-secondary)"
            }
            sub={
              tossImpactStrong
                ? "Toss matters a lot!"
                : tossImpactWeak
                  ? "Toss barely matters"
                  : "Moderate toss impact"
            }
          />
        </div>

        {/* WIN SPLIT + TOSS */}
        <div className={styles.twoCol}>
          <section className={styles.section}>
            <SectionHeader
              label="Batting First vs Chasing"
              accent="var(--ci-brand)"
            />
            <VenueWinSplitChart
              battingFirstWinPct={data.battingFirstWinPct}
              chasingWinPct={data.chasingWinPct}
              battingFirstWins={data.battingFirstWins}
              chasingWins={data.chasingWins}
            />
          </section>

          <section className={styles.section}>
            <SectionHeader label="Toss Decision Bias" accent="var(--ci-blue)" />
            <VenueTossChart
              tossImpact={data.tossImpact}
              fieldWinPct={data.tossDecisionBreakdown.field.winPct}
              fieldCount={data.tossDecisionBreakdown.field.count}
              batWinPct={data.tossDecisionBreakdown.bat.winPct}
              batCount={data.tossDecisionBreakdown.bat.count}
            />
          </section>
        </div>

        {/* SEASON TREND */}
        {data.seasonTrend?.length > 1 && (
          <section className={styles.section}>
            <SectionHeader
              label="Avg 1st Innings Score by Season"
              accent="var(--ci-accent)"
              tag="Trend"
            />
            <VenueSeasonTrend data={data.seasonTrend} />
          </section>
        )}

        {/* SCORE DISTRIBUTION */}
        {data.scoreDistribution?.length > 0 && (
          <section className={styles.section}>
            <SectionHeader
              label="1st Innings Score Distribution"
              accent="var(--ci-brand)"
              tag="Histogram"
            />
            <VenueScoreDistribution data={data.scoreDistribution} />
          </section>
        )}

        {/* TOP TEAMS */}
        {data.topTeams?.length > 0 && (
          <section className={styles.section}>
            <SectionHeader
              label="Top Teams at this Venue"
              accent="var(--ci-accent)"
              tag={`${data.topTeams.length} teams`}
            />
            <VenueTopTeams
              teams={data.topTeams}
              totalMatches={data.totalMatches}
            />
          </section>
        )}
      </main>
    </div>
  );
};

export default VenueDetail;
