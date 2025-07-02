import React from 'react';
import '../styles/PopupMessage.css';

const PopupMessage = ({ message, type }) => {
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