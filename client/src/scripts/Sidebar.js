import React, { useState, useEffect } from "react";
import "../styles/Sidebar.css";
import Logo from "../elements/images/icon32x32.png";
import { Menu } from "lucide-react";
import { useNavigate, NavLink } from "react-router-dom";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // mobile open/close
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role ? user.role.toLowerCase() : null;

  useEffect(() => {
    const onCmd = (e) => {
      const cmd = e?.detail || "toggle";
      const isMobile = window.innerWidth <= 768;
      if (!isMobile) return;
      if (cmd === "toggle") setIsOpen((v) => !v);
      if (cmd === "open") setIsOpen(true);
      if (cmd === "close") setIsOpen(false);
    };
    window.addEventListener("hc:sidebar", onCmd);
    return () => window.removeEventListener("hc:sidebar", onCmd);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsOpen((v) => !v);      // mobile: open/close drop-down
    } else {
      setIsCollapsed((v) => !v); // desktop: collapse/expand
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
  };

  const linkClass = ({ isActive }) => (isActive ? "active" : "");

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <img src={Logo} alt="Logo" className="sidebar-logo" />
        <button onClick={toggleSidebar} className="sidebar-toggle" aria-label="Toggle sidebar">
          <Menu />
        </button>
      </div>

      <div className="sidebar-scroll">
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={linkClass} end>
            <span className="label">Dashboard</span>
          </NavLink>

          {(role === "admin" || role === "manager") && (
            <>
              <NavLink to="/user-management" className={linkClass} end>
                <span className="label">User Management</span>
              </NavLink>
              <NavLink to="/activity-log" className={linkClass} end>
                <span className="label">Activity Log</span>
              </NavLink>
            </>
          )}

          {(role === "admin" || role === "manager" || role === "staff") && (
            <>
              <NavLink to="/inventory" className={linkClass} end>
                <span className="label">Inventory</span>
              </NavLink>
              <NavLink to="/sales-management" className={linkClass} end>
                <span className="label">Sales Management</span>
              </NavLink>
              {/* The following paths should be real routes to avoid multiple active states */}
              <NavLink to="/sales-report" className={linkClass} end>
                <span className="label">Sales Report</span>
              </NavLink>
              <NavLink to="/profitability-dashboard" className={linkClass} end>
                <span className="label">Profitability Dashboard</span>
              </NavLink>
              <NavLink to="/supplier-management" className={linkClass} end>
                <span className="label">Supplier Management</span>
              </NavLink>
              <NavLink to="/customer-management" className={linkClass} end>
                <span className="label">Customer Management</span>
              </NavLink>
            </>
          )}

          {role === "admin" && (
            <>
              <NavLink to="/pricing-management" className={linkClass} end>
                <span className="label">Pricing Management</span>
              </NavLink>
              <NavLink to="/backup-and-restore" className={linkClass} end>
                <span className="label">Backup and Restore</span>
              </NavLink>
              <NavLink to="/notifications" className={linkClass} end>
                <span className="label">Notifications</span>
              </NavLink>
            </>
          )}

          {role === "manager" && (
            <>
              <NavLink to="/pricing-management" className={linkClass} end>
                <span className="label">Pricing Management</span>
              </NavLink>
              <NavLink to="/backup-and-restore" className={linkClass} end>
                <span className="label">Backup and Restore</span>
              </NavLink>
              <NavLink to="/notifications" className={linkClass} end>
                <span className="label">Notifications</span>
              </NavLink>
            </>
          )}

          {role === "staff" && (
            <>
              <NavLink to="/backup-and-restore" className={linkClass} end>
                <span className="label">Backup and Restore</span>
              </NavLink>
              <NavLink to="/notifications" className={linkClass} end>
                <span className="label">Notifications</span>
              </NavLink>
            </>
          )}
        </nav>

        {!isCollapsed && (
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;