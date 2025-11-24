import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Plus,
  Edit,
  Trash2,
  Layers,
  Ruler,
} from "lucide-react"; // Icons
import { authFetch, API_BASE } from "../utils/tokenUtils";
import EditModal from "../components/EditModal";
import ConfirmationModal from "../components/ConfirmationModal";
import { showToast } from "../components/ToastContainer";

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
          label: "Category Name",
          type: "text",
          required: true,
          placeholder: "e.g. Bread",
        },
        {
          name: "type",
          label: "Type",
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
        label: section === "size" ? "Size Name" : "Name",
        type: "text",
        required: true,
        placeholder: "e.g. 8-inch",
      },
    ];
  };

  useEffect(() => {
    const fetchData = async (url, setter) => {
      try {
        const res = await authFetch(url);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setter(data);
      } catch (err) {
        console.error(err.message);
      }
    };
    fetchData(`${API_BASE}/api/settings/size`, setCakeSizes);
    fetchData(`${API_BASE}/api/settings/category`, setCategories);
  }, []);

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
    if (!activeSection) return;

    const isEditing = !!editItem;
    const url = isEditing
      ? `${API_BASE}/api/settings/${activeSection}/${editItem._id}`
      : `${API_BASE}/api/settings/${activeSection}`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingData),
      });

      if (!res.ok) throw new Error("Save failed");
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

      showToast({ message: "Saved successfully!", type: "success" });
      setShowAddModal(false);
      setEditItem(null);
    } catch (err) {
      showToast({ message: err.message, type: "error" });
    }
  };

  const handleDelete = (sectionKey, id) => {
    setConfirmMessage("Delete this setting?");
    setPendingDelete({ sectionKey, id });
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { sectionKey, id } = pendingDelete;

    try {
      await authFetch(`${API_BASE}/api/settings/${sectionKey}/${id}`, {
        method: "DELETE",
      });

      if (sectionKey === "size")
        setCakeSizes((prev) => prev.filter((s) => s._id !== id));
      else if (sectionKey === "category")
        setCategories((prev) => prev.filter((c) => c._id !== id));

      showToast({ message: "Deleted successfully!", type: "success" });
    } catch (err) {
      showToast({ message: "Delete failed", type: "error" });
    } finally {
      setShowConfirm(false);
      setPendingDelete(null);
    }
  };

  const renderTable = (title, icon, key, data, addLabel) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          {icon} {title}
        </h3>
        <button
          onClick={() => handleAdd(key)}
          className="flex items-center gap-1 text-xs bg-brand-primary text-white px-3 py-1.5 rounded-lg hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-3 h-3" /> {addLabel}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[400px]">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 sticky top-0">
            <tr>
              <th className="px-6 py-3">Name</th>
              {key === "category" && <th className="px-6 py-3">Type</th>}
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-800">
                  {item.name}
                </td>
                {key === "category" && (
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.type === "cake"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                )}
                <td className="px-6 py-3 text-right flex justify-end gap-2">
                  <button
                    onClick={() => handleEdit(key, item)}
                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(key, item._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-8 text-gray-400">
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {showAddModal && (
        <EditModal
          item={editItem || {}}
          fields={settingsFields(activeSection)}
          onSave={handleSaveSetting}
          onClose={() => setShowAddModal(false)}
          mode={editItem ? "edit" : "add"}
          modalType={activeSection === "size" ? "Size" : "Category"}
        />
      )}

      {showConfirm && (
        <ConfirmationModal
          message={confirmMessage}
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="w-8 h-8 text-brand-primary" />
          System Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTable(
          "Cake Sizes",
          <Ruler className="w-5 h-5 text-gray-500" />,
          "size",
          cakeSizes,
          "Add Size"
        )}
        {renderTable(
          "Categories",
          <Layers className="w-5 h-5 text-gray-500" />,
          "category",
          categories,
          "Add Category"
        )}
      </div>
    </div>
  );
};

export default Settings;
