import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../scripts/Sidebar';
import '../styles/UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const API_BASE = process.env.REACT_APP_API_URI || 'http://localhost:5000';
    
    useEffect(() => {
    axios.get(`${API_BASE}/api/user`)
      .then(res => {
        setUsers(res.data);
      })
      .catch(err => {
        console.error('Error fetching users:', err);
      });
  }, []);

    return (
        <>
            <Sidebar />
                <main className="user-management-main-content">
                    <div className="requests-container">
                        <h1>Requests here (WIP)</h1>
                    </div>

                    <div className="accounts-container">
                        <h1>List of Available Accounts! (WIP, Buttons not working yet)</h1>
                        <table>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id}>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role || 'User'}</td>
                                        <td>
                                            <button>Deactivate</button>
                                            <button>Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
        </>
  );
};

export default UserManagement;