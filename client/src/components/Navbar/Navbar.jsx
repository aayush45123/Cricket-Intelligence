import React, { useState, useEffect, useRef } from "react";
import styles from "./Navbar.module.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/* ── Quick Search Modal ───────────────────────────────────────── */
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

            <button className={styles.modalViewAll} onClick={goToSearch}>
              View all results →
            </button>
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

  const { isAuthenticated, user, logout } = useAuth();

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

    // 🔥 Auth-based links
    ...(isAuthenticated ? [{ to: "/my-matches", label: "My Matches" }] : []),
  ];

  const isActive = (to) =>
    location.pathname === to ||
    (to !== "/dashboard" && location.pathname.startsWith(to));

  /* Ctrl + K Search */
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
        {/* LOGO */}
        <div className={styles.brand}>
          <Link to="/dashboard">
            <h2 className={styles.brandName}>
              Cricket{" "}
              <span className={styles.brandHighlight}>Intelligence</span>
            </h2>
          </Link>
        </div>

        {/* LINKS */}
        <ul className={styles.navList}>
          {links.map(({ to, label }) => (
            <li key={to} className={styles.navItem}>
              <Link
                to={to}
                className={`${styles.navLink} ${
                  isActive(to) ? styles.active : ""
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* RIGHT SIDE */}
        <div className={styles.navActions}>
          {/* SEARCH */}
          <button
            className={styles.searchBtn}
            onClick={() => setSearchOpen(true)}
            title="Search (Ctrl+K)"
          >
            ⌕
          </button>

          {/* 🔥 START MATCH BUTTON */}
          {isAuthenticated && (
            <button
              className={styles.startBtn}
              onClick={() => navigate("/my-matches/new")}
            >
              + Start Match
            </button>
          )}

          {/* AUTH */}
          {isAuthenticated ? (
            <>
              <span className={styles.userName}>{user?.name}</span>

              <button className={styles.logoutBtn} onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button
              className={styles.loginBtn}
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          )}
        </div>
      </nav>

      {searchOpen && <QuickSearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
};

export default Navbar;
