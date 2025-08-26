import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../scripts/Sidebar";
import ReceiptModal from "../components/ReceiptModal";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "../styles/SalesReport.css";

const SalesReport = () => {
  const COLORS = [
    "#2E8B57",
    "#FF6347",
    "#1E90FF",
    "#FFD700",
    "#8A2BE2",
    "#FF69B4",
  ];

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [analytics, setAnalytics] = useState(null);
  const [records, setRecords] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const authHeader = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;

    const fetchSales = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/salesReport/sales`, {
          headers: authHeader,
        });
        if (!res.ok) throw new Error("Failed to fetch sales data");
        const data = await res.json();
        const recordsArray = data.records;
        console.log("Fetched sales:", data);
        setRecords(recordsArray);

        const totalSales = recordsArray.reduce(
          (sum, s) => sum + s.totalAmount,
          0
        );

        const totalProfit = recordsArray.reduce((sum, s) => {
          const totalCost = (s.items || []).reduce((costSum, item) => {
            const purchasePrice = Number(item.purchasePrice) || 0;
            const quantity = Number(item.quantity) || 0;
            return costSum + purchasePrice * quantity;
          }, 0);

          const totalAmount = Number(s.totalAmount) || 0;

          return sum + (totalAmount - totalCost);
        }, 0);
        const totalTransactions = recordsArray.length;

        const bestSelling = {};
        const paymentBreakdown = {};

        recordsArray.forEach((sale) => {
          sale.items.forEach((item) => {
            if (bestSelling[item.name]) bestSelling[item.name] += item.quantity;
            else bestSelling[item.name] = item.quantity;
          });

          if (paymentBreakdown[sale.paymentMethod])
            paymentBreakdown[sale.paymentMethod] += sale.totalAmount;
          else paymentBreakdown[sale.paymentMethod] = sale.totalAmount;
        });

        const bestSellingArray = Object.entries(bestSelling)
          .map(([name, totalSold]) => ({ _id: name, totalSold }))
          .sort((a, b) => b.totalSold - a.totalSold)
          .slice(0, 5);

        const paymentArray = Object.entries(paymentBreakdown).map(
          ([method, total]) => ({
            _id: method,
            total,
          })
        );

        setAnalytics({
          totalSales,
          totalProfit,
          totalTransactions,
          bestSelling: bestSellingArray,
          paymentBreakdown: paymentArray,
        });

        // Graph Data setters
        // Line Graph
        const aggregatedLineData = recordsArray
          .map((s) => ({
            date: new Date(s.createdAt).toLocaleDateString("en-PH", {
              timeZone: "Asia/Manila",
            }),
            total: s.totalAmount,
          }))
          .reduce((acc, curr) => {
            const existing = acc.find((d) => d.date === curr.date);
            if (existing) existing.total += curr.total;
            else acc.push(curr);
            return acc;
          }, [])
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setLineData(aggregatedLineData);

        // Bar and Pie Graph
        const categoryTotals = {};

        recordsArray.forEach((sale) => {
          sale.items.forEach((item) => {
            const name = item.name || "Uncategorized";
            categoryTotals[name] =
              (categoryTotals[name] || 0) + item.price * item.quantity;
          });
        });

        const barPieData = Object.entries(categoryTotals).map(
          ([name, total]) => ({
            name,
            total,
          })
        );

        setBarData(barPieData);
        setPieData(barPieData);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSales();
  }, [API_BASE, token, authHeader]);

  const openReceipt = (sale) => {
    setSelectedSale(sale);
  };

  const closeReceipt = () => {
    setSelectedSale(null);
  };

  return (
    <>
      {selectedSale && (
        <ReceiptModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}

      <Sidebar />

      <main className="sales-report-main">
        <h1 className="sales-report-title">Sales Report</h1>

        <section className="sales-report-analytics">
          <div className="sales-card highlight">
            <h3>Total Sales</h3>
            <p>₱{analytics?.totalSales}</p>
          </div>
          <div className="sales-card">
            <h3>Total Profit</h3>
            <p
              style={{
                color: analytics?.totalProfit < 0 ? "red" : "inherit",
                fontWeight: analytics?.totalProfit < 0 ? "bold" : "normal",
              }}
            >
              ₱{analytics?.totalProfit}
            </p>
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
                  <tr
                    key={r.saleId}
                    onClick={() => openReceipt(r)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{r.saleId}</td>
                    <td>{r.customerName}</td>
                    <td>{r.orderType}</td>
                    <td>₱{r.totalAmount}</td>
                    <td>{r.paymentMethod}</td>
                    <td>
                      {new Date(r.createdAt).toLocaleDateString("en-PH", {
                        timeZone: "Asia/Manila",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Line Chart */}
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
                name="Total Sale"
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
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="total"
                name="Total Sale Made"
                fill="#27ae60"
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="sales-chart-container">
          <h2 className="sales-chart-title">Sales Distribution by Category</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₱${value}`} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </main>
    </>
  );
};

export default SalesReport;
