import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import { customAlphabet } from "nanoid/non-secure";
import {
  Users,
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

import EditModal from "../components/EditModal";
import ViewModal from "../components/ViewModal";
import PopupMessage from "../components/PopupMessage";
import ConfirmationModal from "../components/ConfirmationModal";
import { showToast } from "../components/ToastContainer";

const CustomerManagement = () => {
  // --- States ---
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [viewedItem, setViewedItem] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const [modalMode, setModalMode] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [columnFilter, setColumnFilter] = useState({ field: "", order: "" });

  const nanoid = customAlphabet("0123456789", 6);
  const navigate = useNavigate();

  // --- Auth Check ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const fetchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        search: searchQuery,
        field: columnFilter.field,
        order: columnFilter.order,
      });

      const res = await authFetch(
        `${API_BASE}/api/customers/paginated?${params}`
      );
      const data = await res.json();

      setCustomers(data.customers || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
    }
  }, [page, searchQuery, columnFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // --- Handlers ---
  const validateCustomerData = (data) => {
    if (!data.name?.trim()) {
      setPopupMessage("Please fill in required fields.");
      setPopupType("error");
      return false;
    }
    return true;
  };

  const handleAddCustomer = async (newCustomer) => {
    if (!validateCustomerData(newCustomer)) return;
    try {
      const customerWithId = { ...newCustomer, customerId: `CUST-${nanoid()}` };
      const response = await authFetch(`${API_BASE}/api/customers`, {
        method: "POST",
        body: JSON.stringify(customerWithId),
      });

      if (!response.ok) throw new Error("Add failed");

      await fetchCustomers();
      setPopupMessage("Customer added successfully!");
      setPopupType("success");
      setModalMode(null);
    } catch (error) {
      setPopupMessage("Failed to add customer.");
      setPopupType("error");
    }
  };

  const handleSaveChanges = async (updatedCustomer) => {
    if (!validateCustomerData(updatedCustomer)) return;
    try {
      const response = await authFetch(
        `${API_BASE}/api/customers/${updatedCustomer._id}`,
        {
          method: "PUT",
          body: JSON.stringify(updatedCustomer),
        }
      );

      if (!response.ok) throw new Error("Update failed");

      await fetchCustomers();
      showToast({ message: "Customer updated!", type: "success" });
      setSelectedItem(null);
      setModalMode(null);
    } catch (error) {
      showToast({ message: "Failed to update.", type: "error" });
    }
  };

  const confirmDelete = async () => {
    try {
      await authFetch(`${API_BASE}/api/customers/${itemToDelete._id}`, {
        method: "DELETE",
      });
      await fetchCustomers();
      showToast({ message: "Customer deleted!", type: "success" });
    } catch (error) {
      showToast({ message: "Delete failed.", type: "error" });
    } finally {
      setIsConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleColumnClick = (field) => {
    if (columnFilter.field === field) {
      if (columnFilter.order === "asc")
        setColumnFilter({ field, order: "desc" });
      else setColumnFilter({ field: "", order: "" });
    } else {
      setColumnFilter({ field, order: "asc" });
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
            <Users className="w-8 h-8 text-brand-primary" />
            Customer Management
          </h1>
          <p className="text-gray-500 text-sm">
            Manage customer database and history.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
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
            setSelectedItem(null);
          }}
          className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors font-medium whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                {[
                  { key: "customerId", label: "ID" },
                  { key: "name", label: "Name" },
                  { key: "email", label: "Email" },
                  { key: "phoneNumber", label: "Contact" },
                  { key: "address", label: "Address" },
                  { key: "createdAt", label: "Created" },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-6 py-4 cursor-pointer hover:text-brand-primary"
                    onClick={() => handleColumnClick(key)}
                  >
                    {label}{" "}
                    {columnFilter.field === key &&
                      (columnFilter.order === "asc" ? "▲" : "▼")}
                  </th>
                ))}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {c.customerId}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 flex items-center gap-2">
                      <Mail className="w-3 h-3" /> {c.email || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <span className="flex items-center gap-2">
                        <Phone className="w-3 h-3" /> {c.phoneNumber || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> {c.address || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setViewedItem(c);
                          setIsViewOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setModalMode("edit");
                          setSelectedItem(c);
                        }}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete(c);
                          setIsConfirmOpen(true);
                        }}
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
      {(modalMode === "add" || modalMode === "edit") && (
        <EditModal
          item={modalMode === "edit" ? selectedItem : {}}
          fields={[
            { name: "name", label: "Name", required: "true" },
            { name: "email", label: "Email" },
            { name: "phoneNumber", label: "Contact" },
            { name: "address", label: "Address" },
          ]}
          onSave={modalMode === "add" ? handleAddCustomer : handleSaveChanges}
          modalType="customer"
          onClose={() => {
            setModalMode(null);
            setSelectedItem(null);
          }}
          mode={modalMode}
        />
      )}

      {isViewOpen && viewedItem && (
        <ViewModal
          item={viewedItem}
          fields={[
            { name: "customerId", label: "ID" },
            { name: "name", label: "Name" },
            { name: "email", label: "Email" },
            { name: "phoneNumber", label: "Contact" },
            { name: "address", label: "Address" },
            {
              name: "createdAt",
              label: "Created",
              formatter: (v) => new Date(v).toLocaleString(),
            },
          ]}
          onClose={() => {
            setIsViewOpen(false);
            setViewedItem(null);
          }}
          onDelete={() => {
            setItemToDelete(viewedItem);
            setIsConfirmOpen(true);
          }}
        />
      )}

      {isConfirmOpen && (
        <ConfirmationModal
          message={`Delete customer "${itemToDelete?.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setIsConfirmOpen(false);
            setItemToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default CustomerManagement;
