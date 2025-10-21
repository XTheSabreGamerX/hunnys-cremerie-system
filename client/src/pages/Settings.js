import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import DashboardLayout from "../scripts/DashboardLayout";
import EditModal from "../components/EditModal";
import ConfirmationModal from "../components/ConfirmationModal";
import { showToast } from "../components/ToastContainer";
import { FiTrash2 } from "react-icons/fi";
import "../styles/Settings.css";

const Settings = () => {
  const [cakeSizes, setCakeSizes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const settingsFields = (section) => {
    if (section === "category") {
      return [
        {
          name: "name",
          label: "Category",
          type: "text",
          required: true,
          placeholder: "Enter category (e.g., Bread, Cake)",
        },
        {
          name: "type",
          label: "Category Type",
          type: "select",
          required: true,
          options: [
            { value: "inventory", label: "Inventory" },
            { value: "cake", label: "Cake" },
          ],
        },
      ];
    }

    return [
      {
        name: "name",
        label: section === "size" ? "Cake Size" : "Category",
        type: "text",
        required: true,
        placeholder:
          section === "size"
            ? "Enter cake size (e.g., 8-inch)"
            : "Enter category (e.g., Bread, Cake)",
      },
    ];
  };

  useEffect(() => {
    fetchData(`${API_BASE}/api/settings/size`, setCakeSizes);
    fetchData(`${API_BASE}/api/settings/category`, setCategories);
  }, []);

  const fetchData = async (url, setter) => {
    try {
      const res = await authFetch(url);
      if (!res.ok) throw new Error("Failed to fetch " + url);
      const data = await res.json();
      setter(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleAdd = async (sectionKey) => {
    setActiveSection(sectionKey);
    setEditItem(null);
    setShowAddModal(true);
  };

  const handleEdit = (sectionKey, item) => {
    setActiveSection(sectionKey);
    setEditItem(item);
    setShowAddModal(true);
  };

  const handleSaveSetting = async (settingData) => {
    if (!activeSection) {
      showToast({ message: "No active section selected!", type: "error" });
      return;
    }

    const isEditing = !!editItem;
    const url = isEditing
      ? `${API_BASE}/api/settings/${activeSection}/${editItem._id}`
      : `${API_BASE}/api/settings/${activeSection}`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save ${activeSection}`);
      }

      const saved = await res.json();

      if (activeSection === "size") {
        setCakeSizes((prev) =>
          isEditing
            ? prev.map((s) => (s._id === saved._id ? saved : s))
            : [...prev, saved]
        );
      } else if (activeSection === "category") {
        setCategories((prev) =>
          isEditing
            ? prev.map((c) => (c._id === saved._id ? saved : c))
            : [...prev, saved]
        );
      }

      showToast({
        message: isEditing
          ? "Item updated successfully!"
          : "Item added successfully!",
        type: "success",
      });

      setShowAddModal(false);
      setEditItem(null);
    } catch (err) {
      console.error("Save error:", err);
      showToast({ message: err.message, type: "error" });
    }
  };

  const handleDelete = (sectionKey, id) => {
    setConfirmMessage("Are you sure you want to delete this item?");
    setPendingDelete({ sectionKey, id });
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { sectionKey, id } = pendingDelete;

    try {
      const res = await authFetch(
        `${API_BASE}/api/settings/${sectionKey}/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete item");
      }

      if (sectionKey === "size") {
        setCakeSizes((prev) => prev.filter((s) => s._id !== id));
      } else if (sectionKey === "category") {
        setCategories((prev) => prev.filter((c) => c._id !== id));
      }

      showToast({ message: "Item deleted successfully!", type: "success" });
    } catch (err) {
      console.error("Delete error:", err);
      showToast({ message: err.message, type: "error" });
    } finally {
      setShowConfirm(false);
      setPendingDelete(null);
    }
  };

  return (
    <>
      {showAddModal && (
        <EditModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveSetting}
          editItem={editItem}
          fields={settingsFields(activeSection) || []}
          item={editItem}
          mode={editItem ? "edit" : "add"}
        />
      )}

      {showConfirm && (
        <ConfirmationModal
          message={confirmMessage}
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <DashboardLayout>
        <main className="settings-main">
          <header className="settings-header">
            <h1 className="settings-title">Settings</h1>
          </header>

          <div className="settings-sections-container">
            {[
              {
                key: "size",
                title: "Cake Sizes",
                addLabel: "+ Add Cake Size",
                data: cakeSizes,
                setter: setCakeSizes,
                deleteUrl: "/api/settings/size",
              },
              {
                key: "category",
                title: "Categories",
                addLabel: "+ Add Category",
                data: categories,
                setter: setCategories,
                deleteUrl: "/api/settings/category",
              },
            ].map((section) => (
              <section key={section.title} className="settings-section">
                <div className="settings-section-header">
                  <h3 className="settings-section-title">{section.title}</h3>
                  <button
                    className="module-action-btn module-add-btn"
                    onClick={() => handleAdd(section.key)}
                  >
                    {section.addLabel}
                  </button>
                </div>
                <table className="settings-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      {section.key === "category" && <th>Type</th>}
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.data.map((item) => (
                      <tr key={item._id || item.id}>
                        <td>{item.name}</td>

                        {section.key === "category" && <td>{item.type}</td>}

                        <td>
                          {new Date(item.createdAt).toLocaleString("en-PH", {
                            timeZone: "Asia/Manila",
                          })}
                        </td>

                        <td>
                          <button
                            className="module-action-btn module-edit-btn"
                            onClick={() => handleEdit(section.key, item)}
                          >
                            Edit
                          </button>
                          <button
                            className="module-action-btn module-delete-btn"
                            onClick={() => handleDelete(section.key, item._id)}
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        </main>
      </DashboardLayout>
    </>
  );
};

export default Settings;
