import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { customAlphabet } from "nanoid/non-secure";
import {
  ShoppingCart,
  Search,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Truck,
} from "lucide-react";

import { authFetch, API_BASE } from "../utils/tokenUtils";
import PopupMessage from "../components/PopupMessage";
import DateRangeFilter from "../components/DateRangeFilter";

const SalesManagement = () => {
  // --- States ---
  const [inventoryItems, setInventoryItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [orderType, setOrderType] = useState("Walk-in");
  const [isUnregistered, setIsUnregistered] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [taxRate] = useState(12);
  const [searchQuery, setSearchQuery] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("Sales"); // "Sales" or "Product Acquisition"
  const [activeSupplier, setActiveSupplier] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  const navigate = useNavigate();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const nanoid = customAlphabet(alphabet, 8);

  // --- Auth Check ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("");
    }, 2000);
  };

  // --- Fetch Data ---
  const fetchInventory = useCallback(async () => {
    try {
      let url = `${API_BASE}/api/inventory?page=${currentPage}&limit=12&search=${encodeURIComponent(
        searchQuery
      )}`;
      const res = await authFetch(url);
      if (!res.ok) throw new Error("Failed to fetch inventory");

      const data = await res.json();
      const result = Array.isArray(data)
        ? { items: data, totalPages: 1, totalItems: data.length }
        : data;

      const rawItems = result.items || [];

      // --- DATA NORMALIZATION ---
      const mappedItems = rawItems.map((item) => ({
        ...item,
        stock: item.stock ?? item.currentStock ?? 0,
        unitPrice: Number(item.unitPrice ?? item.sellingPrice ?? 0),
        purchasePrice: Number(item.purchasePrice ?? 0),
      }));

      setInventoryItems(mappedItems);
      setTotalPages(result.totalPages || 1);
      setTotalItems(result.totalItems || 0);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory, mode]);

  // Fetch Suppliers
  useEffect(() => {
    authFetch(`${API_BASE}/api/suppliers?page=1&limit=1000`)
      .then((res) => res.json())
      .then((data) =>
        setSuppliers(Array.isArray(data.suppliers) ? data.suppliers : data)
      )
      .catch((err) => console.error("Failed to fetch suppliers:", err));
  }, []);

  // Fetch Customers
  useEffect(() => {
    authFetch(`${API_BASE}/api/customers?page=1&limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        const custs = Array.isArray(data.customers) ? data.customers : [];
        setCustomers(custs);
        if (!isUnregistered && custs[0]) setCustomerName(custs[0].name);
      })
      .catch(() => console.error("Failed to fetch customers"));
  }, [isUnregistered]);

  // --- Cart Logic ---
  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find((s) => s._id === supplierId);
    return supplier ? supplier.name : "-";
  };

  const handleAddToCart = (product) => {
    if (
      mode === "Sales" &&
      (product.stock <= 0 ||
        product.status === "Out of stock" ||
        product.status === "Expired")
    )
      return;

    if (mode === "Product Acquisition") {
      const supplierId = product.supplier?._id || product.supplier;
      if (activeSupplier && supplierId !== activeSupplier) {
        showPopup("Items must come from the same supplier.", "error");
        return;
      }
      if (!activeSupplier) setActiveSupplier(supplierId);
    }

    // Optimistic Update
    setInventoryItems((prev) =>
      prev.map((i) =>
        i._id === product._id
          ? { ...i, stock: mode === "Sales" ? i.stock - 1 : i.stock }
          : i
      )
    );

    setCartItems((prev) => {
      const exists = prev.find((i) => i._id === product._id);
      return exists
        ? prev.map((i) =>
            i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleQuantityChange = (itemId, delta) => {
    setCartItems((prev) =>
      prev.map((cartItem) => {
        if (cartItem._id === itemId) {
          const newQty = cartItem.quantity + delta;

          if (
            mode === "Sales" &&
            delta > 0 &&
            cartItem.quantity >=
              cartItem.stock +
                (inventoryItems.find((i) => i._id === itemId)?.stock || 0)
          ) {
            return cartItem;
          }
          if (newQty < 1) return cartItem;

          if (mode === "Sales") {
            setInventoryItems((prevInv) =>
              prevInv.map((i) =>
                i._id === itemId ? { ...i, stock: i.stock - delta } : i
              )
            );
          }
          return { ...cartItem, quantity: newQty };
        }
        return cartItem;
      })
    );
  };

  const handleRemoveFromCart = (itemId) => {
    const itemToRemove = cartItems.find((i) => i._id === itemId);
    if (!itemToRemove) return;

    setCartItems((prev) => {
      const newCart = prev.filter((i) => i._id !== itemId);
      if (newCart.length === 0) setActiveSupplier(null);
      return newCart;
    });

    if (mode === "Sales") {
      setInventoryItems((prev) =>
        prev.map((i) =>
          i._id === itemId
            ? { ...i, stock: i.stock + itemToRemove.quantity }
            : i
        )
      );
    }
  };

  // --- Checkout Logic ---
  const handleSaveSale = async () => {
    if (cartItems.length === 0) {
      showPopup("Cart is empty.", "error");
      return;
    }

    setLoading(true);
    try {
      const subtotal = cartItems.reduce(
        (sum, i) =>
          sum +
          (mode === "Product Acquisition" ? i.purchasePrice : i.unitPrice) *
            i.quantity,
        0
      );
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      if (mode === "Sales") {
        const saleData = {
          saleId: `SALE-${nanoid()}`,
          customerName: isUnregistered
            ? customerName.trim() || "Unregistered"
            : customerName,
          orderType,
          items: cartItems.map((i) => ({
            itemId: i._id,
            name: i.name,
            price: i.unitPrice,
            quantity: i.quantity,
            purchasePrice: i.purchasePrice || 0,
          })),
          subtotal,
          taxRate,
          taxAmount,
          totalAmount,
        };

        const res = await authFetch(`${API_BASE}/api/sales`, {
          method: "POST",
          body: JSON.stringify(saleData),
        });
        if (!res.ok) throw new Error("Failed to create sale.");

        await Promise.all(
          cartItems.map((item) =>
            authFetch(`${API_BASE}/api/inventory/${item._id}`, {
              method: "PUT",
              body: JSON.stringify({ stock: item.stock - item.quantity }),
            })
          )
        );
        showPopup("Sale completed!", "success");
      } else {
        const acqData = {
          acquisitionId: `ACQ-${nanoid()}`,
          supplier: activeSupplier || "Hunnys Crémerie",
          items: cartItems.map((i) => ({
            itemId: i._id,
            name: i.name,
            quantity: i.quantity,
            unitCost: i.purchasePrice || 0,
          })),
          subtotal,
          totalAmount,
        };

        const res = await authFetch(`${API_BASE}/api/acquisitions`, {
          method: "POST",
          body: JSON.stringify(acqData),
        });
        if (!res.ok) throw new Error("Failed to create acquisition.");
        showPopup("Acquisition request sent!", "success");
      }

      setCartItems([]);
      setCustomerName("");
      setIsUnregistered(false);
      setActiveSupplier(null);
      fetchInventory();
    } catch (err) {
      showPopup(err.message || "Error processing transaction.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Calculate Subtotal Safely
  const subtotal = cartItems.reduce((sum, i) => {
    const price =
      mode === "Product Acquisition" ? i.purchasePrice || 0 : i.unitPrice || 0;
    return sum + price * (i.quantity || 1);
  }, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:flex-row bg-gray-50 overflow-hidden">
      {popupMessage && (
        <PopupMessage
          message={popupMessage}
          type={popupType}
          onClose={() => setPopupMessage("")}
        />
      )}

      {/* --- LEFT SIDE: PRODUCT LIST --- */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-8 h-8 text-brand-primary" />
              {mode === "Sales" ? "Sales Point" : "Product Acquisition"}
            </h1>
            <p className="text-gray-500 text-sm">
              Select items to add to cart.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <DateRangeFilter
              options={["Sales", "Product Acquisition"]}
              onChange={(val) => {
                setMode(val);
                setCartItems([]);
              }}
            />
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {inventoryItems.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                No products found.
              </div>
            ) : (
              inventoryItems.map((item) => {
                const isOutOfStock =
                  item.stock <= 0 ||
                  item.status === "Out of stock" ||
                  item.status === "Expired";
                const isDisabled = mode === "Sales" && isOutOfStock;

                // Safe Price Display
                const displayPrice =
                  mode === "Product Acquisition"
                    ? item.purchasePrice || 0
                    : item.unitPrice || 0;

                return (
                  <div
                    key={item._id}
                    onClick={() => !isDisabled && handleAddToCart(item)}
                    className={`bg-white p-4 rounded-xl border shadow-sm transition-all duration-200 flex flex-col justify-between h-40 cursor-pointer
                                    ${
                                      isDisabled
                                        ? "opacity-50 cursor-not-allowed bg-gray-50"
                                        : "hover:border-brand-primary hover:shadow-md"
                                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800 line-clamp-2 text-sm">
                          {item.name}
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase whitespace-nowrap ml-2 
                                            ${
                                              item.status === "Well-stocked"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                            }`}
                        >
                          {item.status === "Well-stocked"
                            ? "Stock"
                            : item.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.category}
                      </p>
                    </div>

                    <div className="flex justify-between items-end mt-4">
                      <div>
                        <p className="text-xs text-gray-400">Price</p>
                        <p className="font-bold text-lg text-brand-primary">
                          ₱{Number(displayPrice).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Stock</p>
                        <p
                          className={`font-medium ${
                            item.stock < 10 ? "text-red-500" : "text-gray-700"
                          }`}
                        >
                          {item.stock} {item.unit?.name || ""}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between shrink-0">
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: CART --- */}
      <div className="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-lg text-gray-800">Current Order</h2>
          {activeSupplier && (
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <Truck className="w-3 h-3" /> {getSupplierName(activeSupplier)}
            </p>
          )}
        </div>

        {/* Order Details Form */}
        <div className="p-4 space-y-3 border-b border-gray-100">
          <div>
            <label className="text-xs font-medium text-gray-500">
              Order Type
            </label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="Walk-in">Walk-in</option>
              <option value="Online">Online</option>
            </select>
          </div>

          {mode === "Sales" && (
            <div>
              <label className="text-xs font-medium text-gray-500">
                Customer
              </label>
              <div className="flex gap-2 items-center mt-1">
                {isUnregistered ? (
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="flex-1 p-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                ) : (
                  <select
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="flex-1 p-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    {customers.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <label className="flex items-center gap-2 mt-2 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUnregistered}
                  onChange={(e) => setIsUnregistered(e.target.checked)}
                />
                Unregistered / Guest
              </label>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cartItems.map((item) => {
              // Safe Price Calculation for Cart
              const itemPrice =
                mode === "Product Acquisition"
                  ? item.purchasePrice || 0
                  : item.unitPrice || 0;

              return (
                <div
                  key={item._id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-800 line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-xs text-brand-primary font-bold">
                      ₱{Number(itemPrice).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white rounded-md border border-gray-200">
                      <button
                        onClick={() => handleQuantityChange(item._id, -1)}
                        className="p-1 hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item._id, 1)}
                        className="p-1 hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item._id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Checkout */}
        <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500">Total Amount</span>
            <span className="text-2xl font-bold text-brand-dark">
              ₱{Number(subtotal || 0).toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleSaveSale}
            disabled={loading || cartItems.length === 0}
            className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? (
              "Processing..."
            ) : (
              <>
                <CreditCard className="w-5 h-5" /> Checkout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesManagement;
