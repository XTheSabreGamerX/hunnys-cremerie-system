import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";

const DashboardLayout = ({ children }) => {
  // Persist sidebar state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
      return newState;
    });
  };

  return (
    // Flex container: Sidebar on the left (fixed height), Content on the right
    <div className="flex h-screen bg-rose-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader
          isCollapsed={isCollapsed}
          toggleSidebar={toggleSidebar}
        />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
