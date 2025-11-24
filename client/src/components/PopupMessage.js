import React, { useEffect } from "react";
import { CheckCircle, AlertTriangle, Info, XCircle, X } from "lucide-react";

const PopupMessage = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const getStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-50 text-green-800 border-green-200";
      case "error":
        return "bg-red-50 text-red-800 border-red-200";
      case "warning":
        return "bg-amber-50 text-amber-800 border-amber-200";
      default:
        return "bg-blue-50 text-blue-800 border-blue-200";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${getStyles()} min-w-[300px] max-w-md`}
      >
        {getIcon()}
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PopupMessage;
