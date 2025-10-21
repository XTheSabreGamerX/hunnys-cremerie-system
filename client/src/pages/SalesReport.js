import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../scripts/DashboardLayout";
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
import { authFetch, API_BASE } from "../utils/tokenUtils";
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
  const PAGE_SIZE = 6;

  const [records, setRecords] = useState([]);
  const [fullSales, setFullSales] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [analytics, setAnalytics] = useState(null);
  const [lineData, setLineData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);

  const [selectedSale, setSelectedSale] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else if (user.role === "staff") {
      navigate("/dashboard");
    }
  }, [user.role, navigate]);

  // Fetch all sales for analytics and charts
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchAllSales = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/sales/all`, {
          signal,
        });
        if (!res.ok) throw new Error("Failed to fetch all sales");
        const data = await res.json();
        setFullSales(data.sales || data);
      } catch (err) {
        if (err.name !== "AbortError")
          console.error("Failed to fetch all sales:", err);
      }
    };

    fetchAllSales();
    return () => controller.abort();
  }, []);

  // Paginated fetch
  useEffect(() => {
    if (page < 1) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchPage = async (pageNumber) => {
      setIsLoading(true);
      try {
        const res = await authFetch(
          `${API_BASE}/api/salesReport/sales?page=${pageNumber}&limit=${PAGE_SIZE}`,
          { signal }
        );
        if (!res.ok) throw new Error("Failed to fetch sales data");

        const data = await res.json();
        const pageRecords = Array.isArray(data.records) ? data.records : [];

        setRecords((prev) =>
          pageNumber === 1 ? pageRecords : [...prev, ...pageRecords]
        );
        setHasMore(pageRecords.length === PAGE_SIZE);
      } catch (err) {
        if (err.name !== "AbortError") console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage(page);
    return () => controller.abort();
  }, [page]);

  // Infinite scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeoutId = null;

    const handleScroll = () => {
      if (timeoutId) return;

      timeoutId = setTimeout(() => {
        if (!hasMore || isLoading) return;
        if (
          container.scrollTop + container.clientHeight >=
          container.scrollHeight - 80
        ) {
          setPage((prev) => prev + 1);
        }
        timeoutId = null;
      }, 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoading]);

  // Reset on token change
  useEffect(() => {
    setRecords([]);
    setPage(1);
    setHasMore(true);
  }, []);

  // Refresh function (currently used in sale refunds)
  const refreshSales = async () => {
    setRecords([]);
    setPage(1);

    try {
      const response = await authFetch(
        `${API_BASE}/api/salesReport/sales?page=1&limit=${PAGE_SIZE}`);
      const data = await response.json();

      const pageRecords = Array.isArray(data.records) ? data.records : [];
      setRecords(pageRecords);
      setHasMore(pageRecords.length === PAGE_SIZE);
    } catch (err) {
      console.error("Failed to refresh sales:", err);
    }
  };

  // Analytics + chart data
  useEffect(() => {
    if (!fullSales || fullSales.length === 0) {
      setAnalytics(null);
      setLineData([]);
      setBarData([]);
      setPieData([]);
      return;
    }

    const allRecords = fullSales;

    const totalSales = allRecords.reduce(
      (sum, s) => sum + Number(s.totalAmount || 0),
      0
    );

    const totalProfit = allRecords.reduce((sum, s) => {
      const totalCost = (s.items || []).reduce((costSum, item) => {
        const purchasePrice = Number(item.purchasePrice) || 0;
        const quantity = Number(item.quantity) || 0;
        return costSum + purchasePrice * quantity;
      }, 0);
      return sum + ((Number(s.totalAmount) || 0) - totalCost);
    }, 0);

    const totalTransactions = allRecords.length;

    const bestSelling = {};
    const paymentBreakdown = {};

    allRecords.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        bestSelling[item.name] =
          (bestSelling[item.name] || 0) + Number(item.quantity || 0);
      });
      const method = sale.paymentMethod || "Unknown";
      paymentBreakdown[method] =
        (paymentBreakdown[method] || 0) + Number(sale.totalAmount || 0);
    });

    const bestSellingArray = Object.entries(bestSelling)
      .map(([name, totalSold]) => ({ _id: name, totalSold }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    const paymentArray = Object.entries(paymentBreakdown).map(
      ([method, total]) => ({ _id: method, total })
    );

    setAnalytics({
      totalSales,
      totalProfit,
      totalTransactions,
      bestSelling: bestSellingArray,
      paymentBreakdown: paymentArray,
    });

    // Line chart data
    const aggregatedLineData = allRecords
      .map((s) => ({
        date: new Date(s.createdAt).toLocaleDateString("en-PH", {
          timeZone: "Asia/Manila",
        }),
        total: Number(s.totalAmount || 0),
      }))
      .reduce((acc, curr) => {
        const existing = acc.find((d) => d.date === curr.date);
        if (existing) existing.total += curr.total;
        else acc.push({ ...curr });
        return acc;
      }, [])
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    setLineData(aggregatedLineData);

    // Bar & Pie chart data
    const categoryTotals = {};
    allRecords.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const name = item.name || "Uncategorized";
        categoryTotals[name] =
          (categoryTotals[name] || 0) +
          Number(item.price || 0) * Number(item.quantity || 0);
      });
    });

    const barPieData = Object.entries(categoryTotals).map(([name, total]) => ({
      name,
      total,
    }));
    setBarData(barPieData);
    setPieData(barPieData);
  }, [fullSales]);

  const openReceipt = (sale) => setSelectedSale(sale);
  const closeReceipt = () => setSelectedSale(null);

  return (
    <>
      {selectedSale && (
        <ReceiptModal
          sale={selectedSale}
          onClose={closeReceipt}
          onRefund={refreshSales}
        />
      )}

      <DashboardLayout>
        <main className="sales-report-main">
          <h1 className="sales-report-title">Sales Report</h1>

          <section className="sales-report-analytics">
            <div className="sales-card highlight">
              <h3>Total Sales</h3>
              <p>₱{(analytics?.totalSales ?? 0).toFixed(2)}</p>
            </div>
            <div className="sales-card">
              <h3>Total Profit</h3>
              <p
                style={{
                  color: analytics?.totalProfit < 0 ? "red" : "inherit",
                  fontWeight: analytics?.totalProfit < 0 ? "bold" : "normal",
                }}
              >
                ₱{(analytics?.totalProfit ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="sales-card">
              <h3>Total Transactions</h3>
              <p>{analytics?.totalTransactions ?? 0}</p>
            </div>
            <div className="sales-card">
              <h3>Best-Selling Items</h3>
              <ul>
                {analytics?.bestSelling?.map((item) => (
                  <li key={item._id}>
                    {item._id} – <span>{item.totalSold}</span>
                  </li>
                )) ?? <li>No data</li>}
              </ul>
            </div>
            <div className="sales-card">
              <h3>Payment Breakdown</h3>
              <ul>
                {analytics?.paymentBreakdown?.map((p) => (
                  <li key={p._id}>
                    {p._id}: <span>₱{p.total}</span>
                  </li>
                )) ?? <li>No data</li>}
              </ul>
            </div>
          </section>

          <section className="sales-report-records">
            <h2>Transaction Records</h2>
            <div className="records-table-wrapper" ref={containerRef}>
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
                  {records.length === 0 && !isLoading ? (
                    <tr>
                      <td colSpan="6">No sales records found.</td>
                    </tr>
                  ) : (
                    records.map((r) => (
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
                    ))
                  )}
                  {isLoading && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        Loading...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {!hasMore && records.length > 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "8px 0",
                    color: "#666",
                  }}
                >
                  No more records
                </div>
              )}
            </div>
          </section>

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

          <div className="sales-chart-container">
            <h2 className="sales-chart-title">
              Sales Distribution by Category
            </h2>
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
      </DashboardLayout>
    </>
  );
};

export default SalesReport;
