// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./layouts/Layout";

// Import Pages
import Welcome from "./pages/Welcome";
import Complaints from "./pages/Complaints";
import Track from "./pages/Track";
import Stats from "./pages/Stats";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import HeadDashboard from "./pages/HeadDashboard";
import Profile from "./pages/Profile";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<Welcome />} />
            <Route path="complaint" element={<Complaints />} />
            <Route path="track" element={<Track />} />
            <Route path="stats" element={<Stats />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="unauthorized" element={<Unauthorized />} />

            {/* Protected Employee Dashboard Route */}
            <Route 
              path="employee-dashboard" 
              element={
                <ProtectedRoute allowedRoles={["Employee", "Manager", "Head", "Admin"]}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Protected Manager Dashboard Route */}
            <Route 
              path="manager-dashboard" 
              element={
                <ProtectedRoute allowedRoles={["Manager", "Head", "Admin"]}>
                  <ManagerDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Protected Head/Admin Dashboard Route */}
            <Route 
              path="head-dashboard" 
              element={
                <ProtectedRoute allowedRoles={["Head", "Admin"]}>
                  <HeadDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Protected General Profile Route */}
            <Route 
              path="profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
