<p align="center">
  <img src="assets/banner.png" alt="WasteTrack Banner" width="100%">
</p>

   #       ♻️ WasteTrack – Smart Waste Management System

<div align="center">

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white) ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white) ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white) ![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white) ![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

### 🌍 Building Smarter Cities Through Digital Waste Management

*A modern role-based municipal waste management platform that streamlines complaint registration, employee coordination, waste collection, analytics, and administrative monitoring.*

</div>

---

# 📖 Overview

**WasteTrack** is a full-stack Smart Waste Management System developed to digitize the complete municipal waste management workflow. The platform connects **Citizens**, **Sanitation Employees**, **Managers**, and **Administrators** through a centralized role-based system, improving transparency, operational efficiency, and complaint resolution.

Designed as both an academic DBMS project and a portfolio-ready web application, WasteTrack demonstrates practical implementation of modern full-stack development, relational database design, and role-based system architecture.

---

# ✨ Key Features

### 👤 Citizen Portal
- Register and log in securely
- Submit waste-related complaints
- Select complaint location
- Track complaint status
- View complaint history
- Access public statistics dashboard

### 👷 Employee Dashboard
- Secure employee authentication
- View assigned complaints
- Update complaint progress
- Record waste collection details
- Resolve complaints
- View personal task history

### 👨‍💼 Manager Dashboard
*Managers can manage only their assigned department.*
- Department-wise complaint overview
- Assign complaints to employees
- Assign collection vehicles
- Monitor employee workload
- Manage department employees
- Department analytics
- Close completed complaints

### 🏛 Head / Admin Dashboard
*Complete administrative control.*
- Manage departments
- Search & filter employees
- Update employee roles
- Delete employee records
- Monitor city-wide complaints
- System-wide analytics
- Administrative reporting

---

# 🔐 Authentication & Authorization

WasteTrack follows a **Role-Based Access Control (RBAC)** architecture.

### Supported Roles
- 👤 Citizen
- 👷 Employee
- 👨‍💼 Manager
- 🏛 Head / Admin

### Authentication Features
- Express Session Authentication
- Password Encryption using bcrypt.js
- Protected Routes
- Department-Level Authorization
- Secure Role Validation

---

# 🧠 Core Algorithmic Engineering

### 1. Jaccard-Style Text Token Similarity Engine
To prevent operational bottlenecks from duplicate reports (e.g., multiple citizens reporting the same overflowing garbage container), the backend intercepts new tickets inside `complaintController.js` and parses them against active reports using a customized string token intersection check:

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
If a complaint clears this validation threshold, it transitions automatically into an `AI DUPLICATE` state, locking its lifecycle to the master ticket to avoid redundant fleet runs.

### 2. Balanced-Workload Queue Matching
To optimize delivery dispatch times, unique verified entries bypass dispatch bottlenecks via automated queries that determine which driver has the lightest workload in that zone:
```sql
SELECT e.emp_id, COUNT(c.complaint_id) AS active_load
FROM Employee e
LEFT JOIN Complaints c ON e.emp_id = c.assigned_emp AND c.status IN ('Open', 'In Progress')
WHERE e.dept_id = ? AND e.role = 'Employee'
GROUP BY e.emp_id ORDER BY active_load ASC LIMIT 1;
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
────────────────────────────────────
                 │
      Express.js REST Backend
                 │
Controllers → Services → Middleware
                 │
                 ▼
           MySQL Database
```

---

# ⚙️ Tech Stack

| Category | Technologies |
|-----------|--------------|
| **Frontend** | React, Vite, React Router, Context API, Axios, Chart.js, CSS3 |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL (Connection Pooling, Normalization, Database Views) |
| **Authentication** | Express Session, bcrypt.js, RBAC |
| **Development Tools** | Git, GitHub, npm, Postman |
| **Integrations** | Twilio Programmatic SMS Gateway API (`notifier.js`) |

---

# 📊 Database Schema Modeling

The application architecture utilizes a clean, 3NF normalized persistence layer enforcing strict relational integrity controls (`ON DELETE CASCADE`, `ON UPDATE CASCADE`).

```text
               +------------------+             +--------------------+
               |    Department    |1           *|      Vehicle       |
               +------------------+-------------+--------------------+
               | PK | dept_id     |             | PK | vehicle_id    |
               |    | name        |             | FK | dept_id       |
               | FK | manager_id  |----+        +--------------------+
               +------------------+    |                  |1
                        |1             |                  |
                        |              |                  |*
                        |* |        +--------------------+
               +------------------+    |        |    Assigned_To     |
               |     Employee     |    |        +--------------------+
               +------------------+    |        | PK | assign_id     |
               | PK | emp_id      |    |        | FK | emp_id        |
               | FK | dept_id     |    |        | FK | vehicle_id    |
               |    | role        |    |        | FK | route_id      |
               +------------------+    |        | FK | complaint_id  |
                        |1             |        +--------------------+
                        |              |                  |1
                        |* |                  |
               +------------------+    |                  |*
               |    Complaints    |    |        +--------------------+
               |------------------+    |        |    Waste_Record    |
               | PK | complaint_id|    |        +--------------------+
               | FK | dept_id     |    |        | PK | record_id     |
               | FK | route_id    |    |        | FK | route_id      |
               | FK | assigned_emp|    |        | FK | assign_id     |
               | FK | duplicate_id|    |        +--------------------+
               +------------------+    |
                        |              |
                        +--------------+
```

---

# 📁 Project Structure

```text
WasteTrack/

├── frontend/
│   ├── src/
│   ├── components/
│   │   ├── ProtectedRoute.jsx
│   │   └── Toast.jsx
│   ├── pages/
│   │   ├── Complaints.jsx
│   │   ├── EmployeeDashboard.jsx
│   │   ├── Login.jsx
│   │   ├── ManagerDashboard.jsx
│   │   ├── Profile.jsx
│   │   ├── Register.jsx
│   │   ├── Stats.jsx
│   │   └── Welcome.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   ├── styles/
│   │   └── index.css
│   ├── App.jsx
│   └── main.jsx
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
│   ├── services/
│   ├── config/
│   │   └── db.js
│   ├── database/
│   ├── models/
│   └── utils/
│       └── notifier.js
│
├── database_setup.sql
├── package.json
└── README.md
```

---

# 🔄 Complaint Workflow

```text
Citizen
    │
Submit Complaint
    │
Complaint Registered (Algorithmic Text-Similarity Deduplication Running)
    │
Assigned to Department (Balanced-Workload Queue Selector Checking Drivers)
    │
Manager Assigns Employee (Optional Manager Re-Route / Vehicle Mapping Override)
    │
Employee Collects Waste (Live Telemetry Transmitted via Twilio SMS)
    │
Complaint Resolved (Employee Logs Container Weight - `weight_kg`)
    │
Dashboard Analytics Updated (Chart.js Elements Re-Fetch from Materialized SQL Views)
```

---

# 📊 Dashboard Analytics

Interactive dashboards provide insights into:
- Total Complaints
- Pending Complaints
- Resolved Complaints
- Department Performance
- Employee Performance
- Waste Collection Statistics (`weight_kg` logs)
- Vehicle Usage
- Complaint Trends

---

# 🌟 Project Highlights

- ✅ Modern React Single Page Application
- ✅ Role-Based Dashboards
- ✅ Secure Authentication & Authorization
- ✅ RESTful API Architecture
- ✅ Department-Based Access Control
- ✅ Employee & Vehicle Management
- ✅ Complaint Lifecycle Tracking
- ✅ Interactive Analytics Dashboard
- ✅ Responsive User Interface
- ✅ Clean & Modular Codebase

---

# 🚀 Getting Started

### Clone the Repository

```bash
git clone [https://github.com/vedantvarma19/Waste-Track-.git](https://github.com/vedantvarma19/Waste-Track-.git)
```

### Create Environment File
Configure a `.env` file within your root server directory:
```env
MYSQL_HOST=localhost
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=eco_route_manager
MYSQL_PORT=3306
SESSION_SECRET=your_session_secret

# Optional Outbound Telemetry Configurations
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

### Backend

```bash
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 📷 Screenshots

> Add screenshots after uploading them to the repository.

- 🏠 Landing Page
- 👤 Citizen Dashboard
- 👷 Employee Dashboard
- 👨‍💼 Manager Dashboard
- 🏛 Admin Dashboard
- 📊 Analytics Dashboard
- 📋 Complaint Tracking

---

# 🎯 Future Enhancements

- 🗺 Google Maps Integration
- 🚛 Live Vehicle Tracking
- 📍 GPS-Based Complaint Location
- 🔔 Email & SMS Notifications
- 📷 Before & After Complaint Images
- 📱 Progressive Web App (PWA)
- 🤖 AI-Based Complaint Classification
- 🌡 Complaint Heatmaps
- ⚡ Real-Time Dashboard using WebSockets

---

# 📚 Learning Outcomes

This project strengthened my understanding of:
- Full-Stack Web Development
- React & Modern Frontend Architecture
- REST API Development
- Authentication & Authorization
- Role-Based Access Control (RBAC)
- Express.js Backend Development
- MySQL Database Design
- SQL Relationships & Normalization
- Dashboard Development
- API Integration
- Clean Project Architecture
- Git & GitHub Workflow

---

# 🚀 Project Journey

WasteTrack was originally developed as part of the **Database Management Systems (DBMS)** course to apply core database concepts—including relational modeling, normalization, SQL queries, constraints, and transaction management—to a real-world problem.

The project was later redesigned into a modern full-stack application using **React**, **Vite**, **Express.js**, and **MySQL**. Features such as role-based dashboards, complaint assignment workflows, employee and vehicle management, analytics, and a responsive user interface were added to transform it into a portfolio-ready smart-city solution.

Today, WasteTrack showcases both strong database engineering fundamentals and modern web development practices through a scalable, role-based architecture.


By - Vedant Varma,
College : University Visvesvaraya College of Engineering (UVCE),
Branch : Information Science Enginerring ,
USN : U25UV24T064065 ,
gmail : vedantvarma617@gmail.com
**

---

# ⭐ Support

If you found this project useful:
- ⭐ Star this repository
- 🍴 Fork the project
- 💡 Suggest improvements
- 🐞 Report issues

---

<div align="center">

### ♻️ Making Cities Cleaner, Smarter, and More Sustainable

**Built with ❤️ using React, Express.js, Node.js & MySQL**

</div>
