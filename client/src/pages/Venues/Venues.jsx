import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Venues.module.css";

const PITCH_META = {
  batting: {
    label: "Batting Friendly",
    color: "var(--ci-brand)",
    bg: "var(--ci-brand-subtle)",
    border: "var(--ci-border-brand)",
    icon: "🏏",
  },
  bowling: {
    label: "Bowling Friendly",
    color: "var(--ci-danger)",
    bg: "rgba(255,77,109,0.07)",
    border: "rgba(255,77,109,0.28)",
    icon: "⚡",
  },
  balanced: {
    label: "Balanced",
    color: "var(--ci-accent)",
    bg: "var(--ci-accent-subtle)",
    border: "var(--ci-border-accent)",
    icon: "⚖️",
  },
};

const SORT_OPTIONS = [
  { value: "totalMatches", label: "Most Matches" },
  { value: "avgFirstInningsScore", label: "Highest Avg Score" },
  { value: "battingFirstWinPct", label: "Batting First %" },
  { value: "tossWinMatchWinPct", label: "Toss Impact" },
];

const Venues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [pitchFilter, setPitch] = useState("all");
  const [sortBy, setSortBy] = useState("totalMatches");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/venues");
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);
        setVenues(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const displayed = venues
    .filter((v) => {
      const q = search.toLowerCase();
      const matchQ =
        !q ||
        v.venue.toLowerCase().includes(q) ||
        (v.city || "").toLowerCase().includes(q);
      const matchP = pitchFilter === "all" || v.pitchCode === pitchFilter;
      return matchQ && matchP;
    })
    .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>Venue Analytics</h1>
            <p className={styles.heroSubtitle}>
              Pitch classifications, win probabilities, and toss bias across
              every ground.
            </p>
          </div>
          {!loading && (
            <div className={styles.heroCounts}>
              {["batting", "bowling", "balanced"].map((code) => {
                const m = PITCH_META[code];
                const n = venues.filter((v) => v.pitchCode === code).length;
                return (
                  <div
                    key={code}
                    className={styles.heroCountPill}
                    style={{ borderColor: m.border, background: m.bg }}
                  >
                    <span>{m.icon}</span>
                    <span style={{ color: m.color, fontWeight: 700 }}>{n}</span>
                    <span className={styles.heroCountLabel}>{m.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* CONTROLS */}
        <div className={styles.controls}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              placeholder="Search venue or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => setSearch("")}>
                ✕
              </button>
            )}
          </div>

          {/* Pitch filter */}
          <div className={styles.filterGroup}>
            {["all", "batting", "bowling", "balanced"].map((p) => {
              const m = PITCH_META[p];
              return (
                <button
                  key={p}
                  className={`${styles.filterBtn} ${pitchFilter === p ? styles.filterActive : ""}`}
                  style={
                    pitchFilter === p && m
                      ? {
                          color: m.color,
                          borderColor: m.border,
                          background: m.bg,
                        }
                      : {}
                  }
                  onClick={() => setPitch(p)}
                >
                  {m ? `${m.icon} ${m.label}` : "All Pitches"}
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <span className={styles.resultCount}>{displayed.length} venues</span>
        </div>

        {/* STATES */}
        {loading && (
          <div className={styles.stateWrapper}>
            <div className={styles.loadingRing} />
            <p className={styles.stateText}>Loading venues...</p>
          </div>
        )}
        {!loading && error && <p className={styles.errorText}>{error}</p>}

        {/* GRID */}
        {!loading && !error && (
          <section className={styles.grid}>
            {displayed.map((v) => {
              const pm = PITCH_META[v.pitchCode] ?? PITCH_META.balanced;
              return (
                <div
                  key={v.venue}
                  className={styles.card}
                  style={{ "--card-border": pm.border }}
                >
                  {/* Top accent */}
                  <div
                    className={styles.cardTopBar}
                    style={{
                      background: `linear-gradient(90deg, ${pm.color}, transparent)`,
                    }}
                  />

                  {/* Header */}
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitles}>
                      <h3 className={styles.cardVenue}>{v.venue}</h3>
                      {v.city && (
                        <span className={styles.cardCity}>📍 {v.city}</span>
                      )}
                    </div>
                    <span
                      className={styles.pitchBadge}
                      style={{
                        color: pm.color,
                        borderColor: pm.border,
                        background: pm.bg,
                      }}
                    >
                      {pm.icon} {pm.label}
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div className={styles.cardStats}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Matches</span>
                      <span className={styles.statVal}>{v.totalMatches}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Avg 1st Inn</span>
                      <span className={styles.statVal}>
                        {v.avgFirstInningsScore}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Bat 1st Wins</span>
                      <span
                        className={styles.statVal}
                        style={{
                          color:
                            v.battingFirstWinPct > 55
                              ? "var(--ci-brand)"
                              : v.battingFirstWinPct < 45
                                ? "var(--ci-danger)"
                                : "var(--ci-accent)",
                        }}
                      >
                        {v.battingFirstWinPct}%
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Toss → Win</span>
                      <span
                        className={styles.statVal}
                        style={{
                          color:
                            v.tossWinMatchWinPct > 55
                              ? "var(--ci-blue)"
                              : "var(--ci-text-secondary)",
                        }}
                      >
                        {v.tossWinMatchWinPct}%
                      </span>
                    </div>
                  </div>

                  {/* Mini bat-first bar */}
                  <div className={styles.winBar}>
                    <div
                      className={styles.winBarFill}
                      style={{
                        width: `${v.battingFirstWinPct}%`,
                        background: "var(--ci-brand)",
                      }}
                    />
                    <div
                      className={styles.winBarFill}
                      style={{
                        width: `${v.chasingWinPct}%`,
                        background: "var(--ci-accent)",
                      }}
                    />
                  </div>
                  <div className={styles.winBarLabels}>
                    <span style={{ color: "var(--ci-brand)" }}>
                      Bat {v.battingFirstWinPct}%
                    </span>
                    <span style={{ color: "var(--ci-accent)" }}>
                      Chase {v.chasingWinPct}%
                    </span>
                  </div>

                  <button
                    className={styles.detailBtn}
                    style={{ color: pm.color, borderColor: pm.border }}
                    onClick={() =>
                      navigate(`/venues/${encodeURIComponent(v.venue)}`)
                    }
                  >
                    Deep Analysis →
                  </button>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
};

export default Venues;
