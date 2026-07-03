🌍 **WasteTrack – Complete User Story**

### 🎯 **Goal**

To digitize the waste collection and vehicle management process for a city by creating a **centralized web platform** that connects **citizens, employees, and administrators**, improving operational efficiency and transparency.

---

### 🧑‍💻 **Actors in the System**

1. **Citizen/User**

   * Reports waste-related issues (e.g., uncollected garbage, overflowing bins).
   * Provides complaint details such as name, location, type of issue, and description.
   * Can track the complaint’s status (e.g., *Pending*, *In Progress*, *Resolved*).

2. **Administrator**

   * Manages employee and department details.
   * Reviews new complaints.
   * Assigns the complaint to a department (e.g., *Waste Collection Department*).
   * Allocates a vehicle and employee (driver or cleaner) for that route.
   * Monitors the progress of complaints and updates their resolution status.

3. **Employee (Driver / Cleaner / Technician)**

   * Logs in to view assigned routes or complaints.
   * Updates the status (e.g., *Reached site*, *Collection done*, *Resolved*).
   * Records departure and completion details.

4. **System (WasteTrack Database)**

   * Stores all user, employee, vehicle, department, route, and complaint data.
   * Maintains relationships between employees, vehicles, and routes.
   * Ensures accountability via timestamps and foreign key relations.

---

### ⚙️ **Flow of Operations (Step-by-Step)**

#### 🏙️ 1. **Citizen Submits Complaint**

* User fills a complaint form on the website (`complaint.html`).
* Inputs: name, contact, location (area), type of issue, description, date.
* Complaint is stored in the `Complaint` table with a default status = “Pending”.

#### 🧾 2. **Admin Reviews the Complaint**

* Admin dashboard lists all complaints.
* Admin assigns the complaint to a **Department** (like *Waste Collection* or *Recycling Unit*).

#### 🚛 3. **Department Takes Charge**

* The assigned department checks which vehicle and employees are available.
* Through the **Assigned_to** table, the admin links an *Employee* and *Vehicle*.
* A route (in the **Route** table) corresponding to the complaint’s location is chosen.
* The vehicle is linked to that route via **Serves** table.

#### 🧍‍♂️ 4. **Employee Executes the Task**

* Assigned employee logs in, sees the task (with location, vehicle ID, route).
* Employee departs (`departure_from` logged in **Assigned_to**).
* Once task is completed, status is updated to “Resolved”.

#### 📊 5. **Citizen Can Track Progress**

* The citizen can revisit the site and enter the complaint ID to track the current status.
* They may also view resolved history.

#### 🏁 6. **Admin Verifies & Closes**

* Admin verifies the completion via proof (photo or report).
* The complaint is marked as “Closed” and archived.

---

### 📈 **Result**

* Efficient tracking of waste collection.
* Reduced manual coordination.
* Real-time accountability (who, when, where).
* Transparent complaint resolution for citizens.

---

## 🧱 Updated Database Plan (Next Step)

Since you correctly noted that **routes** should represent **locations**, we’ll:

* Replace `from_loc` and `to_loc` in `Route` with just `location`.
* Add **AUTO_INCREMENT** where appropriate (`emp_id`, `dept_id`, `vehicle_id`, `route_id`, etc.).
* Prepare the schema for integration with your **Node.js backend**.

---
Perfect 👍 — you’ve done a **solid foundation** already:
✅ Database (8 linked tables)
✅ Working backend connection (`server.js`)
✅ Working frontend (complaint form + live table view)
✅ Proper directory structure

Now your final week’s task wants a *complete, impressive full-stack system* where:

1. All tables are **connected** (not just one).
2. You show **views + joins + aggregate queries**.
3. There’s a **clean frontend** (citizen/admin dashboard feel).

Let’s make a **step-by-step plan** so you can finish this properly and on time.

---

## 🧩 1️⃣ Phase 1 — Project Planning (Today)

### 🎯 Objective

Create a **clear connection map** between frontend <-> backend <-> MySQL.

### ✅ Tasks

* Keep your current `/api/complaints` working as your **base template**.
* Identify which tables you’ll actually show:

  * `Complaints` → Citizen page
  * `Employee`, `Vehicle`, `Route` → Admin page
  * `Department`, `Assigned_to`, `Waste_Record` → Analytics or Management section
* Decide what your **views** will show (example below 👇)

### 🧠 Suggestion for 5 SQL Views

| View Name                  | Description                                       | SQL Example                                                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v_pending_complaints`     | Show all pending complaints with route & employee | `SELECT c.*, e.name AS employee_name, r.route_name FROM complaints c LEFT JOIN employee e ON c.assigned_emp=e.emp_id LEFT JOIN route r ON c.route_id=r.route_id WHERE c.status='Open';`                                                   |
| `v_vehicle_usage`          | Vehicle assignment count & current status         | `SELECT v.vehicle_no, COUNT(a.assign_id) AS total_assignments, v.status FROM vehicle v LEFT JOIN assigned_to a ON v.vehicle_id=a.vehicle_id GROUP BY v.vehicle_no;`                                                                       |
| `v_department_summary`     | Total employees, total vehicles per department    | `SELECT d.name, COUNT(DISTINCT e.emp_id) AS total_employees, COUNT(DISTINCT v.vehicle_id) AS total_vehicles FROM department d LEFT JOIN employee e ON d.dept_id=e.dept_id LEFT JOIN vehicle v ON d.dept_id=v.dept_id GROUP BY d.dept_id;` |
| `v_waste_collection_stats` | Avg. waste collected per route                    | `SELECT r.route_name, AVG(w.weight_kg) AS avg_collected FROM waste_record w JOIN route r ON w.route_id=r.route_id GROUP BY r.route_name;`                                                                                                 |
| `v_employee_performance`   | No. of complaints handled by employee             | `SELECT e.name, COUNT(c.complaint_id) AS complaints_handled FROM employee e LEFT JOIN complaints c ON e.emp_id=c.assigned_emp GROUP BY e.name;`                                                                                           |

Each of these views can be connected to a simple table in your frontend via `/api/views/...` endpoints.

---

## ⚙️ 2️⃣ Phase 2 — Backend Expansion (Next 1–2 Days)

You’ll extend `server.js` as follows:

### 📂 Backend Directory Plan

```
source/
  backend/
    server.js
    db.js                ← (central MySQL pool)
    routes/
       complaints.js     ← existing
       employees.js
       vehicles.js
       views.js          ← to return view data
```

### 🛠 Steps

* Create `/api/employees`, `/api/vehicles`, `/api/routes` — all with `GET` + `POST`.
* Add `/api/views/<viewname>` to fetch data from created SQL views.
* Optional: `/api/stats` for aggregate data (like total complaints, resolved, pending).

Each route file can use this shared import:

```js
// db.js
const mysql = require("mysql2/promise");
module.exports = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "yourpassword",
  database: "eco_route_manager"
});
```

---

## 🎨 3️⃣ Phase 3 — Frontend UI (2–3 Days)

### 📁 Frontend Directory Plan

```
source/
  complaint.html        ← citizen view (done)
  admin.html            ← admin dashboard (manage all)
  stats.html            ← analytics of views
  style.css
```

### 💡 Suggestions

* Use simple **cards and tables** for UI using plain CSS or Tailwind (CDN link).
* **Admin Page Sections:**

  * Add New Employee / Vehicle (Forms)
  * View All Departments
  * View Complaints + Assign employee/vehicle dropdowns
* **Stats Page:**

  * Fetch `/api/views/...` data → Display in tables or charts (e.g., Chart.js).

---

## 📊 4️⃣ Phase 4 — Views + Analytics (1–2 Days)

After creating the 5 SQL views:

```sql
CREATE VIEW v_pending_complaints AS ...
CREATE VIEW v_vehicle_usage AS ...
...
```

Then in backend:

```js
app.get("/api/views/:name", async (req, res) => {
  const { name } = req.params;
  try {
    const [rows] = await pool.query(`SELECT * FROM ${name}`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "View fetch error" });
  }
});
```

Then in `stats.html`:

```js
async function loadView(name, tableId) {
  const res = await fetch(`/api/views/${name}`);
  const data = await res.json();
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = data.map(row =>
    `<tr>${Object.values(row).map(v => `<td>${v}</td>`).join('')}</tr>`
  ).join('');
}
loadView('v_vehicle_usage', 'vehicleUsageTable');
```

---

## 💻 5️⃣ Phase 5 — UI Polish & Demo Setup (Final 1–2 Days)

* Add logo/banner → “🌱 WasteTrack City Portal”
* Add buttons between pages (`complaint.html`, `admin.html`, `stats.html`)
* Add basic popup alerts (like “Inserted successfully!”)
* Test both **insert + reflection** (frontend and DB sync both ways)
* Prepare demo flow:

  1. Citizen adds complaint.
  2. Admin dashboard shows it.
  3. Status updated to “Resolved”.
  4. Stats page shows live update.

---

## 🔥 My Opinion

This structure will **impress your evaluators** because:

* It connects all tables logically.
* You’ll have **real working CRUD + analytics**.
* The views and UI give it a *professional admin dashboard* vibe.
* You’ll easily explain how the frontend reflects the DB and vice versa.

---

Would you like me to give you the **next actionable step** (i.e., code for Phase 2 backend expansion with multiple tables and view endpoints)?






following are the workflow and changes had to be done in the plan(give the full correct plan for the following):


earlier workflow and operations are fine:

 Actors in the System
Citizen/User

Reports waste-related issues (e.g., uncollected garbage, overflowing bins).
Provides complaint details such as name, location, type of issue, and description.
Can track the complaint’s status (e.g., Pending, In Progress, Resolved).
Administrator

Manages employee and department details.
Reviews new complaints.
Assigns the complaint to a department (e.g., Waste Collection Department).
Allocates a vehicle and employee (driver or cleaner) for that route.
Monitors the progress of complaints and updates their resolution status.
Employee (Driver / Cleaner / Technician)

Logs in to view assigned routes or complaints.
Updates the status (e.g., Reached site, Collection done, Resolved).
Records departure and completion details.
System (WasteTrack Database)

Stores all user, employee, vehicle, department, route, and complaint data.
Maintains relationships between employees, vehicles, and routes.
Ensures accountability via timestamps and foreign key relations.
⚙️ Flow of Operations (Step-by-Step)
🏙️ 1. Citizen Submits Complaint
User fills a complaint form on the website (complaint.html).
Inputs: name, contact, location (area), type of issue, description, date.
Complaint is stored in the Complaint table with a default status = “Pending”.
🧾 2. Admin Reviews the Complaint
Admin dashboard lists all complaints.
Admin assigns the complaint to a Department (like Waste Collection or Recycling Unit).
🚛 3. Department Takes Charge
The assigned department checks which vehicle and employees are available.
Through the Assigned_to table, the admin links an Employee and Vehicle.
A route (in the Route table) corresponding to the complaint’s location is chosen.
The vehicle is linked to that route via Serves table.
🧍‍♂️ 4. Employee Executes the Task
Assigned employee logs in, sees the task (with location, vehicle ID, route).
Employee departs (departure_from logged in Assigned_to).
Once task is completed, status is updated to “Resolved”.
📊 5. Citizen Can Track Progress
The citizen can revisit the site and enter the complaint ID to track the current status.
They may also view resolved history.
🏁 6. Admin Verifies & Closes
Admin verifies the completion via proof (photo or report).
The complaint is marked as “Closed” and archived.

changes: 

show department names using dept id in complaint.html as a drop down menu in which under each depatment it should show locations/areas associated with the deparment

under employees table:
there should be email and password attribute for 1. managers(admins) of particular department, 2. Employees of particular department

views for different people:
1. for Employees of particular department there should be a page dedicated for them, joining tables waste_record, department, assigned_to showing appropriate data

2. for managers(admins) of particular department there should be a page dedicated for them, joining tables waste_record, department, assigned_to showing appropriate data


Views:

views that you gave is okay, and for all the views should be placed in their appropriate pages: 
Suggestion for 5 SQL Views
View Name	Description	SQL Example
v_pending_complaints	Show all pending complaints with route & employee	SELECT c.*, e.name AS employee_name, r.route_name FROM complaints c LEFT JOIN employee e ON c.assigned_emp=e.emp_id LEFT JOIN route r ON c.route_id=r.route_id WHERE c.status='Open';
v_vehicle_usage	Vehicle assignment count & current status	SELECT v.vehicle_no, COUNT(a.assign_id) AS total_assignments, v.status FROM vehicle v LEFT JOIN assigned_to a ON v.vehicle_id=a.vehicle_id GROUP BY v.vehicle_no;
v_department_summary	Total employees, total vehicles per department	SELECT d.name, COUNT(DISTINCT e.emp_id) AS total_employees, COUNT(DISTINCT v.vehicle_id) AS total_vehicles FROM department d LEFT JOIN employee e ON d.dept_id=e.dept_id LEFT JOIN vehicle v ON d.dept_id=v.dept_id GROUP BY d.dept_id;
v_waste_collection_stats	Avg. waste collected per route	SELECT r.route_name, AVG(w.weight_kg) AS avg_collected FROM waste_record w JOIN route r ON w.route_id=r.route_id GROUP BY r.route_name;
v_employee_performance	No. of complaints handled by employee	SELECT e.name, COUNT(c.complaint_id) AS complaints_handled FROM employee e LEFT JOIN complaints c ON e.emp_id=c.assigned_emp GROUP BY e.name;
Each of these views can be connected to a simple table in your frontend via /api/views/... endpoints.
















New plan:

Perfect 👏 — this is exactly how real-world full-stack projects evolve!
You now have a **defined workflow**, clear **actor-based separation (citizen, employee, manager)**, and refined **database design goals**.
Let’s update your **complete project development plan** (including the new logic, views, and frontend/backend structure).

---

# 🚀 **Final Project Plan — WasteTrack (Full Stack System)**

## 🧩 1️⃣ Project Overview

**Goal:**
To build a centralized platform for smart waste management where:

* Citizens report complaints.
* Admins (Managers of Departments) manage operations and assign work.
* Employees execute waste collection tasks and update their progress.
* The system ensures two-way sync between the frontend and the database.

---

## 👥 2️⃣ Actors & System Roles

| Actor                     | Role Description                                                                 | Access Page      |
| ------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| 👤 **Citizen**            | Can report complaints and track them.                                            | `complaint.html` |
| 🧑‍💼 **Manager (Admin)** | Manages employees, vehicles, and complaints for their department.                | `manager.html`   |
| 👷 **Employee**           | Sees assigned routes and tasks, updates completion and waste records.            | `employee.html`  |
| 🧠 **System (DB)**        | Handles relational logic between departments, employees, routes, and complaints. | —                |

---

## ⚙️ 3️⃣ System Flow (Step-by-Step Updated)

### 🏙️ 1. Citizen Submits Complaint

* Citizen opens `complaint.html`.
* Form includes:

  * `citizen_name`, `contact_no`, `location`, `description`
  * Dropdown: **Department → Locations (from department & route tables)**
* On submit → inserts into `complaints` table with status = `'Open'`.

### 🧾 2. Admin (Manager) Reviews Complaint

* `manager.html` shows:

  * All complaints filtered by department.
  * Option to assign employee and vehicle to each complaint.
  * Updates complaint status (e.g., "In Progress", "Resolved").
* Admin credentials stored in `Employee` table (with `email`, `password`, and role field).

### 🚛 3. Department Takes Charge

* Manager assigns employee + vehicle + route using:

  * `Assigned_to` and `Serves` tables.
* Department data fetched dynamically using department and route joins.

### 👷‍♂️ 4. Employee Executes the Task

* Employee logs in to `employee.html`.
* Sees:

  * Assigned route, vehicle, and waste collection info.
  * Form to log collected waste weight (insert into `waste_record`).
* Updates status (via `/api/assigned/update`).

### 📊 5. Citizen Tracks Progress

* Citizen can enter complaint ID to see:

  * Complaint status
  * Assigned department
  * Assigned employee

### 🏁 6. Admin Verifies & Closes

* After the employee marks the task as complete, admin verifies and updates complaint to `"Closed"`.

---
Workflow (with updates)

Citizen Submits Complaint

Fills complaint.html with name, contact, location, and issue description.

Selects Department (dropdown populated dynamically from Department table).

When a department is selected → display locations (routes) assigned to that department.

Complaint auto-gets status = 'Pending'.

Manager Reviews and Assigns

Manager logs in via email/password (from Employee table where job_title='Manager').

Manager dashboard:

Views all complaints of their department (JOIN Complaint, Department, Assigned_to).

Assigns available employee and vehicle to a complaint.

Links a route (from the selected department area).

Updates complaint status → “In Progress”.

Employee Executes Task

Employee logs in using email/password (from Employee table).

Sees assigned complaint(s) with vehicle and route details (via JOIN).

Updates progress:

Reached site

Collection done

Resolved

Citizen Tracks Complaint

Citizen visits “Track Complaint” page.

Enters complaint ID → Fetches status (Pending, In Progress, Resolved, Closed).

Manager Verifies & Closes

Manager reviews resolved tasks.

Marks complaint as Closed after verification.
---

## 🧠 5️⃣ SQL Views (Confirmed & Extended)

| View                         | Description                           | Joins & Data                      |
| ---------------------------- | ------------------------------------- | --------------------------------- |
| **v_pending_complaints**     | Pending complaints + employee + route | `Complaints + Employee + Route`   |
| **v_vehicle_usage**          | Vehicle assignment count              | `Vehicle + Assigned_to`           |
| **v_department_summary**     | Department-wise staff & vehicles      | `Department + Employee + Vehicle` |
| **v_waste_collection_stats** | Avg. waste collected per route        | `Waste_Record + Route`            |
| **v_employee_performance**   | Total complaints handled              | `Employee + Complaints`           |

✅ All these will be accessible via `/api/views/:name`
✅ Each view will have a **dedicated table section** in frontend pages.

---

## 🧱 6️⃣ Backend Architecture

**File Structure**

```
source/
  backend/
    db.js
    server.js
    routes/
       complaints.js
       employees.js
       departments.js
       assigned.js
       waste.js
       views.js
```

### Key API Endpoints

| Endpoint               | Method   | Description                   |
| ---------------------- | -------- | ----------------------------- |
| `/api/complaints`      | GET/POST | Fetch or add complaints       |
| `/api/departments`     | GET      | Fetch all departments         |
| `/api/routes/:dept_id` | GET      | Get routes under a department |
| `/api/employees/login` | POST     | Login (manager or employee)   |
| `/api/views/:viewname` | GET      | Fetch SQL view data           |
| `/api/waste`           | POST     | Add waste record              |
| `/api/assigned/update` | POST     | Update assigned task status   |

---

## 💻 7️⃣ Frontend Structure & Responsibilities

**Directory**

```
source/
  complaint.html     ← Citizen portal
  manager.html       ← Admin dashboard (Manager)
  employee.html      ← Employee dashboard
  stats.html         ← Analytics (for global view)
  style.css
```

### 🔹 `complaint.html`

* Dropdowns for department and associated route/location.
* Shows complaint submission + list of complaints.
* Linked to `/api/departments` and `/api/routes/:dept_id`.

### 🔹 `manager.html`

* Login for manager (via `Employee` role = 'Manager').
* Table: All complaints under that department.
* Actions:

  * Assign employee and vehicle.
  * Mark complaint status.
* Displays joined data from `v_pending_complaints`, `v_department_summary`.

### 🔹 `employee.html`

* Login for employee (`Employee` role = 'Employee').
* Shows assigned routes and vehicles.
* Allows to insert `waste_record` entries.
* Displays data from joined view of `Waste_Record`, `Department`, `Assigned_to`.

### 🔹 `stats.html`

* Shows analytics using SQL views (`v_vehicle_usage`, `v_waste_collection_stats`, `v_employee_performance`).
* Could include charts using **Chart.js**.

---

## 🎨 8️⃣ UI/UX Plan

Keep the interface **clean and modern**:

* Use **CSS Grid / Flexbox** layout.
* Color palette: Green (#4CAF50), White (#FFFFFF), Gray (#F1F1F1).
* Buttons with hover effects and consistent card layouts.
* Use `<select>` dropdowns dynamically loaded from backend.
* Add **popup alerts** after successful data insertions.

---

## 📈 9️⃣ Implementation Phases (Timeline)

| Phase       | Duration | Key Deliverables                                                 |
| ----------- | -------- | ---------------------------------------------------------------- |
| **Phase 1** | Day 1–2  | Update DB schema (Employee, Complaints). Create all SQL Views.   |
| **Phase 2** | Day 3–4  | Add backend routes for all modules. Test API in Postman.         |
| **Phase 3** | Day 5–6  | Build frontend pages (Citizen, Manager, Employee). Connect APIs. |
| **Phase 4** | Day 7    | Add `stats.html` + integrate SQL views (Analytics).              |
| **Phase 5** | Day 8    | Final UI polish, testing, and presentation prep.                 |

---

## 🔥 10️⃣ Opinion — Why This Plan Works

* ✅ Clearly maps **frontend–backend–DB relationships**.
* ✅ Proper **role-based separation** makes it realistic and professional.
* ✅ Uses **SQL Views** smartly to demonstrate join/aggregate logic.
* ✅ Modular backend ensures easy debugging and maintainability.
* ✅ Visually appealing, functional, and aligned with your marks criteria.

---

* enhanced `auth.html` (sign-up + login forms that capture all employee fields, including department + role selection),
* `auth.js` (client-side logic to submit register/login, client-side validation, redirect by role),
* `head.html` (head’s dashboard: list employees, change role, delete employee),
* backend `routes/employees.js` (Express endpoints: register, login, list employees, update role, delete employee; uses `bcrypt` and `mysql2/promise`),
* small `server.js` snippets to mount the new router,
* the SQL addition to support role `Head`.

Everything is self-contained and annotated so you can copy into your repo and test. I keep security basic but improved (bcrypt password hashing). If you want session-based auth later I can extend to JWT or express-session.

---

## 1) DB change (run this first)

Make sure `employee` table has `email`, `password`, `role` and `dept_id` (we used these earlier). Also add `'Head'` to allowed roles.

```sql
-- ensure role field includes Head
ALTER TABLE employee
  MODIFY COLUMN role ENUM('Employee','Manager','Admin','Head') DEFAULT 'Employee';

-- if you do not have email/password columns, add them:
ALTER TABLE employee
  ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS password VARCHAR(255),
  ADD COLUMN IF NOT EXISTS dept_id INT,
  ADD CONSTRAINT IF NOT EXISTS fk_employee_dept FOREIGN KEY (dept_id) REFERENCES department(dept_id);
```

> Run these in your MySQL client. Adjust `IF NOT EXISTS` syntax if your MySQL version doesn't support it (split into conditional checks).

---

## 2) Frontend — `auth.html`

Replace or create `source/auth.html` with the following. It includes:

* Sign-up form capturing name, phone, email, password, department, role (Employee / Manager / Head), joining date, and optional employee-code/ID.
* Login form.
* The department dropdown is loaded from `/api/departments`.
* The role choice includes `Head` for the designated head employee.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>WasteTrack — Authentication</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="/style.css">
  <style>
    /* small inline styles for demo */
    body { font-family: Arial, sans-serif; background:#f3f6f8; padding:24px; }
    .container { max-width:1000px; margin:0 auto; display:flex; gap:24px; }
    .card { background:#fff; padding:18px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.06); flex:1; }
    h2 { margin-top:0 }
    label { display:block; margin-top:10px; font-size:14px; }
    input, select { width:100%; padding:8px 10px; margin-top:6px; box-sizing:border-box; border-radius:6px; border:1px solid #ddd; }
    .row { display:flex; gap:12px }
    .row > * { flex:1; }
    button { margin-top:14px; padding:10px 14px; border:0; background:#2b8a3e; color:#fff; border-radius:6px; cursor:pointer; }
    button.secondary { background:#666; }
    .muted { font-size:13px; color:#666; margin-top:8px; }
    .error { color:crimson; margin-top:8px; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Sign Up -->
    <div class="card">
      <h2>Create Employee / Manager / Head</h2>
      <form id="signupForm">
        <label for="fullName">Full name</label>
        <input id="fullName" name="name" required />

        <div class="row">
          <div>
            <label for="phone">Contact number</label>
            <input id="phone" name="phone" required />
          </div>
          <div>
            <label for="joinDate">Joining date</label>
            <input id="joinDate" name="join_date" type="date" />
          </div>
        </div>

        <label for="email">Email (login)</label>
        <input id="email" name="email" type="email" required />

        <label for="password">Password</label>
        <input id="password" name="password" type="password" required minlength="6"/>

        <label for="deptSelect">Department</label>
        <select id="deptSelect" name="dept_id" required>
          <option value="">Loading departments...</option>
        </select>

        <label for="roleSelect">Role</label>
        <select id="roleSelect" name="role" required>
          <option value="Employee">Employee</option>
          <option value="Manager">Manager</option>
          <option value="Head">Head</option>
        </select>

        <label for="empCode">Employee code / unique id (optional)</label>
        <input id="empCode" name="emp_code" placeholder="eg. EMP-1023" />

        <div class="muted">Choose 'Head' only for the single head user (or those who should manage roles).</div>
        <div id="signupMsg" class="error"></div>
        <button type="submit">Sign up</button>
      </form>
    </div>

    <!-- Login -->
    <div class="card">
      <h2>Login</h2>
      <form id="loginForm">
        <label for="loginEmail">Email</label>
        <input id="loginEmail" type="email" required />
        <label for="loginPassword">Password</label>
        <input id="loginPassword" type="password" required />
        <div id="loginMsg" class="error"></div>
        <button type="submit">Login</button>
        <button type="button" class="secondary" id="toTrackBtn">Track Complaint</button>
      </form>
      <p class="muted">After login you will be redirected based on role: Employee → employee.html, Manager → manager.html, Head → head.html</p>
    </div>
  </div>

  <script src="/auth.js"></script>
</body>
</html>
```

---

## 3) Frontend logic — `auth.js`

Create or replace `source/auth.js` with this. It:

* loads departments to populate dropdown
* handles `signupForm` submit: POST `/api/employees/register`
* handles `loginForm` submit: POST `/api/employees/login`
* saves minimal user info in `sessionStorage` (id, name, role, dept_id)
* redirects to `employee.html`, `manager.html`, or `head.html` depending on role

```javascript
// source/auth.js
(async function () {
  const apiBase = '/api/employees';

  // helper for fetch
  async function postJson(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res;
  }

  // populate departments
  async function loadDepartments() {
    try {
      const res = await fetch('/api/departments');
      const depts = await res.json();
      const sel = document.getElementById('deptSelect');
      sel.innerHTML = '<option value="">Select Department</option>';
      depts.forEach(d => sel.add(new Option(d.name, d.dept_id)));
    } catch (e) {
      console.error('Failed to load departments', e);
      const sel = document.getElementById('deptSelect');
      sel.innerHTML = '<option value="">Unable to load</option>';
    }
  }

  // sign-up
  document.getElementById('signupForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const msg = document.getElementById('signupMsg'); msg.textContent = '';
    const data = {
      name: document.getElementById('fullName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      join_date: document.getElementById('joinDate').value || null,
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      dept_id: document.getElementById('deptSelect').value || null,
      role: document.getElementById('roleSelect').value,
      emp_code: document.getElementById('empCode').value.trim() || null
    };

    // basic client validation
    if (!data.name || !data.email || !data.password) {
      msg.textContent = 'Name, email and password are required.';
      return;
    }

    try {
      const res = await postJson(apiBase + '/register', data);
      const body = await res.json();
      if (!res.ok) {
        msg.textContent = body.error || 'Registration failed';
        return;
      }
      // success
      alert('Registered successfully. You can now log in.');
      document.getElementById('signupForm').reset();
    } catch (err) {
      console.error(err);
      msg.textContent = 'Registration failed (network).';
    }
  });

  // login
  document.getElementById('loginForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const msg = document.getElementById('loginMsg'); msg.textContent = '';
    const payload = {
      email: document.getElementById('loginEmail').value.trim(),
      password: document.getElementById('loginPassword').value
    };
    try {
      const res = await postJson(apiBase + '/login', payload);
      const body = await res.json();
      if (!res.ok) {
        msg.textContent = body.error || 'Login failed';
        return;
      }
      // store user info (not password)
      const user = {
        emp_id: body.emp_id,
        name: body.name,
        role: body.role,
        dept_id: body.dept_id,
        email: body.email
      };
      sessionStorage.setItem('wt_user', JSON.stringify(user));

      // redirect by role
      if (user.role === 'Head') {
        window.location.href = '/head.html';
      } else if (user.role === 'Manager') {
        window.location.href = '/manager.html';
      } else {
        // Employee / default
        window.location.href = '/employee.html';
      }
    } catch (err) {
      console.error(err);
      msg.textContent = 'Login failed (network).';
    }
  });

  // optional: go to public track page
  document.getElementById('toTrackBtn').addEventListener('click', () => {
    window.location.href = '/track.html';
  });

  await loadDepartments();
})();
```

---

## 4) Head dashboard — `head.html`

Create `source/head.html`: lets Head view all employees, change role, delete employee. Uses `/api/employees` endpoints (GET, PUT, DELETE). The UI includes search and department filter.

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>WasteTrack — Head Dashboard</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="/style.css">
  <style>
    body { font-family: Arial, sans-serif; padding:20px; background:#f6f8fa; }
    .top { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
    table { width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,0.06); }
    th,td { padding:10px 12px; border-bottom:1px solid #eee; text-align:left; }
    th { background:#fafafa; font-weight:600; }
    .controls { display:flex; gap:8px; }
    .btn { padding:8px 10px; border-radius:6px; border:0; cursor:pointer; }
    .btn.danger { background:#c0392b; color:#fff; }
    .btn.primary { background:#2b8a3e; color:#fff; }
    select.roleSelect{ padding:6px; }
    input.search { padding:8px; width:240px; }
  </style>
</head>
<body>
  <div class="top">
    <h1>Head — Manage Employees & Roles</h1>
    <div>
      <input class="search" id="searchInput" placeholder="Search name or email" />
      <select id="filterDept"><option value="">All Departments</option></select>
      <button class="btn primary" id="refreshBtn">Refresh</button>
    </div>
  </div>

  <table id="employeesTable">
    <thead>
      <tr>
        <th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>

  <script>
    const apiBase = '/api/employees';

    async function fetchDepts(){
      try {
        const d = await fetch('/api/departments').then(r=>r.json());
        const sel = document.getElementById('filterDept');
        sel.innerHTML = '<option value="">All Departments</option>';
        d.forEach(x => sel.add(new Option(x.name, x.dept_id)));
      } catch(e){ console.error(e); }
    }

    async function loadEmployees(){
      const q = new URLSearchParams();
      const search = document.getElementById('searchInput').value.trim();
      const dept = document.getElementById('filterDept').value;
      if(search) q.append('q', search);
      if(dept) q.append('dept_id', dept);
      const rows = await fetch(apiBase + '?' + q.toString()).then(r=>r.json());
      const tbody = document.querySelector('#employeesTable tbody');
      tbody.innerHTML = rows.map(u => `
        <tr data-id="${u.emp_id}">
          <td>${u.emp_id}</td>
          <td>${u.name}</td>
          <td>${u.email||''}</td>
          <td>${u.department_name || ''}</td>
          <td>
            <select class="roleSelect" data-id="${u.emp_id}">
              <option ${u.role==='Employee'?'selected':''}>Employee</option>
              <option ${u.role==='Manager'?'selected':''}>Manager</option>
              <option ${u.role==='Head'?'selected':''}>Head</option>
              <option ${u.role==='Admin'?'selected':''}>Admin</option>
            </select>
          </td>
          <td>
            <button class="btn" onclick="saveRole(${u.emp_id})">Save</button>
            <button class="btn danger" onclick="deleteEmp(${u.emp_id})">Delete</button>
          </td>
        </tr>
      `).join('');
    }

    async function saveRole(empId){
      const sel = document.querySelector(`select.roleSelect[data-id="${empId}"]`);
      const newRole = sel.value;
      if(!confirm(`Change role of ${empId} to ${newRole}?`)) return;
      const res = await fetch(apiBase + '/' + empId + '/role', {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ role: newRole })
      });
      const body = await res.json();
      if (!res.ok) return alert(body.error || 'Failed');
      alert('Role updated');
      loadEmployees();
    }

    async function deleteEmp(empId){
      if(!confirm('Delete employee id ' + empId + '? This is irreversible.')) return;
      const res = await fetch(apiBase + '/' + empId, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok) return alert(body.error || 'Delete failed');
      alert('Deleted');
      loadEmployees();
    }

    document.getElementById('refreshBtn').addEventListener('click', loadEmployees);
    document.getElementById('searchInput').addEventListener('input', () => setTimeout(loadEmployees, 250));
    document.getElementById('filterDept').addEventListener('change', loadEmployees);

    (async function init(){
      await fetchDepts();
      await loadEmployees();
    })();
  </script>
</body>
</html>
```

---

## 5) Backend — `routes/employees.js`

Create `backend/routes/employees.js` (or update your existing file). This provides:

* `POST /api/employees/register` — create employee (bcrypt password hashing).
* `POST /api/employees/login` — login (bcrypt compare).
* `GET /api/employees` — list employees (optional query `q` or `dept_id`) with department name.
* `PUT /api/employees/:id/role` — update role (only Head should call this in production; we assume demo environment).
* `DELETE /api/employees/:id` — delete employee.

**Install dependencies**: `npm i bcrypt mysql2` (if not already present). Using `mysql2/promise` pool exported from `../db`.

```js
// backend/routes/employees.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db'); // your mysql2/promise pool
const SALT_ROUNDS = 10;

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, join_date, email, password, dept_id, role, emp_code } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name,email,password required' });

    // check existing
    const [[exists]] = await pool.query('SELECT emp_id FROM employee WHERE email = ?', [email]);
    if (exists) return res.status(400).json({ error: 'Email already used' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      `INSERT INTO employee (name, phone, join_date, email, password, dept_id, role, emp_code) VALUES (?,?,?,?,?,?,?,?)`,
      [name, phone||null, join_date||null, email, hash, dept_id||null, role||'Employee', emp_code||null]
    );
    const empId = result.insertId;
    const [[employee]] = await pool.query('SELECT emp_id, name, email, role, dept_id FROM employee WHERE emp_id = ?', [empId]);
    res.json(employee);
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ error: 'registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });
    const [rows] = await pool.query('SELECT * FROM employee WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // don't return password hash
    const safe = {
      emp_id: user.emp_id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept_id: user.dept_id
    };
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'login failed' });
  }
});

// List employees (optional query: q, dept_id)
router.get('/', async (req, res) => {
  try {
    const { q, dept_id } = req.query;
    let sql = `SELECT e.emp_id, e.name, e.email, e.role, e.dept_id, d.name AS department_name FROM employee e LEFT JOIN department d ON e.dept_id = d.dept_id WHERE 1=1 `;
    const params = [];
    if (q) {
      sql += ' AND (e.name LIKE ? OR e.email LIKE ? OR e.emp_code LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    if (dept_id) {
      sql += ' AND e.dept_id = ?';
      params.push(dept_id);
    }
    sql += ' ORDER BY e.emp_id DESC LIMIT 1000';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to list employees' });
  }
});

// Update role
router.put('/:id/role', async (req, res) => {
  try {
    const empId = req.params.id;
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'role required' });
    // validate role
    const allowed = ['Employee','Manager','Admin','Head'];
    if (!allowed.includes(role)) return res.status(400).json({ error: 'invalid role' });

    await pool.query('UPDATE employee SET role = ? WHERE emp_id = ?', [role, empId]);
    const [[employee]] = await pool.query('SELECT emp_id, name, email, role, dept_id FROM employee WHERE emp_id = ?', [empId]);
    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'update failed' });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const empId = req.params.id;
    // optionally: cascade or check constraints. For demo, attempt delete.
    await pool.query('DELETE FROM employee WHERE emp_id = ?', [empId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'delete failed' });
  }
});

module.exports = router;
```

**Notes:**

* This code trusts the caller (Head) to update roles. In production you would check session/authorization to ensure only Head can call role changes and delete employees.
* `bcrypt` is used for hashing. Install with `npm i bcrypt`. On some systems you may need `npm i bcrypt --build-from-source` or use `bcryptjs` if build fails.

---

## 6) Mount the router in `server.js`

In your `backend/server.js` (or `server.js` root), add:

```js
const employeesRouter = require('./routes/employees');
app.use('/api/employees', employeesRouter);
```

Make sure `app.use(express.json());` is present so JSON bodies are parsed.

---

## 7) Frontend / head security & role check (simple)

I assumed `auth.js` stores the user in `sessionStorage`. On `head.html` and other protected pages you should verify the user is logged in and has the correct role (client-side check for demo):

At the top of `head.html` (inside a `<script>` before any fetches) add:

```js
const me = JSON.parse(sessionStorage.getItem('wt_user') || 'null');
if (!me || me.role !== 'Head') {
  alert('You must be logged in as Head to access this page.');
  window.location.href = '/auth.html';
}
```

Do the same on `manager.html` / `employee.html` with role checks.

---

## 8) Integration checklist — what to do next

1. Add the DB changes (SQL) if not already present.
2. Add `backend/routes/employees.js`, and mount it in `server.js`.
3. Ensure `../db` exports a `mysql2/promise` pool (we used that earlier).
4. Put `auth.html`, `auth.js`, `head.html` into your `source/` web folder (or where static files are served).
5. `npm i bcrypt mysql2` if not present.
6. Start server and test:

   * `POST /api/employees/register` from the sign-up form.
   * `POST /api/employees/login` for login.
   * Log in as Head -> go to `/head.html` -> change roles and delete employees.
7. Optionally seed a Head user directly in DB (INSERT with hashed password) to ensure Head exists for testing.

---

## 9) Example seed for a Head (quick test)

Generate hash by node REPL or use this route to register with role 'Head'. If you want to directly insert (not recommended), use:

```js
// generate hash in node REPL
const bcrypt = require('bcrypt');
bcrypt.hash('SuperSecurePassword', 10).then(h => console.log(h));
```

Then insert into DB:

```sql
INSERT INTO employee (name, email, password, role) VALUES ('Head User','head@city.gov','[hash from node]', 'Head');
```

---t