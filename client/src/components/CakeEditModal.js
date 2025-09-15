import React from "react";
import AsyncSelect from "react-select/async";
import "../styles/CakeEditModal.css";

const CakeEditModal = ({
  mode,
  cakeFields,
  formData,
  setFormData,
  selectedIngredientOption,
  setSelectedIngredientOption,
  ingredientForm,
  setIngredientForm,
  handleAddIngredient,
  handleSubmit,
  handleChange,
  handleSeasonalChange,
  onClose,
}) => {
  const renderInput = (field) => {
    const { name, type, required, options, placeholder, min } = field;

    // Handle normal text/number/date inputs
    if (type === "text" || type === "number" || type === "date") {
      return (
        <input
          type={type}
          className="cake-input"
          value={formData[name] || ""}
          onChange={(e) => handleChange(name, e.target.value)}
          placeholder={placeholder || ""}
          min={min}
          required={required}
        />
      );
    }

    // Handle select inputs
    if (type === "select") {
      const selectOptions = options || [];
      return (
        <select
          className="cake-input"
          value={formData[name] || ""}
          onChange={(e) => handleChange(name, e.target.value)}
          required={required}
        >
          <option value="">-- Select --</option>
          {selectOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    // Handle multiselect inputs (ingredients)
    if (type === "multiselect") {
      return (
        <>
          <AsyncSelect
            cacheOptions
            loadOptions={field.loadOptions || (() => [])}
            defaultOptions={false}
            value={selectedIngredientOption}
            onChange={setSelectedIngredientOption}
            placeholder="Search ingredient..."
            isClearable
            classNamePrefix="cake-ingredient-select"
            menuPortalTarget={document.body}
            menuPosition="fixed"
            menuPlacement="auto"
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menuList: (base) => ({
                ...base,
                maxHeight: 150,
                overflowY: "auto",
              }),
            }}
          />
          <div className="cake-ingredient-controls">
            <input
              type="number"
              className="cake-input"
              value={ingredientForm.quantity || 1}
              min="1"
              onChange={(e) =>
                setIngredientForm((prev) => ({
                  ...prev,
                  quantity: parseInt(e.target.value) || 1,
                }))
              }
            />
            <button
              type="button"
              className="cake-btn add-ingredient-btn"
              onClick={handleAddIngredient}
            >
              + Add Ingredient
            </button>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="cake-modal-overlay">
      <div className="cake-modal-content">
        <h2>{mode === "add" ? "Add New Cake" : "Edit Cake"}</h2>
        <form onSubmit={handleSubmit} className="cake-form-grid">
          {/* LEFT COLUMN */}
          <div className="cake-form-left">
            {cakeFields.map((field) => (
              <div key={field.name} className="cake-form-group">
                <label>
                  {field.label}{" "}
                  {field.required && (
                    <span className="required-asterisk">*</span>
                  )}
                </label>
                {renderInput(field)}
              </div>
            ))}

            {/* Seasonal Period (conditional) */}
            {formData.availability === "Seasonal" && (
              <div className="cake-form-group">
                <label>Seasonal Period</label>
                <div className="cake-seasonal-period">
                  <input
                    type="date"
                    className="cake-input"
                    value={formData.seasonalPeriod?.startDate || ""}
                    onChange={(e) =>
                      handleSeasonalChange("startDate", e.target.value)
                    }
                  />
                  <input
                    type="date"
                    className="cake-input"
                    value={formData.seasonalPeriod?.endDate || ""}
                    onChange={(e) =>
                      handleSeasonalChange("endDate", e.target.value)
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="cake-form-right">
            <h3>Ingredients</h3>
            <div className="cake-ingredient-list">
              {formData.ingredients?.length === 0 && (
                <p>No ingredients added yet.</p>
              )}
              {formData.ingredients?.map((ing, idx) => (
                <div key={idx} className="cake-ingredient-row">
                  <span>{ing.name}</span>
                  <span>{ing.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Buttons */}
        <div className="cake-modal-buttons">
          <button
            type="submit"
            className="cake-btn save-btn"
            onClick={handleSubmit}
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cake-btn cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CakeEditModal;
