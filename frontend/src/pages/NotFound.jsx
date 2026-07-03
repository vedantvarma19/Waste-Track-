// frontend/src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="fade-in card text-center" style={{ maxWidth: "500px", margin: "4rem auto", padding: "3rem 2rem" }}>
      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔍</div>
      <h2 style={{ marginBottom: "1rem" }}>Page Not Found</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn btn-secondary">
        Return to Home Page
      </Link>
    </div>
  );
};

export default NotFound;
