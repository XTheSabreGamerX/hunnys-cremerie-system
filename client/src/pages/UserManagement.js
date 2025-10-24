import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import DashboardLayout from "../scripts/DashboardLayout";
import ConfirmationModal from "../components/ConfirmationModal";
import PopupMessage from "../components/PopupMessage";
import { showToast } from "../components/ToastContainer";
import EditUserModal from "../components/EditUserModal";
import "../styles/UserManagement.css";
import "../styles/App.css";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [actionRequests, setActionRequests] = useState([]);

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [resetRequests, setResetRequests] = useState([]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Redirect if not logged in / unauthorized role
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else if (user.role === "staff") {
      navigate("/dashboard");
    }
  }, [user.role, navigate]);

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("");
    }, 2000);
  };

  // Fetch all users
  const fetchUsers = useCallback(() => {
    authFetch(`${API_BASE}/api/user`)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  // Fetch all registration requests
  const fetchRequests = useCallback(() => {
    authFetch(`${API_BASE}/api/request`)
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error("Error fetching requests:", err));
  }, []);

  // Fetch all password reset requests
  const fetchResetRequests = useCallback(() => {
    authFetch(`${API_BASE}/api/resetRequest`)
      .then((res) => res.json())
      .then((data) => setResetRequests(data))
      .catch((err) => console.error("Error fetching reset requests:", err));
  }, []);

  const fetchActionRequests = useCallback(() => {
    authFetch(`${API_BASE}/api/actionRequest`)
      .then((res) => res.json())
      .then((data) => setActionRequests(data))
      .catch((err) => console.error("Error fetching action requests:", err));
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRequests();
    fetchResetRequests();
    fetchActionRequests();
  }, [fetchUsers, fetchRequests, fetchResetRequests, fetchActionRequests]);

  // Approve registration requests
  const handleApprove = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/request/approve/${id}`, {
        method: "POST",
      });
      const data = await res.json();

      showToast({
        message: data.message || "Request approved.",
        type: "success",
        duration: 3000,
      });
      //showPopup(data.message || "Request approved.", "success");
      fetchRequests();
      fetchUsers();
    } catch (err) {
      console.error("Error approving request:", err);
      showToast({
        message: "There was an error approving the request.",
        type: "error",
        duration: 3000,
      });
      //showPopup("There was an error approving the request.", "error");
    }
  };

  // Reject registration requests
  const handleReject = (id) => {
    authFetch(`${API_BASE}/api/request/reject/${id}`, {
      method: "DELETE",
    })
      .then(() => {
        showToast({
          message: "Request rejected successfully!",
          type: "success",
          duration: 3000,
        });
        setRequests((prev) => prev.filter((req) => req._id !== id));
      })
      .catch((err) => {
        console.error("Failed to reject the request.", err);
        showToast({
          message: "Failed to reject the request.",
          type: "error",
          duration: 3000,
        });
      });
  };

  // Deactivate accounts
  const handleDeactivate = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/user/deactivate/${id}`, {
        method: "PUT",
      });
      const data = await res.json();
      showToast({
        message: data.message,
        type: "success",
        duration: 3000,
      });
      //showPopup(data.message);
      fetchUsers();
    } catch (err) {
      console.error("Error deactivating user:", err);
      showToast({
        message: err.message || "Failed to deactivate user.",
        type: "error",
        duration: 3000,
      });
      //showPopup("Failed to deactivate user.", "error");
    }
  };

  // Reactivate accounts
  const handleReactivate = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/user/reactivate/${id}`, {
        method: "POST",
      });
      const data = await res.json();

      showToast({
        message: data.message,
        type: "success",
        duration: 3000,
      });
      //showPopup(data.message);
      fetchUsers();
    } catch (err) {
      console.error("Error reactivating user:", err);
      showToast({
        message: err.message || "Failed to reactivate the user.",
        type: "success",
        duration: 3000,
      });
      //showPopup("Failed to reactivate the user.", "error");
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  // Save account edit changes
  const handleSaveEdit = async (updatedUser) => {
    try {
      const res = await authFetch(
        `${API_BASE}/api/user/update/${updatedUser._id}`,
        {
          method: "PUT",
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
      const res = await authFetch(
        `${API_BASE}/api/resetRequest/${id}/approve`,
        {
          method: "PUT",
        }
      );

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
      const res = await authFetch(`${API_BASE}/api/resetRequest/${id}/reject`, {
        method: "PUT",
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

  // Deletes password resets
  const handleDeleteReset = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/resetRequest/${id}`, {
        method: "DELETE",
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

  // Approve action request
  const handleApproveAction = async (id) => {
    try {
      const res = await authFetch(
        `${API_BASE}/api/actionRequest/approve/${id}`,
        {
          method: "POST",
        }
      );

      if (!res.ok) throw new Error("Failed to approve request");

      showToast({
        message: "Request approved successfully!",
        type: "success",
        duration: 3000,
      });

      // Remove the approved request from the local state
      setActionRequests((prev) => prev.filter((req) => req._id !== id));
    } catch (err) {
      console.error("Error approving request:", err);
      showToast({
        message: "Failed to approve request.",
        type: "error",
        duration: 3000,
      });
    }
  };

  // Reject action request
  const handleRejectAction = async (id) => {
    try {
      const res = await authFetch(
        `${API_BASE}/api/actionRequest/reject/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to reject request");

      showToast({
        message: "Request rejected successfully!",
        type: "success",
        duration: 3000,
      });

      // Remove the rejected request from the local state
      setActionRequests((prev) => prev.filter((req) => req._id !== id));
    } catch (err) {
      console.error("Error rejecting request:", err);
      showToast({
        message: "Failed to reject request.",
        type: "error",
        duration: 3000,
      });
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
                        {new Date(request.dateRequested).toLocaleString(
                          "en-PH",
                          {
                            timeZone: "Asia/Manila",
                          }
                        )}
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

          <div className="management-container action-requests-container">
            <h1>Action Requests</h1>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Request Type</th>
                    <th>Details</th>
                    <th>Requested By</th>
                    <th>Date Requested</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {actionRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7">No action requests found.</td>
                    </tr>
                  ) : (
                    actionRequests.map((request) => (
                      <tr key={request._id}>
                        <td>{request.module}</td>
                        <td>{request.requestType}</td>
                        <td>
                          {request.details
                            ? Object.entries(request.details).map(
                                ([key, value]) => (
                                  <div key={key}>
                                    <strong>{key}:</strong> {value}
                                  </div>
                                )
                              )
                            : "—"}
                        </td>
                        <td>{request.requestedBy?.username || "—"}</td>
                        <td>
                          {new Date(request.createdAt).toLocaleString("en-PH", {
                            timeZone: "Asia/Manila",
                          })}
                        </td>
                        <td>{request.status}</td>
                        <td>
                          {request.status === "pending" && (
                            <>
                              <button
                                onClick={() => {
                                  setConfirmMessage(
                                    "Are you sure you want to approve this request?"
                                  );
                                  setOnConfirmAction(
                                    () => () => handleApproveAction(request._id)
                                  );
                                  setShowConfirm(true);
                                }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmMessage(
                                    "Are you sure you want to reject this request?"
                                  );
                                  setOnConfirmAction(
                                    () => () => handleRejectAction(request._id)
                                  );
                                  setShowConfirm(true);
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
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
