import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useNavigate, Link } from "react-router-dom";
import {
  FaBox,
  FaExclamationTriangle,
  FaMoneyBill,
  FaClipboardList,
} from "react-icons/fa";
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

  const [lineData, setLineData] = useState([]);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Fetch dashboard stats
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
      }
    };

    fetchStats();
  }, [API_BASE, token]);

  // Fetch revenue data
  useEffect(() => {
    const fetchRevenueCost = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/dashboard/revenue-cost-by-day`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch revenue/cost data");
        const data = await res.json();
        setLineData(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRevenueCost();
  }, [API_BASE, token]);

  return (
    <>
      <Sidebar />
      <main className="dashboard-main-content">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-grid">
          <Link to="/inventory" className="dashboard-card-link">
            <div className="dashboard-card">
              <FaBox className="dashboard-card-icon" />
              <h2>Total Inventory</h2>
              <p>{stats.totalInventoryCount}</p>
            </div>
          </Link>

          <Link to="/inventory" className="dashboard-card-link">
            <div className="dashboard-card">
              <FaExclamationTriangle
                className="dashboard-card-icon"
                style={{ color: "#FFC107" }}
              />
              <h2>Low Stock</h2>
              <p>{stats.lowStockCount}</p>
            </div>
          </Link>

          <Link to="/inventory" className="dashboard-card-link">
            <div className="dashboard-card">
              <FaExclamationTriangle
                className="dashboard-card-icon"
                style={{ color: "red" }}
              />
              <h2>Out Of Stock</h2>
              <p>{stats.outOfStockCount}</p>
            </div>
          </Link>

          <Link to="/sales-management" className="dashboard-card-link">
            <div className="dashboard-card">
              <FaMoneyBill className="dashboard-card-icon" />
              <h2>Sales Today</h2>
              <p>{stats.salesToday}</p>
            </div>
          </Link>

          <Link to="/activity-log" className="dashboard-card-link">
            <div className="dashboard-card">
              <FaClipboardList className="dashboard-card-icon" />
              <h2>Activity Logs Today</h2>
              <p>{stats.activityLogsToday}</p>
            </div>
          </Link>
        </div>

        <div className="dashboard-line-chart-container">
          <h2 className="dashboard-line-chart-title">
            Financial Overview
          </h2>
          <div className="dashboard-line-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4CAF50"
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#FF5722"
                  name="Cost"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
