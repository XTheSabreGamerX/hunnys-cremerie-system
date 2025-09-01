import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './scripts/App';
import { ToastProvider } from "./components/ToastContainer";

const root = ReactDOM.createRoot(document.getElementById('root'));
//root.render(<App />);

root.render(
    <ToastProvider>
        <App />
    </ToastProvider>
);