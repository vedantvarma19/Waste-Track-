const mysql = require("mysql2/promise");

const config = {
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "Varma@vedant",
  port: Number(process.env.MYSQL_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

if (process.env.MYSQL_DATABASE) {
  config.database = process.env.MYSQL_DATABASE;
}

let currentPool = mysql.createPool(config);
const defaultDbName = process.env.MYSQL_DATABASE || "defaultdb";
let ensureDbPromise = null;

async function ensureDatabaseSelected() {
  if (config.database) return;
  if (ensureDbPromise) return ensureDbPromise;
  
  ensureDbPromise = (async () => {
    let newPool;
    try {
      newPool = mysql.createPool({ ...config, database: defaultDbName });
      await newPool.query("SELECT 1");
      try {
        await currentPool.end();
      } catch (e) {
        // Ignore closing old pool errors
      }
      currentPool = newPool;
      config.database = defaultDbName;
    } catch (err) {
      if (newPool) {
        try { await newPool.end(); } catch (_) {}
      }
      ensureDbPromise = null;
      throw err;
    }
  })();
  return ensureDbPromise;
}

const pool = new Proxy({}, {
  get(_, prop) {
    if (prop === "query" || prop === "execute" || prop === "getConnection") {
      return async function(...args) {
        await ensureDatabaseSelected();
        return currentPool[prop].apply(currentPool, args);
      };
    }
    const value = currentPool[prop];
    if (typeof value === "function") return value.bind(currentPool);
    return value;
  }
});

module.exports = pool;
