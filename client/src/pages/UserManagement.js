import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../scripts/Sidebar';
import ConfirmationModal from '../components/ConfirmationModal';
import PopupMessage from '../components/PopupMessage';
import '../styles/UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);

  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');

  const [showConfirm,setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const showPopup = (message, type = 'success') => {
  setPopupMessage(message);
  setPopupType(type);

  setTimeout(() => {
    setPopupMessage('');
    setPopupType('');
  }, 3000);
  };

  const fetchUsers =  useCallback(()=> {
    axios.get(`${API_BASE}/api/user`)
      .then(res => setUsers(res.data))
      .catch(err => console.error('Error fetching users:', err));
  }, [API_BASE]);

  const fetchRequests = useCallback(() => {
    axios.get(`${API_BASE}/api/request`)
      .then(res => setRequests(res.data))
      .catch(err => console.error('Error fetching requests:', err));
  }, [API_BASE]);

  useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, [fetchUsers, fetchRequests]);

  //Accepting registration requests
  const handleApprove = async (id) => {
    try {
      const res = await axios.post(`${API_BASE}/api/request/approve/${id}`);
      showPopup(res.data.message);
      fetchRequests();
      fetchUsers();
    } catch (err) {
      console.error('Error approving request:', err);
      showPopup('There was an error approving the request.', 'error');
    }
  };

  //Rejecting registration requests
  const handleReject = (id) => {
  axios
    .delete(`${API_BASE}/api/request/reject/${id}`)
    .then(() => {
      showPopup('Request rejected successfully!');
      setRequests(requests.filter((req) => req._id !== id));
    })
    .catch((err) => {
      console.error('Error rejecting request:', err);
      showPopup('Failed to reject the request.', 'error');
    });
  };

  //Deactivating accounts
  const handleDeactivate = async (id) => {
  try {
    const res = await axios.put(`${API_BASE}/api/user/deactivate/${id}`);
    showPopup(res.data.message);
    fetchUsers();
  } catch (err) {
    console.error('Error deactivating user:', err);
    showPopup('Failed to deactivate user.', 'error');
  }
  };

//Reactivating accounts
const handleReactivate = async (id) => {
  try {
    const res = await axios.post(`${API_BASE}/api/user/reactivate/${id}`);
    showPopup(res.data.message);
    fetchUsers();
  } catch (err) {
    console.error('Error reactivating user:', err);
    showPopup('Failed to reactivate the user.', 'error');
  }
  };

  return (
    <>     
      {showConfirm && (
      <ConfirmationModal
        message={confirmMessage}
        onConfirm={async () => {
          await onConfirmAction();
          setShowConfirm(false);
        }}
        onCancel={() => setShowConfirm(false)}
      />
      )}

      <PopupMessage message={popupMessage} type={popupType} />

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
                    <button
                      onClick={() => {
                        setConfirmMessage('Are you sure you want to accept this registration?');
                        setOnConfirmAction(() => () => handleApprove(request._id));
                        setShowConfirm(true);
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        setConfirmMessage('Are you sure you want to reject this registration?');
                        setOnConfirmAction(() => () => handleReject(request._id));
                        setShowConfirm(true);
                      }}
                    >
                      Reject
                    </button>
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
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role || 'User'}</td>
                  <td>{user.status}</td>
                  <td>
                    {user.email !== 'admin@hunnys.com' ? ( //Avoids the admin account from being deactivated. Will be changed later to owner's email.
                      <>
                        <button
                          onClick={() => {
                            const action = user.status === 'deactivated' ? 'reactivate' : 'deactivate';
                            setConfirmMessage(`Are you sure you want to ${action} this account?`);
                            setOnConfirmAction(() => async () => {
                              if (user.status === 'deactivated') {
                                await handleReactivate(user._id);
                              } else {
                                await handleDeactivate(user._id);
                              }
                            });
                            setShowConfirm(true);
                          }}
                        >
                          {user.status === 'deactivated' ? 'Reactivate' : 'Deactivate'}
                        </button>
                        <button>Edit</button>
                      </>
                    ) : (
                      <em>System Account</em>
                    )}
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