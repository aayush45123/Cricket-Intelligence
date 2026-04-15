import React, { useState, useEffect, useRef } from "react";
import styles from "./Navbar.module.css";
import { Link, useLocation, useNavigate } from "react-router-dom";

/* ── Quick Search Modal ───────────────────────────────────────── */
const QuickSearchModal = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  /* Auto-focus on open */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* Close on Escape */
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  /* Debounced search */
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search/quick?q=${encodeURIComponent(query)}`,
        );
        const result = await res.json();
        setResults(result.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  const goToPlayer = (name) => {
    navigate(`/players/${encodeURIComponent(name)}`);
    onClose();
  };

  const goToSearch = () => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className={styles.modalInputRow}>
          <span className={styles.modalSearchIcon}>⌕</span>
          <input
            ref={inputRef}
            className={styles.modalInput}
            placeholder="Search players, teams..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.length > 1) goToSearch();
            }}
          />
          {loading && <div className={styles.modalSpinner} />}
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className={styles.modalResults}>
            {results.map((name) => (
              <button
                key={name}
                className={styles.modalResult}
                onClick={() => goToPlayer(name)}
              >
                <span className={styles.modalResultAvatar}>
                  {name
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <span className={styles.modalResultName}>{name}</span>
                <span className={styles.modalResultArrow}>→</span>
              </button>
            ))}

            {/* View all in search page */}
            <button className={styles.modalViewAll} onClick={goToSearch}>
              View all results for "{query}" in Advanced Search →
            </button>
          </div>
        )}

        {query.length >= 2 && results.length === 0 && !loading && (
          <div className={styles.modalEmpty}>
            <p>No players found for "{query}"</p>
            <button className={styles.modalViewAll} onClick={goToSearch}>
              Try Advanced Search →
            </button>
          </div>
        )}

        {/* Shortcuts hint */}
        {query.length === 0 && (
          <div className={styles.modalHints}>
            <span className={styles.modalHintItem}>
              <kbd>↵</kbd> Advanced Search
            </span>
            <span className={styles.modalHintItem}>
              <kbd>Esc</kbd> Close
            </span>
            <Link
              to="/search"
              onClick={onClose}
              className={styles.modalHintLink}
            >
              Open Advanced Search with Filters →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Navbar ───────────────────────────────────────────────────── */
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/leaderboard", label: "Leaderboard" },
    { to: "/matches", label: "Matches" },
    { to: "/bowlers", label: "Bowlers" },
    { to: "/batsmen", label: "Batsmen" },
    { to: "/players", label: "Players" },
    { to: "/venues", label: "Venues" },
    { to: "/matchups", label: "Matchups" },
    { to: "/strategy", label: "Strategy" },
  ];

  const isActive = (to) =>
    location.pathname === to ||
    (to !== "/dashboard" && location.pathname.startsWith(to));

  /* Open modal on Ctrl+K / Cmd+K */
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <Link to="/dashboard">
            <h2 className={styles.brandName}>
              Cricket{" "}
              <span className={styles.brandHighlight}>Intelligence</span>
            </h2>
          </Link>
        </div>

        <ul className={styles.navList}>
          {links.map(({ to, label }) => (
            <li key={`${to}-${label}`} className={styles.navItem}>
              <Link
                to={to}
                className={`${styles.navLink} ${isActive(to) ? styles.active : ""}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.navActions}>
          {/* Search button — now functional */}
          <button
            className={styles.searchBtn}
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            title="Search (Ctrl+K)"
          >
            <span className={styles.searchBtnIcon}>⌕</span>
            <span className={styles.searchBtnKbd}>⌘K</span>
          </button>

          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            LIVE
          </div>
          <div className={styles.avatar}>CK</div>
        </div>
      </nav>

      {/* Search Modal */}
      {searchOpen && <QuickSearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
};

export default Navbar;
