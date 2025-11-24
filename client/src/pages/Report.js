import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Activity } from "lucide-react";
import { API_BASE, authFetch } from "../utils/tokenUtils";
import DateRangeFilter from "../components/DateRangeFilter";

const Reports = () => {
  const [activeLabel, setActiveLabel] = useState("All");
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

<<<<<<< HEAD
=======
  const filterMap = {
    All: "all",
    Today: "day",
    "This Week": "week",
    "This Month": "month",
    "This Year": "year",
  };

  // Redirect if not logged in
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

<<<<<<< HEAD
  const handleDateChange = (option) => {
=======
  const handleDateChange = (label) => {
    setActiveLabel(label); // highlight button

>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
    const now = new Date();
    let startDate = null;
    let endDate = new Date(); // default end is now

    const filterKey = filterMap[label] || "all";

    switch (filterKey) {
      case "day":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        const day = now.getDay(); // Sunday = 0
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
<<<<<<< HEAD
        start = null;
        end = null;
=======
        startDate = null;
        endDate = null;
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
    }

    setDateRange({
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
    });
  };

<<<<<<< HEAD
  const fetchReports = useCallback(async () => {
=======
  const fetchReport = useCallback(async () => {
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${API_BASE}/api/report`);

      if (dateRange.startDate && dateRange.endDate) {
        url.searchParams.append("startDate", dateRange.startDate);
        url.searchParams.append("endDate", dateRange.endDate);
      }

<<<<<<< HEAD
      const transformedData = data.summary.map((module) => {
        const entry = { _id: module._id, total: module.total };
        module.actions.forEach((a) => {
          entry[a.action.toLowerCase().replace(/\s+/g, "_")] = a.count;
        });
        entry.actions = module.actions;
        return entry;
      });
      setSummaryData(transformedData);
=======
      const res = await authFetch(url);
      const text = await res.text();
      const data = JSON.parse(text);

      if (!res.ok) throw new Error(data.message || "Failed to fetch report");
      setReportData(data);
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const handlePrint = () => {
    if (!reportData) return;

    const content = document.querySelector(".report-content").innerHTML;

    const printWindow = window.open("", "", "width=900,height=700");

    printWindow.document.write(`
    <html>
      <head>
        <title>Business Report</title>
        <style>
          /* Optional: minimal styling for print */
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1, h2, h3 { margin: 5px 0; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Helper for badges
  const getActionColor = (action) => {
    const act = action.toLowerCase();
    if (act.includes("create") || act.includes("add"))
      return "bg-green-100 text-green-800";
    if (act.includes("update") || act.includes("edit"))
      return "bg-blue-100 text-blue-800";
    if (act.includes("delete") || act.includes("remove"))
      return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
<<<<<<< HEAD
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-8 h-8 text-brand-primary" />
            Reports Overview
          </h1>
          <p className="text-gray-500 text-sm">
            Summary of system activities and CRUD operations.
          </p>
        </div>
        <DateRangeFilter
          options={["All", "Today", "This Week", "This Month", "This Year"]}
          onChange={handleDateChange}
        />
=======
    <DashboardLayout>
      <div className="reports-new-container">
        <div className="reports-header">
          <h1>Business Report</h1>
          <div className="reports-controls">
            <DateRangeFilter
              options={["All", "Today", "This Week", "This Month", "This Year"]}
              onChange={handleDateChange}
              active={activeLabel}
            />

            <button className="btn-generate" onClick={fetchReport}>
              Generate Report
            </button>
            {reportData && (
              <button className="btn-print" onClick={handlePrint}>
                Print Report
              </button>
            )}
          </div>
        </div>

        {loading && <p className="reports-loading">Loading report...</p>}
        {error && <p className="reports-error">{error}</p>}

        {reportData && !loading && (
          <div className="report-content">
            {/* Totals */}
            <div className="report-summary">
              <div className="summary-card">
                <h3>Total Sales</h3>
                <p>₱{(reportData.totals?.totalSales ?? 0).toFixed(2)}</p>
              </div>
              <div className="summary-card">
                <h3>Total Discounts</h3>
                <p>₱{(reportData.totals?.totalDiscounts ?? 0).toFixed(2)}</p>
              </div>
              <div className="summary-card">
                <h3>Total Tax</h3>
                <p>₱{(reportData.totals?.totalTax ?? 0).toFixed(2)}</p>
              </div>
              <div className="summary-card">
                <h3>Total Refunds</h3>
                <p>₱{(reportData.totals?.totalRefundAmount ?? 0).toFixed(2)}</p>
              </div>
              <div className="summary-card">
                <h3>Total Purchase Cost</h3>
                <p>₱{(reportData.totals?.totalPurchaseCost ?? 0).toFixed(2)}</p>
              </div>
              <div className="summary-card gross-profit">
                <h3>Gross Profit</h3>
                <p>₱{(reportData.totals?.grossProfit ?? 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Tables */}
            <div className="report-tables">
              {/* Sales Table */}
              <h2>Sales Transactions</h2>
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Order Type</th>
                    <th>Items</th>
                    <th>Subtotal</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.sales.map((sale) => (
                    <tr key={sale._id}>
                      <td>{sale.invoiceNumber}</td>
                      <td>{sale.customerName}</td>
                      <td>{sale.orderType}</td>
                      <td>
                        {sale.items
                          .map(
                            (i) => `${i.name ?? "Unknown"} x${i.quantity ?? 0}`
                          )
                          .join(", ")}
                      </td>
                      <td>₱{(sale.subtotal ?? 0).toFixed(2)}</td>
                      <td>₱{(sale.discount ?? 0).toFixed(2)}</td>
                      <td>₱{(sale.taxAmount ?? 0).toFixed(2)}</td>
                      <td>₱{(sale.totalAmount ?? 0).toFixed(2)}</td>
                      <td>
                        {new Date(sale.createdAt).toLocaleDateString()}{" "}
                        {new Date(sale.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Refunds Table */}
              {reportData.refunds?.length > 0 && (
                <>
                  <h2>Refunds</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Refund Amount</th>
                        <th>Items</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.refunds.map((r) => (
                        <tr key={r.invoiceNumber}>
                          <td>{r.invoiceNumber}</td>
                          <td>{r.customerName}</td>
                          <td>₱{(r.totalRefundAmount ?? 0).toFixed(2)}</td>
                          <td>
                            {r.refundedItems
                              ?.map(
                                (i) =>
                                  `${i.name ?? "Unknown"} x${i.quantity ?? 0}`
                              )
                              .join(", ")}
                          </td>
                          <td>
                            {r.refundDate
                              ? `${new Date(
                                  r.refundDate
                                ).toLocaleDateString()} ${new Date(
                                  r.refundDate
                                ).toLocaleTimeString()}`
                              : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Purchase Orders Table */}
              <h2>Purchase Orders</h2>
              <table>
                <thead>
                  <tr>
                    <th>PO #</th>
                    <th>Supplier</th>
                    <th>Items</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.purchaseOrders.map((po) => (
                    <tr key={po._id}>
                      <td>{po.poNumber}</td>
                      <td>{po.supplier?.name ?? "Unknown"}</td>
                      <td>
                        {po.items
                          ?.map(
                            (i) =>
                              `${i.item?.name ?? "Unknown"} x${
                                i.receivedQty ?? 0
                              }`
                          )
                          .join(", ")}
                      </td>
                      <td>₱{(po.totalAmount ?? 0).toFixed(2)}</td>
                      <td>{po.status ?? "Unknown"}</td>
                      <td>
                        {po.createdAt
                          ? `${new Date(
                              po.createdAt
                            ).toLocaleDateString()} ${new Date(
                              po.createdAt
                            ).toLocaleTimeString()}`
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
>>>>>>> 46cb823d91126f61c4d5dd6f141edf288e168161
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {summaryData.map((item, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-gray-800">
                    {item._id}
                  </h3>
                  <span className="bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-lg text-xs font-bold">
                    Total: {item.total}
                  </span>
                </div>

                <div className="space-y-2">
                  {item.actions?.map((a, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm"
                    >
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-medium ${getActionColor(
                          a.action
                        )}`}
                      >
                        {a.action}
                      </span>
                      <span className="font-mono font-semibold text-gray-600">
                        {a.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-brand-primary" />
              <h2 className="text-lg font-bold text-gray-800">
                Activity Breakdown
              </h2>
            </div>

            <div className="h-[400px] w-full">
              {summaryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summaryData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis dataKey="_id" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend />
                    {summaryData[0] &&
                      Object.keys(summaryData[0])
                        .filter(
                          (k) => k !== "_id" && k !== "total" && k !== "actions"
                        )
                        .map((key, idx) => (
                          <Bar
                            key={idx}
                            dataKey={key}
                            stackId="a"
                            fill={
                              ["#10b981", "#3b82f6", "#f43f5e", "#f59e0b"][
                                idx % 4
                              ]
                            }
                            name={key.replace(/_/g, " ")}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No data available for this range.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
