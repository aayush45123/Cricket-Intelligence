import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const PlayerDetail = () => {
  const { playerName } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const res = await fetch(`/api/player/${playerName}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPlayer();
  }, [playerName]);

  if (!data) return <h2>Loading...</h2>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{data.playerName}</h1>

      {/* ================= BATTING ================= */}
      <div style={styles.card}>
        <h2>Batting Stats</h2>

        {typeof data.batting === "string" ? (
          <p>{data.batting}</p>
        ) : (
          <>
            <div style={styles.grid}>
              <Stat label="Runs" value={data.batting.totalRuns} />
              <Stat
                label="Strike Rate"
                value={data.batting.strikeRate.toFixed(2)}
              />
              <Stat
                label="Dot Ball %"
                value={data.batting.dotBallPercent.toFixed(2)}
              />
              <Stat
                label="Boundary %"
                value={data.batting.boundaryPercent.toFixed(2)}
              />
            </div>

            <h3 style={{ marginTop: "20px" }}>Phase Strike Rate</h3>
            <div style={styles.phaseContainer}>
              {data.batting.phaseStats.map((phase, index) => (
                <div key={index} style={styles.phaseBox}>
                  <p>{phase.phase}</p>
                  <h4>{phase.strikeRate.toFixed(2)}</h4>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ================= BOWLING ================= */}
      <div style={styles.card}>
        <h2>Bowling Stats</h2>

        {typeof data.bowling === "string" ? (
          <p>{data.bowling}</p>
        ) : (
          <div style={styles.grid}>
            <Stat label="Wickets" value={data.bowling.totalWickets} />
            <Stat label="Economy" value={data.bowling.economy.toFixed(2)} />
            <Stat
              label="Strike Rate"
              value={data.bowling.strikeRate.toFixed(2)}
            />
            <Stat
              label="Dot Ball %"
              value={data.bowling.dotBallPercent.toFixed(2)}
            />
          </div>
        )}
      </div>

      {/* ================= IMPACT ================= */}
      <div style={styles.card}>
        <h2>Impact Score</h2>
        <h1 style={{ color: "#00ffa6" }}>{data.impactScore}</h1>
      </div>
    </div>
  );
};

// ================= SMALL COMPONENT =================
const Stat = ({ label, value }) => {
  return (
    <div style={styles.statBox}>
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
  );
};

// ================= STYLES =================
const styles = {
  container: {
    padding: "20px",
    color: "white",
  },
  title: {
    marginBottom: "20px",
  },
  card: {
    background: "#0b1a2f",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 0 10px rgba(0,255,166,0.1)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
  },
  statBox: {
    background: "#112240",
    padding: "10px",
    borderRadius: "10px",
    textAlign: "center",
  },
  phaseContainer: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  phaseBox: {
    background: "#112240",
    padding: "10px",
    borderRadius: "10px",
    flex: 1,
    textAlign: "center",
  },
};

export default PlayerDetail;
