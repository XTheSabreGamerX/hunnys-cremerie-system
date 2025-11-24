import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Eye,
  Box,
  PackagePlus, // Icon for receiving items
} from "lucide-react";

import ViewModal from "../components/ViewModal";
import PurchaseOrderModal from "../components/PurchaseOrderModal";
import PurchaseOrderReceiveModal from "../components/PurchaseOrderReceiveModal";
import PopupMessage from "../components/PopupMessage";
import { showToast } from "../components/ToastContainer";
import { authFetch, API_BASE } from "../utils/tokenUtils";

const PurchaseOrderManagement = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Removed unused totalItems state
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  const [showPOCreateModal, setShowPOCreateModal] = useState(false);
  const [showPOReceiveModal, setShowPOReceiveModal] = useState(false);

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
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

  // --- Fetch Data ---
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
      // Removed setTotalItems call
    } catch (err) {
      console.error("Error fetching POs:", err);
      showPopup("Failed to load purchase orders.", "error");
    }
  }, [page, searchQuery, sortField, sortOrder]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  // --- Handlers ---
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

  const handleReceiveSubmit = async (receivedItems) => {
    try {
      const response = await authFetch(
        `${API_BASE}/api/purchaseOrder/receive/${selectedPO._id}`,
        {
          method: "PUT",
          body: JSON.stringify({ items: receivedItems }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to receive items");
      }

      showToast({
        message: `Items Received successfully!`,
        type: "success",
        duration: 3000,
      });
      fetchPurchaseOrders();
      setShowPOReceiveModal(false);
    } catch (error) {
      console.error("Receive PO Error:", error);
      showToast({ message: error.message, type: "error", duration: 3000 });
    }
  };

  // --- Helper for Status Colors ---
  const renderStatusBadge = (status) => {
    let colorClass = "bg-gray-100 text-gray-800";
    if (status === "Completed") colorClass = "bg-green-100 text-green-800";
    else if (status === "Pending") colorClass = "bg-amber-100 text-amber-800";
    else if (status === "Partially Delivered")
      colorClass = "bg-blue-100 text-blue-800";
    else if (status === "Cancelled") colorClass = "bg-red-100 text-red-800";

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
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

      {showPOReceiveModal && (
        <PurchaseOrderReceiveModal
          isOpen={showPOReceiveModal}
          onClose={() => setShowPOReceiveModal(false)}
          purchaseOrder={selectedPO}
          onSubmit={handleReceiveSubmit}
        />
      )}

      {isViewOpen && viewedPO && (
        <ViewModal
          item={viewedPO}
          fields={[
            { name: "poNumber", label: "PO Number" },
            {
              name: "supplier",
              label: "Supplier",
              render: (val) => val?.name || "N/A",
            },
            { name: "status", label: "Status" },
            {
              name: "totalAmount",
              label: "Total Amount",
              render: (val) => `₱${Number(val).toFixed(2)}`,
            },
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Box className="w-8 h-8 text-brand-primary" />
            Purchase Orders
          </h1>
          <p className="text-gray-500 text-sm">
            Manage orders to suppliers and receive stock.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search PO #..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <button
          onClick={() => setShowPOCreateModal(true)}
          className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors font-medium whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add PO
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
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
                    className="px-6 py-4 cursor-pointer hover:text-brand-primary"
                    onClick={() => handleSort(key)}
                  >
                    {label}{" "}
                    {sortField === key && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                ))}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr
                    key={po._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 font-bold">
                      #{po.poNumber}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {po.supplier?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {renderStatusBadge(po.status)}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">
                      ₱{Number(po.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(po.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {po.status !== "Cancelled" &&
                        po.status !== "Completed" && (
                          <button
                            onClick={() => {
                              setSelectedPO(po);
                              setShowPOReceiveModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                            title="Receive Items"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>
                        )}
                      <button
                        onClick={() => {
                          setViewedPO(po);
                          setIsViewOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderManagement;
