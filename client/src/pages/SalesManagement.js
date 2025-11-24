import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// Removed unused nanoid import
import {
  ShoppingCart,
  Search,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Tag,
  ChevronLeft,
  ShoppingBag,
} from "lucide-react";

import { authFetch, API_BASE } from "../utils/tokenUtils";
import PopupMessage from "../components/PopupMessage";

const SalesManagement = () => {
  // --- States ---
  const [inventoryItems, setInventoryItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  // Order Details
  const [orderType, setOrderType] = useState("Walk-in");
  const [isUnregistered, setIsUnregistered] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState(0);
  const [taxRate] = useState(12);

  // UI & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false); // New: Mobile Toggle

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Removed unused totalItems state

  const navigate = useNavigate();
  // Removed unused nanoid initialization

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

  // --- Fetch Inventory ---
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

      // Map Server Data
      const mappedItems = rawItems.map((item) => ({
        ...item,
        stock: item.currentStock ?? item.stock ?? 0,
        unitPrice: Number(item.sellingPrice ?? item.unitPrice ?? 0),
      }));

      setInventoryItems(mappedItems);
      setTotalPages(result.totalPages || 1);
      // Removed setTotalItems call
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // --- Fetch Customers ---
  useEffect(() => {
    authFetch(`${API_BASE}/api/customers?page=1&limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        const custs = Array.isArray(data.customers) ? data.customers : [];
        setCustomers(custs);
        if (!isUnregistered && custs.length > 0 && !customerName) {
          setCustomerName(custs[0].name);
        }
      })
      .catch(() => console.error("Failed to fetch customers"));
  }, [isUnregistered]);

  // --- Cart Logic ---
  const handleAddToCart = (product) => {
    if (
      product.stock <= 0 ||
      product.status === "Out of stock" ||
      product.status === "Expired"
    ) {
      showPopup("Item is out of stock or expired.", "error");
      return;
    }

    setInventoryItems((prev) =>
      prev.map((i) =>
        i._id === product._id ? { ...i, stock: i.stock - 1 } : i
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

          const currentInvItem = inventoryItems.find((i) => i._id === itemId);
          const originalStock =
            (currentInvItem?.stock || 0) + cartItem.quantity;

          if (delta > 0 && newQty > originalStock) return cartItem;
          if (newQty < 1) return cartItem;

          setInventoryItems((prevInv) =>
            prevInv.map((i) =>
              i._id === itemId ? { ...i, stock: i.stock - delta } : i
            )
          );

          return { ...cartItem, quantity: newQty };
        }
        return cartItem;
      })
    );
  };

  const handleRemoveFromCart = (itemId) => {
    const itemToRemove = cartItems.find((i) => i._id === itemId);
    if (!itemToRemove) return;

    setCartItems((prev) => prev.filter((i) => i._id !== itemId));
    setInventoryItems((prev) =>
      prev.map((i) =>
        i._id === itemId ? { ...i, stock: i.stock + itemToRemove.quantity } : i
      )
    );
  };

  // --- Calculations ---
  const rawSubtotal = cartItems.reduce(
    (sum, i) => sum + (i.unitPrice || 0) * i.quantity,
    0
  );
  const safeDiscount = Number.isFinite(Number(discount)) ? Number(discount) : 0;
  const effectiveSubtotal = Math.max(rawSubtotal - safeDiscount, 0);
  const taxAmount = (effectiveSubtotal * Number(taxRate)) / 100;
  const totalAmount = effectiveSubtotal + taxAmount;
  const totalItemsInCart = cartItems.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  // --- Checkout ---
  const handleSaveSale = async () => {
    if (cartItems.length === 0) {
      showPopup("Cart is empty.", "error");
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        invoiceNumber: Math.floor(Date.now() / 1000),
        customerName: isUnregistered
          ? customerName.trim() || "Unregistered"
          : customerName,
        orderType,
        items: cartItems.map((i) => ({
          itemId: i._id,
          name: i.name,
          sellingPrice: i.unitPrice,
          quantity: i.quantity,
        })),
        subtotal: Number(rawSubtotal.toFixed(2)),
        discount: Number(safeDiscount.toFixed(2)),
        taxRate: Number(taxRate),
        taxAmount: Number(taxAmount.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
      };

      const res = await authFetch(`${API_BASE}/api/sales`, {
        method: "POST",
        body: JSON.stringify(saleData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create sale.");
      }

      showPopup("Sale completed!", "success");
      setCartItems([]);
      setDiscount(0);
      if (isUnregistered) setCustomerName("");
      setShowMobileCart(false); // Close mobile cart on success
      fetchInventory();
    } catch (err) {
      showPopup(err.message || "Error processing transaction.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:flex-row bg-gray-50 overflow-hidden relative">
      {popupMessage && (
        <PopupMessage
          message={popupMessage}
          type={popupType}
          onClose={() => setPopupMessage("")}
        />
      )}

      {/* --- LEFT SIDE: PRODUCT LIST --- */}
      {/* Hidden on mobile if cart is open */}
      <div
        className={`flex-1 flex flex-col p-4 md:p-6 overflow-hidden ${
          showMobileCart ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 shrink-0">
          <div className="w-full md:w-auto">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-8 h-8 text-brand-primary" />
              Point of Sale
            </h1>
            <p className="text-gray-500 text-sm hidden md:block">
              Select items to process a sale.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2 pb-20 md:pb-0">
          {/* Adjusted grid columns for mobile (2 cols) */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
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

                return (
                  <div
                    key={item._id}
                    onClick={() => !isOutOfStock && handleAddToCart(item)}
                    className={`bg-white p-3 md:p-4 rounded-xl border shadow-sm transition-all duration-200 flex flex-col justify-between h-36 md:h-40 cursor-pointer active:scale-95 md:active:scale-100
                                    ${
                                      isOutOfStock
                                        ? "opacity-50 cursor-not-allowed bg-gray-50"
                                        : "hover:border-brand-primary hover:shadow-md"
                                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800 line-clamp-2 text-xs md:text-sm leading-tight">
                          {item.name}
                        </h3>
                        {!isOutOfStock && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold hidden sm:inline-block">
                            Stock
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] md:text-xs text-gray-500 mt-1 truncate">
                        {item.category}
                      </p>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <p className="text-[10px] text-gray-400">Price</p>
                        <p className="font-bold text-sm md:text-lg text-brand-primary">
                          ₱{Number(item.unitPrice).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400">Stock</p>
                        <p
                          className={`font-medium text-xs md:text-sm ${
                            item.stock < 10 ? "text-red-500" : "text-gray-700"
                          }`}
                        >
                          {item.stock}
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
        <div className="mt-4 flex items-center justify-between shrink-0 pb-20 md:pb-0">
          <span className="text-xs md:text-sm text-gray-500">
            Page {currentPage} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: CART --- */}
      {/* Hidden on mobile unless showMobileCart is true */}
      <div
        className={`w-full md:w-96 bg-white border-l border-gray-200 flex-col shadow-xl z-20 absolute inset-0 md:relative md:flex ${
          showMobileCart ? "flex" : "hidden"
        }`}
      >
        {/* Mobile Only: Back Button */}
        <div className="md:hidden p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <button
            onClick={() => setShowMobileCart(false)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-200 text-gray-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="font-bold text-lg text-gray-800">
            Cart ({totalItemsInCart})
          </h2>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-lg text-gray-800">Current Order</h2>
        </div>

        {/* Order Details Form */}
        <div className="p-4 space-y-3 border-b border-gray-100 bg-white">
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

          <div>
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Discount (₱)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800 line-clamp-1">
                    {item.name}
                  </p>
                  <p className="text-xs text-brand-primary font-bold">
                    ₱{Number(item.unitPrice).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-white rounded-md border border-gray-200 shadow-sm">
                    <button
                      onClick={() => handleQuantityChange(item._id, -1)}
                      className="p-1.5 hover:bg-gray-100 text-gray-600"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item._id, 1)}
                      className="p-1.5 hover:bg-gray-100 text-gray-600"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveFromCart(item._id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] text-sm safe-area-bottom">
          <div className="space-y-1 mb-3">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₱{Number(rawSubtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Discount</span>
              <span className="text-green-600">
                -₱{Number(safeDiscount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Tax ({taxRate}%)</span>
              <span>₱{Number(taxAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-dashed">
              <span>Total</span>
              <span className="text-brand-primary">
                ₱{Number(totalAmount).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleSaveSale}
            disabled={loading || cartItems.length === 0}
            className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-brand-primary/30"
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

      {/* --- MOBILE FLOATING CART BAR --- */}
      {/* Only visible on mobile when cart is hidden */}
      {!showMobileCart && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-30">
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg relative">
                <ShoppingBag className="w-5 h-5 text-white" />
                {totalItemsInCart > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-gray-900"></span>
                )}
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="font-bold text-sm">
                  {totalItemsInCart} items
                </span>
                <span className="text-[10px] text-gray-400">View Cart</span>
              </div>
            </div>
            <span className="font-bold text-lg">₱{totalAmount.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesManagement;
