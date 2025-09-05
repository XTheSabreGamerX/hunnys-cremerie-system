import React, { useState } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";

const DashboardLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(
    () => JSON.parse(localStorage.getItem("sidebarCollapsed")) || false
  );

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      localStorage.setItem("sidebarCollapsed", JSON.stringify(!prev));
      return !prev;
    });
  };

  return (
    <div className={`dashboard-container ${isCollapsed ? "collapsed" : ""}`}>
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <DashboardHeader isCollapsed={isCollapsed} />
      <main className="dashboard-main-content">{children}</main>
    </div>
  );
};

export default DashboardLayout;
