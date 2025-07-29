import React, { useState, useEffect } from "react";
import Sidebar from "../scripts/Sidebar";
import PopupMessage from "../components/PopupMessage";
import "../styles/App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SalesManagement = () => {
  const [sales, setSales] = useState([]);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");

  const fetchSales = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/sales`);
      if (!response.ok) throw new Error("Failed to fetch sales.");
      const data = await response.json();
      setSales(data);
    } catch (err) {
      setPopupMessage(err.message || "Something went wrong.");
      setPopupType("error");
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return (
    <>
      <Sidebar />
      <main className="module-main-content">
        <div className = "module-header">
            <h1 className = "module-title">Sales Management</h1>
        </div>
        
        <section className="module-actions-container">
          <div className="module-actions-left">
            <input
              type="text"
              placeholder="Search Sales"
              className="module-search-input"
              // implement search logic later
            />
            <button className="module-action-btn module-add-btn">
              Add Sale {/* We'll link this to modal later */}
            </button>
          </div>
        </section>

        <section className="module-table-container">
          <table className="module-table">
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Date Created</th>
                <th className="action-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale._id}>
                    <td>{sale.saleId}</td>
                    <td>{sale.customer}</td>
                    <td>₱{sale.total?.toFixed(2)}</td>
                    <td>{new Date(sale.date).toLocaleDateString()}</td>
                    <td>
                      <button className="module-action-btn module-view-btn">View</button>
                      <button className="module-action-btn module-edit-btn">Edit</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No sales found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        {popupMessage && (
          <PopupMessage
            message={popupMessage}
            type={popupType}
            onClose={() => setPopupMessage("")}
          />
        )}
      </main>
    </>
  );
};

export default SalesManagement;
