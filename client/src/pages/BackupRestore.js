import React, { useState, useRef } from "react";
import DashboardLayout from "../scripts/DashboardLayout";
import ConfirmationModal from "../components/ConfirmationModal";
import { showToast } from "../components/ToastContainer";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import "../styles/BackupRestore.css";

const BackupRestore = () => {
  const modules = [
    { key: "inventory", label: "Inventory" },
    { key: "suppliers", label: "Suppliers" },
    { key: "po", label: "Purchase Order" },
    { key: "sale", label: "Sales" },
    { key: "customers", label: "Customers" },
  ];

  const backendKeyMap = {
    inventory: "inventoryItems",
    suppliers: "suppliers",
    po: "purchaseOrder",
    sale: "sales",
    customers: "customers",
  };

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const fileInputRef = useRef(null);

  const handleBackup = async (module) => {
    try {
      const response = await authFetch(
        `${API_BASE}/api/backup-restore/${module}/backup`,
        {
          method: "GET",
        }
      );

      if (!response.ok) throw new Error("Backup failed.");

      const blob = await response.blob();

      const disposition = response.headers.get("Content-Disposition");
      let filename = `${module}_backup.json`;

      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = decodeURIComponent(match[1]);
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Backup error:", err);
      showToast({
        message: "Backup failed. Please try again.",
        type: "error",
        duration: 3000,
      });
    }
  };

  const handleRestoreClick = (module) => {
    setSelectedModule(module);
    setShowConfirm(true);
  };

  const cancelRestore = () => {
    setShowConfirm(false);
    setSelectedModule(null);
  };

  const confirmRestore = () => {
    setShowConfirm(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Restores collection after selecting correct file
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file || !selectedModule) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);

        // Get the correct backend key for this module
        const payloadKey = backendKeyMap[selectedModule];
        if (!payloadKey) throw new Error("Invalid module selected");

        // Extract the array to send
        let payloadArray;
        if (jsonData[payloadKey] && Array.isArray(jsonData[payloadKey])) {
          // JSON has the expected array key (like inventoryItems)
          payloadArray = jsonData[payloadKey];
        } else if (Array.isArray(jsonData)) {
          // JSON itself is an array
          payloadArray = jsonData;
        } else {
          throw new Error("Invalid backup file format");
        }

        const response = await authFetch(
          `${API_BASE}/api/backup-restore/${selectedModule}/restore`,
          {
            method: "POST",
            body: JSON.stringify({ [payloadKey]: payloadArray }),
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) throw new Error("Restore failed");
        showToast({
          message: `${selectedModule} restored successfully!`,
          type: "success",
          duration: 3000,
        });
      } catch (err) {
        console.error("Restore error:", err);
        showToast({
          message: `Restore failed. Please try again.`,
          type: "error",
          duration: 3000,
        });
      } finally {
        setSelectedModule(null);
        event.target.value = null;
      }
    };

    reader.readAsText(file);
  };

  return (
    <>
      <DashboardLayout>
        <div className="backup-restore-main">
          <h2 className="backup-restore-title">Backup & Restore</h2>

          <div className="backup-restore-container">
            <div className="backup-restore-grid">
              {modules.map((mod) => (
                <div key={mod.key} className="backup-restore-card">
                  <h3 className="backup-restore-card-title">{mod.label}</h3>
                  <div className="backup-restore-card-actions">
                    <button
                      className="backup-restore-btn backup-restore-backup-btn"
                      onClick={() => handleBackup(mod.key)}
                    >
                      Backup
                    </button>
                    <button
                      className="backup-restore-btn backup-restore-restore-btn"
                      onClick={() => handleRestoreClick(mod.key)}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showConfirm && (
            <ConfirmationModal
              message={
                <>
                  Are you sure you want to restore {selectedModule}?<br />
                  This will overwrite existing data.
                  <br />
                  Please select the correct backup file for this module.
                </>
              }
              onConfirm={confirmRestore}
              onCancel={cancelRestore}
            />
          )}

          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
        </div>
      </DashboardLayout>
    </>
  );
};

export default BackupRestore;
