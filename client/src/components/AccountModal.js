import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus } from "lucide-react"; // Icons
import { authFetch, API_BASE } from "../utils/tokenUtils";
import PopupMessage from "./PopupMessage";

const AccountModal = ({ onClose, onCreated }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("");
    }, 3000);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      showPopup("Please enter a valid email address.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/api/user/create`, {
        method: "POST",
        body: JSON.stringify({ username, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      showPopup("Staff account created successfully!", "success");
      onCreated();
      setTimeout(onClose, 1500); // Close after showing success
    } catch (err) {
      showPopup(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PopupMessage
        message={popupMessage}
        type={popupType}
        onClose={() => setPopupMessage("")}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brand-primary" />
              Create Staff Account
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                placeholder="e.g. Juan Dela Cruz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                placeholder="staff@hunnys.com"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-70"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default AccountModal;
