import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { customAlphabet } from "nanoid/non-secure";
import { Search, Plus, Edit, Trash2, Eye, Package, Filter } from "lucide-react";

import EditModal from "../components/EditModal";
import ViewModal from "../components/ViewModal";
import PopupMessage from "../components/PopupMessage";
import ConfirmationModal from "../components/ConfirmationModal";
import { showToast } from "../components/ToastContainer";
import { authFetch, API_BASE } from "../utils/tokenUtils";

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [cakeItems, setCakeItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState({ inventory: [], cake: [] });
  const [uoms, setUoms] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [columnFilter, setColumnFilter] = useState({ field: "", order: "" });
  const [inventoryType, setInventoryType] = useState("Inventory");

  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [formData, setFormData] = useState({}); // Used for EditModal
  const [pendingEditData, setPendingEditData] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewedItem, setViewedItem] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  const navigate = useNavigate();
  const location = useLocation();
  const nanoid = customAlphabet("0123456789", 6);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  // --- Configurations ---
  const inventoryFields = [
    {
      label: "Item Name",
      name: "name",
      required: true,
      placeholder: "e.g. All Purpose Flour",
    },
    {
      label: "Category",
      name: "category",
      type: "select",
      options: (categories.inventory || []).map((c) => ({
        value: c._id,
        label: c.name,
      })),
      required: true,
    },
    {
      label: "Purchase Price",
      name: "purchasePrice",
      type: "number",
      placeholder: "Cost per unit",
      required: true,
    },
    {
      label: "Unit Price (Selling)",
      name: "unitPrice",
      type: "number",
      required: true,
      placeholder: "Selling price",
    },
    {
      label: "Amount / Weight",
      name: "amount",
      type: "number",
      required: true,
      placeholder: "e.g. 1",
    },
    {
      label: "Unit of Measurement",
      name: "unit",
      type: "select",
      options: uoms.map((u) => ({ value: u._id, label: u.name })),
      required: true,
    },
    {
      label: "Supplier",
      name: "supplier",
      type: "select",
      options: suppliers.map((s) => ({ value: s._id, label: s.name })),
    },
    {
      label: "Stock Quantity",
      name: "stock",
      type: "number",
      required: true,
      placeholder: "Current stock count",
    },
    {
      label: "Restock Threshold",
      name: "restockThreshold",
      type: "number",
      placeholder: "Notify when stock reaches this level",
    },
    { label: "Expiration Date", name: "expirationDate", type: "date" },
  ];

  // --- Fetch Data ---
  const fetchItems = useCallback(async () => {
    try {
      let baseUrl = `${API_BASE}/api/${
        inventoryType === "Inventory" ? "inventory" : "cake"
      }`;
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", "10");

      if (searchQuery && searchQuery.trim() !== "")
        params.append("search", searchQuery.trim());
      if (columnFilter.field) {
        params.append("field", columnFilter.field);
        params.append("order", columnFilter.order || "asc");
      }

      const res = await authFetch(`${baseUrl}?${params.toString()}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      const result = Array.isArray(data)
        ? { items: data, totalPages: 1, totalItems: data.length }
        : data;

      if (inventoryType === "Inventory") {
        setItems(result.items || []);
        setTotalPages(result.totalPages || 1);
      } else {
        setCakeItems(result.cakes || result.items || []);
        setTotalPages(result.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  }, [page, searchQuery, columnFilter, inventoryType]);

  // Load Settings (Suppliers, Categories, UOMs)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [suppliersRes, uomsRes, catsRes] = await Promise.all([
          authFetch(`${API_BASE}/api/suppliers`),
          authFetch(`${API_BASE}/api/settings/uom`),
          authFetch(`${API_BASE}/api/settings/category`),
        ]);

        const suppliersData = await suppliersRes.json();
        const uomsData = await uomsRes.json();
        const catsData = await catsRes.json();

        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
        setUoms(Array.isArray(uomsData) ? uomsData : []);

        if (Array.isArray(catsData)) {
          setCategories({
            inventory: catsData.filter((c) => c.type === "inventory"),
            cake: catsData.filter((c) => c.type === "cake"),
          });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // --- Handlers ---

  const handleColumnClick = (field) => {
    setColumnFilter((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  // FIX: Normalize Data for Edit Modal
  const handleEditClick = (item) => {
    // 1. Convert Unit Object to ID
    const unitId =
      item.unit && typeof item.unit === "object" ? item.unit._id : item.unit;

    // 2. Convert Category Name to ID (since backend stores name, but dropdown wants ID)
    let categoryId = item.category;
    const foundCat = categories.inventory.find((c) => c.name === item.category);
    if (foundCat) {
      categoryId = foundCat._id;
    }

    const preparedItem = {
      ...item,
      unit: unitId,
      category: categoryId,
    };

    setSelectedItem(preparedItem);
    setFormData(preparedItem); // Pass sanitized data to form
    setModalMode("edit");
  };

  const saveItem = async (data) => {
    try {
      let method = modalMode.includes("add") ? "POST" : "PUT";
      let url =
        modalMode === "add"
          ? `${API_BASE}/api/inventory`
          : `${API_BASE}/api/inventory/${data._id}`;

      if (modalMode === "add" && !data.itemId) data.itemId = `INV-${nanoid(6)}`;

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Save failed");
      }

      showToast({ message: "Saved successfully!", type: "success" });
      fetchItems();
      setModalMode("view");
    } catch (err) {
      showToast({ message: err.message || "Failed to save", type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await authFetch(`${API_BASE}/api/inventory/${itemToDelete._id}`, {
        method: "DELETE",
      });
      showToast({ message: "Item deleted.", type: "success" });
      fetchItems();
    } catch (err) {
      showToast({ message: "Failed to delete.", type: "error" });
    } finally {
      setIsConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const renderStatusBadge = (status) => {
    let colorClass = "bg-gray-100 text-gray-800";
    if (
      status === "Well-stocked" ||
      status === "In Stock" ||
      status === "Available"
    )
      colorClass = "bg-green-100 text-green-800";
    else if (status === "Low-stock" || status === "Low Stock")
      colorClass = "bg-amber-100 text-amber-800";
    else if (status === "Out of stock" || status === "Out of Stock")
      colorClass = "bg-red-100 text-red-800";
    else if (status === "Expired") colorClass = "bg-rose-100 text-rose-800";

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
      <PopupMessage
        message={popupMessage}
        type={popupType}
        onClose={() => setPopupMessage("")}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-8 h-8 text-brand-primary" />
            Inventory Management
          </h1>
          <p className="text-gray-500 text-sm">
            Track stock levels, prices, and expiration dates.
          </p>
        </div>

        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg self-start">
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium bg-white text-brand-primary shadow-sm`}
          >
            Raw Ingredients
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          onClick={() => {
            setSelectedItem(null);
            setModalMode("add");
          }}
          className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors font-medium whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-4 cursor-pointer hover:text-brand-primary"
                  onClick={() => handleColumnClick("name")}
                >
                  Item Name
                </th>
                <th className="px-6 py-4">Category</th>
                <th
                  className="px-6 py-4 cursor-pointer hover:text-brand-primary"
                  onClick={() => handleColumnClick("stock")}
                >
                  Stock
                </th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Price (Sell)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No items found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {item.category || "—"}
                    </td>
                    <td
                      className={`px-6 py-4 font-bold ${
                        item.stock <= (item.restockThreshold || 5)
                          ? "text-red-600"
                          : "text-gray-700"
                      }`}
                    >
                      {item.stock}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {/* Safely handle unit object or string */}
                      {item.unit?.name ? item.unit.name : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {/* Force number conversion to avoid blank output */}₱
                      {Number(item.unitPrice || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {renderStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setViewedItem(item);
                          setIsViewOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete(item);
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

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(modalMode === "edit" || modalMode === "add") && (
        <EditModal
          mode={modalMode}
          modalType="inventory"
          fields={inventoryFields}
          item={modalMode === "edit" ? selectedItem : null}
          onClose={() => setModalMode("view")}
          onSave={(data) => {
            setPendingEditData(data);
            setShowConfirmation(true);
          }}
          allItems={items}
          setPopupMessage={setPopupMessage}
          setPopupType={setPopupType}
        />
      )}

      {isViewOpen && viewedItem && (
        <ViewModal
          item={viewedItem}
          fields={[
            { name: "name", label: "Item Name" },
            { name: "stock", label: "Stock" },
            {
              name: "purchasePrice",
              label: "Cost (₱)",
              render: (val) => `₱${Number(val || 0).toFixed(2)}`,
            },
            {
              name: "unitPrice",
              label: "Selling Price (₱)",
              render: (val) => `₱${Number(val || 0).toFixed(2)}`,
            },
            { name: "status", label: "Status" },
          ]}
          onClose={() => setIsViewOpen(false)}
          onDelete={() => {
            setItemToDelete(viewedItem);
            setIsConfirmOpen(true);
          }}
        />
      )}

      {showConfirmation && (
        <ConfirmationModal
          message="Save changes to inventory?"
          onConfirm={() => {
            saveItem(pendingEditData);
            setShowConfirmation(false);
          }}
          onCancel={() => setShowConfirmation(false)}
        />
      )}

      {isConfirmOpen && (
        <ConfirmationModal
          message="Are you sure you want to delete this item?"
          onConfirm={handleDelete}
          onCancel={() => setIsConfirmOpen(false)}
        />
      )}
    </div>
  );
};

export default Inventory;
