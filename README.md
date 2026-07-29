<div align="center">

# 🏏 Cricket Intelligence

### Advanced Cricket Analytics Platform built on the MERN Stack

Transforming historical IPL match data into interactive dashboards, player intelligence, venue analytics, team strategy insights, and live match predictions.

![Banner](assets/banner.png)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://render.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](#-license)

[Live Demo](#) • [API Docs](#-rest-api) • [Report Bug](#) • [Request Feature](#)

</div>

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Screenshots](#-screenshots)
3. [Key Features](#-key-features)
4. [Analytics Modules](#-analytics-modules)
5. [Architecture](#-architecture)
6. [Technology Stack](#-technology-stack)
7. [Project Structure](#-project-structure)
8. [Data Pipeline](#-data-pipeline)
9. [Getting Started](#-getting-started)
10. [Environment Variables](#-environment-variables)
11. [REST API](#-rest-api)
12. [Database Schema](#-database-schema)
13. [Deployment](#-deployment)
14. [Technical Highlights](#-technical-highlights)
15. [Future Roadmap](#-future-roadmap)
16. [Contributing](#-contributing)
17. [License](#-license)
18. [Author](#-author)

---

## 📖 Overview

**Cricket Intelligence** is a production-ready, full-stack analytics platform that goes beyond simple scorecards. It combines historical IPL datasets, MongoDB aggregation pipelines, RESTful APIs, and dynamic React dashboards to deliver meaningful, data-driven cricket insights for fans, analysts, and teams.

The platform lets users analyze matches, compare teams, evaluate player performance, explore venue trends, study batting/bowling analytics, review match intensity, and even simulate live match predictions — all through an intuitive, interactive interface.

### 🎯 Objective

Cricket Intelligence centralizes cricket data exploration so users can:

- Analyze IPL matches in depth
- Compare teams head-to-head
- Evaluate individual player performances
- Understand venue-specific trends
- Study batting and bowling analytics
- Visualize match intensity and momentum
- Generate strategic, data-backed insights
- Instantly search across the entire dataset

---

## 📸 Screenshots

| Dashboard | Analytics |
|:---:|:---:|
| ![Dashboard](assets/dashboard.png) | ![Analytics](assets/analytics.png) |

| Batting Statistics | Bowling Statistics |
|:---:|:---:|
| ![Batting](assets/batting.png) | ![Bowling](assets/bowling.png) |

| Player Insights | Venue Analytics |
|:---:|:---:|
| ![Players](assets/players.png) | ![Venue](assets/venue.png) |

| Head-to-Head Matchup | Team Strategy |
|:---:|:---:|
| ![Matchup](assets/matchup.png) | ![Strategy](assets/strategy.png) |

| Match Story | Smart Search |
|:---:|:---:|
| ![Match Story](assets/match-story.png) | ![Search](assets/search.png) |

| Login | Register |
|:---:|:---:|
| ![Login](assets/login.png) | ![Register](assets/register.png) |

| Live Match Prediction | Mobile View |
|:---:|:---:|
| ![Live Match](assets/live-match.png) | ![Mobile](assets/mobile.png) |

---

## ✨ Key Features

### 📊 Dashboard
- Centralized analytics hub with summary cards
- Total matches, teams, players, and venues at a glance
- Match distribution overview
- Dynamic, interactive visualizations
- Quick navigation to all modules

### 🏏 Match Analytics
- Match results and winning margins
- Toss analysis and its impact on outcomes
- Match intensity scoring
- Run-rate analysis (first & second innings)
- Chase success probability and pressure index
- Net run rate tracking

### 👑 Player Analytics
**Batting**
- Highest run scorers
- Batting average & strike rate
- Boundary percentage
- Consistency score
- Runs per match and performance trends

**Bowling**
- Highest wicket takers
- Economy rate & bowling average
- Bowling strike rate
- Dot-ball percentage
- Wickets per match

### 🏟 Venue Analytics
- Matches hosted per venue
- Winning team patterns by venue
- Toss impact per venue
- Average first & second innings scores
- Highest team total and lowest defended score
- Venue-wise win percentage

### ⚔ Team Comparison
- Head-to-head historical records
- Total wins and win percentage
- Highest / lowest scores
- Recent form and match history

### 🧠 Team Strategy
- Batting and bowling strength profiling
- Preferred venues and toss tendencies
- Winning patterns (home vs. away)
- Powerplay and death-overs performance

### 📈 Match Story
- Complete scorecards
- Match timeline and key moments
- Run progression charts
- Pressure-phase breakdown

### 🔍 Smart Search
- Unified global search across players, teams, venues, and matches

### 🔐 Authentication
- Secure user registration and login
- JWT-based authentication
- Password encryption (bcrypt)
- Protected routes across the application

### ⚡ Live Match Engine
- Create and configure a live match
- Simulate match progression
- Real-time win-probability prediction
- Dynamic team analysis engine

---

## 📊 Analytics Modules

| Module | Description |
|---|---|
| Run Rate Analysis | Innings-wise scoring rate trends |
| Match Intensity | Momentum shifts across a match |
| Toss Impact | Correlation between toss outcome and result |
| Winning Margin | Distribution of victory margins |
| Top Performers | Leaderboards for batting & bowling |
| Venue Statistics | Ground-specific performance trends |
| Team Leaderboards | Overall team rankings |
| Strike Rate / Economy Trends | Performance trend lines over time |

---

## 🏗 Architecture

```
                 React (Vite) Frontend
                          │
                          ▼
                  Express REST API
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
 MongoDB Atlas    JWT Authentication   Analytics Engine
        │
        ▼
 Historical IPL Dataset (CSV → Python ETL)
        │
        ▼
 Interactive Charts & Dashboards
```

![Architecture Diagram](assets/architecture.png)

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, Vite, React Router, CSS3, Chart.js / Recharts |
| **Backend** | Node.js, Express.js, REST APIs |
| **Database** | MongoDB Atlas, Mongoose |
| **Authentication** | JWT, bcrypt |
| **Data Processing** | Python, Pandas (CSV → MongoDB ETL) |
| **Deployment** | Vercel (Frontend), Render (Backend), MongoDB Atlas (Database) |

---

## 📂 Project Structure

```text
Cricket-Intelligence
│
├── client
│   ├── public
│   ├── src
│   │   ├── assets
│   │   ├── components
│   │   ├── charts
│   │   ├── pages
│   │   ├── context
│   │   ├── hooks
│   │   ├── utils
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── utils
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── data-import
│   ├── IPL.csv
│   └── import_dataset.py
│
├── assets
└── README.md
```

---

## 🔄 Data Pipeline

```
IPL CSV Dataset
      │
      ▼
Python Data Import (Pandas)
      │
      ▼
MongoDB Atlas
      │
      ▼
Express REST APIs
      │
      ▼
React Dashboard
      │
      ▼
Interactive Analytics
```

![Data Pipeline](assets/api-flow.png)

---

## ⚙ Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB Atlas account
- Python 3 (for the data-import pipeline)

### Clone the Repository

```bash
git clone https://github.com/aayush45123/Cricket-Intelligence.git
cd Cricket-Intelligence
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

### Backend Setup

```bash
cd server
npm install
npm start
```

### Data Import (Optional — for fresh dataset)

```bash
cd data-import
pip install pandas pymongo
python import_dataset.py
```

---

## 🔑 Environment Variables

Create a `.env` file inside the `server` directory:

```env
PORT=5000
MONGO_URI=YOUR_MONGODB_URI
JWT_SECRET=YOUR_SECRET
JWT_EXPIRES_IN=7d
```

---

## 📡 REST API

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Matches
```
GET    /api/matches
GET    /api/matches/analytics
GET    /api/matches/:id
```

### Players
```
GET    /api/players
GET    /api/players/batting
GET    /api/players/bowling
GET    /api/players/highest-runs
GET    /api/players/highest-wickets
GET    /api/players/batting-analytics
GET    /api/players/bowling-analytics
```

### Venues
```
GET    /api/venues
GET    /api/venues/analytics
```

### Matchups
```
GET    /api/matchups
```

### Strategy
```
GET    /api/strategy
```

### Search
```
GET    /api/search
```

### Live Match
```
POST   /api/live
POST   /api/live/predict
```

---

## 🗄 Database Schema

![Database Schema](assets/database-schema.png)

Core collections include:

| Collection | Purpose |
|---|---|
| `users` | Stores registered user credentials and profiles |
| `matches` | Match-level data — teams, venue, toss, result, scores |
| `players` | Player profiles and aggregated career statistics |
| `deliveries` | Ball-by-ball data used to power detailed analytics |
| `venues` | Venue metadata and computed venue statistics |

---

## 🌐 Deployment

| Component | Platform |
|---|---|
| Frontend | [Vercel](https://vercel.com/) |
| Backend | [Render](https://render.com/) |
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) |

---

## 🔥 Technical Highlights

- MERN stack architecture with clear separation of concerns
- Modular MVC backend design
- RESTful API design principles
- Optimized MongoDB aggregation pipelines for analytics-heavy queries
- Interactive, responsive data visualizations with Chart.js
- Dynamic team and player comparison engine
- JWT-secured authentication with protected routes
- CSV-to-MongoDB ETL pipeline for IPL data ingestion (Python + Pandas)
- Fully responsive UI across desktop and mobile
- Scalable, component-based React architecture
- 280+ Git commits reflecting iterative, incremental development
- Deployed in production on Vercel and Render

---

## 🌟 Future Roadmap

- [ ] AI-powered match prediction model
- [ ] Win probability engine
- [ ] Fantasy team generator
- [ ] Player recommendation system
- [ ] IPL season-over-season comparison
- [ ] Real-time live score integration
- [ ] WebSocket-based live updates
- [ ] AI-generated match commentary
- [ ] PDF report export
- [ ] Advanced filtering options
- [ ] Performance heatmaps
- [ ] Dark / light theme toggle
- [ ] Multi-league support

---

## 🤝 Contributing

Contributions are welcome and appreciated!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Aayush Bharda**

[![GitHub](https://img.shields.io/badge/GitHub-aayush45123-181717?style=flat-square&logo=github)](https://github.com/aayush45123)

---

<div align="center">

### ⭐ Support

If you found this project helpful, please consider giving it a star — it motivates me to keep building open-source projects.

</div>
