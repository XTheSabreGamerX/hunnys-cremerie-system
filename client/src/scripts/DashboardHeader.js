import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/DashboardHeader.css';

const DashboardHeader = () => {

    const navigate = useNavigate();

    const logoutFunction = () => {
        localStorage.removeItem('isLoggedIn');
        navigate('/login');
    };

    return (
        <header className="dashboard-header">
        <div className="logo">Hunny's Crémerie Admin</div>
        <nav className="dashboard-nav">
            <a href="#">Home</a>
            <a href="#">Inventory</a>
            <a href="#">Sales</a>
            <button onClick={logoutFunction} className='logout-button'>Logout</button>
        </nav>
        </header>
  );
};

export default DashboardHeader;