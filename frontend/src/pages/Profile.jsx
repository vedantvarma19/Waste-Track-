// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await axios.get("/api/employees/me");
        setProfileData(res.data);
      } catch (err) {
        console.error("Failed to load profile details", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
        <div className="loader"></div>
      </div>
    );
  }

  const p = profileData || user;

  return (
    <div className="fade-in" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "1.5rem" }}>Your Profile</h2>

      <div className="card flex flex-col gap-3">
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem", marginBottom: "0.5rem" }}>
          <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--secondary))", color: "white", display: "flex", alignItems: "center", justify: "center", fontSize: "2rem", fontWeight: "bold" }}>
            {p.name ? p.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "0.25rem", textAlign: "left" }}>{p.name}</h3>
            <span className="badge badge-inprogress">{p.role}</span>
          </div>
        </div>

        <div className="grid-2" style={{ gap: "1.5rem" }}>
          <div>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>EMPLOYEE ID</strong>
            <p style={{ fontWeight: "600", color: "var(--dark)" }}>#{p.emp_id}</p>
          </div>

          <div>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>EMAIL ADDRESS</strong>
            <p style={{ fontWeight: "600", color: "var(--dark)" }}>{p.email}</p>
          </div>

          <div>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>CONTACT PHONE</strong>
            <p style={{ fontWeight: "600", color: "var(--dark)" }}>{p.contact || "N/A"}</p>
          </div>

          <div>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>STAFF CODE</strong>
            <p style={{ fontWeight: "600", color: "var(--dark)" }}>{p.emp_code || "N/A"}</p>
          </div>

          <div>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>JOINING DATE</strong>
            <p style={{ fontWeight: "600", color: "var(--dark)" }}>{p.join_date ? p.join_date.substring(0, 10) : "N/A"}</p>
          </div>

          <div>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>DEPARTMENT CODE</strong>
            <p style={{ fontWeight: "600", color: "var(--dark)" }}>{p.dept_id ? `Dept ID: ${p.dept_id}` : "Global"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
