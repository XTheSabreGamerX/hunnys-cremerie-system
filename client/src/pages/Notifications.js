// Notifications.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import DashboardLayout from "../scripts/DashboardLayout";
import "../styles/Notifications.css";
import {
  FiInfo,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

const Notifications = () => {
  const PAGE_SIZE = 12;
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  // Icon helper
  const getIcon = (type) => {
    switch (type) {
      case "info":
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
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        if (page === 1) setNotifications([]);

        const res = await authFetch(
          `${API_BASE}/api/notifications?page=${page}&limit=${PAGE_SIZE}`,
          { signal }
        );
        if (!res.ok) throw new Error("Failed to fetch notifications");

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

  // Infinite scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeoutId = null;

    const handleScroll = () => {
      if (timeoutId) return;

      timeoutId = setTimeout(() => {
        if (!hasMore || isLoading) {
          timeoutId = null;
          return;
        }

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
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [hasMore, isLoading]);

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
  );
};

export default Notifications;
