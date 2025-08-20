import React, { useState, useEffect } from "react";
import "../styles/Sidebar.css";
import Logo from "../elements/images/icon32x32.png";
import { Menu } from "lucide-react";
<<<<<<< HEAD
import { useNavigate, Link } from "react-router-dom";
import { ImHome, ImUsers, ImList } from "react-icons/im";
import { CgBox } from "react-icons/cg";
import {
  FaCashRegister,
  FaMoneyBillWave,
  FaChartLine,
  FaCalculator,
  FaTruck,
  FaUserTag,
  FaDownload,
  FaEnvelope,
} from "react-icons/fa";
=======
import { useNavigate, NavLink } from "react-router-dom";
>>>>>>> origin/mobile-ui

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

<<<<<<< HEAD
  const sidebarItems = [
    {
      label: "Dashboard",
      icon: <ImHome />,
      path: "/dashboard",
      roles: ["admin", "owner", "manager", "staff"],
    },
    {
      label: "User Management",
      icon: <ImUsers />,
      path: "/user-management",
      roles: ["admin", "owner", "manager"],
    },
    {
      label: "Activity Log",
      icon: <ImList />,
      path: "/activity-log",
      roles: ["admin", "owner", "manager"],
    },
    {
      label: "Inventory",
      icon: <CgBox />,
      path: "/inventory",
      roles: ["admin", "owner", "manager", "staff"],
    },
    {
      label: "Sales Management",
      icon: <FaCashRegister />,
      path: "/sales-management",
      roles: ["admin", "owner", "manager", "staff"],
    },
    {
      label: "Sales Report",
      icon: <FaChartLine />,
      path: "/sales-report",
      roles: ["admin", "owner"],
    },
    {
      label: "Profitability Dashboard",
      icon: <FaCalculator />,
      path: "/dashboard",
      roles: ["admin", "owner"],
    },
    {
      label: "Supplier Management",
      icon: <FaTruck />,
      path: "/supplier-management",
      roles: ["admin", "owner", "manager"],
    },
    {
      label: "Customer Management",
      icon: <FaUserTag />,
      path: "/customer-management",
      roles: ["admin", "owner", "manager"],
    },
    {
      label: "Pricing Management",
      icon: <FaMoneyBillWave />,
      path: "/dashboard",
      roles: ["admin", "owner", "manager"],
    },
    {
      label: "Backup and Restore",
      icon: <FaDownload />,
      path: "/dashboard",
      roles: ["admin", "manager", "staff"],
    },
    {
      label: "Notifications",
      icon: <FaEnvelope />,
      path: "/dashboard",
      roles: ["admin", "manager", "staff"],
    },
  ];
=======
  const linkClass = ({ isActive }) => (isActive ? "active" : "");
>>>>>>> origin/mobile-ui

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
<<<<<<< HEAD
          {sidebarItems.map(
            (item) =>
              item.roles.includes(role) && (
                <Link to={item.path} className="sidebar-item" key={item.label}>
                  {item.icon}
                  <span className="label">{item.label}</span>
                </Link>
              )
=======
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
              <NavLink to="/dashboard" className={linkClass} end>
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
              <NavLink to="/dashboard" className={linkClass} end>
                <span className="label">Pricing Management</span>
              </NavLink>
              <NavLink to="/dashboard" className={linkClass} end>
                <span className="label">Backup and Restore</span>
              </NavLink>
              <NavLink to="/notifications" className={linkClass} end>
                <span className="label">Notifications</span>
              </NavLink>
            </>
          )}

          {role === "manager" && (
            <>
              <NavLink to="/dashboard" className={linkClass} end>
                <span className="label">Pricing Management</span>
              </NavLink>
              <NavLink to="/dashboard" className={linkClass} end>
                <span className="label">Backup and Restore</span>
              </NavLink>
              <NavLink to="/notifications" className={linkClass} end>
                <span className="label">Notifications</span>
              </NavLink>
            </>
          )}

          {role === "staff" && (
            <>
              <NavLink to="/dashboard" className={linkClass} end>
                <span className="label">Backup and Restore</span>
              </NavLink>
              <NavLink to="/notifications" className={linkClass} end>
                <span className="label">Notifications</span>
              </NavLink>
            </>
>>>>>>> origin/mobile-ui
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