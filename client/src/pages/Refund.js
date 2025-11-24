import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RotateCcw, Eye } from "lucide-react"; // Modern Icons

import ViewModal from "../components/ViewModal"; // Using generic ViewModal
import RefundModal from "../components/RefundModal";
import PopupMessage from "../components/PopupMessage";
import { authFetch, API_BASE } from "../utils/tokenUtils";

const Refund = () => {
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Removed unused totalItems state
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  // UI States
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  // Auth Check
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
      // Removed setTotalItems call
    } catch (err) {
      console.error("Error fetching sales:", err);
      showPopup("Failed to fetch sales data.", "error");
    }
  }, [page, searchQuery, sortField, sortOrder]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

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

  const handleOpenRefund = (sale) => {
    setSelectedSale(sale);
    setRefundModalOpen(true);
  };

  const handleRefundSubmit = async (payload) => {
    try {
      const response = await authFetch(
        `${API_BASE}/api/sales/${selectedSale._id}/refund`,
        { method: "PUT", body: JSON.stringify(payload) }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Refund failed");

      showPopup("Sale refunded successfully!", "success");
      setRefundModalOpen(false);
      setSelectedSale(null);
      fetchSales();
    } catch (err) {
      console.error("Refund error:", err);
      showPopup(err.message, "error");
    }
  };

  const renderRefundBadge = (status) => {
    if (!status) return <span className="text-gray-400 italic">None</span>;
    let color = "bg-gray-100 text-gray-800";
    if (status === "refunded") color = "bg-red-100 text-red-800";
    if (status === "defective") color = "bg-amber-100 text-amber-800";
    if (status === "replaced") color = "bg-blue-100 text-blue-800";

    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${color}`}
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

      {/* Refund Modal */}
      <RefundModal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        saleData={selectedSale}
        onSubmit={handleRefundSubmit}
      />

      {/* View Refund Details Modal */}
      {isViewOpen && selectedSale?.refund && (
        <ViewModal
          item={selectedSale.refund}
          fields={[
            {
              name: "status",
              label: "Status",
              render: (val) => (
                <span className="uppercase font-bold">{val}</span>
              ),
            },
            { name: "reason", label: "Reason" },
            {
              name: "totalRefundAmount",
              label: "Refunded Amount",
              render: (val) => `₱${Number(val).toFixed(2)}`,
            },
            {
              name: "processedAt",
              label: "Processed At",
              formatter: (v) => new Date(v).toLocaleString(),
            },
          ]}
          onClose={() => setIsViewOpen(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <RotateCcw className="w-8 h-8 text-brand-primary" />
            Refund Management
          </h1>
          <p className="text-gray-500 text-sm">
            Process returns, defects, and replacements.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                {[
                  { key: "invoiceNumber", label: "Invoice #" },
                  { key: "customerName", label: "Customer" },
                  { key: "orderType", label: "Type" },
                  { key: "totalAmount", label: "Total" },
                  { key: "refund.status", label: "Refund Status" },
                  { key: "createdAt", label: "Date" },
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
              {sales.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No sales found.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr
                    key={sale._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 font-bold">
                      #{sale.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {sale.customerName || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {sale.orderType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">
                      ₱{sale.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {renderRefundBadge(sale.refund?.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {sale.refund?.status ? (
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setIsViewOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                          title="View Refund Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenRefund(sale)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Process Refund"
                        >
                          <RotateCcw className="w-4 h-4" />
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

export default Refund;
