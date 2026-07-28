import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./DashboardLayout.module.css";
import {
  LayoutDashboard,
  Trophy,
  Shield,
  Users,
  Landmark,
  LineChart,
  Sparkles,
  Swords,
  FileText,
  Settings,
  Search,
  Activity,
  Plus,
  Menu,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  {
    group: "Core Dashboard",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/matches", label: "Matches", icon: Trophy, badge: "IPL" },
      { to: "/leaderboard", label: "Teams", icon: Shield },
      { to: "/players", label: "Players", icon: Users },
      { to: "/venues", label: "Venues", icon: Landmark },
    ],
  },
  {
    group: "Analytics & Intelligence",
    items: [
      { to: "/search", label: "Analytics", icon: LineChart },
      { to: "/strategy", label: "Predictions", icon: Sparkles },
      { to: "/matchups", label: "Batter vs Bowler", icon: Swords },
    ],
  },
  {
    group: "Account & Custom",
    items: [
      { to: "/my-matches", label: "My Matches", icon: FileText },
      { to: "/my-matches/new", label: "Settings", icon: Settings },
    ],
  },
];

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Ctrl+K search handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        navigate("/search");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div className={styles.layoutContainer}>
      {/* ── Mobile Overlay ─────────────────────────────────────── */}
      <div
        className={`${styles.sidebarOverlay} ${mobileOpen ? styles.sidebarOverlayOpen : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <Link to="/" className={styles.logoText}>
            <Activity className={styles.logoIcon} size={20} color="var(--ci-brand)" />
            Cricket <span className={styles.logoHighlight}>Intelligence</span>
          </Link>
          <span className={styles.badgeEnterprise}>v2.6</span>
        </div>

        <nav className={styles.sidebarNav}>
          {SIDEBAR_ITEMS.map((group) => (
            <div key={group.group}>
              <div className={styles.navGroupTitle}>{group.group}</div>
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const isActive =
                  location.pathname === item.to ||
                  (item.to !== "/" &&
                    item.to !== "/dashboard" &&
                    location.pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  >
                    <span className={styles.navIcon}>
                      <IconComponent size={16} />
                    </span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={styles.navBadge}>{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div
            className={styles.userCard}
            onClick={() =>
              isAuthenticated ? navigate("/my-matches") : navigate("/login")
            }
          >
            <div className={styles.userAvatar}>
              {user?.name?.slice(0, 2).toUpperCase() || "SA"}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {user?.name || "Analyst Account"}
              </span>
              <span className={styles.userRole}>
                {isAuthenticated ? "Enterprise User" : "Guest Mode"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Top Header ─────────────────────────────────────────── */}
      <header className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle Navigation"
          >
            <Menu size={20} />
          </button>
          <button
            className={styles.searchBarTrigger}
            onClick={() => navigate("/search")}
          >
            <Search size={15} />
            <span>Search players, teams, venues...</span>
            <kbd className={styles.searchKbd}>⌘K</kbd>
          </button>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            LIVE INTELLIGENCE
          </div>

          <button
            className={styles.primaryCta}
            onClick={() => navigate("/my-matches/new")}
          >
            <Plus size={15} /> Start Match
          </button>
        </div>
      </header>

      {/* ── Main Viewport Content ──────────────────────────────── */}
      <main className={styles.mainViewport}>{children}</main>
    </div>
  );
};

export default DashboardLayout;
