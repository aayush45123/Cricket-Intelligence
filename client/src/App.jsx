import React from "react";
import { Routes, Route } from "react-router-dom";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import Matches from "./pages/Matches/Matches";
import MatchInsight from "./pages/MatchInsight/MatchInsight";
import Dashboard from "./pages/Dashboard/Dashboard";
import Navbar from "./components/Navbar/Navbar";
import "./App.css";
import Bowlers from "./pages/Bowlers/Bowlers";
import BowlingStats from "./pages/BowlingStats/BowlingStats";
import Batsmen from "./pages/Batsmen/Batsmen";
import BattingStats from "./pages/BattingStats/BattingStats";

const App = () => {
  return (
    <>
      <Navbar></Navbar>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:id" element={<MatchInsight />} />
        <Route path="/bowlers" element={<Bowlers />} />
        <Route
          path="/players/bowling-analytics/:playerName"
          element={<BowlingStats />}
        />
        <Route path="/batsmen" element={<Batsmen />} />
        <Route
          path="/players/batting-analytics/:playerName"
          element={<BattingStats />}
        />
      </Routes>
    </>
  );
};

export default App;
