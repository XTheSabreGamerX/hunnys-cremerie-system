import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../scripts/Sidebar";
import "../styles/Notifications.css";
import { FiInfo, FiAlertTriangle, FiCheckCircle, FiXCircle } from "react-icons/fi";

const Notifications = () => {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const PAGE_SIZE = 12;

  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const authHeader = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // Redirect if no token
  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const getIcon = (type) => {
    switch (type) {
      case "info":
        return <FiInfo className="icon info" />;
      case "warning":
        return <FiAlertTriangle className="icon warning" />;
      case "success":
        return <FiCheckCircle className="icon success" />;
      case "error":
        return <FiXCircle className="icon error" />;
      default:
        return <FiInfo className="icon" />;
    }
  };

  // Fetch notifications for the current page
  useEffect(() => {
    if (!token || page < 1) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        // Clear notifications if first page
        if (page === 1) {
          setNotifications([]);
          setHasMore(true);
        }

        const res = await fetch(
          `${API_BASE}/api/notifications?page=${page}&limit=${PAGE_SIZE}`,
          { headers: authHeader, signal }
        );

        if (!res.ok) throw new Error("Failed to fetch notifications");

        const data = await res.json();
        const pageRecords = Array.isArray(data.notifications) ? data.notifications : [];

        setNotifications((prev) =>
          page === 1 ? pageRecords : [...prev, ...pageRecords]
        );
        setHasMore(pageRecords.length === PAGE_SIZE);
      } catch (err) {
        if (err.name !== "AbortError") console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    return () => controller.abort();
  }, [API_BASE, page, token, authHeader]);

  // Infinite scroll handler
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

        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 80) {
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

  // Reset notifications when token changes
  useEffect(() => {
    setNotifications([]);
    setPage(1);
    setHasMore(true);
  }, [token]);

  const formatPH = (iso) =>
    new Date(iso).toLocaleString("en-PH", { timeZone: "Asia/Manila" });

  return (
    <>
      <Sidebar />
      <main className="notifications-main">
        <div className="notifications-content">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h1 className="notifications-title">Notifications</h1>
          </div>

          <div
            className="notifications-list-wrapper"
            ref={containerRef}
            style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: 8 }}
          >
            <div className="notifications-list">
              {isLoading && notifications.length === 0 ? (
                <p style={{ padding: 12, textAlign: "center" }}>Loading...</p>
              ) : notifications.length === 0 ? (
                <p style={{ padding: 12 }}>No notifications yet.</p>
              ) : (
                notifications.map((notif) => (
                  <div key={notif._id} className={`notification-card ${notif.type}`}>
                    <div className="notification-icon">{getIcon(notif.type)}</div>
                    <div className="notification-body">
                      <p className="message">{notif.message}</p>
                      <span className="date">{formatPH(notif.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {isLoading && notifications.length > 0 && (
              <div style={{ textAlign: "center", padding: "8px 0", color: "#666" }}>
                Loading...
              </div>
            )}

            {!hasMore && notifications.length > 0 && (
              <div style={{ textAlign: "center", padding: "8px 0", color: "#666" }}>
                No more notifications
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Notifications;
