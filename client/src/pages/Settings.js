import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../scripts/DashboardLayout";
import EditModal from "../components/EditModal";
import { FiTrash2 } from "react-icons/fi";
import "../styles/Settings.css";

const Settings = () => {
  const [uoms, setUoms] = useState([]);
  const [cakeSizes, setCakeSizes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

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
        label:
          section === "uom"
            ? "Unit of Measurement"
            : section === "size"
            ? "Cake Size"
            : "Category",
        type: "text",
        required: true,
        placeholder:
          section === "uom"
            ? "Enter unit (e.g., kg, box)"
            : section === "size"
            ? "Enter cake size (e.g., 8-inch)"
            : "Enter category (e.g., Bread, Cake)",
      },
    ];
  };

  useEffect(() => {
    fetchData(`${API_BASE}/api/settings/uom`, setUoms);
    fetchData(`${API_BASE}/api/settings/size`, setCakeSizes);
    fetchData(`${API_BASE}/api/settings/category`, setCategories);
  }, [API_BASE]);

  const fetchData = async (url, setter) => {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch " + url);
      const data = await res.json();
      setter(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleAdd = async (newSetting) => {
    if (!activeSection) {
      alert("No active section selected");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/settings/${activeSection}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newSetting),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to add to ${activeSection}`);
      }

      const savedSetting = await res.json();

      if (activeSection === "uom") {
        setUoms((prev) => [...prev, savedSetting]);
      } else if (activeSection === "size") {
        setCakeSizes((prev) => [...prev, savedSetting]);
      } else if (activeSection === "category") {
        setCategories((prev) => [...prev, savedSetting]);
      }

      setShowAddModal(false);
    } catch (err) {
      console.error("Add error:", err);
      alert(err.message);
    }
  };

  return (
    <>
      {showAddModal && (
        <EditModal
          mode="add"
          modalType={activeSection}
          fields={settingsFields(activeSection)}
          onSave={handleAdd}
          onClose={() => setShowAddModal(false)}
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
                key: "uom",
                title: "Units of Measurement (UoM)",
                addLabel: "+ Add UoM",
                data: uoms,
                setter: setUoms,
                deleteUrl: "/api/settings/uom",
              },
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
                    onClick={() => {
                      setActiveSection(
                        section.title.includes("UoM")
                          ? "uom"
                          : section.title.includes("Cake Size")
                          ? "size"
                          : "category"
                      );
                      setShowAddModal(true);
                    }}
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
                          <button className="module-action-btn module-edit-btn">
                            Edit
                          </button>
                          <button className="module-action-btn module-delete-btn">
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
