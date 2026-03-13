import React, { useState, useEffect } from "react";
import styles from "./Leaderboard.module.css";

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      const response = await fetch("/api/matches/teams/leaderboard");
      const data = await response.json();
      setTeams(data.teams);
    };

    fetchLeaderboardData();
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Team Leaderboard</h1>
          <p className={styles.heroSubtitle}>
            Live standings ranked by win rate across all matches.
          </p>
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

            {teams.map((team, index) => (
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
                  <span className={styles.winRateBadge}>{team.winRate.toFixed(2)}%</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Leaderboard;
