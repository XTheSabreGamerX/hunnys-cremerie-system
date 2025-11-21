import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../scripts/DashboardLayout";
import { FaEye, FaPlus } from "react-icons/fa6";
import ViewModal from "../components/ViewModal";
import PurchaseOrderModal from "../components/PurchaseOrderModal";
import PopupMessage from "../components/PopupMessage";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import "../styles/App.css";
import "../styles/PurchaseOrder.css";

const PurchaseOrderManagement = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  const [showPOCreateModal, setShowPOCreateModal] = useState(false);

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewedPO, setViewedPO] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  // Placeholder fetch using your getter
  const fetchPurchaseOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        search: searchQuery,
        field: sortField,
        order: sortOrder,
      });

      const res = await authFetch(`${API_BASE}/api/purchaseOrder?${params}`);
      if (!res.ok) throw new Error("Failed to fetch purchase orders");
      const data = await res.json();

      setPurchaseOrders(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
    } catch (err) {
      console.error("Error fetching POs:", err);
      showPopup("Failed to load purchase orders.", "error");
    }
  }, [page, searchQuery, sortField, sortOrder]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        setSortField("");
        setSortOrder("");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleSavePO = async (payload) => {
    try {
      const res = await authFetch(`${API_BASE}/api/purchaseOrder`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create PO");
      }

      showPopup("Purchase Order created successfully", "success");
      setShowPOCreateModal(false);
      fetchPurchaseOrders();
    } catch (err) {
      console.error("Create PO failed:", err);
      showPopup(err.message, "error");
    }
  };

  return (
    <>
      {popupMessage && (
        <PopupMessage
          message={popupMessage}
          type={popupType}
          onClose={() => setPopupMessage("")}
        />
      )}

      {showPOCreateModal && (
        <PurchaseOrderModal
          onClose={() => setShowPOCreateModal(false)}
          onSave={handleSavePO}
        />
      )}

      {isViewOpen && viewedPO && (
        <ViewModal
          item={viewedPO}
          fields={[
            { name: "poNumber", label: "PO Number" },
            { name: "supplier.name", label: "Supplier" },
            { name: "status", label: "Status" },
            { name: "totalAmount", label: "Total Amount" },
            {
              name: "createdAt",
              label: "Created",
              formatter: (v) => new Date(v).toLocaleString(),
            },
            {
              name: "updatedAt",
              label: "Updated",
              formatter: (v) => new Date(v).toLocaleString(),
            },
          ]}
          onClose={() => {
            setViewedPO(null);
            setIsViewOpen(false);
          }}
        />
      )}

      <DashboardLayout>
        <main className="module-main-content purchase-order-main">
          <div className="module-header">
            <h1 className="module-title">Purchase Orders</h1>
          </div>

          <div className="module-actions-container">
            <input
              type="text"
              className="module-search-input"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />

            <button
              className="module-action-btn module-add-btn"
              onClick={() => setShowPOCreateModal(true)}
            >
              <FaPlus /> Add PO
            </button>
          </div>

          <div className="module-table-container">
            <table>
              <thead>
                <tr>
                  {[
                    { key: "poNumber", label: "PO Number" },
                    { key: "supplier.name", label: "Supplier" },
                    { key: "status", label: "Status" },
                    { key: "totalAmount", label: "Total Amount" },
                    { key: "createdAt", label: "Created" },
                    { key: "updatedAt", label: "Updated" },
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
                  <th style={{ cursor: "default" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7">No purchase orders found.</td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po._id}>
                      <td>{po.poNumber}</td>
                      <td>{po.supplier?.name || "N/A"}</td>
                      <td>{po.status}</td>
                      <td>{po.totalAmount}</td>
                      <td>{new Date(po.createdAt).toLocaleString()}</td>
                      <td>{new Date(po.updatedAt).toLocaleString()}</td>
                      <td>
                        <button
                          className="module-action-btn module-view-btn"
                          onClick={() => {
                            setViewedPO(po);
                            setIsViewOpen(true);
                          }}
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <p className="pagination-info">
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, totalItems)} of{" "}
              {totalItems} POs
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
                const pageNumber = start + idx;
                if (pageNumber > totalPages) return null;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={page === pageNumber ? "active" : ""}
                  >
                    {pageNumber}
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

export default PurchaseOrderManagement;
