# FinFraud — Real-Time Graph Financial Fraud Detection Platform

[![Neo4j AuraDB](https://img.shields.io/badge/Database-Neo4j%20AuraDB-008CC1?logo=neo4j&logoColor=white)](https://neo4j.com/cloud/platform/aura-graph-database/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/UI-Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**FinFraud** is an enterprise-grade graph financial crime investigation and real-time transaction risk scoring platform powered by **Neo4j AuraDB**, Express, and React. It detects complex financial topologies—such as circular money laundering loops, VPN-hopping shared device rings, and smurfing fan-in money mule networks—at native pointer-chasing graph speeds.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node v22)
- **npm**: v9+

---

### Step 1: Backend Setup & Start

1. Navigate to `/backend`:
   ```bash
   cd backend
   ```
2. Verify dependencies are installed:
   ```bash
   npm install
   ```
3. Ensure `backend/.env` contains your Neo4j AuraDB credentials:
   ```env
   NEO4J_URI=neo4j+s://08891cc5.databases.neo4j.io
   NEO4J_DATABASE=08891cc5
   NEO4J_USER=08891cc5
   NEO4J_PASSWORD=SWpV0WUBFpLVcIVQfnlsquhQ3uv9GCLhRVo54b3DfYY
   PORT=5000
   ```
4. Start the Express server:
   ```bash
   npm start
   # Server will run on http://localhost:5000
   ```

---

### Step 2: Frontend Setup & Start (React + Vite)

1. Open a new terminal and navigate to `/frontend`:
   ```bash
   cd frontend
   ```
2. Verify dependencies are installed:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   # Dashboard will run on http://localhost:3000
   ```
4. Open your browser to **`http://localhost:3000`**.

---

### Step 3: Streamlit Setup & Start (Python Dashboard - Member 3)

1. Open a terminal and navigate to `/streamlit_app`:
   ```bash
   cd streamlit_app
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the Streamlit application:
   ```bash
   streamlit run streamlit_app.py --server.port 8501
   # Dashboard will run on http://localhost:8501
   ```
4. Open your browser to **`http://localhost:8501`**.

---

## 🌐 Live Database Architecture (Neo4j AuraDB)

- **AuraDB Instance**: `08891cc5.databases.neo4j.io`
- **Protocol**: `neo4j+s://` (TLS encrypted Bolt connection)
- **Data Model**:
  - **`User`**: `{ userId, name, email, country, isBlacklisted, riskScore }`
  - **`Account`**: `{ accountId, balance, createdAt }`
  - **`Transaction`**: `{ txId, amount, timestamp, status ('COMPLETED' | 'FLAGGED'), riskScore }`
  - **`Device`**: `{ fingerprintHash, os, browser }`
  - **`IPAddress`**: `{ ip, isVpn, country }`
- **Relationships**:
  - `(:User)-[:OWNS]->(:Account)`
  - `(:Account)-[:INITIATED]->(:Transaction)`
  - `(:Transaction)-[:CREDITED_TO]->(:Account)`
  - `(:Transaction)-[:EXECUTED_ON]->(:Device)`
  - `(:Transaction)-[:ORIGINATED_FROM]->(:IPAddress)`

---

## 🛡️ Pre-Seeded Fraud Rings & Test Archetypes

| Archetype | User / Account | Topology / Scenario | Detection Query |
| :--- | :--- | :--- | :--- |
| **Circular Laundering Ring** | `U-201` (`ACC-201`), `U-202` (`ACC-202`), `U-203` (`ACC-203`) | 3-hop closed loop cycling ₹95,000 → ₹92,000 → ₹90,000 | `GET /api/fraud/rings` |
| **Shared Device / VPN Hopper** | `U-301`, `U-302`, `U-303` | 3 distinct identities sharing `DEV-SPOOF-999` across rotating VPN IPs (`NL`, `DE`, `US`) | `GET /api/fraud/shared-devices` |
| **Money Mule (Smurfing Fan-In)** | `U-400` (`ACC-MULE` - Rakesh Gill) | 5 senders (`ACC-401`..`ACC-405`) funneling ₹4,900 each for ₹24,500 | `GET /api/fraud/mules` |
| **Clean Baseline** | `U-101` (`ACC-101` - Aarav Sharma) | Legitimate transfers within domestic IP (`IN`) and verified hardware | `GET /api/graph/U-101` |

---

## 📡 API Contract & Cypher Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/stats` | `GET` | Dashboard KPI summary cards (Total Users, Transactions, Flagged Count, Volume ₹). |
| `/api/fraud/rings` | `GET` | Evaluates 3-hop closed circular money laundering loops with ≥80% funds retention. |
| `/api/fraud/shared-devices` | `GET` | Detects hardware fingerprints (`Device`) linked to ≥3 distinct user accounts. |
| `/api/fraud/mules` | `GET` | Identifies central smurfing fan-in accounts receiving funds from ≥5 unique senders. |
| `/api/graph/:userId` | `GET` | Subgraph explorer serialized as `{ nodes, links }` for `react-force-graph-2d`. |
| `/api/transactions` | `POST` | Dynamic transaction simulator with real-time risk scoring and AuraDB graph MERGE. |
| `/api/users/:userId/blacklist`| `PATCH` | Investigator blacklist toggle immediately triggering +50 risk penalties. |
| `/api/users` | `GET` | Helper returning all 16 users and accounts for dynamic UI dropdowns. |

---

## 🧪 Testing & Verification

Run the automated API test suite against live AuraDB:
```bash
node backend/server.js
# In another terminal:
curl http://localhost:5000/api/stats
curl http://localhost:5000/api/fraud/rings
curl http://localhost:5000/api/fraud/shared-devices
curl http://localhost:5000/api/fraud/mules
```
