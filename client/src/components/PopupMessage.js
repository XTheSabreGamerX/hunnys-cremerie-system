import React, { useEffect } from 'react';
import '../styles/PopupMessage.css';

const PopupMessage = ({ message, type, onClose }) => {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`popup-overlay ${type}`}>
      <div className={`popup-box ${type}`}>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default PopupMessage;