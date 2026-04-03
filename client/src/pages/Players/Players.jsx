import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Players.module.css";

const Players = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch("/api/players/");
        const result = await res.json();
        setData(result.data || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load players.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const filtered = data.filter((player) =>
    player.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>Players</h1>
            <p className={styles.heroSubtitle}>
              Full roster — tap any player to explore their performance
              insights.
            </p>
          </div>
          <div className={styles.heroMeta}>
            <span className={styles.countBadge}>
              {loading ? "—" : `${data.length} Players`}
            </span>
          </div>
        </section>

        {/* SEARCH */}
        <section className={styles.searchSection}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className={styles.clearBtn}
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          {search && (
            <p className={styles.resultCount}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for
              &quot;{search}&quot;
            </p>
          )}
        </section>

        {/* STATES */}
        {loading && (
          <div className={styles.stateWrapper}>
            <p className={styles.stateText}>Loading roster...</p>
          </div>
        )}

        {!loading && error && (
          <div className={styles.stateWrapper}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className={styles.stateWrapper}>
            <p className={styles.stateText}>
              {search ? `No players matching "${search}"` : "No players found."}
            </p>
          </div>
        )}

        {/* GRID */}
        {!loading && !error && filtered.length > 0 && (
          <section className={styles.grid}>
            {filtered.map((player, index) => (
              <div className={styles.card} key={player + index}>
                {/* Index badge */}
                <span className={styles.indexBadge}>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className={styles.cardBody}>
                  {/* Avatar initials */}
                  <div className={styles.avatar}>
                    {player
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()}
                  </div>

                  <div className={styles.cardInfo}>
                    <h3 className={styles.playerName}>{player}</h3>
                    <span className={styles.playerLabel}>Cricket Player</span>
                  </div>
                </div>

                <button
                  className={styles.insightBtn}
                  onClick={() =>
                    navigate(`/players/${encodeURIComponent(player)}`)
                  }
                >
                  View Insight
                  <span className={styles.insightArrow}>→</span>
                </button>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default Players;
