import React, { useEffect } from 'react';
import '../styles/ToastPopup.css';

const ToastMessage = ({ message, type = 'info', duration = 3000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`toast toast-${type}`}>
            {message}
        </div>
    );
}

export default ToastMessage;