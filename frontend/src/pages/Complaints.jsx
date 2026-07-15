// frontend/src/pages/Complaints.jsx
import React, { useState, useEffect, useRef } from "react";
import { fetchDepartments, fetchRoutesByDept, submitComplaint, filterComplaints } from "../services/api";
import Toast from "../components/Toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon paths in built applications
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEPOT_COORDINATES = {
  1: [12.9226, 77.5933], // South Zone Depot (Jayanagar Area)
  2: [13.0232, 77.5697], // West Zone Depot (Yeshwanthpur Area)
  3: [12.9756, 77.6358], // East Zone Depot (Indiranagar Area)
  4: [13.0382, 77.5921], // North Zone Depot (Hebbal Area)
  5: [12.9740, 77.6010]  // Central Zone Depot (MG Road Area)
};

const Complaints = () => {
  const [departments, setDepartments] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    citizen_name: "",
    contact_no: "",
    location: "",
    dept_id: "",
    route_id: "",
    description: "",
    latitude: null,
    longitude: null
  });

  // Filters state
  const [filters, setFilters] = useState({
    status: "",
    date: ""
  });

  // Notification state
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [geolocating, setGeolocating] = useState(false);
  const [locationPinned, setLocationPinned] = useState(false);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const depts = await fetchDepartments();
        setDepartments(depts);
      } catch (err) {
        console.error("Failed to load departments", err);
      }
      loadComplaintsList();
    };
    loadInitialData();
  }, []);

  // Initialize interactive Leaflet map for citizen location selection
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center: Central Bangalore
    const defaultCenter = [12.9716, 77.5946];

    const map = L.map(mapContainerRef.current).setView(defaultCenter, 12);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Draggable red pin
    const pinIcon = L.divIcon({
      html: `<span style="font-size: 2.2rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">📍</span>`,
      className: "custom-map-icon",
      iconSize: [35, 35],
      iconAnchor: [17, 34]
    });

    const marker = L.marker(defaultCenter, { icon: pinIcon, draggable: true }).addTo(map);
    markerRef.current = marker;

    // Drag marker updates coordinates
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setFormData((prev) => ({
        ...prev,
        latitude: Number(pos.lat.toFixed(6)),
        longitude: Number(pos.lng.toFixed(6))
      }));
      setLocationPinned(true);
    });

    // Map click moves marker and updates coordinates
    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      setFormData((prev) => ({
        ...prev,
        latitude: Number(e.latlng.lat.toFixed(6)),
        longitude: Number(e.latlng.lng.toFixed(6))
      }));
      setLocationPinned(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const loadComplaintsList = async (activeFilters = {}) => {
    setLoadingComplaints(true);
    try {
      const data = await filterComplaints(activeFilters);
      setRecentComplaints(data);
    } catch (err) {
      console.error("Failed to load complaints", err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleDeptChange = async (e) => {
    const deptId = e.target.value;
    setFormData((prev) => ({ ...prev, dept_id: deptId, route_id: "" }));
    setRoutes([]);

    // Pan map to chosen zone center to help user pin quickly, but keep coordinates null until explicitly pinned
    if (deptId && mapInstanceRef.current && markerRef.current) {
      const center = DEPOT_COORDINATES[deptId] || [12.9716, 77.5946];
      mapInstanceRef.current.setView(center, 14);
      markerRef.current.setLatLng(center);
      setFormData((prev) => ({
        ...prev,
        latitude: null,
        longitude: null
      }));
      setLocationPinned(false);
    }

    if (deptId) {
      try {
        const data = await fetchRoutesByDept(deptId);
        setRoutes(data);
      } catch (err) {
        console.error("Failed to load routes", err);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setToast({ message: "Geolocation is not supported by your browser.", type: "error" });
      return;
    }

    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coords = [latitude, longitude];

        // Pan map and place marker at current location
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView(coords, 16);
          markerRef.current.setLatLng(coords);
        }

        setFormData((prev) => ({
          ...prev,
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6))
        }));
        setLocationPinned(true);

        if (accuracy > 150) {
          setToast({ 
            message: `Coordinates captured, but accuracy is low (~${Math.round(accuracy)}m). Drag the red map pin to adjust it precisely.`, 
            type: "warning" 
          });
        } else {
          setToast({ message: "High-precision GPS coordinates captured successfully!", type: "success" });
        }
        setGeolocating(false);
      },
      (error) => {
        console.error("Geolocation fetch error", error);
        let errorMsg = "Could not verify GPS coordinates. Please drag the red map pin to your location manually.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permission denied. Please enable location access or drag the red map pin to your hostel manually.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out. Please drag the red map pin to your hostel manually.";
        }
        setToast({ message: errorMsg, type: "error" });
        setGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dept_id) {
      setToast({ message: "Please select a department", type: "error" });
      return;
    }

    try {
      const res = await submitComplaint({
        citizen_name: formData.citizen_name,
        contact_no: formData.contact_no,
        location: formData.location || "N/A",
        description: formData.description,
        dept_id: Number(formData.dept_id),
        route_id: formData.route_id ? Number(formData.route_id) : null,
        latitude: formData.latitude,
        longitude: formData.longitude
      });

      setToast({
        message: res.message || `Complaint submitted successfully! (ID: ${res.complaint_id})`,
        type: res.merged ? "warning" : "success"
      });

      // Reset form
      setFormData({
        citizen_name: "",
        contact_no: "",
        location: "",
        dept_id: "",
        route_id: "",
        description: "",
        latitude: null,
        longitude: null
      });
      setLocationPinned(false);
      setRoutes([]);
      
      // Reset map marker to center
      if (mapInstanceRef.current && markerRef.current) {
        const defaultCenter = [12.9716, 77.5946];
        mapInstanceRef.current.setView(defaultCenter, 12);
        markerRef.current.setLatLng(defaultCenter);
      }

      loadComplaintsList();
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to submit complaint";
      setToast({ message: errMsg, type: "error" });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    const activeParams = {};
    if (filters.status) activeParams.status = filters.status;
    if (filters.date) activeParams.date = filters.date;
    loadComplaintsList(activeParams);
  };

  const clearFilters = () => {
    setFilters({ status: "", date: "" });
    loadComplaintsList({});
  };

  return (
    <div className="fade-in">
      <div style={{ maxWidth: "850px", margin: "0 auto 3rem auto" }}>
        <h2 style={{ marginBottom: "1.5rem" }}>Submit Waste Complaint</h2>
        
        <form onSubmit={handleSubmit} className="card flex flex-col gap-1" style={{ padding: "2rem" }}>
          <div className="grid-2">
            <div className="form-group">
              <label>Your Name</label>
              <input 
                type="text" 
                name="citizen_name" 
                className="form-control" 
                value={formData.citizen_name} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Contact Number</label>
              <input 
                type="text" 
                name="contact_no" 
                className="form-control" 
                value={formData.contact_no} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Location (Street Address, Landmarks)</label>
            <input 
              type="text" 
              name="location" 
              className="form-control" 
              value={formData.location} 
              onChange={handleChange} 
              placeholder="e.g. 4th Cross Jayanagar, near hostel main gate" 
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Responsible Zone/Department</label>
              <select 
                name="dept_id" 
                className="form-control" 
                value={formData.dept_id} 
                onChange={handleDeptChange} 
                required
              >
                <option value="">-- Select Zone --</option>
                {departments.map((d) => (
                  <option key={d.dept_id} value={d.dept_id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Local Route (Optional)</label>
              <select 
                name="route_id" 
                className="form-control" 
                value={formData.route_id} 
                onChange={handleChange}
                disabled={!formData.dept_id}
              >
                <option value="">-- Select Route --</option>
                {routes.map((r) => (
                  <option key={r.route_id} value={r.route_id}>{r.route_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Map Geolocation Section */}
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label style={{ margin: 0 }}>📍 Pin Exact Collection Point</label>
              <button
                type="button"
                className={locationPinned ? "btn btn-primary" : "btn btn-secondary"}
                style={{ 
                  padding: "0.4rem 0.8rem", 
                  fontSize: "0.8rem", 
                  height: "auto",
                  backgroundColor: locationPinned ? "#10b981" : "var(--secondary)",
                  color: "white",
                  borderColor: locationPinned ? "#10b981" : "var(--secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem"
                }}
                onClick={handleGetLocation}
                disabled={geolocating}
              >
                {geolocating ? (
                  "📍 Locating..."
                ) : locationPinned ? (
                  <>✓ Location Pinned</>
                ) : (
                  "Pin My Current GPS Location"
                )}
              </button>
            </div>
            
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.75rem", textAlign: "left" }}>
              Drag the red map pin directly to your hostel/house or click anywhere on the map to set the exact collection coordinates for drivers.
            </p>

            <div 
              ref={mapContainerRef} 
              style={{ 
                height: "280px", 
                width: "100%", 
                borderRadius: "var(--radius-sm)", 
                border: "1px solid var(--border)",
                position: "relative",
                zIndex: 1
              }}
            ></div>

            {formData.latitude && formData.longitude && (
              <div style={{ marginTop: "0.5rem", textAlign: "left" }}>
                <span className="badge badge-resolved" style={{ fontSize: "0.75rem" }}>
                  ✓ Exact GPS Coordinates Pinned: {formData.latitude}, {formData.longitude}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Describe the Waste Issue</label>
            <textarea 
              name="description" 
              className="form-control" 
              rows="3" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="e.g., Large pile of plastic bottles gathered outside the gate." 
              required
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
            🚀 Submit Waste Complaint
          </button>
        </form>
      </div>

      {/* Recents list */}
      <div className="card">
        <h3 style={{ fontSize: "1.25rem", borderBottom: "2px solid var(--primary)", paddingBottom: "0.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
          Recent Public Complaints
        </h3>

        {/* Filters */}
        <form onSubmit={applyFilters} className="flex gap-2 align-center" style={{ marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <select 
            name="status" 
            className="form-control" 
            value={filters.status} 
            onChange={handleFilterChange}
            style={{ maxWidth: "160px" }}
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <input 
            type="date" 
            name="date" 
            className="form-control" 
            value={filters.date} 
            onChange={handleFilterChange}
            style={{ maxWidth: "180px" }}
          />

          <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 1.2rem" }}>
            Filter
          </button>
          
          {(filters.status || filters.date) && (
            <button type="button" onClick={clearFilters} className="btn btn-secondary" style={{ padding: "0.6rem 1.2rem" }}>
              Clear
            </button>
          )}
        </form>

        <div className="table-wrapper">
          {loadingComplaints ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <div className="skeleton" style={{ height: "40px", marginBottom: "0.5rem" }}></div>
              <div className="skeleton" style={{ height: "40px" }}></div>
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗑️</div>
              <div className="empty-state-title">No matching complaints found</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>ID</th>
                  <th>Citizen</th>
                  <th>Location</th>
                  <th>Description</th>
                  <th>Department</th>
                  <th style={{ width: "120px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map((c) => (
                  <tr key={c.complaint_id}>
                    <td><strong>#{c.complaint_id}</strong></td>
                    <td>{c.citizen_name}</td>
                    <td>{c.location}</td>
                    <td style={{ textAlign: "left", fontSize: "0.85rem" }}>{c.description}</td>
                    <td>{c.dept_name || c.department_name}</td>
                    <td>
                      <span className={`badge badge-${(c.status || "unknown").toLowerCase().replace(/\s+/g, "")}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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

export default Complaints;
