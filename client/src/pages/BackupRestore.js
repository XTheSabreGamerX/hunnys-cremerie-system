import React from "react";
import { Save, Download, UploadCloud } from "lucide-react"; // Modern Icons
import { authFetch, API_BASE } from "../utils/tokenUtils";

const BackupRestore = () => {
  const modules = [
    { key: "inventory", label: "Inventory" },
    { key: "supplier", label: "Supplier" },
    { key: "sales", label: "Sales" },
    { key: "users", label: "Users" },
  ];

  const handleBackup = async (module) => {
    try {
      const response = await authFetch(`${API_BASE}/api/backup/${module}`, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Backup failed.");

      const blob = await response.blob();

      let filename = `${module}_backup.xlsx`;
      const disposition = response.headers.get("Content-Disposition");

      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        }
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
      alert("Backup failed. Please try again.");
    }
  };

  const handleRestore = (module) => {
    alert(`Restore feature for ${module} coming soon!`);
  };

  return (
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
  );
};

export default BackupRestore;
