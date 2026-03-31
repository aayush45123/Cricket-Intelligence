import React, { useState, useEffect } from "react";
import styles from "./Leaderboard.module.css";

const FORMAT_OPTIONS = ["ALL", "T20", "ODI"];

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/players/team-leaderboard");
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.message || "Failed to fetch");
        }

        const data = Array.isArray(result.data)
          ? result.data.map((team) => ({
              name: team.teamName,
              matchesPlayed: team.matchesPlayed,
              wins: team.totalWins,
              losses: team.losses,
              winRate: team.winRate,
            }))
          : [];

        data.sort(
          (a, b) =>
            (b.wins || 0) - (a.wins || 0) ||
            (b.winRate || 0) - (a.winRate || 0) ||
            (a.name || "").localeCompare(b.name || ""),
        );

        setTeams(data);
      } catch (error) {
        console.error("Error fetching team wins", error);
        setError(error.message);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Team Leaderboard</h1>
          <p className={styles.heroSubtitle}>Live standings ranked by wins.</p>
        </section>

        <section className={styles.filterSection}>
          <div className={styles.filterGroup}>
            {FORMAT_OPTIONS.map((format) => (
              <button
                key={format}
                className={`${styles.filterButton} ${
                  selectedFormat === format ? styles.filterButtonActive : ""
                }`}
                onClick={() => setSelectedFormat(format)}
              >
                {format}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.tableSection}>
          <div className={styles.tableWrapper}>
            <div className={`${styles.tableRow} ${styles.tableHeader}`}>
              <span>Rank</span>
              <span>Team</span>
              <span>Played</span>
              <span>Wins</span>
              <span>Losses</span>
              <span>Win Rate</span>
            </div>

            {loading ? (
              <div className={styles.emptyState}>Loading...</div>
            ) : error ? (
              <div className={styles.emptyState}>{error}</div>
            ) : teams.length === 0 ? (
              <div className={styles.emptyState}>No data available</div>
            ) : (
              teams.map((team, index) => (
                <div
                  key={team.name}
                  className={`${styles.tableRow} ${styles.tableBody}`}
                >
                  <span>{index + 1}</span>
                  <span>{team.name}</span>
                  <span>{team.matchesPlayed}</span>
                  <span>{team.wins}</span>
                  <span>{team.losses}</span>
                  <span>{(team.winRate || 0).toFixed(2)}%</span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Leaderboard;
