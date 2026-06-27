// server/controllers/employeeController.js
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const SALT_ROUNDS = 10;

exports.register = async (req, res) => {
  try {
    let { name, phone, join_date, email, password, dept_id, role, emp_code } = req.body;

    if (!name || !email || !password || !dept_id) {
      return res.status(400).json({ error: "Name, email, password, and department are required" });
    }

    // Role-based constraints
    if (req.session && req.session.emp_id) {
      const callerRole = req.session.role;
      const callerDeptId = req.session.dept_id;

      if (callerRole === "Manager") {
        // Manager can only register employees in their own department
        dept_id = callerDeptId;
        role = "Employee";
      } else if (callerRole !== "Head" && callerRole !== "Admin") {
        return res.status(403).json({ error: "Not authorized to create employees" });
      }
    } else {
      // Public registration default
      if (!role) role = "Employee";
      // Restrict public registration from creating Admin/Head accounts
      if (role === "Admin" || role === "Head") {
        return res.status(403).json({ error: "Cannot register as Admin or Head publicly" });
      }
    }

    // Check email uniqueness
    const [[exists]] = await pool.query("SELECT emp_id FROM Employee WHERE email = ?", [email]);
    if (exists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      `INSERT INTO Employee (name, contact, join_date, email, password, dept_id, role, emp_code, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [name, phone || null, join_date || null, email, hash, dept_id, role, emp_code || null]
    );

    const empId = result.insertId;
    const [[employee]] = await pool.query(
      "SELECT emp_id, name, email, role, dept_id FROM Employee WHERE emp_id = ?",
      [empId]
    );

    // Auto-login if registration is public (guest visitor)
    if (!req.session || !req.session.emp_id) {
      req.session.emp_id = employee.emp_id;
      req.session.role = employee.role;
      req.session.dept_id = employee.dept_id;
      req.session.name = employee.name;
    }

    res.status(201).json(employee);
  } catch (err) {
    console.error("Register employee error:", err);
    res.status(500).json({ error: "Employee registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const identifier = req.body.username || req.body.email;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Employee ID/Email and password are required" });
    }

    let queryStr = "SELECT * FROM Employee WHERE email = ? OR emp_code = ?";
    const queryParams = [identifier, identifier];
    if (!isNaN(identifier)) {
      queryStr += " OR emp_id = ?";
      queryParams.push(Number(identifier));
    }

    const [rows] = await pool.query(queryStr, queryParams);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Establish session
    req.session.emp_id = user.emp_id;
    req.session.role = user.role;
    req.session.dept_id = user.dept_id;
    req.session.name = user.name;

    res.json({
      emp_id: user.emp_id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept_id: user.dept_id
    });
  } catch (err) {
    console.error("Login employee error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.logout = (req, res) => {
  if (!req.session) {
    return res.json({ message: "Already logged out" });
  }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logout successful" });
  });
};

exports.getMe = async (req, res) => {
  try {
    const [[user]] = await pool.query(
      "SELECT emp_id, name, email, role, dept_id, contact, join_date, emp_code FROM Employee WHERE emp_id = ?",
      [req.session.emp_id]
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
};

exports.listEmployees = async (req, res) => {
  try {
    const { q, dept_id, role } = req.query;
    const sessionRole = req.session.role;
    const sessionDeptId = req.session.dept_id;

    let sql = `SELECT e.emp_id, e.name, e.email, e.role, e.dept_id, e.contact, e.join_date, e.emp_code, d.name AS department_name 
               FROM Employee e 
               LEFT JOIN Department d ON e.dept_id = d.dept_id 
               WHERE 1=1 `;
    const params = [];

    // Role-based restrictions
    if (sessionRole === "Manager") {
      sql += " AND e.dept_id = ?";
      params.push(sessionDeptId);
    } else if (sessionRole !== "Head" && sessionRole !== "Admin") {
      return res.status(403).json({ error: "Not authorized to list employees" });
    } else {
      // Head/Admin can filter by department query param
      if (dept_id) {
        sql += " AND e.dept_id = ?";
        params.push(dept_id);
      }
    }

    if (q) {
      sql += " AND (e.name LIKE ? OR e.email LIKE ? OR e.emp_code LIKE ?)";
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    if (role) {
      sql += " AND e.role = ?";
      params.push(role);
    }

    sql += " ORDER BY e.emp_id DESC LIMIT 1000";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("List employees error:", err);
    res.status(500).json({ error: "Failed to fetch employees list" });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const empId = req.params.id;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    const allowed = ["Employee", "Manager", "Head", "Admin"];
    if (!allowed.includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    // Only Head and Admin can change roles
    if (req.session.role !== "Head" && req.session.role !== "Admin") {
      return res.status(403).json({ error: "Not authorized to change roles" });
    }

    await pool.query("UPDATE Employee SET role = ? WHERE emp_id = ?", [role, empId]);
    const [[employee]] = await pool.query(
      "SELECT emp_id, name, email, role, dept_id FROM Employee WHERE emp_id = ?",
      [empId]
    );
    res.json(employee);
  } catch (err) {
    console.error("Update employee role error:", err);
    res.status(500).json({ error: "Failed to update employee role" });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const empId = req.params.id;
    const sessionRole = req.session.role;
    const sessionDeptId = req.session.dept_id;

    // Head/Admin can delete anyone
    if (sessionRole !== "Head" && sessionRole !== "Admin" && sessionRole !== "Manager") {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Manager can only delete employee in their own department
    if (sessionRole === "Manager") {
      const [[targetEmp]] = await pool.query("SELECT dept_id FROM Employee WHERE emp_id = ?", [empId]);
      if (!targetEmp) {
        return res.status(404).json({ error: "Employee not found" });
      }
      if (targetEmp.dept_id !== sessionDeptId) {
        return res.status(403).json({ error: "Not authorized to delete employees from other departments" });
      }
    }

    await pool.query("DELETE FROM Employee WHERE emp_id = ?", [empId]);
    res.json({ ok: true, message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Delete employee error:", err);
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        error: "Cannot delete employee. They are referenced by complaints or other records."
      });
    }
    res.status(500).json({ error: "Delete failed" });
  }
};
