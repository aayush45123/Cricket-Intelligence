import React, { useState, useEffect, useRef } from "react";
import styles from "./Navbar.module.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/* ── Analytics menu sections ─────────────────────────────────── */
const ANALYTICS_MENU = [
  {
    section: "Match Analysis",
    items: [
      { to: "/dashboard", label: "Dashboard", desc: "Overview & key stats" },
      { to: "/matches", label: "Matches", desc: "All IPL match records" },
      {
        to: "/leaderboard",
        label: "Team Leaderboard",
        desc: "Win rates & rankings",
      },
    ],
  },
  {
    section: "Player Analysis",
    items: [
      { to: "/batsmen", label: "Batsmen", desc: "Batting stats & profiles" },
      { to: "/bowlers", label: "Bowlers", desc: "Bowling stats & profiles" },
      { to: "/players", label: "All Players", desc: "Full player database" },
      {
        to: "/search",
        label: "Player Search",
        desc: "Filter by role, SR, economy",
      },
    ],
  },
  {
    section: "Advanced",
    items: [
      {
        to: "/venues",
        label: "Venue Analytics",
        desc: "Pitch type & home advantage",
      },
      {
        to: "/matchups",
        label: "Batter vs Bowler",
        desc: "Head-to-head matchup data",
      },
      {
        to: "/strategy",
        label: "Team Strategy",
        desc: "Phase analytics & batting order",
      },
    ],
  },
];

/* ── My Matches menu ─────────────────────────────────────────── */
const MATCHES_MENU = [
  {
    to: "/my-matches/new",
    label: "Start New Match",
    desc: "Begin ball-by-ball scoring",
    icon: "+",
  },
  {
    to: "/my-matches",
    label: "My Match History",
    desc: "View & resume past matches",
    icon: "≡",
  },
];

/* ── Quick Search Modal ──────────────────────────────────────── */
const QuickSearchModal = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

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
        const d = await res.json();
        setResults(d.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  const go = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className={styles.searchOverlay} onClick={onClose}>
      <div className={styles.searchModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchInputRow}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            ref={inputRef}
            className={styles.searchInput}
            placeholder="Search players..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.length > 1)
                go(`/search?q=${encodeURIComponent(query)}`);
            }}
          />
          {loading && <div className={styles.searchSpinner} />}
          <button className={styles.searchClose} onClick={onClose}>
            ✕
          </button>
        </div>

        {results.length > 0 && (
          <div className={styles.searchResults}>
            {results.map((name) => (
              <button
                key={name}
                className={styles.searchResult}
                onClick={() => go(`/players/${encodeURIComponent(name)}`)}
              >
                <span className={styles.searchAvatar}>
                  {name
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <span className={styles.searchName}>{name}</span>
                <span className={styles.searchArrow}>→</span>
              </button>
            ))}
            <button
              className={styles.searchAll}
              onClick={() => go(`/search?q=${encodeURIComponent(query)}`)}
            >
              See all results in Advanced Search →
            </button>
          </div>
        )}

        {query.length >= 2 && results.length === 0 && !loading && (
          <div className={styles.searchEmpty}>
            <p>No players found for "{query}"</p>
          </div>
        )}

        {query.length === 0 && (
          <div className={styles.searchHints}>
            <span>
              <kbd>↵</kbd> to search
            </span>
            <span>
              <kbd>Esc</kbd> to close
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main Navbar ─────────────────────────────────────────────── */
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const analyticsRef = useRef(null);
  const matchesRef = useRef(null);
  const userRef = useRef(null);

  /* Close all dropdowns on outside click */
  useEffect(() => {
    const h = (e) => {
      if (analyticsRef.current && !analyticsRef.current.contains(e.target))
        setAnalyticsOpen(false);
      if (matchesRef.current && !matchesRef.current.contains(e.target))
        setMatchesOpen(false);
      if (userRef.current && !userRef.current.contains(e.target))
        setUserOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* Close dropdowns on route change */
  useEffect(() => {
    setAnalyticsOpen(false);
    setMatchesOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  /* Ctrl+K global search */
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

  const isAnalyticsActive = ANALYTICS_MENU.flatMap((s) => s.items).some(
    (i) =>
      location.pathname === i.to || location.pathname.startsWith(i.to + "/"),
  );

  const isMatchesActive = location.pathname.startsWith("/my-matches");

  const handleStartMatch = () => {
    if (isAuthenticated) navigate("/my-matches/new");
    else navigate("/login");
  };

  return (
    <>
      <nav className={styles.navbar}>
        {/* ── Brand ──────────────────────────────────────────── */}
        <Link to="/" className={styles.brand}>
          <span className={styles.brandName}>
            Cricket <span className={styles.brandAccent}>Intelligence</span>
          </span>
        </Link>

        {/* ── Centre nav — just 2 items ──────────────────────── */}
        <div className={styles.centerNav}>
          {/* 1. Sample Analytics dropdown */}
          <div className={styles.navDropdown} ref={analyticsRef}>
            <button
              className={`${styles.navBtn} ${isAnalyticsActive || analyticsOpen ? styles.navBtnActive : ""}`}
              onClick={() => {
                setAnalyticsOpen((v) => !v);
                setMatchesOpen(false);
                setUserOpen(false);
              }}
            >
              <span className={styles.navBtnIcon}>📊</span>
              Sample Analytics
              <span
                className={`${styles.chevron} ${analyticsOpen ? styles.chevronOpen : ""}`}
              >
                ▾
              </span>
            </button>

            {analyticsOpen && (
              <div className={styles.megaMenu}>
                <div className={styles.megaHeader}>
                  <span className={styles.megaTitle}>
                    IPL Dataset Analytics
                  </span>
                  <span className={styles.megaSub}>
                    Explore 15+ years of IPL data
                  </span>
                </div>

                <div className={styles.megaGrid}>
                  {ANALYTICS_MENU.map((section) => (
                    <div key={section.section} className={styles.megaSection}>
                      <span className={styles.megaSectionLabel}>
                        {section.section}
                      </span>
                      {section.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`${styles.megaItem} ${location.pathname === item.to ? styles.megaItemActive : ""}`}
                          onClick={() => setAnalyticsOpen(false)}
                        >
                          <span className={styles.megaItemLabel}>
                            {item.label}
                          </span>
                          <span className={styles.megaItemDesc}>
                            {item.desc}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Search shortcut inside menu */}
                <div className={styles.megaFooter}>
                  <button
                    className={styles.megaSearch}
                    onClick={() => {
                      setAnalyticsOpen(false);
                      setSearchOpen(true);
                    }}
                  >
                    <span>⌕</span>
                    <span>Search players & filter by stats</span>
                    <kbd>⌘K</kbd>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Start a Match */}
          {!isAuthenticated ? (
            /* Not logged in → single CTA button that goes to login */
            <button className={styles.startMatchBtn} onClick={handleStartMatch}>
              <span className={styles.navBtnIcon}>🏏</span>
              Start a Match
            </button>
          ) : (
            /* Logged in → dropdown with match options */
            <div className={styles.navDropdown} ref={matchesRef}>
              <button
                className={`${styles.startMatchBtn} ${isMatchesActive || matchesOpen ? styles.startMatchBtnActive : ""}`}
                onClick={() => {
                  setMatchesOpen((v) => !v);
                  setAnalyticsOpen(false);
                  setUserOpen(false);
                }}
              >
                <span className={styles.navBtnIcon}>🏏</span>
                My Matches
                <span
                  className={`${styles.chevron} ${matchesOpen ? styles.chevronOpen : ""}`}
                >
                  ▾
                </span>
              </button>

              {matchesOpen && (
                <div className={styles.matchMenu}>
                  <div className={styles.matchMenuHeader}>
                    <span className={styles.matchMenuTitle}>Match Engine</span>
                    <span className={styles.matchMenuSub}>
                      Score & analyse your own matches
                    </span>
                  </div>

                  {MATCHES_MENU.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`${styles.matchMenuItem} ${location.pathname === item.to ? styles.matchMenuItemActive : ""}`}
                      onClick={() => setMatchesOpen(false)}
                    >
                      <span className={styles.matchMenuIcon}>{item.icon}</span>
                      <div className={styles.matchMenuText}>
                        <span className={styles.matchMenuLabel}>
                          {item.label}
                        </span>
                        <span className={styles.matchMenuDesc}>
                          {item.desc}
                        </span>
                      </div>
                      <span className={styles.matchMenuArrow}>→</span>
                    </Link>
                  ))}

                  <div className={styles.matchMenuFooter}>
                    <span className={styles.matchMenuNote}>
                      Matches are private to your account
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right actions ───────────────────────────────────── */}
        <div className={styles.rightActions}>
          {/* Search */}
          <button
            className={styles.iconBtn}
            onClick={() => setSearchOpen(true)}
            title="Search (Ctrl+K)"
          >
            <span className={styles.iconBtnLabel}>⌕</span>
            <span className={styles.iconBtnKbd}>⌘K</span>
          </button>

          {/* Live badge */}
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            LIVE
          </div>

          {/* Auth */}
          {isAuthenticated ? (
            <div className={styles.userMenu} ref={userRef}>
              <button
                className={styles.avatar}
                onClick={() => setUserOpen((v) => !v)}
                title={user?.name}
              >
                {user?.name?.slice(0, 2).toUpperCase() || "ME"}
              </button>

              {userOpen && (
                <div className={styles.userDropdown}>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user?.name}</span>
                    <span className={styles.userEmail}>{user?.email}</span>
                  </div>
                  <div className={styles.userDivider} />
                  <Link
                    to="/my-matches/new"
                    className={styles.userItem}
                    onClick={() => setUserOpen(false)}
                  >
                    Start New Match
                  </Link>
                  <Link
                    to="/my-matches"
                    className={styles.userItem}
                    onClick={() => setUserOpen(false)}
                  >
                    Match History
                  </Link>
                  <div className={styles.userDivider} />
                  <button
                    className={`${styles.userItem} ${styles.userItemLogout}`}
                    onClick={() => {
                      logout();
                      navigate("/");
                      setUserOpen(false);
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authBtns}>
              <Link to="/login" className={styles.loginBtn}>
                Sign in
              </Link>
              <Link to="/register" className={styles.registerBtn}>
                Get started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {searchOpen && <QuickSearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
};

export default Navbar;
