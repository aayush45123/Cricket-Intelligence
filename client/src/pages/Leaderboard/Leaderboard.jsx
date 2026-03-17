import React, { useState, useEffect } from "react";
import styles from "./Leaderboard.module.css";

const FORMAT_OPTIONS = ["ALL", "T20", "ODI", "TEST", "T10"];

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("ALL");

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      const query = selectedFormat === "ALL" ? "" : `?format=${selectedFormat}`;
      const response = await fetch(`/api/matches/teams/leaderboard${query}`);
      const data = await response.json();

      setTeams(data.teams || []);
    };

    fetchLeaderboardData();
  }, [selectedFormat]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Team Leaderboard</h1>
          <p className={styles.heroSubtitle}>
            Live standings ranked by win rate for each match format.
          </p>
        </section>

        <section className={styles.filterSection}>
          <div className={styles.filterGroup}>
            {FORMAT_OPTIONS.map((format) => (
              <button
                type="button"
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
              <span className={styles.colRank}>Rank</span>
              <span className={styles.colTeam}>Team</span>
              <span className={styles.colStat}>Played</span>
              <span className={styles.colStat}>Wins</span>
              <span className={styles.colStat}>Losses</span>
              <span className={styles.colStat}>Win Rate</span>
            </div>

            {teams.length === 0 ? (
              <div className={styles.emptyState}>
                No leaderboard data available for {selectedFormat}.
              </div>
            ) : (
              teams.map((team, index) => (
                <div
                  className={`${styles.tableRow} ${styles.tableBody} ${
                    index === 0 ? styles.topRow : ""
                  }`}
                  key={team.team}
                >
                  <span className={styles.colRank}>
                    <span
                      className={`${styles.rankBadge} ${index === 0 ? styles.rankFirst : index === 1 ? styles.rankSecond : index === 2 ? styles.rankThird : styles.rankDefault}`}
                    >
                      {index + 1}
                    </span>
                  </span>
                  <span className={styles.colTeam}>
                    <span className={styles.teamInitials}>
                      {team.team?.slice(0, 2).toUpperCase()}
                    </span>
                    <span className={styles.teamName}>{team.team}</span>
                  </span>
                  <span className={styles.colStat}>{team.matchesPlayed}</span>
                  <span className={`${styles.colStat} ${styles.winsValue}`}>
                    {team.wins}
                  </span>
                  <span className={`${styles.colStat} ${styles.lossesValue}`}>
                    {team.losses}
                  </span>
                  <span className={styles.colStat}>
                    <span className={styles.winRateBadge}>
                      {team.winRate.toFixed(2)}%
                    </span>
                  </span>
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
