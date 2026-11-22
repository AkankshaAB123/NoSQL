# FinFraud: Real-Time Graph Financial Fraud Detection Platform
## Comprehensive NoSQL Mini-Project Technical Report & System Documentation

**Author / Engineering Team:** FinFraud Core Development Team  
**Database System:** Neo4j AuraDB (Cloud Native Labeled Property Graph)  
**Stack:** React 18, Vite, Tailwind CSS, Express, Node.js, `neo4j-driver`  
**Date:** November 2026  

---

## 1. Problem Identification

### 1.1 Real-World Problem Context
Financial crime, money laundering, and digital payment fraud have surged dramatically with the rise of instant payment rails (UPI, FedNow, SEPA Instant, Faster Payments). Modern financial criminals operate as sophisticated, syndicated networks utilizing advanced evasion techniques:
- **Layering & Circular Laundering:** Funds are routed through multiple intermediate accounts across a closed cycle (A $\rightarrow$ B $\rightarrow$ C $\rightarrow$ A) within tight time intervals to obfuscate audit trails while retaining capital.
- **Shared Device Fingerprints with VPN-Hopping:** Criminal syndicates create dozens of seemingly unrelated accounts from the same physical device while rotating foreign VPN exit nodes to bypass traditional geo-location blocks.
- **Money Mule Networks (Smurfing Fan-In):** Structuring large illegal sums into numerous small deposits (< ₹50,000 / $10,000 regulatory reporting thresholds) from distinct accounts into a centralized mule account.

### 1.2 The Problem Statement
Traditional Relational Database Management Systems (RDBMS) model transactions using table joins (`JOIN` operations between Users, Accounts, Transactions, Devices, and IP tables). As transaction graphs grow to millions of records, multi-hop path traversals ($k \ge 3$ joins) experience exponential computational degradation ($O(b^k)$ where $b$ is branch factor). Relational systems are incapable of evaluating multi-hop circular loops and smurfing fan-ins within the sub-100 millisecond SLA required for real-time transaction authorization.

### 1.3 Stakeholders & Solution Objectives
- **Financial Crime Investigators (AML/CFT):** Need rapid visual graph exploration to trace transaction hops, reveal hidden ring members, and isolate mule rings.
- **Risk & Compliance Officers:** Require automated detection of threshold-crossing circular paths and shared hardware clusters.
- **Payment Gateway Real-Time Risk Engines:** Require sub-second evaluation of incoming transactions to block or flag high-risk transfers before settlement.

---

## 2. Selection of NoSQL Database & Justification

### 2.1 The Four NoSQL Database Categories
1. **Document Stores (e.g., MongoDB, CouchDB):** Optimized for hierarchical document persistence, but lack native pointer-chasing joins across disparate entity collections.
2. **Key-Value Stores (e.g., Redis, DynamoDB):** Highly performant for point lookups ($O(1)$) and caching, but lack graph traversal capabilities.
3. **Wide-Column Stores (e.g., Apache Cassandra, ScyllaDB):** Exceptional for high-write time-series ingestion, but inefficient for deep relationship queries.
4. **Graph Databases (e.g., Neo4j, Amazon Neptune):** Specifically architected for highly interconnected data using **Index-Free Adjacency (IFA)**.

### 2.2 Selection: Neo4j AuraDB (Labeled Property Graph)
We selected **Neo4j AuraDB** because:
- **Index-Free Adjacency (IFA):** In Neo4j, each node directly contains double-linked memory pointers to its adjacent relationships and neighbor nodes. Traversing an edge requires $O(1)$ pointer dereferencing regardless of the total size of the database.
- **Expressive Cypher Query Language:** Cypher provides declarative ASCII-art pattern matching (e.g., `(a)-[:INITIATED]->(t)-[:CREDITED_TO]->(b)`), making complex topological patterns concise, readable, and highly optimizable.
- **ACID Compliance:** Financial transactions demand strict atomicity and consistency. Neo4j delivers full ACID transaction guarantees on graph writes.

---

## 3. Requirement Analysis

### 3.1 Functional Requirements
1. **Live Cloud Graph Connectivity:** Continuous connection to Neo4j AuraDB via secure Bolt protocol (`neo4j+s://`).
2. **Dashboard Key Performance Indicators (KPIs):** Aggregate metrics for Total Users, Total Transactions, Flagged Alerts, and Total Volume (₹).
3. **Detection of Circular Money Laundering Rings:** Identify 3-hop closed transfer loops where capital returns to the originator retaining $\ge 80\%$ of funds.
4. **Detection of Shared Device Hubs:** Uncover single hardware devices (`fingerprintHash`) utilized across $\ge 3$ distinct customer accounts across rotating VPN IPs.
5. **Detection of Money Mule Accounts:** Identify fan-in nodes receiving deposits from $\ge 5$ distinct accounts.
6. **Interactive Subgraph Visualizer:** Dynamically fetch and render user-centric subgraphs with color-coded nodes and relationship edges.
7. **Live Transaction Simulator & Risk Engine:** Allow users to simulate transfers, automatically scoring blacklist risks (+50) and VPN geo-mismatches (+30), persisting the transaction as `FLAGGED` or `COMPLETED`.
8. **Investigator Blacklist Controls:** Instantly toggle user blacklist status via parameterized Cypher mutations.

### 3.2 Non-Functional Requirements
- **Performance:** Subgraph retrieval and fraud detection queries execute under 150ms.
- **Security:** Zero SQL/Cypher injection through strict driver parameterization (`$paramName`).
- **Resilience:** Graceful handling of connection timeouts and database connection pooling.
- **UX / Aesthetics:** Dark-mode cyber-investigation interface with real-time feedback.

---

## 4. System & Database Design

### 4.1 System Architecture
```
┌────────────────────────────────────────────────────────┐
│               Frontend: React 18 + Vite                │
│  - KPI Summary Cards                                   │
│  - react-force-graph-2d Interactive Graph Canvas       │
│  - Tabbed Fraud Feeds (Rings, Devices, Mules)          │
│  - Live Transaction Simulator & Blacklist Controls     │
└───────────────────────────▲────────────────────────────┘
                            │ REST / JSON (HTTP Proxy)
┌───────────────────────────▼────────────────────────────┐
│              Backend: Node.js + Express                │
│  - REST API Routes (/api/stats, /api/fraud/*, etc.)    │
│  - Neo4j JavaScript Driver 5.x                         │
│  - Deep Serializer (Int / DateTime → JSON numbers/str) │
└───────────────────────────▲────────────────────────────┘
                            │ Bolt Protocol (neo4j+s:// TLS)
┌───────────────────────────▼────────────────────────────┐
│           Database: Neo4j AuraDB Cloud Graph           │
│  - Nodes: User, Account, Transaction, Device, IP       │
│  - Relationships: OWNS, INITIATED, CREDITED_TO, etc.   │
│  - Uniqueness Constraints & Indexes                    │
└────────────────────────────────────────────────────────┘
```

### 4.2 Graph Data Model (Schema)

#### Nodes & Properties:
- **`User`**: `{ userId: String (Unique), name: String, email: String, country: String, isBlacklisted: Boolean, riskScore: Integer }`
- **`Account`**: `{ accountId: String (Unique), balance: Float, createdAt: DateTime }`
- **`Transaction`**: `{ txId: String (Unique), amount: Float, timestamp: DateTime, status: 'COMPLETED' | 'FLAGGED', riskScore: Integer }`
- **`Device`**: `{ fingerprintHash: String (Unique), os: String, browser: String }`
- **`IPAddress`**: `{ ip: String (Unique), isVpn: Boolean, country: String }`

#### Relationships:
- `(:User)-[:OWNS]->(:Account)`
- `(:Account)-[:INITIATED]->(:Transaction)`
- `(:Transaction)-[:CREDITED_TO]->(:Account)`
- `(:Transaction)-[:EXECUTED_ON]->(:Device)`
- `(:Transaction)-[:ORIGINATED_FROM]->(:IPAddress)`

---

## 5. Implementation & Parameterized Cypher Queries

### 5.1 Dashboard KPIs (`GET /api/stats`)
```cypher
MATCH (u:User) WITH count(u) AS totalUsers
MATCH (t:Transaction) WITH totalUsers, count(t) AS totalTransactions, sum(t.amount) AS totalVolume
MATCH (flagged:Transaction {status: 'FLAGGED'}) WITH totalUsers, totalTransactions, totalVolume, count(flagged) AS flaggedCount
RETURN totalUsers, totalTransactions, flaggedCount, totalVolume
```

### 5.2 Circular Laundering Detection (`GET /api/fraud/rings`)
```cypher
MATCH (u1:User)-[:OWNS]->(a1:Account)
      -[:INITIATED]->(t1:Transaction)-[:CREDITED_TO]->(a2:Account)
      -[:INITIATED]->(t2:Transaction)-[:CREDITED_TO]->(a3:Account)
      -[:INITIATED]->(t3:Transaction)-[:CREDITED_TO]->(a1)
WHERE t1.timestamp < t2.timestamp AND t2.timestamp < t3.timestamp
  AND t3.amount >= t1.amount * 0.80
RETURN [u1.name, a2.accountId, a3.accountId] AS ringMembers,
       t1.amount AS initialAmount,
       t3.amount AS returnedAmount,
       [t1.txId, t2.txId, t3.txId] AS transactionIds,
       u1.userId AS originUserId
```

### 5.3 Shared Device & VPN Hopper Detection (`GET /api/fraud/shared-devices`)
```cypher
MATCH (u:User)-[:OWNS]->(:Account)-[:INITIATED]->(t:Transaction)-[:EXECUTED_ON]->(d:Device)
OPTIONAL MATCH (t)-[:ORIGINATED_FROM]->(ip:IPAddress)
WITH d,
     collect(DISTINCT u.userId) AS userIds,
     collect(DISTINCT u.name) AS userNames,
     collect(DISTINCT ip.ip) AS ipsUsed,
     count(DISTINCT u) AS userCount
WHERE userCount >= 3
RETURN d.fingerprintHash AS deviceHash,
       userCount,
       userIds,
       userNames,
       ipsUsed
```

### 5.4 Money Mule Smurfing Detection (`GET /api/fraud/mules`)
```cypher
MATCH (sender:Account)-[:INITIATED]->(t:Transaction)-[:CREDITED_TO]->(muleAcc:Account)<-[:OWNS]-(muleUser:User)
WITH muleUser,
     muleAcc,
     count(DISTINCT sender) AS uniqueSenders,
     sum(t.amount) AS totalReceived
WHERE uniqueSenders >= 5
RETURN muleUser.userId AS userId,
       muleUser.name AS muleName,
       muleAcc.accountId AS accountId,
       uniqueSenders,
       totalReceived
```

### 5.5 Subgraph Explorer (`GET /api/graph/:userId`)
```cypher
MATCH (u:User {userId: $userId})-[:OWNS]->(a:Account)
OPTIONAL MATCH (a)-[r1:INITIATED|CREDITED_TO]-(tx:Transaction)
OPTIONAL MATCH (tx)-[r2:EXECUTED_ON|ORIGINATED_FROM]->(meta)
RETURN u, a, tx, meta, r1, r2
```

### 5.6 Real-Time Transaction Simulator (`POST /api/transactions`)
```cypher
MATCH (senderUser:User)-[:OWNS]->(senderAcc:Account {accountId: $senderAccId})
MATCH (receiverAcc:Account {accountId: $receiverAccId})<-[:OWNS]-(receiverUser:User)

MERGE (dev:Device {fingerprintHash: $deviceHash})
MERGE (ip:IPAddress {ip: $ip})
  ON CREATE SET ip.isVpn = $isVpn, ip.country = $ipCountry

WITH senderUser, senderAcc, receiverUser, receiverAcc, dev, ip,
     CASE WHEN receiverUser.isBlacklisted = true THEN 50 ELSE 0 END AS blacklistRisk,
     CASE WHEN ip.isVpn = true AND ip.country <> senderUser.country THEN 30 ELSE 0 END AS vpnGeoRisk

WITH senderUser, senderAcc, receiverUser, receiverAcc, dev, ip,
     (blacklistRisk + vpnGeoRisk) AS totalRiskScore

CREATE (tx:Transaction {
  txId: 'TX-' + toString(timestamp()),
  amount: toFloat($amount),
  timestamp: datetime(),
  status: CASE WHEN totalRiskScore >= 50 THEN 'FLAGGED' ELSE 'COMPLETED' END,
  riskScore: totalRiskScore
})
CREATE (senderAcc)-[:INITIATED]->(tx)-[:CREDITED_TO]->(receiverAcc)
CREATE (tx)-[:EXECUTED_ON]->(dev)
CREATE (tx)-[:ORIGINATED_FROM]->(ip)

RETURN tx.txId AS txId,
       tx.status AS status,
       tx.riskScore AS riskScore,
       senderUser.name AS senderName,
       receiverUser.name AS receiverName
```

### 5.7 Investigator Blacklist Toggle (`PATCH /api/users/:userId/blacklist`)
```cypher
MATCH (u:User {userId: $userId})
SET u.isBlacklisted = $isBlacklisted,
    u.riskScore = CASE WHEN $isBlacklisted = true THEN 100 ELSE 10 END
RETURN u.userId AS userId,
       u.name AS name,
       u.isBlacklisted AS isBlacklisted,
       u.riskScore AS riskScore
```

---

## 6. Testing & Evaluation

### 6.1 Verification of Pre-Seeded Fraud Rings in Live AuraDB
- **Ring A (Circular Loop):** Detected `U-201` (`ACC-201`), `ACC-202`, `ACC-203` with initial amount ₹95,000, returned amount ₹90,000 across transactions `TX-RING-01`, `TX-RING-02`, and `TX-RING-03`.
- **Ring B (Shared Device Hub):** Detected `DEV-SPOOF-999` with 3 linked users (`U-301`, `U-302`, `U-303`) across 3 foreign VPN exit nodes (`185.220.101.4` [NL], `45.134.26.88` [DE], and `192.42.116.19` [US]).
- **Ring C (Money Mule Fan-In):** Detected `U-400` (Rakesh Gill, `ACC-MULE`) receiving 5 fan-in transfers totaling ₹24,500.

### 6.2 Real-Time Scoring Evaluation
- When sending funds to clean user `U-102` with domestic IP: Total Risk = 0 $\rightarrow$ `COMPLETED`.
- When enabling VPN from foreign exit node: Total Risk = 30 $\rightarrow$ `COMPLETED`.
- When sending to blacklisted user `U-301`: Blacklist Risk = +50 $\rightarrow$ Total Risk = 50 $\rightarrow$ `FLAGGED`.
- When sending to blacklisted user with VPN: Total Risk = 50 + 30 = 80 $\rightarrow$ `FLAGGED`.

---

## 7. Challenges, Limitations & Solutions

| Challenge | Root Cause | Implemented Solution |
| :--- | :--- | :--- |
| **Neo4j 64-bit Integer Serialization** | JavaScript native `JSON.stringify` does not handle Neo4j `Integer` objects (`low`, `high`). | Developed recursive `serializeNeo4jValue()` that converts `neo4j.isInt` to JavaScript `Number` safely. |
| **Write Permissions in Read Mode** | AuraDB sessions defaulted to Read access mode, blocking `SET` and `CREATE` mutations. | Configured session instantiation to default to `neo4j.session.WRITE` mode. |
| **Graph Density & Layout Clutter** | Standard force-directed graphs overlap nodes when degrees are high. | Implemented custom canvas rendering with dynamic node radii, text backgrounds, and collision offsets. |

---

## 8. Conclusion
FinFraud demonstrates the transformative advantages of graph databases for financial fraud detection. By modeling users, accounts, devices, and transactions as a connected property graph in Neo4j AuraDB, complex topological fraud patterns that cripple relational databases can be detected instantly in linear time ($O(k)$). The platform bridges graph data science and frontline investigation operations with an intuitive, real-time investigation dashboard.
