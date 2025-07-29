import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../scripts/Sidebar";
import EditModal from "../components/EditModal";
import ViewModal from "../components/ViewModal";
import PopupMessage from "../components/PopupMessage";
import ConfirmationModal from "../components/ConfirmationModal";
import "../styles/App.css";
import "../styles/SupplierManagement.css";

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("supplierId");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [pendingEditData, setPendingEditData] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewedSupplier, setViewedSupplier] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const supplierFields = [
    { label: "Supplier ID", name: "supplierId", required: "true" },
    { label: "Name", name: "name", required: "true" },
    { label: "Contact", name: "contact" },
    { label: "Company", name: "company" },
  ];

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("success");
    }, 2000);
  };

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/suppliers`);
      const data = await res.json();
      setSuppliers(data);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredSuppliers([]);
      return;
    }
    const filtered = suppliers.filter((s) =>
      (s[searchField] || "").toLowerCase().includes(query)
    );
    setFilteredSuppliers(filtered);
  }, [searchQuery, searchField, suppliers]);

  const validateFormData = (data) => {
    if (!data.supplierId?.trim() || !data.name?.trim()) {
      showPopup("Please fill out required fields.", "error");
      return false;
    }
    if (
      modalMode === "add" &&
      suppliers.some(
        (s) => s.supplierId.toLowerCase() === data.supplierId.toLowerCase()
      )
    ) {
      showPopup("Supplier ID already exists.", "error");
      return false;
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

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      await fetchSuppliers();
      setSelectedSupplier(null);
      setModalMode("view");
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
    if (pendingEditData) {
      await saveSupplier(pendingEditData);
    }
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
      await fetch(`${API_BASE}/api/suppliers/${supplierToDelete._id}`, {
        method: "DELETE",
      });
      setSuppliers((prev) =>
        prev.filter((s) => s._id !== supplierToDelete._id)
      );
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

  const isFiltering = searchQuery.trim() !== "";

  return (
    <>
      {popupMessage && (
        <PopupMessage
          message={popupMessage}
          type={popupType}
          onClose={() => setPopupMessage("")}
        />
      )}

      {isViewOpen && viewedSupplier && (
        <ViewModal
          item={viewedSupplier}
          fields={[
            { name: "supplierId", label: "Supplier ID" },
            { name: "name", label: "Name" },
            { name: "contact", label: "Contact" },
            { name: "company", label: "Company" },
            {
              name: "createdAt",
              label: "Created",
              formatter: (val) => new Date(val).toLocaleString(),
            },
            {
              name: "updatedAt",
              label: "Updated",
              formatter: (val) => new Date(val).toLocaleString(),
            },
          ]}
          onClose={() => {
            setIsViewOpen(false);
            setViewedSupplier(null);
          }}
          onDelete={() => handleDelete(viewedSupplier._id)}
        />
      )}

      {isConfirmOpen && (
        <ConfirmationModal
          message={`Are you sure you want to delete "${
            supplierToDelete?.name || "this supplier"
          }"?`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setIsConfirmOpen(false);
            setSupplierToDelete(null);
          }}
        />
      )}

      {showConfirmation && (
        <ConfirmationModal
          message="Are you sure you want to save these changes?"
          onConfirm={handleConfirmEdit}
          onCancel={() => {
            setPendingEditData(null);
            setShowConfirmation(false);
          }}
        />
      )}

      {(modalMode === "edit" || modalMode === "add") && (
        <EditModal
          item={modalMode === "edit" ? selectedSupplier : {}}
          fields={supplierFields}
          onSave={handleAddOrEdit}
          onClose={() => {
            setSelectedSupplier(null);
            setModalMode("view");
          }}
          mode={modalMode}
        />
      )}

      <Sidebar />

      <main className="module-main-content supplier-main">
		<div className="module-header">
			<h1 className="module-title">Supplier Management</h1>
		</div>

        <div className="module-actions-container">
          <select
            className="module-filter-dropdown"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value="supplierId">Supplier ID</option>
            <option value="name">Name</option>
            <option value="contact">Contact</option>
            <option value="company">Company</option>
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
              setSelectedSupplier(null);
            }}
          >
            Add Supplier
          </button>
        </div>

        <div className="module-table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Company</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(isFiltering ? filteredSuppliers : suppliers).length === 0 ? (
                <tr>
                  <td colSpan="7">No suppliers found.</td>
                </tr>
              ) : (
                (isFiltering ? filteredSuppliers : suppliers).map(
                  (supplier) => (
                    <tr key={supplier._id}>
                      <td>{supplier.supplierId}</td>
                      <td>{supplier.name}</td>
                      <td>{supplier.contact}</td>
                      <td>{supplier.company}</td>
                      <td>{new Date(supplier.createdAt).toLocaleString()}</td>
                      <td>{new Date(supplier.updatedAt).toLocaleString()}</td>
                      <td>
                        <button
                          className="module-action-btn module-edit-btn"
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setModalMode("edit");
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="module-action-btn module-view-btn"
                          onClick={() => {
                            setViewedSupplier(supplier);
                            setIsViewOpen(true);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
};

export default SupplierManagement;
