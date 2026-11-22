const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { getSession, recordToObject, serializeNeo4jValue, driver } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'FinFraud Backend API', timestamp: new Date().toISOString() });
});

/**
 * 1) GET /api/stats — Dashboard KPI Summary Cards
 */
app.get('/api/stats', async (req, res) => {
  const session = getSession();
  try {
    const cypher = `
      MATCH (u:User) WITH count(u) AS totalUsers
      MATCH (t:Transaction) WITH totalUsers, count(t) AS totalTransactions, sum(t.amount) AS totalVolume
      MATCH (flagged:Transaction {status: 'FLAGGED'}) WITH totalUsers, totalTransactions, totalVolume, count(flagged) AS flaggedCount
      RETURN totalUsers, totalTransactions, flaggedCount, totalVolume
    `;
    const result = await session.run(cypher);
    if (result.records.length > 0) {
      const stats = recordToObject(result.records[0]);
      return res.json(stats);
    }
    res.json({ totalUsers: 0, totalTransactions: 0, flaggedCount: 0, totalVolume: 0 });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

/**
 * 2) GET /api/fraud/rings — Detect Circular Money Laundering Rings
 */
app.get('/api/fraud/rings', async (req, res) => {
  const session = getSession();
  try {
    const cypher = `
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
    `;
    const result = await session.run(cypher);
    const rings = result.records.map((r) => recordToObject(r));
    res.json(rings);
  } catch (error) {
    console.error('Error fetching fraud rings:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

/**
 * 3) GET /api/fraud/shared-devices — Detect VPN-Hopping / Shared Device Hubs
 */
app.get('/api/fraud/shared-devices', async (req, res) => {
  const session = getSession();
  try {
    const cypher = `
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
    `;
    const result = await session.run(cypher);
    const hubs = result.records.map((r) => recordToObject(r));
    res.json(hubs);
  } catch (error) {
    console.error('Error fetching shared devices:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

/**
 * 4) GET /api/fraud/mules — Detect Money Mule (Smurfing Fan-In) Accounts
 */
app.get('/api/fraud/mules', async (req, res) => {
  const session = getSession();
  try {
    const cypher = `
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
    `;
    const result = await session.run(cypher);
    const mules = result.records.map((r) => recordToObject(r));
    res.json(mules);
  } catch (error) {
    console.error('Error fetching money mules:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

/**
 * 5) GET /api/graph/:userId — Subgraph Explorer for Visualization
 * Transforms Neo4j nodes/relationships into { nodes: [...], links: [...] }
 */
app.get('/api/graph/:userId', async (req, res) => {
  const { userId } = req.params;
  const expand = req.query.expand === 'true';
  const session = getSession();

  try {
    let result;
    if (expand) {
      // Expanded query: also discovers counterparties for transactions
      const expandedCypher = `
        MATCH (u:User {userId: $userId})-[:OWNS]->(a:Account)
        OPTIONAL MATCH (a)-[r1:INITIATED|CREDITED_TO]-(tx:Transaction)
        OPTIONAL MATCH (tx)-[r2:EXECUTED_ON|ORIGINATED_FROM]->(meta)
        OPTIONAL MATCH (tx)-[r3:INITIATED|CREDITED_TO]-(counterAcc:Account)<-[:OWNS]-(counterUser:User)
        WHERE counterAcc <> a
        RETURN u, a, tx, meta, r1, r2, counterAcc, counterUser, r3
      `;
      result = await session.run(expandedCypher, { userId });
    } else {
      // Standard exact Cypher query from requirements contract
      const standardCypher = `
        MATCH (u:User {userId: $userId})-[:OWNS]->(a:Account)
        OPTIONAL MATCH (a)-[r1:INITIATED|CREDITED_TO]-(tx:Transaction)
        OPTIONAL MATCH (tx)-[r2:EXECUTED_ON|ORIGINATED_FROM]->(meta)
        RETURN u, a, tx, meta, r1, r2
      `;
      result = await session.run(standardCypher, { userId });
    }

    const nodesMap = new Map();
    const linksMap = new Map();

    const addNode = (id, label, props) => {
      if (!id || nodesMap.has(id)) return;
      nodesMap.set(id, {
        id,
        label,
        type: label,
        ...props,
      });
    };

    const addLink = (source, target, type, label, props = {}) => {
      if (!source || !target) return;
      const key = `${source}->${target}:${type}`;
      if (linksMap.has(key)) return;
      linksMap.set(key, {
        source,
        target,
        type,
        label: label || type,
        ...props,
      });
    };

    for (const record of result.records) {
      const u = serializeNeo4jValue(record.get('u'));
      const a = serializeNeo4jValue(record.get('a'));
      const tx = serializeNeo4jValue(record.get('tx'));
      const meta = serializeNeo4jValue(record.get('meta'));
      const r1 = serializeNeo4jValue(record.get('r1'));
      const r2 = serializeNeo4jValue(record.get('r2'));

      if (u) {
        addNode(u.userId, 'User', {
          name: u.name,
          email: u.email,
          country: u.country,
          isBlacklisted: Boolean(u.isBlacklisted),
          riskScore: u.riskScore,
        });
      }

      if (a) {
        addNode(a.accountId, 'Account', {
          name: a.accountId,
          balance: a.balance,
          createdAt: a.createdAt,
        });
        if (u) {
          addLink(u.userId, a.accountId, 'OWNS', 'OWNS');
        }
      }

      if (tx) {
        addNode(tx.txId, 'Transaction', {
          name: `${tx.txId} (₹${Number(tx.amount || 0).toLocaleString()})`,
          amount: tx.amount,
          status: tx.status,
          riskScore: tx.riskScore,
          timestamp: tx.timestamp,
        });

        if (a && r1) {
          if (r1._type === 'INITIATED') {
            addLink(a.accountId, tx.txId, 'INITIATED', 'INITIATED');
          } else {
            addLink(tx.txId, a.accountId, 'CREDITED_TO', 'CREDITED_TO');
          }
        }
      }

      if (meta && tx && r2) {
        const isDevice = Boolean(meta.fingerprintHash);
        const metaId = isDevice ? meta.fingerprintHash : meta.ip;
        const metaLabel = isDevice ? 'Device' : 'IPAddress';

        addNode(metaId, metaLabel, {
          name: metaId,
          ...meta,
        });

        addLink(tx.txId, metaId, r2._type, r2._type);
      }

      // If expand mode was enabled, handle counterparties
      if (expand && record.has('counterAcc')) {
        const counterAcc = serializeNeo4jValue(record.get('counterAcc'));
        const counterUser = serializeNeo4jValue(record.get('counterUser'));
        const r3 = serializeNeo4jValue(record.get('r3'));

        if (counterAcc) {
          addNode(counterAcc.accountId, 'Account', {
            name: counterAcc.accountId,
            balance: counterAcc.balance,
            createdAt: counterAcc.createdAt,
          });

          if (counterUser) {
            addNode(counterUser.userId, 'User', {
              name: counterUser.name,
              email: counterUser.email,
              country: counterUser.country,
              isBlacklisted: Boolean(counterUser.isBlacklisted),
              riskScore: counterUser.riskScore,
            });
            addLink(counterUser.userId, counterAcc.accountId, 'OWNS', 'OWNS');
          }

          if (tx && r3) {
            if (r3._type === 'INITIATED') {
              addLink(counterAcc.accountId, tx.txId, 'INITIATED', 'INITIATED');
            } else {
              addLink(tx.txId, counterAcc.accountId, 'CREDITED_TO', 'CREDITED_TO');
            }
          }
        }
      }
    }

    res.json({
      userId,
      nodes: Array.from(nodesMap.values()),
      links: Array.from(linksMap.values()),
    });
  } catch (error) {
    console.error(`Error fetching graph for user ${userId}:`, error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

/**
 * 6) POST /api/transactions — Live Transaction Simulator & Risk Scorer
 * Body: { senderAccId, receiverAccId, amount, deviceHash, ip, isVpn, ipCountry }
 */
app.post('/api/transactions', async (req, res) => {
  const { senderAccId, receiverAccId, amount, deviceHash, ip, isVpn, ipCountry } = req.body;

  if (!senderAccId || !receiverAccId || !amount || !deviceHash || !ip || ipCountry === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: senderAccId, receiverAccId, amount, deviceHash, ip, isVpn, ipCountry',
    });
  }

  const session = getSession();
  try {
    const cypher = `
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
    `;

    const params = {
      senderAccId,
      receiverAccId,
      amount: Number(amount),
      deviceHash,
      ip,
      isVpn: Boolean(isVpn),
      ipCountry,
    };

    const result = await session.run(cypher, params);

    if (result.records.length === 0) {
      return res.status(404).json({
        error: 'Sender or Receiver account not found, or not associated with a User.',
      });
    }

    const createdTx = recordToObject(result.records[0]);
    res.status(201).json({
      success: true,
      transaction: createdTx,
    });
  } catch (error) {
    console.error('Error creating simulated transaction:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

/**
 * 7) PATCH /api/users/:userId/blacklist — Investigator Blacklist Toggle
 * Body: { isBlacklisted: boolean }
 */
app.patch('/api/users/:userId/blacklist', async (req, res) => {
  const { userId } = req.params;
  const { isBlacklisted } = req.body;

  if (typeof isBlacklisted !== 'boolean') {
    return res.status(400).json({ error: 'Body must contain "isBlacklisted": boolean' });
  }

  const session = getSession();
  try {
    const cypher = `
      MATCH (u:User {userId: $userId})
      SET u.isBlacklisted = $isBlacklisted,
          u.riskScore = CASE WHEN $isBlacklisted = true THEN 100 ELSE 10 END
      RETURN u.userId AS userId,
             u.name AS name,
             u.isBlacklisted AS isBlacklisted,
             u.riskScore AS riskScore
    `;

    const result = await session.run(cypher, { userId, isBlacklisted });

    if (result.records.length === 0) {
      return res.status(404).json({ error: `User with userId ${userId} not found.` });
    }

    const user = recordToObject(result.records[0]);
    res.json(user);
  } catch (error) {
    console.error(`Error toggling blacklist for user ${userId}:`, error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

/**
 * Helper GET /api/users — All users & accounts for dropdowns & search
 */
app.get('/api/users', async (req, res) => {
  const session = getSession();
  try {
    const cypher = `
      MATCH (u:User)-[:OWNS]->(a:Account)
      RETURN u.userId AS userId,
             u.name AS name,
             u.email AS email,
             u.country AS country,
             u.isBlacklisted AS isBlacklisted,
             u.riskScore AS riskScore,
             a.accountId AS accountId,
             a.balance AS balance
      ORDER BY u.userId
    `;
    const result = await session.run(cypher);
    const users = result.records.map((r) => recordToObject(r));
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` FinFraud Backend API running on port ${PORT}`);
  console.log(` Connected to Neo4j AuraDB: ${process.env.NEO4J_URI}`);
  console.log(`===============================================`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down...');
  server.close();
  await driver.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nGracefully shutting down...');
  server.close();
  await driver.close();
  process.exit(0);
});
