// Notifications.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"; // Modern Icons
import { authFetch, API_BASE } from "../utils/tokenUtils";

const Notifications = () => {
  const PAGE_SIZE = 12;
<<<<<<< HEAD
=======
  const navigate = useNavigate();
  const containerRef = useRef(null);

>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

<<<<<<< HEAD
  const navigate = useNavigate();
  const containerRef = useRef(null);

=======
  // Redirect if not logged in
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  // Icon helper
  const getIcon = (type) => {
    switch (type) {
      case "info":
<<<<<<< HEAD
        return <Info className="w-6 h-6 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "error":
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case "info":
        return "bg-blue-50 border-blue-100";
      case "warning":
        return "bg-amber-50 border-amber-100";
      case "success":
        return "bg-green-50 border-green-100";
      case "error":
        return "bg-red-50 border-red-100";
      default:
        return "bg-gray-50 border-gray-100";
    }
  };

  useEffect(() => {
    if (page < 1) return;
=======
        return <FiInfo className="notif-icon info" />;
      case "warning":
        return <FiAlertTriangle className="notif-icon warning" />;
      case "success":
        return <FiCheckCircle className="notif-icon success" />;
      case "error":
        return <FiXCircle className="notif-icon error" />;
      default:
        return <FiInfo className="notif-icon" />;
    }
  };

  // Time ago helper
  const timeAgo = (iso) => {
    const now = new Date();
    const created = new Date(iso);
    const diff = Math.floor((now - created) / 1000); // seconds

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return created.toLocaleDateString("en-PH");
  };

  // Fetch notifications
  useEffect(() => {
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
    const controller = new AbortController();

    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        if (page === 1) setNotifications([]);

        const res = await authFetch(
          `${API_BASE}/api/notifications?page=${page}&limit=${PAGE_SIZE}`,
          { signal: controller.signal }
        );
<<<<<<< HEAD
        if (!res.ok) throw new Error("Failed");
=======
        if (!res.ok) throw new Error("Failed to fetch notifications");
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161

        const data = await res.json();
        const pageRecords = Array.isArray(data.notifications)
          ? data.notifications
          : [];

        setNotifications((prev) =>
          page === 1 ? pageRecords : [...prev, ...pageRecords]
        );
        setHasMore(pageRecords.length === PAGE_SIZE);
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
    return () => controller.abort();
  }, [page]);

<<<<<<< HEAD
  // Infinite Scroll
=======
  // Infinite scroll
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let timeoutId = null;

    const handleScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        if (!hasMore || isLoading) return;
        if (
          container.scrollTop + container.clientHeight >=
          container.scrollHeight - 80
        ) {
          setPage((prev) => prev + 1);
        }
        timeoutId = null;
      }, 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoading]);

<<<<<<< HEAD
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="w-8 h-8 text-brand-primary" />
          Notifications
        </h1>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3" ref={containerRef}>
        {notifications.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Bell className="w-12 h-12 mb-2 opacity-20" />
            <p>No new notifications</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 rounded-xl border flex items-start gap-4 transition-all hover:shadow-sm ${getBgColor(
                notif.type
              )}`}
            >
              <div className="shrink-0 mt-1">{getIcon(notif.type)}</div>
              <div className="flex-1">
                <p className="text-gray-800 text-sm font-medium leading-relaxed">
                  {notif.message}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(notif.createdAt).toLocaleString("en-PH", {
                      timeZone: "Asia/Manila",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <p className="text-center text-sm text-gray-500 py-4">Loading...</p>
        )}
        {!hasMore && notifications.length > 0 && (
          <p className="text-center text-xs text-gray-400 py-4">
            No more notifications
          </p>
        )}
      </div>
    </div>
=======
  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await authFetch(`${API_BASE}/api/notifications/${id}`, {
        method: "PUT",
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  // Mark all as read
  /* const markAllAsRead = async () => {
    try {
      await authFetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PUT",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  }; */

  return (
    <DashboardLayout>
      <main className="notifications-main">
        <div className="notifications-header">
          <h1>Notifications</h1>
          {/* <button className="mark-all-btn" onClick={markAllAsRead}>
            Mark all as read
          </button> */}
        </div>

        <div className="notifications-list-wrapper" ref={containerRef}>
          {notifications.length === 0 && !isLoading && (
            <p className="no-notifs">No notifications yet.</p>
          )}

          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`notification-card ${notif.read ? "read" : "unread"}`}
              onClick={() => !notif.read && markAsRead(notif._id)}
            >
              <div className="notif-left">
                <div className="notif-icon-wrapper">{getIcon(notif.type)}</div>
                <div className="notif-message">
                  <p>{notif.message}</p>
                  <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                </div>
              </div>
              {!notif.read && <div className="notif-dot" />}
            </div>
          ))}

          {isLoading && (
            <div className="notif-loading">Loading more notifications...</div>
          )}

          {!hasMore && notifications.length > 0 && (
            <div className="notif-end">No more notifications</div>
          )}
        </div>
      </main>
    </DashboardLayout>
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
  );
};

export default Notifications;
