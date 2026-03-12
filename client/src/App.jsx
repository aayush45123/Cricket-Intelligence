import React from "react";
import { Routes, Route } from "react-router-dom";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import Matches from "./pages/Matches/Matches";
import MatchInsight from "./pages/MatchInsight/MatchInsight";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:id" element={<MatchInsight />} />
      </Routes>
    </>
  );
};

export default App;
