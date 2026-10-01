import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Matches.module.css";
import { API_BASE } from "../../config";
import SeasonFilter from "../../components/SeasonFilter/SeasonFilter";
import {
  Calendar,
  MapPin,
  Trophy,
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalMatches: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 24,
  });
  const navigate = useNavigate();

  // Reset page when season changes
  const handleSeasonChange = (newSeason) => {
    setSeason(newSeason);
    setPage(1);
  };

  useEffect(() => {
    let mounted = true;
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: String(page),
          limit: "24",
        });
        if (season) queryParams.set("season", season);

        const res = await fetch(`${API_BASE}/api/matches?${queryParams.toString()}`);
        const result = await res.json();
        if (mounted) {
          if (result.success) {
            setMatches(result.data || []);
            if (result.pagination) {
              setPagination(result.pagination);
            }
          } else {
            setMatches([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch matches:", err);
        if (mounted) setMatches([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMatches();
    return () => {
      mounted = false;
    };
  }, [season, page]);

  // Client-side quick filter for search string within the current page
  const filteredMatches = matches.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (m.teamA && m.teamA.toLowerCase().includes(q)) ||
      (m.teamB && m.teamB.toLowerCase().includes(q)) ||
      (m.venue && m.venue.toLowerCase().includes(q)) ||
      (m.winner && m.winner.toLowerCase().includes(q))
    );
  });

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* HEADER BAR */}
        <div className={styles.headerBar}>
          <div>
            <h1 className={styles.heading}>IPL Matches</h1>
            <p className={styles.subheading}>
              Browse through ball-by-ball IPL match records, scorecards, momentum worms,
              and win probabilities.
            </p>
          </div>

          <div className={styles.controlsRow}>
            {/* Search */}
            <div className={styles.searchBox}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search team or venue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              {search && (
                <button className={styles.clearSearch} onClick={() => setSearch("")}>
                  ✕
                </button>
              )}
            </div>

            {/* Season Filter */}
            <SeasonFilter value={season} onChange={handleSeasonChange} />
          </div>
        </div>

        {/* SUMMARY BAR */}
        <div className={styles.metaBar}>
          <span className={styles.countBadge}>
            Showing {filteredMatches.length}{" "}
            {pagination.totalMatches > 0 && `of ${pagination.totalMatches}`} Matches
            {season && ` in Season ${season}`}
          </span>
          {pagination.totalPages > 1 && (
            <span className={styles.pageIndicator}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
          )}
        </div>

        {/* MATCHES GRID */}
        <section className={styles.grid}>
          {loading ? (
            <div className={styles.loadingWrapper}>
              <div className={styles.spinner} />
              <p>Loading IPL matches...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className={styles.emptyWrapper}>
              <p className={styles.statusText}>No matches found matching your filters.</p>
              {(season || search) && (
                <button
                  className={styles.resetBtn}
                  onClick={() => {
                    setSeason("");
                    setSearch("");
                    setPage(1);
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            filteredMatches.map((match) => (
              <div key={match.matchId} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTeams}>
                    <span className={styles.teamName}>{match.teamA}</span>
                    <span className={styles.vs}>vs</span>
                    <span className={styles.teamName}>{match.teamB}</span>
                  </div>
                  {match.season && (
                    <span className={styles.seasonTag}>IPL {match.season}</span>
                  )}
                </div>

                <div className={styles.metaRow}>
                  <MapPin size={13} className={styles.metaIcon} />
                  <span className={styles.cardVenue}>{match.venue || "TBD"}</span>
                </div>

                <div className={styles.metaRow}>
                  <Calendar size={13} className={styles.metaIcon} />
                  <span className={styles.cardDate}>
                    {match.date
                      ? new Date(match.date).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </span>
                </div>

                <div className={styles.winnerBox}>
                  <Trophy size={14} className={styles.trophyIcon} />
                  <span className={styles.winnerLabel}>Winner:</span>
                  <span className={styles.winnerName}>{match.winner || "No Result"}</span>
                </div>

                <div className={styles.actionButtons}>
                  <button
                    className={styles.insightBtn}
                    onClick={() => navigate(`/matches/${match.matchId}`)}
                  >
                    View Scorecard
                  </button>
                  <button
                    className={styles.deepBtn}
                    onClick={() => navigate(`/matches/${match.matchId}/deep-analytics`)}
                    title="View Worm Graph & Momentum"
                  >
                    <Activity size={13} />
                    Deep Analytics
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* PAGINATION CONTROLS */}
        {!loading && pagination.totalPages > 1 && (
          <div className={styles.paginationBar}>
            <button
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <span className={styles.pageNumber}>
              {page} / {pagination.totalPages}
            </span>

            <button
              className={styles.pageBtn}
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Matches;
