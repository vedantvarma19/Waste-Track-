// frontend/src/pages/ManagerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  fetchDepartments, 
  fetchRoutesByDept, 
  filterComplaints, 
  fetchEmployees, 
  fetchVehicles, 
  fetchViewData, 
  assignComplaint, 
  updateComplaintStatus, 
  deleteEmployee,
  registerEmployee
} from "../services/api";
import Toast from "../components/Toast";

const ManagerDashboard = () => {
  const { user } = useAuth();
  
  // Tab control: 'complaints' or 'employees'
  const [activeTab, setActiveTab] = useState("complaints");
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  // Data states
  const [complaints, setComplaints] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [summary, setSummary] = useState({ total_employees: 0, total_vehicles: 0 });
  
  // Loaders
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    route_id: "",
    status: ""
  });

  // Assign dropdown mapping state
  const [assignments, setAssignments] = useState({});

  // Employee Add form state
  const [newEmpForm, setNewEmpForm] = useState({
    name: "",
    phone: "",
    join_date: "",
    email: "",
    password: "",
    emp_code: ""
  });

  // Toast
  const [toast, setToast] = useState({ message: "", type: "success" });

  const loadInitialData = async () => {
    try {
      // 1. Fetch dropdown lists (locked on backend to manager's department)
      const empList = await fetchEmployees({ role: "Employee" });
      setEmployees(empList);

      const vehList = await fetchVehicles();
      setVehicles(vehList);

      const routeList = await fetchRoutesByDept(user.dept_id);
      setRoutes(routeList);

      // 2. Fetch summary card data
      const summaries = await fetchViewData("v_department_summary");
      const mySummary = summaries.find((d) => d.dept_id === user.dept_id);
      if (mySummary) {
        setSummary({
          total_employees: mySummary.total_employees,
          total_vehicles: mySummary.total_vehicles
        });
      }
    } catch (err) {
      console.error("Failed to load initial manager dropdowns", err);
    }
  };

  const loadComplaintsList = async (activeFilters = {}) => {
    setLoadingComplaints(true);
    try {
      const data = await filterComplaints({
        dept_id: user.dept_id,
        ...activeFilters
      });
      setComplaints(data);
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to load complaints.", type: "error" });
    } finally {
      setLoadingComplaints(false);
    }
  };

  const loadEmployeesList = async () => {
    setLoadingEmployees(true);
    try {
      const data = await fetchEmployees(); // locked to manager's dept on backend
      setEmployees(data);
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to load department employees.", type: "error" });
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadInitialData();
    loadComplaintsList();
    if (activeTab === "notifications") {
      loadNotificationsList();
    }

    const intervalId = setInterval(() => {
      loadComplaintsList();
      if (activeTab === "notifications") {
        loadNotificationsList();
      }
    }, 10000); // Polling every 10 seconds

    return () => clearInterval(intervalId);
  }, [user, activeTab]);

  const loadNotificationsList = async () => {
    setLoadingNotifications(true);
    try {
      const res = await axios.get("/api/notifications");
      setNotificationLogs(res.data || []);
    } catch (err) {
      console.error("Failed to load notifications", err);
      setToast({ message: "Failed to load notification logs", type: "error" });
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleCloseFromAlert = async (complaintId) => {
    if (!window.confirm(`Are you sure you want to CLOSE resolved Ticket #${complaintId}?`)) return;
    try {
      await axios.put(`/api/complaints/${complaintId}/status`, { status: "Closed" });
      setToast({ message: `Ticket #${complaintId} successfully closed!`, type: "success" });
      loadNotificationsList();
      loadComplaintsList();
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to close ticket";
      setToast({ message: errMsg, type: "error" });
    }
  };

  // Tab switcher loader
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "employees") {
      loadEmployeesList();
    } else if (tab === "notifications") {
      loadNotificationsList();
    } else {
      loadComplaintsList();
    }
  };

  // Filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    const activeParams = {};
    if (filters.route_id) activeParams.route_id = filters.route_id;
    if (filters.status) activeParams.status = filters.status;
    loadComplaintsList(activeParams);
  };

  const clearFilters = () => {
    setFilters({ route_id: "", status: "" });
    loadComplaintsList({});
  };

  // Assignment handlers
  const handleSelectAssignment = (complaintId, field, value) => {
    setAssignments((prev) => ({
      ...prev,
      [complaintId]: {
        ...prev[complaintId],
        [field]: value
      }
    }));
  };

  const handleReassign = async (complaintId) => {
    const assignData = assignments[complaintId];
    if (!assignData || !assignData.emp_id || !assignData.vehicle_id) {
      setToast({ message: "Please select BOTH an employee and vehicle", type: "error" });
      return;
    }

    try {
      await assignComplaint(complaintId, Number(assignData.emp_id), Number(assignData.vehicle_id));
      setToast({ message: "Task successfully assigned/reassigned!", type: "success" });
      loadComplaintsList();
    } catch (err) {
      const errMsg = err.response?.data?.error || "Reassign failed";
      setToast({ message: errMsg, type: "error" });
    }
  };

  const handleCloseComplaint = async (complaintId) => {
    if (!window.confirm("Are you sure you want to close this resolved task?")) return;
    try {
      await updateComplaintStatus(complaintId, "Closed");
      setToast({ message: "Task marked as Closed!", type: "success" });
      loadComplaintsList();
    } catch (err) {
      const errMsg = err.response?.data?.error || "Close failed";
      setToast({ message: errMsg, type: "error" });
    }
  };

  // Manage Employees: Add Employee handler
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerEmployee({
        ...newEmpForm,
        dept_id: user.dept_id, // locked to manager's dept
        role: "Employee" // locked to employee
      });
      setToast({ message: "Employee successfully added to department!", type: "success" });
      setNewEmpForm({
        name: "",
        phone: "",
        join_date: "",
        email: "",
        password: "",
        emp_code: ""
      });
      loadEmployeesList();
      loadInitialData(); // reload dropdown lists
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to create employee";
      setToast({ message: errMsg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Manage Employees: Delete Employee handler
  const handleDeleteEmployee = async (empId) => {
    if (empId === user.emp_id) {
      setToast({ message: "You cannot delete your own account!", type: "error" });
      return;
    }
    if (!window.confirm("Are you sure you want to delete this employee? This is irreversible.")) return;

    try {
      await deleteEmployee(empId);
      setToast({ message: "Employee removed from department.", type: "success" });
      loadEmployeesList();
      loadInitialData(); // reload dropdown lists
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to delete employee";
      setToast({ message: errMsg, type: "error" });
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2>Manager Dashboard</h2>
          <p style={{ color: "var(--text-muted)" }}>
            Review complaints, reassign drivers, and manage department staff.
          </p>
        </div>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.5rem 1rem", margin: 0 }}>
          <div style={{ fontSize: "0.85rem", textAlign: "right" }}>
            <span style={{ fontWeight: "700" }}>{user.name}</span>
            <div style={{ color: "var(--primary)", fontWeight: "600", fontSize: "0.75rem" }}>
              Manager — {routes[0]?.location || "Sanitation Dept"}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2" style={{ borderBottom: "2px solid var(--border)", marginBottom: "2rem", paddingBottom: "0.25rem" }}>
        <button 
          className={`btn ${activeTab === "complaints" ? "btn-secondary" : "btn-ghost"}`} 
          style={{ borderRadius: "var(--radius-sm) var(--radius-sm) 0 0", padding: "0.6rem 1.25rem" }}
          onClick={() => handleTabChange("complaints")}
        >
          📝 Department Complaints
        </button>
        <button 
          className={`btn ${activeTab === "employees" ? "btn-secondary" : "btn-ghost"}`} 
          style={{ borderRadius: "var(--radius-sm) var(--radius-sm) 0 0", padding: "0.6rem 1.25rem" }}
          onClick={() => handleTabChange("employees")}
        >
          👥 Manage Staff
        </button>
        <button 
          className={`btn ${activeTab === "notifications" ? "btn-secondary" : "btn-ghost"}`} 
          style={{ borderRadius: "var(--radius-sm) var(--radius-sm) 0 0", padding: "0.6rem 1.25rem" }}
          onClick={() => handleTabChange("notifications")}
        >
          🔔 Notification Logs
        </button>
      </div>

      {/* Tab Content 1: Complaints */}
      {activeTab === "complaints" && (
        <div className="grid-sidebar">
          {/* Complaints List */}
          <div className="card">
            <h3 style={{ fontSize: "1.25rem", borderBottom: "2px solid var(--primary)", paddingBottom: "0.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
              Pending Tasks
            </h3>

            {/* Complaints Filter */}
            <form onSubmit={applyFilters} className="flex align-center gap-2" style={{ padding: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
              <div className="form-group" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "700" }}>Route:</span>
                <select name="route_id" className="form-control" value={filters.route_id} onChange={handleFilterChange} style={{ padding: "0.4rem", width: "160px" }}>
                  <option value="">All Routes</option>
                  {routes.map((r) => (
                    <option key={r.route_id} value={r.route_id}>{r.route_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "700" }}>Status:</span>
                <select name="status" className="form-control" value={filters.status} onChange={handleFilterChange} style={{ padding: "0.4rem", width: "130px" }}>
                  <option value="">All</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="flex gap-1" style={{ marginLeft: "auto" }}>
                <button type="submit" className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>Apply</button>
                <button type="button" onClick={clearFilters} className="btn btn-ghost" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>Clear</button>
              </div>
            </form>

            {/* Table */}
            <div className="table-wrapper">
              {loadingComplaints ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <div className="skeleton" style={{ height: "45px", marginBottom: "0.5rem" }}></div>
                  <div className="skeleton" style={{ height: "45px" }}></div>
                </div>
              ) : complaints.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <div className="empty-state-title">No complaints found</div>
                  <p className="empty-state-desc">Try changing filter values or check back later.</p>
                </div>
              ) : (
                <table className="table" style={{ minWidth: "1240px" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "70px" }}>ID</th>
                      <th style={{ width: "150px" }}>Citizen</th>
                      <th style={{ width: "150px" }}>Location</th>
                      <th style={{ width: "320px" }}>Task Description</th>
                      <th style={{ width: "110px" }}>Status</th>
                      <th style={{ width: "120px" }}>Assignee</th>
                      <th style={{ width: "320px" }}>Action / Reassign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((c) => {
                      const isClosed = c.status === "Closed";
                      const isResolved = c.status === "Resolved";
                      const selectedAssignee = assignments[c.complaint_id]?.emp_id || "";
                      const selectedVehicle = assignments[c.complaint_id]?.vehicle_id || "";

                      return (
                        <tr key={c.complaint_id}>
                          <td><strong>#{c.complaint_id}</strong></td>
                          <td>
                            {c.citizen_name}
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.contact_no}</div>
                          </td>
                          <td>{c.route_name || c.location}</td>
                          <td style={{ fontSize: "0.85rem", wordBreak: "break-word" }}>
                            {c.description}
                          </td>
                          <td>
                            <span className={`badge badge-${(c.status || "unknown").toLowerCase().replace(/\s+/g, "")}`}>
                              {c.status}
                            </span>
                          </td>
                          <td>{c.assigned_employee || "Unassigned"}</td>
                          <td>
                            <div className="flex gap-1" style={{ alignItems: "center" }}>
                              <select 
                                className="form-control" 
                                style={{ padding: "0.4rem", fontSize: "0.8rem", width: "110px" }}
                                value={selectedAssignee}
                                onChange={(e) => handleSelectAssignment(c.complaint_id, "emp_id", e.target.value)}
                                disabled={isClosed}
                              >
                                <option value="">Driver</option>
                                {employees
                                  .filter(e => e.role === "Employee")
                                  .map(e => <option key={e.emp_id} value={e.emp_id}>{e.name}</option>)
                                }
                              </select>

                              <select 
                                className="form-control" 
                                style={{ padding: "0.4rem", fontSize: "0.8rem", width: "100px" }}
                                value={selectedVehicle}
                                onChange={(e) => handleSelectAssignment(c.complaint_id, "vehicle_id", e.target.value)}
                                disabled={isClosed}
                              >
                                <option value="">Vehicle</option>
                                {vehicles.map(v => <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_no}</option>)}
                              </select>

                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem" }}
                                onClick={() => handleReassign(c.complaint_id)}
                                disabled={isClosed}
                              >
                                Assign
                              </button>

                              <button 
                                className="btn btn-primary" 
                                style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem" }}
                                onClick={() => handleCloseComplaint(c.complaint_id)}
                                disabled={!isResolved}
                              >
                                Close
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Department Summary Sidebar */}
          <aside className="card">
            <h3 style={{ fontSize: "1.25rem", borderBottom: "2px solid var(--secondary)", paddingBottom: "0.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
              Zone Summary
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className="metric-card">
                <div className="metric-icon">👥</div>
                <div>
                  <div className="metric-value">{summary.total_employees}</div>
                  <div className="metric-label">Zone Employees</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">🚛</div>
                <div>
                  <div className="metric-value">{summary.total_vehicles}</div>
                  <div className="metric-label">Zone Vehicles</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Tab Content 2: Manage Staff */}
      {activeTab === "employees" && (
        <div className="grid-sidebar">
          {/* Employee list */}
          <div className="card">
            <h3 style={{ fontSize: "1.25rem", borderBottom: "2px solid var(--primary)", paddingBottom: "0.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
              Department Personnel
            </h3>

            <div className="table-wrapper">
              {loadingEmployees ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <div className="skeleton" style={{ height: "40px", marginBottom: "0.5rem" }}></div>
                  <div className="skeleton" style={{ height: "40px" }}></div>
                </div>
              ) : employees.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>No personnel found.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Contact</th>
                      <th style={{ width: "100px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((e) => (
                      <tr key={e.emp_id}>
                        <td><strong>#{e.emp_id}</strong></td>
                        <td>{e.name}</td>
                        <td>{e.email}</td>
                        <td>
                          <span className={`badge ${e.role === "Manager" ? "badge-inprogress" : "badge-resolved"}`} style={{ fontSize: "0.65rem" }}>
                            {e.role}
                          </span>
                        </td>
                        <td>{e.contact || "N/A"}</td>
                        <td>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                            onClick={() => handleDeleteEmployee(e.emp_id)}
                            disabled={e.emp_id === user.emp_id}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Add Employee Form Sidebar */}
          <aside className="card">
            <h3 style={{ fontSize: "1.25rem", borderBottom: "2px solid var(--secondary)", paddingBottom: "0.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
              Add Department Staff
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Create a new employee account. They will be locked to your department zone ({routes[0]?.location || "this zone"}).
            </p>

            <form onSubmit={handleAddEmployee} style={{ background: "transparent", padding: 0, boxShadow: "none", maxWidth: "100%" }}>
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newEmpForm.name}
                  onChange={(e) => setNewEmpForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>Contact Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newEmpForm.phone}
                  onChange={(e) => setNewEmpForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. 9880011111"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={newEmpForm.email}
                  onChange={(e) => setNewEmpForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={newEmpForm.password}
                  onChange={(e) => setNewEmpForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength="6"
                  disabled={submitting}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label>Employee Code</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newEmpForm.emp_code}
                  onChange={(e) => setNewEmpForm(prev => ({ ...prev, emp_code: e.target.value }))}
                  placeholder="e.g. EMP-1023"
                  disabled={submitting}
                />
              </div>

              <button type="submit" className="btn btn-secondary" style={{ width: "100%" }} disabled={submitting}>
                {submitting ? "Adding..." : "Add Employee"}
              </button>
            </form>
          </aside>
        </div>
      )}

      {activeTab === "notifications" && (() => {
        const adminAlerts = notificationLogs.filter(log => log.recipient_role === "Admin");
        const citizenLogs = notificationLogs.filter(log => log.recipient_role === "Citizen");

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Manager/Admin Alerts */}
            <div className="card">
              <h3 style={{ fontSize: "1.2rem", borderBottom: "2px solid var(--primary)", paddingBottom: "0.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
                🔔 System Alerts & Tasks Resolved
              </h3>
              {loadingNotifications ? (
                <div className="skeleton" style={{ height: "100px" }}></div>
              ) : adminAlerts.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontStyle: "italic", textAlign: "left" }}>
                  No administrative alerts logged yet. Alerts will appear here when drivers resolve assigned tasks.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "left" }}>
                  {adminAlerts.map(alert => (
                    <div key={alert.notification_id} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "1rem", 
                      padding: "0.75rem 1rem", 
                      background: "rgba(16, 185, 129, 0.05)", 
                      borderLeft: "4px solid var(--status-resolved)", 
                      borderRadius: "var(--radius-sm)" 
                    }}>
                      <span style={{ fontSize: "1.5rem" }}>✅</span>
                      <div style={{ flexGrow: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: "600", fontSize: "0.9rem", color: "var(--dark)" }}>{alert.message}</p>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            Ticket Reference: #{alert.complaint_id} | Timestamp: {new Date(alert.sent_at).toLocaleString()}
                          </span>
                        </div>
                        {alert.complaint_status === "Resolved" ? (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", borderRadius: "4px" }}
                            onClick={() => handleCloseFromAlert(alert.complaint_id)}
                          >
                            Close Ticket
                          </button>
                        ) : alert.complaint_status === "Closed" ? (
                          <span className="badge badge-resolved" style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem" }}>CLOSED</span>
                        ) : (
                          <span className="badge badge-inprogress" style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem" }}>{alert.complaint_status || "Open"}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Citizen Notification Logs */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid var(--secondary)", paddingBottom: "0.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", margin: 0, textAlign: "left" }}>
                  📲 Dispatched Citizen Notification Logs
                </h3>
                <button onClick={loadNotificationsList} className="btn btn-ghost" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                  🔄 Refresh Logs
                </button>
              </div>

              <div className="table-wrapper">
                {loadingNotifications ? (
                  <div style={{ padding: "2rem", textAlign: "center" }}>
                    <div className="skeleton" style={{ height: "45px", marginBottom: "0.5rem" }}></div>
                    <div className="skeleton" style={{ height: "45px" }}></div>
                  </div>
                ) : citizenLogs.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📲</div>
                    <div className="empty-state-title">No citizen dispatches logged</div>
                    <p className="empty-state-desc">Emails, SMS, and push messages dispatched to citizens will appear here.</p>
                  </div>
                ) : (
                  <table className="table" style={{ minWidth: "900px" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "70px" }}>ID</th>
                        <th style={{ width: "90px" }}>Ticket ID</th>
                        <th style={{ width: "130px" }}>Citizen</th>
                        <th style={{ width: "90px" }}>Channel</th>
                        <th>Message Details</th>
                        <th style={{ width: "150px" }}>Dispatched At</th>
                        <th style={{ width: "80px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citizenLogs.map((log) => (
                        <tr key={log.notification_id}>
                          <td>#{log.notification_id}</td>
                          <td><strong>#{log.complaint_id}</strong></td>
                          <td>
                            {log.citizen_name}
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.contact_no}</div>
                          </td>
                          <td>
                            <span className="badge" style={{ backgroundColor: log.channel === 'Email' ? '#3b82f6' : log.channel === 'SMS' ? '#10b981' : '#f59e0b', color: 'white' }}>
                              {log.channel}
                            </span>
                          </td>
                          <td style={{ fontSize: "0.85rem", textAlign: "left" }}>{log.message}</td>
                          <td style={{ fontSize: "0.8rem" }}>{new Date(log.sent_at).toLocaleString()}</td>
                          <td>
                            <span className="badge badge-resolved" style={{ textTransform: "uppercase", fontSize: "0.65rem" }}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="toast-container">
        {toast.message && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast({ message: "", type: "success" })} 
          />
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
