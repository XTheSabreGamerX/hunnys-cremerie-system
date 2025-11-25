// CLEAN + FIXED VERSION
// ------------------------------------------

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import DashboardLayout from "../scripts/DashboardLayout";
import PopupMessage from "../components/PopupMessage";
import { FiTrash2 } from "react-icons/fi";
import "../styles/App.css";
import "../styles/SalesManagement.css";

const SalesManagement = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  const [orderType, setOrderType] = useState("Walk-in");
  const [isUnregistered, setIsUnregistered] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const [applyDiscount, setApplyDiscount] = useState(false); // Senior/PWD checkbox
  const [taxRate] = useState(12);

  const [searchQuery, setSearchQuery] = useState("");

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [paginatedItems, setPaginatedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("success");
    }, 2000);
  };

  // -------------------------------
  // Fetch Inventory (Paginated)
  // -------------------------------
  const fetchInventory = useCallback(async () => {
    try {
      const url = `${API_BASE}/api/inventory?page=${currentPage}&limit=10&search=${encodeURIComponent(
        searchQuery
      )}`;

      const res = await authFetch(url);
      if (!res.ok) throw new Error("Failed to fetch inventory");

      const data = await res.json();

      const wrappedData = Array.isArray(data)
        ? {
            items: data,
            currentPage: 1,
            totalPages: 1,
            totalItems: data.length,
          }
        : data;

      setInventoryItems(wrappedData.items ?? []);
      setTotalPages(wrappedData.totalPages ?? 1);
      setTotalItems(wrappedData.totalItems ?? 0);
    } catch (err) {
      console.error("Inventory fetch error:", err);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // -------------------------------
  // Fetch Customers
  // -------------------------------
  useEffect(() => {
    authFetch(`${API_BASE}/api/customers?page=1&limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data.customers) ? data.customers : [];
        setCustomers(list);

        if (!isUnregistered && list[0]) {
          setCustomerName(list[0].name);
        }
      })
      .catch(() => console.error("Failed to fetch customers"));
  }, [isUnregistered]);

  useEffect(() => {
    setPaginatedItems(inventoryItems);
  }, [inventoryItems]);

  // -------------------------------
  // Cart Operations
  // -------------------------------
  const handleAddToCart = (product) => {
    if (
      product.currentStock <= 0 ||
      product.status === "Out of stock" ||
      product.status === "Expired"
    )
      return;

    setInventoryItems((prev) =>
      prev.map((i) =>
        i._id === product._id ? { ...i, currentStock: i.currentStock - 1 } : i
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

  const handleIncreaseQuantity = (itemId) => {
    setCartItems((prevCart) =>
      prevCart.map((item) => {
        if (item._id === itemId) {
          const invItem = inventoryItems.find((i) => i._id === itemId);
          if (!invItem || invItem.currentStock <= 0) return item;

          setInventoryItems((prevInv) =>
            prevInv.map((i) =>
              i._id === itemId ? { ...i, currentStock: i.currentStock - 1 } : i
            )
          );

          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      })
    );
  };

  const handleDecreaseQuantity = (itemId) => {
    setCartItems((prevCart) =>
      prevCart.map((item) => {
        if (item._id === itemId && item.quantity > 1) {
          setInventoryItems((prevInv) =>
            prevInv.map((i) =>
              i._id === itemId ? { ...i, currentStock: i.currentStock + 1 } : i
            )
          );
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      })
    );
  };

  const handleRemoveFromCart = (itemId) => {
    const removed = cartItems.find((i) => i._id === itemId);

    if (removed) {
      setInventoryItems((prev) =>
        prev.map((i) =>
          i._id === itemId
            ? { ...i, currentStock: i.currentStock + removed.quantity }
            : i
        )
      );
    }

    setCartItems((prev) => prev.filter((i) => i._id !== itemId));
  };

  // -------------------------------
  // Financial Calculations
  // -------------------------------
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0
  );

  let effectiveSubtotal = subtotal;
  let discountAmount = 0;
  let taxAmount = subtotal * 0.12;

  if (applyDiscount) {
    const netOfVat = subtotal / 1.12;
    const scPwdDiscount = netOfVat * 0.2;

    discountAmount = scPwdDiscount;
    effectiveSubtotal = netOfVat - scPwdDiscount;
    taxAmount = 0;
  }

  const total = effectiveSubtotal + taxAmount;

  // -------------------------------
  // Save Sale
  // -------------------------------
  const handleSaveSale = async () => {
    if (cartItems.length === 0) {
      showPopup("Please add at least one item.", "error");
      return;
    }

    if (!orderType) {
      showPopup("Please select an order type.", "error");
      return;
    }

    setLoading(true);

    try {
      const saleToSend = {
        customerName: isUnregistered
          ? customerName.trim() || "Unregistered"
          : customerName,
        orderType,
        items: cartItems.map((i) => ({
          itemId: i._id,
          quantity: i.quantity,
          sellingPrice: Number(i.sellingPrice.toFixed(2)),
        })),
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(discountAmount.toFixed(2)),
        taxRate: applyDiscount ? 0 : taxRate,
        taxAmount: Number(taxAmount.toFixed(2)),
        totalAmount: Number(total.toFixed(2)),
      };

      const res = await authFetch(`${API_BASE}/api/sales`, {
        method: "POST",
        body: JSON.stringify(saleToSend),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to create sale.");
      }

      const resData = await res.json();
      showPopup(
        `Sale created successfully! Invoice #: ${resData.sale.invoiceNumber}`,
        "success"
      );

      // Update inventory
      await Promise.all(
        cartItems.map((item) =>
          authFetch(`${API_BASE}/api/inventory/${item._id}`, {
            method: "PUT",
            body: JSON.stringify({ stock: item.currentStock }),
          })
        )
      );

      // Reset
      setCartItems([]);
      setOrderType("Walk-in");
      setCustomerName("");
      setIsUnregistered(false);
      setApplyDiscount(false);
    } catch (err) {
      showPopup(err.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => setPopupMessage("");

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <>
      {popupMessage && (
        <PopupMessage
          message={popupMessage}
          type={popupType}
          onClose={handleClosePopup}
        />
      )}

      <DashboardLayout>
        <main className="pos-main">
          {/* Products */}
          <section className="sales-products">
            <div className="sales-products-header">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="sales-search-input"
              />
            </div>

            <div className="sales-products-table-container">
              <table className="sales-products-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Name</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Status</th>
                    <th>Expiration</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-results">
                        No matching products found.
                      </td>
                    </tr>
                  ) : (
                    paginatedItems
                      .filter((i) => !i.archived)
                      .sort((a, b) => {
                        if (a.status === "Well-stocked" && b.status !== "Well-stocked") return -1;
                        if (a.status !== "Well-stocked" && b.status === "Well-stocked") return 1;
                        return 0;
                      })
                      .map((item) => (
                        <tr
                          key={item._id}
                          className={`sales-table-row ${
                            item.currentStock <= 0 ||
                            item.status === "Out of stock" ||
                            item.status === "Expired"
                              ? "disabled-row"
                              : ""
                          }`}
                          onClick={() => handleAddToCart(item)}
                        >
                          <td>{item.itemId}</td>
                          <td>{item.name}</td>
                          <td>{item.currentStock}</td>
                          <td>₱{item.sellingPrice.toFixed(2)}</td>
                          <td>{item.category}</td>
                          <td>{item.unit?.name || "—"}</td>
                          <td>
                            <span
                              className={`product-status ${item.status
                                .replace(/\s+/g, "-")
                                .toLowerCase()}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td>
                            {item.expirationDate
                              ? new Date(item.expirationDate).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <p className="pagination-info">
                Showing {(currentPage - 1) * 10 + 1}-
                {Math.min(currentPage * 10, totalItems)} of {totalItems} items
              </p>

              <div className="pagination-buttons">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Prev
                </button>

                {Array.from({ length: Math.min(7, totalPages) }).map((_, idx) => {
                  const start = Math.max(
                    1,
                    Math.min(currentPage - 3, totalPages - 6)
                  );
                  const pageNum = start + idx;
                  if (pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      className={currentPage === pageNum ? "active" : ""}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          {/* Cart Section */}
          <section className="pos-cart">
            <div className="pos-cart-header">
              <h2>Cart</h2>
            </div>

            {/* Order Info */}
            <div className="pos-order-info">
              <label>
                Order Type
                <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Online">Online</option>
                </select>
              </label>

              <label>
                Customer
                {isUnregistered ? (
                  <input
                    type="text"
                    placeholder="Enter customer name or leave blank."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                ) : (
                  <select
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  >
                    {customers.map((cust) => (
                      <option key={cust._id} value={cust.name}>
                        {cust.name} ({cust.customerId})
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label className="pos-unregistered-toggle">
                <input
                  type="checkbox"
                  checked={isUnregistered}
                  onChange={(e) => {
                    setIsUnregistered(e.target.checked);
                    setCustomerName(
                      e.target.checked ? "" : customers[0]?.name || "Unregistered"
                    );
                  }}
                />
                Unregistered Customer
              </label>

              <label className="pos-discount-toggle">
                <input
                  type="checkbox"
                  checked={applyDiscount}
                  onChange={(e) => setApplyDiscount(e.target.checked)}
                />
                Senior/PWD Discount
              </label>
            </div>

            {/* Cart Items */}
            <div className="pos-cart-items">
              {cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item._id} className="pos-cart-item">
                    <span>{item.name}</span>

                    <div className="cart-quantity-controls">
                      <button
                        onClick={() => handleDecreaseQuantity(item._id)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => handleIncreaseQuantity(item._id)}
                        disabled={item.quantity >= item.currentStock}
                      >
                        +
                      </button>

                      <button
                        className="cart-remove-btn"
                        onClick={() => handleRemoveFromCart(item._id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    <span>₱{(item.sellingPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Summary */}
            <div className="pos-cart-summary">
              <p>Subtotal: ₱{subtotal.toFixed(2)}</p>
              <p>Discount: ₱{discountAmount.toFixed(2)}</p>
              <p>
                Tax ({applyDiscount ? 0 : taxRate}%): ₱{taxAmount.toFixed(2)}
              </p>
              <p>Total: ₱{total.toFixed(2)}</p>

              <button
                className="pos-checkout-btn"
                onClick={handleSaveSale}
                disabled={loading}
              >
                {loading ? "Checking Out..." : "Checkout"}
              </button>
            </div>
          </section>
        </main>
      </DashboardLayout>
    </>
  );
};

export default SalesManagement;