import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import ToastMessage from "./ToastPopup";

let addToast;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  addToast = (toast) => {
    // Add new toast with unique ID
    setToasts((prev) => [...prev, { id: Date.now(), ...toast }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children}
      {/* Toast Container - Fixed Position */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastMessage
              key={t.id}
              id={t.id}
              message={t.message}
              type={t.type}
              duration={t.duration}
              onClose={() => removeToast(t.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export const showToast = (toast) => {
  if (addToast) addToast(toast);
};
