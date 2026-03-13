import React from "react";
import styles from "./Navbar.module.css";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/leaderboard", label: "Leaderboard" },
    { to: "/matches", label: "Matches" },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <h2 className={styles.brandName}>
          Cricket <span className={styles.brandHighlight}>Intelligence</span>
        </h2>
      </div>

      <ul className={styles.navList}>
        {links.map(({ to, label }) => (
          <li key={to} className={styles.navItem}>
            <Link
              to={to}
              className={`${styles.navLink} ${
                location.pathname === to ? styles.active : ""
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.navActions}>
        <button className={styles.searchBtn} aria-label="Search">
          &#9906;
        </button>
        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          LIVE
        </div>
        <div className={styles.avatar}>CK</div>
      </div>
    </nav>
  );
};

export default Navbar;
