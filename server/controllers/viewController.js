// server/controllers/viewController.js
const pool = require("../config/db");

const ALLOWED_VIEWS = new Set([
  "v_pending_complaints",
  "v_vehicle_usage",
  "v_department_summary",
  "v_waste_collection_stats",
  "v_employee_performance",
  "v_employee_tasks"
]);

exports.getViewByName = async (req, res) => {
  const view = req.params.viewname;
  if (!ALLOWED_VIEWS.has(view)) {
    return res.status(400).json({ error: "Access to this view is not allowed" });
  }

  try {
    const [rows] = await pool.query(`SELECT * FROM ${view} LIMIT 1000`);
    res.json(rows);
  } catch (err) {
    console.error(`Error fetching view ${view}:`, err);
    res.status(500).json({ error: "Failed to load view data" });
  }
};

exports.getStatsOverview = async (req, res) => {
  try {
    const [[pendingCount]] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM Complaints WHERE status IN ('Open','In Progress', 'Pending')"
    );
    const [[resolvedCount]] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM Complaints WHERE status IN ('Resolved','Closed')"
    );
    const [vehicleUsage] = await pool.query(
      "SELECT vehicle_no, total_assignments FROM v_vehicle_usage ORDER BY total_assignments DESC LIMIT 10"
    );

    res.json({
      pending: pendingCount.cnt,
      resolved: resolvedCount.cnt,
      vehicleUsage
    });
  } catch (err) {
    console.error("Get stats overview error:", err);
    res.status(500).json({ error: "Failed to fetch stats overview" });
  }
};

// Filter complaints by dept, route, status, date
exports.filterComplaints = async (req, res) => {
  const { dept_id, route_id, status, date } = req.query;

  let sql = `
    SELECT 
      c.complaint_id, c.citizen_name, c.contact_no, c.status, c.location, c.description, c.complaint_date,
      d.name AS department_name, 
      r.route_name, 
      e.name AS assigned_employee,
      c.assigned_emp 
    FROM Complaints c
    LEFT JOIN Department d ON c.dept_id = d.dept_id
    LEFT JOIN Route r ON c.route_id = r.route_id
    LEFT JOIN Employee e ON c.assigned_emp = e.emp_id
    WHERE 1=1
  `;
  const params = [];

  // Security check: if Manager, force their own department filter
  if (req.session && req.session.role === "Manager") {
    sql += " AND c.dept_id = ?";
    params.push(req.session.dept_id);
  } else if (dept_id) {
    sql += " AND c.dept_id = ?";
    params.push(dept_id);
  }

  if (route_id) {
    sql += " AND c.route_id = ?";
    params.push(route_id);
  }

  if (status) {
    sql += " AND c.status = ?";
    params.push(status);
  }

  if (date) {
    sql += " AND DATE(c.complaint_date) = ?";
    params.push(date);
  }

  sql += " ORDER BY c.complaint_id DESC LIMIT 500";

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Filter complaints error:", err);
    res.status(500).json({ error: "Failed to load filtered complaints" });
  }
};

exports.getAdvancedStats = async (req, res) => {
  try {
    // 1. Waste Type Breakdown
    const [wasteBreakdown] = await pool.query(
      `SELECT COALESCE(waste_type, 'Mixed') AS waste_type, SUM(weight_kg) AS total_weight 
       FROM Waste_Record 
       GROUP BY waste_type`
    );

    // 2. Timeline of registrations and resolutions
    const [timeline] = await pool.query(
      `SELECT DATE_FORMAT(complaint_date, '%Y-%m-%d') AS date, 
              COUNT(*) AS registered,
              SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS resolved
       FROM Complaints 
       GROUP BY DATE_FORMAT(complaint_date, '%Y-%m-%d') 
       ORDER BY DATE_FORMAT(complaint_date, '%Y-%m-%d') ASC 
       LIMIT 365`
    );

    // 3. Zone Performance comparison
    const [zonePerformance] = await pool.query(
      `SELECT d.name AS zone_name, 
              COUNT(c.complaint_id) AS registered,
              SUM(CASE WHEN c.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS resolved
       FROM Department d
       LEFT JOIN Complaints c ON d.dept_id = c.dept_id
       GROUP BY d.dept_id, d.name`
    );

    res.json({
      wasteBreakdown,
      timeline,
      zonePerformance
    });
  } catch (err) {
    console.error("Get advanced stats error:", err);
    res.status(500).json({ error: "Failed to fetch advanced analytics data" });
  }
};

exports.getNotificationLogs = async (req, res) => {
  try {
    // Clean up/purge notification logs older than 7 days (1 week)
    await pool.query(
      "DELETE FROM Notification_Log WHERE sent_at < NOW() - INTERVAL 7 DAY"
    );

    const [rows] = await pool.query(
      `SELECT n.*, c.status AS complaint_status 
       FROM Notification_Log n
       LEFT JOIN Complaints c ON n.complaint_id = c.complaint_id
       ORDER BY n.notification_id DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Failed to load notification logs" });
  }
};
