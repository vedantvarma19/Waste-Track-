// frontend/src/pages/Stats.jsx
import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { fetchStatsOverview, fetchViewData } from "../services/api";
import axios from "axios";

const Stats = () => {
  const [overview, setOverview] = useState({ pending: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timelineMode, setTimelineMode] = useState("daily"); // 'daily', 'monthly'

  // Chart canvas refs
  const wasteBreakdownChartRef = useRef(null);
  const timelineChartRef = useRef(null);
  const zonePerformanceChartRef = useRef(null);
  const routeChartRef = useRef(null);

  // Chart instances
  const wasteBreakdownInst = useRef(null);
  const timelineInst = useRef(null);
  const zonePerformanceInst = useRef(null);
  const routeInst = useRef(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch overview counts
      const ov = await fetchStatsOverview();
      setOverview({ pending: ov.pending ?? 0, resolved: ov.resolved ?? 0 });

      // 2. Fetch advanced statistics
      const res = await axios.get("/api/stats/advanced");
      const { wasteBreakdown, timeline, zonePerformance } = res.data;

      // 3. Fetch route stats (from old view)
      const routeData = await fetchViewData("v_waste_collection_stats");

      // --- Chart 1: Waste Type Breakdown (Doughnut) ---
      if (wasteBreakdownChartRef.current) {
        if (wasteBreakdownInst.current) wasteBreakdownInst.current.destroy();
        
        const labels = wasteBreakdown.map((w) => w.waste_type);
        const data = wasteBreakdown.map((w) => Number(w.total_weight) || 0);

        wasteBreakdownInst.current = new Chart(wasteBreakdownChartRef.current, {
          type: "doughnut",
          data: {
            labels,
            datasets: [{
              data,
              backgroundColor: [
                "#10b981", "#3b82f6", "#f59e0b", "#ef4444", 
                "#8b5cf6", "#ec4899", "#06b6d4", "#64748b"
              ],
              borderWidth: 2,
              borderColor: "white"
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "right",
                labels: { boxWidth: 12, font: { size: 11, weight: 600 } }
              },
              tooltip: {
                callbacks: {
                  label: (context) => ` ${context.label}: ${context.raw.toLocaleString()} kg`
                }
              }
            },
            cutout: "60%"
          }
        });
      }

      // --- Chart 2: Complaints & Resolutions Timeline (Line) ---
      if (timelineChartRef.current) {
        if (timelineInst.current) timelineInst.current.destroy();

        // Process timeline based on daily/monthly mode
        let displayTimeline = [...timeline];
        if (timelineMode === "monthly") {
          // Group by Month (YYYY-MM)
          const monthlyMap = new Map();
          timeline.forEach((t) => {
            const month = t.date.substring(0, 7); // 'YYYY-MM'
            if (!monthlyMap.has(month)) {
              monthlyMap.set(month, { date: month, registered: 0, resolved: 0 });
            }
            const existing = monthlyMap.get(month);
            existing.registered += t.registered;
            existing.resolved += t.resolved;
          });
          displayTimeline = Array.from(monthlyMap.values());
        }

        const labels = displayTimeline.map((t) => t.date);
        const registeredData = displayTimeline.map((t) => t.registered);
        const resolvedData = displayTimeline.map((t) => t.resolved);

        timelineInst.current = new Chart(timelineChartRef.current, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "Complaints Registered",
                data: registeredData,
                borderColor: "#ef4444",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderWidth: 2.5,
                tension: 0.35,
                fill: true
              },
              {
                label: "Complaints Resolved",
                data: resolvedData,
                borderColor: "#10b981",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                borderWidth: 2.5,
                tension: 0.35,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
              x: { grid: { display: false } }
            },
            plugins: {
              legend: { position: "top", labels: { font: { weight: 600 } } }
            }
          }
        });
      }

      // --- Chart 3: Zone Performance (Grouped Bar) ---
      if (zonePerformanceChartRef.current) {
        if (zonePerformanceInst.current) zonePerformanceInst.current.destroy();

        const labels = zonePerformance.map((z) => z.zone_name);
        const registered = zonePerformance.map((z) => z.registered);
        const resolved = zonePerformance.map((z) => z.resolved);

        zonePerformanceInst.current = new Chart(zonePerformanceChartRef.current, {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Registered Issues",
                data: registered,
                backgroundColor: "rgba(239, 68, 68, 0.75)",
                borderColor: "rgba(239, 68, 68, 1)",
                borderWidth: 1,
                borderRadius: 4
              },
              {
                label: "Resolved Issues",
                data: resolved,
                backgroundColor: "rgba(16, 185, 129, 0.75)",
                borderColor: "rgba(16, 185, 129, 1)",
                borderWidth: 1,
                borderRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
              x: { grid: { display: false } }
            },
            plugins: {
              legend: { position: "top", labels: { font: { weight: 600 } } }
            }
          }
        });
      }

      // --- Chart 4: Route-Wise Collections (Bar) ---
      if (routeChartRef.current) {
        if (routeInst.current) routeInst.current.destroy();

        const labels = routeData.map((r) => r.route_name);
        const values = routeData.map((r) => Number(r.total_collected_kg) || 0);

        routeInst.current = new Chart(routeChartRef.current, {
          type: "bar",
          data: {
            labels,
            datasets: [{
              label: "Waste Collected (kg)",
              data: values,
              backgroundColor: "rgba(6, 182, 212, 0.75)",
              borderColor: "rgba(6, 182, 212, 1)",
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
              x: { grid: { display: false } }
            }
          }
        });
      }

    } catch (err) {
      console.error("Failed to load advanced analytics dashboard charts", err);
      setError("Failed to load statistical views. Please check if the backend server is running and the database connection is healthy.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (wasteBreakdownInst.current) wasteBreakdownInst.current.destroy();
      if (timelineInst.current) timelineInst.current.destroy();
      if (zonePerformanceInst.current) zonePerformanceInst.current.destroy();
      if (routeInst.current) routeInst.current.destroy();
    };
  }, [timelineMode]);

  if (error) {
    return (
      <div className="card text-center" style={{ maxWidth: "600px", margin: "3rem auto", padding: "3rem 2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>⚠️</div>
        <h3 style={{ marginBottom: "1rem" }}>Failed to Load Dashboard Data</h3>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>{error}</p>
        <button onClick={loadData} className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2>WasteTrack V2.0 Insights Dashboard</h2>
          <p style={{ color: "var(--text-muted)" }}>Advanced statistical representation of waste collection weights, timelines, and zone performance.</p>
        </div>
        
        {/* Metric widgets */}
        <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
          <div className="card" style={{ display: "flex", alignItems: "center", padding: "0.5rem 1rem", background: "white", margin: 0, gap: "0.75rem" }}>
            <span style={{ fontSize: "1.25rem" }}>⚠️</span>
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--status-pending)" }}>{overview.pending}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700" }}>PENDING ISSUES</div>
            </div>
          </div>
          <div className="card" style={{ display: "flex", alignItems: "center", padding: "0.5rem 1rem", background: "white", margin: 0, gap: "0.75rem" }}>
            <span style={{ fontSize: "1.25rem" }}>✅</span>
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--status-resolved)" }}>{overview.resolved}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700" }}>RESOLVED TASES</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns for Main Interactive Charts */}
      <div className="grid-2" style={{ marginBottom: "2rem" }}>
        
        {/* Chart 1: Registration vs Resolution Timeline */}
        <div className="card flex flex-col">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--primary)", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", textAlign: "left", margin: 0 }}>
              📈 Complaints Registration & Resolution Timeline
            </h3>
            
            {/* Toggle Daily/Monthly */}
            <div className="flex gap-1">
              <button 
                onClick={() => setTimelineMode("daily")} 
                className={`btn ${timelineMode === "daily" ? "btn-secondary" : "btn-ghost"}`}
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
              >
                Daily
              </button>
              <button 
                onClick={() => setTimelineMode("monthly")} 
                className={`btn ${timelineMode === "monthly" ? "btn-secondary" : "btn-ghost"}`}
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
              >
                Monthly
              </button>
            </div>
          </div>

          <div style={{ position: "relative", height: "300px", width: "100%" }}>
            {loading ? (
              <div className="skeleton" style={{ height: "100%" }}></div>
            ) : (
              <canvas ref={timelineChartRef}></canvas>
            )}
          </div>
        </div>

        {/* Chart 2: Waste Type Breakdown (Doughnut) */}
        <div className="card flex flex-col">
          <h3 style={{ fontSize: "1.1rem", borderBottom: "2px solid var(--secondary)", paddingBottom: "0.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
            ♻️ Waste Category Breakdown (Total Weight kg)
          </h3>
          <div style={{ position: "relative", height: "300px", width: "100%" }}>
            {loading ? (
              <div className="skeleton" style={{ height: "100%" }}></div>
            ) : (
              <canvas ref={wasteBreakdownChartRef}></canvas>
            )}
          </div>
        </div>

      </div>

      {/* Grid: 2 Columns for Performance Comparison Charts */}
      <div className="grid-2">
        
        {/* Chart 3: Zone Performance Comparison */}
        <div className="card flex flex-col">
          <h3 style={{ fontSize: "1.1rem", borderBottom: "2px solid var(--primary)", paddingBottom: "0.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
            🏢 Department Zone Performance (Registered vs. Resolved)
          </h3>
          <div style={{ position: "relative", height: "300px", width: "100%" }}>
            {loading ? (
              <div className="skeleton" style={{ height: "100%" }}></div>
            ) : (
              <canvas ref={zonePerformanceChartRef}></canvas>
            )}
          </div>
        </div>

        {/* Chart 4: Route Collections Weight */}
        <div className="card flex flex-col">
          <h3 style={{ fontSize: "1.1rem", borderBottom: "2px solid var(--secondary)", paddingBottom: "0.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
            🚛 Waste Weights Collected per Route (Total kg)
          </h3>
          <div style={{ position: "relative", height: "300px", width: "100%" }}>
            {loading ? (
              <div className="skeleton" style={{ height: "100%" }}></div>
            ) : (
              <canvas ref={routeChartRef}></canvas>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Stats;
