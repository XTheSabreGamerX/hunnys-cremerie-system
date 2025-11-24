import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";

const EditUserModal = ({ user, onClose, onSave }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const roleOptions = ["owner", "manager", "staff"];

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setRole(user.role || "staff");
    }
  }, [user]);

  const handleConfirmSave = () => {
    onSave({ ...user, username, email, role });
    setShowConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">
            Edit Account Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      </motion.div>

      {showConfirm && (
        <ConfirmationModal
          message="Are you sure you want to save these changes?"
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
};

export default EditUserModal;
