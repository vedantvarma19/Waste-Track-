// frontend/src/pages/Welcome.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchStatsOverview } from "../services/api";

const Welcome = () => {
  const [metrics, setMetrics] = useState({ pending: 0, resolved: 0, vehicles: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await fetchStatsOverview();
        setMetrics({
          pending: data.pending ?? 0,
          resolved: data.resolved ?? 0,
          vehicles: data.vehicleUsage?.length ?? 0
        });
      } catch (err) {
        console.warn("Failed to fetch live snapshot", err);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  return (
    <div className="fade-in" style={{ padding: "1rem 0" }}>
      {/* Centered Hero Header */}
      <section 
        style={{ 
          textAlign: "center",
          marginBottom: "2.5rem", 
          padding: "0.5rem 0"
        }}
      >
        <h1 style={{ fontSize: "2.5rem", color: "var(--dark)", marginBottom: "0.75rem", letterSpacing: "-0.5px" }}>
          Smart City Waste Management <span style={{ color: "var(--primary)" }}>Simplified</span>
        </h1>
        <p style={{ fontSize: "1.05rem", color: "var(--text-muted)", maxWidth: "680px", margin: "0 auto", lineHeight: "1.5" }}>
          WasteTrack connects citizens, sanitation staff, and department managers on a single sustainable platform. 
          Report local issues and check real-time city performance stats below.
        </p>
      </section>

      {/* Centered Compact, Equal-Sized Main Cards */}
      <div className="grid-2" style={{ gap: "1.5rem", maxWidth: "820px", margin: "0 auto 3rem auto" }}>
        
        {/* Card 1: Report Waste Issue */}
        <div 
          className="card flex flex-col justify-between align-center" 
          style={{ 
            padding: "2rem 1.5rem", 
            textAlign: "center",
            height: "100%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))",
            borderColor: "rgba(16, 185, 129, 0.12)"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ 
              width: "64px", 
              height: "64px", 
              borderRadius: "50%", 
              backgroundColor: "rgba(16, 185, 129, 0.08)", 
              color: "var(--primary)", 
              display: "flex", 
              alignItems: "center", 
              justify: "center", 
              fontSize: "2.25rem", 
              marginBottom: "1rem" 
            }}>
              🗑️
            </div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Report Waste Issue</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.5", marginBottom: "1.5rem", maxWidth: "300px" }}>
              Spotted overflowing bins, public dumping, or street litter? Submit a quick ticket to alert your area driver.
            </p>
          </div>
          <Link to="/complaint" className="btn btn-primary" style={{ width: "100%", padding: "0.75rem" }}>
            File a Complaint
          </Link>
        </div>

        {/* Card 2: Public Analytics */}
        <div 
          className="card flex flex-col justify-between align-center" 
          style={{ 
            padding: "2rem 1.5rem", 
            textAlign: "center",
            height: "100%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))",
            borderColor: "rgba(6, 182, 212, 0.12)"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ 
              width: "64px", 
              height: "64px", 
              borderRadius: "50%", 
              backgroundColor: "rgba(6, 182, 212, 0.08)", 
              color: "var(--secondary)", 
              display: "flex", 
              alignItems: "center", 
              justify: "center", 
              fontSize: "2.25rem", 
              marginBottom: "1rem" 
            }}>
              📊
            </div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Public Analytics</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.5", marginBottom: "1.5rem", maxWidth: "300px" }}>
              Track real-time city sanitation performance, active dump truck deployments, and departmental task summaries.
            </p>
          </div>
          <Link to="/stats" className="btn btn-secondary" style={{ width: "100%", padding: "0.75rem" }}>
            Open Public Stats
          </Link>
        </div>

      </div>

      {/* Centered Live City Snapshot */}
      <div 
        className="card" 
        style={{ 
          maxWidth: "820px", 
          margin: "0 auto 3rem auto", 
          background: "var(--dark)", 
          color: "white", 
          padding: "1.75rem 2rem" 
        }}
      >
        <h3 style={{ color: "white", fontSize: "1.2rem", marginBottom: "1.25rem", textAlign: "center" }}>Live City Snapshot</h3>
        
        {loading ? (
          <div className="grid-3" style={{ gap: "1rem" }}>
            <div className="skeleton" style={{ height: "60px" }}></div>
            <div className="skeleton" style={{ height: "60px" }}></div>
            <div className="skeleton" style={{ height: "60px" }}></div>
          </div>
        ) : (
          <div className="grid-3" style={{ gap: "1rem" }}>
            <div className="metric-card" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "0.75rem 1rem" }}>
              <div className="metric-icon" style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "var(--status-pending)", width: "38px", height: "38px", fontSize: "1.2rem" }}>⚠️</div>
              <div>
                <div className="metric-value" style={{ color: "white", fontSize: "1.35rem" }}>{metrics.pending}</div>
                <div className="metric-label" style={{ color: "#94a3b8", fontSize: "0.7rem" }}>Active Issues</div>
              </div>
            </div>

            <div className="metric-card" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "0.75rem 1rem" }}>
              <div className="metric-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "var(--status-resolved)", width: "38px", height: "38px", fontSize: "1.2rem" }}>✅</div>
              <div>
                <div className="metric-value" style={{ color: "white", fontSize: "1.35rem" }}>{metrics.resolved}</div>
                <div className="metric-label" style={{ color: "#94a3b8", fontSize: "0.7rem" }}>Resolved Tasks</div>
              </div>
            </div>

            <div className="metric-card" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "0.75rem 1rem" }}>
              <div className="metric-icon" style={{ backgroundColor: "rgba(6, 182, 212, 0.15)", color: "var(--secondary)", width: "38px", height: "38px", fontSize: "1.2rem" }}>🚛</div>
              <div>
                <div className="metric-value" style={{ color: "white", fontSize: "1.35rem" }}>{metrics.vehicles}</div>
                <div className="metric-label" style={{ color: "#94a3b8", fontSize: "0.7rem" }}>Active Trucks</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Welcome;
