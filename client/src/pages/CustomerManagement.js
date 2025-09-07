import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../scripts/DashboardLayout";
import EditModal from "../components/EditModal";
import ViewModal from "../components/ViewModal";
import PopupMessage from "../components/PopupMessage";
import ConfirmationModal from "../components/ConfirmationModal";
import { showToast } from "../components/ToastContainer";
import "../styles/CustomerManagement.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("customerId");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [viewedItem, setViewedItem] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const [modalMode, setModalMode] = useState("view");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const authHeader = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/customers?page=${page}&limit=10`,
        {
          headers: authHeader,
        }
      );
      const data = await res.json();

      const wrappedData = Array.isArray(data)
        ? {
            customers: data,
            currentPage: 1,
            totalPages: 1,
          }
        : data;

      const newItems = Array.isArray(wrappedData.customers)
        ? wrappedData.customers
        : [];

      setCustomers((prev) =>
        page === 1 ? newItems : [...(prev || []), ...newItems]
      );
      setHasMore(page < wrappedData.totalPages);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setHasMore(false);
    }
  }, [page, authHeader]);

  useEffect(() => {
    fetchCustomers();
  }, [page, fetchCustomers]);

  useEffect(() => {
    const container = containerRef.current;

    const handleScroll = () => {
      if (
        container.scrollTop + container.clientHeight >=
          container.scrollHeight - 50 &&
        hasMore
      ) {
        setPage((prev) => prev + 1);
      }
    };

    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [hasMore]);

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
      const response = await fetch(`${API_BASE}/api/customers`, {
        method: "POST",
        headers: authHeader,
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
      const response = await fetch(
        `${API_BASE}/api/customers/${updatedCustomer._id}`,
        {
          method: "PUT",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
          },
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
        // Direct update (admin/manager/owner)
        setCustomers((prev) =>
          prev.map((customer) =>
            customer._id === result._id ? result : customer
          )
        );

        setPage(1);
        setHasMore(true);
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
      const res = await fetch(`${API_BASE}/api/customers/${itemToDelete._id}`, {
        method: "DELETE",
        headers: authHeader,
      });

      const data = await res.json();

      setPage(1);
      setHasMore(true);
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

  const displayedCustomers = Array.isArray(customers)
    ? customers.filter((customer) => {
        const value = customer[searchField];
        return value?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : [];

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
            <select
              className="module-filter-dropdown"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="customerId">Customer ID</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="phoneNumber">Phone</option>
              <option value="address">Address</option>
            </select>

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

          <div className="module-table-container" ref={containerRef}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Number</th>
                  <th>Address</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="8">No customers found.</td>
                  </tr>
                ) : (
                  displayedCustomers.map((customer) => (
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
        </main>
      </DashboardLayout>
    </>
  );
};

export default CustomerManagement;
