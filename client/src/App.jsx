import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import "./App.css";

import Dashboard from "./pages/Dashboard/Dashboard";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import Matches from "./pages/Matches/Matches";
import MatchInsight from "./pages/MatchInsight/MatchInsight";
import MatchDeepAnalytics from "./pages/MatchDeepAnalytics/MatchDeepAnalytics";
import Bowlers from "./pages/Bowlers/Bowlers";
import BowlingStats from "./pages/BowlingStats/BowlingStats";
import Batsmen from "./pages/Batsmen/Batsmen";
import BattingStats from "./pages/BattingStats/BattingStats";
import Players from "./pages/Players/Players";
import PlayerDetail from "./pages/PlayerDetail/PlayerDetail";
import Venues from "./pages/Venues/Venues";
import VenueDetail from "./pages/VenueDetails/VenueDetails";
import MatchupSearch from "./pages/MatchupSearch/MatchupSearch";
import MatchupDetail from "./pages/MatchupDetail/MatchupDetail";
import PlayerCompareDetail from "./pages/PlayerComparisionDetail/PlayerCompareDetail";
import TeamStrategy from "./pages/TeamStrategy/TeamStrategy";
import TeamStrategyDetail from "./pages/TeamStrategyDetail/TeamStrategyDetail";
import SearchPage from "./pages/SearchPage/SearchPage";
import AuthPage from "./pages/AuthPage/AuthPage";
import MyMatches from "./pages/MyMatches/MyMatches";
import MatchSetup from "./pages/MatchSetup/MatchSetup";
import LiveScorer from "./pages/LiveScorer/LiveScorer";
import InningsBreak from "./pages/InningsBreak/InningsBreak";
import MatchResult from "./pages/MatchResult/MatchResult";

const Protected = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => (
  <AuthProvider>
    <Navbar />
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/matches/:matchId" element={<MatchInsight />} />
      <Route
        path="/matches/:matchId/deep-analytics"
        element={<MatchDeepAnalytics />}
      />
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
      <Route path="/players" element={<Players />} />
      <Route path="/players/:playerName" element={<PlayerDetail />} />
      <Route path="/venues" element={<Venues />} />
      <Route path="/venues/:venue" element={<VenueDetail />} />
      <Route path="/matchups" element={<MatchupSearch />} />
      <Route path="/matchups/:batter/:bowler" element={<MatchupDetail />} />
      <Route
        path="/compare/:playerA/:playerB"
        element={<PlayerCompareDetail />}
      />
      <Route path="/strategy" element={<TeamStrategy />} />
      <Route path="/strategy/:team" element={<TeamStrategyDetail />} />
      <Route path="/search" element={<SearchPage />} />

      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />

      <Route
        path="/my-matches"
        element={
          <Protected>
            <MyMatches />
          </Protected>
        }
      />
      <Route
        path="/my-matches/new"
        element={
          <Protected>
            <MatchSetup />
          </Protected>
        }
      />
      <Route
        path="/my-matches/:matchId/score"
        element={
          <Protected>
            <LiveScorer />
          </Protected>
        }
      />
      <Route
        path="/my-matches/:matchId/innings-break"
        element={
          <Protected>
            <InningsBreak />
          </Protected>
        }
      />
      <Route
        path="/my-matches/:matchId/result"
        element={
          <Protected>
            <MatchResult />
          </Protected>
        }
      />
    </Routes>
    <Footer />
  </AuthProvider>
);

export default App;
