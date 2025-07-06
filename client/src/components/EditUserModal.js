import React, { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import '../styles/EditUserModal.css';

const EditUserModal = ({ user, onClose, onSave }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const roleOptions = ['owner', 'manager', 'staff'];

  const [showConfirm , setShowConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setRole(user.role || 'staff');
    }
  }, [user]);

  const handleSave = () => {
    onSave({ ...user, username, email, role });
  };

  const handleConfirmSave = () => {
    handleSave();
    setShowConfirm(false);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Account</h2>

        <div className="form-group">
          <label>Username:</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-buttons">
          <button onClick={() => setShowConfirm(true)}>Save</button>
          <button onClick={onClose} className="cancel-btn">Cancel</button>
        </div>

        {showConfirm && (
        <ConfirmationModal
          message="Are you sure you want to change this account's details?"
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      </div>
    </div>
  );
};

export default EditUserModal;