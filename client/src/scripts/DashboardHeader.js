import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCircle,
  Menu,
  Bell,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { authFetch, API_BASE } from "../utils/tokenUtils";

const DashboardHeader = ({ isCollapsed, toggleSidebar }) => {
  const [user, setUser] = useState({ username: "", role: "" });

  // --- Notification States ---
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const notifRef = useRef(null);
  const navigate = useNavigate();

  // --- User Data ---
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({
          username: parsedUser.username || "User",
          role: parsedUser.role || "Staff",
        });
      } catch (err) {
        console.error("Failed to parse user data", err);
      }
    }
  }, []);

  // --- Fetch Notifications ---
  // Added 'isBackground' param to prevent loading spinner on auto-updates
  const fetchLatestNotifications = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await authFetch(
        `${API_BASE}/api/notifications?page=1&limit=5`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      const list = Array.isArray(data.notifications) ? data.notifications : [];
      setNotifications(list);

      const unread = list.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Notification fetch error:", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // --- Auto-Polling & Click Outside ---
  useEffect(() => {
    // 1. Initial Load
    fetchLatestNotifications();

    // 2. Auto-Update every 15 seconds (Polling)
    const intervalId = setInterval(() => {
      fetchLatestNotifications(true); // true = background update (no spinner)
    }, 15000);

    // 3. Click Outside Listener
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- Mark Read Handler ---
  const markAsRead = async (id) => {
    try {
      await authFetch(`${API_BASE}/api/notifications/${id}`, { method: "PUT" });

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  // --- Icon Helpers ---
  const getIcon = (type) => {
    switch (type) {
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case "info":
        return "bg-blue-50";
      case "warning":
        return "bg-amber-50";
      case "success":
        return "bg-green-50";
      case "error":
        return "bg-red-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 h-16 flex items-center justify-between px-4 md:px-6 z-20 sticky top-0">
      {/* Left Side: Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 -ml-2 text-brand-dark hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h1 className="text-lg md:text-2xl font-bold text-brand-dark tracking-tight truncate">
          Hunny's Crémerie{" "}
          <span className="text-brand-primary hidden md:inline">| Admin</span>
        </h1>
      </div>

      {/* Right Side: Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* --- NOTIFICATION BELL --- */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors relative outline-none"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {/* Dropdown Panel */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right z-50">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-800 text-sm">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-brand-primary font-bold bg-red-50 px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>

              {/* List */}
              <div className="max-h-[320px] overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center text-gray-400 text-sm">
                    Loading updates...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                    <Bell className="w-10 h-10 mb-2 opacity-10" />
                    <p className="text-xs">No new notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => !notif.read && markAsRead(notif._id)}
                      className={`p-3 border-b border-gray-50 flex gap-3 cursor-pointer transition-colors hover:bg-gray-50 group ${
                        !notif.read ? "bg-white" : "bg-gray-50/30"
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`shrink-0 mt-1 w-8 h-8 rounded-full flex items-center justify-center ${getBgColor(
                          notif.type
                        )}`}
                      >
                        {getIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p
                            className={`text-sm leading-snug ${
                              !notif.read
                                ? "font-bold text-gray-800"
                                : "text-gray-600"
                            }`}
                          >
                            {notif.message}
                          </p>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-brand-primary rounded-full shrink-0 mt-1.5"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400 group-hover:text-gray-500">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.createdAt).toLocaleString("en-US", {
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <button
                onClick={() => {
                  setIsNotifOpen(false);
                  navigate("/notifications");
                }}
                className="w-full py-3 text-xs font-bold text-gray-500 hover:text-brand-primary hover:bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-1 transition-colors uppercase tracking-wide"
              >
                View All Activity <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* --- USER PROFILE --- */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200 ml-1">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-gray-800 leading-none mb-0.5">
              {user.username}
            </p>
            <p className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">
              {user.role}
            </p>
          </div>
          <div className="h-9 w-9 md:h-10 md:w-10 bg-rose-100 rounded-full flex items-center justify-center text-brand-dark shadow-sm border border-rose-200">
            <UserCircle className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
