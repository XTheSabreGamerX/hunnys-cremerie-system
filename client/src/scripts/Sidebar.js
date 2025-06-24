import React, { useState } from 'react';
import '../styles/Sidebar.css';
import Logo from '../elements/images/icon32x32.png'
import { Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  }

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <img src={Logo} alt="Logo" className="sidebar-logo" />
        <button onClick={toggleSidebar} className="sidebar-toggle">
          <Menu />
        </button>
      </div>
      <nav className="sidebar-nav">
        <a href="#"><span className="label">Dashboard</span></a>
        <a href="#"><span className="label">User Management</span></a>
        <a href="#"><span className="label">Inventory</span></a>
        <a href="#"><span className="label">Sales Management</span></a>
        <a href="#"><span className="label">Sales Report</span></a>
        <a href="#"><span className="label">Profitability Dashboard</span></a>
        <a href="#"><span className="label">Supplier Management</span></a>
        <a href="#"><span className="label">Customer Management</span></a>
        <a href="#"><span className="label">Activity Log</span></a>
        <a href="#"><span className="label">Pricing Management</span></a>
        <a href="#"><span className="label">Backup and Restore</span></a>
        <a href="#"><span className="label">Notifications</span></a>
      </nav>
      {!isCollapsed && (
      <button onClick={logout} className="logout-button">Logout</button>
      )}
    </div>
  );
};

export default Sidebar;