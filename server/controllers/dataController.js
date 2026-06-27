// server/controllers/dataController.js
const pool = require("../config/db");

exports.getDepartments = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT dept_id, name, location FROM Department ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error("Get departments error:", err);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
};

exports.getRoutes = async (req, res) => {
  try {
    const deptId = req.query.dept_id;
    if (deptId) {
      const [rows] = await pool.query(
        `SELECT DISTINCT r.* FROM Route r
         JOIN Serves s ON r.route_id = s.route_id
         JOIN Vehicle v ON s.vehicle_id = v.vehicle_id
         WHERE v.dept_id = ? ORDER BY r.route_name`,
        [deptId]
      );
      return res.json(rows);
    }
    const [rows] = await pool.query("SELECT * FROM Route ORDER BY route_name");
    res.json(rows);
  } catch (err) {
    console.error("Get routes error:", err);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
};

exports.getRoutesByDept = async (req, res) => {
  try {
    const deptId = req.params.dept_id;
    const [rows] = await pool.query(
      `SELECT DISTINCT r.* FROM Route r
       JOIN Serves s ON r.route_id = s.route_id
       JOIN Vehicle v ON s.vehicle_id = v.vehicle_id
       WHERE v.dept_id = ? ORDER BY r.route_name`,
      [deptId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Get routes by dept error:", err);
    res.status(500).json({ error: "Failed to fetch routes for department" });
  }
};

exports.getVehicles = async (req, res) => {
  try {
    const { dept_id } = req.query;
    // Manager automatically limited to their own department
    const searchDept = dept_id || (req.session && req.session.role === "Manager" ? req.session.dept_id : null);
    
    let sql = "SELECT vehicle_id, vehicle_no, vehicle_type, status, dept_id FROM Vehicle";
    const params = [];
    if (searchDept) {
      sql += " WHERE dept_id = ?";
      params.push(searchDept);
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Get vehicles error:", err);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
};
