import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MatchupSearch.module.css";

/* ── Searchable dropdown ──────────────────────────────────────── */
const PlayerSelect = ({ label, role, players, value, onChange, accent }) => {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  const filtered = players
    .filter((p) => p.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 40);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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

/* ── Main page ────────────────────────────────────────────────── */
const MatchupSearch = () => {
  const [batters, setBatters] = useState([]);
  const [bowlers, setBowlers] = useState([]);
  const [batter, setBatter] = useState("");
  const [bowler, setBowler] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [bRes, wRes] = await Promise.all([
        fetch("/api/matchups/batters"),
        fetch("/api/matchups/bowlers"),
      ]);
      const [bData, wData] = await Promise.all([bRes.json(), wRes.json()]);
      setBatters(bData.data || []);
      setBowlers(wData.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const canSearch = batter && bowler;

  const handleSearch = () => {
    if (!canSearch) return;
    navigate(
      `/matchups/${encodeURIComponent(batter)}/${encodeURIComponent(bowler)}`,
    );
  };

  /* Suggested iconic clashes (static — will still work if names exist in data) */
  const suggestions = [
    { batter: "V Kohli", bowler: "SL Malinga" },
    { batter: "RG Sharma", bowler: "Rashid Khan" },
    { batter: "MS Dhoni", bowler: "DJ Bravo" },
    { batter: "AB de Villiers", bowler: "Mohammed Shami" },
  ];

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroEyebrow}>Head-to-Head Analytics</div>
          <h1 className={styles.heroTitle}>
            Batter <span className={styles.heroVs}>vs</span> Bowler
          </h1>
          <p className={styles.heroSub}>
            Select any batter and bowler to explore their full head-to-head
            record — runs, dismissals, phase dominance, and every ball bowled.
          </p>
        </section>

        {/* SEARCH CARD */}
        <section className={styles.searchCard}>
          {loading ? (
            <div className={styles.loadingRow}>
              <div className={styles.loadingRing} />
              <span className={styles.loadingText}>
                Loading player roster...
              </span>
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

                {/* VS divider */}
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
                className={`${styles.searchBtn} ${canSearch ? styles.searchBtnActive : ""}`}
                onClick={handleSearch}
                disabled={!canSearch}
              >
                {canSearch
                  ? `Analyse ${batter} vs ${bowler}`
                  : "Select both players to analyse"}
                {canSearch && <span className={styles.searchArrow}>→</span>}
              </button>
            </>
          )}
        </section>

        {/* SUGGESTED */}
        <section className={styles.suggestions}>
          <p className={styles.suggestionsLabel}>Suggested matchups</p>
          <div className={styles.suggestionsList}>
            {suggestions.map((s) => (
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
                <span style={{ color: "var(--ci-danger)" }}>{s.bowler}</span>
              </button>
            ))}
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section className={styles.features}>
          {[
            {
              icon: "📊",
              label: "Run Distribution",
              desc: "Dots, singles, fours, sixes breakdown",
            },
            {
              icon: "🎯",
              label: "Phase Breakdown",
              desc: "Powerplay, middle & death performance",
            },
            {
              icon: "📈",
              label: "Season Trend",
              desc: "How the battle evolved across seasons",
            },
            {
              icon: "💥",
              label: "Dismissal Analysis",
              desc: "How and how often the batter got out",
            },
            {
              icon: "🗓️",
              label: "Match-by-Match",
              desc: "Every encounter between these two",
            },
            {
              icon: "⚡",
              label: "Over-by-Over",
              desc: "Which overs the bowler dominated",
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
      </main>
    </div>
  );
};

export default MatchupSearch;
