import React, { useState } from "react";
import "../styles/ResetPasswordModal.css"

export default function ResetPasswordModal({
  isOpen,
  onClose,
  onSubmit,
  setPopUpMessage,
  setPopUpType,
}) {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setPopUpMessage("Your new password does not match! Please try again!");
      setPopUpType("error");
      return;
    }
    setPopUpMessage("Your new password was set! You may now log in!");
    setPopUpType("success");
    onSubmit(newPass);
  };

  return (
    <>
      <div className="reset-modal-main">
        <div className="reset-modal-container">
          <h1>Type in your new password!</h1>
          <div className="input-wrapper">
            <form onSubmit={handleSubmit}>
              <input
                id="newPass"
                type="password"
                value={newPass}
                placeholder="New Password"
                onChange={(e) => setNewPass(e.target.value)}
                required
              />
              <input
                id="confirmPass"
                type="password"
                value={confirmPass}
                placeholder="Confirm New Password"
                onChange={(e) => setConfirmPass(e.target.value)}
                required
              />
              <button onClick={handleSubmit}>Submit</button>
              <button onClick={onClose}>Cancel</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};