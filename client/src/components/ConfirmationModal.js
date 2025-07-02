import React from 'react';
import '../styles/ConfirmationModal.css'; // create this file for styling

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="confirmation-overlay">
      <div className="confirmation-modal">
        <p>{message}</p>
        <div className="confirmation-buttons">
          <button className="confirm-btn" onClick={onConfirm}>Yes</button>
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;