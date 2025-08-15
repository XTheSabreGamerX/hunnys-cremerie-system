const Inventory = require('../models/InventoryItem.js');
const Sales = require('../models/Sale.js');
const ActivityLog = require('../models/ActivityLog.js');

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getDashboardStats = async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const todayStr = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Manila'
    });

    const [
      totalInventoryCount,
      lowStockCount,
      outOfStockCount,
      salesToday,
      activityLogsToday
    ] = await Promise.all([
      Inventory.countDocuments(),

      Inventory.countDocuments({ stock: { $lt: 5 } }),

      Inventory.countDocuments({ stock: { $lte: 0 } }),

      Sales.aggregate([
        {
          $match: {
            $expr: {
              $eq: [
                {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$createdAt',
                    timezone: 'Asia/Manila'
                  }
                },
                todayStr
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 }
          }
        }
      ]).then((result) => result[0]?.total || 0),

      ActivityLog.countDocuments({
        $expr: {
          $eq: [
            {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: 'Asia/Manila'
              }
            },
            todayStr
          ]
        }
      })
    ]);

    res.json({
      totalInventoryCount,
      lowStockCount,
      outOfStockCount,
      salesToday,
      activityLogsToday
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getDashboardStats
};