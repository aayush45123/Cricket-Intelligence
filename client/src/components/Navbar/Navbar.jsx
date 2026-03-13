import React from "react";
import styles from "./Navbar.module.css";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <div>
      <div>
        <h2>Cricket Intelligence</h2>
      </div>
      <div>
        <ul>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link to="/leaderboard">Leaderboard</Link>
          </li>
          <li>
            <Link to="/matches">Matches</Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
