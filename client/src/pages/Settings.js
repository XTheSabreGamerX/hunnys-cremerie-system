import React, { useState } from "react";
import DashboardLayout from "../scripts/DashboardLayout";
import { FiTrash2 } from "react-icons/fi";
import "../styles/Settings.css";

const Settings = () => {
  const [uoms] = useState([
    { id: 1, name: "Kilogram", createdAt: "2025-09-01" },
    { id: 2, name: "Gram", createdAt: "2025-09-02" },
    { id: 3, name: "Liter", createdAt: "2025-09-05" },
  ]);

  const [cakeSizes] = useState([
    { id: 1, name: "6-inch Round", createdAt: "2025-09-01" },
    { id: 2, name: "8-inch Round", createdAt: "2025-09-03" },
    { id: 3, name: "10-inch Square", createdAt: "2025-09-04" },
  ]);

  const [categories] = useState([
    { id: 1, name: "Flour", createdAt: "2025-09-01" },
    { id: 2, name: "Dairy", createdAt: "2025-09-02" },
    { id: 3, name: "Chocolate", createdAt: "2025-09-03" },
  ]);

  return (
    <DashboardLayout>
      <main className="settings-main">
        <header className="settings-header">
          <h1 className="settings-title">Settings</h1>
        </header>

        <div className="settings-sections-container">
          {[
            {
              title: "Units of Measurement (UoM)",
              addLabel: "+ Add UoM",
              data: uoms,
            },
            {
              title: "Cake Sizes",
              addLabel: "+ Add Cake Size",
              data: cakeSizes,
            },
            {
              title: "Categories",
              addLabel: "+ Add Category",
              data: categories,
            },
          ].map((section) => (
            <section key={section.title} className="settings-section">
              <div className="settings-section-header">
                <h3 className="settings-section-title">{section.title}</h3>
                <button className="module-action-btn module-add-btn">
                  {section.addLabel}
                </button>
              </div>
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {section.data.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.createdAt}</td>
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
  );
};

export default Settings;
