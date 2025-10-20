const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const Inventory = require('../models/InventoryItem');

const BACKUPS_DIR = path.join(__dirname, '../backups');
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR);

const getFormattedDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now
    .getHours()
    .toString()
    .padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
};

const sendWorkbookAsDownload = async (workbook, filename, res) => {
  const filePath = path.join(BACKUPS_DIR, filename);
  await workbook.xlsx.writeFile(filePath);

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(filename)}"`
  );
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on('close', () => {
    fs.unlink(filePath, (err) => {
      if (err) console.error('Cleanup error:', err);
    });
  });
};

const backupInventory = async (req, res) => {
  try {
    const inventoryData = await Inventory.find().lean();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    if (inventoryData.length > 0) {
      const headers = Object.keys(inventoryData[0]);
      worksheet.addRow(headers);
      inventoryData.forEach((item) => worksheet.addRow(Object.values(item)));
    } else {
      worksheet.addRow(['No data found']);
    }

    const filename = `inventory_backup_${getFormattedDate()}.xlsx`;
    await sendWorkbookAsDownload(workbook, filename, res);
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ message: 'Failed to back up inventory.' });
  }
};

module.exports = { backupInventory };