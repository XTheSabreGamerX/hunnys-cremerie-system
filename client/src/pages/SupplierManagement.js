import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../scripts/DashboardLayout";
import EditModal from "../components/EditModal";
import ViewModal from "../components/ViewModal";
import PopupMessage from "../components/PopupMessage";
import ConfirmationModal from "../components/ConfirmationModal";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import "../styles/App.css";
import "../styles/SupplierManagement.css";

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("supplierId");
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
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const supplierFields = [
    { label: "Supplier ID", name: "supplierId", required: "true" },
    { label: "Name", name: "name", required: "true" },
    { label: "Contact", name: "contact" },
    { label: "Company", name: "company" },
  ];

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => setPopupMessage(""), 2000);
  };

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
      setTotalItems(data.totalItems || 0);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      showPopup("Failed to load suppliers.", "error");
    }
  }, [page, searchQuery, sortField, sortOrder]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const validateFormData = (data) => {
    if (!data.supplierId?.trim() || !data.name?.trim()) {
      showPopup("Please fill out required fields.", "error");
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

      await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

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
        {
          method: "DELETE",
        }
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
              formatter: (v) => new Date(v).toLocaleString(),
            },
            {
              name: "updatedAt",
              label: "Updated",
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
          modalType="supplier"
          onClose={() => {
            setModalMode(null);
            setSelectedSupplier(null);
          }}
          mode={modalMode}
        />
      )}

      <DashboardLayout>
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
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
                  {[
                    { key: "supplierId", label: "ID" },
                    { key: "name", label: "Name" },
                    { key: "contact", label: "Contact" },
                    { key: "company", label: "Company" },
                    { key: "createdAt", label: "Created" },
                    { key: "updatedAt", label: "Updated" },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      style={{
                        cursor: "pointer",
                        userSelect: "none",
                      }}
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
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan="7">No suppliers found.</td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
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
                            setModalMode("edit");
                            setSelectedSupplier(supplier);
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Your pagination UI unchanged */}
          <div className="pagination">
            <p className="pagination-info">
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, totalItems)} of{" "}
              {totalItems} suppliers
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

export default SupplierManagement;
