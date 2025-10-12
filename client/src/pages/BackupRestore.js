import React from 'react';
import DashboardLayout from '../scripts/DashboardLayout';
import '../styles/BackupRestore.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BackupRestore = () => {
  const handleBackup = async (module) => {
    try {
      const response = await fetch(`${API_BASE}/api/backup/${module}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Backup failed.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${module}_backup.xlsx`;
      a.click();
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
      <div className='backup-restore-main'>
        <h2 className='backup-restore-title'>Backup & Restore</h2>

        <div className='backup-restore-container'>
          <div className='backup-restore-grid'>
            {/* Inventory Card */}
            <div className='backup-restore-card'>
              <h3 className='backup-restore-card-title'>Inventory</h3>
              <div className='backup-restore-card-actions'>
                <button
                  className='backup-restore-btn backup-restore-backup-btn'
                  onClick={() => handleBackup('inventory')}
                >
                  Backup
                </button>
                <button
                  className='backup-restore-btn backup-restore-restore-btn'
                  onClick={() => handleRestore('inventory')}
                >
                  Restore
                </button>
              </div>
            </div>

            {/* Future Cards (Supplier, Sales, etc.) */}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BackupRestore;