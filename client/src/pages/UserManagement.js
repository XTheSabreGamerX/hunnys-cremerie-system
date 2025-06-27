import React from 'react';
import Sidebar from '../scripts/Sidebar';
import '../styles/UserManagement.css';

const UserManagement = () => {
  return (
    <>
      <Sidebar />
      <main className="user-management-main-content">
        <div className="requests-container">
            <h1>Requests here</h1>
        </div>

        <div className="accounts-container">
            <h1>Accounts here</h1>
        </div>
      </main>
    </>
  );
};

export default UserManagement;