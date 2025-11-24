import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { customAlphabet } from "nanoid/non-secure";
<<<<<<< HEAD
import { Search, Plus, Edit, Trash2, Eye, Package, Filter } from "lucide-react";

import EditModal from "../components/EditModal";
import ViewModal from "../components/ViewModal";
=======
import DashboardLayout from "../scripts/DashboardLayout";
import InventoryModal from "../components/InventoryModal";
import InventoryViewModal from "../components/InventoryViewModal";
import CakeEditModal from "../components/CakeEditModal";
import CakeViewModal from "../components/CakeViewModal";
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
import PopupMessage from "../components/PopupMessage";
import ConfirmationModal from "../components/ConfirmationModal";
import { showToast } from "../components/ToastContainer";
import { authFetch, API_BASE } from "../utils/tokenUtils";
<<<<<<< HEAD
=======
import { FaEye, FaPencilAlt } from "react-icons/fa";
/* import DateRangeFilter from "../components/DateRangeFilter"; */
import "../styles/App.css";
import "../styles/Inventory.css";
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [cakeItems /* setCakeItems */] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState({ inventory: [], cake: [] });
  const [uoms, setUoms] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [columnFilter, setColumnFilter] = useState({ field: "", order: "" });
  const [inventoryType, setInventoryType] = useState("Inventory");

  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState("view");
<<<<<<< HEAD
  const [formData, setFormData] = useState({}); // Used for EditModal
=======
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unitPrice: "",
    ingredients: [],
  });
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
  const [pendingEditData, setPendingEditData] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewedItem, setViewedItem] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
<<<<<<< HEAD

=======
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType /* setPopupType */] = useState("success");
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
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

<<<<<<< HEAD
  // --- Configurations ---
  const inventoryFields = [
    {
      label: "Item Name",
      name: "name",
      required: true,
      placeholder: "e.g. All Purpose Flour",
=======
  const nanoid = customAlphabet("0123456789", 6);
  const containerRef = useRef(null);

  const cakeFields = [
    {
      label: "Cake Name",
      name: "name",
      type: "text",
      required: true,
      placeholder: "e.g. Chocolate Fudge, Red Velvet, etc.",
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
    },
    {
      label: "Category",
      name: "category",
      type: "select",
<<<<<<< HEAD
      options: (categories.inventory || []).map((c) => ({
=======
      options: (categories.cake || []).map((c) => ({
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
        value: c._id,
        label: c.name,
      })),
      required: true,
    },
    {
<<<<<<< HEAD
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
=======
      label: "Size",
      name: "size",
      type: "select",
      options: cakeSize.map((s) => ({ value: s._id, label: s.name })),
      required: true,
    },
    {
      label: "Stock",
      name: "stock",
      type: "number",
      placeholder: "Enter current stock...",
    },
    {
      label: "Unit Price",
      name: "unitPrice",
      type: "number",
      placeholder: "Selling price per cake. Leave Empty to follow Base Price.",
    },
    {
      label: "Availability",
      name: "availability",
      type: "select",
      required: true,
      options: [
        { value: "Regular", label: "Regular" },
        { value: "Seasonal", label: "Seasonal" },
      ],
    },
    {
      label: "Expiration Date",
      name: "expirationDate",
      type: "date",
    },
    {
      label: "Ingredients",
      name: "ingredients",
      type: "multiselect",
      loadOptions: (inputValue) =>
        authFetch(
          `${API_BASE}/api/inventory?all=true&search=${encodeURIComponent(
            inputValue
          )}`
        )
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch inventory options");
            return res.json();
          })
          .then((data) => {
            const items = Array.isArray(data) ? data : data.items || [];

            return items.map((i) => {
              const stock = i.stock ?? i.amount ?? null;
              const unitPrice =
                Number(i.purchasePrice ?? i.unitPrice ?? i.price ?? 0) || 0;
              const unitName = i.unit?.name ?? i.unit ?? null;

              return {
                value: i._id,
                label: `${i.name} (Stock: ${stock ?? "—"})`,
                name: i.name,
                stock,
                unitPrice,
                unit: unitName,
                raw: i,
              };
            });
          })
          .catch((err) => {
            console.error("Async select load failed:", err);
            return [];
          }),
      required: true,
    },
  ];

  /* const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("success");
    }, 2000);
  }; */

  const fetchItems = useCallback(
    async (reset = false) => {
      try {
        const url = `${API_BASE}/api/inventory?page=${page}&limit=10&search=${encodeURIComponent(
          searchQuery
        )}${
          columnFilter.field
            ? `&field=${columnFilter.field}&order=${columnFilter.order}`
            : ""
        }`;

        const res = await authFetch(url);
        const data = await res.json();

        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || 0);
      } catch (err) {
        console.error("Error fetching inventory:", err);
      }
    },
    [page, searchQuery, columnFilter]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("status") || "";
    const statusMap = {
      "low-stock": "Low-stock",
      "out-of-stock": "Out of stock",
      expired: "Expired",
    };

    if (status) {
      setSearchQuery(statusMap[status]);
    }
  }, [location.search]);

  const fetchSuppliers = useCallback(async () => {
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
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

<<<<<<< HEAD
  // --- Handlers ---

=======
  /*  const handleInventoryToggle = (type) => {
    setInventoryType(type);
    setPage(1);
    setIsViewOpen(false);
    setViewedItem(null);
    setSelectedItem(null);
    setSelectedCake(null);
    setFormData({});
    setSelectedIngredientOption(null);
    setIngredientForm({ quantity: 1 });
    setPendingEditData(null);
    setPendingCakeData(null);
  }; */

  /*  const validateFormData = (data) => {
    if (modalMode === "cake-add" || modalMode === "cake-edit") {
      if (!data.name || !String(data.name).trim()) {
        showPopup("Please enter the cake name.", "error");
        return false;
      }

      if (!data.category) {
        showPopup("Please select a category.", "error");
        return false;
      }

      if (!data.size) {
        showPopup("Please select a cake size.", "error");
        return false;
      }
      if (!data.availability) {
        showPopup("Please select availability.", "error");
        return false;
      }

      if (
        data.price === undefined ||
        data.price === null ||
        data.price === ""
      ) {
        showPopup("Please enter the cake price.", "error");
        return false;
      }
      if (!data.ingredients || data.ingredients.length === 0) {
        showPopup("Please add at least one ingredient.", "error");
        return false;
      }

      // numeric normalizations
      data.stock = Number(data.stock) || 0;
      data.unitPrice = Number(data.unitPrice) || 0;
      data.amount = Number(data.amount) || 0;
      data.price = Number(data.price) || 0;
    } else {
      // Inventory validation
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
        items.some(
          (i) => i.itemId.toLowerCase() === itemId.trim().toLowerCase()
        )
      ) {
        showPopup(
          "Item ID already exists. Please choose a unique ID.",
          "error"
        );
        return false;
      }
    }

    return true;
  };
 */
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
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

<<<<<<< HEAD
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await authFetch(`${API_BASE}/api/inventory/${itemToDelete._id}`, {
=======
  const handleConfirmEdit = async () => {
    try {
      if (pendingEditData) {
        await saveItem(pendingEditData);
        setPendingEditData(null);
      } else if (pendingCakeData) {
        await saveItem(pendingCakeData);
        setPendingCakeData(null);
      }
    } catch (err) {
      console.error("Confirm save failed", err);
    } finally {
      setShowConfirmation(false);
      setModalMode("view");
      setFormData({});
      setSelectedIngredientOption(null);
      setIngredientForm({ quantity: 1 });
    }
  };

  /* const handleDelete = (itemId) => {
    const item =
      items.find((i) => i._id === itemId) ||
      cakeItems.find((c) => c._id === itemId) ||
      null;
    setItemToDelete(item);
    setIsConfirmOpen(true);
  }; */

  const confirmDelete = async () => {
    try {
      if (!itemToDelete) return;

      const isCake =
        itemToDelete.baseCost !== undefined || itemToDelete.price !== undefined;
      const url = isCake
        ? `${API_BASE}/api/cake/${itemToDelete._id}`
        : `${API_BASE}/api/inventory/${itemToDelete._id}`;

      const res = await authFetch(url, {
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
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

<<<<<<< HEAD
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      >
        {status}
      </span>
    );
=======
    const newIngredient = {
      _id: selectedIngredientOption.value,
      name: selectedIngredientOption.name ?? selectedIngredientOption.label,
      stock: selectedIngredientOption.stock ?? null,
      unitPrice: Number(selectedIngredientOption.unitPrice ?? 0),
      unit: selectedIngredientOption.unit ?? null,
      quantity: Number(ingredientForm.quantity) || 1,
      raw: selectedIngredientOption.raw || null,
    };

    setFormData((prev) => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), newIngredient],
    }));

    setSelectedIngredientOption(null);
    setIngredientForm({ quantity: 1 });
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSeasonalChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      seasonalPeriod: {
        ...prev.seasonalPeriod,
        [field]: value,
      },
    }));
  };

  /* const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url =
        mode === "edit"
          ? `${API_BASE}/api/inventory/${selectedItem._id}`
          : `${API_BASE}/api/inventory`;

      const method = mode === "edit" ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save item");

      onItemAdded(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }; */

  /*   const handleViewCake = (cake) => {
    setSelectedCake(cake);
    setIsViewOpen(true);
  }; */

  const handleCloseCakeView = () => {
    setSelectedCake(null);
    setIsViewOpen(false);
  };

  const closeModal = () => {
    setModalMode(null);
    setFormData({});
    setSelectedIngredientOption(null);
    setIngredientForm({ quantity: 1 });
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
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
<<<<<<< HEAD

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
=======
      {/* Inventory view modal (only for Inventory items) */}
      <InventoryViewModal
        isOpen={!!viewedItem}
        onClose={() => setViewedItem(null)}
        item={viewedItem}
      />

      {/* Cake view modal (only for Cake Inventory) */}
      {isViewOpen && inventoryType === "Cake Inventory" && selectedCake && (
        <CakeViewModal
          onClose={handleCloseCakeView}
          categories={categories}
          cake={selectedCake}
        />
      )}
      {/* Confirmation for delete */}
      {isConfirmOpen && (
        <ConfirmationModal
          message={`Are you sure you want to delete "${
            itemToDelete?.name || "this item"
          }"?`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setIsConfirmOpen(false);
            setItemToDelete(null);
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
          }}
        />
      )}

<<<<<<< HEAD
=======
      {/* INVENTORY MODAL (New Add/Edit InventoryModal) */}
      {(modalMode === "add" || modalMode === "edit") && (
        <InventoryModal
          mode={modalMode}
          item={modalMode === "edit" ? selectedItem : null}
          isOpen={modalOpen}
          onClose={() => {
            setSelectedItem(null);
            setModalOpen(false);
            setModalMode(null);
          }}
          onSuccess={() => {
            fetchItems();
            setSelectedItem(null);
            setModalMode(null);
          }}
          uoms={uoms}
          categories={categories?.inventory || []}
          suppliers={suppliers || []}
          onItemAdded={(newItem) => {
            fetchItems();
          }}
        />
      )}

      {/* CAKE MODAL */}
      {(modalMode === "cake-add" || modalMode === "cake-edit") && (
        <CakeEditModal
          mode={modalMode}
          cakeFields={cakeFields}
          formData={formData}
          setFormData={setFormData}
          selectedIngredientOption={selectedIngredientOption}
          setSelectedIngredientOption={setSelectedIngredientOption}
          ingredientForm={ingredientForm}
          setIngredientForm={setIngredientForm}
          handleAddIngredient={handleAddIngredient}
          handleChange={handleChange}
          handleSeasonalChange={handleSeasonalChange}
          onClose={closeModal}
        />
      )}
      {/* Save confirmation (shared for inventory & cake edits) */}
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
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

<<<<<<< HEAD
      {isConfirmOpen && (
        <ConfirmationModal
          message="Are you sure you want to delete this item?"
          onConfirm={handleDelete}
          onCancel={() => setIsConfirmOpen(false)}
        />
      )}
    </div>
=======
          <div className="module-actions-container">
            {/*   <DateRangeFilter
              options={["Inventory", "Cake Inventory"]}
              onChange={handleInventoryToggle}
            /> */}

            <input
              type="text"
              className="module-search-input"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />

            {/* Add Inventory Item */}
            <button
              className="module-action-btn module-add-btn"
              onClick={() => {
                setSelectedItem(null);
                setModalMode("add");
                setModalOpen(true);
              }}
            >
              + Add Item
            </button>

            {/* Add Cake */}
            {/* <button
              className="module-action-btn module-add-btn"
              onClick={() => {
                setSelectedCake(null);
                setModalMode("cake-add");
              }}
            >
              + Add Cake
            </button> */}
          </div>

          <div className="module-table-container" ref={containerRef}>
            <table>
              <thead>
                <tr>
                  {[
                    { label: "Item Code", field: "itemId" },
                    { label: "Item Name", field: "name" },
                    { label: "Stock", field: "currentStock" },
                    { label: "Unit", field: "unit.name" },
                    { label: "Category", field: "category" },
                    { label: "Price", field: "sellingPrice" },
                    { label: "Expiration Date", field: "expirationDate" },
                    { label: "Status", field: "status" },
                    { label: "Actions", field: null },
                  ].map((col) => (
                    <th
                      key={col.label}
                      onClick={() => col.field && handleColumnClick(col.field)}
                      style={{ cursor: col.field ? "pointer" : "default" }}
                    >
                      {col.label}{" "}
                      {col.field && columnFilter.field === col.field && (
                        <span>{columnFilter.order === "asc" ? "▲" : "▼"}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="10">No items found.</td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id}>
                      <td>{item.itemId}</td>
                      <td>{item.name}</td>
                      <td>{item.currentStock}</td>
                      <td>{item.unit?.name || "—"}</td>
                      <td>{item.category || "—"}</td>
                      <td>₱{item.sellingPrice.toFixed(2)}</td>
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
                            // Normalize Category (backend sends category NAME)
                            const categoryId =
                              categories.inventory?.find(
                                (c) => c.name === item.category
                              )?._id || "";

                            const unitId =
                              item.unit?._id ||
                              item.unit?.$oid ||
                              item.unit ||
                              "";

                            const normalizedSuppliers =
                              item.suppliers?.map((s) => ({
                                supplier:
                                  s.supplier?._id ||
                                  s.supplier?.$oid ||
                                  s.supplier ||
                                  "",
                                purchasePrice: s.purchasePrice,
                                _id: s._id?.$oid || s._id,
                              })) || [];

                            const normalized = {
                              ...item,
                              category: categoryId,
                              unit: unitId,
                              suppliers: normalizedSuppliers,
                              expirationDate:
                                item.expirationDate?.$date?.split("T")[0] || "",
                            };

                            setSelectedItem(item);
                            setFormData(normalized);
                            setModalMode("edit");
                            setModalOpen(true);
                          }}
                        >
                          <FaPencilAlt />
                        </button>

                        <button
                          className="module-action-btn module-view-btn"
                          onClick={() => {
                            setViewedItem(item);
                            setIsViewOpen(true);
                          }}
                          title="View Item"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            {/* Use a wrapper div for column layout */}
            <div className="pagination-top">
              {inventoryType === "Inventory" && totalItems > 0 && (
                <p className="pagination-info">
                  Showing {(page - 1) * 10 + 1}-
                  {Math.min(page * 10, totalItems * 10)} of {totalItems} items
                </p>
              )}

              {inventoryType === "Cake Inventory" && cakeItems.length > 0 && (
                <p className="pagination-info">
                  Showing {(page - 1) * 10 + 1}-
                  {Math.min(page * 10, cakeItems.length)} of {cakeItems.length}{" "}
                  cakes
                </p>
              )}
            </div>

            <div className="pagination-buttons">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Prev
              </button>

              {Array.from({
                length: Math.min(7, totalPages),
              }).map((_, idx) => {
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
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
  );
};

export default Inventory;
