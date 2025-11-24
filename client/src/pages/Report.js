import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { FileText, Activity } from "lucide-react";
import { API_BASE, authFetch } from "../utils/tokenUtils";
import DateRangeFilter from "../components/DateRangeFilter";

const Reports = () => {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const handleDateChange = (option) => {
    const now = new Date();
    let start, end;

    switch (option) {
      case "Today":
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date();
        break;
      case "This Week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        start = weekStart;
        end = new Date();
        break;
      case "This Month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date();
        break;
      case "This Year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date();
        break;
      default:
        start = null;
        end = null;
    }

    if (start && end) {
      setDateRange({ start: start.toISOString(), end: end.toISOString() });
    } else {
      setDateRange({ start: "All", end: "All" });
    }
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const url =
        dateRange.start && dateRange.end
          ? `${API_BASE}/api/report/summary?startDate=${dateRange.start}&endDate=${dateRange.end}`
          : `${API_BASE}/api/report/summary`;

      const response = await authFetch(url);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to fetch reports");

      const transformedData = data.summary.map((module) => {
        const entry = { _id: module._id, total: module.total };
        module.actions.forEach((a) => {
          entry[a.action.toLowerCase().replace(/\s+/g, "_")] = a.count;
        });
        entry.actions = module.actions;
        return entry;
      });
      setSummaryData(transformedData);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Helper for badges
  const getActionColor = (action) => {
    const act = action.toLowerCase();
    if (act.includes("create") || act.includes("add"))
      return "bg-green-100 text-green-800";
    if (act.includes("update") || act.includes("edit"))
      return "bg-blue-100 text-blue-800";
    if (act.includes("delete") || act.includes("remove"))
      return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-8 h-8 text-brand-primary" />
            Reports Overview
          </h1>
          <p className="text-gray-500 text-sm">
            Summary of system activities and CRUD operations.
          </p>
        </div>
        <DateRangeFilter
          options={["All", "Today", "This Week", "This Month", "This Year"]}
          onChange={handleDateChange}
        />
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {summaryData.map((item, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-gray-800">
                    {item._id}
                  </h3>
                  <span className="bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-lg text-xs font-bold">
                    Total: {item.total}
                  </span>
                </div>

                <div className="space-y-2">
                  {item.actions?.map((a, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm"
                    >
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-medium ${getActionColor(
                          a.action
                        )}`}
                      >
                        {a.action}
                      </span>
                      <span className="font-mono font-semibold text-gray-600">
                        {a.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-brand-primary" />
              <h2 className="text-lg font-bold text-gray-800">
                Activity Breakdown
              </h2>
            </div>

            <div className="h-[400px] w-full">
              {summaryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summaryData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis dataKey="_id" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend />
                    {summaryData[0] &&
                      Object.keys(summaryData[0])
                        .filter(
                          (k) => k !== "_id" && k !== "total" && k !== "actions"
                        )
                        .map((key, idx) => (
                          <Bar
                            key={idx}
                            dataKey={key}
                            stackId="a"
                            fill={
                              ["#10b981", "#3b82f6", "#f43f5e", "#f59e0b"][
                                idx % 4
                              ]
                            }
                            name={key.replace(/_/g, " ")}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No data available for this range.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
