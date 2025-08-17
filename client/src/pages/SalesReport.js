import React, { useEffect, useState } from "react";
import Sidebar from "../scripts/Sidebar";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "../styles/SalesReport.css";

const SalesReport = () => {
  const lineData = [
    { date: "Aug 1", total: 400 },
    { date: "Aug 2", total: 300 },
    { date: "Aug 3", total: 500 },
    { date: "Aug 4", total: 200 },
    { date: "Aug 5", total: 600 },
  ];

  const barData = [
    { category: "Beverages", total: 1200 },
    { category: "Snacks", total: 800 },
    { category: "Dairy", total: 950 },
    { category: "Baking", total: 700 },
    { category: "Frozen", total: 600 },
  ];

  const [analytics, setAnalytics] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    // TODO: Replace with fetch to backend
    setAnalytics({
      totalSales: 25000,
      totalTransactions: 15,
      bestSelling: [
        { _id: "Product A", totalSold: 20 },
        { _id: "Product B", totalSold: 15 },
      ],
      paymentBreakdown: [
        { _id: "Cash", total: 12000 },
        { _id: "Card", total: 13000 },
      ],
    });

    setRecords([
      {
        saleId: "S001",
        customerName: "John Doe",
        orderType: "Walk-in",
        totalAmount: 1200,
        paymentMethod: "Cash",
        createdAt: "2025-08-15",
      },
      {
        saleId: "S002",
        customerName: "Jane Smith",
        orderType: "Online",
        totalAmount: 1800,
        paymentMethod: "Card",
        createdAt: "2025-08-16",
      },
    ]);
  }, []);

  return (
    <>
      <Sidebar />

      <main className="sales-report-main">
        <h1 className="sales-report-title">Sales Report</h1>

        <section className="sales-report-analytics">
          <div className="sales-card highlight">
            <h3>Total Sales</h3>
            <p>₱{analytics?.totalSales}</p>
          </div>
          <div className="sales-card">
            <h3>Total Transactions</h3>
            <p>{analytics?.totalTransactions}</p>
          </div>
          <div className="sales-card">
            <h3>Best-Selling Items</h3>
            <ul>
              {analytics?.bestSelling.map((item) => (
                <li key={item._id}>
                  {item._id} – <span>{item.totalSold}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="sales-card">
            <h3>Payment Breakdown</h3>
            <ul>
              {analytics?.paymentBreakdown.map((p) => (
                <li key={p._id}>
                  {p._id}: <span>₱{p.total}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="sales-report-records">
          <h2>Transaction Records</h2>
          <div className="records-table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Customer</th>
                  <th>Order Type</th>
                  <th>Total Amount</th>
                  <th>Payment Method</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.saleId}>
                    <td>{r.saleId}</td>
                    <td>{r.customerName}</td>
                    <td>{r.orderType}</td>
                    <td>₱{r.totalAmount}</td>
                    <td>{r.paymentMethod}</td>
                    <td>{r.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bar Chart */}
        <div className="sales-chart-container">
          <h2 className="sales-chart-title">Daily Sales Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#2ecc71"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="sales-chart-container">
          <h2 className="sales-chart-title">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#27ae60" barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>
    </>
  );
};

export default SalesReport;