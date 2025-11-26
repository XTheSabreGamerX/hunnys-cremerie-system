import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useNavigate, Link } from "react-router-dom";
import {
  Package,
  AlertTriangle,
  XCircle,
  CalendarX,
  Banknote,
  ClipboardList,
} from "lucide-react";

import { authFetch, API_BASE } from "../utils/tokenUtils";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalInventoryCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    expiredCount: 0,
    salesToday: 0,
    purchaseOrdersToday: 0,
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

  const dashboardCards = [
    {
      title: "Total Inventory",
      value: stats.totalInventoryCount,
      icon: <Package className="w-8 h-8 text-blue-500" />,
      bgColor: "bg-blue-50",
      link: "/inventory",
      allowedRoles: ["admin", "owner", "manager", "staff"],
    },
    {
      title: "Low Stock",
      value: stats.lowStockCount,
      icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
      bgColor: "bg-amber-50",
      link: "/inventory?status=low-stock",
      allowedRoles: ["admin", "owner", "manager", "staff"],
    },
    {
      title: "Out Of Stock",
      value: stats.outOfStockCount,
      icon: <XCircle className="w-8 h-8 text-red-500" />,
      bgColor: "bg-red-50",
      link: "/inventory?status=out-of-stock",
      allowedRoles: ["admin", "owner", "manager", "staff"],
    },
    {
      title: "Expired",
      value: stats.expiredCount,
      icon: <CalendarX className="w-8 h-8 text-rose-600" />,
      bgColor: "bg-rose-50",
      link: "/inventory?status=expired",
      allowedRoles: ["admin", "owner", "manager", "staff"],
    },
    {
      title: "Sales Today",
      value: `₱${stats.salesToday.toLocaleString()}`,
      icon: <Banknote className="w-8 h-8 text-green-600" />,
      bgColor: "bg-green-50",
      link: "/sales-management",
      allowedRoles: ["admin", "owner", "manager"],
    },
    {
      title: "Purchase Orders Today",
      value: stats.purchaseOrdersToday,
      icon: <ClipboardList className="w-8 h-8 text-purple-600" />,
      bgColor: "bg-purple-50",
      link: "/purchase-orders",
      allowedRoles: ["admin", "owner"],
    },
  ];

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Dashboard Overview
        </h1>
        <div className="text-sm text-gray-500">
          Welcome back,{" "}
          <span className="font-semibold text-brand-primary">
            {user?.username}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards
          .filter((card) => card.allowedRoles.includes(role))
          .map((card, index) => (
            <Link
              key={index}
              to={card.link}
              className="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-light transition-all duration-300 flex items-start justify-between overflow-hidden"
            >
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {card.title}
                </p>
                <h3 className="text-2xl font-bold text-gray-800 group-hover:text-brand-primary transition-colors">
                  {card.value}
                </h3>
              </div>
              <div
                className={`p-3 rounded-xl ${card.bgColor} group-hover:scale-110 transition-transform duration-300`}
              >
                {card.icon}
              </div>
            </Link>
          ))}
      </div>

      {/* Financial Chart - Fixed Height Added Here */}
      {canView(["admin", "owner", "manager"]) && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">
              Financial Overview
            </h2>
          </div>

          {/* Added fixed height container to prevent console warnings */}
          <div style={{ width: "100%", height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  tickFormatter={(value) => `₱${value}`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value) => [`₱${value.toFixed(2)}`, ""]}
                />
                <Legend iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#10b981",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#f43f5e",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                  name="Cost"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
