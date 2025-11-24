<<<<<<< HEAD
import React from "react";
import { Save, Download, UploadCloud } from "lucide-react"; // Modern Icons
import { authFetch, API_BASE } from "../utils/tokenUtils";
=======
import React, { useState, useRef } from "react";
import DashboardLayout from "../scripts/DashboardLayout";
import ConfirmationModal from "../components/ConfirmationModal";
import { showToast } from "../components/ToastContainer";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import "../styles/BackupRestore.css";
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161

const BackupRestore = () => {
  const modules = [
    { key: "inventory", label: "Inventory" },
<<<<<<< HEAD
    { key: "supplier", label: "Supplier" },
    { key: "sales", label: "Sales" },
    { key: "users", label: "Users" },
=======
    { key: "suppliers", label: "Suppliers" },
    { key: "po", label: "Purchase Order" },
    { key: "sale", label: "Sales" },
    { key: "customers", label: "Customers" },
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
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
<<<<<<< HEAD
      const response = await authFetch(`${API_BASE}/api/backup/${module}`, {
        method: "GET",
      });
=======
      const response = await authFetch(
        `${API_BASE}/api/backup-restore/${module}/backup`,
        {
          method: "GET",
        }
      );
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161

      if (!response.ok) throw new Error("Backup failed.");

      const blob = await response.blob();

<<<<<<< HEAD
      let filename = `${module}_backup.xlsx`;
      const disposition = response.headers.get("Content-Disposition");
=======
      const disposition = response.headers.get("Content-Disposition");
      let filename = `${module}_backup.json`;
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161

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
<<<<<<< HEAD
      alert("Backup failed. Please try again.");
=======
      showToast({
        message: "Backup failed. Please try again.",
        type: "error",
        duration: 3000,
      });
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
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
<<<<<<< HEAD
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Save className="w-8 h-8 text-brand-primary" />
            Backup & Restore
          </h1>
          <p className="text-gray-500 text-sm">
            Download system data or restore from files.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((mod) => (
          <div
            key={mod.key}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow"
          >
            <div className="p-4 bg-rose-50 rounded-full mb-4">
              <Save className="w-8 h-8 text-brand-primary" />
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-6">
              {mod.label} Data
            </h3>

            <div className="w-full space-y-3">
              <button
                onClick={() => handleBackup(mod.key)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors font-medium"
              >
                <Download className="w-4 h-4" /> Backup
              </button>
              <button
                onClick={() => handleRestore(mod.key)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <UploadCloud className="w-4 h-4" /> Restore
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
=======
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
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
  );
};

export default BackupRestore;
