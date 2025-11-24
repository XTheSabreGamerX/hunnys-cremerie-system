import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../scripts/DashboardLayout";
import { FaEye, FaUndo } from "react-icons/fa";
import PopupMessage from "../components/PopupMessage";
import RefundViewModal from "../components/RefundViewModal";
import RefundModal from "../components/RefundModal";
import { authFetch, API_BASE } from "../utils/tokenUtils";

import "../styles/App.css";
import "../styles/Refund.css";

const Refund = () => {
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  // popups
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  // view modal
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  // refund modal
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  // authentication check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  // ---------------- FETCH SALES ----------------
  const fetchSales = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        search: searchQuery,
        field: sortField,
        order: sortOrder,
      });

      const res = await authFetch(`${API_BASE}/api/sales?${params}`);
      if (!res.ok) throw new Error("Failed to fetch sales");

      const data = await res.json();

      setSales(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
    } catch (err) {
      console.error("Error fetching sales:", err);
      showPopup("Failed to fetch sales data.", "error");
    }
  }, [page, searchQuery, sortField, sortOrder]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // ---------------- SORTING ----------------
  const handleSort = (field) => {
    if (sortField === field) {
      if (sortOrder === "asc") setSortOrder("desc");
      else {
        setSortField("");
        setSortOrder("");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // ---------------- REFUND MODAL ----------------
  const handleOpenRefund = (sale) => {
    setSelectedSale(sale);
    setRefundModalOpen(true);
  };

  const closeRefundModal = () => {
    setRefundModalOpen(false);
    setSelectedSale(null);
  };

  // ---------------- SUBMIT REFUND ----------------
  const handleRefundSubmit = async (payload) => {
    try {
      const response = await authFetch(
        `${API_BASE}/api/sales/${selectedSale._id}/refund`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Refund failed");

      showPopup("Sale refunded successfully!", "success");
      closeRefundModal();
      fetchSales();
    } catch (err) {
      console.error("Refund error:", err);
      showPopup(err.message, "error");
    }
  };

  return (
    <>
      {/* Popup Notification */}
      {popupMessage && (
        <PopupMessage
          message={popupMessage}
          type={popupType}
          onClose={() => setPopupMessage("")}
        />
      )}

      {/* Refund Modal */}
      <RefundModal
        isOpen={refundModalOpen}
        onClose={closeRefundModal}
        saleData={selectedSale}
        onSubmit={handleRefundSubmit}
      />

      {/* Refund View Modal */}
      <RefundViewModal
        isOpen={isViewOpen && !!selectedSale?.refund}
        onClose={() => {
          setIsViewOpen(false);
          setSelectedSale(null);
        }}
        refund={selectedSale?.refund}
      />

      <DashboardLayout>
        <main className="module-main-content refund-main">
          <div className="module-header">
            <h1 className="module-title">Refund Management</h1>
          </div>

          {/* Actions */}
          <div className="module-actions-container">
            <input
              type="text"
              className="module-search-input"
              placeholder="Search sales…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Table */}
          <div className="module-table-container">
            <table>
              <thead>
                <tr>
                  {[
                    { key: "invoiceNumber", label: "Invoice #" },
                    { key: "customerName", label: "Customer" },
                    { key: "orderType", label: "Order Type" },
                    { key: "totalAmount", label: "Total Amount" },
                    { key: "refund.status", label: "Refund Status" },
                    { key: "createdAt", label: "Sale Created" },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      {label}{" "}
                      {sortField === key && (
                        <span>{sortOrder === "asc" ? "▲" : "▼"}</span>
                      )}
                    </th>
                  ))}

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="7">No sales found.</td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale._id}>
                      <td>{sale.invoiceNumber}</td>
                      <td>{sale.customerName || "N/A"}</td>
                      <td>{sale.orderType}</td>
                      <td>{sale.totalAmount}</td>
                      <td>{sale.refund?.status || "—"}</td>
                      <td>{new Date(sale.createdAt).toLocaleString()}</td>

                      <td>
                        {/* VIEW BUTTON (only show if the sale has a refund) */}
                        {sale.refund?.status && (
                          <button
                            className="module-action-btn module-view-btn"
                            onClick={() => {
                              setSelectedSale(sale);
                              setIsViewOpen(true);
                            }}
                          >
                            <FaEye />
                          </button>
                        )}

                        {/* REFUND BUTTON (only show if no refund has happened) */}
                        {sale.refund?.status === null && (
                          <button
                            className="module-action-btn module-edit-btn"
                            onClick={() => handleOpenRefund(sale)}
                          >
                            <FaUndo />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <p className="pagination-info">
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, totalItems)} of{" "}
              {totalItems} sales
            </p>

            <div className="pagination-buttons">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                Prev
              </button>

              {Array.from({ length: Math.min(7, totalPages) }).map((_, idx) => {
                const start = Math.max(1, Math.min(page - 3, totalPages - 6));
                const pageNum = start + idx;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={page === pageNum ? "active" : ""}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </main>
      </DashboardLayout>
    </>
  );
};

export default Refund;
