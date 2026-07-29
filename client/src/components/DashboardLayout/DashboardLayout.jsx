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
  Search,
  Activity,
  Plus,
  PlusCircle,
  Menu,
  Award,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  {
    group: "User Workspace",
    items: [
      { to: "/my-matches/new", label: "New Match", icon: PlusCircle, badge: "Live" },
      { to: "/my-matches", label: "My Matches", icon: FileText },
      { to: "/my-matches/analytics", label: "Analyze Matches", icon: LineChart },
      { to: "/tournaments", label: "Create Tournament", icon: Award, badge: "New" },
    ],
  },
  {
    group: "Sample Analysis (IPL)",
    items: [
      { to: "/dashboard", label: "Sample Dashboard", icon: LayoutDashboard },
      { to: "/matches", label: "Sample Matches", icon: Trophy, badge: "IPL" },
      { to: "/leaderboard", label: "IPL Teams", icon: Shield },
      { to: "/players", label: "IPL Players", icon: Users },
      { to: "/venues", label: "Venues", icon: Landmark },
      { to: "/search", label: "Analytics Search", icon: Search },
      { to: "/strategy", label: "Predictions", icon: Sparkles },
      { to: "/matchups", label: "Batter vs Bowler", icon: Swords },
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
          <div className={styles.userCard}>
            <div
              className={styles.userCardMain}
              onClick={() =>
                isAuthenticated ? navigate("/my-matches/analytics") : navigate("/login")
              }
            >
              <div className={styles.userAvatar}>
                {user?.name?.slice(0, 2).toUpperCase() || "G"}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {user?.name || "Guest Analyst"}
                </span>
                <span className={styles.userRole}>
                  {isAuthenticated ? "Logged In User" : "Guest Mode"}
                </span>
              </div>
            </div>
            {isAuthenticated ? (
              <button
                className={styles.authBtn}
                title="Logout"
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                  navigate("/login");
                }}
              >
                Logout
              </button>
            ) : (
              <button
                className={styles.authBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/login");
                }}
              >
                Sign In
              </button>
            )}
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
