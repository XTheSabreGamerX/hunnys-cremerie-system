import React, { useState, useEffect } from 'react';
import '../styles/InventoryModal.css';
import ConfirmationModal from './ConfirmationModal';

const emptyItem = {
	itemId: '',
	name: '',
	stock: 0,
	category: '',
	unitPrice: 0,
	supplier: '',
	expirationDate: ''
};

const InventoryModal = ({
	item,
	items,
	mode = 'view',
	onSave,
	onDelete,
	onClose,
	setPopupMessage
}) => {
	const [formData, setFormData] = useState(emptyItem);
	const [selectedId, setSelectedId] = useState(item?._id || '');
	const [showConfirm, setShowConfirm] = useState(false);

	useEffect(() => {
		if ((mode === 'view' || mode === 'edit') && item) {
			setFormData(item);
			setSelectedId(item._id);
		}
		if (mode === 'add') {
			setFormData(emptyItem);
			setSelectedId('');
		}
	}, [item, mode]);

	const handleAdd = () => {
		const { itemId, name, stock, category, unitPrice } = formData;
		if (
			!itemId?.trim() ||
			!name?.trim() ||
			stock === '' ||
			!category?.trim() ||
			unitPrice === ''
		) {
			setPopupMessage?.('Please fill in all required fields.');
			return;
		}
		onSave(formData);
		onClose();
	};

	const handleEditSave = () => {
		onSave(formData);
		onClose();
	};

	const handleDelete = () => {
		onDelete(item._id);
		setShowConfirm(false);
	};

	if (mode !== 'add' && !item) return null;

	return (
		<>
			{showConfirm && (
				<ConfirmationModal
					message="Are you sure you want to delete this item?"
					onConfirm={handleDelete}
					onCancel={() => setShowConfirm(false)}
				/>
			)}

			<div className="modal-overlay">
				<div className="modal-content">
					<h2>Item Details</h2>

					{mode === 'view' && (
						<label className="modal-field">
							<strong>Item&nbsp;ID:&nbsp;</strong>
							<select
								value={selectedId}
								onChange={(e) => {
									const id = e.target.value;
									setSelectedId(id);
									if (id === '') {
										setFormData(emptyItem);
										return;
									}
									const newItem = items.find((i) => i._id === id);
									if (newItem) setFormData(newItem);
								}}
							>
								<option value="">— Select Item —</option>
								{items.map((i) => (
									<option key={i._id} value={i._id}>
										{i.itemId}
									</option>
								))}
							</select>
						</label>
					)}

					<ul>
						{mode === 'add' && (
							<label className="modal-field">
								<strong>Item ID*:&nbsp;</strong>
								<input
									type="text"
									value={formData.itemId}
									onChange={(e) =>
										setFormData({ ...formData, itemId: e.target.value })
									}
									placeholder="Enter custom ID (e.g., ITM-001)"
								/>
							</label>
						)}

						<li>
							<strong>Name*:</strong>{' '}
							{mode === 'view' ? (
								formData.name
							) : (
								<input
									type="text"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
								/>
							)}
						</li>

						<li>
							<strong>Stock*:</strong>{' '}
							{mode === 'view' ? (
								formData.stock
							) : (
								<input
									type="number"
									min="0"
									value={formData.stock}
									onChange={(e) =>
										setFormData({
											...formData,
											stock: Number(e.target.value)
										})
									}
								/>
							)}
						</li>

						<li>
							<strong>Category*:</strong>{' '}
							{mode === 'view' ? (
								formData.category
							) : (
								<input
									type="text"
									value={formData.category}
									onChange={(e) =>
										setFormData({ ...formData, category: e.target.value })
									}
								/>
							)}
						</li>

						<li>
							<strong>Unit&nbsp;Price*:</strong>{' '}
							{mode === 'view' ? (
								`₱${formData.unitPrice}`
							) : (
								<input
									type="number"
									min="0"
									value={formData.unitPrice}
									onChange={(e) =>
										setFormData({
											...formData,
											unitPrice: Number(e.target.value)
										})
									}
								/>
							)}
						</li>

						<li>
							<strong>Supplier:</strong>{' '}
							{mode === 'view' ? (
								formData.supplier
							) : (
								<input
									type="text"
									value={formData.supplier}
									onChange={(e) =>
										setFormData({ ...formData, supplier: e.target.value })
									}
								/>
							)}
						</li>

						<li>
							<strong>Expiration&nbsp;Date:</strong>{' '}
							{mode === 'view' ? (
								formData.expirationDate
									? new Date(formData.expirationDate).toLocaleDateString()
									: 'N/A'
							) : (
								<input
									type="date"
									value={formData.expirationDate?.substring(0, 10) || ''}
									onChange={(e) =>
										setFormData({
											...formData,
											expirationDate: e.target.value
										})
									}
								/>
							)}
						</li>
					</ul>

					<div className="modal-actions">
						{mode === 'view' && (
							<>
								<button
									onClick={() => setShowConfirm(true)}
									className="inventory-btn delete-btn"
								>
									Delete
								</button>
								<button onClick={onClose} className="inventory-btn close-btn">
									Close
								</button>
							</>
						)}

						{mode === 'add' && (
							<>
								<button onClick={handleAdd} className="inventory-btn add-btn">
									Save Item
								</button>
								<button onClick={onClose} className="inventory-btn close-btn">
									Cancel
								</button>
							</>
						)}

						{mode === 'edit' && (
							<>
								<button
									onClick={handleEditSave}
									className="inventory-btn edit-btn"
								>
									Save Changes
								</button>
								<button onClick={onClose} className="inventory-btn close-btn">
									Cancel
								</button>
							</>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default InventoryModal;