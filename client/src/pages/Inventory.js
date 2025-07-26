import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../scripts/Sidebar';
import EditModal from '../components/EditModal';
import ViewModal from '../components/ViewModal';
import PopupMessage from '../components/PopupMessage';
import ConfirmationModal from '../components/ConfirmationModal';
import '../styles/App.css';
import '../styles/Inventory.css';

const Inventory = () => {
	const [items, setItems] = useState([]);
	const [filteredItems, setFilteredItems] = useState([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchField, setSearchField] = useState('itemId');
	const [selectedItem, setSelectedItem] = useState(null);
	const [modalMode, setModalMode] = useState('view');
	const [pendingEditData, setPendingEditData] = useState(null);
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [isViewOpen, setIsViewOpen] = useState(false);
	const [viewedItem, setViewedItem] = useState(null);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(null);
	const [popupMessage, setPopupMessage] = useState('');
	const [popupType, setPopupType] = useState('success');

	const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

	const inventoryFields = [
		{ label: 'Item ID', name: 'itemId', required: 'true' },
		{ label: 'Item Name', name: 'name', required: 'true' },
		{ label: 'Stock', name: 'stock', type: 'number' },
		{ label: 'Category', name: 'category' },
		{ label: 'Unit Price', name: 'unitPrice', type: 'number' },
		{ label: 'Supplier', name: 'supplier' },
		{ label: 'Expiration Date', name: 'expirationDate', type: 'date' },
	];

	const showPopup = (message, type = 'success') => {
		setPopupMessage(message);
		setPopupType(type);
		setTimeout(() => {
			setPopupMessage('');
			setPopupType('success');
		}, 2000);
	};

	const fetchItems = useCallback(async () => {
		try {
			const res = await fetch(`${API_BASE}/api/inventory`);
			const data = await res.json();
			setItems(data);
		} catch (err) {
			console.error('Error fetching inventory:', err);
		}
	}, [API_BASE]);

	useEffect(() => {
		fetchItems();
	}, [fetchItems]);

	useEffect(() => {
		const query = searchQuery.toLowerCase().trim();

		if (!query) {
			setFilteredItems([]);
			return;
		}

		const filtered = items.filter(item =>
			(item[searchField] || '').toString().toLowerCase().includes(query)
		);

		setFilteredItems(filtered);
	}, [searchQuery, searchField, items]);

	const validateFormData = (data) => {
		const { itemId, name, stock, unitPrice, expirationDate } = data;

		if (!itemId?.trim() || !name?.trim()) {
			showPopup('Please fill up the required fields!', 'error');
			return false;
		}

		data.stock = stock === '' || stock === undefined ? 0 : Number(stock);
		data.unitPrice = unitPrice === '' || unitPrice === undefined ? 0 : Number(unitPrice);

		if (isNaN(data.stock) || data.stock < 0) {
			showPopup('Stock must be a non-negative number.', 'error');
			return false;
		}

		if (isNaN(data.unitPrice) || data.unitPrice < 0) {
			showPopup('Unit price must be a non-negative number.', 'error');
			return false;
		}

		if (expirationDate) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const expDate = new Date(expirationDate);
			expDate.setHours(0, 0, 0, 0);
			if (expDate < today) {
				showPopup('Expiration date cannot be in the past.', 'error');
				return false;
			}
		}

		if (
			modalMode === 'add' &&
			items.some(i => i.itemId.toLowerCase() === itemId.trim().toLowerCase())
		) {
			showPopup('Item ID already exists. Please choose a unique ID.', 'error');
			return false;
		}

		return true;
	};

	const saveItem = async (data) => {
		const payload = {
			...data,
			stock: isNaN(Number(data.stock)) ? 0 : Number(data.stock),
			unitPrice: isNaN(Number(data.unitPrice)) ? 0 : Number(data.unitPrice),
		};

		try {
			const method = modalMode === 'add' ? 'POST' : 'PUT';
			const url = modalMode === 'add'
				? `${API_BASE}/api/inventory`
				: `${API_BASE}/api/inventory/${payload._id}`;

			await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			await fetchItems();
			setSelectedItem(null);
			setModalMode('view');
			showPopup(`Item ${modalMode === 'add' ? 'added' : 'updated'} successfully!`, 'success');
		} catch (err) {
			console.error(err);
			showPopup('Save failed.', 'error');
		}
	};

	const handleAddOrEdit = async (data) => {
		if (!validateFormData(data)) return;

		if (modalMode === 'edit') {
			setPendingEditData(data);
			setShowConfirmation(true);
		} else {
			await saveItem(data);
		}
	};

	const handleConfirmEdit = async () => {
		if (pendingEditData) {
			await saveItem(pendingEditData);
		}
		setPendingEditData(null);
		setShowConfirmation(false);
	};

	const handleDelete = (itemId) => {
		const item = items.find(i => i._id === itemId);
		setItemToDelete(item);
		setIsConfirmOpen(true);
	};

	const confirmDelete = async () => {
		try {
			const res = await fetch(`${API_BASE}/api/inventory/${itemToDelete._id}`, {
				method: 'DELETE',
			});
			if (!res.ok) throw new Error('Delete failed');

			setItems(prev => prev.filter(item => item._id !== itemToDelete._id));
			showPopup('Item deleted successfully!', 'success');
		} catch (error) {
			console.error('Failed to delete item:', error);
			showPopup('Failed to delete item.', 'error');
		} finally {
			setIsConfirmOpen(false);
			setIsViewOpen(false);
			setItemToDelete(null);
		}
	};

	const isFiltering = searchQuery.trim() !== '';

	return (
	<>
		{popupMessage && (
			<PopupMessage
				message={popupMessage}
				type={popupType}
				onClose={() => setPopupMessage('')}
			/>
		)}

		{isViewOpen && viewedItem && (
			<ViewModal
				item={viewedItem}
				fields={[
					{ name: 'name', label: 'Item Name' },
					{ name: 'category', label: 'Category' },
					{ name: 'stock', label: 'Stock' },
					{ name: 'unitPrice', label: 'Price' },
					{ name: 'supplier', label: 'Supplier' },
					{
						name: 'expirationDate',
						label: 'Expiration Date',
						formatter: (val) => new Date(val).toLocaleDateString(),
					},
				]}
				onClose={() => {
					setIsViewOpen(false);
					setViewedItem(null);
				}}
				onDelete={() => handleDelete(viewedItem._id)}
			/>
		)}

		{isConfirmOpen && (
			<ConfirmationModal
				message={`Are you sure you want to delete "${itemToDelete?.name || 'this item'}"?`}
				onConfirm={confirmDelete}
				onCancel={() => {
					setIsConfirmOpen(false);
					setItemToDelete(null);
				}}
			/>
		)}

		{(modalMode === 'edit' || modalMode === 'add') && (
			<EditModal
				item={modalMode === 'edit' ? selectedItem : {}}
				fields={inventoryFields}
				onSave={handleAddOrEdit}
				onClose={() => {
					setSelectedItem(null);
					setModalMode('view');
				}}
				mode={modalMode}
			/>
		)}

		{showConfirmation && (
			<ConfirmationModal
				message="Are you sure you want to save these changes?"
				onConfirm={handleConfirmEdit}
				onCancel={() => {
					setPendingEditData(null);
					setShowConfirmation(false);
				}}
			/>
		)}

		<Sidebar />

		<main className="module-main-content inventory-main">
			<h1>Inventory</h1>

			<div className="module-actions-container">
					<select
					className="module-filter-dropdown"
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
						className="module-search-input"
						placeholder="Search"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>

				<button
					className="module-action-btn module-add-btn"
					onClick={() => {
					setModalMode('add');
					setSelectedItem(null);
					}}
				>
					Add Item
				</button>
			</div>

			<div className="module-table-container">
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
						{(isFiltering ? filteredItems : items).length === 0 ? (
							<tr><td colSpan="8">No items found.</td></tr>
						) : (
							(isFiltering ? filteredItems : items).map(item => (
								<tr key={item._id}>
									<td>{item.itemId}</td>
									<td>{item.name}</td>
									<td>{item.stock}</td>
									<td>{item.category || '—'}</td>
									<td>₱{item.unitPrice}</td>
									<td>{item.supplier || '—'}</td>
									<td>{item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : 'N/A'}</td>
									<td>
										<button
											className="module-action-btn module-edit-btn"
											onClick={() => {
												setSelectedItem(item);
												setModalMode('edit');
											}}
										>
											Edit
										</button>

										<button
											className="module-action-btn module-view-btn"
											onClick={() => {
												setViewedItem(item);
												setIsViewOpen(true);
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