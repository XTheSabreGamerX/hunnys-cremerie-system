import React, { useEffect } from "react";
import { X } from "lucide-react";

const ToastMessage = ({ message, type = "info", duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-amber-500 text-white",
    info: "bg-blue-600 text-white",
  };

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-lg mb-3 w-full max-w-xs animate-in slide-in-from-right duration-300 ${typeStyles[type]}`}
    >
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100">
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  );
};

export default ToastMessage;
