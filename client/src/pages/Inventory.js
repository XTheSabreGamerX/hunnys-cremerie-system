import React, { useEffect, useState } from 'react';
import Sidebar from '../scripts/Sidebar';
import '../styles/Inventory.css';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/inventory`);
        const data = await response.json();
        setItems(data);
      } catch (err) {
        console.error('Error fetching inventory:', err);
      }
    };

    fetchItems();
  }, [API_BASE]);

  return (
    <>
      <Sidebar />
      <main className="inventory-main-content">
        <h1>Inventory (Items listed are temporary, for design purposes)</h1>
        <div className="inventory-actions">
            <input
                type="text"
                placeholder="Search items..."
                className="inventory-search"
            />
            <button className="inventory-btn add-btn">Add Item</button>
            <button className="inventory-btn delete-btn">Delete</button>
        </div>

        <div className="inventory-table-container">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Supplier</th>
                <th>Expiration Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="7">No items found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.stock}</td>
                    <td>{item.category}</td>
                    <td>₱{item.unitPrice}</td>
                    <td>{item.supplier}</td>
                    <td>{item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : 'N/A'}</td>                 
                    <td>
                        <button className="inventory-btn edit-btn">Edit</button>
                        <button className="inventory-btn delete-btn">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
};

export default Inventory;