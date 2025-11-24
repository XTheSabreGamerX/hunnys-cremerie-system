import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  User,
  Activity,
  Layers,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import DateRangeFilter from "../components/DateRangeFilter";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [selectedRange, setSelectedRange] = useState("All");

  // --- Pagination States ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Change this number to show more/less rows

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Redirect if not logged in / unauthorized role
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else if (user.role === "staff") {
      navigate("/dashboard");
    }
  }, [user.role, navigate]);

  // Fetch Logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await authFetch(
          `${API_BASE}/api/activitylog?range=${encodeURIComponent(
            selectedRange
          )}`
        );
        const data = await res.json();
        setLogs(data.logs || []);

        // Reset to page 1 whenever filters change/data refreshes
        setCurrentPage(1);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        setLogs([]);
      }
    };

    fetchLogs();
  }, [selectedRange]);

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = logs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(logs.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-brand-primary" />
            Activity Logs
          </h1>
          <p className="text-gray-500 text-sm">
            Monitor system actions and user history.
          </p>
        </div>

        {/* Date Filter */}
        <DateRangeFilter
          options={["All", "Today", "This Week", "This Month", "This Year"]}
          onChange={setSelectedRange}
        />
      </div>

      {/* --- Logs Table --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Timestamp
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" /> User
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Action
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Module
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Description
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No activity logs found for this period.
                  </td>
                </tr>
              ) : (
                currentLogs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString("en-PH", {
                        timeZone: "Asia/Manila",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {log.userId?.username || (
                        <span className="text-gray-400 italic">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                            ${
                              log.action === "delete"
                                ? "bg-red-50 text-red-700"
                                : log.action === "create"
                                ? "bg-green-50 text-green-700"
                                : log.action === "update"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">
                      {log.module}
                    </td>
                    <td
                      className="px-6 py-4 text-gray-600 max-w-md truncate"
                      title={log.description}
                    >
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- Pagination Controls --- */}
        {logs.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, logs.length)} of {logs.length} entries
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm font-medium text-gray-700 px-2">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
