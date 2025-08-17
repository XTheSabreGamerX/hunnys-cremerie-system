// src/scripts/DashboardHeader.js
import React from "react";
import { Menu } from "lucide-react";
import "../styles/DashboardHeader.css";

export default function DashboardHeader() {
  return (
    <header className="dashboard-header">
      <button
        className="nav-toggle"
        aria-label="Open menu"
        onClick={() =>
          window.dispatchEvent(new CustomEvent("hc:sidebar", { detail: "toggle" }))
        }
      >
        <Menu />
      </button>
    </header>
  );
}