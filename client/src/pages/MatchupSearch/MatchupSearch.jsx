import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./MatchupSearch.module.css";

/* ── Reusable searchable dropdown ────────────────────────────── */
const PlayerSelect = ({ label, role, players, value, onChange, accent }) => {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  const filtered = players
    .filter((p) => p.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 40);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const select = (name) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
  };
  const clear = () => {
    setQuery("");
    onChange("");
  };

  return (
    <div className={styles.selectWrapper} ref={ref}>
      <label className={styles.selectLabel} style={{ color: accent }}>
        <span className={styles.selectRole}>{role}</span>
        {label}
      </label>
      <div
        className={`${styles.selectInput} ${focused ? styles.selectInputFocused : ""} ${value ? styles.selectInputFilled : ""}`}
        style={
          value
            ? { borderColor: accent + "55", boxShadow: `0 0 0 3px ${accent}18` }
            : {}
        }
      >
        <input
          className={styles.selectField}
          placeholder={`Search ${label.toLowerCase()}...`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            onChange("");
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
        />
        {query && (
          <button
            className={styles.selectClear}
            onMouseDown={(e) => {
              e.preventDefault();
              clear();
            }}
          >
            ✕
          </button>
        )}
        <span
          className={styles.selectChevron}
          style={{ transform: open ? "rotate(180deg)" : "" }}
        >
          ▾
        </span>
      </div>
      {open && filtered.length > 0 && (
        <div className={styles.dropdown}>
          {filtered.map((p) => (
            <button
              key={p}
              className={`${styles.dropdownItem} ${p === value ? styles.dropdownItemActive : ""}`}
              style={p === value ? { color: accent } : {}}
              onMouseDown={(e) => {
                e.preventDefault();
                select(p);
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
      {open && query.length > 1 && filtered.length === 0 && (
        <div className={styles.dropdown}>
          <span className={styles.dropdownEmpty}>No players found</span>
        </div>
      )}
    </div>
  );
};

/* ── Main ────────────────────────────────────────────────────── */
const MatchupSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || "h2h");
  const [batters, setBatters] = useState([]);
  const [bowlers, setBowlers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [batter, setBatter] = useState("");
  const [bowler, setBowler] = useState("");
  const [playerA, setPlayerA] = useState("");
  const [playerB, setPlayerB] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [bRes, wRes, pRes] = await Promise.all([
        fetch("/api/matchups/batters"),
        fetch("/api/matchups/bowlers"),
        fetch("/api/matchups/search/players"),
      ]);
      const [bData, wData, pData] = await Promise.all([
        bRes.json(),
        wRes.json(),
        pRes.json(),
      ]);
      setBatters(bData.data || []);
      setBowlers(wData.data || []);
      setAllPlayers(pData.data || []);
      setLoading(false);
    })();
  }, []);

  const canH2H = batter && bowler;
  const canCompare = playerA && playerB && playerA !== playerB;

  const h2hSuggestions = [
    { batter: "V Kohli", bowler: "SL Malinga" },
    { batter: "RG Sharma", bowler: "Rashid Khan" },
    { batter: "MS Dhoni", bowler: "DJ Bravo" },
    { batter: "AB de Villiers", bowler: "Mohammed Shami" },
  ];
  const compareSuggestions = [
    { a: "V Kohli", b: "RG Sharma" },
    { a: "MS Dhoni", b: "SK Raina" },
    { a: "JJ Bumrah", b: "YS Chahal" },
    { a: "DA Warner", b: "CH Gayle" },
  ];

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroEyebrow}>Advanced Analytics</div>
          <h1 className={styles.heroTitle}>
            {tab === "h2h" ? (
              <>
                {" "}
                Batter <span className={styles.heroVs}>vs</span> Bowler
              </>
            ) : (
              <>
                {" "}
                Player <span className={styles.heroVsCompare}>Comparison</span>
              </>
            )}
          </h1>
          <p className={styles.heroSub}>
            {tab === "h2h"
              ? "Full head-to-head records — runs, dismissals, phase dominance, every ball bowled."
              : "Compare any two players side-by-side. Batting, bowling, phases — all in one view."}
          </p>
        </section>

        {/* TABS */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "h2h" ? styles.tabActive : ""}`}
            onClick={() => setTab("h2h")}
          >
            <span className={styles.tabIcon}>🏏⚡</span>
            Batter vs Bowler
          </button>
          <button
            className={`${styles.tab} ${tab === "compare" ? styles.tabActiveCompare : ""}`}
            onClick={() => setTab("compare")}
          >
            <span className={styles.tabIcon}>👤👤</span>
            Player Comparison
          </button>
        </div>

        {/* ── HEAD TO HEAD ────────────────────────────────────── */}
        {tab === "h2h" && (
          <>
            <section className={styles.searchCard}>
              {loading ? (
                <div className={styles.loadingRow}>
                  <div className={styles.loadingRing} />
                  <span className={styles.loadingText}>Loading roster...</span>
                </div>
              ) : (
                <>
                  <div className={styles.selectors}>
                    <PlayerSelect
                      label="Batter"
                      role="🏏"
                      players={batters}
                      value={batter}
                      onChange={setBatter}
                      accent="var(--ci-brand)"
                    />
                    <div className={styles.vsDivider}>
                      <div className={styles.vsLine} />
                      <span className={styles.vsText}>VS</span>
                      <div className={styles.vsLine} />
                    </div>
                    <PlayerSelect
                      label="Bowler"
                      role="⚡"
                      players={bowlers}
                      value={bowler}
                      onChange={setBowler}
                      accent="var(--ci-danger)"
                    />
                  </div>
                  <button
                    className={`${styles.searchBtn} ${canH2H ? styles.searchBtnActive : ""}`}
                    onClick={() =>
                      canH2H &&
                      navigate(
                        `/matchups/${encodeURIComponent(batter)}/${encodeURIComponent(bowler)}`,
                      )
                    }
                    disabled={!canH2H}
                  >
                    {canH2H
                      ? `Analyse ${batter} vs ${bowler}`
                      : "Select both players to analyse"}
                    {canH2H && <span className={styles.searchArrow}>→</span>}
                  </button>
                </>
              )}
            </section>

            <section className={styles.suggestions}>
              <p className={styles.suggestionsLabel}>Suggested matchups</p>
              <div className={styles.suggestionsList}>
                {h2hSuggestions.map((s) => (
                  <button
                    key={`${s.batter}-${s.bowler}`}
                    className={styles.suggestionChip}
                    onClick={() =>
                      navigate(
                        `/matchups/${encodeURIComponent(s.batter)}/${encodeURIComponent(s.bowler)}`,
                      )
                    }
                  >
                    <span style={{ color: "var(--ci-brand)" }}>{s.batter}</span>
                    <span className={styles.chipVs}>vs</span>
                    <span style={{ color: "var(--ci-danger)" }}>
                      {s.bowler}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.features}>
              {[
                {
                  icon: "📊",
                  label: "Run Distribution",
                  desc: "Dots, singles, fours, sixes",
                },
                {
                  icon: "🎯",
                  label: "Phase Breakdown",
                  desc: "Powerplay, middle & death",
                },
                {
                  icon: "📈",
                  label: "Season Trend",
                  desc: "Battle across seasons",
                },
                {
                  icon: "💥",
                  label: "Dismissal Analysis",
                  desc: "How the batter got out",
                },
                {
                  icon: "🗓️",
                  label: "Match-by-Match",
                  desc: "Every encounter logged",
                },
                {
                  icon: "⚡",
                  label: "Over-by-Over",
                  desc: "Over-level dominance map",
                },
              ].map((f) => (
                <div key={f.label} className={styles.featureCard}>
                  <span className={styles.featureIcon}>{f.icon}</span>
                  <div>
                    <span className={styles.featureLabel}>{f.label}</span>
                    <span className={styles.featureDesc}>{f.desc}</span>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {/* ── PLAYER COMPARISON ───────────────────────────────── */}
        {tab === "compare" && (
          <>
            <section
              className={`${styles.searchCard} ${styles.searchCardCompare}`}
            >
              {loading ? (
                <div className={styles.loadingRow}>
                  <div
                    className={styles.loadingRing}
                    style={{ borderTopColor: "var(--ci-blue)" }}
                  />
                  <span className={styles.loadingText}>
                    Loading player roster...
                  </span>
                </div>
              ) : (
                <>
                  <div className={styles.selectors}>
                    <PlayerSelect
                      label="Player A"
                      role="🔵"
                      players={allPlayers}
                      value={playerA}
                      onChange={setPlayerA}
                      accent="var(--ci-brand)"
                    />
                    <div className={styles.vsDivider}>
                      <div className={styles.vsLine} />
                      <span className={styles.vsTextCompare}>vs</span>
                      <div className={styles.vsLine} />
                    </div>
                    <PlayerSelect
                      label="Player B"
                      role="🟠"
                      players={allPlayers}
                      value={playerB}
                      onChange={setPlayerB}
                      accent="var(--ci-accent)"
                    />
                  </div>
                  {playerA && playerB && playerA === playerB && (
                    <p className={styles.samePlayerWarn}>
                      ⚠️ Please select two different players
                    </p>
                  )}
                  <button
                    className={`${styles.searchBtn} ${canCompare ? styles.searchBtnCompare : ""}`}
                    onClick={() =>
                      canCompare &&
                      navigate(
                        `/compare/${encodeURIComponent(playerA)}/${encodeURIComponent(playerB)}`,
                      )
                    }
                    disabled={!canCompare}
                  >
                    {canCompare
                      ? `Compare ${playerA} vs ${playerB}`
                      : "Select two different players"}
                    {canCompare && (
                      <span className={styles.searchArrow}>→</span>
                    )}
                  </button>
                </>
              )}
            </section>

            <section className={styles.suggestions}>
              <p className={styles.suggestionsLabel}>Suggested comparisons</p>
              <div className={styles.suggestionsList}>
                {compareSuggestions.map((s) => (
                  <button
                    key={`${s.a}-${s.b}`}
                    className={styles.suggestionChip}
                    onClick={() =>
                      navigate(
                        `/compare/${encodeURIComponent(s.a)}/${encodeURIComponent(s.b)}`,
                      )
                    }
                  >
                    <span style={{ color: "var(--ci-brand)" }}>{s.a}</span>
                    <span className={styles.chipVs}>vs</span>
                    <span style={{ color: "var(--ci-accent)" }}>{s.b}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.features}>
              {[
                {
                  icon: "📡",
                  label: "Skill Radar",
                  desc: "Normalised across 6 metrics",
                },
                {
                  icon: "🏏",
                  label: "Batting Stats",
                  desc: "Runs, SR, avg, boundary %",
                },
                {
                  icon: "⚡",
                  label: "Bowling Stats",
                  desc: "Wickets, economy, dot ball %",
                },
                {
                  icon: "🎯",
                  label: "Phase Performance",
                  desc: "Powerplay, Middle & Death SR",
                },
                {
                  icon: "📊",
                  label: "Stat Bars",
                  desc: "Visual side-by-side comparison",
                },
                {
                  icon: "🏆",
                  label: "Verdict",
                  desc: "Category-by-category winner",
                },
              ].map((f) => (
                <div key={f.label} className={styles.featureCard}>
                  <span className={styles.featureIcon}>{f.icon}</span>
                  <div>
                    <span className={styles.featureLabel}>{f.label}</span>
                    <span className={styles.featureDesc}>{f.desc}</span>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default MatchupSearch;
