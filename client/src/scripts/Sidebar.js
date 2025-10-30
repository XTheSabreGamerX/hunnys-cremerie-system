import React from "react";
import "../styles/Sidebar.css";
import Logo from "../elements/images/icon32x32.png";
import { Menu } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ImHome, ImUsers, ImList } from "react-icons/im";
import { CgBox } from "react-icons/cg";
import {
  FaCashRegister,
  FaMoneyBillWave,
  FaChartLine,
  /* FaCalculator, */
  FaTruck,
  FaUserTag,
  FaDownload,
  FaEnvelope,
  FaCog,
  FaClipboard,
} from "react-icons/fa";

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role?.toLowerCase() || null;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("sidebarCollapsed");
    navigate("/login");
  };

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
      label: "Report",
      icon: <FaClipboard />,
      path: "/dashboard",
      roles: ["admin", "owner"],
    },/* 
    {
      label: "Profitability Dashboard",
      icon: <FaCalculator />,
      path: "/dashboard",
      roles: ["admin", "owner"],
    }, */
    {
      label: "Supplier Management",
      icon: <FaTruck />,
      path: "/supplier-management",
      roles: ["admin", "owner", "manager", "staff"],
    },
    {
      label: "Customer Management",
      icon: <FaUserTag />,
      path: "/customer-management",
      roles: ["admin", "owner", "manager", "staff"],
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
      path: "/backuprestore",
      roles: ["admin", "owner"],
    },
    {
      label: "Notifications",
      icon: <FaEnvelope />,
      path: "/notifications",
      roles: ["admin", "owner", "manager", "staff"],
    },
    {
      label: "Settings",
      icon: <FaCog />,
      path: "/settings",
      roles: ["admin", "owner"],
    },
  ];

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <img src={Logo} alt="Logo" className="sidebar-logo" />
        <button onClick={toggleSidebar} className="sidebar-toggle">
          <Menu />
        </button>
      </div>

      <div className="sidebar-scroll">
        <nav className="sidebar-nav">
          {sidebarItems.map(
            (item) =>
              item.roles.includes(role) && (
                <Link
                  to={item.path}
                  className={`sidebar-item ${
                    location.pathname === item.path ? "active" : ""
                  }`}
                  key={item.label}
                >
                  {item.icon}
                  <span className="label">{item.label}</span>
                </Link>
              )
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
