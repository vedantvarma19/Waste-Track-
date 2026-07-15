// migrate.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'eco_route_manager',
    port: process.env.MYSQL_PORT || 3306
  });

  try {
    console.log("Checking database columns for Complaints table...");
    const [columns] = await pool.query("SHOW COLUMNS FROM Complaints");
    const hasLatitude = columns.some(c => c.Field === 'latitude');
    
    if (!hasLatitude) {
      console.log("Adding 'latitude' and 'longitude' columns to Complaints table...");
      await pool.query("ALTER TABLE Complaints ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL");
      await pool.query("ALTER TABLE Complaints ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL");
      console.log("Columns added successfully!");
    } else {
      console.log("'latitude' and 'longitude' columns already exist in Complaints table.");
    }

    console.log("Updating database view 'v_employee_tasks'...");
    await pool.query(`
      CREATE OR REPLACE VIEW v_employee_tasks AS
      SELECT a.assign_id, a.emp_id, e.name AS employee_name, a.vehicle_id, v.vehicle_no,
             a.route_id, r.route_name, c.complaint_id, c.description, c.status,
             c.latitude, c.longitude,
             w.record_id, w.weight_kg, w.collection_date AS waste_recorded_at, d.name AS department_name
      FROM assigned_to a
      LEFT JOIN employee e ON a.emp_id = e.emp_id
      LEFT JOIN vehicle v ON a.vehicle_id = v.vehicle_id
      LEFT JOIN route r ON a.route_id = r.route_id
      LEFT JOIN complaints c ON a.complaint_id = c.complaint_id
      LEFT JOIN waste_record w ON w.route_id = a.route_id AND w.collection_date = a.assign_date
      LEFT JOIN department d ON e.dept_id = d.dept_id;
    `);
    console.log("View 'v_employee_tasks' updated successfully!");
    
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
}

run();
