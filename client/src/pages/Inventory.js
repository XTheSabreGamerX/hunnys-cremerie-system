import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { customAlphabet } from "nanoid/non-secure";
import Sidebar from "../scripts/Sidebar";
import EditModal from "../components/EditModal";
import ViewModal from "../components/ViewModal";
import PopupMessage from "../components/PopupMessage";
import ConfirmationModal from "../components/ConfirmationModal";
import { showToast } from "../components/ToastContainer";
import "../styles/App.css";
import "../styles/Inventory.css";

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("itemId");
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [formData, setFormData] = useState({});
  const [pendingEditData, setPendingEditData] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewedItem, setViewedItem] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const nanoid = customAlphabet("0123456789", 6);
  const containerRef = useRef(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const inventoryFields = [
    {
      label: "Item ID",
      name: "itemId",
      placeholder: "e.g. BOX-001, CAKE-025, etc... Leave empty for default ID",
    },
    { label: "Item Name", name: "name", required: true },
    { label: "Stock", name: "stock", type: "number" },
    { label: "Category", name: "category" },
    { label: "Purchase Price", name: "purchasePrice", type: "number" },
    { label: "Unit Price", name: "unitPrice", type: "number" },
    {
      label: "Unit of Measurement",
      name: "unit",
      type: "select",
      options: uoms.map((u) => ({ value: u._id, label: u.name })),
    },
    {
      label: "Supplier",
      name: "supplier",
      type: "select",
      options: suppliers.map((s) => ({
        value: s._id,
        label: s.name,
      })),
    },
    { label: "Restock Threshold", name: "restockThreshold", type: "number" },
    { label: "Expiration Date", name: "expirationDate", type: "date" },
  ];

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("success");
    }, 2000);
  };

  // Fetches all inventory items
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/inventory?page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      const wrappedData = Array.isArray(data)
        ? {
            items: data,
            currentPage: 1,
            totalPages: 1,
            totalItems: data.length,
          }
        : data;

      if (page === 1) {
        setItems(wrappedData.items);
      } else {
        setItems((prev) => [...prev, ...wrappedData.items]);
      }

      setHasMore(page < wrappedData.totalPages);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  }, [API_BASE, page, token]);

  // Fetch Suppliers
  const fetchSuppliers = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/suppliers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch suppliers");
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        console.error("Expected an array, got:", data);
        return;
      }

      setSuppliers(data);
    } catch (err) {
      console.error("Error fetching suppliers:", err.message);
    }
  }, [API_BASE]);

  // Fetch Units of Measurements
  useEffect(() => {
    const fetchUoms = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/inventory/uom`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch UoMs");
        const data = await res.json();
        setUoms(data);
      } catch (err) {
        console.error("Failed to fetch UoM:", err);
      }
    };

    if (token) fetchUoms();
  }, [API_BASE, page, token]);

  useEffect(() => {
    fetchItems();
    fetchSuppliers();
  }, [page, fetchItems, fetchSuppliers]);

  // Infinite Scroll for pagination
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

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      setFilteredItems([]);
      return;
    }

    const filtered = items.filter((item) =>
      (item[searchField] || "").toString().toLowerCase().includes(query)
    );

    setFilteredItems(filtered);
  }, [searchQuery, searchField, items]);

  const validateFormData = (data) => {
    const { itemId, name, stock, unitPrice, expirationDate } = data;

    if (!name?.trim()) {
      showPopup("Please fill up the required fields!", "error");
      return false;
    }

    data.stock = stock === "" || stock === undefined ? 0 : Number(stock);
    data.unitPrice =
      unitPrice === "" || unitPrice === undefined ? 0 : Number(unitPrice);

    if (isNaN(data.stock) || data.stock < 0) {
      showPopup("Stock must be a non-negative number.", "error");
      return false;
    }

    if (isNaN(data.unitPrice) || data.unitPrice < 0) {
      showPopup("Unit price must be a non-negative number.", "error");
      return false;
    }

    if (expirationDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expDate = new Date(expirationDate);
      expDate.setHours(0, 0, 0, 0);
      if (expDate < today) {
        showPopup("Expiration date cannot be in the past.", "error");
        return false;
      }
    }

    if (
      modalMode === "add" &&
      itemId?.trim() &&
      items.some((i) => i.itemId.toLowerCase() === itemId.trim().toLowerCase())
    ) {
      showPopup("Item ID already exists. Please choose a unique ID.", "error");
      return false;
    }

    return true;
  };

  // Saves item changes
  const saveItem = async (data) => {
    try {
      let itemId = data.itemId?.trim();

      if (modalMode === "add" && !itemId) {
        itemId = `INV-${nanoid(6)}`;
      }

      const payload = {
        ...data,
        itemId,
        stock: isNaN(Number(data.stock)) ? 0 : Number(data.stock),
        unitPrice: isNaN(Number(data.unitPrice)) ? 0 : Number(data.unitPrice),
      };

      const method = modalMode === "add" ? "POST" : "PUT";
      const url =
        modalMode === "add"
          ? `${API_BASE}/api/inventory`
          : `${API_BASE}/api/inventory/${data._id}`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMsg = "Something went wrong.";
        try {
          const errorData = await res.json();
          if (errorData.message) {
            errorMsg = errorData.message;
          }
        } catch {
          const errorText = await res.text();
          errorMsg = errorText;
        }
        throw new Error(errorMsg);
      }

      setPage(1);
      setHasMore(true);
      await fetchItems();
      setSelectedItem(null);
      setModalMode("view");

      showToast({
        message: `Item ${
          modalMode === "add" ? "added" : "updated"
        } successfully!`,
        type: "success",
        duration: 3000,
      });

      /*showPopup(
        `Item ${modalMode === "add" ? "added" : "updated"} successfully!`,
        "success"
      );*/
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Save failed:", errorMessage);
      showToast({
        message: `Save failed: ${errorMessage}`,
        type: "error",
        duration: 3000,
      });
      //showPopup(`Save failed: ${errorMessage}`, "error");
    }
  };

  const handleAddOrEdit = async (data) => {
    if (!validateFormData(data)) return;

    if (modalMode === "edit") {
      setPendingEditData(data);
      setShowConfirmation(true);
    } else {
      await saveItem(data);
    }
  };

  const handleConfirmEdit = async () => {
    if (pendingEditData) {
      await saveItem(pendingEditData);
    }
    setPendingEditData(null);
    setShowConfirmation(false);
  };

  const handleDelete = (itemId) => {
    const item = items.find((i) => i._id === itemId);
    setItemToDelete(item);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/inventory/${itemToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Delete failed");

      setPage(1);
      setHasMore(true);
      await fetchItems();
      showToast({
        message: "Item deleted successfully!",
        type: "success",
        duration: 3000,
      });
      //showPopup("Item deleted successfully!", "success");
    } catch (error) {
      console.error("Failed to delete item:", error);
      showToast({
        message: "Failed to delete item.",
        type: "error",
        duration: 3000,
      });
      //showPopup("Failed to delete item.", "error");
    } finally {
      setIsConfirmOpen(false);
      setIsViewOpen(false);
      setItemToDelete(null);
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

      {isViewOpen && viewedItem && (
        <ViewModal
          item={viewedItem}
          fields={[
            { name: "name", label: "Item Name" },
            { name: "category", label: "Category" },
            { name: "stock", label: "Stock" },
            { name: "purchasePrice", label: "Purchase Price" },
            { name: "unitPrice", label: "Price" },
            {
              name: "unit",
              label: "Unit of Measurement",
              render: (val) => val?.name || "—",
            },
            {
              name: "supplier",
              label: "Supplier",
              render: (val) =>
                suppliers.find((s) => s._id === val)?.name || "—",
            },
            { name: "restockThreshold", label: "Restock Threshold" },
            {
              name: "expirationDate",
              label: "Expiration Date",
              render: (val) =>
                val
                  ? new Date(val).toLocaleDateString("en-PH", {
                      timeZone: "Asia/Manila",
                    })
                  : "N/A",
            },
            { name: "status", label: "Status" },
            {
              name: "createdBy",
              label: "Created By",
              render: (val) => val?.username || "—",
            },
          ]}
          onClose={() => {
            setIsViewOpen(false);
            setViewedItem(null);
          }}
          onDelete={() => handleDelete(viewedItem._id)}
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

      {(modalMode === "edit" || modalMode === "add") && (
        <EditModal
          item={modalMode === "edit" ? selectedItem : null}
          fields={inventoryFields}
          onSave={handleAddOrEdit}
          modalType="inventory"
          onClose={() => {
            setSelectedItem(null);
            setModalMode("view");
          }}
          mode={modalMode}
          formData={formData}
          setFormData={setFormData}
          uoms={uoms}
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

      <Sidebar />

      <main className="module-main-content inventory-main">
        <div className="module-header">
          <h1 className="module-title">Inventory</h1>
        </div>

        <div className="module-actions-container">
          <select
            className="module-filter-dropdown"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value="itemId">Item ID</option>
            <option value="name">Name</option>
            <option value="category">Category</option>
            <option value="supplier">Supplier</option>
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
              setFormData({});
            }}
          >
            Add Item
          </button>
        </div>

        <div className="module-table-container" ref={containerRef}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Item Name</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Purchase Price</th>
                <th>Unit Price</th>
                <th>UoM</th>
                <th>Supplier</th>
                <th>Expiration Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(isFiltering ? filteredItems : items).length === 0 ? (
                <tr>
                  <td colSpan="11">No items found.</td>
                </tr>
              ) : (
                (isFiltering ? filteredItems : items).map((item) => (
                  <tr key={item._id}>
                    <td>{item.itemId}</td>
                    <td>{item.name}</td>
                    <td>{item.stock}</td>
                    <td>{item.category || "—"}</td>
                    <td>₱{item.purchasePrice}</td>
                    <td>₱{item.unitPrice}</td>
                    <td>{item.unit?.name}</td>
                    <td>
                      {suppliers.find((s) => s._id === item.supplier)?.name ||
                        "—"}
                    </td>
                    <td>
                      {item.expirationDate
                        ? new Date(item.expirationDate).toLocaleDateString(
                            "en-PH",
                            {
                              timeZone: "Asia/Manila",
                            }
                          )
                        : "N/A"}
                    </td>
                    <td>{item.status}</td>
                    <td>
                      <button
                        className="module-action-btn module-edit-btn"
                        onClick={() => {
                          setSelectedItem(item);
                          setModalMode("edit");
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="module-action-btn module-view-btn"
                        onClick={() => {
                          setViewedItem(item);
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
      </main>
    </>
  );
};

export default Inventory;
