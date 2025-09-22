import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { customAlphabet } from "nanoid/non-secure";
import DashboardLayout from "../scripts/DashboardLayout";
import EditModal from "../components/EditModal";
import ViewModal from "../components/ViewModal";
import CakeEditModal from "../components/CakeEditModal";
import PopupMessage from "../components/PopupMessage";
import ConfirmationModal from "../components/ConfirmationModal";
import { showToast } from "../components/ToastContainer";
import DateRangeFilter from "../components/DateRangeFilter";
import "../styles/App.css";
import "../styles/Inventory.css";

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [cakeItems, setCakeItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [cakeSize, setCakeSizes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [columnFilter, setColumnFilter] = useState({ field: "", query: "" });
  const [selectedItem, setSelectedItem] = useState(null);
  const [, setSelectedCake] = useState(null);
  /* selectedCake */
  const [modalMode, setModalMode] = useState("view");
  const [formData, setFormData] = useState({
    name: "",
    unitPrice: "",
    ingredients: [],
  });
  const [pendingEditData, setPendingEditData] = useState(null);
  const [, setPendingCakeData] = useState(null);
  /* pendingCakeData */
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewedItem, setViewedItem] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [inventoryType, setInventoryType] = useState("Inventory");
  const [selectedIngredientOption, setSelectedIngredientOption] =
    useState(null);
  const [ingredientForm, setIngredientForm] = useState({ quantity: 1 });

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
    {
      label: "Stock",
      name: "stock",
      type: "number",
      placeholder: "Leave blank if none...",
    },
    { label: "Category", name: "category", required: true },
    {
      label: "Purchase Price",
      name: "purchasePrice",
      type: "number",
      placeholder: "How much the product was bought for.",
      required: true,
    },
    {
      label: "Unit Price",
      name: "unitPrice",
      type: "number",
      required: true,
      placeholder: "How much to sell the product each.",
    },
    { label: "Amount", name: "amount", type: "number", required: true },
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
      options: suppliers.map((s) => ({
        value: s._id,
        label: s.name,
      })),
    },
    {
      label: "Restock Threshold",
      name: "restockThreshold",
      type: "number",
      placeholder: "You will be notified once it reaches this amount.",
    },
    { label: "Expiration Date", name: "expirationDate", type: "date" },
  ];

  const cakeFields = [
    {
      label: "Cake Name",
      name: "name",
      type: "text",
      required: true,
      placeholder: "e.g. Chocolate Fudge, Red Velvet, etc.",
    },
    {
      label: "Category",
      name: "category",
      type: "text",
      required: true,
      placeholder: "e.g. Birthday, Wedding, etc.",
    },
    {
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
        fetch(
          `${API_BASE}/api/inventory?all=true&search=${encodeURIComponent(
            inputValue
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch inventory options");
            return res.json();
          })
          .then((data) => {
            const items = Array.isArray(data) ? data : data.items || [];
            // debug - remove/comment out later
            // console.log('inventory loadOptions items sample:', items[0]);

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

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("success");
    }, 2000);
  };

  // Fetches all inventory items or cakes based on inventoryType
  const fetchItems = useCallback(async () => {
    try {
      let url = "";
      if (inventoryType === "Inventory") {
        url = `${API_BASE}/api/inventory?page=${page}&limit=10&search=${encodeURIComponent(
          searchQuery
        )}&field=${columnFilter.field || ""}&order=${
          columnFilter.order || "asc"
        }`;
      } else if (inventoryType === "Cake Inventory") {
        url = `${API_BASE}/api/cake?page=${page}&limit=10&search=${encodeURIComponent(
          searchQuery
        )}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      // Wrap array responses into a standard object
      const wrappedData = Array.isArray(data)
        ? inventoryType === "All Inventory"
          ? {
              items: data,
              currentPage: 1,
              totalPages: 1,
              totalItems: data.length,
            }
          : {
              cakes: data,
              currentPage: 1,
              totalPages: 1,
              totalItems: data.length,
            }
        : data;

      if (inventoryType === "Inventory") {
        setItems((prev) =>
          page === 1
            ? wrappedData.items || []
            : [...prev, ...(wrappedData.items || [])]
        );
        setHasMore(page < (wrappedData.totalPages || 1));
      } else {
        setCakeItems((prev) =>
          page === 1
            ? wrappedData.cakes || []
            : [...prev, ...(wrappedData.cakes || [])]
        );
        setHasMore(page < (wrappedData.totalPages || 1));
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  }, [API_BASE, page, searchQuery, columnFilter, inventoryType, token]);

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
        const res = await fetch(`${API_BASE}/api/settings/uom`, {
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

  // Fetch Cake Sizes
  useEffect(() => {
    const fetchCakeSizes = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings/size`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch cake sizes");
        const data = await res.json();
        console.log("Cake size response:", data);
        setCakeSizes(data);
      } catch (err) {
        console.error("Failed to fetch cake sizes:", err);
      }
    };

    if (token) fetchCakeSizes();
  }, [API_BASE, token]);

  useEffect(() => {
    fetchItems();
    fetchSuppliers();
  }, [page, searchQuery, columnFilter, fetchItems, fetchSuppliers]);

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

  const handleInventoryToggle = (type) => {
    setInventoryType(type);
    setPage(1);
  };

  const validateFormData = (data) => {
    if (modalMode === "cake-add" || modalMode === "cake-edit") {
      if (!data.name?.trim()) {
        showPopup("Please enter the cake name.", "error");
        return false;
      }
      if (!data.category?.trim()) {
        showPopup("Please enter the cake category.", "error");
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
      if (!data.layers || data.layers.length === 0) {
        showPopup("Please add at least one layer.", "error");
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

      // Optional numeric checks
      data.stock = Number(data.stock) || 0;
      data.unitPrice = Number(data.unitPrice) || 0;
      data.amount = Number(data.amount) || 0;
      data.price = Number(data.price) || 0;
    } else {
      // Existing Inventory validation
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

  // Column click filter function
  const handleColumnClick = (field) => {
    if (columnFilter.field === field) {
      if (columnFilter.order === "asc") {
        setColumnFilter({ field, order: "desc", query: searchQuery });
      } else {
        setColumnFilter({ field: "", order: "", query: searchQuery });
      }
    } else {
      setColumnFilter({ field, order: "asc", query: searchQuery });
    }
    setPage(1);
  };

  // Saves item changes
  const saveItem = async (data) => {
    try {
      // Ensure ingredients array exists for Cake Mode
      const normalizedData = {
        ...data,
        ingredients: data.ingredients || [],
        seasonalPeriod: data.seasonalPeriod || { startDate: "", endDate: "" },
      };

      // Generate itemId for inventory add
      let itemId = normalizedData.itemId?.trim();
      if (modalMode === "add" && !itemId) {
        itemId = `INV-${nanoid(6)}`;
      }

      const payload = {
        ...normalizedData,
        itemId,
        stock: isNaN(Number(normalizedData.stock))
          ? 0
          : Number(normalizedData.stock),
        amount: isNaN(Number(normalizedData.amount))
          ? 0
          : Number(normalizedData.amount),
        ...(modalMode.startsWith("cake-")
          ? {
              // For cakes, map "unitPrice" input into "price"
              price: isNaN(Number(normalizedData.unitPrice))
                ? 0
                : Number(normalizedData.unitPrice),
            }
          : {
              // For inventory, keep using unitPrice
              unitPrice: isNaN(Number(normalizedData.unitPrice))
                ? 0
                : Number(normalizedData.unitPrice),
            }),
      };

      // Determine method and URL
      let method, url;
      if (modalMode === "cake-add") {
        method = "POST";
        url = `${API_BASE}/api/cake/add`;
      } else if (modalMode === "cake-edit") {
        method = "PUT";
        url = `${API_BASE}/api/cake/${normalizedData._id}`;
      } else if (modalMode === "add") {
        method = "POST";
        url = `${API_BASE}/api/inventory`;
      } else {
        method = "PUT";
        url = `${API_BASE}/api/inventory/${normalizedData._id}`;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMsg = "Something went wrong";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const errorData = await res.json();
            errorMsg = errorData.message || JSON.stringify(errorData);
          } else {
            errorMsg = await res.text();
          }
        } catch (err) {
          console.error("Error reading response:", err);
        }
        throw new Error(errorMsg);
      }

      // Refresh list and reset modal
      setPage(1);
      setHasMore(true);
      await fetchItems();
      setSelectedItem(null);
      setModalMode("view");

      showToast({
        message: `Item ${
          modalMode.includes("add") ? "added" : "updated"
        } successfully!`,
        type: "success",
        duration: 3000,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Save failed:", errorMessage);
      showToast({
        message: `Save failed: ${errorMessage}`,
        type: "error",
        duration: 3000,
      });
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

      const data = await res.json();

      setPage(1);
      setHasMore(true);
      await fetchItems();

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

  const handleAddIngredient = () => {
    if (!selectedIngredientOption) return;

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData) return;

    // Normalize ingredients for Cake Schema
    const normalizedIngredients = Array.isArray(formData.ingredients)
      ? formData.ingredients.map((ing) => ({
          inventoryItem: ing._id || ing.value || null, // Ensure ObjectId is sent
          quantity: Number(ing.quantity) || 1,
        }))
      : [];

    const normalizedData = {
      ...formData,
      unitPrice: Number(formData.unitPrice) || 0,
      amount: Number(formData.amount) || 0,
      price: Number(formData.price) || 0,
      layers: Number(formData.layers) || 1,
      availability:
        formData.availability === "Regular" ? "Always" : formData.availability,
      seasonalPeriod:
        formData.availability === "Seasonal"
          ? {
              startDate: formData.seasonalPeriod?.startDate || "",
              endDate: formData.seasonalPeriod?.endDate || "",
            }
          : undefined,
      ingredients: normalizedIngredients,
    };

    if (!validateFormData(normalizedData)) return;

    if (modalMode === "cake-edit") {
      setPendingCakeData(normalizedData);
      setShowConfirmation(true);
    } else {
      saveItem(normalizedData);
      closeModal();
      showToast({
        message: `Cake ${
          modalMode.includes("add") ? "added" : "updated"
        } successfully!`,
        type: "success",
        duration: 3000,
      });
      /* showPopup("Cake saved successfully!"); */
    }
  };

  /* const handleConfirmEditCake = async () => {
    if (pendingCakeData) {
      await saveItem(pendingCakeData);
      showPopup("Cake updated successfully!");
    }
    setPendingCakeData(null);
    setShowConfirmation(false);
    closeModal();
  }; */

  const closeModal = () => {
    setModalMode(null);
    setFormData({});
    setSelectedIngredientOption(null);
    setIngredientForm({ quantity: 1 });
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
              name: "amount",
              label: "Unit",
              render: (val) =>
                viewedItem?.unit
                  ? `${val} ${viewedItem.unit.name}`
                  : `${val || "—"}`,
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

      {/* INVENTORY MODAL */}
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
          handleSubmit={handleSubmit}
          handleChange={handleChange}
          handleSeasonalChange={handleSeasonalChange}
          onClose={closeModal}
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
      <DashboardLayout>
        <main className="module-main-content inventory-main">
          <div className="module-header">
            <h1 className="module-title">Inventory</h1>
          </div>

          <div className="module-actions-container">
            <DateRangeFilter
              options={["Inventory", "Cake Inventory"]}
              onChange={handleInventoryToggle}
            />

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
              }}
            >
              + Add Item
            </button>

            {/* Add Cake */}
            <button
              className="module-action-btn module-add-btn"
              onClick={() => {
                setSelectedCake(null);
                setModalMode("cake-add");
              }}
            >
              + Add Cake
            </button>
          </div>

          <div className="module-table-container" ref={containerRef}>
            <table>
              <thead>
                <tr>
                  {(inventoryType === "Inventory"
                    ? [
                        { label: "ID", field: "itemId" },
                        { label: "Item Name", field: "name" },
                        { label: "Stock", field: "stock" },
                        { label: "Category", field: "category" },
                        { label: "Purchase Price", field: "purchasePrice" },
                        { label: "Unit Price", field: "unitPrice" },
                        { label: "Unit", field: "amount" },
                        { label: "Supplier", field: "supplier" },
                        { label: "Expiration Date", field: "expirationDate" },
                        { label: "Status", field: "status" },
                        { label: "Actions", field: null },
                      ]
                    : inventoryType === "Cake Inventory"
                    ? [
                        { label: "ID", field: "_id" },
                        { label: "Cake Name", field: "name" },
                        { label: "Layers", field: "layers" },
                        { label: "Base Cost", field: "baseCost" },
                        { label: "Price", field: "price" },
                        { label: "Availability", field: "availability" },
                        { label: "Ingredients", field: null },
                        { label: "Status", field: "status" },
                        { label: "Actions", field: null },
                      ]
                    : []
                  ).map((col) => (
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
                {inventoryType === "Inventory" ? (
                  items.length === 0 ? (
                    <tr>
                      <td colSpan="11">No items found.</td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item._id}>
                        <td>{item.itemId}</td>
                        <td>{item.name}</td>
                        <td>{item.stock}</td>
                        <td>{item.category || "—"}</td>
                        <td>₱{item.purchasePrice}</td>
                        <td>₱{item.unitPrice}</td>
                        <td>
                          {item.amount
                            ? `${item.amount} ${item.unit?.name || ""}`
                            : "—"}
                        </td>
                        <td>
                          {suppliers.find((s) => s._id === item.supplier)
                            ?.name || "—"}
                        </td>
                        <td>
                          {item.expirationDate
                            ? new Date(item.expirationDate).toLocaleDateString(
                                "en-PH",
                                { timeZone: "Asia/Manila" }
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
                  )
                ) : inventoryType === "Cake Inventory" ? (
                  cakeItems.length === 0 ? (
                    <tr>
                      <td colSpan="9">No cakes found.</td>
                    </tr>
                  ) : (
                    cakeItems.map((cake) => (
                      <tr key={cake._id}>
                        <td>{cake._id}</td>
                        <td>{cake.name}</td>
                        <td>{cake.layers || "—"}</td>
                        <td>₱{cake.baseCost || 0}</td>
                        <td>₱{cake.price || 0}</td>
                        <td>{cake.availability || "—"}</td>
                        <td>{cake.ingredients?.length || 0}</td>
                        <td>{cake.status || "—"}</td>
                        <td>
                          <button
                            className="module-action-btn module-view-btn"
                            onClick={() => {
                              setViewedItem(cake);
                              setIsViewOpen(true);
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )
                ) : null}
              </tbody>
            </table>
          </div>
        </main>
      </DashboardLayout>
    </>
  );
};

export default Inventory;
