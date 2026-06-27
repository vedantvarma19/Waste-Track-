// frontend/src/services/api.js
import axios from "axios";

// Centralized Axios instance configuration
const api = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json"
  }
});

export const fetchDepartments = async () => {
  const res = await api.get("/api/departments");
  return res.data;
};

export const fetchRoutes = async (deptId = null) => {
  const url = deptId ? `/api/routes?dept_id=${deptId}` : "/api/routes";
  const res = await api.get(url);
  return res.data;
};

export const fetchRoutesByDept = async (deptId) => {
  const res = await api.get(`/api/routes/${deptId}`);
  return res.data;
};

export const fetchVehicles = async (deptId = null) => {
  const url = deptId ? `/api/vehicles?dept_id=${deptId}` : "/api/vehicles";
  const res = await api.get(url);
  return res.data;
};

// Complaints APIs
export const submitComplaint = async (payload) => {
  const res = await api.post("/api/complaints", payload);
  return res.data;
};

export const fetchComplaints = async (params = {}) => {
  const res = await api.get("/api/complaints", { params });
  return res.data;
};

export const filterComplaints = async (params = {}) => {
  const res = await api.get("/api/filter/complaints", { params });
  return res.data;
};

export const updateComplaintStatus = async (id, status) => {
  const res = await api.put(`/api/complaints/${id}/status`, { status });
  return res.data;
};

export const assignComplaint = async (id, emp_id, vehicle_id) => {
  const res = await api.put(`/api/complaints/${id}/assign`, { emp_id, vehicle_id });
  return res.data;
};

// Employees APIs
export const registerEmployee = async (payload) => {
  const res = await api.post("/api/employees/register", payload);
  return res.data;
};

export const fetchEmployees = async (params = {}) => {
  const res = await api.get("/api/employees", { params });
  return res.data;
};

export const updateEmployeeRole = async (id, role) => {
  const res = await api.put(`/api/employees/${id}/role`, { role });
  return res.data;
};

export const deleteEmployee = async (id) => {
  const res = await api.delete(`/api/employees/${id}`);
  return res.data;
};

// Stats & Views APIs
export const fetchStatsOverview = async () => {
  const res = await api.get("/api/stats/overview");
  return res.data;
};

export const fetchViewData = async (viewName) => {
  const res = await api.get(`/api/views/${viewName}`);
  return res.data;
};

// Waste records
export const submitWasteRecord = async (payload) => {
  const res = await api.post("/api/waste", payload);
  return res.data;
};

export default api;
