import React from "react";
import { Routes, Route } from "react-router-dom";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import Matches from "./pages/Matches/Matches";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/matches" element={<Matches />} />
      </Routes>
    </>
  );
};

export default App;
