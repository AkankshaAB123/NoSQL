# FinFraud — Python & Streamlit Fraud Investigator Dashboard (Member 3)

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.38%2B-FF4B4B?logo=streamlit&logoColor=white)](https://streamlit.io/)
[![Neo4j](https://img.shields.io/badge/Neo4j-Official%20Python%20Driver-008CC1?logo=neo4j&logoColor=white)](https://neo4j.com/)
[![NetworkX](https://img.shields.io/badge/NetworkX-Graph%20Algorithms-orange)](https://networkx.org/)
[![Pyvis](https://img.shields.io/badge/Pyvis-Interactive%20Visuals-purple)](https://pyvis.readthedocs.io/)

This folder contains the **Member 3** deliverable for the FinFraud platform: a high-performance, dark-themed **Python + Streamlit** fraud investigator dashboard connected directly to the live **Neo4j AuraDB** cloud graph database.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd streamlit_app
pip install -r requirements.txt
```

### 2. Verify Database Connection
The `.env` file is pre-configured with the AuraDB cluster credentials:
```env
NEO4J_URI=neo4j+s://08891cc5.databases.neo4j.io
NEO4J_DATABASE=08891cc5
NEO4J_USER=08891cc5
NEO4J_PASSWORD=SWpV0WUBFpLVcIVQfnlsquhQ3uv9GCLhRVo54b3DfYY
```

### 3. Run the Dashboard
```bash
streamlit run streamlit_app.py --server.port 8501
```
Open **`http://localhost:8501`** in your browser.

---

## 🔍 Core Features

1. **Live Connection Indicator:** Confirms active Bolt TLS connection to Neo4j AuraDB (`08891cc5`).
2. **Dashboard KPI Metrics:** Total Accounts, Total Transactions, Flagged/Suspicious Accounts, and Total Volume in ₹.
3. **Dynamic Pandas Filters:**
   - Minimum transaction amount slider (`st.slider`).
   - Keyword text search across Users, Accounts, Transactions, and Devices.
   - Status multiselect (`COMPLETED`, `FLAGGED`).
4. **Interactive NetworkX & Pyvis Graph:**
   - Multi-hop graph analysis with degree and centrality calculation.
   - Color-coded node schema (User: Blue, Account: Cyan, Completed Tx: Green, Flagged Tx: Red, Device: Orange, IP: Purple).
   - Rich hover tooltips with full property inspection.
   - Toggle between **Selected User Subgraph** and **Full Network Graph**.
5. **Fraud Detection Feeds:**
   - **Tab 1:** Circular Money Laundering Loops (3-hop closed cycles).
   - **Tab 2:** Shared Device Hubs with VPN-hopping IP rotation.
   - **Tab 3:** Money Mule smurfing fan-in accounts ($\ge 5$ senders).
6. **Live Simulation & Blacklist Controls:**
   - In-app transaction generator with real-time risk evaluation.
   - Investigator blacklist toggles to test $+50$ risk scoring penalties live.
