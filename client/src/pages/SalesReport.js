import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { TrendingUp, DollarSign, CreditCard, Award } from "lucide-react";
import ReceiptModal from "../components/ReceiptModal";
import { authFetch, API_BASE } from "../utils/tokenUtils";

const SalesReport = () => {
  const COLORS = [
    "#10b981",
    "#f43f5e",
    "#3b82f6",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
  ];
  const PAGE_SIZE = 6;
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // --- States ---
  const [records, setRecords] = useState([]);
  const [fullSales, setFullSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [lineData, setLineData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalProfit, setTotalProfit] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- Auth Check ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
    else if (user.role === "staff") navigate("/dashboard");
  }, [navigate, user.role]);

  // Fetch full sales for charts
  useEffect(() => {
    const controller = new AbortController();
    const fetchAllSales = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/sales/all`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch all sales");
        const data = await res.json();
        setFullSales(data.sales || []);
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      }
    };
    fetchAllSales();
    return () => controller.abort();
  }, []);

  // Reset scroll on page change
  useEffect(() => {
    const container = containerRef.current;
    if (container) container.scrollTop = 0;
  }, [page]);

  // Pagination table fetch
  useEffect(() => {
    if (page < 1) return;
    const controller = new AbortController();
    const fetchPage = async () => {
      setIsLoading(true);
      try {
        const res = await authFetch(
          `${API_BASE}/api/sales?page=${page}&limit=${PAGE_SIZE}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed to fetch sales page");
        const data = await res.json();

        // ← Use data.items instead of data.sales
        const pageRecords = Array.isArray(data.items) ? data.items : [];

        setRecords(pageRecords);
        setHasMore(pageRecords.length === PAGE_SIZE);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPage();
    return () => controller.abort();
  }, [page]);

  // Fetch total profit
  useEffect(() => {
    const fetchProfit = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/salesReport/profit`);
        if (!res.ok) throw new Error("Failed to fetch profit");
        const data = await res.json();
        setTotalProfit(data.totalProfit || 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfit();
  }, []);

  // Analytics & Charts
  useEffect(() => {
    if (!fullSales.length) return;

    // KPI calculations
    const totalSales = fullSales.reduce(
      (sum, s) => sum + Number(s.totalAmount || 0),
      0
    );
    const totalTransactions = fullSales.length;

    const bestSelling = {};
    fullSales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        bestSelling[item.name] =
          (bestSelling[item.name] || 0) + Number(item.quantity || 0);
      });
    });
    const bestSellingArray = Object.entries(bestSelling)
      .map(([name, totalSold]) => ({ _id: name, totalSold }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    setAnalytics({
      totalSales,
      totalTransactions,
      bestSelling: bestSellingArray,
    });

    // Line chart
    const line = fullSales
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
    setLineData(line);

    // Bar/Pie chart (sales by category)
    const categoryTotals = {};
    fullSales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const name = item.name || "Uncategorized";
        categoryTotals[name] =
          (categoryTotals[name] || 0) +
          Number(item.sellingPrice.toFixed(2)) * Number(item.quantity || 0);
      });
    });
    const barPie = Object.entries(categoryTotals).map(([name, total]) => ({
      name,
      total,
    }));
    setBarData(barPie);
    setPieData(barPie);
  }, [fullSales]);

  return (
    <div className="space-y-6">
      {selectedSale && (
        <ReceiptModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Sales</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">
                ₱{(analytics?.totalSales ?? 0).toFixed(2)}
              </h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Profit</p>
              <h3
                className={`text-2xl font-bold mt-1 ${
                  totalProfit < 0 ? "text-red-500" : "text-gray-800"
                }`}
              >
                ₱{totalProfit.toFixed(2)}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Transactions</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">
                {analytics?.totalTransactions ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Top Item */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div className="w-full">
              <p className="text-sm text-gray-500 font-medium mb-2">
                Top Items
              </p>
              {analytics?.bestSelling?.length ? (
                <div className="flex flex-wrap gap-2">
                  {analytics.bestSelling.map((item, idx) => (
                    <span
                      key={idx}
                      className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium truncate"
                      title={`${item._id} — ${item.totalSold} sold`}
                    >
                      {item._id}: {item.totalSold}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No data</p>
              )}
            </div>
            <div className="p-3 bg-amber-50 rounded-xl shrink-0">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tables & Charts */}
      <div className="records-table-wrapper">
        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-800">Sales Table</h2>
          </div>
          <div className="flex-1 overflow-y-auto" ref={containerRef}>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">Invoice #</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr
                    key={r.saleId || r._id}
                    onClick={() => setSelectedSale(r)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {r.invoiceNumber || r._id}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {r.customerName}
                    </td>
                    <td className="px-6 py-3 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          r.orderType === "Online"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.orderType}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-brand-primary">
                      ₱{Number(r.totalAmount).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {!isLoading && !records.length && (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-gray-400">
                      No sales found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center px-6 py-3 border-t border-gray-100 bg-gray-50">
            <button
              className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={!hasMore}
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={!hasMore}
            >
              Next
            </button>
          </div>
        </div>

        {/* Charts: Line, Bar, Pie */}
        {/* Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="font-bold text-gray-800 mb-6">Daily Sales Trend</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  tickFormatter={(val) => `₱${val}`}
                />
                <Tooltip
                  formatter={(val) => `₱${val.toFixed(2)}`}
                  contentStyle={{
                    borderRadius: 8,
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#ec4899"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#ec4899",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-6">Sales by Category</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f0f0f0"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val) => `₱${val.toFixed(2)}`}
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="#be123c"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-6">
            Category Distribution
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `₱${val.toFixed(2)}`}
                  contentStyle={{
                    borderRadius: 8,
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
