import React from 'react';
import Sidebar from '../scripts/Sidebar';
import '../styles/Dashboard.css';

const Dashboard = () => {
  return (
    <>
      <Sidebar />
      <main className="dashboard-main-content">
        <h1>Dashboard</h1>
        <p>Welcome back, admin!</p>
        {/* Add dashboard modules or cards here */}
      </main>
    </>
  );
};

export default Dashboard;