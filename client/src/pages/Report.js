import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Printer,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Truck,
} from "lucide-react";
import { API_BASE, authFetch } from "../utils/tokenUtils";
import DateRangeFilter from "../components/DateRangeFilter";

const Reports = () => {
  // Removed unused activeLabel state
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const filterMap = {
    All: "all",
    Today: "day",
    "This Week": "week",
    "This Month": "month",
    "This Year": "year",
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const handleDateChange = (label) => {
    // Removed setActiveLabel(label);
    const now = new Date();
    let startDate = null;
    let endDate = new Date();

    const filterKey = filterMap[label] || "all";

    switch (filterKey) {
      case "day":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(now.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = null;
        endDate = null;
    }

    setDateRange({
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
    });
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${API_BASE}/api/report`);
      if (dateRange.startDate && dateRange.endDate) {
        url.searchParams.append("startDate", dateRange.startDate);
        url.searchParams.append("endDate", dateRange.endDate);
      }

      const res = await authFetch(url);
      if (!res.ok) throw new Error("Failed to fetch report");

      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Auto-fetch when date changes
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => {
    if (!reportData) return;
    const content = document.getElementById("printable-report").innerHTML;
    const printWindow = window.open("", "", "width=900,height=700");
    printWindow.document.write(`
      <html>
        <head>
          <title>Business Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f8f8; }
            h1, h2, h3 { margin: 10px 0; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
            .card { border: 1px solid #ddd; padding: 10px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-8 h-8 text-brand-primary" />
            Business Report
          </h1>
          <p className="text-gray-500 text-sm">
            Financial overview and transaction history.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <DateRangeFilter
            options={["All", "Today", "This Week", "This Month", "This Year"]}
            onChange={handleDateChange}
          />
          <button
            onClick={handlePrint}
            disabled={!reportData}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-center py-10 text-gray-500">Generating report...</p>
      )}
      {error && (
        <p className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</p>
      )}

      {reportData && !loading && (
        <div id="printable-report" className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">
                    ₱{(reportData.totals?.totalSales ?? 0).toFixed(2)}
                  </h3>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Expenses (PO)</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">
                    ₱{(reportData.totals?.totalPurchaseCost ?? 0).toFixed(2)}
                  </h3>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Truck className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Refunds</p>
                  <h3 className="text-2xl font-bold text-red-600 mt-1">
                    ₱{(reportData.totals?.totalRefunds ?? 0).toFixed(2)}
                  </h3>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <RotateCcw className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-3 bg-gradient-to-r from-brand-primary to-brand-dark text-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-rose-100 font-medium">
                    Gross Profit
                  </p>
                  <h3 className="text-3xl font-bold mt-1">
                    ₱{(reportData.totals?.grossProfit ?? 0).toFixed(2)}
                  </h3>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Tables Container */}
          <div className="space-y-8">
            {/* Sales Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-800">Sales Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-6 py-3">Invoice #</th>
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-6 py-3">Items</th>
                      <th className="px-6 py-3 text-right">Total</th>
                      <th className="px-6 py-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.sales.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-4 text-gray-400"
                        >
                          No sales found
                        </td>
                      </tr>
                    ) : (
                      reportData.sales.map((s) => (
                        <tr key={s._id}>
                          <td className="px-6 py-3 font-mono text-xs">
                            {s.invoiceNumber}
                          </td>
                          <td className="px-6 py-3">{s.customerName}</td>
                          <td className="px-6 py-3 text-gray-500 truncate max-w-xs">
                            {s.items
                              .map((i) => `${i.name} (x${i.quantity})`)
                              .join(", ")}
                          </td>
                          <td className="px-6 py-3 text-right font-bold">
                            ₱{(s.totalAmount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right text-xs text-gray-500">
                            {new Date(s.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Purchase Orders Table */}
            {reportData.purchaseOrders.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-gray-800">Purchase Orders</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-6 py-3">PO #</th>
                        <th className="px-6 py-3">Supplier</th>
                        <th className="px-6 py-3 text-right">Total Cost</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.purchaseOrders.map((po) => (
                        <tr key={po._id}>
                          <td className="px-6 py-3 font-mono text-xs">
                            {po.poNumber}
                          </td>
                          <td className="px-6 py-3">
                            {po.supplier?.name || "Unknown"}
                          </td>
                          <td className="px-6 py-3 text-right">
                            ₱{(po.totalAmount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs uppercase">
                              {po.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-xs text-gray-500">
                            {new Date(po.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
