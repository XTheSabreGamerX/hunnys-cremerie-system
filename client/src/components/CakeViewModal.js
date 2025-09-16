import React from 'react';
import '../styles/CakeViewModal.css';

const CakeViewModal = ({ cakeData, cakeFields, onClose }) => {
  if (!cakeData) return null;

  // Render display-only fields
  const renderField = (field) => {
    const { name, label } = field;

    // Special handling for price
    if (name === 'price') {
      return cakeData[name] ? `₱${cakeData[name]}` : 'N/A';
    }

    // Special handling for availability
    if (name === 'availability') {
      return cakeData[name] || 'N/A';
    }

    // Default: just return value or fallback
    return cakeData[name] || 'N/A';
  };

  return (
    <div className="cake-modal-overlay">
      <div className="cake-modal-content">
        <h2>View Cake</h2>

        <div className="cake-form-grid">
          {/* LEFT COLUMN */}
          <div className="cake-form-left">
            {cakeFields.map((field) => (
              <div key={field.name} className="cake-form-group">
                <label>{field.label}:</label>
                <p>{renderField(field)}</p>
              </div>
            ))}

            {/* Seasonal Period (conditional) */}
            {cakeData.availability === 'Seasonal' && (
              <div className="cake-form-group">
                <label>Seasonal Period:</label>
                <p>
                  {cakeData.seasonalPeriod?.startDate || 'N/A'} →{' '}
                  {cakeData.seasonalPeriod?.endDate || 'N/A'}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="cake-form-right">
            <h3>Ingredients</h3>
            <div className="cake-ingredient-list">
              {(!cakeData.ingredients || cakeData.ingredients.length === 0) && (
                <p>No ingredients listed.</p>
              )}
              {cakeData.ingredients?.map((ing, idx) => (
                <div key={idx} className="cake-ingredient-row">
                  <span>{ing.name}</span>
                  <span>{ing.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="cake-modal-buttons">
          <button
            type="button"
            onClick={onClose}
            className="cake-btn cancel-btn"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CakeViewModal;