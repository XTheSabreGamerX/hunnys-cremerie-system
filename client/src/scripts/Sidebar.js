import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X, // Added Close icon
  LogOut,
  LayoutDashboard,
  Users,
  ClipboardList,
  Package,
  ShoppingCart,
  BarChart3,
  FileText,
  Truck,
  Tags,
  Save,
  Bell,
  Settings,
} from "lucide-react";

import Logo from "../elements/images/icon32x32.png";

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role?.toLowerCase() || "";

  // --- Responsive Check Hook ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const sidebarItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      roles: ["admin", "owner", "manager", "staff"],
    },
    {
      label: "User Management",
      icon: Users,
      path: "/user-management",
      roles: ["admin", "owner", "manager"],
    },
    {
      label: "Activity Log",
      icon: ClipboardList,
      path: "/activity-log",
      roles: ["admin", "owner", "manager"],
    },
    {
      label: "Inventory",
      icon: Package,
      path: "/inventory",
      roles: ["admin", "owner", "manager", "staff"],
    },
    {
      label: "Sales Management",
      icon: ShoppingCart,
      path: "/sales-management",
      roles: ["admin", "owner", "manager", "staff"],
    },
    {
      label: "Sales Report",
      icon: BarChart3,
      path: "/sales-report",
      roles: ["admin", "owner"],
    },
    {
      label: "Report",
      icon: FileText,
      path: "/report",
      roles: ["admin", "owner"],
    },
    {
      label: "Supplier Management",
      icon: Truck,
      path: "/supplier-management",
      roles: ["admin", "owner", "manager", "staff"],
    },
    {
      label: "Customer Management",
      icon: Tags,
      path: "/customer-management",
      roles: ["admin", "owner", "manager", "staff"],
    },
    {
      label: "Backup & Restore",
      icon: Save,
      path: "/backuprestore",
      roles: ["admin", "owner"],
    },
    {
      label: "Notifications",
      icon: Bell,
      path: "/notifications",
      roles: ["admin", "owner", "manager", "staff"],
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/settings",
      roles: ["admin", "owner"],
    },
  ];

  // --- Variants Logic ---
  // Mobile: Fixed Fullscreen (100vw) or Hidden Off-screen (-100%)
  // Desktop: Relative Flex, 16rem or 5rem
  const sidebarVariants = {
    mobileOpen: {
      x: 0,
      width: "100vw",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    mobileClosed: {
      x: "-100%",
      width: "100vw",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    desktopOpen: {
      width: "16rem",
      x: 0,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    desktopClosed: {
      width: "5rem",
      x: 0,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  return (
    <>
      {/* Mobile Overlay (Darkens background when menu is open) */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={toggleSidebar} // Close when clicking outside
        />
      )}

      <motion.div
        initial={false}
        animate={
          isMobile
            ? isCollapsed
              ? "mobileClosed"
              : "mobileOpen"
            : isCollapsed
            ? "desktopClosed"
            : "desktopOpen"
        }
        variants={sidebarVariants}
        // Mobile uses fixed positioning to cover screen, Desktop uses relative
        className={`bg-brand-dark h-screen flex flex-col shadow-2xl z-50 text-white ${
          isMobile ? "fixed top-0 left-0" : "relative"
        }`}
      >
        {/* --- Sidebar Header --- */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-rose-800 shrink-0">
          {/* Logo Area */}
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            {(!isCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <img
                  src={Logo}
                  alt="Logo"
                  className="w-8 h-8 rounded-full bg-white p-1"
                />
                <span className="font-bold text-lg tracking-wide">Hunny's</span>
              </motion.div>
            )}
            {/* Show just logo icon if collapsed on desktop */}
            {isCollapsed && !isMobile && (
              <img
                src={Logo}
                alt="Logo"
                className="w-8 h-8 rounded-full bg-white p-1 mx-auto"
              />
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-rose-800 transition-colors"
          >
            {/* On Mobile: Show X to close. On Desktop: Show Menu to toggle */}
            {isMobile ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-rose-100" />
            )}
          </button>
        </div>

        {/* --- Navigation Items --- */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-rose-700 scrollbar-track-transparent">
          <nav className="flex flex-col gap-1 px-2">
            {sidebarItems.map((item) => {
              if (!item.roles.includes(role)) return null;

              const isActive = location.pathname === item.path;

              return (
                <Link
                  to={item.path}
                  key={item.label}
                  onClick={() => isMobile && toggleSidebar()} // Auto-close on mobile click
                  className={`group flex items-center px-3 py-3 rounded-xl transition-all duration-200 relative ${
                    isActive
                      ? "bg-rose-600 text-white shadow-md"
                      : "text-rose-100 hover:bg-rose-800/50 hover:text-white"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`${
                      isCollapsed && !isMobile ? "mx-auto" : ""
                    } min-w-[24px]`}
                  >
                    <item.icon
                      className={`w-6 h-6 ${
                        isActive
                          ? "text-white"
                          : "text-rose-200 group-hover:text-white"
                      }`}
                    />
                  </div>

                  {/* Label - Visible if Expanded OR on Mobile (since mobile is always full width when open) */}
                  {(!isCollapsed || isMobile) && (
                    <span className="ml-3 font-medium whitespace-nowrap overflow-hidden">
                      {item.label}
                    </span>
                  )}

                  {/* Tooltip for collapsed Desktop state */}
                  {isCollapsed && !isMobile && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* --- Footer / Logout --- */}
        <div className="p-4 border-t border-rose-800 shrink-0">
          <button
            onClick={logout}
            className={`w-full flex items-center ${
              isCollapsed && !isMobile ? "justify-center" : "justify-start px-4"
            } py-3 rounded-xl bg-rose-900 hover:bg-red-600 text-red-100 hover:text-white transition-all duration-200`}
          >
            <LogOut className="w-5 h-5" />
            {(!isCollapsed || isMobile) && (
              <span className="ml-3 font-medium">Logout</span>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
