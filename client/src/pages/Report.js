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
import { API_BASE, authFetch } from "../utils/tokenUtils";
import DashboardLayout from "../scripts/DashboardLayout";
import DateRangeFilter from "../components/DateRangeFilter";
import "../styles/Report.css";

const Reports = () => {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  // Convert DateRangeFilter option to actual start/end dates
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
      default: // "All"
        start = null;
        end = null;
    }

    if (start && end) {
      setDateRange({ start: start.toISOString(), end: end.toISOString() });
    } else {
      setDateRange({ start: "All", end: "All" });
    }
  };

  // Fetch summary data from backend
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

      // Transform data for cards and chart
      const transformedData = data.summary.map((module) => {
        const entry = { _id: module._id, total: module.total };
        module.actions.forEach((a) => {
          entry[a.action.toLowerCase().replace(/\s+/g, "_")] = a.count;
        });
        entry.actions = module.actions; // keep original for cards
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

  return (
    <DashboardLayout>
      <div className="reports-container">
        <div className="reports-header">
          <h1>Reports Overview</h1>
          <DateRangeFilter
            options={["All", "Today", "This Week", "This Month", "This Year"]}
            onChange={handleDateChange}
          />
        </div>

        {loading && <p className="reports-loading">Loading reports...</p>}
        {error && <p className="reports-error">{error}</p>}

        {!loading && !error && (
          <>
            {/* Cards */}
            <div className="reports-cards">
              {summaryData.map((item, index) => (
                <div key={index} className="report-card">
                  <h3>{item._id}</h3>
                  <p className="report-card-total">{item.total}</p>
                  <div className="report-card-actions">
                    {item.actions?.map((a, i) => (
                      <span key={i} className="action-badge">
                        {a.action}: {a.count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Graphs */}
            <div className="reports-graphs">
              <div className="chart-wrapper">
                <h2>CRUD Activity Breakdown</h2>
                {summaryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={summaryData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {summaryData[0] &&
                        Object.keys(summaryData[0])
                          .filter(
                            (k) =>
                              k !== "_id" && k !== "total" && k !== "actions"
                          )
                          .map((key, idx) => (
                            <Bar
                              key={idx}
                              dataKey={key}
                              stackId="a"
                              fill={["#4caf50", "#2196f3", "#f44336"][idx % 3]}
                              name={key.replace(/_/g, " ")}
                            />
                          ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No data available for this range.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
