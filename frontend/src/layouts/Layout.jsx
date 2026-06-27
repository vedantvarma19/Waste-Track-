// frontend/src/layouts/Layout.jsx
import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="brand">
            <div className="brand-icon">🌱</div>
            <div>
              <span>WasteTrack</span>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: "500", marginTop: "-3px" }}>
                City Management Portal
              </div>
            </div>
          </Link>

          <nav>
            <ul className="nav-links">
              <li>
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/complaint" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Report
                </NavLink>
              </li>
              <li>
                <NavLink to="/track" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Track Status
                </NavLink>
              </li>
              <li>
                <NavLink to="/stats" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Analytics
                </NavLink>
              </li>

              {user ? (
                <>
                  <li>
                    <NavLink
                      to={
                        user.role === "Head"
                          ? "/head-dashboard"
                          : user.role === "Manager"
                          ? "/manager-dashboard"
                          : "/employee-dashboard"
                      }
                      className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                    >
                      Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                      Profile ({user.name})
                    </NavLink>
                  </li>
                  <li>
                    <button className="btn btn-ghost" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }} onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link to="/login" className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
                    Sign In
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <main className="container flex-grow" style={{ padding: "2rem 1.5rem" }}>
        <Outlet />
      </main>

      <footer className="footer" style={{ padding: "2rem 0", background: "var(--dark)", color: "#94a3b8", marginTop: "auto" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h4 style={{ color: "white", fontSize: "1rem", marginBottom: "0.25rem" }}>🌱 WasteTrack</h4>
            <p style={{ fontSize: "0.8rem" }}>Smarter Cities, Sustainable Future.</p>
          </div>
          <div style={{ fontSize: "0.8rem", textAlign: "right" }}>
            <p>© {new Date().getFullYear()} WasteTrack. All rights reserved.</p>
            <p style={{ fontSize: "0.75rem", opacity: 0.7 }}>Designed and Developed by Vedant</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
