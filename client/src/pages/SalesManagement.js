import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { customAlphabet } from "nanoid/non-secure";
import DashboardLayout from "../scripts/DashboardLayout";
import PopupMessage from "../components/PopupMessage";
import "../styles/SalesManagement.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SalesManagement = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [orderType, setOrderType] = useState("Walk-in");
  const [isUnregistered, setIsUnregistered] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [paginatedItems, setPaginatedItems] = useState([]);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const authHeader = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("success");
    }, 2000);
  };

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const nanoid = customAlphabet(alphabet, 8);
  const generateSaleID = () => `SALE-${nanoid()}`;

  // Fetch inventory
  useEffect(() => {
    fetch(`${API_BASE}/api/inventory?page=1&limit=1000`, {
      headers: authHeader,
    })
      .then((res) => res.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : data.items;
        setInventoryItems(items || []);
      })
      .catch((err) => console.error("Failed to fetch inventory items", err));
  }, [authHeader]);

  // Fetch customers
  useEffect(() => {
    fetch(`${API_BASE}/api/customers?page=1&limit=1000`, {
      headers: authHeader,
    })
      .then((res) => res.json())
      .then((data) => {
        const custs = Array.isArray(data.customers) ? data.customers : [];
        setCustomers(custs);
        if (!isUnregistered && custs[0]) setCustomerName(custs[0].name);
      })
      .catch(() => console.error("Failed to fetch customers"));
  }, [authHeader, isUnregistered]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = inventoryItems.slice(startIndex, endIndex);
    setPaginatedItems(currentItems);
    setTotalPages(Math.ceil(inventoryItems.length / itemsPerPage));
  }, [inventoryItems, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleAddToCart = (product) => {
    if (product.stock <= 0) return;

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

  const handleIncreaseQuantity = (itemId) => {
    setCartItems((prev) =>
      prev.map((cartItem) => {
        if (cartItem._id === itemId && cartItem.quantity < cartItem.stock) {
          setInventoryItems((prevInv) =>
            prevInv.map((invItem) =>
              invItem._id === itemId
                ? { ...invItem, stock: invItem.stock - 1 }
                : invItem
            )
          );
          return { ...cartItem, quantity: cartItem.quantity + 1 };
        }
        return cartItem;
      })
    );
  };

  const handleDecreaseQuantity = (itemId) => {
    setCartItems((prev) =>
      prev.map((cartItem) => {
        if (cartItem._id === itemId && cartItem.quantity > 1) {
          setInventoryItems((prevInv) =>
            prevInv.map((invItem) =>
              invItem._id === itemId
                ? { ...invItem, stock: invItem.stock + 1 }
                : invItem
            )
          );
          return { ...cartItem, quantity: cartItem.quantity - 1 };
        }
        return cartItem;
      })
    );
  };

  const handleSaveSale = async () => {
    if (cartItems.length === 0) {
      showPopup("Please add at least one item to the sale.", "error");
      return;
    }
    if (!orderType) {
      showPopup("Please select an order type.", "error");
      return;
    }
    if (!paymentMethod) {
      showPopup("Please select a payment method.", "error");
      return;
    }

    const subtotal = cartItems.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0
    );
    const taxAmount = taxRate > 0 ? (subtotal * taxRate) / 100 : 0;
    const totalAmount = subtotal + taxAmount;

    const saleToSend = {
      saleId: generateSaleID(alphabet),
      customerName:
        isUnregistered || !customerName ? "Unregistered" : customerName,
      orderType,
      items: cartItems.map((i) => ({
        itemId: i._id,
        name: i.name,
        price: i.unitPrice,
        quantity: i.quantity,
        purchasePrice: i.purchasePrice || 0,
      })),
      subtotal,
      taxRate: taxRate || 0,
      taxAmount,
      totalAmount,
      paymentMethod,
    };

    try {
      const res = await fetch(`${API_BASE}/api/sales`, {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify(saleToSend),
      });

      if (!res.ok) throw new Error("Failed to create sale.");

      await Promise.all(
        cartItems.map((item) =>
          fetch(`${API_BASE}/api/inventory/${item._id}`, {
            method: "PUT",
            headers: authHeader,
            body: JSON.stringify({ stock: item.stock - item.quantity }),
          })
        )
      );

      showPopup("Sale created successfully!", "success");

      setCartItems([]);
      setOrderType("Walk-in");
      setCustomerName("");
      setIsUnregistered(false);
      setTaxRate(0);
      setPaymentMethod("");
    } catch (err) {
      showPopup(err.message || "Something went wrong.", "error");
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sales-search-input"
              />
            </div>

            <div className="sales-products-table-container">
              <table className="sales-products-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Purchase Price</th>
                    <th>Unit Price</th>
                    <th>Unit</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedItems
                    .filter((item) =>
                      item.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
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
                          item.stock <= 0 ||
                          item.status === "Out of stock" ||
                          item.status === "Expired"
                            ? "disabled-row"
                            : ""
                        }`}
                        onClick={() =>
                          item.stock > 0 &&
                          item.status !== "Out of stock" &&
                          item.status !== "Expired"
                            ? handleAddToCart(item)
                            : null
                        }
                      >
                        <td>{item.itemId}</td>
                        <td>{item.name}</td>
                        <td>{item.category}</td>
                        <td>₱{item.purchasePrice}</td>
                        <td>₱{item.unitPrice}</td>
                        <td>{item.unit?.name || "N/A"}</td>
                        <td>{item.stock}</td>
                        <td>
                          <span
                            className={`product-status ${item.status
                              .replace(/\s+/g, "-")
                              .toLowerCase()}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>{item.amount}</td>
                      </tr>
                    ))}

                  {/* Show message if no matching results */}
                  {paginatedItems.filter((item) =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <tr>
                      <td colSpan="9" className="no-results">
                        No matching products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pos-pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pos-pagination-btn"
              >
                Previous
              </button>

              <span className="pos-pagination-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pos-pagination-btn"
              >
                Next
              </button>
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
                  onChange={(e) => {
                    const newType = e.target.value;
                    setOrderType(newType);
                  }}
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

              <label>
                Tax Rate (%)
                <input
                  type="number"
                  value={taxRate}
                  min={0}
                  max={100}
                  step={0.01}
                  inputMode="decimal"
                  onKeyDown={(e) => {
                    if (["e", "E", "+", "-", ","].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onInput={(e) => {
                    const input = e.target.value;
                    const cleaned = input.replace(/[^0-9.]/g, "");
                    if (cleaned !== input) {
                      e.target.value = cleaned;
                    }
                  }}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      setTaxRate("");
                      return;
                    }
                    const num = Number(v);
                    if (!Number.isFinite(num)) return;
                    const clamped = Math.min(Math.max(num, 0), 100);
                    setTaxRate(clamped);
                  }}
                  onBlur={(e) => {
                    let num = parseFloat(e.target.value);
                    if (!Number.isFinite(num)) num = 0;
                    const clamped = Math.min(Math.max(num, 0), 100);
                    setTaxRate(Number(clamped.toFixed(2)));
                  }}
                />
              </label>

              <label>
                Payment Method
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="GCash">GCash</option>
                  <option value="PayMaya">PayMaya</option>
                  <option value="Others">Others</option>
                </select>
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
                        disabled={item.quantity >= item.stock}
                      >
                        +
                      </button>
                    </div>
                    <span>₱{(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="pos-cart-summary">
              <p>
                Subtotal: ₱
                {cartItems
                  .reduce(
                    (sum, item) => sum + item.unitPrice * item.quantity,
                    0
                  )
                  .toFixed(2)}
              </p>
              <button className="pos-checkout-btn" onClick={handleSaveSale}>
                Checkout
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
