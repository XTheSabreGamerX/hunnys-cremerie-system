import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../scripts/Sidebar';
import '../styles/UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchUsers = () => {
    axios.get(`${API_BASE}/api/user`)
      .then(res => setUsers(res.data))
      .catch(err => console.error('Error fetching users:', err));
  };

  const fetchRequests = () => {
    axios.get(`${API_BASE}/api/request`)
      .then(res => setRequests(res.data))
      .catch(err => console.error('Error fetching requests:', err));
  };

  useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, [API_BASE]);

  const handleApprove = async (id) => {
    try {
      const res = await axios.post(`${API_BASE}/api/request/approve/${id}`);
      alert(res.data.message);
      fetchRequests();
      fetchUsers();
    } catch (err) {
      console.error('Error approving request:', err);
      alert('There was an error approving the request.');
    }
  };

  const handleReject = (id) => {
  axios
    .delete(`${API_BASE}/api/request/reject/${id}`)
    .then(() => {
      alert('Request rejected successfully!');
      setRequests(requests.filter((req) => req._id !== id));
    })
    .catch((err) => {
      console.error('Error rejecting request:', err);
      alert('Failed to reject the request.');
    });
  };

  return (
    <>
      <Sidebar />
      <main className="user-management-main-content">

        <div className="requests-container">
          <h1>Registration Requests</h1>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Date Requested</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request._id}>
                  <td>{request.email}</td>
                  <td>{new Date(request.dateRequested).toLocaleString()}</td>
                  <td>{request.status}</td>
                  <td>
                    <button onClick={() => handleApprove(request._id)}>Accept</button>
                    <button onClick={() => handleReject(request._id)}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="accounts-container">
          <h1>List of Available Accounts!</h1>
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