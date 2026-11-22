# FinFraud: Presentation Slide Deck Outline
## NoSQL Mini Project: Real-Time Graph Financial Fraud Detection Platform

---

### Slide 1: Title & Team
- **Title:** FinFraud: Real-Time Graph Financial Fraud Detection Platform
- **Sub-title:** High-Performance Fraud Ring & Smurfing Detection Powered by Neo4j AuraDB
- **Course:** NoSQL Database Systems / Advanced Database Engineering
- **Platform:** Neo4j AuraDB Cloud + Node.js Express + React 18 & Vite

---

### Slide 2: Problem Statement
- Financial crime is inherently networked: money laundering, smurfing, and device spoofing operate across complex multi-entity graphs.
- **The Core Problem:** Relational databases (RDBMS) rely on expensive multi-table `JOIN` operations ($O(b^k)$ exponential cost) that make real-time multi-hop fraud detection impossible during live transaction authorization.
- Fraudsters exploit this latency gap to move funds through 3+ hops in minutes.

---

### Slide 3: Objectives
- Connect to a live cloud graph database (**Neo4j AuraDB**) storing real-world transaction graphs.
- Implement sub-second pattern-matching Cypher queries for:
  1. Circular money laundering rings (3-hop loops).
  2. VPN-hopping shared device hubs.
  3. Money mule smurfing fan-in accounts.
- Build an interactive investigator dashboard with dynamic node-link graph visualization.
- Provide a real-time transaction simulator and investigator blacklist toggle.

---

### Slide 4: Requirements
- **Functional:**
  - Real-time KPI summaries.
  - Subgraph exploration centered on any user account.
  - Fraud intelligence feeds with one-click graph inspection.
  - Parameterized risk scoring ($+50$ for blacklisted receivers, $+30$ for VPN geo-mismatch).
- **Non-Functional:**
  - ACID transactional consistency on all writes.
  - Sub-150ms query latency.
  - Dark-mode cyber-investigation interface.

---

### Slide 5: Selected NoSQL Database & Justification
- **Selected:** Neo4j AuraDB (Labeled Property Graph).
- **Why not Document (MongoDB)?** Poor join performance across independent entity collections.
- **Why not Key-Value (Redis) or Columnar (Cassandra)?** Cannot execute path-traversal or pattern-matching queries.
- **Why Neo4j Graph?**
  - **Index-Free Adjacency (IFA):** Direct pointer traversal between adjacent nodes ($O(1)$ per hop).
  - **Cypher Language:** Declarative ASCII-art pattern matching.
  - **Scalability:** Handles billions of relationships with deterministic traversal speeds.

---

### Slide 6: System Architecture
- **Architecture Diagram:**
  - `Client (React + Vite + Tailwind)` $\longleftrightarrow$ `REST API Proxy (Node.js/Express)` $\longleftrightarrow$ `Bolt Driver (TLS)` $\longleftrightarrow$ `Neo4j AuraDB`
- **Key Modules:**
  - `HeaderKpis.jsx`: Live summary cards.
  - `GraphCanvas.jsx`: Interactive `react-force-graph-2d` canvas with custom node painting.
  - `FraudAlertsPanel.jsx`: Tabbed feeds for Circular Rings, Device Hubs, and Money Mules.
  - `TransactionSimulator.jsx`: Live transaction injector with risk prediction.

---

### Slide 7: Graph Data Model (Schema)
- **Nodes:**
  - `User`: `{ userId, name, email, country, isBlacklisted, riskScore }`
  - `Account`: `{ accountId, balance, createdAt }`
  - `Transaction`: `{ txId, amount, timestamp, status, riskScore }`
  - `Device`: `{ fingerprintHash, os, browser }`
  - `IPAddress`: `{ ip, isVpn, country }`
- **Edges:**
  - `(:User)-[:OWNS]->(:Account)`
  - `(:Account)-[:INITIATED]->(:Transaction)`
  - `(:Transaction)-[:CREDITED_TO]->(:Account)`
  - `(:Transaction)-[:EXECUTED_ON]->(:Device)`
  - `(:Transaction)-[:ORIGINATED_FROM]->(:IPAddress)`

---

### Slide 8: Implementation & Key Cypher Queries
- **Circular Ring Pattern:**
  ```cypher
  MATCH (u1:User)-[:OWNS]->(a1:Account)
        -[:INITIATED]->(t1:Transaction)-[:CREDITED_TO]->(a2:Account)
        -[:INITIATED]->(t2:Transaction)-[:CREDITED_TO]->(a3:Account)
        -[:INITIATED]->(t3:Transaction)-[:CREDITED_TO]->(a1)
  WHERE t1.timestamp < t2.timestamp AND t2.timestamp < t3.timestamp
    AND t3.amount >= t1.amount * 0.80
  RETURN [u1.name, a2.accountId, a3.accountId] AS ringMembers
  ```
- **Real-Time Scoring MERGE Query:**
  - Evaluates receiver blacklist status and VPN country mismatches dynamically.

---

### Slide 9: Key Features Demonstrated
1. **Interactive Subgraph Visualizer:**
   - Quick-select archetypes (`U-201` Ring, `U-301` VPN Hopper, `U-400` Mule, `U-101` Clean).
   - Click-to-inspect node properties drawer.
2. **Fraud Intelligence Feeds:**
   - Ring Members, Retention Rate, VPN Exit Nodes, Fan-In Counters.
3. **Live Simulator & Blacklist Toggle:**
   - Instant AuraDB mutations with real-time KPI updates.

---

### Slide 10: Results & Verification
- **AuraDB Live Verification:**
  - Circular Ring `ACC-201` loop detected (₹95,000 $\rightarrow$ ₹90,000).
  - `DEV-SPOOF-999` detected linking 3 users across NL, DE, US IPs.
  - `ACC-MULE` detected with 5 smurfing fan-in deposits (₹24,500).
- **Sub-100ms Query Latency** across all graph endpoints.

---

### Slide 11: Challenges & Solutions
1. **Challenge:** Neo4j 64-bit integer object serialization in Node.js.  
   **Solution:** Built deep recursive serializer converting `neo4j.int` to native JavaScript numbers.
2. **Challenge:** Visual clutter in dense graph topologies.  
   **Solution:** Custom canvas painting with scaled labels, glow rings, and collision spacing.
3. **Challenge:** Query injection risks.  
   **Solution:** 100% parameterization using driver parameter maps (`$paramName`).

---

### Slide 12: Future Enhancements & Conclusion
- **Future Work:**
  - Graph Neural Networks (GNNs / Node2Vec) for automated anomaly prediction.
  - WebSocket push notifications for streaming live transaction feeds.
- **Conclusion:**
  - Neo4j graph databases represent the gold standard for financial crime prevention, transforming complex multi-hop investigations into instant, visual graph intelligence.
