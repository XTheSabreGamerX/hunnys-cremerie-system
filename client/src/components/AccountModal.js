import React, { useState } from "react";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import PopupMessage from "./PopupMessage";
import "../styles/AccountModal.css";

const AccountModal = ({ onClose, onCreated }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const [loading, setLoading] = useState(false);

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("");
    }, 3000);
  };

  const validateEmail = (email) => {
    const re =
      /^[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      showPopup("Please enter a valid email address.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/api/user/create`, {
        method: "POST",
        body: JSON.stringify({ username, email }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!res.ok) throw new Error(data.message || "Failed to create user");

      showPopup("Staff account created successfully!", "success");
      onCreated();
      onClose();
    } catch (err) {
      console.error("Error creating staff:", err);
      showPopup(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PopupMessage
        message={popupMessage}
        type={popupType}
        onClose={() => {
          setPopupMessage("");
          setPopupType("");
        }}
      />

      <div className="account-modal-overlay">
        <div className="account-modal-container">
          <h2 className="account-modal-title">Create Staff Account</h2>
          <form className="account-modal-form" onSubmit={handleSubmit}>
            <label className="account-modal-label">
              Username:
              <input
                className="account-modal-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
            <label className="account-modal-label">
              Email:
              <input
                className="account-modal-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <div className="account-modal-buttons">
              <button
                type="submit"
                className="account-modal-create-btn"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                className="account-modal-cancel-btn"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AccountModal;
