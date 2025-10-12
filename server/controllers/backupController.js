const ExcelJS = require('exceljs');
const Inventory = require('../models/InventoryItem');
const path = require('path');
const fs = require('fs');

const backupInventory = async (req, res) => {
  try {
    const inventoryData = await Inventory.find().lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    if (inventoryData.length > 0) {
      const headers = Object.keys(inventoryData[0]);
      worksheet.addRow(headers);

      inventoryData.forEach(item => {
        worksheet.addRow(Object.values(item));
      });
    } else {
      worksheet.addRow(['No data found']);
    }

    const backupsDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);
    const filePath = path.join(backupsDir, `inventory_backup_${Date.now()}.xlsx`);

    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, err => {
      if (err) console.error('Download error:', err);
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ message: 'Failed to back up inventory.' });
  }
};

module.exports = { backupInventory };