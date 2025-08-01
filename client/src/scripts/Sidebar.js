import React, { useState } from 'react';
import '../styles/Sidebar.css';
import Logo from '../elements/images/icon32x32.png';
import { Menu } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role ? user.role.toLowerCase() : null;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <img src={Logo} alt="Logo" className="sidebar-logo" />
        <button onClick={toggleSidebar} className="sidebar-toggle">
          <Menu />
        </button>
      </div>

      <div className="sidebar-scroll">
        <nav className="sidebar-nav">
            <Link to="/dashboard"><span className="label">Dashboard</span></Link>

              {(role === 'admin' || role === 'manager') && (
                <Link to="/user-management"><span className="label">User Management</span></Link>
              )}

              {(role === 'admin' || role === 'manager' || role === 'staff') && (
                <>
                  <Link to="/inventory"><span className="label">Inventory</span></Link>
                  <Link to="/sales-management"><span className="label">Sales Management</span></Link>
                  <Link to="/dashboard"><span className="label">Sales Report</span></Link>
                  <Link to="/dashboard"><span className="label">Profitability Dashboard</span></Link>
                  <Link to="/supplier-management"><span className="label">Supplier Management</span></Link>
                  <Link to="/customer-management"><span className="label">Customer Management</span></Link>
                </>
              )}

              {role === 'admin' && (
                <>
                  <Link to="/dashboard"><span className="label">Activity Log</span></Link>
                  <Link to="/dashboard"><span className="label">Pricing Management</span></Link>
                  <Link to="/dashboard"><span className="label">Backup and Restore</span></Link>
                  <Link to="/dashboard"><span className="label">Notifications</span></Link>
                </>
              )}

              {role === 'manager' && (
                <>
                  <Link to="/dashboard"><span className="label">Pricing Management</span></Link>
                  <Link to="/dashboard"><span className="label">Backup and Restore</span></Link>
                  <Link to="/dashboard"><span className="label">Notifications</span></Link>
                </>
              )}

              {role === 'staff' && (
                <>
                  <Link to="/dashboard"><span className="label">Backup and Restore</span></Link>
                  <Link to="/dashboard"><span className="label">Notifications</span></Link>
                </>
              )}
        </nav>

        {!isCollapsed && (
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;