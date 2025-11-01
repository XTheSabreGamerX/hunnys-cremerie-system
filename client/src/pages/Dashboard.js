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
import DashboardLayout from "../scripts/DashboardLayout";
import { authFetch, API_BASE } from "../utils/tokenUtils";
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

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role ? user.role.toLowerCase() : null;
  const canView = (allowedRoles) => allowedRoles.includes(role);

  // Dashboard card arrays for role based render
  const dashboardCards = [
    {
      title: "Total Inventory",
      value: stats.totalInventoryCount,
      icon: <FaBox className="dashboard-card-icon" />,
      link: "/inventory",
      allowedRoles: ["admin", "owner", "manager", "staff"],
    },
    {
      title: "Low Stock",
      value: stats.lowStockCount,
      icon: (
        <FaExclamationTriangle
          className="dashboard-card-icon"
          style={{ color: "#FFC107" }}
        />
      ),
      link: "/inventory?status=low-stock",
      allowedRoles: ["admin", "owner", "manager", "staff"],
    },
    {
      title: "Out Of Stock",
      value: stats.outOfStockCount,
      icon: (
        <FaExclamationTriangle
          className="dashboard-card-icon"
          style={{ color: "red" }}
        />
      ),
      link: "/inventory?status=out-of-stock",
      allowedRoles: ["admin", "owner", "manager", "staff"],
    },
    {
      title: "Sales Today",
      value: stats.salesToday,
      icon: <FaMoneyBill className="dashboard-card-icon" />,
      link: "/sales-management",
      allowedRoles: ["admin", "owner", "manager"],
    },
    {
      title: "Activity Logs Today",
      value: stats.activityLogsToday,
      icon: <FaClipboardList className="dashboard-card-icon" />,
      link: "/activity-log",
      allowedRoles: ["admin", "owner"],
    },
  ];

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/dashboard`);

        if (!res.ok) throw new Error("Failed to fetch dashboard stats");

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };

    fetchStats();
  }, []);

  // Fetch revenue data
  useEffect(() => {
    const fetchRevenueCost = async () => {
      try {
        const res = await authFetch(
          `${API_BASE}/api/dashboard/revenue-cost-by-day`
        );
        if (!res.ok) throw new Error("Failed to fetch revenue/cost data");
        const data = await res.json();
        setLineData(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRevenueCost();
  }, []);

  return (
    <>
      <DashboardLayout>
        <main className="dashboard-main-content">
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="dashboard-grid">
            {dashboardCards
              .filter((card) => card.allowedRoles.includes(role))
              .map((card, index) => (
                <Link
                  key={index}
                  to={card.link}
                  className="dashboard-card-link"
                >
                  <div className="dashboard-card">
                    {card.icon}
                    <h2>{card.title}</h2>
                    <p>{card.value}</p>
                  </div>
                </Link>
              ))}
          </div>

          {canView(["admin", "owner", "manager"]) && (
            <div className="dashboard-line-chart-container">
              <h2 className="dashboard-line-chart-title">Financial Overview</h2>
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
          )}
        </main>
      </DashboardLayout>
    </>
  );
};

export default Dashboard;
