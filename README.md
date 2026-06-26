# ♻️ WasteTrack - Smart Waste Collection & Management System

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML](https://img.shields.io/badge/HTML-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)

A full-stack Smart Waste Collection & Management System designed to streamline municipal waste collection operations through role-based management, complaint handling, employee coordination, vehicle tracking, and real-time analytics.

</div>

---

# 📖 Overview

WasteTrack is a web-based management platform developed to digitize and automate the waste collection workflow for municipalities and organizations.

Instead of maintaining manual records, the system enables administrators, managers, and employees to manage waste collection efficiently through a centralized dashboard.

The application improves operational efficiency by providing:

- Centralized waste collection records
- Employee management
- Vehicle allocation
- Complaint management
- Waste tracking
- Analytics dashboard
- Role-based authentication

---

# ✨ Features

## 👤 Authentication & Authorization

- Secure Login System
- Session-based Authentication
- Password Encryption using bcrypt.js
- Role-Based Access Control (RBAC)

Supported Roles:

- Head/Admin
- Manager
- Employee

---

## 🚛 Waste Collection Management

- Track waste collection requests
- Assign collection tasks
- Update collection status
- Monitor completed collections
- Filter collections by location and waste type

---

## 🚚 Vehicle Management

- Register collection vehicles
- Assign vehicles to employees
- Track vehicle usage
- Manage vehicle availability

---

## 👨‍💼 Employee Management

- Add Employees
- Update Employee Details
- Assign Managers
- Allocate Shifts
- Track Employee Status

---

## 📢 Complaint Management

Citizens can report waste-related issues.

Managers can:

- View Complaints
- Assign Employees
- Update Complaint Status
- Mark Complaints as Resolved

---

## 📊 Analytics Dashboard

Interactive dashboard displaying:

- Total Employees
- Active Complaints
- Completed Collections
- Pending Collections
- Vehicle Statistics
- Waste Collection Reports

Built using Chart.js.

---

## 🗄 Database Design

The application uses a normalized MySQL database.

Features include:

- Foreign Key Relationships
- Cascading Constraints
- SQL Views
- Efficient Query Design
- Relational Data Integrity

---

# 🛠 Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript (ES6)
- Fetch API

### Backend

- Node.js
- Express.js

### Database

- MySQL

### Authentication

- Express Session
- bcrypt.js

### Charts

- Chart.js

### API Testing

- Postman

---

# 🏗 Project Architecture

```
Client
   │
   ▼
HTML • CSS • JavaScript
   │
Fetch API
   │
   ▼
Express.js Server
   │
Controllers
   │
Business Logic
   │
   ▼
MySQL Database
```

---

# 📂 Folder Structure

```
WasteTrack/

├── controllers/
├── routes/
├── middleware/
├── config/
├── database/
├── public/
│   ├── css/
│   ├── js/
│   └── images/
├── views/
├── app.js
├── package.json
└── README.md
```

---

# 🔐 Security Features

- Password Hashing using bcrypt
- Session Authentication
- Protected Routes
- Role-Based Access Control
- Input Validation
- Secure Database Queries

---

# 📈 Workflow

```
Citizen
     │
     ▼
Raise Complaint
     │
     ▼
Manager Reviews
     │
     ▼
Assign Employee
     │
     ▼
Waste Collection
     │
     ▼
Status Updated
     │
     ▼
Dashboard Analytics
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/waste-track.git
```

## Navigate

```bash
cd waste-track
```

## Install Dependencies

```bash
npm install
```

## Configure Database

Create a MySQL database and import the SQL file.

Update database credentials.

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=wastetrack
```

## Run

```bash
npm start
```

Server:

```
http://localhost:3000
```

---



# 🎯 Learning Outcomes

During this project, I gained practical experience with:

- Full Stack Development
- REST API Design
- Authentication & Authorization
- Session Management
- Database Design
- SQL Views
- CRUD Operations
- Dashboard Development
- Role-Based Systems
- MVC Architecture
- Backend Development with Node.js
- Express.js Routing
- MySQL Relationships

---

# Future Improvements

- JWT Authentication
- Email Notifications
- Google Maps Integration
- Real-Time Tracking
- QR Code Based Waste Collection
- Mobile Responsive UI
- Docker Deployment
- Cloud Hosting
- AI-based Waste Prediction
- Notification System

---

# 🤝 Contributing

Contributions, suggestions, and feature requests are welcome.

Feel free to fork the repository and create a Pull Request.

---

# 👨‍💻 Author

**Vedant Varma**

B.Tech Information Science Engineering

GitHub:
https://github.com/YOUR_USERNAME

LinkedIn:
https://linkedin.com/in/YOUR_LINKEDIN

---

# ⭐ Support

If you found this project useful,

⭐ Star the repository

🍴 Fork it

💡 Share your feedback
