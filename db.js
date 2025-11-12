const mysql = require("mysql2/promise");

// build config but don't force a database name so initial "CREATE DATABASE" can run
const config = {
  host: "localhost",
  user: "root",
  password: process.env.MYSQL_PASSWORD || "Varma@vedant",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

// only attach database if explicitly provided via env (avoid ER_BAD_DB_ERROR on connect)
if (process.env.MYSQL_DATABASE) {
  config.database = process.env.MYSQL_DATABASE;
}

// create an initial pool (may be created without a database)
let currentPool = mysql.createPool(config);

// helper to create a pool bound to a specific database (use after DB is created)
function createPoolWithDatabase(dbName) {
  const cfg = { ...config, database: dbName };
  return mysql.createPool(cfg);
}

// ensureDatabaseSelected: create a DB-bound pool and swap it in once the DB exists.
// This avoids "No database selected" when other modules call pool.query(...)
const defaultDbName = process.env.MYSQL_DATABASE || "waste_track";
let ensureDbPromise = null;
async function ensureDatabaseSelected() {
  if (config.database) return;
  if (ensureDbPromise) return ensureDbPromise;
  ensureDbPromise = (async () => {
    let newPool;
    try {
      // create a new pool with the database configured
      newPool = mysql.createPool({ ...config, database: defaultDbName });
      // test a simple query to ensure DB exists and connection works
      await newPool.query("SELECT 1");
      // swap pools: close the old one and replace currentPool
      try {
        await currentPool.end();
      } catch (e) {
        // ignore errors closing old pool
      }
      currentPool = newPool;
      config.database = defaultDbName;
      return;
    } catch (err) {
      // on failure, destroy the new pool if it was created
      if (newPool) {
        try { await newPool.end(); } catch (_) {}
      }
      ensureDbPromise = null;
      throw err;
    }
  })();
  return ensureDbPromise;
}

// Proxy the pool so existing code that expects pool.query(...) keeps working.
// Intercept query and execute to ensure a database-bound pool is used.
const wrappedPool = new Proxy({}, {
  get(_, prop) {
    // operations that should ensure DB selected first
    if (prop === "query" || prop === "execute") {
      return async function(sql, params) {
        await ensureDatabaseSelected();
        return currentPool[prop].call(currentPool, sql, params);
      };
    }
    // for other properties/methods delegate directly to currentPool
    const value = currentPool[prop];
    if (typeof value === "function") return value.bind(currentPool);
    return value;
  }
});

module.exports = wrappedPool;
module.exports.createPoolWithDatabase = createPoolWithDatabase;