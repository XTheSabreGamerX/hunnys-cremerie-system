import React, { useState } from "react";
import ToastMessage from "./ToastPopup";
import "../styles/ToastPopup.css";

let addToast;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  addToast = (toast) => {
    setToasts((prev) => [...prev, { id: Date.now(), ...toast }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <ToastMessage
            key={t.id}
            message={t.message}
            type={t.type}
            duration={t.duration}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </>
  );
};

export const showToast = (toast) => {
  if (addToast) addToast(toast);
};
