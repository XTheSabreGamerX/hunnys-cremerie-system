import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../scripts/Sidebar';
import InventoryModal from '../components/InventoryModal';
import PopupMessage from '../components/PopupMessage';
import '../styles/Inventory.css';

const Inventory = () => {
	const [items, setItems] = useState([]);
	const [selectedItem, setSelectedItem] = useState(null);
	const [popupMessage, setPopupMessage] = useState('');
	const [modalMode, setModalMode] = useState('view');
	const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

	const fetchItems = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/inventory`);
      const data = await response.json();
      setItems(data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

	const handleDelete = async (id) => {
		try {
			const res = await fetch(`${API_BASE}/api/inventory/${id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Failed');
			setItems(prev => prev.filter(item => item._id !== id));
			setPopupMessage('The item has been deleted!');
			setSelectedItem(null);
		} catch (err) {
			console.error(err);
			setPopupMessage('Could not delete item.');
		}
	};

	const handleAddOrEdit = async (itemData) => {
	try {
		const response = await fetch(`${API_BASE}/api/inventory`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(itemData),
		});

		if (!response.ok) throw new Error('Failed to add item');
		
		const newItem = await response.json();
		setItems((prev) => [...prev, newItem]);
		setPopupMessage('Item successfully added!');
	} catch (error) {
		console.error('Error adding item:', error);
		setPopupMessage('Failed to add item.');
	}
};

	return (
		<>
			{popupMessage && (
				<PopupMessage
					message={popupMessage}
					type="success"
					onClose={() => setPopupMessage('')}
				/>
			)}

			{(modalMode === 'add' || selectedItem) && (
				<InventoryModal
					mode={modalMode}
					item={selectedItem}
					items={items}
					onSave={handleAddOrEdit}
					onDelete={handleDelete}
					onClose={() => {
						setSelectedItem(null);
						setModalMode('view');
					}}
          setPopupMessage={setPopupMessage}
				/>
			)}

			<Sidebar />

			<main className="inventory-main-content">
				<h1>Inventory</h1>

				<div className="inventory-actions">
					<input
						type="text"
						placeholder="Search items..."
						className="inventory-search"
					/>
					<button
						className="inventory-btn add-btn"
						onClick={() => {
							setModalMode('add');
							setSelectedItem(null);
						}}
					>
						Add Item
					</button>
					<button className="inventory-btn view-btn">View</button>
				</div>

				<div className="inventory-table-container">
					<table>
						<thead>
							<tr>
								<th>ID</th>
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
									<td colSpan="8">No items found.</td>
								</tr>
							) : (
								items.map((item) => (
									<tr key={item._id}>
										<td>{item.itemId}</td>
										<td>{item.name}</td>
										<td>{item.stock}</td>
										<td>{item.category}</td>
										<td>₱{item.unitPrice}</td>
										<td>{item.supplier}</td>
										<td>
											{item.expirationDate
												? new Date(item.expirationDate).toLocaleDateString()
												: 'N/A'}
										</td>
										<td>
											<button
												className="inventory-btn view-btn"
												onClick={() => {
													setModalMode('view');
													setSelectedItem(item);
												}}
											>
												View
											</button>
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