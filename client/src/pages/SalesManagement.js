import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "../scripts/Sidebar";
import EditModal from "../components/EditModal";
import ViewModal from "../components/ViewModal";
import ConfirmationModal from "../components/ConfirmationModal";
import PopupMessage from "../components/PopupMessage";
import "../styles/App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SalesManagement = () => {
  const [sales, setSales] = useState([]);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("saleId");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewedSale, setViewedSale] = useState(null);

  // Fields for creating a sale
  const saleFields = [
    {
      name: "customerName",
      label: "Customer Name",
      type: "text",
      required: true,
    },
    {
      name: "orderType",
      label: "Order Type",
      type: "select",
      required: true,
      options: [
        { value: "Walk-in", label: "Walk-in" },
        { value: "Online", label: "Online" },
      ],
    },
    {
      name: "taxRate",
      label: "Tax Rate (%)",
      type: "number",
      required: false,
    },
    {
      name: "paymentMethod",
      label: "Payment Method",
      type: "select",
      required: true,
      options: [
        { value: "Cash", label: "Cash" },
        { value: "Credit Card", label: "Credit Card" },
        { value: "GCash", label: "GCash" },
        { value: "PayMaya", label: "PayMaya" },
        { value: "Others", label: "Others" },
      ],
    },
  ];

  // Fields for viewing a sale's details
  const displaySale = [
    { name: "saleId", label: "Sale ID" },
    { name: "customerId", label: "Customer ID" },
    { name: "customerName", label: "Customer Name" },
    { name: "orderType", label: "Order Type" },
    {
      name: "items",
      label: "Items Sold",
      render: (items) =>
        Array.isArray(items)
          ? items.map((item) => `${item.name} x${item.quantity}`).join(", ")
          : "No items",
    },
    { name: "totalAmount", label: "Total" },
    { name: "taxRate", label: "Tax Rate" },
    { name: "date", label: "Date" },
  ];

  const [itemForm, setItemForm] = useState({
    itemId: "",
    quantity: 1,
  });

  // Fetch inventory items
  useEffect(() => {
    fetch(`${API_BASE}/api/inventory`)
      .then((res) => res.json())
      .then((data) => setInventoryItems(data))
      .catch((err) => console.error("Failed to fetch inventory items", err));
  }, []);

  // Fetch sales
  const fetchSales = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/sales`);
      if (!response.ok) throw new Error("Failed to fetch sales.");
      const data = await response.json();
      setSales(data);
    } catch (err) {
      setPopupMessage(err.message || "Something went wrong.");
      setPopupType("error");
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Filter sales
  useEffect(() => {
    const filtered = sales.filter((sale) => {
      if (searchField === "greaterPrice") {
        return sale.totalAmount >= parseFloat(searchQuery || 0);
      } else if (searchField === "lessPrice") {
        return sale.totalAmount <= parseFloat(searchQuery || 0);
      } else {
        const value = sale[searchField]?.toString().toLowerCase();
        return value && value.includes(searchQuery.toLowerCase());
      }
    });

    setFilteredSales(filtered);
  }, [searchQuery, searchField, sales]);

  // Creating sale handler
  const handleAddSale = () => {
    setItemForm({ itemId: "", quantity: 1 });
    setSelectedItem(null);
    setShowModal(true);
  };

  // Handles saving a created sale
  const handleSaveSale = async (saleData) => {
    if (!saleData.items || saleData.items.length === 0) {
      setPopupMessage("Please add at least one item to the sale.");
      setPopupType("error");
      return;
    }

    if (!saleData.orderType) {
      setPopupMessage("Please select a order type.");
      setPopupType("error");
      return;
    }

    if (!saleData.paymentMethod) {
      setPopupMessage("Please select a payment method.");
      setPopupType("error");
      return;
    }

    const subtotal = saleData.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const hasTax = saleData.taxRate && saleData.taxRate > 0;
    const taxAmount = hasTax ? (subtotal * saleData.taxRate) / 100 : 0;
    const totalAmount = subtotal + taxAmount;

    const saleToSend = {
      saleId: uuidv4(),
      customerName: saleData.customerName,
      orderType: saleData.orderType,
      items: saleData.items,
      subtotal,
      taxRate: saleData.taxRate || 0,
      taxAmount,
      totalAmount,
      paymentMethod: saleData.paymentMethod,
      date: saleData.date
        ? new Date(saleData.date).toISOString()
        : new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API_BASE}/api/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleToSend),
      });

      if (!res.ok) throw new Error("Failed to create sale.");

      setPopupMessage("Sale created successfully!");
      setPopupType("success");
      setShowModal(false);
      fetchSales();
    } catch (err) {
      setPopupMessage(err.message || "Something went wrong.");
      setPopupType("error");
    }
  };

  const handleDelete = async () => {
    if (!saleToDelete) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/sales/${saleToDelete._id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setSales((prev) => prev.filter((s) => s._id !== saleToDelete._id));

        setIsViewOpen(false);
        setViewedSale(null);

        setPopupMessage("Sale deleted successfully.");
        setPopupType("success");
      } else {
        setPopupMessage("Failed to delete sale.");
        setPopupType("error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setPopupMessage("An error occurred while deleting.");
      setPopupType("error");
    } finally {
      setShowConfirmModal(false);
      setSaleToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
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

      {isViewOpen && viewedSale && (
        <ViewModal
          item={viewedSale}
          fields={displaySale}
          onClose={() => {
            setIsViewOpen(false);
            setViewedSale(null);
          }}
          onDelete={() => {
            setSaleToDelete(viewedSale);
            setShowConfirmModal(true);
          }}
        />
      )}

      {showConfirmModal && saleToDelete && (
        <ConfirmationModal
          message={`Are you sure you want to delete Sale ID: ${saleToDelete._id}?`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowConfirmModal(false);
            setSaleToDelete(null);
          }}
        />
      )}

      {showModal && (
        <EditModal
          item={selectedItem}
          fields={saleFields}
          onSave={handleSaveSale}
          onClose={handleCloseModal}
          mode="add"
          modalType="sale"
          allItems={inventoryItems}
          itemForm={itemForm}
          setItemForm={setItemForm}
        />
      )}

      <Sidebar />
      <main className="module-main-content">
        <div className="module-header">
          <h1 className="module-title">Sales Management</h1>
        </div>

        <div className="module-actions-container">
          <select
            className="module-filter-dropdown"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value="saleId">Sale ID</option>
            <option value="customerName">Customer</option>
            <option value="greaterPrice">&gt; Price</option>
            <option value="lessPrice">&lt; Price</option>
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
            onClick={handleAddSale}
          >
            Create Sale
          </button>
        </div>

        <section className="module-table-container">
          <table className="module-table">
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Customer Name</th>
                <th>Order Type</th>
                <th>Total</th>
                <th>Payment Method</th>
                <th>Date Created</th>
                <th className="action-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr key={sale._id}>
                    <td>{sale.saleId}</td>
                    <td>{sale.customerName}</td>
                    <td>{sale.orderType}</td>
                    <td>₱{sale.totalAmount?.toFixed(2)}</td>
                    <td>{sale.paymentMethod}</td>
                    <td>{new Date(sale.date).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="module-action-btn module-view-btn"
                        onClick={() => {
                          setViewedSale(sale);
                          setIsViewOpen(true);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No sales found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
};

export default SalesManagement;