import React, { useState } from "react";
import styles from "./MatchupPerMatch.module.css";

const MatchupPerMatch = ({ data, batter, bowler }) => {
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const sorted = [...data].sort((a, b) => {
    const av = a[sortCol] ?? 0;
    const bv = b[sortCol] ?? 0;
    if (typeof av === "string")
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pages = Math.ceil(sorted.length / PAGE_SIZE);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
    setPage(0);
  };

  const SortArrow = ({ col }) => (
    <span className={styles.sortArrow}>
      {sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"}
    </span>
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {[
                ["date", "Date"],
                ["season", "Season"],
                ["venue", "Venue"],
                ["runs", "Runs"],
                ["balls", "Balls"],
                ["strikeRate", "SR"],
                ["fours", "4s"],
                ["sixes", "6s"],
                ["dismissals", "Dis"],
              ].map(([col, label]) => (
                <th
                  key={col}
                  className={styles.th}
                  onClick={() => toggleSort(col)}
                >
                  {label}
                  <SortArrow col={col} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((m, i) => (
              <tr
                key={i}
                className={`${styles.tr} ${m.dismissals > 0 ? styles.trDismissed : ""}`}
              >
                <td className={styles.td}>
                  {m.date
                    ? new Date(m.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })
                    : "—"}
                </td>
                <td className={styles.td}>{m.season || "—"}</td>
                <td
                  className={`${styles.td} ${styles.tdVenue}`}
                  title={m.venue}
                >
                  {m.venue || "—"}
                </td>
                <td
                  className={styles.td}
                  style={{
                    color:
                      m.runs >= 20
                        ? "var(--ci-brand)"
                        : "var(--ci-text-primary)",
                    fontWeight: m.runs >= 20 ? 700 : 400,
                  }}
                >
                  {m.runs}
                </td>
                <td className={styles.td}>{m.balls}</td>
                <td
                  className={styles.td}
                  style={{
                    color:
                      m.strikeRate > 130
                        ? "var(--ci-brand)"
                        : m.strikeRate < 80
                          ? "var(--ci-danger)"
                          : "var(--ci-text-secondary)",
                  }}
                >
                  {m.strikeRate}
                </td>
                <td className={styles.td}>{m.fours || 0}</td>
                <td className={styles.td}>{m.sixes || 0}</td>
                <td className={styles.td}>
                  {m.dismissals > 0 ? (
                    <span className={styles.wkt}>W</span>
                  ) : (
                    <span className={styles.notOut}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ← Prev
          </button>
          <span className={styles.pageInfo}>
            {page + 1} / {pages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={page === pages - 1}
          >
            Next →
          </button>
        </div>
      )}

      {/* Summary row */}
      <div className={styles.summaryRow}>
        <span className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Highest Score</span>
          <span
            className={styles.summaryVal}
            style={{ color: "var(--ci-brand)" }}
          >
            {Math.max(...data.map((m) => m.runs))}
          </span>
        </span>
        <span className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Best SR (min 6b)</span>
          <span
            className={styles.summaryVal}
            style={{ color: "var(--ci-brand)" }}
          >
            {Math.max(
              ...data.filter((m) => m.balls >= 6).map((m) => m.strikeRate),
            )}
          </span>
        </span>
        <span className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Times Dismissed</span>
          <span
            className={styles.summaryVal}
            style={{ color: "var(--ci-danger)" }}
          >
            {data.filter((m) => m.dismissals > 0).length}
          </span>
        </span>
      </div>
    </div>
  );
};

export default MatchupPerMatch;
