// frontend/src/pages/HeadDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  fetchDepartments, 
  fetchEmployees, 
  updateEmployeeRole, 
  deleteEmployee 
} from "../services/api";
import Toast from "../components/Toast";

const HeadDashboard = () => {
  const { user } = useAuth();
  
  // Data states
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchVal, setSearchVal] = useState("");
  const [selectedDept, setSelectedDept] = useState("");

  // Toast
  const [toast, setToast] = useState({ message: "", type: "success" });

  const loadInitialData = async () => {
    try {
      const depts = await fetchDepartments();
      setDepartments(depts);
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  };

  const loadEmployeesList = async (activeFilters = {}) => {
    setLoading(true);
    try {
      const data = await fetchEmployees(activeFilters);
      setEmployees(data);
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to load employees.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    loadEmployeesList();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchVal(val);
    triggerFilter(val, selectedDept);
  };

  const handleDeptFilterChange = (e) => {
    const val = e.target.value;
    setSelectedDept(val);
    triggerFilter(searchVal, val);
  };

  const triggerFilter = (search, dept) => {
    const activeParams = {};
    if (search.trim()) activeParams.q = search.trim();
    if (dept) activeParams.dept_id = dept;
    loadEmployeesList(activeParams);
  };

  const handleSaveRole = async (empId, newRole) => {
    if (empId === user.emp_id) {
      setToast({ message: "You cannot change your own role!", type: "error" });
      return;
    }
    if (!window.confirm(`Change this employee's role to ${newRole}?`)) return;

    try {
      await updateEmployeeRole(empId, newRole);
      setToast({ message: "Employee role updated successfully!", type: "success" });
      loadEmployeesList({ q: searchVal, dept_id: selectedDept });
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to update role";
      setToast({ message: errMsg, type: "error" });
    }
  };

  const handleDeleteEmployee = async (empId) => {
    if (empId === user.emp_id) {
      setToast({ message: "You cannot delete your own account!", type: "error" });
      return;
    }
    if (!window.confirm("Are you sure you want to delete this employee? This is irreversible.")) return;

    try {
      await deleteEmployee(empId);
      setToast({ message: "Employee account successfully deleted.", type: "success" });
      loadEmployeesList({ q: searchVal, dept_id: selectedDept });
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to delete employee";
      setToast({ message: errMsg, type: "error" });
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2>Head Administrator Dashboard</h2>
          <p style={{ color: "var(--text-muted)" }}>Search all employee profiles, update personnel roles, or remove accounts.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontWeight: "700", color: "var(--dark)" }}>{user.name}</span>
          <div className="badge badge-pending" style={{ display: "block", fontSize: "0.7rem", marginTop: "4px" }}>
            {user.role} (Admin)
          </div>
        </div>
      </div>

      {/* Filters controls bar */}
      <div className="card flex align-center gap-3" style={{ padding: "1.25rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div className="form-group" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", flexGrow: 1 }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "700" }}>Search:</span>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by name, email, code"
            value={searchVal}
            onChange={handleSearchChange}
            style={{ padding: "0.5rem", maxWidth: "300px" }}
          />
        </div>

        <div className="form-group" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "700" }}>Department:</span>
          <select 
            className="form-control" 
            value={selectedDept}
            onChange={handleDeptFilterChange}
            style={{ padding: "0.5rem", width: "200px" }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.dept_id} value={d.dept_id}>{d.name}</option>
            ))}
          </select>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={() => triggerFilter(searchVal, selectedDept)}
          style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
        >
          Refresh List
        </button>
      </div>

      {/* Staff Table */}
      <div className="card">
        <h3 style={{ fontSize: "1.25rem", borderBottom: "2px solid var(--primary)", paddingBottom: "0.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
          Staff Directory
        </h3>

        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <div className="skeleton" style={{ height: "45px", marginBottom: "0.5rem" }}></div>
              <div className="skeleton" style={{ height: "45px" }}></div>
            </div>
          ) : employees.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No Personnel Found</div>
              <p className="empty-state-desc">No employee profiles matched your filter parameters.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th style={{ width: "160px" }}>Role</th>
                  <th style={{ width: "160px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const isSelf = e.emp_id === user.emp_id;
                  return (
                    <tr key={e.emp_id}>
                      <td><strong>#{e.emp_id}</strong></td>
                      <td>
                        {e.name}
                        {e.emp_code && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Code: {e.emp_code}</div>}
                      </td>
                      <td>{e.email}</td>
                      <td>{e.department_name || "N/A"}</td>
                      <td>
                        <select 
                          className="form-control" 
                          style={{ padding: "0.4rem 0.5rem", fontSize: "0.85rem" }}
                          defaultValue={e.role}
                          onChange={(ev) => handleSaveRole(e.emp_id, ev.target.value)}
                          disabled={isSelf}
                        >
                          <option value="Employee">Employee</option>
                          <option value="Manager">Manager</option>
                          <option value="Head">Head</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                            onClick={() => handleDeleteEmployee(e.emp_id)}
                            disabled={isSelf}
                          >
                            Delete
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

export default HeadDashboard;
