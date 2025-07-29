import React, { useEffect, useState } from "react";
import Sidebar from "../scripts/Sidebar";
import EditModal from "../components/EditModal";
import ViewModal from "../components/ViewModal";
import PopupMessage from "../components/PopupMessage";
import ConfirmationModal from "../components/ConfirmationModal";
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

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/customers`);
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const validateCustomerData = (data) => {
    const { customerId, name } = data;

    if (!customerId?.trim() || !name?.trim()) {
      setPopupMessage("Please fill in all required fields.");
      setPopupType("error");
      return false;
    }

    if (
      modalMode === "add" &&
      customers.some(
        (c) => c.customerId.toLowerCase() === customerId.trim().toLowerCase()
      )
    ) {
      setPopupMessage("Customer ID already exists. Please choose a unique ID.");
      setPopupType("error");
      return false;
    }

    return true;
  };

  const handleEditClick = (customer) => {
    setSelectedItem(customer);
    setModalMode("edit");
  };

  const handleAddCustomer = async (newCustomer) => {
    if (!validateCustomerData(newCustomer)) return;

    try {
      const response = await fetch(`${API_BASE}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      if (!response.ok) throw new Error("Add failed");

      const added = await response.json();
      setCustomers((prev) => [...prev, added]);
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedCustomer),
        }
      );
      if (!response.ok) throw new Error("Update failed");

      const updatedData = await response.json();
      setCustomers((prev) =>
        prev.map((customer) =>
          customer._id === updatedData._id ? updatedData : customer
        )
      );

      setPopupMessage("Customer updated successfully!");
      setPopupType("success");
      setSelectedItem(null);
      setModalMode("view");
    } catch (error) {
      console.error("Failed to update customer:", error);
      setPopupMessage("Failed to update customer.");
      setPopupType("error");
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/customers/${itemToDelete._id}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Delete failed");

      setCustomers((prev) => prev.filter((c) => c._id !== itemToDelete._id));
      setPopupMessage("Item deleted successfully!");
      setPopupType("success");
    } catch (error) {
      setPopupMessage("Failed to delete item.");
      setPopupType("error");
    } finally {
      setIsConfirmOpen(false);
      setIsViewOpen(false);
      setItemToDelete(null);
    }
  };

  const handleViewClick = (customer) => {
    setViewedItem(customer);
    setIsViewOpen(true);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setIsConfirmOpen(true);
  };

  const displayedCustomers = customers.filter((customer) => {
    const value = customer[searchField];
    return value?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <Sidebar />

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
              formatter: (value) => new Date(value).toLocaleDateString(),
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

        <div className="module-table-container">
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
                        ? new Date(customer.createdAt).toLocaleString("en-PH", {
                            timeZone: "Asia/Manila",
                          })
                        : "—"}
                    </td>
                    <td>
                      {customer.updatedAt
                        ? new Date(customer.updatedAt).toLocaleString("en-PH", {
                            timeZone: "Asia/Manila",
                          })
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
    </>
  );
};

export default CustomerManagement;