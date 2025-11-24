import React, { useState, useEffect } from "react";
import { UserCircle, Menu } from "lucide-react"; // Added Menu icon

const DashboardHeader = ({ isCollapsed, toggleSidebar }) => {
  const [user, setUser] = useState({ username: "", role: "" });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({
          username: parsedUser.username || "User",
          role: parsedUser.role || "Staff",
        });
      } catch (err) {
        console.error("Failed to parse user data", err);
      }
    }
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 h-16 flex items-center justify-between px-4 md:px-6 z-10 sticky top-0">
      {/* Left Side: Menu Toggle (Mobile Only) & Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Toggle Button - Only visible on small screens */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 -ml-2 text-brand-dark hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h1 className="text-lg md:text-2xl font-bold text-brand-dark tracking-tight truncate">
          Hunny's Crémerie{" "}
          <span className="text-brand-primary hidden md:inline">| Admin</span>
        </h1>
      </div>

      {/* Right Side: User Profile */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden md:block">
          <p className="text-sm font-bold text-gray-800">{user.username}</p>
          <p className="text-xs text-brand-primary font-medium uppercase tracking-wide">
            {user.role}
          </p>
        </div>
        <div className="h-9 w-9 md:h-10 md:w-10 bg-rose-100 rounded-full flex items-center justify-center text-brand-dark shadow-sm">
          <UserCircle className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
