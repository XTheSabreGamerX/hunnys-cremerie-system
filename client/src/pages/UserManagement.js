import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../scripts/DashboardLayout";
import ConfirmationModal from "../components/ConfirmationModal";
import PopupMessage from "../components/PopupMessage";
import EditUserModal from "../components/EditUserModal";
import "../styles/UserManagement.css";
import "../styles/App.css";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [resetRequests, setResetRequests] = useState([]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
    // Redirect if not logged in / unauthorized role
    useEffect(() => {
      if (!token) {
        navigate("/login");
      } else if(user.role === "staff") {
        navigate("/dashboard")
      }
    }, [token, user.role, navigate]);

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("");
    }, 2000);
  };

  const fetchUsers = useCallback(() => {
    fetch(`${API_BASE}/api/user`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Error fetching users:", err));
  }, [API_BASE, token]);

  const fetchRequests = useCallback(() => {
    fetch(`${API_BASE}/api/request`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error("Error fetching requests:", err));
  }, [API_BASE, token]);

  const fetchResetRequests = useCallback(() => {
    fetch(`${API_BASE}/api/resetRequest`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setResetRequests(data))
      .catch((err) => console.error("Error fetching reset requests:", err));
  }, [API_BASE, token]);

  useEffect(() => {
    fetchUsers();
    fetchRequests();
    fetchResetRequests();
  }, [fetchUsers, fetchRequests, fetchResetRequests]);

  // Approve registration requests
  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/request/approve/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      showPopup(data.message || "Request approved.", "success");
      fetchRequests();
      fetchUsers();
    } catch (err) {
      console.error("Error approving request:", err);
      showPopup("There was an error approving the request.", "error");
    }
  };

  // Reject registration requests
  const handleReject = (id) => {
    fetch(`${API_BASE}/api/request/reject/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        showPopup("Request rejected successfully!");
        setRequests((prev) => prev.filter((req) => req._id !== id));
      })
      .catch((err) => {
        console.error("Error rejecting request:", err);
        showPopup("Failed to reject the request.", "error");
      });
  };

  // Deactivate accounts
  const handleDeactivate = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/user/deactivate/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      showPopup(data.message);
      fetchUsers();
    } catch (err) {
      console.error("Error deactivating user:", err);
      showPopup("Failed to deactivate user.", "error");
    }
  };

  // Reactivate accounts
  const handleReactivate = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/user/reactivate/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      showPopup(data.message);
      fetchUsers();
    } catch (err) {
      console.error("Error reactivating user:", err);
      showPopup("Failed to reactivate the user.", "error");
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  // Save account edit changes
  const handleSaveEdit = async (updatedUser) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/user/update/${updatedUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
          }),
        }
      );
      const data = await res.json();
      showPopup(
        data.message || "Account details has been successfully edited!",
        "success"
      );
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      showPopup("Failed to update user.", "error");
    }
  };

  // Approve password reset
  const handleApproveReset = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/resetRequest/${id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Approve failed: ${res.status} ${text}`);
      }

      showPopup("Reset request approved.", "success");
      fetchResetRequests();
    } catch (err) {
      console.error("Error approving reset request:", err);
      showPopup("Failed to approve reset request.", "error");
    }
  };

  // Reject password reset
  const handleRejectReset = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/resetRequest/${id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Reject failed: ${res.status} ${text}`);
      }

      showPopup("Reset request rejected.", "success");
      fetchResetRequests();
    } catch (err) {
      console.error("Error rejecting reset request:", err);
      showPopup("Failed to reject reset request.", "error");
    }
  };

  const handleDeleteReset = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/resetRequest/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status} ${await res.text()}`);
      }

      showPopup(
        "Password reset request has been successfully deleted!",
        "success"
      );
      setResetRequests((prev) => prev.filter((req) => req._id !== id));
    } catch (err) {
      console.error("Error deleting reset request:", err);
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

      {showEditModal && (
        <EditUserModal
          user={editingUser}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}

      <PopupMessage
        message={popupMessage}
        type={popupType}
        onClose={() => {
          setPopupMessage("");
          setPopupType("");
        }}
      />

      <DashboardLayout>
      <main className="user-management-main-content">
        <div className="management-container requests-container">
          <h1>Registration Requests</h1>
          <div className="table-wrapper">
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
                {requests.map((request) => (
                  <tr key={request._id}>
                    <td>{request.email}</td>
                    <td>
                      {new Date(request.dateRequested).toLocaleString("en-PH", {
                        timeZone: "Asia/Manila",
                      })}
                    </td>
                    <td>{request.status}</td>
                    <td>
                      <button
                        onClick={() => {
                          setConfirmMessage(
                            "Are you sure you want to accept this registration?"
                          );
                          setOnConfirmAction(
                            () => () => handleApprove(request._id)
                          );
                          setShowConfirm(true);
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          setConfirmMessage(
                            "Are you sure you want to reject this registration?"
                          );
                          setOnConfirmAction(
                            () => () => handleReject(request._id)
                          );
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
        </div>

        <div className="management-container accounts-container">
          <h1>List of Accounts</h1>
          <div className="table-wrapper">
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
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.role || "User"}</td>
                    <td>{user.status}</td>
                    <td>
                      {user.email !== "admin@hunnys.com" ? (
                        <>
                          <button
                            onClick={() => {
                              const action =
                                user.status === "deactivated"
                                  ? "reactivate"
                                  : "deactivate";
                              setConfirmMessage(
                                `Are you sure you want to ${action} this account?`
                              );
                              setOnConfirmAction(() => async () => {
                                if (user.status === "deactivated") {
                                  await handleReactivate(user._id);
                                } else {
                                  await handleDeactivate(user._id);
                                }
                              });
                              setShowConfirm(true);
                            }}
                          >
                            {user.status === "deactivated"
                              ? "Reactivate"
                              : "Deactivate"}
                          </button>
                          <button onClick={() => handleEditClick(user)}>
                            Edit
                          </button>
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
        </div>

        <div className="management-container reset-password-container">
          <h1>Password Reset Requests</h1>
          <div className="table-wrapper">
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
                {resetRequests.map((request) => (
                  <tr key={request._id}>
                    <td>{request.email}</td>
                    <td>
                      {new Date(request.createdAt).toLocaleString("en-PH", {
                        timeZone: "Asia/Manila",
                      })}
                    </td>
                    <td>{request.status}</td>
                    <td>
                      {request.status === "pending" ? (
                        <>
                          <button
                            onClick={() => {
                              setConfirmMessage(
                                "Are you sure you want to approve this password reset request?"
                              );
                              setOnConfirmAction(() => async () => {
                                handleApproveReset(request._id);
                              });
                              setShowConfirm(true);
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setConfirmMessage(
                                "Are you sure you want to reject this password reset request?"
                              );
                              setOnConfirmAction(() => async () => {
                                await handleRejectReset(request._id);
                              });
                              setShowConfirm(true);
                            }}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setConfirmMessage(
                              "Are you sure you want to delete this password reset request?"
                            );
                            setOnConfirmAction(() => async () => {
                              await handleDeleteReset(request._id);
                            });
                            setShowConfirm(true);
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      </DashboardLayout>
    </>
  );
};

export default UserManagement;
