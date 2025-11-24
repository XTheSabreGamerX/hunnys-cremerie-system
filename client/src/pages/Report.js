import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, authFetch } from "../utils/tokenUtils";
import DashboardLayout from "../scripts/DashboardLayout";
import DateRangeFilter from "../components/DateRangeFilter";
import "../styles/Report.css";

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

  const filterMap = {
    All: "all",
    Today: "day",
    "This Week": "week",
    "This Month": "month",
    "This Year": "year",
  };

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const handleDateChange = (label) => {
    setActiveLabel(label); // highlight button

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
      const text = await res.text();
      const data = JSON.parse(text);

      if (!res.ok) throw new Error(data.message || "Failed to fetch report");
      setReportData(data);
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

  return (
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
      </div>
    </DashboardLayout>
  );
};

export default Reports;
