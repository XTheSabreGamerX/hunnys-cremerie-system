import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../scripts/DashboardLayout";
import DateRangeFilter from "../components/DateRangeFilter";
import "../styles/ActivityLog.css";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [selectedRange, setSelectedRange] = useState("All");
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Redirect if not logged in / unauthorized role
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else if(user.role === "staff") {
      navigate("/dashboard")
    }
  }, [token, user.role, navigate]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_BASE}/api/activitylog?range=${encodeURIComponent(
            selectedRange
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        setLogs(data.logs || []);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        setLogs([]);
      }
    };

    fetchLogs();
  }, [API_BASE, selectedRange]);

  return (
    <>
      <DashboardLayout>
        <main className="activity-log-main-content">
          <div className="activity-log-header">
            <h1 className="activity-log-title">Activity Logs</h1>

            <div className="activity-log-actions-container">
              <DateRangeFilter
                options={[
                  "All",
                  "Today",
                  "This Week",
                  "This Month",
                  "This Year",
                ]}
                onChange={setSelectedRange}
              />
            </div>
          </div>

          <div className="activity-log-table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5">No activity logs found.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td>
                        {new Date(log.createdAt).toLocaleString("en-PH", {
                          timeZone: "Asia/Manila",
                        })}
                      </td>
                      <td>{log.userId?.username || "Unknown"}</td>
                      <td>{log.action}</td>
                      <td>{log.module}</td>
                      <td>{log.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </DashboardLayout>
    </>
  );
};

export default ActivityLog;
