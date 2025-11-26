import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Edit,
  Power,
  RefreshCcw,
  Trash2,
  CheckCircle,
  XCircle,
  ShieldAlert,
} from "lucide-react"; // Icons

import { authFetch, API_BASE } from "../utils/tokenUtils";
import ConfirmationModal from "../components/ConfirmationModal";
import PopupMessage from "../components/PopupMessage";
import { showToast } from "../components/ToastContainer";
import EditUserModal from "../components/EditUserModal";
import AccountModal from "../components/AccountModal";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [actionRequests, setActionRequests] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);

  // UI States
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // --- Auth Check ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
    else if (user.role === "staff") navigate("/dashboard");
  }, [user.role, navigate]);

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("");
    }, 2000);
  };

  // --- Fetch Data ---
  const fetchUsers = useCallback(() => {
    authFetch(`${API_BASE}/api/user`)
      .then((res) => res.json())
      .then(setUsers)
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  const fetchResetRequests = useCallback(() => {
    authFetch(`${API_BASE}/api/resetRequest`)
      .then((res) => res.json())
      .then(setResetRequests)
      .catch((err) => console.error("Error fetching reset requests:", err));
  }, []);

  const fetchActionRequests = useCallback(() => {
    authFetch(`${API_BASE}/api/actionRequest`)
      .then((res) => res.json())
      .then(setActionRequests)
      .catch((err) => console.error("Error fetching action requests:", err));
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchResetRequests();
    fetchActionRequests();
  }, [fetchUsers, fetchResetRequests, fetchActionRequests]);

  // --- Handlers (Keep logic same, just pure UI update) ---

  const handleDeactivate = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/user/deactivate/${id}`, {
        method: "PUT",
      });
      const data = await res.json();
      showToast({ message: data.message, type: "success", duration: 3000 });
      fetchUsers();
    } catch (err) {
      showToast({
        message: "Failed to deactivate user.",
        type: "error",
        duration: 3000,
      });
    }
  };

  const handleReactivate = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/user/reactivate/${id}`, {
        method: "POST",
      });
      const data = await res.json();
      showToast({ message: data.message, type: "success", duration: 3000 });
      fetchUsers();
    } catch (err) {
      showToast({
        message: "Failed to reactivate user.",
        type: "error",
        duration: 3000,
      });
    }
  };

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
      showPopup(data.message || "Account edited successfully!", "success");
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      showPopup("Failed to update user.", "error");
    }
  };

  const handleApproveReset = async (id) => {
    try {
      const res = await authFetch(
        `${API_BASE}/api/resetRequest/${id}/approve`,
        { method: "PUT" }
      );
      if (!res.ok) throw new Error("Failed");
      showPopup("Reset request approved.", "success");
      fetchResetRequests();
    } catch (err) {
      showPopup("Failed to approve request.", "error");
    }
  };

  const handleRejectReset = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/resetRequest/${id}/reject`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed");
      showPopup("Reset request rejected.", "success");
      fetchResetRequests();
    } catch (err) {
      showPopup("Failed to reject request.", "error");
    }
  };

  const handleDeleteReset = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/resetRequest/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      showPopup("Request deleted!", "success");
      setResetRequests((prev) => prev.filter((req) => req._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveAction = async (id) => {
    try {
      const res = await authFetch(
        `${API_BASE}/api/actionRequest/approve/${id}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed");
      showToast({ message: "Request approved!", type: "success" });
      setActionRequests((prev) => prev.filter((req) => req._id !== id));
    } catch (err) {
      showToast({ message: "Failed to approve.", type: "error" });
    }
  };

  const handleRejectAction = async (id) => {
    try {
      const res = await authFetch(
        `${API_BASE}/api/actionRequest/reject/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed");
      showToast({ message: "Request rejected!", type: "success" });
      setActionRequests((prev) => prev.filter((req) => req._id !== id));
    } catch (err) {
      showToast({ message: "Failed to reject.", type: "error" });
    }
  };

  return (
    <>
      {/* --- Modals --- */}
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

      {showAccountModal && (
        <AccountModal
          onClose={() => setShowAccountModal(false)}
          onCreated={fetchUsers}
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

      {/* --- Main Content --- */}
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-8 h-8 text-brand-primary" />
              User Management
            </h1>
            <p className="text-gray-500 text-sm">
              Manage staff accounts, roles, and security requests.
            </p>
          </div>
          <button
            onClick={() => setShowAccountModal(true)}
            className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors shadow-sm"
          >
            <UserPlus className="w-5 h-5" />
            Create Staff Account
          </button>
        </div>

        {/* --- Section 1: Accounts List --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-gray-800">Staff Accounts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((account) => (
                  <tr
                    key={account._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {account.username}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{account.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {account.role || "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          account.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {account.email !== "admin@hunnys.com" ? (
                        <>
                          {(user.role === "admin" || user.role === "owner") && (
                            <button
                              onClick={() => {
                                setEditingUser(account);
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const action =
                                account.status === "deactivated"
                                  ? "reactivate"
                                  : "deactivate";
                              setConfirmMessage(
                                `Are you sure you want to ${action} this account?`
                              );
                              setOnConfirmAction(() => async () => {
                                if (account.status === "deactivated")
                                  await handleReactivate(account._id);
                                else await handleDeactivate(account._id);
                              });
                              setShowConfirm(true);
                            }}
                            className={`p-1.5 rounded-md transition-colors ${
                              account.status === "deactivated"
                                ? "text-green-500 hover:bg-green-50"
                                : "text-red-500 hover:bg-red-50"
                            }`}
                            title={
                              account.status === "deactivated"
                                ? "Reactivate"
                                : "Deactivate"
                            }
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 italic text-xs">
                          System
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Section 2: Password Resets --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-800">Password Reset Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Date Requested</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resetRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      No pending password reset requests.
                    </td>
                  </tr>
                ) : (
                  resetRequests.map((req) => (
                    <tr key={req._id}>
                      <td className="px-6 py-4 font-medium">{req.email}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(req.createdAt).toLocaleString("en-PH", {
                          timeZone: "Asia/Manila",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            req.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setConfirmMessage("Approve password reset?");
                                setOnConfirmAction(
                                  () => () => handleApproveReset(req._id)
                                );
                                setShowConfirm(true);
                              }}
                              className="text-green-600 hover:text-green-800 font-medium text-xs px-3 py-1 bg-green-50 rounded-md hover:bg-green-100"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setConfirmMessage("Reject password reset?");
                                setOnConfirmAction(
                                  () => () => handleRejectReset(req._id)
                                );
                                setShowConfirm(true);
                              }}
                              className="text-red-600 hover:text-red-800 font-medium text-xs px-3 py-1 bg-red-50 rounded-md hover:bg-red-100"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setConfirmMessage("Delete this record?");
                              setOnConfirmAction(
                                () => () => handleDeleteReset(req._id)
                              );
                              setShowConfirm(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Section 3: Action Requests --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-800">
              Sensitive Action Requests
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Module</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3">Requested By</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {actionRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      No pending action requests.
                    </td>
                  </tr>
                ) : (
                  actionRequests.map((req) => (
                    <tr key={req._id}>
                      <td className="px-6 py-4 font-medium">{req.module}</td>
                      <td className="px-6 py-4">{req.requestType}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-xs">
                        {req.details ? (
                          <pre className="whitespace-pre-wrap font-sans">
                            {JSON.stringify(req.details, null, 2).replace(
                              /[{"}]/g,
                              ""
                            )}
                          </pre>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-800 font-medium">
                        {req.requestedBy?.username || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            req.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setConfirmMessage(
                                  "Approve this sensitive action?"
                                );
                                setOnConfirmAction(
                                  () => () => handleApproveAction(req._id)
                                );
                                setShowConfirm(true);
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setConfirmMessage(
                                  "Reject this sensitive action?"
                                );
                                setOnConfirmAction(
                                  () => () => handleRejectAction(req._id)
                                );
                                setShowConfirm(true);
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserManagement;
