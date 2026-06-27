// frontend/src/pages/EmployeeDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchViewData, updateComplaintStatus, submitWasteRecord } from "../services/api";
import Toast from "../components/Toast";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Waste Form State
  const [wasteForm, setWasteForm] = useState({
    route_id: "",
    waste_type: "",
    weight_kg: ""
  });
  const [recording, setRecording] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchViewData("v_employee_tasks");
      // Filter for this specific driver/employee
      const myTasks = data.filter((t) => t.emp_id === user.emp_id);
      
      // Deduplicate by complaint_id to avoid multiples due to multiple assignments/waste logs
      const uniqueMap = new Map();
      myTasks.forEach((t) => {
        if (t.complaint_id) {
          if (!uniqueMap.has(t.complaint_id) || (t.status !== "Resolved" && t.status !== "Closed")) {
            uniqueMap.set(t.complaint_id, t);
          }
        }
      });
      setTasks(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to load assigned tasks.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  const handleResolve = async (complaintId) => {
    if (!window.confirm("Mark this task as Resolved?")) return;
    try {
      await updateComplaintStatus(complaintId, "Resolved");
      setToast({ message: "Task marked as Resolved!", type: "success" });
      loadTasks();
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to update status";
      setToast({ message: errMsg, type: "error" });
    }
  };

  const handleWasteChange = (e) => {
    const { name, value } = e.target;
    if (name === "route_select") {
      if (value) {
        const [rId, aId] = value.split("|");
        setWasteForm((prev) => ({ ...prev, route_id: rId, assign_id: aId }));
      } else {
        setWasteForm((prev) => ({ ...prev, route_id: "", assign_id: "" }));
      }
    } else {
      setWasteForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleWasteSubmit = async (e) => {
    e.preventDefault();
    if (!wasteForm.route_id) {
      setToast({ message: "Please select an assigned route", type: "error" });
      return;
    }
    setRecording(true);
    try {
      await submitWasteRecord({
        route_id: Number(wasteForm.route_id),
        assign_id: wasteForm.assign_id ? Number(wasteForm.assign_id) : null,
        waste_type: wasteForm.waste_type || null,
        weight_kg: Number(wasteForm.weight_kg)
      });
      setToast({ message: "Waste record logged successfully!", type: "success" });
      setWasteForm({ route_id: "", assign_id: "", waste_type: "", weight_kg: "" });
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to record waste";
      setToast({ message: errMsg, type: "error" });
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2>Employee Dashboard</h2>
          <p style={{ color: "var(--text-muted)" }}>Manage your assigned collection routes and log waste deposits.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontWeight: "700", color: "var(--dark)" }}>{user.name}</span>
          <div className="badge badge-inprogress" style={{ display: "block", fontSize: "0.7rem", marginTop: "4px" }}>
            {user.role}
          </div>
        </div>
      </div>

      <div className="grid-sidebar" style={{ alignItems: "start" }}>
        {/* Tasks List Table */}
        <div className="card">
          <h3 style={{ fontSize: "1.25rem", borderBottom: "2px solid var(--primary)", paddingBottom: "0.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
            Your Assigned Tasks
          </h3>

          <div className="table-wrapper">
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <div className="skeleton" style={{ height: "45px", marginBottom: "0.5rem" }}></div>
                <div className="skeleton" style={{ height: "45px" }}></div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No Active Assignments</div>
                <p className="empty-state-desc">You are all caught up! Check back later for new tasks from your manager.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "90px" }}>Comp. ID</th>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Description</th>
                    <th style={{ width: "120px" }}>Status</th>
                    <th style={{ width: "120px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const isCompleted = t.status === "Resolved" || t.status === "Closed";
                    return (
                      <tr key={t.complaint_id}>
                        <td><strong>#{t.complaint_id}</strong></td>
                        <td>
                          {t.route_name || "General"}
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Route ID: {t.route_id || "N/A"}</div>
                        </td>
                        <td>{t.vehicle_no || "N/A"}</td>
                        <td>{t.description || "General collection task"}</td>
                        <td>
                          <span className={`badge badge-${(t.status || "unknown").toLowerCase().replace(/\s+/g, "")}`}>
                            {t.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                            onClick={() => handleResolve(t.complaint_id)}
                            disabled={isCompleted}
                          >
                            Resolve
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Record Waste Side Card */}
        <aside className="card">
          <h3 style={{ fontSize: "1.25rem", borderBottom: "2px solid var(--secondary)", paddingBottom: "0.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
            Record Waste Collected
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
            Log total deposits of gathered garbage by Route ID after processing collection tasks.
          </p>

          <form onSubmit={handleWasteSubmit} style={{ background: "transparent", padding: 0, boxShadow: "none", maxWidth: "100%" }}>
            <div className="form-group">
              <label>Assigned Route</label>
              <select
                name="route_select"
                className="form-control"
                value={wasteForm.route_id ? `${wasteForm.route_id}|${wasteForm.assign_id || ""}` : ""}
                onChange={handleWasteChange}
                required
                disabled={recording}
              >
                <option value="">-- Select Assigned Route --</option>
                {tasks.map((t) => (
                  <option key={t.assign_id || t.route_id} value={`${t.route_id}|${t.assign_id || ""}`}>
                    {t.route_name || `Route #${t.route_id}`} (ID: {t.route_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Waste Type</label>
              <input 
                type="text" 
                name="waste_type" 
                className="form-control" 
                value={wasteForm.waste_type} 
                onChange={handleWasteChange} 
                placeholder="e.g. Mixed Waste, Recyclable"
                disabled={recording}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label>Weight (kg)</label>
              <input 
                type="number" 
                step="0.01"
                name="weight_kg" 
                className="form-control" 
                value={wasteForm.weight_kg} 
                onChange={handleWasteChange} 
                placeholder="e.g. 250.5"
                required 
                disabled={recording}
              />
            </div>

            <button type="submit" className="btn btn-secondary" style={{ width: "100%" }} disabled={recording}>
              {recording ? "Saving Record..." : "Submit Waste Deposit"}
            </button>
          </form>
        </aside>
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

export default EmployeeDashboard;
