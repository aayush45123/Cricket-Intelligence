import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "./SearchPage.module.css";

/* ── Constants ───────────────────────────────────────────────── */
const ROLES = [
  { value: "all", label: "All Roles" },
  { value: "batter", label: "Batter" },
  { value: "bowler", label: "Bowler" },
  { value: "allrounder", label: "All-Rounder" },
];

const ROLE_COLORS = {
  Batter: "var(--ci-brand)",
  Bowler: "var(--ci-danger)",
  "All-Rounder": "var(--ci-accent)",
};

const SR_PRESETS = [
  { label: "Any", min: 0, max: 999 },
  { label: "< 100", min: 0, max: 99 },
  { label: "100–130", min: 100, max: 130 },
  { label: "130–150", min: 130, max: 150 },
  { label: "150+", min: 150, max: 999 },
];

const ECO_PRESETS = [
  { label: "Any", min: 0, max: 99 },
  { label: "< 7", min: 0, max: 6.99 },
  { label: "7–8", min: 7, max: 8 },
  { label: "8–9", min: 8, max: 9 },
  { label: "9+", min: 9, max: 99 },
];

/* ── Player Card ─────────────────────────────────────────────── */
const PlayerCard = ({ player, navigate }) => {
  const { playerName, role, teams, batting, bowling } = player;
  const accent = ROLE_COLORS[role] || "var(--ci-blue)";
  const initials = playerName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const mainTeam = teams?.[0] || "";

  return (
    <div className={styles.card} style={{ "--ca": accent }}>
      <div className={styles.cardAccent} style={{ background: accent }} />

      <div className={styles.cardHeader}>
        <div
          className={styles.avatar}
          style={{
            color: accent,
            borderColor: accent + "44",
            background: accent + "10",
          }}
        >
          {initials}
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.playerName}>{playerName}</h3>
          <div className={styles.cardMeta}>
            <span
              className={styles.roleBadge}
              style={{
                color: accent,
                borderColor: accent + "44",
                background: accent + "10",
              }}
            >
              {role}
            </span>
            {mainTeam && <span className={styles.team}>{mainTeam}</span>}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.cardStats}>
        {batting && (
          <>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Runs</span>
              <span
                className={styles.statVal}
                style={{ color: "var(--ci-brand)" }}
              >
                {batting.totalRuns.toLocaleString()}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>SR</span>
              <span
                className={styles.statVal}
                style={{
                  color:
                    batting.strikeRate > 130
                      ? "var(--ci-brand)"
                      : batting.strikeRate < 100
                        ? "var(--ci-danger)"
                        : "var(--ci-text-primary)",
                }}
              >
                {batting.strikeRate}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Bdry%</span>
              <span className={styles.statVal}>{batting.boundaryPercent}%</span>
            </div>
          </>
        )}
        {bowling && (
          <>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Wickets</span>
              <span
                className={styles.statVal}
                style={{ color: "var(--ci-danger)" }}
              >
                {bowling.totalWickets}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Eco</span>
              <span
                className={styles.statVal}
                style={{
                  color:
                    bowling.economy < 7
                      ? "var(--ci-brand)"
                      : bowling.economy > 9
                        ? "var(--ci-danger)"
                        : "var(--ci-accent)",
                }}
              >
                {bowling.economy}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Dot%</span>
              <span className={styles.statVal}>{bowling.dotBallPercent}%</span>
            </div>
          </>
        )}
      </div>

      <button
        className={styles.viewBtn}
        style={{ color: accent, borderColor: accent + "44" }}
        onClick={() => navigate(`/players/${encodeURIComponent(playerName)}`)}
      >
        View Full Profile →
      </button>
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────────────── */
const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  /* Filter state — initialise from URL params */
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [role, setRole] = useState(searchParams.get("role") || "all");
  const [team, setTeam] = useState(searchParams.get("team") || "");
  const [srPreset, setSrPreset] = useState(0);
  const [ecoPreset, setEcoPreset] = useState(0);

  const [teams, setTeams] = useState([]);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  /* Load teams for dropdown */
  useEffect(() => {
    fetch("/api/search/teams")
      .then((r) => r.json())
      .then((d) => setTeams(d.data || []));
  }, []);

  /* Auto-search if ?q= param present */
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) doSearch(q, role, team, srPreset, ecoPreset);
  }, []);

  const doSearch = async (
    q = query,
    r = role,
    t = team,
    srP = srPreset,
    ecoP = ecoPreset,
  ) => {
    const sr = SR_PRESETS[srP];
    const eco = ECO_PRESETS[ecoP];
    setLoading(true);
    setSearched(true);

    const params = new URLSearchParams({
      q,
      role: r,
      team: t,
      minSR: sr.min,
      maxSR: sr.max,
      minEco: eco.min,
      maxEco: eco.max,
      limit: 60,
    });

    // Update URL
    setSearchParams({ q, role: r, ...(t && { team: t }) });

    try {
      const res = await fetch(`/api/search?${params}`);
      const result = await res.json();
      setResults(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuery("");
    setRole("all");
    setTeam("");
    setSrPreset(0);
    setEcoPreset(0);
    setResults([]);
    setTotal(0);
    setSearched(false);
    setSearchParams({});
  };

  const hasFilters =
    role !== "all" || team || srPreset !== 0 || ecoPreset !== 0;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroEyebrow}>Advanced Search</div>
          <h1 className={styles.heroTitle}>Find Any Player</h1>
          <p className={styles.heroSub}>
            Filter by role, team, strike rate, and economy across the entire
            dataset.
          </p>
        </section>

        {/* SEARCH + FILTERS */}
        <div className={styles.filterPanel}>
          {/* Main search input */}
          <div className={styles.searchRow}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                className={styles.searchInput}
                placeholder="Player name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") doSearch();
                }}
              />
              {query && (
                <button
                  className={styles.clearBtn}
                  onClick={() => setQuery("")}
                >
                  ✕
                </button>
              )}
            </div>
            <button className={styles.searchBtn} onClick={() => doSearch()}>
              Search
            </button>
          </div>

          {/* Filter rows */}
          <div className={styles.filtersGrid}>
            {/* Role */}
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Role</span>
              <div className={styles.filterPills}>
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    className={`${styles.pill} ${role === r.value ? styles.pillActive : ""}`}
                    style={
                      role === r.value && ROLE_COLORS[r.label]
                        ? {
                            color: ROLE_COLORS[r.label],
                            borderColor: ROLE_COLORS[r.label] + "55",
                            background: ROLE_COLORS[r.label] + "10",
                          }
                        : {}
                    }
                    onClick={() => setRole(r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Team */}
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Team</span>
              <select
                className={styles.filterSelect}
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              >
                <option value="">All Teams</option>
                {teams.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Strike Rate */}
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>
                Strike Rate <span className={styles.filterNote}>(batting)</span>
              </span>
              <div className={styles.filterPills}>
                {SR_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    className={`${styles.pill} ${srPreset === i ? styles.pillActive : ""}`}
                    style={
                      srPreset === i
                        ? {
                            color: "var(--ci-brand)",
                            borderColor: "var(--ci-border-brand)",
                            background: "var(--ci-brand-subtle)",
                          }
                        : {}
                    }
                    onClick={() => setSrPreset(i)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Economy */}
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>
                Economy <span className={styles.filterNote}>(bowling)</span>
              </span>
              <div className={styles.filterPills}>
                {ECO_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    className={`${styles.pill} ${ecoPreset === i ? styles.pillActive : ""}`}
                    style={
                      ecoPreset === i
                        ? {
                            color: "var(--ci-danger)",
                            borderColor: "rgba(255,77,109,0.4)",
                            background: "rgba(255,77,109,0.08)",
                          }
                        : {}
                    }
                    onClick={() => setEcoPreset(i)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action row */}
          <div className={styles.actionRow}>
            <button className={styles.applyBtn} onClick={() => doSearch()}>
              Apply Filters
            </button>
            {(hasFilters || query) && (
              <button className={styles.resetBtn} onClick={handleReset}>
                ✕ Reset All
              </button>
            )}
            {searched && !loading && (
              <span className={styles.resultCount}>
                {total > 60
                  ? `Showing top 60 of ${total} players`
                  : `${results.length} player${results.length !== 1 ? "s" : ""} found`}
              </span>
            )}
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className={styles.stateWrapper}>
            <div className={styles.loadingRing} />
            <p className={styles.stateText}>Searching...</p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && searched && results.length === 0 && (
          <div className={styles.stateWrapper}>
            <p className={styles.emptyIcon}>🔍</p>
            <p className={styles.emptyTitle}>No players found</p>
            <p className={styles.emptyNote}>
              Try adjusting your filters or search term.
            </p>
            <button className={styles.resetBtn} onClick={handleReset}>
              Reset Filters
            </button>
          </div>
        )}

        {/* INITIAL PROMPT */}
        {!loading && !searched && (
          <div className={styles.promptWrapper}>
            <div className={styles.promptCard}>
              <span className={styles.promptIcon}>🔎</span>
              <h3 className={styles.promptTitle}>Search & Filter Players</h3>
              <p className={styles.promptDesc}>
                Enter a player name above, or use the filters to discover
                players matching specific criteria — strike rate, economy, role,
                and team.
              </p>
              <div className={styles.promptExamples}>
                {["V Kohli", "JJ Bumrah", "MS Dhoni", "YS Chahal"].map(
                  (name) => (
                    <button
                      key={name}
                      className={styles.exampleChip}
                      onClick={() => {
                        setQuery(name);
                        doSearch(name);
                      }}
                    >
                      {name}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS GRID */}
        {!loading && results.length > 0 && (
          <section className={styles.grid}>
            {results.map((player) => (
              <PlayerCard
                key={player.playerName}
                player={player}
                navigate={navigate}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default SearchPage;
