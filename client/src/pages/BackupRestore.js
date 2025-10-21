import React from 'react';
import DashboardLayout from '../scripts/DashboardLayout';
import { authFetch, API_BASE } from '../utils/tokenUtils';
import '../styles/BackupRestore.css';

const BackupRestore = () => {
  const modules = [
    { key: 'inventory', label: 'Inventory' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'sales', label: 'Sales' },
    { key: 'users', label: 'Users' },
  ];

  const handleBackup = async (module) => {
    try {
      const response = await authFetch(`${API_BASE}/api/backup/${module}`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Backup failed.');

      const blob = await response.blob();

      let filename = `${module}_backup.xlsx`;
      const disposition = response.headers.get('Content-Disposition');

      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Backup error:', err);
      alert('Backup failed. Please try again.');
    }
  };

  const handleRestore = (module) => {
    alert(`Restore feature for ${module} coming soon!`);
  };

  return (
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
                    onClick={() => handleRestore(mod.key)}
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BackupRestore;