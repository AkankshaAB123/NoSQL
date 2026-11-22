const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI || 'neo4j+s://08891cc5.databases.neo4j.io';
const user = process.env.NEO4J_USER || '08891cc5';
const password = process.env.NEO4J_PASSWORD || 'SWpV0WUBFpLVcIVQfnlsquhQ3uv9GCLhRVo54b3DfYY';
const database = process.env.NEO4J_DATABASE || '08891cc5';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
  maxConnectionPoolSize: 50,
  connectionTimeout: 30000,
});

/**
 * Returns a new Neo4j session targeting the configured database
 */
function getSession(mode = neo4j.session.WRITE) {
  return driver.session({
    database,
    defaultAccessMode: mode,
  });
}

/**
 * Deep serializer for Neo4j values to plain JSON types
 */
function serializeNeo4jValue(val) {
  if (val === null || val === undefined) {
    return val;
  }

  // Handle Neo4j Integer (neo4j.int)
  if (neo4j.isInt(val)) {
    return val.toNumber();
  }

  // Handle Date / DateTime / Time / Duration objects from Neo4j
  if (
    neo4j.isDateTime(val) ||
    neo4j.isDate(val) ||
    neo4j.isLocalDateTime(val) ||
    neo4j.isTime(val) ||
    neo4j.isLocalTime(val) ||
    neo4j.isDuration(val)
  ) {
    return val.toString();
  }

  // Handle Neo4j Node
  if (val instanceof neo4j.types.Node) {
    const props = serializeNeo4jValue(val.properties);
    return {
      _elementId: val.elementId,
      _labels: val.labels,
      ...props,
    };
  }

  // Handle Neo4j Relationship
  if (val instanceof neo4j.types.Relationship) {
    const props = serializeNeo4jValue(val.properties);
    return {
      _elementId: val.elementId,
      _type: val.type,
      _startNodeElementId: val.startNodeElementId,
      _endNodeElementId: val.endNodeElementId,
      ...props,
    };
  }

  // Handle Neo4j Path
  if (val instanceof neo4j.types.Path) {
    return {
      start: serializeNeo4jValue(val.start),
      end: serializeNeo4jValue(val.end),
      segments: val.segments.map((seg) => ({
        start: serializeNeo4jValue(seg.start),
        relationship: serializeNeo4jValue(seg.relationship),
        end: serializeNeo4jValue(seg.end),
      })),
      length: val.length,
    };
  }

  // Arrays
  if (Array.isArray(val)) {
    return val.map((item) => serializeNeo4jValue(item));
  }

  // Plain objects
  if (typeof val === 'object') {
    const res = {};
    for (const key of Object.keys(val)) {
      res[key] = serializeNeo4jValue(val[key]);
    }
    return res;
  }

  return val;
}

/**
 * Convert a Neo4j Record to a clean JavaScript object
 */
function recordToObject(record) {
  const obj = {};
  record.keys.forEach((key) => {
    obj[key] = serializeNeo4jValue(record.get(key));
  });
  return obj;
}

module.exports = {
  driver,
  getSession,
  serializeNeo4jValue,
  recordToObject,
  neo4j,
};
