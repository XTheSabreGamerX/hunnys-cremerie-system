import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../scripts/Sidebar";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalInventoryCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    salesToday: 0,
    activityLogsToday: 0,
  });

  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/dashboard`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch dashboard stats");

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [API_BASE, token]);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <>
      <Sidebar />
      <main className="dashboard-main-content">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-grid">
          <Link to="/inventory" className="dashboard-card-link">
            <div className="dashboard-card">
              <h2>Total Inventory</h2>
              <p>{stats.totalInventoryCount}</p>
            </div>
          </Link>

          <Link to="/inventory" className="dashboard-card-link">
            <div className="dashboard-card">
              <h2>Low Stock</h2>
              <p>{stats.lowStockCount}</p>
            </div>
          </Link>

          <Link to="/inventory" className="dashboard-card-link">
            <div className="dashboard-card">
              <h2>Out Of Stock</h2>
              <p>{stats.outOfStockCount}</p>
            </div>
          </Link>

          <Link to="/sales-management" className="dashboard-card-link">
            <div className="dashboard-card">
              <h2>Sales Today</h2>
              <p>{stats.salesToday}</p>
            </div>
          </Link>

          <Link to="/activity-log" className="dashboard-card-link">
            <div className="dashboard-card">
              <h2>Activity Logs Today</h2>
              <p>{stats.activityLogsToday}</p>
            </div>
          </Link>
        </div>
      </main>
    </>
  );
};

export default Dashboard;