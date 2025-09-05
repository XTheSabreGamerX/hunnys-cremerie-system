import React, { useState, useEffect } from "react";
import "../styles/DashboardHeader.css";

const DashboardHeader = ({ isCollapsed }) => {
  const [user, setUser] = useState({ username: "", role: "" });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({
          username: parsedUser.username || "",
          role: parsedUser.role || "",
        });
      } catch (err) {
        console.error("Failed to parse user from localStorage:", err);
      }
    }
  }, []);

  return (
    <header
      className={`dashboard-header ${isCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <div className="dashboard-header-left">
        <h1>Hunnys Crémerie Baking Supplies</h1>
      </div>
      <div className="dashboard-header-right">
        <p>
          Logged in as: {user.username} ({user.role})
        </p>
      </div>
    </header>
  );
};

export default DashboardHeader;
