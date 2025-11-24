import React, { useState } from "react";
import { Lock, X } from "lucide-react";

export default function ResetPasswordModal({
  isOpen,
  onClose,
  onSubmit,
  setPopUpMessage,
  setPopUpType,
}) {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setPopUpMessage("Passwords do not match!");
      setPopUpType("error");
      return;
    }
    if (newPass.length < 6) {
      setPopUpMessage("Password must be at least 6 characters.");
      setPopUpType("error");
      return;
    }
    onSubmit(newPass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand-primary" /> Reset Password
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-500 mb-2">
            Please enter your new password below.
          </p>

          <input
            type="password"
            value={newPass}
            placeholder="New Password"
            onChange={(e) => setNewPass(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
          />

          <input
            type="password"
            value={confirmPass}
            placeholder="Confirm New Password"
            onChange={(e) => setConfirmPass(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
          />

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
