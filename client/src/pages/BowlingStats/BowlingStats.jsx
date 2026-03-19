import React from "react";

const BowlingStats = () => {
  const [bowlers, setBowlers] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "/api/matches/players/bowling-analytics/:playerName",
        );
        const result = await res.json();
        setBowlers(result.data);
      } catch (fetchError) {
        console.error("Error fetching bowling analytics", fetchError);
        setError("Unable to load bowling analytics right now.");
      }
    };
    fetchData();
  }, []);
  return (
    <div>
      <h1>Bowling Stats</h1>
      {bowlers.map((bowler) => (
        <div key={bowler.playerName}>
          <h3>{bowler.playerName}</h3>
          <p>Total Wickets: {bowler.totalWickets}</p>
          <p>Total Balls Bowled: {bowler.totalBallsBowled}</p>
          <p>Economy: {bowler.bowlingeconomy}</p>
          <p>Strike Rate: {bowler.bowlingstrikeRate}</p>
          <p>Average: {bowler.bowlingaverage}</p>
          <p>Category : {bowler.category}</p>
        </div>
      ))}
    </div>
  );
};

export default BowlingStats;
