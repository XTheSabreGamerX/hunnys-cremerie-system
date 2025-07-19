import React, { useState, useEffect } from 'react';
import '../styles/EditModal.css';

const EditModal = ({ item, fields, onSave, onClose, mode = 'edit' }) => {
  const [editedItem, setEditedItem] = useState({});

  useEffect(() => {
    if (item) {
      setEditedItem(item);
    }
  }, [item]);

  const handleChange = (fieldName, value) => {
    setEditedItem((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedItem);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{mode === 'add' ? 'Add New Item' : 'Edit Item'}</h2>
        <form onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div key={field.name} className="form-group">
            <label>
              {field.label}{' '}
              {field.required && <span style={{ color: 'red' }}>*</span>}
            </label>
            <input
              type={field.type || 'text'}
              value={editedItem[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              min={field.type === 'number' ? 0 : undefined}
              step={field.type === 'number' ? 'any' : undefined}
            />
          </div>
        ))}
          <div className="modal-buttons">
            <button type="submit" className="modal-save">Save</button>
            <button type="button" onClick={onClose} className="modal-cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;