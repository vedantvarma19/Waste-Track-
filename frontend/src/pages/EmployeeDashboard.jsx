// frontend/src/pages/EmployeeDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchViewData, updateComplaintStatus, submitWasteRecord } from "../services/api";
import Toast from "../components/Toast";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon paths in built applications
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Coordinate mappings for Bangalore locations (Depots & Complaint points)
const DEPOT_COORDINATES = {
  1: [12.9226, 77.5933], // South Zone Depot (Jayanagar Area)
  2: [13.0232, 77.5697], // West Zone Depot (Yeshwanthpur Area)
  3: [12.9756, 77.6358], // East Zone Depot (Indiranagar Area)
  4: [13.0382, 77.5921], // North Zone Depot (Hebbal Area)
  5: [12.9740, 77.6010]  // Central Zone Depot (MG Road Area)
};

const LOCATION_COORDINATES = {
  // South Zone
  "Jayanagar": [12.9307, 77.5832],
  "Jayanagar 4th Block": [12.9284, 77.5878],
  "JP Nagar": [12.9105, 77.5857],
  "JP Nagar 2nd Phase": [12.9105, 77.5857],
  "BTM Layout": [12.9165, 77.6101],
  "BTM 1st Stage": [12.9165, 77.6101],
  "Koramangala": [12.9352, 77.6244],
  "Koramangala 5th Block": [12.9352, 77.6244],

  // West Zone
  "Rajajinagar": [12.9902, 77.5536],
  "Rajajinagar 1st Block": [12.9902, 77.5536],
  "Malleswaram": [13.0031, 77.5688],
  "Malleswaram 8th Cross": [13.0031, 77.5688],
  "Yeshwanthpur": [13.0285, 77.5402],
  "Yeshwanthpur Market": [13.0285, 77.5402],
  "Nagasandra": [13.0416, 77.5028],
  "Nagasandra Circle": [13.0416, 77.5028],

  // East Zone
  "Indiranagar": [12.9719, 77.6412],
  "Indiranagar 100 Ft Rd": [12.9719, 77.6412],
  "Whitefield": [12.9698, 77.7500],
  "Whitefield ITPL": [12.9698, 77.7500],
  "Marathahalli": [12.9561, 77.7011],
  "Marathahalli Bridge": [12.9561, 77.7011],
  "Bellandur": [12.9260, 77.6762],
  "Bellandur Lake Rd": [12.9260, 77.6762],

  // North Zone
  "Hebbal": [13.0358, 77.5970],
  "Hebbal Flyover Area": [13.0358, 77.5970],
  "Yelahanka": [13.1007, 77.5963],
  "Yelahanka New Town": [13.1007, 77.5963],
  "RT Nagar": [13.0189, 77.5913],
  "RT Nagar Main Rd": [13.0189, 77.5913],
  "Manyata Tech Park": [13.0451, 77.6266],
  "Nagavara": [13.0451, 77.6266],

  // Central Zone
  "MG Road": [12.9738, 77.6119],
  "MG Road & Brigade": [12.9738, 77.6119],
  "Shivajinagar": [12.9857, 77.6057],
  "Shivajinagar Bus Stand": [12.9857, 77.6057],
  "Commercial Street": [12.9818, 77.6083],
  "Tasker Town": [12.9818, 77.6083],
  "Majestic": [12.9779, 77.5724],
  "Majestic Market Area": [12.9779, 77.5724],
  "UVCE Boys hostel": [12.9734, 77.5855],
  "UVCE": [12.9734, 77.5855]
};

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Waste Form State
  const [wasteForm, setWasteForm] = useState({
    route_id: "",
    waste_type: "",
    weight_kg: ""
  });
  const [recording, setRecording] = useState(false);

  // Map navigation states
  const [selectedTask, setSelectedTask] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distance: "0.0", duration: 0, steps: [] });
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const handleOpenMap = (task) => {
    setSelectedTask(task);
    setLoadingMap(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDriverLocation([pos.coords.latitude, pos.coords.longitude]);
          setLoadingMap(false);
        },
        (err) => {
          console.warn("Failed to capture driver current location, falling back to Depot:", err);
          setDriverLocation(null);
          setLoadingMap(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setDriverLocation(null);
      setLoadingMap(false);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchViewData("v_employee_tasks");
      // Filter for this specific driver/employee
      const myTasks = data.filter((t) => t.emp_id === user.emp_id);
      
      // Deduplicate by complaint_id to avoid multiples due to multiple assignments/waste logs
      const uniqueMap = new Map();
      myTasks.forEach((t) => {
        if (t.complaint_id) {
          if (!uniqueMap.has(t.complaint_id) || (t.status !== "Resolved" && t.status !== "Closed")) {
            uniqueMap.set(t.complaint_id, t);
          }
        }
      });
      setTasks(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to load assigned tasks.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  // Leaflet map setup effect
  useEffect(() => {
    if (!selectedTask) return;

    setRouteInfo({ distance: "0.0", duration: 0, steps: [] });

    // 100ms delay gives the modal DOM transition time to render and set its sizes
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean up any existing map instance on the DOM element before initializing a new one
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.warn("Error removing map instance:", err);
        }
        mapInstanceRef.current = null;
      }

      // Get starting coordinates (prefer driver's live GPS, fallback to zone depot coordinates)
      const start = driverLocation || DEPOT_COORDINATES[selectedTask.dept_id] || [12.9715, 77.5945];
      
      // Strict coordinates check to avoid string "null", "undefined", NaN or 0
      const lat = Number(selectedTask.latitude);
      const lng = Number(selectedTask.longitude);
      const hasGPS = selectedTask.latitude !== null && 
                     selectedTask.latitude !== undefined &&
                     selectedTask.latitude !== "null" &&
                     selectedTask.latitude !== "undefined" &&
                     !isNaN(lat) && !isNaN(lng) && 
                     lat !== 0 && lng !== 0;
      
      let end = null;
      if (hasGPS) {
        end = [lat, lng];
        setLoadingRoute(true);
      } else {
        setLoadingRoute(false);
      }

      console.log("📍 Map Navigation initialization. hasGPS:", hasGPS, "Start:", start, "End:", end);

      let map = null;
      try {
        // Initialize Leaflet Map
        map = L.map(mapContainerRef.current).setView(start, hasGPS ? 13 : 14);
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
      } catch (mapErr) {
        console.error("Failed to initialize Leaflet Map instance:", mapErr);
        return;
      }

      // Emoji icon markers
      const startIcon = L.divIcon({
        html: driverLocation 
          ? `<span style="font-size: 2.2rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));">🚛</span>`
          : `<span style="font-size: 2.2rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));">🏢</span>`,
        className: "custom-map-icon",
        iconSize: [35, 35],
        iconAnchor: [17, 17]
      });

      L.marker(start, { icon: startIcon })
        .addTo(map)
        .bindPopup(driverLocation 
          ? `<strong>Your Location (Start)</strong><br/>Co-ords: ${start[0].toFixed(4)}, ${start[1].toFixed(4)}`
          : `<strong>Zone Depot (Start)</strong><br/>Co-ords: ${start[0].toFixed(4)}, ${start[1].toFixed(4)}`
        )
        .openPopup();

      if (hasGPS) {
        const wasteIcon = L.divIcon({
          html: `<span style="font-size: 2.2rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));">🗑️</span>`,
          className: "custom-map-icon",
          iconSize: [35, 35],
          iconAnchor: [17, 17]
        });

        L.marker(end, { icon: wasteIcon })
          .addTo(map)
          .bindPopup(`<strong>Complaint Site (Destination)</strong><br/>Exact pinned location coordinates: ${end[0]}, ${end[1]}`);

        const fetchRoute = async () => {
          try {
            const [startLat, startLng] = start;
            const [endLat, endLng] = end;
            // Query OpenStreetMap Foot Routing API for campus walkways/shortcuts, fallback to standard OSRM driving profile
            let url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
            let response = await fetch(url);
            if (!response.ok) {
              url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
              response = await fetch(url);
            }
            if (!response.ok) throw new Error("Both routing services failed");
            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              const pathCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

              const polyline = L.polyline(pathCoordinates, {
                color: "#10b981",
                weight: 6,
                opacity: 0.85,
                lineJoin: "round"
              }).addTo(map);

              map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

              setRouteInfo({
                distance: (route.distance / 1000).toFixed(1),
                duration: Math.round(route.duration / 60),
                steps: route.legs[0].steps.map(step => step.maneuver.instruction)
              });
            }
          } catch (err) {
            console.error("OSRM route fetch failed", err);
            L.polyline([start, end], { color: "#ef4444", dashArray: "6, 12", weight: 4 }).addTo(map);
            setRouteInfo({
              distance: "Simulated",
              duration: 15,
              steps: ["Head straight from Depot office toward the reported complaint coordinates."]
            });
          } finally {
            setLoadingRoute(false);
          }
        };

        fetchRoute();
      } else {
        // If no GPS, do not route. Just set empty states.
        setRouteInfo({
          distance: "N/A",
          duration: 0,
          steps: []
        });
        setLoadingRoute(false);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.warn("Cleanup error removing map instance:", err);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [selectedTask]);

  const handleResolve = async (complaintId) => {
    if (!window.confirm("Mark this task as Resolved?")) return;
    try {
      await updateComplaintStatus(complaintId, "Resolved");
      setToast({ message: "Task marked as Resolved!", type: "success" });
      loadTasks();
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to update status";
      setToast({ message: errMsg, type: "error" });
    }
  };

  const handleWasteChange = (e) => {
    const { name, value } = e.target;
    if (name === "route_select") {
      if (value) {
        const [rId, aId] = value.split("|");
        setWasteForm((prev) => ({ ...prev, route_id: rId, assign_id: aId }));
      } else {
        setWasteForm((prev) => ({ ...prev, route_id: "", assign_id: "" }));
      }
    } else {
      setWasteForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleWasteSubmit = async (e) => {
    e.preventDefault();
    if (!wasteForm.route_id) {
      setToast({ message: "Please select an assigned route", type: "error" });
      return;
    }
    setRecording(true);
    try {
      await submitWasteRecord({
        route_id: Number(wasteForm.route_id),
        assign_id: wasteForm.assign_id ? Number(wasteForm.assign_id) : null,
        waste_type: wasteForm.waste_type || null,
        weight_kg: Number(wasteForm.weight_kg)
      });
      setToast({ message: "Waste record logged successfully!", type: "success" });
      setWasteForm({ route_id: "", assign_id: "", waste_type: "", weight_kg: "" });
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to record waste";
      setToast({ message: errMsg, type: "error" });
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2>Employee Dashboard</h2>
          <p style={{ color: "var(--text-muted)" }}>Manage your assigned collection routes and log waste deposits.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontWeight: "700", color: "var(--dark)" }}>{user.name}</span>
          <div className="badge badge-inprogress" style={{ display: "block", fontSize: "0.7rem", marginTop: "4px" }}>
            {user.role}
          </div>
        </div>
      </div>

      <div className="grid-sidebar" style={{ alignItems: "start" }}>
        {/* Tasks List Table */}
        <div className="card">
          <h3 style={{ fontSize: "1.25rem", borderBottom: "2px solid var(--primary)", paddingBottom: "0.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
            Your Assigned Tasks
          </h3>

          <div className="table-wrapper">
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <div className="skeleton" style={{ height: "45px", marginBottom: "0.5rem" }}></div>
                <div className="skeleton" style={{ height: "45px" }}></div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No Active Assignments</div>
                <p className="empty-state-desc">You are all caught up! Check back later for new tasks from your manager.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "90px" }}>Comp. ID</th>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Description</th>
                    <th style={{ width: "120px" }}>Status</th>
                    <th style={{ width: "155px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const isCompleted = t.status === "Resolved" || t.status === "Closed";
                    return (
                      <tr key={t.complaint_id}>
                        <td><strong>#{t.complaint_id}</strong></td>
                        <td>
                          {t.route_name || "General"}
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Route ID: {t.route_id || "N/A"}</div>
                        </td>
                        <td>{t.vehicle_no || "N/A"}</td>
                        <td style={{ textAlign: "left" }}>{t.description || "General collection task"}</td>
                        <td>
                          <span className={`badge badge-${(t.status || "unknown").toLowerCase().replace(/\s+/g, "")}`}>
                            {t.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                              onClick={() => handleResolve(t.complaint_id)}
                              disabled={isCompleted}
                            >
                              Resolve
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ 
                                padding: "0.4rem 0.8rem", 
                                fontSize: "0.8rem", 
                                backgroundColor: "var(--secondary)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem"
                              }}
                              onClick={() => handleOpenMap(t)}
                              disabled={loadingMap && selectedTask?.complaint_id === t.complaint_id}
                            >
                              {loadingMap && selectedTask?.complaint_id === t.complaint_id ? "📍 Locating..." : "🗺️ Map"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Record Waste Side Card */}
        <aside className="card">
          <h3 style={{ fontSize: "1.25rem", borderBottom: "2px solid var(--secondary)", paddingBottom: "0.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
            Record Waste Collected
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
            Log total deposits of gathered garbage by Route ID after processing collection tasks.
          </p>

          <form onSubmit={handleWasteSubmit} style={{ background: "transparent", padding: 0, boxShadow: "none", maxWidth: "100%" }}>
            <div className="form-group">
              <label>Assigned Route</label>
              <select
                name="route_select"
                className="form-control"
                value={wasteForm.route_id ? `${wasteForm.route_id}|${wasteForm.assign_id || ""}` : ""}
                onChange={handleWasteChange}
                required
                disabled={recording}
              >
                <option value="">-- Select Assigned Route --</option>
                {tasks.map((t) => (
                  <option key={t.assign_id || t.route_id} value={`${t.route_id}|${t.assign_id || ""}`}>
                    {t.route_name || `Route #${t.route_id}`} (ID: {t.route_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Waste Type</label>
              <input 
                type="text" 
                name="waste_type" 
                className="form-control" 
                value={wasteForm.waste_type} 
                onChange={handleWasteChange} 
                placeholder="e.g. Mixed Waste, Recyclable"
                disabled={recording}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label>Weight (kg)</label>
              <input 
                type="number" 
                step="0.01"
                name="weight_kg" 
                className="form-control" 
                value={wasteForm.weight_kg} 
                onChange={handleWasteChange} 
                placeholder="e.g. 250.5"
                required 
                disabled={recording}
              />
            </div>

            <button type="submit" className="btn btn-secondary" style={{ width: "100%" }} disabled={recording}>
              {recording ? "Saving Record..." : "Submit Waste Deposit"}
            </button>
          </form>
        </aside>
      </div>

      {/* Map Modal */}
      {selectedTask && (
        <div className="map-modal-overlay">
          <div className="map-modal">
            <div className="map-modal-header">
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>
                🗺️ Dispatch Route: Ticket #{selectedTask.complaint_id}
              </h3>
              <button 
                onClick={() => setSelectedTask(null)}
                style={{ padding: "0.25rem 0.5rem", fontSize: "1.2rem", fontWeight: "800", cursor: "pointer", border: "none", background: "transparent", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>
            <div className="map-modal-body">
              <div className="map-container" ref={mapContainerRef}></div>
              <div className="map-sidebar">
                <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                  <h4 style={{ fontSize: "1rem", color: "var(--dark)", marginBottom: "4px", fontWeight: "700" }}>Navigation Summary</h4>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Route from Zone Depot office</span>
                </div>

                {!(selectedTask.latitude && selectedTask.longitude) ? (
                  <div style={{ 
                    backgroundColor: "#fef3c7", 
                    border: "1px solid #f59e0b", 
                    borderRadius: "var(--radius-sm)", 
                    padding: "1rem", 
                    color: "#b45309", 
                    fontSize: "0.8rem",
                    textAlign: "left"
                  }}>
                    <strong style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem" }}>⚠️ GPS Coordinates Missing</strong>
                    The citizen did not pin their exact location on the map. Please refer to the text address below to locate the waste.
                  </div>
                ) : loadingRoute ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="skeleton" style={{ height: "60px", borderRadius: "var(--radius-sm)" }}></div>
                    <div className="skeleton" style={{ height: "60px", borderRadius: "var(--radius-sm)" }}></div>
                  </div>
                ) : (
                  <>
                    <div className="route-metric">
                      <span style={{ fontSize: "1.5rem" }}>⏱️</span>
                      <div>
                        <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--dark)" }}>{routeInfo.duration} mins</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Est. Travel Time</div>
                      </div>
                    </div>

                    <div className="route-metric">
                      <span style={{ fontSize: "1.5rem" }}>📈</span>
                      <div>
                        <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--dark)" }}>{routeInfo.distance} km</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Distance</div>
                      </div>
                    </div>
                  </>
                )}

                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: "130px" }}>
                  <div className="route-steps-title">📋 Driving Instructions</div>
                  <div className="route-steps">
                    {!(selectedTask.latitude && selectedTask.longitude) ? (
                      <p style={{ fontStyle: "italic", fontSize: "0.75rem", color: "var(--text-muted)" }}>No map route is active. Follow target address below.</p>
                    ) : loadingRoute ? (
                      <p style={{ fontStyle: "italic", fontSize: "0.75rem", color: "var(--text-muted)" }}>Calculating directions...</p>
                    ) : routeInfo.steps.length === 0 ? (
                      <p style={{ fontStyle: "italic", fontSize: "0.75rem", color: "var(--text-muted)" }}>No routing directions found.</p>
                    ) : (
                      routeInfo.steps.map((step, idx) => (
                        <div key={idx} className="route-step-item">
                          <strong>{idx + 1}.</strong> {step}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "1rem", fontSize: "0.85rem", textAlign: "left" }}>
                  <strong style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Target Address:</strong>
                  <p style={{ fontWeight: "700", color: "var(--dark)", marginTop: "2px" }}>{selectedTask.location || "N/A"}</p>
                </div>

                <button 
                  onClick={() => setSelectedTask(null)} 
                  className="btn btn-secondary" 
                  style={{ width: "100%", marginTop: "auto" }}
                >
                  Close Navigation
                </button>
              </div>
            </div>
          </div>
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

export default EmployeeDashboard;
