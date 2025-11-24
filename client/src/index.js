import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Import Tailwind directives
import App from "./scripts/App";
import { ToastProvider } from "./components/ToastContainer";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
