import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import DashboardLayout from "../scripts/DashboardLayout";
import EditModal from "../components/EditModal";
import ViewModal from "../components/ViewModal";
import PopupMessage from "../components/PopupMessage";
import ConfirmationModal from "../components/ConfirmationModal";
import { showToast } from "../components/ToastContainer";
import "../styles/App.css";
import "../styles/CustomerManagement.css";

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [viewedItem, setViewedItem] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const [modalMode, setModalMode] = useState("view");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [columnFilter, setColumnFilter] = useState({ field: "", order: "" });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await authFetch(
        `${API_BASE}/api/customers/paginated?page=${page}&limit=10&search=${encodeURIComponent(
          searchQuery
        )}&field=${encodeURIComponent(
          columnFilter.field || ""
        )}&order=${encodeURIComponent(columnFilter.order || "")}`
      );
      const data = await res.json();

      setCustomers(data.customers || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || (data.items ? data.items.length : 0));
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
    }
  }, [page, searchQuery, columnFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [page, searchQuery, columnFilter, fetchCustomers]);

  const validateCustomerData = (data) => {
    const { customerId, name } = data;

    if (!customerId?.trim() || !name?.trim()) {
      setPopupMessage("Please fill in all required fields.");
      setPopupType("error");
      return false;
    }

    if (
      modalMode === "add" &&
      (customers || []).some(
        (c) => c.customerId.toLowerCase() === customerId.trim().toLowerCase()
      )
    ) {
      setPopupMessage("Customer ID already exists. Please choose a unique ID.");
      setPopupType("error");
      return false;
    }

    return true;
  };

  const handleAddCustomer = async (newCustomer) => {
    if (!validateCustomerData(newCustomer)) return;

    try {
      const response = await authFetch(`${API_BASE}/api/customers`, {
        method: "POST",
        body: JSON.stringify(newCustomer),
      });

      if (!response.ok) throw new Error("Add failed");

      const added = await response.json();
      setCustomers((prev) => [...(prev || []), added]);
      setPopupMessage("Customer added successfully!");
      setPopupType("success");
      setModalMode("view");
    } catch (error) {
      console.error("Failed to add customer:", error);
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Update failed");
      }

      if (result.message?.includes("request")) {
        showToast({
          message: result.message,
          type: "info",
          duration: 3000,
        });
      } else {
        setCustomers((prev) =>
          prev.map((customer) =>
            customer._id === result._id ? result : customer
          )
        );

        setPage(1);
        await fetchCustomers();

        showToast({
          message: "Customer updated successfully!",
          type: "success",
          duration: 3000,
        });
      }

      setSelectedItem(null);
      setModalMode("view");
    } catch (error) {
      console.error("Failed to update customer:", error);
      showToast({
        message: error.message || "Failed to update customer.",
        type: "error",
        duration: 3000,
      });
    }
  };

  const confirmDelete = async () => {
    try {
      const res = await authFetch(
        `${API_BASE}/api/customers/${itemToDelete._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      setPage(1);
      await fetchCustomers();

      if (res.ok && data.message === "Customer deleted successfully") {
        setCustomers((prev) =>
          (prev || []).filter((c) => c._id !== itemToDelete._id)
        );
      }

      showToast({
        message: data.message || "Action successful!",
        type: res.ok ? "success" : "error",
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to delete item:", error);
      showToast({
        message: error.message || "Failed to delete item.",
        type: "error",
        duration: 3000,
      });
    } finally {
      setIsConfirmOpen(false);
      setIsViewOpen(false);
      setItemToDelete(null);
    }
  };

  const handleEditClick = (customer) => {
    setSelectedItem(customer);
    setModalMode("edit");
  };

  const handleViewClick = (customer) => {
    setViewedItem(customer);
    setIsViewOpen(true);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setIsConfirmOpen(true);
  };

  const handleColumnClick = (field) => {
    if (columnFilter.field === field) {
      if (columnFilter.order === "asc") {
        setColumnFilter({ field, order: "desc" });
      } else {
        setColumnFilter({ field: "", order: "" });
      }
    } else {
      setColumnFilter({ field, order: "asc" });
    }
    setPage(1);
  };

  return (
    <>
      <DashboardLayout>
        {(modalMode === "add" || modalMode === "edit") && (
          <EditModal
            item={modalMode === "edit" ? selectedItem : {}}
            fields={[
              { name: "customerId", label: "Customer ID", required: "true" },
              { name: "name", label: "Name", required: "true" },
              { name: "email", label: "Email" },
              { name: "phoneNumber", label: "Phone Number" },
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

        {isViewOpen && (
          <ViewModal
            item={viewedItem}
            fields={[
              { name: "customerId", label: "Customer ID" },
              { name: "name", label: "Name" },
              { name: "email", label: "Email" },
              { name: "phoneNumber", label: "Phone Number" },
              { name: "address", label: "Address" },
              {
                name: "createdAt",
                label: "Created At",
                formatter: (value) =>
                  value
                    ? new Date(value).toLocaleDateString("en-PH", {
                        timeZone: "Asia/Manila",
                      })
                    : "—",
              },
            ]}
            onClose={() => {
              setIsViewOpen(false);
              setViewedItem(null);
            }}
            onDelete={() => handleDelete(viewedItem)}
          />
        )}

        {isConfirmOpen && (
          <ConfirmationModal
            message={`Are you sure you want to delete "${
              itemToDelete?.name || "this item"
            }"?`}
            onConfirm={confirmDelete}
            onCancel={() => {
              setIsConfirmOpen(false);
              setItemToDelete(null);
            }}
          />
        )}

        {popupMessage && (
          <PopupMessage
            message={popupMessage}
            type={popupType}
            onClose={() => {
              setPopupMessage("");
              setPopupType("");
            }}
          />
        )}

        <main className="module-main-content customer-main">
          <div className="module-header">
            <h1 className="module-title">Customer Management</h1>
          </div>

          <div className="module-actions-container">
            <input
              type="text"
              className="module-search-input"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <button
              className="module-action-btn module-add-btn"
              onClick={() => {
                setModalMode("add");
                setSelectedItem(null);
              }}
            >
              Add Customer
            </button>
          </div>

          <div className="module-table-container">
            <table>
              <thead>
                <tr>
                  {[
                    { key: "customerId", label: "ID" },
                    { key: "name", label: "Name" },
                    { key: "email", label: "Email" },
                    { key: "phoneNumber", label: "Number" },
                    { key: "address", label: "Address" },
                    { key: "createdAt", label: "Created" },
                    { key: "updatedAt", label: "Updated" },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      className="sortable-header"
                      onClick={() => handleColumnClick(key)}
                    >
                      {label}
                      {columnFilter.field === key && (
                        <span className="sort-arrow">
                          {columnFilter.order === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
                  ))}

                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="8">No customers found.</td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer._id}>
                      <td>{customer.customerId}</td>
                      <td>{customer.name}</td>
                      <td>{customer.email || "—"}</td>
                      <td>{customer.phoneNumber || "—"}</td>
                      <td>{customer.address || "—"}</td>
                      <td>
                        {customer.createdAt
                          ? new Date(customer.createdAt).toLocaleString(
                              "en-PH",
                              {
                                timeZone: "Asia/Manila",
                              }
                            )
                          : "—"}
                      </td>
                      <td>
                        {customer.updatedAt
                          ? new Date(customer.updatedAt).toLocaleString(
                              "en-PH",
                              {
                                timeZone: "Asia/Manila",
                              }
                            )
                          : "—"}
                      </td>
                      <td>
                        <button
                          onClick={() => handleEditClick(customer)}
                          className="module-action-btn module-edit-btn"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleViewClick(customer)}
                          className="module-action-btn module-view-btn"
                        >
                          View
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
              Showing {(page - 1) * 10 + 1}–
              {Math.min(page * 10, totalPages * 10)} of {totalItems} customers
            </p>

            <div className="pagination-buttons">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
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
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
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

export default CustomerManagement;
