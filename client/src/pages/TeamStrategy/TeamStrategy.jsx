import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./TeamStrategy.module.css";

const TeamStrategy = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/strategy");
        const result = await res.json();
        setTeams(result.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const displayed = teams.filter((t) =>
    t.teamName.toLowerCase().includes(search.toLowerCase()),
  );

  /* Color cycle for team avatars */
  const accentCycle = [
    "var(--ci-brand)",
    "var(--ci-accent)",
    "var(--ci-blue)",
    "var(--ci-danger)",
  ];

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.heroEyebrow}>Advanced Analytics</div>
            <h1 className={styles.heroTitle}>Team Strategy</h1>
            <p className={styles.heroSub}>
              Batting orders, bowling combinations, phase dominance, and toss
              intelligence — for every franchise.
            </p>
          </div>
          {!loading && (
            <div className={styles.heroPills}>
              <span className={styles.heroPill}>{teams.length} Teams</span>
            </div>
          )}
        </section>

        {/* SEARCH */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.searchInput}
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>

        {/* STATE */}
        {loading && (
          <div className={styles.stateWrapper}>
            <div className={styles.loadingRing} />
            <p className={styles.stateText}>Loading teams...</p>
          </div>
        )}

        {/* GRID */}
        {!loading && (
          <section className={styles.grid}>
            {displayed.map((team, idx) => {
              const accent = accentCycle[idx % accentCycle.length];
              const initials = team.teamName
                .split(" ")
                .filter((w) => /^[A-Z]/.test(w))
                .slice(0, 2)
                .map((w) => w[0])
                .join("");

              return (
                <div
                  key={team.teamName}
                  className={styles.card}
                  style={{ "--c": accent }}
                >
                  <div className={styles.cardTop}>
                    <div
                      className={styles.teamAvatar}
                      style={{
                        color: accent,
                        borderColor: accent + "44",
                        background: accent + "12",
                      }}
                    >
                      {initials}
                    </div>
                    <div className={styles.teamInfo}>
                      <h3 className={styles.teamName}>{team.teamName}</h3>
                      <span className={styles.teamMatches}>
                        {team.totalMatches} matches
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardStats}>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Wins</span>
                      <span
                        className={styles.statVal}
                        style={{ color: accent }}
                      >
                        {team.totalWins}
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Win Rate</span>
                      <span className={styles.statVal}>
                        {team.totalMatches > 0
                          ? (
                              (team.totalWins / team.totalMatches) *
                              100
                            ).toFixed(0)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Total Runs</span>
                      <span className={styles.statVal}>
                        {team.totalRuns.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Mini win bar */}
                  <div className={styles.winBar}>
                    <div
                      className={styles.winFill}
                      style={{
                        width: `${team.totalMatches > 0 ? (team.totalWins / team.totalMatches) * 100 : 0}%`,
                        background: accent,
                      }}
                    />
                  </div>

                  <button
                    className={styles.strategyBtn}
                    style={{ color: accent, borderColor: accent + "44" }}
                    onClick={() =>
                      navigate(`/strategy/${encodeURIComponent(team.teamName)}`)
                    }
                  >
                    View Strategy →
                  </button>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
};

export default TeamStrategy;
