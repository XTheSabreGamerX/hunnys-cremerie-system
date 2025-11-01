// src/components/AcquisitionReceiptModal.js
import React, { useState } from 'react';
import '../styles/ReceiptModal.css';
import ConfirmationModal from '../components/ConfirmationModal';
import PopupMessage from '../components/PopupMessage';

const AcquisitionReceiptModal = ({ acquisition, onClose, onConfirm, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('success');

  if (!acquisition) return null;

  const showPopup = (message, type = 'success') => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage('');
      setPopupType('success');
    }, 2000);
  };

  const handleAction = (type) => {
    setActionType(type);
    setShowConfirm(true);
  };

  const handleConfirmAction = async () => {
    setLoading(true);
    try {
      if (actionType === 'confirm') {
        await onConfirm?.(acquisition);
        showPopup('Acquisition confirmed successfully!');
      } else if (actionType === 'cancel') {
        await onCancel?.(acquisition);
        showPopup('Acquisition cancelled.');
      }
      setShowConfirm(false);
    } catch (err) {
      console.error('[Acquisition Action Error]', err);
      showPopup('Something went wrong.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = acquisition.items?.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0
  );

  return (
    <>
      {popupMessage && <PopupMessage message={popupMessage} type={popupType} />}

      {showConfirm && (
        <ConfirmationModal
          message={
            actionType === 'confirm'
              ? 'Confirm this acquisition and add items to inventory?'
              : 'Cancel this acquisition request?'
          }
          onConfirm={handleConfirmAction}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="receipt-overlay">
        <div className="receipt-container">
          <div id="receipt-content">
            <h2 className="receipt-center">Hunnys Crémerie Baking Supplies</h2>
            <p className="receipt-center">12 Torres St. Burgos 1860 Rodriguez, Philippines</p>

            <p>
              <strong>Acquisition ID:</strong> {acquisition.acquisitionId}
            </p>
            <p>
              <strong>Supplier:</strong> {acquisition.supplierName || acquisition.supplier}
            </p>
            <p>
              <strong>Date:</strong>{' '}
              {new Date(acquisition.createdAt).toLocaleDateString('en-PH', {
                timeZone: 'Asia/Manila',
              })}
            </p>
            <p>
              <strong>Status:</strong> {acquisition.status}
            </p>
            <hr />
            <h3>Items</h3>

            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Cost</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {acquisition.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>₱{item.unitCost?.toFixed(2)}</td>
                    <td>₱{(item.quantity * item.unitCost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr />
            <p>
              <strong>Total Amount:</strong> ₱{totalAmount.toFixed(2)}
            </p>
          </div>

          <div className="receipt-actions">
            {acquisition.status === 'Pending' && (
              <>
                <button
                  onClick={() => handleAction('confirm')}
                  disabled={loading}
                  className={loading ? 'loading-btn' : ''}
                >
                  {loading && actionType === 'confirm' ? 'Confirming...' : 'Confirm'}
                </button>
                <button
                  onClick={() => handleAction('cancel')}
                  disabled={loading}
                  className={loading ? 'loading-btn' : ''}
                >
                  {loading && actionType === 'cancel' ? 'Cancelling...' : 'Cancel'}
                </button>
              </>
            )}
            <button onClick={onClose} disabled={loading}>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AcquisitionReceiptModal;