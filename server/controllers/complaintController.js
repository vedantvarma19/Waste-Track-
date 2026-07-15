// server/controllers/complaintController.js
const pool = require("../config/db");
const notifier = require("../utils/notifier");

function getCleanTokens(text) {
  if (!text) return new Set();
  const stopWords = new Set(["the", "a", "is", "of", "in", "on", "at", "to", "there", "litter", "trash", "waste", "garbage", "rubbish", "dump", "pile", "near", "opposite", "beside", "behind", "street", "road"]);
  const tokens = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  return new Set(tokens);
}

function computeSimilarity(text1, text2) {
  const tokens1 = getCleanTokens(text1);
  const tokens2 = getCleanTokens(text2);
  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) {
      intersection++;
    }
  }
  const union = tokens1.size + tokens2.size - intersection;
  return intersection / union;
}

exports.createComplaint = async (req, res) => {
  const { citizen_name, contact_no, location, description, route_id, dept_id, latitude, longitude } = req.body;
  
  if (!citizen_name || !contact_no || !description || !dept_id) {
    return res.status(400).json({ error: "Name, contact, description, and department are required" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Fetch active complaints in the same department/zone for AI duplicate check
    const [activeComplaints] = await connection.query(
      "SELECT complaint_id, description, location, contact_no FROM Complaints WHERE dept_id = ? AND status NOT IN ('Resolved', 'Closed')",
      [dept_id]
    );

    let duplicateOfId = null;
    for (const c of activeComplaints) {
      const descSimilarity = computeSimilarity(description, c.description);
      const locSimilarity = location && c.location ? computeSimilarity(location, c.location) : 0.5;
      
      const sameContact = contact_no.trim() === c.contact_no.trim();
      const combinedScore = (descSimilarity * 0.7) + (locSimilarity * 0.3);

      // If text is highly similar (>= 40% keyword match) OR same user reporting similar text (>= 25% match)
      if (combinedScore >= 0.40 || (sameContact && combinedScore >= 0.22)) {
        duplicateOfId = c.complaint_id;
        break;
      }
    }

    if (duplicateOfId !== null) {
      // It's a duplicate! Insert as 'Closed' and link duplicate_of_id (no employee assigned)
      const mergedDescription = `[AI DUPLICATE of #${duplicateOfId}] ${description}`;
      const [result] = await connection.query(
        `INSERT INTO Complaints (citizen_name, contact_no, location, description, route_id, dept_id, assigned_emp, status, duplicate_of_id, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, NULL, 'Closed', ?, ?, ?)`,
        [citizen_name, contact_no, location || "N/A", mergedDescription, route_id || null, dept_id, duplicateOfId, latitude || null, longitude || null]
      );

      await connection.commit();
      notifier.sendCitizenNotification(result.insertId, "Duplicate", { parent_id: duplicateOfId });
      return res.status(201).json({ 
        message: `Complaint submitted successfully. Our AI detected this as a duplicate of active ticket #${duplicateOfId} and has merged it to prevent redundant collection runs.`, 
        complaint_id: result.insertId,
        merged: true,
        parent_id: duplicateOfId
      });
    }

    // Find the employee in the department with the fewest active tasks
    const [employees] = await connection.query(
      `SELECT e.emp_id, COUNT(c.complaint_id) AS task_count
       FROM Employee e
       LEFT JOIN Complaints c ON e.emp_id = c.assigned_emp AND c.status IN ('Open','In Progress')
       WHERE e.dept_id = ? AND e.role = 'Employee'
       GROUP BY e.emp_id
       ORDER BY task_count ASC
       LIMIT 1`,
      [dept_id]
    );

    if (employees.length === 0) {
      await connection.rollback();
      return res.status(500).json({ error: "No active employees are currently available in that department" });
    }
    const bestEmployeeId = employees[0].emp_id;

    const [result] = await connection.query(
      `INSERT INTO Complaints (citizen_name, contact_no, location, description, route_id, dept_id, assigned_emp, status, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'In Progress', ?, ?)`,
      [citizen_name, contact_no, location || "N/A", description, route_id || null, dept_id, bestEmployeeId, latitude || null, longitude || null]
    );

    await connection.commit();

    // Trigger creation and initial auto-assignment notifications
    notifier.sendCitizenNotification(result.insertId, "Created");
    const [empRows] = await pool.query("SELECT name, contact FROM Employee WHERE emp_id = ?", [bestEmployeeId]);
    if (empRows.length > 0) {
      notifier.sendCitizenNotification(result.insertId, "Assigned", { 
        employee_name: empRows[0].name,
        employee_phone: empRows[0].contact
      });
    }

    res.status(201).json({ message: "Complaint submitted successfully", complaint_id: result.insertId });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Create complaint error:", err);
    res.status(500).json({ error: "Failed to submit complaint" });
  } finally {
    if (connection) connection.release();
  }
};

exports.listComplaints = async (req, res) => {
  try {
    let sql = `SELECT c.*, r.route_name, d.name AS department_name, e.name AS employee_name
               FROM Complaints c
               LEFT JOIN Route r ON c.route_id = r.route_id
               LEFT JOIN Department d ON c.dept_id = d.dept_id
               LEFT JOIN Employee e ON c.assigned_emp = e.emp_id`;
    const params = [];

    // Filter by role/session
    if (req.session && req.session.emp_id) {
      const { role, dept_id, emp_id } = req.session;
      if (role === "Manager") {
        sql += " WHERE c.dept_id = ?";
        params.push(dept_id);
      } else if (role === "Employee") {
        sql += " WHERE c.assigned_emp = ?";
        params.push(emp_id);
      }
    } else {
      // Citizen search filters
      const { contact_no, complaint_id } = req.query;
      if (contact_no) {
        sql += " WHERE c.contact_no = ?";
        params.push(contact_no);
      } else if (complaint_id) {
        sql += " WHERE c.complaint_id = ?";
        params.push(complaint_id);
      }
    }

    sql += " ORDER BY c.complaint_id DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("List complaints error:", err);
    res.status(500).json({ error: "Failed to load complaints" });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  // Authorization checks
  const role = req.session.role;
  const empId = req.session.emp_id;

  if (status === "Closed" && role !== "Manager" && role !== "Head" && role !== "Admin") {
    return res.status(403).json({ error: "Only managers/admin can close complaints" });
  }

  try {
    // If employee, verify they are assigned to this complaint
    if (role === "Employee") {
      const [[complaint]] = await pool.query("SELECT assigned_emp FROM Complaints WHERE complaint_id = ?", [id]);
      if (!complaint || complaint.assigned_emp !== empId) {
        return res.status(403).json({ error: "Not authorized to update status of complaints not assigned to you" });
      }
    }

    await pool.query("UPDATE Complaints SET status = ? WHERE complaint_id = ?", [status, id]);
    res.json({ message: "Complaint status updated successfully" });

    // Trigger status change notifications
    if (status === "Resolved" || status === "Closed") {
      let employee_name = "Staff";
      let employee_phone = "N/A";
      let employee_id = "N/A";
      try {
        const [rows] = await pool.query("SELECT assigned_emp FROM Complaints WHERE complaint_id = ?", [id]);
        if (rows && rows.length > 0) {
          const assignedEmpId = rows[0].assigned_emp;
          if (assignedEmpId) {
            const [eRows] = await pool.query("SELECT emp_id, name, contact FROM Employee WHERE emp_id = ?", [assignedEmpId]);
            if (eRows && eRows.length > 0) {
              employee_name = eRows[0].name;
              employee_phone = eRows[0].contact || "N/A";
              employee_id = eRows[0].emp_id;
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch resolver details:", e);
      }

      notifier.sendCitizenNotification(id, status, { 
        employee_id, 
        employee_name, 
        employee_phone 
      });

      if (status === "Resolved") {
        notifier.sendAdminNotification(id, `🔔 [ALERT] Driver ${employee_name} has resolved Complaint #${id}.`);
      }
    }
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Failed to update complaint status" });
  }
};

exports.assignComplaint = async (req, res) => {
  const { id } = req.params;
  const { emp_id, vehicle_id } = req.body;

  if (!emp_id || !vehicle_id) {
    return res.status(400).json({ error: "Employee ID and Vehicle ID are required" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Fetch the route_id from the complaint
    const [complaints] = await connection.query("SELECT route_id, dept_id FROM Complaints WHERE complaint_id = ?", [id]);
    if (complaints.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Complaint not found" });
    }
    const { route_id, dept_id } = complaints[0];

    // Enforce manager constraints (can only assign inside their department)
    if (req.session.role === "Manager" && dept_id !== req.session.dept_id) {
      await connection.rollback();
      return res.status(403).json({ error: "Not authorized to re-assign complaints from other departments" });
    }

    // 1. Update the complaint assignment and set status to In Progress
    await connection.query(
      "UPDATE Complaints SET assigned_emp = ?, status = 'In Progress' WHERE complaint_id = ?",
      [emp_id, id]
    );

    // 2. Log in Assigned_To table
    await connection.query(
      "INSERT INTO Assigned_To (emp_id, vehicle_id, route_id, complaint_id, assign_date) VALUES (?, ?, ?, ?, ?)",
      [emp_id, vehicle_id, route_id, id, new Date()]
    );

    await connection.commit();
    res.json({ message: "Re-assigned and logged successfully" });

    // Dispatch re-assignment notifications
    try {
      const [[empRows]] = await pool.query("SELECT name, contact FROM Employee WHERE emp_id = ?", [emp_id]);
      const [[vehRows]] = await pool.query("SELECT vehicle_no FROM Vehicle WHERE vehicle_id = ?", [vehicle_id]);
      const [[compRows]] = await pool.query("SELECT location FROM Complaints WHERE complaint_id = ?", [id]);

      const employee_name = empRows ? empRows.name : "Staff";
      const employee_phone = empRows ? empRows.contact : "N/A";
      const vehicle_no = vehRows ? vehRows.vehicle_no : "Truck";
      const location = compRows ? compRows.location : "N/A";

      notifier.sendCitizenNotification(id, "Assigned", { 
        employee_name,
        employee_phone
      });
      notifier.sendCitizenNotification(id, "Dispatched", { vehicle_no });

      // Dispatch real-time Alert to Admin Alert Feed
      notifier.sendAdminNotification(
        id,
        `🔔 [ALERT] Driver ${employee_name} has been dispatched to location ${location} (Vehicle: ${vehicle_no}).`
      );
    } catch (notifyErr) {
      console.error("Failed to send assignment notifications:", notifyErr);
    }
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Assign complaint error:", err);
    res.status(500).json({ error: "Re-assign task failed" });
  } finally {
    if (connection) connection.release();
  }
};
