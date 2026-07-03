// frontend/src/pages/Unauthorized.jsx
import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="fade-in card text-center" style={{ maxWidth: "500px", margin: "4rem auto", padding: "3rem 2rem" }}>
      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🚧</div>
      <h2 style={{ color: "#ef4444", marginBottom: "1rem" }}>Access Denied</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
        You do not have the required role privileges to access this dashboard portal.
      </p>
      <Link to="/" className="btn btn-secondary">
        Return to Home Page
      </Link>
    </div>
  );
};

export default Unauthorized;
