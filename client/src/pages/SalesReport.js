import React, { useEffect, useState, useRef, useCallback } from "react";
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
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Award,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

import ReceiptModal from "../components/ReceiptModal";
import AcquisitionReceiptModal from "../components/AcquisitionReceiptModal";
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

  // --- States ---
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
  const [suppliers, setSuppliers] = useState([]);

  // Acquisition states
  const [acquisitions, setAcquisitions] = useState([]);
  const [acquisitionPage, setAcquisitionPage] = useState(1);
  const [acquisitionTotalPages, setAcquisitionTotalPages] = useState(1);
  const [acquisitionTotalItems, setAcquisitionTotalItems] = useState(0);
  const [acquisitionSort] = useState({ field: "", order: "" });
  const [selectedAcquisition, setSelectedAcquisition] = useState(null);
  const [totalProfit, setTotalProfit] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // --- Auth Check ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else if (user.role === "staff") {
      navigate("/dashboard");
    }
  }, [user.role, navigate]);

  // --- Fetchers ---

  // 1. All Sales (for Analytics)
  useEffect(() => {
    const controller = new AbortController();
    const fetchAllSales = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/sales/all`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setFullSales(data.sales || data);
      } catch (err) {
        if (err.name !== "AbortError") console.error("Sales fetch error:", err);
      }
    };
    fetchAllSales();
    return () => controller.abort();
  }, []);

  // 2. Suppliers
  useEffect(() => {
    authFetch(`${API_BASE}/api/suppliers?page=1&limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        setSuppliers(Array.isArray(data.suppliers) ? data.suppliers : data);
      })
      .catch((err) => console.error("Suppliers fetch error:", err));
  }, []);

  // 3. Paginated Sales (Table)
  useEffect(() => {
    if (page < 1) return;
    const controller = new AbortController();

    const fetchPage = async (pageNumber) => {
      setIsLoading(true);
      try {
        const res = await authFetch(
          `${API_BASE}/api/salesReport/sales?page=${pageNumber}&limit=${PAGE_SIZE}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed");
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

  // 4. Profit
  useEffect(() => {
    const fetchProfit = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/salesReport/profit`);
        if (res.ok) {
          const data = await res.json();
          setTotalProfit(data.totalProfit || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfit();
  }, []);

  // 5. Acquisitions
  const fetchAcquisitions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await authFetch(
        `${API_BASE}/api/acquisitions?page=${acquisitionPage}&limit=5`
      );
      const data = await res.json();
      setAcquisitions(data.acquisitions || []);
      setAcquisitionTotalPages(data.totalPages || 1);
      setAcquisitionTotalItems(data.totalItems || 0);
    } catch (err) {
      console.error("Acquisitions error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [acquisitionPage]);

  useEffect(() => {
    fetchAcquisitions();
  }, [fetchAcquisitions]);

  // --- Calculation Logic ---
  useEffect(() => {
    if (!fullSales || fullSales.length === 0) {
      setAnalytics(null);
      return;
    }

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
      .slice(0, 5);

    setAnalytics({
      totalSales,
      totalTransactions,
      bestSelling: bestSellingArray,
    });

    // Charts Data
    const aggregatedLine = fullSales
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

    setLineData(aggregatedLine);

    const categoryTotals = {};
    fullSales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const name = item.name || "Uncategorized";
        categoryTotals[name] =
          (categoryTotals[name] || 0) +
          Number(item.price || 0) * Number(item.quantity || 0);
      });
    });
    const barPie = Object.entries(categoryTotals).map(([name, total]) => ({
      name,
      total,
    }));
    setBarData(barPie);
    setPieData(barPie);
  }, [fullSales]);

  // Infinite Scroll Logic
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

  // --- Handlers ---
  const refreshSales = async () => {
    setRecords([]);
    setPage(1);
    // Re-trigger fetch via effect by resetting
  };

  const handleConfirmAcquisition = async (acq) => {
    try {
      await authFetch(`${API_BASE}/api/acquisitions/confirm/${acq._id}`, {
        method: "PUT",
      });
      fetchAcquisitions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelAcquisition = async (acq) => {
    try {
      await authFetch(`${API_BASE}/api/acquisitions/cancel/${acq._id}`, {
        method: "PUT",
      });
      fetchAcquisitions();
    } catch (err) {
      console.error(err);
    }
  };

  const supplierMap = React.useMemo(() => {
    return suppliers.reduce((acc, s) => {
      acc[s._id] = s.name;
      return acc;
    }, {});
  }, [suppliers]);

  return (
    <div className="space-y-6">
      {selectedSale && (
        <ReceiptModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onRefund={refreshSales}
        />
      )}
      {selectedAcquisition && (
        <AcquisitionReceiptModal
          acquisition={selectedAcquisition}
          suppliers={suppliers}
          onClose={() => setSelectedAcquisition(null)}
          onConfirm={handleConfirmAcquisition}
          onCancel={handleCancelAcquisition}
        />
      )}

      {/* --- Header --- */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-brand-primary" />
          Sales Report & Analytics
        </h1>
        {/* <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm">
            <Download className="w-4 h-4" /> Export Report
        </button> */}
      </div>

      {/* --- KPI Cards --- */}
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
                ₱{(totalProfit ?? 0).toFixed(2)}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Transactions */}
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

        {/* Best Seller */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div className="w-full">
              <p className="text-sm text-gray-500 font-medium mb-2">Top Item</p>
              {analytics?.bestSelling && analytics.bestSelling.length > 0 ? (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 truncate">
                    {analytics.bestSelling[0]._id}
                  </h3>
                  <p className="text-xs text-brand-primary font-medium">
                    {analytics.bestSelling[0].totalSold} sold
                  </p>
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

      {/* --- Layout Grid for Tables & Charts --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Transactions Table (Scrollable) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-800">Recent Sales</h2>
          </div>
          <div className="flex-1 overflow-y-auto" ref={containerRef}>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr
                    key={r.saleId}
                    onClick={() => setSelectedSale(r)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {r.saleId}
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
                {!isLoading && records.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-gray-400">
                      No sales found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Acquisitions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">Acquisitions</h2>
            <div className="flex gap-2">
              <button
                disabled={acquisitionPage === 1}
                onClick={() => setAcquisitionPage((p) => p - 1)}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={acquisitionPage === acquisitionTotalPages}
                onClick={() => setAcquisitionPage((p) => p + 1)}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3">Supplier</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3">Cost</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {acquisitions.map((a) => (
                  <tr
                    key={a.acquisitionId}
                    onClick={() => setSelectedAcquisition(a)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-gray-800 truncate max-w-[120px]">
                      {supplierMap[a.supplier] || a.supplier || "Unknown"}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {a.items?.length || 0}
                    </td>
                    <td className="px-6 py-3 font-bold text-gray-700">
                      ₱{Number(a.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          a.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : a.status === "Cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!isLoading && acquisitions.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-gray-400">
                      No acquisitions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Daily Sales Chart */}
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
                  contentStyle={{
                    borderRadius: "8px",
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

        {/* 4. Sales by Category (Bar) */}
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
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "8px",
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

        {/* 5. Sales Distribution (Pie) */}
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
                    borderRadius: "8px",
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
