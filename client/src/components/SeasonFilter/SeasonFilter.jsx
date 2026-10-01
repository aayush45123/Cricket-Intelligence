import React, { useState, useEffect } from "react";
import styles from "./SeasonFilter.module.css";
import { Calendar, ChevronDown } from "lucide-react";
import { API_BASE } from "../../config";

const FALLBACK_SEASONS = [
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2017",
  "2016",
  "2015",
  "2014",
  "2013",
  "2012",
  "2011",
  "2010",
  "2009",
  "2008",
];

const SeasonFilter = ({
  value = "",
  onChange,
  includeAll = true,
  label = "Season",
  className = "",
}) => {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchSeasons = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/matches/seasons`);
        if (res.ok) {
          const json = await res.json();
          if (mounted && json.data && json.data.length > 0) {
            setSeasons(json.data.map(String));
            return;
          }
        }
      } catch (e) {
        // Fallback below
      }
      if (mounted) {
        setSeasons(FALLBACK_SEASONS);
      }
    };

    fetchSeasons().finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={`${styles.filterContainer} ${className}`}>
      <div className={styles.iconWrapper}>
        <Calendar size={15} className={styles.icon} />
      </div>
      <div className={styles.selectWrapper}>
        <span className={styles.label}>{label}:</span>
        <select
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          className={styles.select}
          disabled={loading && seasons.length === 0}
        >
          {includeAll && <option value="">All Seasons (2008–2024)</option>}
          {seasons.map((s) => (
            <option key={s} value={s}>
              IPL {s}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className={styles.chevron} />
      </div>
    </div>
  );
};

export default SeasonFilter;
