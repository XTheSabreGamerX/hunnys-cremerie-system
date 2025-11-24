import React, { useState, useRef } from "react";
import { Save, Download, UploadCloud } from "lucide-react";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import ConfirmationModal from "../components/ConfirmationModal";
import { showToast } from "../components/ToastContainer";

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
        { method: "GET" }
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

      showToast({ message: "Backup started successfully", type: "success" });
    } catch (err) {
      console.error("Backup error:", err);
      showToast({ message: "Backup failed. Please try again.", type: "error" });
    }
  };

  const handleRestoreClick = (module) => {
    setSelectedModule(module);
    setShowConfirm(true);
  };

  const confirmRestore = () => {
    setShowConfirm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file || !selectedModule) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const payloadKey = backendKeyMap[selectedModule];

        if (!payloadKey) throw new Error("Invalid module selected");

        let payloadArray;
        if (jsonData[payloadKey] && Array.isArray(jsonData[payloadKey])) {
          payloadArray = jsonData[payloadKey];
        } else if (Array.isArray(jsonData)) {
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
        });
      } catch (err) {
        console.error("Restore error:", err);
        showToast({
          message: "Restore failed. Invalid file or server error.",
          type: "error",
        });
      } finally {
        setSelectedModule(null);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      {showConfirm && (
        <ConfirmationModal
          message={
            <div className="text-center">
              <p className="font-bold text-lg mb-2">
                Restore {selectedModule}?
              </p>
              <p className="text-sm text-gray-500">
                This will overwrite existing data with the backup file content.
              </p>
            </div>
          }
          onConfirm={confirmRestore}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Save className="w-8 h-8 text-brand-primary" />
            Backup & Restore
          </h1>
          <p className="text-gray-500 text-sm">
            Download system data or restore from JSON backup files.
          </p>
        </div>
      </div>

      {/* Modern Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modules.map((mod) => (
          <div
            key={mod.key}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-all duration-200"
          >
            <div className="p-4 bg-rose-50 rounded-full mb-4">
              <Save className="w-8 h-8 text-brand-primary" />
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-6 capitalize">
              {mod.label}
            </h3>

            <div className="w-full space-y-3 mt-auto">
              <button
                onClick={() => handleBackup(mod.key)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors font-medium shadow-sm"
              >
                <Download className="w-4 h-4" /> Backup
              </button>
              <button
                onClick={() => handleRestoreClick(mod.key)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors font-medium"
              >
                <UploadCloud className="w-4 h-4" /> Restore
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BackupRestore;
