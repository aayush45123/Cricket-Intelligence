import React from "react";
import { Routes, Route } from "react-router-dom";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import Matches from "./pages/Matches/Matches";
import MatchInsight from "./pages/MatchInsight/MatchInsight";
import Dashboard from "./pages/Dashboard/Dashboard";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:id" element={<MatchInsight />} />
      </Routes>
    </>
  );
};

export default App;
