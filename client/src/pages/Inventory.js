import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../scripts/Sidebar';
import InventoryModal from '../components/InventoryModal';
import PopupMessage from '../components/PopupMessage';
import '../styles/Inventory.css';

const Inventory = () => {
	const [items, setItems] = useState([]);
	const [selectedItem, setSelectedItem] = useState(null);
	const [popupMessage, setPopupMessage] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [searchField, setSearchField] = useState('itemId');
	const [modalMode, setModalMode] = useState('view');
	const [filteredItems, setFilteredItems] = useState([]);
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

	const handleEdit = (item) => {
		setModalMode('edit');
		setSelectedItem(item);
	};

	const handleAddOrEdit = async (data) => {
		try {
			const { itemId, name, stock, category, unitPrice } = data;

			if (!itemId?.trim() || !name?.trim() || !category?.trim()) {
				setPopupMessage('Please fill in all required fields.');
				setTimeout(() => setPopupMessage(''), 3000);
				return;
			}

			const parsedStock = Number(stock);
			const parsedPrice = Number(unitPrice);

			if (isNaN(parsedStock) || parsedStock < 0) {
				setPopupMessage('Stock must be a non-negative number.');
				setTimeout(() => setPopupMessage(''), 3000);
				return;
			}

			if (isNaN(parsedPrice) || parsedPrice < 0) {
				setPopupMessage('Unit price must be a non-negative number.');
				setTimeout(() => setPopupMessage(''), 3000);
				return;
			}

			if (
				modalMode === 'add' &&
				items.some(i => i.itemId.toLowerCase() === itemId.trim().toLowerCase())
			) {
				setPopupMessage('Item ID already exists. Please choose a unique ID.');
				setTimeout(() => setPopupMessage(''), 3000);
				return;
			}

			const expiration = data.expirationDate;
			if (expiration) {
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const expDate = new Date(expiration);
				expDate.setHours(0, 0, 0, 0);

				if (expDate < today) {
					setPopupMessage('Expiration date cannot be in the past.');
					setTimeout(() => setPopupMessage(''), 3000);
					return;
				}
			}

			const payload = {
				...data,
				stock: parsedStock,
				unitPrice: parsedPrice
			};

			if (modalMode === 'add') {
				await fetch(`${API_BASE}/api/inventory`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				});
			} else if (modalMode === 'edit') {
				await fetch(`${API_BASE}/api/inventory/${payload._id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				});
			}

			await fetchItems();
			setPopupMessage('Changes have been saved!');
			setSelectedItem(null);
			setModalMode('view');
		} catch (err) {
			console.error(err);
			setPopupMessage('Save failed.');
		}
	};

	const handleSearch = () => {
		const q = searchQuery.trim().toLowerCase();

		if (!q) {
			setFilteredItems([]);
			return;
		}

		const results = items.filter((item) => {
			const value = (item[searchField] || '').toString().toLowerCase();
			return value.includes(q);
		});

		setFilteredItems(results);

		if (results.length === 0) {
			setPopupMessage('Item was not found. Please check your search again!');
			setTimeout(() => setPopupMessage(''), 3000);
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
					<select
						className="inventory-filter"
						value={searchField}
						onChange={(e) => setSearchField(e.target.value)}
					>
						<option value="itemId">Item ID</option>
						<option value="name">Name</option>
						<option value="category">Category</option>
						<option value="supplier">Supplier</option>
					</select>

					<input
						type="text"
						className="inventory-search"
						placeholder="Search"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
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

					<button
						className="inventory-btn search-btn"
						onClick={handleSearch}
					>
						Search
					</button>

					{filteredItems.length > 0 && (
						<button
							className="inventory-btn close-btn"
							onClick={() => {
								setFilteredItems([]);
								setSearchQuery('');
							}}
						>
							Reset Search
						</button>
					)}
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
							{(filteredItems.length > 0 ? filteredItems : items).length === 0 ? (
								<tr>
									<td colSpan="8">No items found.</td>
								</tr>
							) : (
								(filteredItems.length > 0 ? filteredItems : items).map((item) => (
									<tr key={item._id}>
										<td>{item.itemId}</td>
										<td>{item.name}</td>
										<td>{item.stock}</td>
										<td>{item.category}</td>
										<td>₱{item.unitPrice}</td>
										<td>{item.supplier || '—'}</td>
										<td>
											{item.expirationDate
												? new Date(item.expirationDate).toLocaleDateString()
												: 'N/A'}
										</td>
										<td>
											<button
												className="inventory-btn edit-btn"
												onClick={() => handleEdit(item)}
											>
												Edit
											</button>
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