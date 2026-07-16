<p align="center">
  <img src="assets/banner.png" alt="WasteTrack Banner" width="100%">
</p>

# ♻️ WasteTrack – Smart Waste Management System

<div align="center">

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white) ![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white) ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white) ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white) ![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white) ![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

### 🌍 Building Smarter Cities Through Digital Waste Management & Live Telemetry

*A modern, production-ready, role-based municipal waste management platform that streamlines citizen complaint registrations, exact GPS location pinning, live employee telemetry routing, waste collection logging, and administrative monitoring.*

</div>

---

# 📖 Overview

**WasteTrack** is a production-deployed, full-stack Smart Waste Management System designed to digitize the complete municipal sanitation workflow. The platform connects **Citizens**, **Sanitation Employees (Drivers/Cleaners)**, **Zone Managers**, and **Administrators** through a secure, centralized role-based ecosystem, improving public transparency and operational logistics.

The system incorporates **OpenStreetMap & Leaflet geolocation mappings**, a **Jaccard similarity duplicate detection engine**, a **balanced workload queue selection algorithm**, and **real-time SMS gateways** to resolve urban sanitation challenges.

---

# ✨ Key Features

### 👤 Citizen Portal
- **Leaflet Interactive Map Pinning:** Drag and drop a red map pin marker (or click anywhere on the map) to pin the exact coordinates of the waste site.
- **HTML5 Geolocation Integration:** Click `"Pin My Current GPS Location"` to fetch live device coordinates automatically, updating the button to a green **`✓ Location Pinned`** status badge.
- **Auto-depot Centering:** Selecting a zone automatically pans the map to that zone's regional depot to assist manual pinning.
- **Track Status & Alerts:** View live complaint resolution progress, assigned driver details, vehicle registration logs, and notifications.

### 👷 Employee Dashboard
- **Live Driver Geolocation Start:** Instantly maps the route starting directly from the **driver's live position (truck icon `🚛`)** instead of a distant corporate depot.
- **Campus Pathway Foot Routing:** Uses the **FOSSGIS OpenStreetMap Foot Routing Engine** to plot navigation paths along actual pedestrian pathways, walkways, and campus shortcuts (such as inside the UVCE campus), preventing roads-only snapping gaps and building-crossing errors.
- **Simulated Route Fallbacks:** Automatically draws straight-line dotted navigation paths if routing APIs hit network constraints.
- **Waste Weight Logging:** Record exact garbage metrics (`weight_kg`) and waste types (Hazardous, Plastic, Organic, Recyclable) upon resolving tasks.

### 👨💼 Manager Dashboard
*Managers manage only their assigned municipal zone (South, West, East, North, Central).*
- **Balanced Workload Driver Assignment:** Automated dispatch query recommends the driver in the department currently carrying the lightest active queue.
- **Zonal Personnel Management:** Register, monitor, and delete sanitation personnel within their respective zones.
- **Operational Cockpit:** Re-assign drivers, register municipal collection vehicles, override dispatch targets, and review complaints.

### 🏛 Head / Admin Dashboard
*System-wide administrative control.*
- **Role Escalations:** Manage, promote, and update worker clearance roles (Employee, Manager, Head, Admin).
- **Zonal Auditing:** Filter, search, and audit employee databases across all regional zones.
- **Staff Purging:** Safely delete obsolete employee accounts while preserving referential database constraint logs.

---

# 🧠 Core Algorithmic Engineering

### 1. Jaccard-Style Text Token Similarity Engine
To prevent duplicate complaint registrations from flooding sanitation queues (e.g. multiple citizens reporting the same overflowing container), the backend parses incoming tickets against active zone reports:

$$\text{Similarity Score} = \frac{|\text{Tokens}_{\text{New Submitted}} \cap \text{Tokens}_{\text{Active Archive}}|}{|\text{Tokens}_{\text{New Submitted}} \cup \text{Tokens}_{\text{Active Archive}}|}$$

```javascript
// Internal text similarity matrix checking system
const descSimilarity = computeSimilarity(description, activeTicket.description);
const locSimilarity = location && activeTicket.location ? computeSimilarity(location, activeTicket.location) : 0.5;
const combinedScore = (descSimilarity * 0.7) + (locSimilarity * 0.3);

if (combinedScore >= 0.40) {
    duplicateOfId = activeTicket.complaint_id; // Merges the ticket state to eliminate redundant fleet vehicle runs
}
```
Duplicates are closed automatically and linked as `AI DUPLICATE`, merging their lifecycles to save fuel and collection resources.

### 2. Balanced-Workload Queue Matching
Bypasses manual dispatcher bottlenecks by matching new tickets to the sanitation driver with the lightest current active workload:
```sql
SELECT e.emp_id, COUNT(c.complaint_id) AS active_load
FROM Employee e
LEFT JOIN Complaints c ON e.emp_id = c.assigned_emp AND c.status IN ('Open', 'In Progress')
WHERE e.dept_id = ? AND e.role = 'Employee'
GROUP BY e.emp_id ORDER BY active_load ASC LIMIT 1;
```

### 3. Pedestrian & Campus Pathway Navigation
Utilizes OpenStreetMap FOSSGIS walking profile routing to trace pathways inside campus grounds and off-road sites:
```javascript
let url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
```

---

# 🏗 System Architecture

```text
       Citizen / Employee / Manager / Admin
                        │
                        ▼
               React + Vite Frontend
                        │
             React Router + Context API
                        │
                     Axios
                        │
─────────────────────────────────────────────
                        │
             Express.js REST Backend
                        │
    Controllers → Services → Middleware
                        │
                        ▼
           MySQL Database (Aiven.io)
```

---

# ⚙️ Tech Stack

| Category | Technologies |
|-----------|--------------|
| **Frontend** | React, Vite, React Router, Context API, Axios, Leaflet, Chart.js, CSS3 |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL (Connection Pooling, Database Views, 3NF Casing Normalization) |
| **Authentication** | Express Session, bcrypt.js (SALT factor 10), RBAC |
| **Integrations** | Twilio Programmatic SMS Gateway API (`notifier.js`) |
| **Deployment** | GitHub, Render.com, Aiven.io, Clever Cloud |

---

# 📊 Database Schema & Views

The relational layer utilizes a clean, 3NF normalized database schema enforcing strict referential integrity (`ON DELETE SET NULL`, `ON UPDATE CASCADE`).

To ensure complete compatibility with Linux production hosts (like Render.com), all database Views and Foreign Key references are built using strict, case-sensitive naming conventions:

* **`v_employee_tasks`**: Materializes assignment and routing logs, feeding live coordinate metrics to the driver app.
* **`v_pending_complaints`**: Lists open citizen reports.
* **`v_waste_collection_stats`**: Summarizes collection weight records.
* **`v_vehicle_usage`**: Audits regional vehicle workloads.
* **`v_department_summary`**: Provides manager analytics summaries.

---

# 📁 Project Structure

```text
WasteTrack/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Toast.jsx
│   │   ├── pages/
│   │   │   ├── Complaints.jsx       # Citizen interactive map portal
│   │   │   ├── EmployeeDashboard.jsx# Worker task dashboard & walking map
│   │   │   ├── Login.jsx
│   │   │   ├── ManagerDashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Stats.jsx            # Stable Chart.js insights panel
│   │   │   └── Welcome.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   └── index.css            # Responsive layouts & animations
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── dist/                        # Compiled production assets
│
├── server/
│   ├── controllers/
│   │   ├── complaintController.js
│   │   ├── dataController.js
│   │   ├── employeeController.js
│   │   ├── viewController.js
│   │   └── wasteController.js
│   ├── routes/
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── config/
│   │   └── db.js                    # Lazy pool proxy & automatic fallback
│   ├── utils/
│   │   └── notifier.js              # Twilio API driver & caller verification
│   └── server.js
│
├── database_setup.sql                # Linux-compatible database migrations
├── package.json                      # Monorepo prefix setup and startup commands
└── README.md
```

---

# 🔄 Complaint Lifecycle

```text
Citizen Submit ──► text deduplication ──► auto driver queue ──► Twilio SMS alert
                                                                      │
                                                                      ▼
waste log weight ◄── resolved state ◄── live telemetry routing ◄── assign truck
```

---

# 🌟 Project Highlights

- **✅ Dual-Map Interface:** Seamless Leaflet map integrations for both citizen reporting (exact pinning) and worker navigation (live routing).
- **✅ Cross-Platform Database:** Standardized MySQL casing schema which runs out-of-the-box on Windows local hosts and Linux production systems.
- **✅ Self-Healing Database Schema:** Express backend queries column states on boot and runs automatic hot-migrations (`ALTER TABLE`) if coordinates fields are missing.
- **✅ Persistent Chart.js Lifecycles:** Stats timelines are stabilized using absolute loading skeletons stacked over permanent DOM canvases, eliminating null-ref crashes on daily/monthly toggles.
- **✅ Graceful SMS Gateways:** Twilio API sanitizes phone numbers and catches caller ID trial restriction codes (Error `21608`) dynamically, logging them to the database instead of throwing exceptions.
- **✅ Unified Production Server:** Node.js backend serves React production assets out of the box (`frontend/dist`), eliminating the need to host separate web and API servers.

---

# 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/vedantvarma19/Waste-Track-.git
cd Waste-Track-
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=eco_route_manager
MYSQL_PORT=3306
SESSION_SECRET=your_session_secret

# Optional Twilio Outbound Telemetry
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

### 3. Run Locally (Development)
To run both backend and frontend servers in development mode:
```bash
# In Root (Boots Backend)
npm run dev

# In frontend/ (Boots React Client)
cd frontend
npm run dev
```

### 4. Deploying to Production (Render & Aiven)
To build and host both servers together:
```bash
# Build React bundle and bundle backend dependencies
npm run build

# Start Production Server
npm start
```

---

# 📚 Learning Outcomes

- **Full-Stack Orchestration:** Express serving dynamic API routes alongside SPA static frontend bundles.
- **Relational Integrity Casing:** Designing database views and queries with case-sensitive syntax for seamless Linux deployment.
- **UI/UX Lifecycle Management:** Managing canvas destruction and asynchronous state locks during interactive chart toggles.
- **Practical API Engineering:** Standardizing geolocation structures and building fail-safe fallbacks for outbound programmatic SMS gateways.

---

# 🚀 Project Journey

WasteTrack was originally developed as part of the **Database Management Systems (DBMS)** course to apply relational modeling, normalizations, and transaction management to municipal waste collection. 

It was later redesigned into a modern full-stack web application with role-based dashboard cockpits, balanced queue allocations, Leaflet interactive mapping coordinates, and live OSRM/OSM walkway routing systems to turn it into a portfolio-ready smart-city logistics solution.

**By - Vedant Varma**
* **College:** University Visvesvaraya College of Engineering (UVCE)
* **Branch:** Information Science Engineering
* **USN:** U25UV24T064065
* **Email:** vedantvarma617@gmail.com

---

<div align="center">

### ♻️ Making Cities Cleaner, Smarter, and More Sustainable
**Built with ❤️ using React, Express.js, Leaflet, Node.js & MySQL**

</div>
