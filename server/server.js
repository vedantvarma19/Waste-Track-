// server/server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const fs = require("fs").promises;
const pool = require("./config/db");

// Import Routers
const employeeRoutes = require("./routes/employeeRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const dataRoutes = require("./routes/dataRoutes");
const wasteRoutes = require("./routes/wasteRoutes");
const viewRoutes = require("./routes/viewRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "wastetrack-secure-session-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if running on HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  })
);

// Mount API routes under /api
app.use("/api/employees", employeeRoutes);
app.use("/api", complaintRoutes);
app.use("/api", dataRoutes);
app.use("/api", wasteRoutes);
app.use("/api", viewRoutes);

// Database Initialization Function
async function initializeDatabase() {
  try {
    console.log("Initializing MySQL Database...");

    // Auto-migration: Ensure latitude and longitude columns exist on Complaints table
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM Complaints");
      const hasLatitude = columns.some(col => col.Field === 'latitude');
      if (!hasLatitude) {
        console.log("🛠️ Running database migration: Adding latitude/longitude to Complaints...");
        await pool.query("ALTER TABLE Complaints ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL");
        await pool.query("ALTER TABLE Complaints ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL");
        console.log("✅ Database migration complete.");
      }
    } catch (migErr) {
      console.log("ℹ️ Complaints table does not exist yet. It will be created by the setup script.");
    }

    // Read the database schema setup script from root folder
    const sqlFilePath = path.join(process.cwd(), "database_setup.sql");
    const sqlScript = await fs.readFile(sqlFilePath, "utf-8");

    // Execute setup script
    await pool.query(sqlScript);
    console.log("Database schema setup complete and test data seeded.");
  } catch (error) {
    console.error("--------------------------------------------------");
    console.error("⛔️ ERROR INITIALIZING DATABASE SCHEMA:");
    console.error(error);
    console.error("--------------------------------------------------");
  }
}

// Serve production frontend assets if they exist
const distPath = path.join(process.cwd(), "frontend", "dist");
app.use(express.static(distPath));

// SPA fallback for frontend routes in production & 404 handler for API
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      res.status(404).send("Frontend build not found. Run 'npm run build' inside frontend directory first.");
    }
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("Unhandle server error:", err);
  res.status(500).json({ error: "An unexpected error occurred on the server" });
});

async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 WasteTrack Server running on Port ${PORT}`);
    console.log(`📂 Serving static frontend from: ${distPath}`);
    console.log(`==================================================`);
  });
}

module.exports = {
  startServer
};
