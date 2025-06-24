import React from 'react';
import Sidebar from '../scripts/Sidebar';
import '../styles/Dashboard.css';

const Dashboard = () => {
  return (
    <>
      <Sidebar />
      <div className="dashboard-main-content">
        <h1>Dashboard</h1>
        <p>Welcome back, admin!</p>
        {/* More modules go here */}
      </div>
    </>
  );
};

export default Dashboard;