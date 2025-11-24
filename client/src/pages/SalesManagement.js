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
  const [discount, setDiscount] = useState(0); // flat amount in PHP
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

  const fetchInventory = useCallback(async () => {
    try {
      const url = `${API_BASE}/api/inventory?page=${currentPage}&limit=10&search=${encodeURIComponent(
        searchQuery
      )}`;

      const res = await authFetch(url);
      if (!res || !res.ok) throw new Error("Failed to fetch inventory");

      const data = await res.json();

      const wrappedData = Array.isArray(data)
        ? {
            items: data,
            currentPage: 1,
            totalPages: 1,
            totalItems: data.length,
          }
        : data;

      setInventoryItems(wrappedData.items || []);
      setTotalPages(wrappedData.totalPages || 1);
      setTotalItems(wrappedData.totalItems || 0);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Fetch customers
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

  useEffect(() => {
    setPaginatedItems(inventoryItems);
  }, [inventoryItems]);

  const handleAddToCart = (product) => {
    if (
      product.currentStock <= 0 ||
      product.status === "Out of stock" ||
      product.status === "Expired"
    )
      return;

    // Decrement stock in inventory
    setInventoryItems((prev) =>
      prev.map((i) =>
        i._id === product._id ? { ...i, currentStock: i.currentStock - 1 } : i
      )
    );

    // Add to cart or increment quantity
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
      prevCart.map((cartItem) => {
        if (cartItem._id === itemId) {
          // Find corresponding inventory item
          const invItem = inventoryItems.find((i) => i._id === itemId);
          if (!invItem || invItem.currentStock <= 0) return cartItem;

          // Decrement stock
          setInventoryItems((prevInv) =>
            prevInv.map((i) =>
              i._id === itemId ? { ...i, currentStock: i.currentStock - 1 } : i
            )
          );

          return { ...cartItem, quantity: cartItem.quantity + 1 };
        }
        return cartItem;
      })
    );
  };

  const handleDecreaseQuantity = (itemId) => {
    setCartItems((prevCart) =>
      prevCart.map((cartItem) => {
        if (cartItem._id === itemId && cartItem.quantity > 1) {
          // Increment stock back
          setInventoryItems((prevInv) =>
            prevInv.map((i) =>
              i._id === itemId ? { ...i, currentStock: i.currentStock + 1 } : i
            )
          );
          return { ...cartItem, quantity: cartItem.quantity - 1 };
        }
        return cartItem;
      })
    );
  };

  const handleRemoveFromCart = (itemId) => {
    const removedItem = cartItems.find((i) => i._id === itemId);
    if (removedItem) {
      setInventoryItems((prevInv) =>
        prevInv.map((i) =>
          i._id === itemId
            ? { ...i, currentStock: i.currentStock + removedItem.quantity }
            : i
        )
      );
    }
    setCartItems((prevCart) => prevCart.filter((i) => i._id !== itemId));
  };

  // ---------------------------
  // Calculations used by UI
  // ---------------------------
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0
  );

// Ensure discount is numeric and non-negative
  const safeDiscount = Number.isFinite(Number(discount)) ? Number(discount) : 0;
  const effectiveSubtotal = Math.max(subtotal - Math.max(0, safeDiscount), 0);

  const taxAmount = (effectiveSubtotal * Number(taxRate)) / 100;
  const total = effectiveSubtotal + taxAmount;

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
      // Recompute server-safe values the same way UI does
      const subtotalLocal = cartItems.reduce(
        (sum, item) => sum + item.sellingPrice * item.quantity,
        0
      );

      const discountAmount = Number.isFinite(Number(discount))
        ? Number(discount)
        : 0;

      const effective = Math.max(subtotalLocal - Math.max(0, discountAmount), 0);
      const taxAmt = (effective * Number(taxRate)) / 100;
      const totalAmount = effective + taxAmt;

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
        subtotal: Number(subtotalLocal.toFixed(2)),
        taxRate: Number(taxRate),
        taxAmount: Number(taxAmt.toFixed(2)),
        discount: Number(discountAmount.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
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

      // Update inventory via your endpoint (keeps your original approach)
      await Promise.all(
        cartItems.map((item) =>
          authFetch(`${API_BASE}/api/inventory/${item._id}`, {
            method: "PUT",
            body: JSON.stringify({ stock: item.currentStock - item.quantity }),
          })
        )
      );

      setCartItems([]);
      setOrderType("Walk-in");
      setCustomerName("");
      setIsUnregistered(false);
      setDiscount(0);
    } catch (err) {
      showPopup(err.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setPopupMessage("");
  };

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
                      .filter((item) => !item.archived)
                      .sort((a, b) => {
                        if (
                          a.status === "Well-stocked" &&
                          b.status !== "Well-stocked"
                        )
                          return -1;
                        if (
                          a.status !== "Well-stocked" &&
                          b.status === "Well-stocked"
                        )
                          return 1;
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
                          <td title={item.name}>{item.name}</td>
                          <td>{item.currentStock}</td>
                          <td>₱{item.sellingPrice?.toFixed(2)}</td>
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
                              ? new Date(
                                  item.expirationDate
                                ).toLocaleDateString()
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
                {Array.from({ length: Math.min(7, totalPages) }).map(
                  (_, idx) => {
                    const start = Math.max(
                      1,
                      Math.min(currentPage - 3, totalPages - 6)
                    );
                    const pageNumber = start + idx;
                    if (pageNumber > totalPages) return null;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={currentPage === pageNumber ? "active" : ""}
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                )}
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

          <section className="pos-cart">
            <div className="pos-cart-header">
              <h2>Cart</h2>
            </div>

            <div className="pos-order-info">
              <label>
                Order Type
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                >
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
                      e.target.checked
                        ? ""
                        : customers[0]?.name || "Unregistered"
                    );
                  }}
                />
                Unregistered Customer
              </label>
              <label className="pos-discount-input">
                Discount (₱):
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) =>
                    setDiscount(
                      e.target.value === "" ? 0 : Number(parseFloat(e.target.value))
                    )
                  }
                  placeholder="0.00"
                />
              </label>
            </div>

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
                    <span>
                      ₱{(item.sellingPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pos-cart-summary">
              <p>Subtotal: ₱{subtotal.toFixed(2)}</p>
              <p>Discount: ₱{Number(safeDiscount).toFixed(2)}</p>
              <p>
                Tax ({taxRate}%): ₱{taxAmount.toFixed(2)}
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
      {popupMessage && <PopupMessage type={popupType} message={popupMessage} />}
    </>
  );
};

export default SalesManagement;