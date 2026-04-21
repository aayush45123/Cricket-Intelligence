import React, { useState, useEffect, useRef } from "react";
import styles from "./Navbar.module.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalInputRow}>
          <span className={styles.modalSearchIcon}>⌕</span>
          <input
            ref={inputRef}
            className={styles.modalInput}
            placeholder="Search players, teams..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.length > 1) {
                navigate(`/search?q=${encodeURIComponent(query)}`);
                onClose();
              }
            }}
          />
          {loading && <div className={styles.modalSpinner} />}
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>
        {results.length > 0 && (
          <div className={styles.modalResults}>
            {results.map((name) => (
              <button
                key={name}
                className={styles.modalResult}
                onClick={() => {
                  navigate(`/players/${encodeURIComponent(name)}`);
                  onClose();
                }}
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
            <button
              className={styles.modalViewAll}
              onClick={() => {
                navigate(`/search?q=${encodeURIComponent(query)}`);
                onClose();
              }}
            >
              View all results in Advanced Search →
            </button>
          </div>
        )}
        {query.length >= 2 && results.length === 0 && !loading && (
          <div className={styles.modalEmpty}>
            <p>No players found for "{query}"</p>
          </div>
        )}
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
              Open Advanced Search →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

  useEffect(() => {
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
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
            <li key={to} className={styles.navItem}>
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
          <button
            className={styles.searchBtn}
            onClick={() => setSearchOpen(true)}
            title="Search (Ctrl+K)"
          >
            <span className={styles.searchBtnIcon}>⌕</span>
            <span className={styles.searchBtnKbd}>⌘K</span>
          </button>

          {isAuthenticated && (
            <Link
              to="/my-matches"
              className={`${styles.myMatchesBtn} ${isActive("/my-matches") ? styles.myMatchesBtnActive : ""}`}
            >
              My Matches
            </Link>
          )}

          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            LIVE
          </div>

          {isAuthenticated ? (
            <div className={styles.userMenu} ref={menuRef}>
              <button
                className={styles.avatar}
                onClick={() => setMenuOpen((v) => !v)}
                title={user?.name}
              >
                {user?.name?.slice(0, 2).toUpperCase() || "ME"}
              </button>
              {menuOpen && (
                <div className={styles.userDropdown}>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user?.name}</span>
                    <span className={styles.userEmail}>{user?.email}</span>
                  </div>
                  <div className={styles.userDivider} />
                  <Link
                    to="/my-matches"
                    className={styles.userMenuItem}
                    onClick={() => setMenuOpen(false)}
                  >
                    My Matches
                  </Link>
                  <Link
                    to="/my-matches/new"
                    className={styles.userMenuItem}
                    onClick={() => setMenuOpen(false)}
                  >
                    Start New Match
                  </Link>
                  <div className={styles.userDivider} />
                  <button
                    className={`${styles.userMenuItem} ${styles.userMenuLogout}`}
                    onClick={() => {
                      logout();
                      navigate("/dashboard");
                      setMenuOpen(false);
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={styles.loginBtn}>
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {searchOpen && <QuickSearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
};

export default Navbar;
