// frontend/src/pages/Complaints.jsx
import React, { useState, useEffect } from "react";
import { fetchDepartments, fetchRoutesByDept, submitComplaint, filterComplaints } from "../services/api";
import Toast from "../components/Toast";

const Complaints = () => {
  const [departments, setDepartments] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    citizen_name: "",
    contact_no: "",
    location: "",
    dept_id: "",
    route_id: "",
    description: ""
  });

  // Filters state
  const [filters, setFilters] = useState({
    status: "",
    date: ""
  });

  // Notification state
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const depts = await fetchDepartments();
        setDepartments(depts);
      } catch (err) {
        console.error("Failed to load departments", err);
      }
      loadComplaintsList();
    };
    loadInitialData();
  }, []);

  const loadComplaintsList = async (activeFilters = {}) => {
    setLoadingComplaints(true);
    try {
      const data = await filterComplaints(activeFilters);
      setRecentComplaints(data);
    } catch (err) {
      console.error("Failed to load complaints", err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleDeptChange = async (e) => {
    const deptId = e.target.value;
    setFormData((prev) => ({ ...prev, dept_id: deptId, route_id: "" }));
    setRoutes([]);
    if (deptId) {
      try {
        const data = await fetchRoutesByDept(deptId);
        setRoutes(data);
      } catch (err) {
        console.error("Failed to load routes", err);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dept_id) {
      setToast({ message: "Please select a department", type: "error" });
      return;
    }

    try {
      const res = await submitComplaint({
        citizen_name: formData.citizen_name,
        contact_no: formData.contact_no,
        location: formData.location || "N/A",
        description: formData.description,
        dept_id: Number(formData.dept_id),
        route_id: formData.route_id ? Number(formData.route_id) : null
      });

      setToast({
        message: res.message || `Complaint submitted successfully! (ID: ${res.complaint_id})`,
        type: res.merged ? "warning" : "success"
      });

      // Reset form
      setFormData({
        citizen_name: "",
        contact_no: "",
        location: "",
        dept_id: "",
        route_id: "",
        description: ""
      });
      setRoutes([]);
      
      // Reload table
      loadComplaintsList();
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to submit complaint";
      setToast({ message: errMsg, type: "error" });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    const activeParams = {};
    if (filters.status) activeParams.status = filters.status;
    if (filters.date) activeParams.date = filters.date;
    loadComplaintsList(activeParams);
  };

  const clearFilters = () => {
    setFilters({ status: "", date: "" });
    loadComplaintsList({});
  };

  return (
    <div className="fade-in">
      <div style={{ maxWidth: "800px", margin: "0 auto 3rem auto" }}>
        <h2 style={{ marginBottom: "1.5rem" }}>Submit Waste Complaint</h2>
        
        <form onSubmit={handleSubmit} className="card flex flex-col gap-1">
          <div className="grid-2">
            <div className="form-group">
              <label>Your Name</label>
              <input 
                type="text" 
                name="citizen_name" 
                className="form-control" 
                value={formData.citizen_name} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Contact Number</label>
              <input 
                type="text" 
                name="contact_no" 
                className="form-control" 
                value={formData.contact_no} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Location (Street Address, Landmarks)</label>
            <input 
              type="text" 
              name="location" 
              className="form-control" 
              value={formData.location} 
              onChange={handleChange} 
              placeholder="e.g. 4th Cross Jayanagar, near metro station" 
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Responsible Zone/Department</label>
              <select 
                name="dept_id" 
                className="form-control" 
                value={formData.dept_id} 
                onChange={handleDeptChange} 
                required
              >
                <option value="">-- Select Zone --</option>
                {departments.map((d) => (
                  <option key={d.dept_id} value={d.dept_id}>
                    {d.name} {d.location ? `(${d.location})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Specific Route (Optional)</label>
              <select 
                name="route_id" 
                className="form-control" 
                value={formData.route_id} 
                onChange={handleChange}
                disabled={!formData.dept_id}
              >
                <option value="">-- Select Route --</option>
                {routes.map((r) => (
                  <option key={r.route_id} value={r.route_id}>
                    {r.route_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description of Waste Issue</label>
            <textarea 
              name="description" 
              className="form-control" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Describe the issue (e.g. overflowing bin, construction waste blocking path, etc.)"
              required
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
            Submit Complaint
          </button>
        </form>
      </div>

      <div>
        <h3 style={{ marginBottom: "1rem" }}>All Submitted Complaints</h3>

        {/* Filters bar */}
        <form onSubmit={applyFilters} className="card flex align-center gap-3" style={{ padding: "1rem 1.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div className="form-group" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ margin: 0, whiteSpace: "nowrap" }}>Status:</label>
            <select name="status" className="form-control" value={filters.status} onChange={handleFilterChange} style={{ padding: "0.5rem", width: "140px" }}>
              <option value="">All</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ margin: 0, whiteSpace: "nowrap" }}>Date:</label>
            <input 
              type="date" 
              name="date" 
              className="form-control" 
              value={filters.date} 
              onChange={handleFilterChange} 
              style={{ padding: "0.5rem", width: "160px" }} 
            />
          </div>

          <div className="flex gap-2" style={{ marginLeft: "auto" }}>
            <button type="submit" className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              Apply Filters
            </button>
            <button type="button" onClick={clearFilters} className="btn btn-ghost" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              Clear
            </button>
          </div>
        </form>

        {/* Complaints Table */}
        <div className="table-wrapper">
          {loadingComplaints ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <div className="skeleton" style={{ height: "40px", marginBottom: "0.5rem" }}></div>
              <div className="skeleton" style={{ height: "40px", marginBottom: "0.5rem" }}></div>
              <div className="skeleton" style={{ height: "40px" }}></div>
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-title">No Complaints Found</div>
              <p className="empty-state-desc">Try clearing your filters or report a new waste issue above.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>ID</th>
                  <th>Citizen Name</th>
                  <th>Location</th>
                  <th>Route</th>
                  <th>Description</th>
                  <th>Assigned staff</th>
                  <th style={{ width: "130px" }}>Status</th>
                  <th style={{ width: "120px" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map((c) => (
                  <tr key={c.complaint_id}>
                    <td><strong>#{c.complaint_id}</strong></td>
                    <td>{c.citizen_name}</td>
                    <td>{c.location}</td>
                    <td>{c.route_name || "N/A"}</td>
                    <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.description}>
                      {c.description}
                    </td>
                    <td>{c.assigned_employee || "Unassigned"}</td>
                    <td>
                      <span className={`badge badge-${(c.status || "unknown").toLowerCase().replace(/\s+/g, "")}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>{c.complaint_date ? c.complaint_date.substring(0, 10) : "N/A"}</td>
                  </tr>
                ))}
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

export default Complaints;
