import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { customAlphabet } from "nanoid/non-secure";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import DashboardLayout from "../scripts/DashboardLayout";
import PopupMessage from "../components/PopupMessage";
import "../styles/App.css";
import "../styles/SalesManagement.css";

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
  const [totalItems, setTotalItems] = useState(0);
  const [paginatedItems, setPaginatedItems] = useState([]);

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

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const nanoid = customAlphabet(alphabet, 8);
  const generateSaleID = () => `SALE-${nanoid()}`;

  const fetchInventory = useCallback(async () => {
    try {
      let url = `${API_BASE}/api/inventory?page=${currentPage}&limit=10&search=${encodeURIComponent(
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
      taxRate: taxRate || 0,
      taxAmount,
      totalAmount,
      paymentMethod,
    };

    try {
      const res = await authFetch(`${API_BASE}/api/sales`, {
        method: "POST",
        body: JSON.stringify(saleToSend),
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
                    <th className="col-itemid">Item ID</th>
                    <th className="col-name">Name</th>
                    <th className="col-category">Category</th>
                    <th className="col-purchase">Purchase Price</th>
                    <th className="col-unitprice">Unit Price</th>
                    <th className="col-amountunit">Amount</th>
                    <th className="col-stock">Stock</th>
                    <th className="col-status">Status</th>
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
                          <td className="col-itemid">{item.itemId}</td>
                          <td className="col-name" title={item.name}>
                            {item.name}
                          </td>
                          <td className="col-category">{item.category}</td>
                          <td className="col-purchase">
                            ₱{item.purchasePrice}
                          </td>
                          <td className="col-unitprice">₱{item.unitPrice}</td>
                          <td className="col-amountunit">
                            {item.amount
                              ? `${item.amount} ${item.unit?.name || ""}`
                              : "—"}
                          </td>
                          <td className="col-stock">{item.stock}</td>
                          <td className="col-status">
                            <span
                              className={`product-status ${item.status
                                .replace(/\s+/g, "-")
                                .toLowerCase()}`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

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

              <label className="tax-toggle">
                <input
                  type="checkbox"
                  checked={taxRate === 12}
                  onChange={(e) => setTaxRate(e.target.checked ? 12 : 0)}
                />
                Apply 12% VAT
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
