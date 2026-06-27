// frontend/src/pages/Track.jsx
import React, { useState } from "react";
import { fetchComplaints } from "../services/api";
import Toast from "../components/Toast";

const Track = () => {
  const [searchVal, setSearchVal] = useState("");
  const [searchType, setSearchType] = useState("phone"); // 'phone' or 'id'
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchVal.trim()) return;

    setSearching(true);
    setResults([]);
    try {
      const params = {};
      if (searchType === "phone") {
        params.contact_no = searchVal.trim();
      } else {
        params.complaint_id = Number(searchVal.trim());
      }

      const data = await fetchComplaints(params);
      setResults(data);
      if (data.length === 0) {
        setToast({ message: "No matching complaints found.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to fetch tracking data.", type: "error" });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h2>Track Complaint Status</h2>
        <p style={{ color: "var(--text-muted)" }}>Enter your details below to track reported waste issues in real-time.</p>
      </div>

      <form onSubmit={handleSearch} className="card flex flex-col gap-2" style={{ marginBottom: "2rem" }}>
        <div className="flex gap-2" style={{ marginBottom: "0.5rem" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", cursor: "pointer" }}>
            <input 
              type="radio" 
              name="searchType" 
              value="phone" 
              checked={searchType === "phone"} 
              onChange={() => { setSearchType("phone"); setSearchVal(""); }} 
            />
            Contact Number
          </label>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", cursor: "pointer", marginLeft: "1rem" }}>
            <input 
              type="radio" 
              name="searchType" 
              value="id" 
              checked={searchType === "id"} 
              onChange={() => { setSearchType("id"); setSearchVal(""); }} 
            />
            Complaint ID
          </label>
        </div>

        <div className="flex gap-2" style={{ width: "100%" }}>
          <input 
            type={searchType === "id" ? "number" : "text"} 
            className="form-control" 
            placeholder={searchType === "phone" ? "Enter your 10-digit mobile number" : "Enter Complaint ID (e.g. 15)"} 
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={searching} style={{ minWidth: "120px" }}>
            {searching ? "Searching..." : "Track Status"}
          </button>
        </div>
      </form>

      {/* Results Rendering */}
      {results !== null && (
        <div className="flex flex-col gap-3">
          {results.length === 0 ? (
            <div className="card text-center" style={{ padding: "3rem 1.5rem" }}>
              <p style={{ fontSize: "1.1rem", fontWeight: "600" }}>No complaints found matching your query.</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                Make sure you typed the correct {searchType === "phone" ? "phone number" : "complaint ID"}.
              </p>
            </div>
          ) : (
            results.map((c) => {
              const dateStr = c.complaint_date ? new Date(c.complaint_date).toLocaleDateString() : "N/A";
              return (
                <div key={c.complaint_id} className="card fade-in">
                  <div className="flex justify-between align-center" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>COMPLAINT ID</span>
                      <h3 style={{ fontSize: "1.25rem" }}>#{c.complaint_id}</h3>
                    </div>
                    <div>
                      <span className={`badge badge-${(c.status || "unknown").toLowerCase().replace(/\s+/g, "")}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid-2" style={{ gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>CITIZEN</strong>
                      <p style={{ fontWeight: "600" }}>{c.citizen_name}</p>
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>LOCATION</strong>
                      <p style={{ fontWeight: "600" }}>{c.location}</p>
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>SUBMITTED ON</strong>
                      <p style={{ fontWeight: "600" }}>{dateStr}</p>
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>ROUTE ASSIGNED</strong>
                      <p style={{ fontWeight: "600" }}>{c.route_name || "N/A"}</p>
                    </div>
                  </div>

                  <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
                    <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>DESCRIPTION</strong>
                    <p style={{ fontSize: "0.95rem" }}>{c.description}</p>
                  </div>

                  {/* Visual Status Progress Flow */}
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.75rem" }}>PROGRESS TRACKING</strong>
                    <div className="flex justify-between align-center" style={{ position: "relative", padding: "0 10px" }}>
                      
                      {/* Connecting Line */}
                      <div style={{ position: "absolute", top: "12px", left: "20px", right: "20px", height: "4px", backgroundColor: "var(--border)", zIndex: 1 }}>
                        <div style={{ 
                          width: c.status === "Closed" ? "100%" : c.status === "Resolved" ? "66%" : c.status === "In Progress" ? "33%" : "0%", 
                          height: "100%", 
                          backgroundColor: "var(--primary)",
                          transition: "width 0.4s"
                        }}></div>
                      </div>

                      <div className="flex flex-col align-center" style={{ zIndex: 2 }}>
                        <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "var(--primary)", color: "white", display: "flex", alignItems: "center", justify: "center", fontSize: "0.75rem", fontWeight: "bold" }}>✓</div>
                        <span style={{ fontSize: "0.75rem", fontWeight: "700", marginTop: "4px" }}>Submitted</span>
                      </div>

                      <div className="flex flex-col align-center" style={{ zIndex: 2 }}>
                        <div style={{ 
                          width: "26px", 
                          height: "26px", 
                          borderRadius: "50%", 
                          backgroundColor: c.status !== "Open" ? "var(--primary)" : "white", 
                          color: c.status !== "Open" ? "white" : "var(--text-muted)",
                          border: "2px solid var(--primary)",
                          display: "flex", alignItems: "center", justify: "center", fontSize: "0.75rem", fontWeight: "bold"
                        }}>
                          {c.status !== "Open" ? "✓" : "2"}
                        </div>
                        <span style={{ fontSize: "0.75rem", fontWeight: c.status === "In Progress" ? "700" : "500", marginTop: "4px" }}>In Progress</span>
                      </div>

                      <div className="flex flex-col align-center" style={{ zIndex: 2 }}>
                        <div style={{ 
                          width: "26px", 
                          height: "26px", 
                          borderRadius: "50%", 
                          backgroundColor: (c.status === "Resolved" || c.status === "Closed") ? "var(--primary)" : "white", 
                          color: (c.status === "Resolved" || c.status === "Closed") ? "white" : "var(--text-muted)",
                          border: "2px solid " + ((c.status === "Resolved" || c.status === "Closed") ? "var(--primary)" : "var(--border)"),
                          display: "flex", alignItems: "center", justify: "center", fontSize: "0.75rem", fontWeight: "bold" 
                        }}>
                          {(c.status === "Resolved" || c.status === "Closed") ? "✓" : "3"}
                        </div>
                        <span style={{ fontSize: "0.75rem", fontWeight: c.status === "Resolved" ? "700" : "500", marginTop: "4px" }}>Resolved</span>
                      </div>

                      <div className="flex flex-col align-center" style={{ zIndex: 2 }}>
                        <div style={{ 
                          width: "26px", 
                          height: "26px", 
                          borderRadius: "50%", 
                          backgroundColor: c.status === "Closed" ? "var(--primary)" : "white", 
                          color: c.status === "Closed" ? "white" : "var(--text-muted)",
                          border: "2px solid " + (c.status === "Closed" ? "var(--primary)" : "var(--border)"),
                          display: "flex", alignItems: "center", justify: "center", fontSize: "0.75rem", fontWeight: "bold" 
                        }}>
                          {c.status === "Closed" ? "✓" : "4"}
                        </div>
                        <span style={{ fontSize: "0.75rem", fontWeight: c.status === "Closed" ? "700" : "500", marginTop: "4px" }}>Closed</span>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

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

export default Track;
