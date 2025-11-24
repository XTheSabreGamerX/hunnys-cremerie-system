import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { customAlphabet } from "nanoid";
import {
  Truck,
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  Phone,
  Building,
  Mail,
} from "lucide-react"; // Modern Icons

import EditModal from "../components/EditModal";
import ViewModal from "../components/ViewModal";
import PopupMessage from "../components/PopupMessage";
import ConfirmationModal from "../components/ConfirmationModal";
import { authFetch, API_BASE } from "../utils/tokenUtils";

const SupplierManagement = () => {
  // --- States ---
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [pendingEditData, setPendingEditData] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewedSupplier, setViewedSupplier] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Removed unused totalItems state
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const nanoid = customAlphabet("0123456789", 6);
  const navigate = useNavigate();

  // --- Auth Check ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const supplierFields = [
    { label: "Name", name: "name", required: true },
    { label: "Contact Person", name: "contactPerson" },
    { label: "Contact Number", name: "contactNumber" },
    { label: "Email", name: "email", type: "email" },
    { label: "Company", name: "company" },
  ];

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  // --- Fetch Data ---
  const fetchSuppliers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        search: searchQuery,
        field: sortField,
        order: sortOrder,
      });

      const res = await authFetch(
        `${API_BASE}/api/suppliers/paginated?${params}`
      );
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      const data = await res.json();

      setSuppliers(data.suppliers || []);
      setTotalPages(data.totalPages || 1);
      // Removed setTotalItems call
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      showPopup("Failed to load suppliers.", "error");
    }
  }, [page, searchQuery, sortField, sortOrder]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // --- Handlers ---
  const validateFormData = (data) => {
    if (!data.name?.trim()) {
      showPopup("Please fill out required fields.", "error");
      return false;
    }
    if (data.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(data.email)) {
        showPopup("Please enter a valid email address.", "error");
        return false;
      }
    }
    return true;
  };

  const saveSupplier = async (data) => {
    try {
      const method = modalMode === "add" ? "POST" : "PUT";
      const url =
        modalMode === "add"
          ? `${API_BASE}/api/suppliers`
          : `${API_BASE}/api/suppliers/${data._id}`;

      if (modalMode === "add") data.supplierId = `SUP-${nanoid()}`;

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        showPopup(result.message || "Save failed.", "error");
        return;
      }

      await fetchSuppliers();
      setSelectedSupplier(null);
      setModalMode(null);
      showPopup(
        `Supplier ${modalMode === "add" ? "added" : "updated"} successfully!`
      );
    } catch (err) {
      console.error("Save failed:", err);
      showPopup("Save failed.", "error");
    }
  };

  const handleAddOrEdit = async (data) => {
    if (!validateFormData(data)) return;
    if (modalMode === "edit") {
      setPendingEditData(data);
      setShowConfirmation(true);
    } else {
      await saveSupplier(data);
    }
  };

  const handleConfirmEdit = async () => {
    if (pendingEditData) await saveSupplier(pendingEditData);
    setPendingEditData(null);
    setShowConfirmation(false);
  };

  const handleDelete = (id) => {
    const supplier = suppliers.find((s) => s._id === id);
    setSupplierToDelete(supplier);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await authFetch(
        `${API_BASE}/api/suppliers/${supplierToDelete._id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed.");
      await fetchSuppliers();
      showPopup("Supplier deleted successfully!");
    } catch (err) {
      console.error("Delete failed:", err);
      showPopup("Delete failed.", "error");
    } finally {
      setIsConfirmOpen(false);
      setIsViewOpen(false);
      setSupplierToDelete(null);
    }
  };

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

  return (
    <div className="space-y-6">
      {popupMessage && (
        <PopupMessage
          message={popupMessage}
          type={popupType}
          onClose={() => setPopupMessage("")}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="w-8 h-8 text-brand-primary" />
            Supplier Management
          </h1>
          <p className="text-gray-500 text-sm">
            Manage supplier relationships and contact details.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <button
          onClick={() => {
            setModalMode("add");
            setSelectedSupplier(null);
          }}
          className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors font-medium whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add Supplier
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                {[
                  { key: "supplierId", label: "ID" },
                  { key: "name", label: "Name" },
                  { key: "contactPerson", label: "Contact Person" },
                  { key: "contactNumber", label: "Contact Number" },
                  { key: "email", label: "Email" },
                  { key: "company", label: "Company" },
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
              {suppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr
                    key={supplier._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {supplier.supplierId}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {supplier.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {supplier.contactPerson || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 flex items-center gap-2">
                      <Phone className="w-3 h-3" />{" "}
                      {supplier.contactNumber || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 flex items-center gap-2">
                      <Mail className="w-3 h-3" /> {supplier.email || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <span className="flex items-center gap-2">
                        <Building className="w-3 h-3" />{" "}
                        {supplier.company || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setViewedSupplier(supplier);
                          setIsViewOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setModalMode("edit");
                          setSelectedSupplier(supplier);
                        }}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
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

      {/* Modals */}
      {(modalMode === "edit" || modalMode === "add") && (
        <EditModal
          item={modalMode === "edit" ? selectedSupplier : {}}
          fields={supplierFields}
          onSave={handleAddOrEdit}
          modalType="supplier"
          onClose={() => {
            setModalMode(null);
            setSelectedSupplier(null);
          }}
          mode={modalMode}
        />
      )}

      {isViewOpen && viewedSupplier && (
        <ViewModal
          item={viewedSupplier}
          fields={[
            { name: "supplierId", label: "ID" },
            { name: "name", label: "Name" },
            { name: "contactPerson", label: "Contact Person" },
            { name: "contactNumber", label: "Contact Number" },
            { name: "email", label: "Email" },
            { name: "company", label: "Company" },
            {
              name: "createdAt",
              label: "Created",
              formatter: (v) => new Date(v).toLocaleString(),
            },
          ]}
          onClose={() => {
            setViewedSupplier(null);
            setIsViewOpen(false);
          }}
          onDelete={() => handleDelete(viewedSupplier._id)}
        />
      )}

      {showConfirmation && (
        <ConfirmationModal
          message="Save changes?"
          onConfirm={handleConfirmEdit}
          onCancel={() => {
            setPendingEditData(null);
            setShowConfirmation(false);
          }}
        />
      )}

      {isConfirmOpen && (
        <ConfirmationModal
          message={`Delete supplier "${supplierToDelete?.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setIsConfirmOpen(false);
            setSupplierToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default SupplierManagement;
