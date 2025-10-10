import React from "react";
import "../styles/CakeViewModal.css";

const CakeViewModal = ({ cake, categories, onClose }) => {
  if (!cake) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  console.log("CakeViewModal data:", {
    cakeCategory: cake.category,
    categories,
  });

  return (
    <div className="cake-view-overlay">
      <div className="cake-view-content">
        <h2 className="cake-view-title">{cake.name}</h2>

        <div className="cake-view-grid">
          {/* LEFT COLUMN */}
          <div className="cake-view-column">
            <div className="cake-view-field">
              <label>Category:</label>
              <p>
                {Array.isArray(categories?.cake)
                  ? categories.cake.find(
                      (c) => c._id.toString() === cake.category
                    )?.name || `Unknown (${cake.category})`
                  : `Unknown (${cake.category})`}
              </p>
            </div>

            <div className="cake-view-field">
              <label>Size:</label>
              <p>
                {cake.size?.name ? cake.size.name : `(Size ID: ${cake.size})`}
              </p>
            </div>

            <div className="cake-view-field">
              <label>Availability:</label>
              <p>{cake.availability}</p>
            </div>

            {cake.availability === "Seasonal" && (
              <div className="cake-view-field">
                <label>Seasonal Period:</label>
                <p>
                  {formatDate(cake.seasonalPeriod?.startDate)} —{" "}
                  {formatDate(cake.seasonalPeriod?.endDate)}
                </p>
              </div>
            )}

            <div className="cake-view-field">
              <label>Status:</label>
              <p>{cake.status}</p>
            </div>

            <div className="cake-view-field">
              <label>Base Cost:</label>
              <p>₱{cake.baseCost?.toFixed(2) ?? "0.00"}</p>
            </div>

            <div className="cake-view-field">
              <label>Price:</label>
              <p>₱{cake.price?.toFixed(2) ?? "0.00"}</p>
            </div>
          </div>

          {/* RIGHT COLUMN - INGREDIENTS */}
          <div className="cake-view-column">
            <h3 className="cake-view-subtitle">Ingredients</h3>
            {cake.ingredients && cake.ingredients.length > 0 ? (
              <table className="cake-view-ingredient-table">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {cake.ingredients.map((ing, idx) => (
                    <tr key={idx}>
                      <td>
                        {ing.inventoryItem?.name
                          ? ing.inventoryItem.name
                          : `(Item ID: ${ing.inventoryItem})`}
                      </td>
                      <td>{ing.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="cake-view-no-ingredients">No ingredients listed.</p>
            )}
          </div>
        </div>

        <div className="cake-view-footer">
          <button className="cake-view-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CakeViewModal;
