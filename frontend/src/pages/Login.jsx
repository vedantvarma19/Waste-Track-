// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [loginType, setLoginType] = useState(""); // 'employee' or 'manager'
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setSubmitting(true);
    try {
      const user = await login(identifier.trim(), password);
      setToast({ message: `Welcome back, ${user.name}!`, type: "success" });
      
      // Redirect based on role
      setTimeout(() => {
        if (user.role === "Head" || user.role === "Admin") {
          navigate("/head-dashboard");
        } else if (user.role === "Manager") {
          navigate("/manager-dashboard");
        } else {
          navigate("/employee-dashboard");
        }
      }, 800);
    } catch (err) {
      setToast({ message: err.message || "Invalid credentials", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleModeChange = (type) => {
    setLoginType(type);
    setIdentifier("");
    setPassword("");
    setShowForm(true);
  };

  return (
    <div className="fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <div className="card" style={{ width: "100%", maxWidth: "420px" }}>
        <h2 style={{ marginBottom: "1.5rem", textAlign: "center" }}>Portal Sign In</h2>

        {!showForm ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.95rem" }}>
              Select your access portal below to proceed to your dashboard.
            </p>
            
            <div className="flex flex-col gap-2">
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ width: "100%", padding: "1rem" }} 
                onClick={() => handleModeChange("employee")}
              >
                Are you an Employee?
              </button>

              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ width: "100%", padding: "1rem" }} 
                onClick={() => handleModeChange("manager")}
              >
                Manager / Admin Login
              </button>
            </div>
            
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2rem" }}>
              Citizen submitting a complaint? Go to the{" "}
              <button 
                onClick={() => navigate("/complaint")} 
                style={{ background: "none", border: "none", color: "var(--primary)", textDecoration: "underline", cursor: "pointer", fontWeight: "600" }}
              >
                Complaint Form
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: "transparent", padding: 0, boxShadow: "none", maxWidth: "100%" }}>
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-inprogress" style={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                {loginType === "employee" ? "Employee Portal" : "Manager/Admin Portal"}
              </span>
              <button 
                type="button" 
                style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.8rem", cursor: "pointer", fontWeight: "600" }}
                onClick={() => handleModeChange(loginType === "employee" ? "manager" : "employee")}
              >
                Switch Portal
              </button>
            </div>

            <div className="form-group">
              <label>{loginType === "employee" ? "Employee ID or Code" : "Email Address"}</label>
              <input 
                type={loginType === "employee" ? "text" : "email"} 
                className="form-control" 
                placeholder={loginType === "employee" ? "e.g. 2 or EMP-1023" : "manager@wastetrack.com"} 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label>Password</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: "100%", textTransform: "uppercase" }} 
              disabled={submitting}
            >
              {submitting ? "Signing In..." : "Log In"}
            </button>

            <button 
              type="button" 
              className="btn btn-ghost" 
              style={{ width: "100%", marginTop: "0.75rem" }} 
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              Back
            </button>
          </form>
        )}
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

export default Login;
