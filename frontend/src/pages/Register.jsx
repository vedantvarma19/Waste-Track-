// frontend/src/pages/Register.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchDepartments, registerEmployee } from "../services/api";
import Toast from "../components/Toast";

const Register = () => {
  const { user, checkSession } = useAuth();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    join_date: "",
    email: "",
    password: "",
    dept_id: "",
    role: "Employee",
    emp_code: ""
  });

  useEffect(() => {
    const loadDepts = async () => {
      try {
        const depts = await fetchDepartments();
        setDepartments(depts);
      } catch (err) {
        console.error(err);
      }
    };
    loadDepts();

    // If Manager is logged in, lock department and role
    if (user && user.role === "Manager") {
      setFormData((prev) => ({
        ...prev,
        dept_id: user.dept_id,
        role: "Employee"
      }));
    }
  }, [user]);

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

    setSubmitting(true);
    try {
      const registeredUser = await registerEmployee({
        ...formData,
        dept_id: Number(formData.dept_id)
      });
      
      setToast({ message: "Staff account registered successfully! Logging you in...", type: "success" });
      
      // Reset form (except locked manager parameters)
      setFormData({
        name: "",
        phone: "",
        join_date: "",
        email: "",
        password: "",
        dept_id: user && user.role === "Manager" ? user.dept_id : "",
        role: user && user.role === "Manager" ? "Employee" : "Employee",
        emp_code: ""
      });

      // Auto-login and redirect if guest visitor
      if (!user) {
        setTimeout(async () => {
          try {
            await checkSession();
            if (registeredUser.role === "Head" || registeredUser.role === "Admin") {
              navigate("/head-dashboard");
            } else if (registeredUser.role === "Manager") {
              navigate("/manager-dashboard");
            } else {
              navigate("/employee-dashboard");
            }
          } catch (e) {
            navigate("/login");
          }
        }, 1500);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || "Registration failed. Try again.";
      setToast({ message: errMsg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <div className="card" style={{ width: "100%", maxWidth: "600px" }}>
        <h2 style={{ marginBottom: "0.5rem", textAlign: "center" }}>Create Staff Account</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", marginBottom: "1.5rem" }}>
          {user && user.role === "Manager" 
            ? `Registering Employee for ${user.name}'s Department` 
            : "Self-register as a sanitation driver or department staff member."}
        </p>

        <form onSubmit={handleSubmit} style={{ background: "transparent", padding: 0, boxShadow: "none", maxWidth: "100%" }}>
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              name="name" 
              className="form-control" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              disabled={submitting}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Contact Number</label>
              <input 
                type="text" 
                name="phone" 
                className="form-control" 
                value={formData.phone} 
                onChange={handleChange}
                placeholder="e.g. 9880011111"
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label>Joining Date</label>
              <input 
                type="date" 
                name="join_date" 
                className="form-control" 
                value={formData.join_date} 
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Email Address (Username)</label>
              <input 
                type="email" 
                name="email" 
                className="form-control" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label>Password (Min. 6 chars)</label>
              <input 
                type="password" 
                name="password" 
                className="form-control" 
                value={formData.password} 
                onChange={handleChange} 
                required 
                minLength="6"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Department</label>
              <select 
                name="dept_id" 
                className="form-control" 
                value={formData.dept_id} 
                onChange={handleChange}
                required
                disabled={submitting || (user && user.role === "Manager")}
              >
                <option value="">-- Select Department --</option>
                {departments.map((d) => (
                  <option key={d.dept_id} value={d.dept_id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Role</label>
              <select 
                name="role" 
                className="form-control" 
                value={formData.role} 
                onChange={handleChange}
                required
                disabled={submitting || (user && user.role === "Manager")}
              >
                <option value="Employee">Employee (Driver/Collector)</option>
                {(!user || user.role === "Head" || user.role === "Admin") && (
                  <>
                    <option value="Manager">Department Manager</option>
                    <option value="Head">Head Administrator</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label>Employee Code (Optional)</label>
            <input 
              type="text" 
              name="emp_code" 
              className="form-control" 
              placeholder="e.g. EMP-1023"
              value={formData.emp_code} 
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", textTransform: "uppercase" }} disabled={submitting}>
            {submitting ? "Registering..." : "Create Account"}
          </button>
        </form>
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

export default Register;
