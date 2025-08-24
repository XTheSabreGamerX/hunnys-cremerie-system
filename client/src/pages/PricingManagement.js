import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../scripts/Sidebar";
import PopupMessage from "../components/PopupMessage";
import ConfirmationModal from "../components/ConfirmationModal";
import "../styles/App.css";

/**
 * PricingManagement.js
 * - Products, Approvals, Reports, Bulk Update
 * - Uses mobile card tables (.table--cards) and data-label attributes
 * - Keeps UX consistent with other pages (Sidebar, PopupMessage, ConfirmationModal)
 */

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
const DEFAULT_TAX = 0.12; // 12% PH VAT
const APPROVAL_DELTA_THRESHOLD = 10; // percent
const TARGET_MARGIN = 15; // percent (report warnings if below)

const PRICELISTS = ["Retail", "Wholesale", "Distributor"];

const currencyPH = (n) =>
  Number(n ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function pct(n) {
  const v = Number(n ?? 0);
  if (!isFinite(v)) return "0%";
  return `${v.toFixed(2)}%`;
}

function computeUnitPriceFromCost(purchaseCost, markupPct) {
  const cost = Number(purchaseCost ?? 0);
  const mu = Number(markupPct ?? 0);
  return cost * (1 + mu / 100);
}
function computeMarginPct(purchaseCost, unitPrice) {
  const cost = Number(purchaseCost ?? 0);
  const price = Number(unitPrice ?? 0);
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
}
function priceInclTax(unitPrice, includeTax, taxRate = DEFAULT_TAX) {
  const p = Number(unitPrice ?? 0);
  return includeTax ? p * (1 + taxRate) : p;
}
function isPromoActive(discount, now = new Date()) {
  if (!discount || !discount.type || !discount.amount) return false;
  const startOk = !discount.startDate || new Date(discount.startDate) <= now;
  const endOk = !discount.endDate || new Date(discount.endDate) >= now;
  return startOk && endOk;
}
function applyDiscount(unitPrice, discount) {
  const base = Number(unitPrice ?? 0);
  if (!discount || !discount.type || !discount.amount) return base;
  const amt = Number(discount.amount);
  if (discount.type === "percent") {
    return Math.max(0, base * (1 - amt / 100));
  }
  return Math.max(0, base - amt);
}

/* ---------- Small UI helpers ---------- */
const Chip = ({ color = "#e0e7ff", text = "" }) => (
  <span
    style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 9999,
      background: color,
      fontSize: 12,
      lineHeight: 1.4,
    }}
  >
    {text}
  </span>
);

/* =========================================================
   Subcomponents (kept local to this page for simplicity)
   ========================================================= */

function EditPriceModal({ item, includeTax, onClose, onSave }) {
  const [purchaseCost, setPurchaseCost] = useState(item?.purchaseCost ?? 0);
  const [markupPct, setMarkupPct] = useState(item?.markupPct ?? 0);
  const [unitPrice, setUnitPrice] = useState(item?.unitPrice ?? 0);
  const [discountType, setDiscountType] = useState(item?.discount?.type || "");
  const [discountAmount, setDiscountAmount] = useState(item?.discount?.amount || 0);
  const [startDate, setStartDate] = useState(item?.discount?.startDate || "");
  const [endDate, setEndDate] = useState(item?.discount?.endDate || "");
  const [reason, setReason] = useState("");

  // auto recalc when cost/markup changes
  useEffect(() => {
    const next = computeUnitPriceFromCost(purchaseCost, markupPct);
    setUnitPrice(Number(next.toFixed(2)));
  }, [purchaseCost, markupPct]);

  const margin = computeMarginPct(purchaseCost, unitPrice);
  const discounted = applyDiscount(unitPrice, {
    type: discountType,
    amount: discountAmount,
    startDate,
    endDate,
  });
  const finalDisplay = priceInclTax(discounted, includeTax);

  const validate = () => {
    if (purchaseCost < 0 || unitPrice < 0 || markupPct < 0) return "Values cannot be negative.";
    if (discountType && (discountAmount < 0 || (discountType === "percent" && discountAmount > 100)))
      return "Invalid discount amount.";
    if (startDate && endDate && new Date(startDate) > new Date(endDate))
      return "Start date must be before end date.";
    if (discounted < 0) return "Discount cannot result in negative price.";
    return null;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>Edit Price – {item?.name}</h2>

        <div className="modal-grid">
          <label>
            Purchase Cost
            <input
              type="number"
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(Number(e.target.value))}
            />
          </label>
          <label>
            Markup %
            <input
              type="number"
              value={markupPct}
              onChange={(e) => setMarkupPct(Number(e.target.value))}
            />
          </label>
          <label>
            Unit Price
            <input
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
            />
          </label>
          <label>
            Margin %
            <input type="text" value={margin.toFixed(2)} readOnly />
          </label>
          <label>
            Discount Type
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
              <option value="">None</option>
              <option value="percent">Percent</option>
              <option value="fixed">Fixed</option>
            </select>
          </label>
          <label>
            Discount Amount
            <input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
              disabled={!discountType}
            />
          </label>
          <label>
            Start Date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            End Date
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>

          <label className="span-2">
            Reason / Notes (for audit / approval)
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>

          <div className="span-2" style={{ marginTop: 8 }}>
            <strong>Preview: </strong>
            {includeTax ? "Price Incl. Tax" : "Price"} = ₱{currencyPH(finalDisplay)}{" "}
            {discountType && isPromoActive({ type: discountType, amount: discountAmount, startDate, endDate }) ? (
              <Chip color="#dcfce7" text="Promo active" />
            ) : null}
            {"  "}
            {margin < TARGET_MARGIN ? <Chip color="#fee2e2" text={`Low margin (${pct(margin)})`} /> : null}
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="module-action-btn module-view-btn"
            onClick={() => onSave({ purchaseCost, markupPct, unitPrice, discount: { type: discountType, amount: discountAmount, startDate, endDate }, reason })}
          >
            Save
          </button>
          <button className="module-action-btn module-edit-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryModal({ itemId, onClose }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/pricing/history/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setRows(Array.isArray(data) ? data : data?.history || []);
      } catch {
        setRows([]);
      }
    })();
  }, [itemId]);

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>Price History</h2>
        <div className="table-wrapper">
          <table className="table--cards">
            <thead>
              <tr>
                <th>When</th>
                <th>Old Price</th>
                <th>New Price</th>
                <th>Changed By</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="5">No history found.</td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={idx}>
                    <td data-label="When">{new Date(r.changedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</td>
                    <td data-label="Old Price">₱{currencyPH(r.oldPrice)}</td>
                    <td data-label="New Price">₱{currencyPH(r.newPrice)}</td>
                    <td data-label="Changed By">{r.changedBy || "—"}</td>
                    <td data-label="Reason">{r.reason || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="modal-actions">
          <button className="module-action-btn module-view-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkUploadModal({ onClose, onPreview, onApply, preview }) {
  const [file, setFile] = useState(null);

  const parseCSV = (text) => {
    // tiny CSV parser (assumes no quoted commas)
    const [header, ...lines] = text.trim().split(/\r?\n/);
    const cols = header.split(",").map((h) => h.trim());
    return lines.map((ln) => {
      const parts = ln.split(",").map((p) => p.trim());
      const obj = {};
      cols.forEach((c, i) => (obj[c] = parts[i]));
      return obj;
    });
  };

  const handlePreview = async () => {
    if (!file) return;
    const text = await file.text();
    const rows = parseCSV(text);
    onPreview(rows);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>Bulk Update (CSV)</h2>

        <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <div className="modal-actions">
          <button className="module-action-btn module-edit-btn" onClick={handlePreview}>
            Preview
          </button>
          <button className="module-action-btn module-view-btn" onClick={onClose}>
            Close
          </button>
        </div>

        {preview && (
          <>
            <h3>Preview</h3>
            <div className="table-wrapper">
              <table className="table--cards">
                <thead>
                  <tr>
                    <th>itemId</th>
                    <th>unitPrice</th>
                    <th>markup%</th>
                    <th>discountType</th>
                    <th>discountAmount</th>
                    <th>startDate</th>
                    <th>endDate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.length === 0 ? (
                    <tr>
                      <td colSpan="8">No rows parsed.</td>
                    </tr>
                  ) : (
                    preview.map((row, idx) => {
                      const unitPrice = Number(row.unitPrice);
                      const markup = Number(row["markup%"]);
                      const discountAmount = Number(row.discountAmount);
                      const invalid =
                        unitPrice < 0 ||
                        markup < 0 ||
                        (row.discountType === "percent" && (discountAmount < 0 || discountAmount > 100));
                      return (
                        <tr key={idx}>
                          <td data-label="itemId">{row.itemId}</td>
                          <td data-label="unitPrice">₱{currencyPH(unitPrice)}</td>
                          <td data-label="markup%">{pct(markup)}</td>
                          <td data-label="discountType">{row.discountType || "—"}</td>
                          <td data-label="discountAmount">{row.discountAmount || "—"}</td>
                          <td data-label="startDate">{row.startDate || "—"}</td>
                          <td data-label="endDate">{row.endDate || "—"}</td>
                          <td data-label="Status">
                            {invalid ? <Chip color="#fee2e2" text="Invalid" /> : <Chip color="#dcfce7" text="OK" />}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button className="module-action-btn module-edit-btn" onClick={() => onApply(preview)}>
                Apply Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Main Page
   ========================================================= */

const PricingManagement = () => {
  const [activeTab, setActiveTab] = useState("Products"); // Products | Approvals | Reports | Bulk
  const [includeTax, setIncludeTax] = useState(false);
  const [activeList, setActiveList] = useState(PRICELISTS[0]);

  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");

  const [approvals, setApprovals] = useState([]);
  const [previewRows, setPreviewRows] = useState(null);

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  const [editItem, setEditItem] = useState(null);
  const [historyItemId, setHistoryItemId] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const confirmActionRef = useRef(() => {});

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("success");
    }, 2000);
  };

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    []
  );

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/pricing?list=${encodeURIComponent(activeList)}&q=${encodeURIComponent(query)}&page=1&limit=50`,
        { headers: authHeaders }
      );
      const data = await res.json();
      const items = Array.isArray(data) ? data : data?.items || [];
      setProducts(items);
    } catch (err) {
      console.error("fetchProducts error", err);
      setProducts([]);
    }
  }, [activeList, query, authHeaders]);

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pricing/approvals`, { headers: authHeaders });
      const data = await res.json();
      setApprovals(Array.isArray(data) ? data : data?.items || []);
    } catch {
      setApprovals([]);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (activeTab === "Approvals") fetchApprovals();
  }, [activeTab, fetchApprovals]);

  const openEdit = (item) => setEditItem(item);
  const openHistory = (itemId) => setHistoryItemId(itemId);

  const saveEdit = async (item, changes) => {
    const prev = Number(item.unitPrice ?? 0);
    const next = Number(changes.unitPrice ?? prev);
    const deltaPct = prev > 0 ? Math.abs((next - prev) / prev) * 100 : 100;

    // If over threshold, create approval instead
    if (deltaPct >= APPROVAL_DELTA_THRESHOLD) {
      try {
        const res = await fetch(`${API_BASE}/api/pricing/${item._id}`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({ ...changes, status: "pendingApproval" }),
        });
        await res.json();
        showPopup("Price change submitted for approval.", "success");
      } catch {
        showPopup("Failed to submit for approval.", "error");
      } finally {
        setEditItem(null);
        fetchProducts();
      }
      return;
    }

    // normal update
    try {
      const res = await fetch(`${API_BASE}/api/pricing/${item._id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(changes),
      });
      const data = await res.json();
      if (res.ok) {
        showPopup(data.message || "Price updated.", "success");
      } else {
        showPopup(data.message || "Failed to update price.", "error");
      }
      setEditItem(null);
      fetchProducts();
    } catch {
      showPopup("Failed to update price.", "error");
    }
  };

  const recalcFromCost = async (itemId) => {
    try {
      const res = await fetch(`${API_BASE}/api/pricing/recalculate/${itemId}`, {
        method: "POST",
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) {
        showPopup(data.message || "Recalculated from cost.", "success");
      } else {
        showPopup(data.message || "Failed to recalculate.", "error");
      }
      fetchProducts();
    } catch {
      showPopup("Failed to recalculate.", "error");
    }
  };

  const approveChange = async (changeId) => {
    try {
      const res = await fetch(`${API_BASE}/api/pricing/approvals/${changeId}/approve`, {
        method: "POST",
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) showPopup(data.message || "Approved.", "success");
      else showPopup(data.message || "Approval failed.", "error");
      fetchApprovals();
      fetchProducts();
    } catch {
      showPopup("Approval failed.", "error");
    }
  };
  const rejectChange = async (changeId) => {
    try {
      const res = await fetch(`${API_BASE}/api/pricing/approvals/${changeId}/reject`, {
        method: "POST",
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) showPopup(data.message || "Rejected.", "success");
      else showPopup(data.message || "Rejection failed.", "error");
      fetchApprovals();
    } catch {
      showPopup("Rejection failed.", "error");
    }
  };

  const openConfirm = (message, action) => {
    setConfirmMessage(message);
    confirmActionRef.current = action;
    setConfirmOpen(true);
  };

  const belowMargin = useMemo(
    () =>
      (products || []).filter((p) => computeMarginPct(p.purchaseCost, p.unitPrice) < TARGET_MARGIN),
    [products]
  );
  const avgMargin = useMemo(() => {
    if (!products || products.length === 0) return 0;
    const sum = products.reduce((acc, p) => acc + computeMarginPct(p.purchaseCost, p.unitPrice), 0);
    return sum / products.length;
  }, [products]);
  const activePromos = useMemo(
    () => (products || []).filter((p) => isPromoActive(p.discount)).length,
    [products]
  );

  return (
    <>
      <Sidebar />

      {/* Confirm & toast */}
      {confirmOpen && (
        <ConfirmationModal
          message={confirmMessage}
          onConfirm={async () => {
            await confirmActionRef.current?.();
            setConfirmOpen(false);
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
      {popupMessage && (
        <PopupMessage
          message={popupMessage}
          type={popupType}
          onClose={() => {
            setPopupMessage("");
            setPopupType("success");
          }}
        />
      )}

      <main className="module-main-content" style={{ marginLeft: 250 }}>
        <div className="module-header">
          <h1 className="module-title">Pricing Management</h1>

          <div className="module-actions-container" style={{ gap: 12, flexWrap: "wrap" }}>
            <label>
              Price List:&nbsp;
              <select value={activeList} onChange={(e) => setActiveList(e.target.value)}>
                {PRICELISTS.map((pl) => (
                  <option key={pl} value={pl}>
                    {pl}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={includeTax}
                onChange={(e) => setIncludeTax(e.target.checked)}
              />
              Include tax (12% VAT)
            </label>

            <input
              type="text"
              className="module-search-input"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ minWidth: 220 }}
            />
            <button className="module-action-btn module-view-btn" onClick={() => fetchProducts()}>
              Refresh
            </button>
          </div>

          <div className="module-tabbar" style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Products", "Approvals", "Reports", "Bulk"].map((t) => (
              <button
                key={t}
                className={`module-action-btn ${activeTab === t ? "module-view-btn" : "module-edit-btn"}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* -------------------- Products Tab -------------------- */}
        {activeTab === "Products" && (
          <section className="module-table-container">
            <div className="table-wrapper">
              <table className="table--cards">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Name</th>
                    <th>Purchase Cost</th>
                    <th>Markup %</th>
                    <th>Unit Price</th>
                    <th>Price (incl. tax)</th>
                    <th>Promo</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(products || []).length === 0 ? (
                    <tr>
                      <td colSpan="9">No products found.</td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const promo = isPromoActive(p.discount);
                      const priceWithTax = priceInclTax(p.unitPrice, includeTax);
                      const margin = computeMarginPct(p.purchaseCost, p.unitPrice);
                      return (
                        <tr key={p._id}>
                          <td data-label="Item ID">{p.itemId}</td>
                          <td data-label="Name">{p.name}</td>
                          <td data-label="Purchase Cost">₱{currencyPH(p.purchaseCost)}</td>
                          <td data-label="Markup %">{pct(p.markupPct)}</td>
                          <td data-label="Unit Price">₱{currencyPH(p.unitPrice)}</td>
                          <td data-label="Price (incl. tax)">₱{currencyPH(priceWithTax)}</td>
                          <td data-label="Promo">
                            {promo ? <Chip color="#dcfce7" text="Active" /> : <span>—</span>}
                          </td>
                          <td data-label="Status">
                            {p.status === "pendingApproval" ? (
                              <Chip color="#fee2e2" text="Pending Approval" />
                            ) : (
                              <Chip color="#e5e7eb" text="Active" />
                            )}{" "}
                            {margin < TARGET_MARGIN && <Chip color="#fee2e2" text="Low margin" />}
                          </td>
                          <td data-label="Actions" className="table-actions">
                            <button className="module-action-btn module-edit-btn" onClick={() => openEdit(p)}>
                              Edit
                            </button>
                            <button className="module-action-btn module-view-btn" onClick={() => openHistory(p.itemId)}>
                              History
                            </button>
                            <button
                              className="module-action-btn"
                              onClick={() => recalcFromCost(p._id)}
                              title="Recalculate from Cost"
                            >
                              Recalc
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* -------------------- Approvals Tab -------------------- */}
        {activeTab === "Approvals" && (
          <section className="module-table-container">
            <div className="table-wrapper">
              <table className="table--cards">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Old Price</th>
                    <th>New Price</th>
                    <th>Changed By</th>
                    <th>Reason</th>
                    <th>Requested At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(approvals || []).length === 0 ? (
                    <tr>
                      <td colSpan="7">No pending approvals.</td>
                    </tr>
                  ) : (
                    approvals.map((a) => (
                      <tr key={a._id}>
                        <td data-label="Item">{a.itemName || a.itemId}</td>
                        <td data-label="Old Price">₱{currencyPH(a.oldPrice)}</td>
                        <td data-label="New Price">₱{currencyPH(a.newPrice)}</td>
                        <td data-label="Changed By">{a.requestedBy || "—"}</td>
                        <td data-label="Reason">{a.reason || "—"}</td>
                        <td data-label="Requested At">
                          {a.requestedAt
                            ? new Date(a.requestedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })
                            : "—"}
                        </td>
                        <td data-label="Actions" className="table-actions">
                          <button
                            className="module-action-btn module-view-btn"
                            onClick={() =>
                              openConfirm("Approve this price change?", () => approveChange(a._id))
                            }
                          >
                            Approve
                          </button>
                          <button
                            className="module-action-btn module-edit-btn"
                            onClick={() =>
                              openConfirm("Reject this price change?", () => rejectChange(a._id))
                            }
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* -------------------- Reports Tab -------------------- */}
        {activeTab === "Reports" && (
          <section className="module-table-container">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              <div className="report-card">
                <strong>Avg Margin</strong>
                <div>{pct(avgMargin)}</div>
              </div>
              <div className="report-card">
                <strong>Below Target</strong>
                <div>{belowMargin.length}</div>
              </div>
              <div className="report-card">
                <strong>Active Promos</strong>
                <div>{activePromos}</div>
              </div>
            </div>

            <h3>Items below min margin ({TARGET_MARGIN}%)</h3>
            <div className="table-wrapper">
              <table className="table--cards">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Purchase Cost</th>
                    <th>Unit Price</th>
                    <th>Margin %</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {belowMargin.length === 0 ? (
                    <tr>
                      <td colSpan="5">None 🎉</td>
                    </tr>
                  ) : (
                    belowMargin.map((p) => {
                      const m = computeMarginPct(p.purchaseCost, p.unitPrice);
                      return (
                        <tr key={p._id}>
                          <td data-label="Item">{p.name}</td>
                          <td data-label="Purchase Cost">₱{currencyPH(p.purchaseCost)}</td>
                          <td data-label="Unit Price">₱{currencyPH(p.unitPrice)}</td>
                          <td data-label="Margin %">{pct(m)}</td>
                          <td data-label="Actions" className="table-actions">
                            <button className="module-action-btn module-edit-btn" onClick={() => openEdit(p)}>
                              Edit
                            </button>
                            <button
                              className="module-action-btn"
                              onClick={() =>
                                openConfirm(
                                  "Request approval to adjust price?",
                                  () => saveEdit(p, { unitPrice: p.unitPrice, reason: "Request approval only" }) // noop but shows flow
                                )
                              }
                            >
                              Request Approval
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* -------------------- Bulk Update Tab -------------------- */}
        {activeTab === "Bulk" && (
          <section className="module-table-container">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <PercentageAdjustor
                label="Adjust all"
                onApply={(pct) =>
                  openConfirm(`Apply ${pct > 0 ? "+" : ""}${pct}% to all prices in ${activeList}?`, async () => {
                    // Dry-run only visual here; a real impl would call a preview/apply API
                    const next = (products || []).map((p) => ({
                      ...p,
                      unitPrice: Number((p.unitPrice * (1 + pct / 100)).toFixed(2)),
                    }));
                    setProducts(next);
                    showPopup("Applied (client-side) for preview. Persist via Bulk CSV Apply.", "success");
                  })
                }
              />
              <PercentageAdjustor
                label="Adjust below-margin items"
                onApply={(pct) =>
                  openConfirm(
                    `Apply ${pct > 0 ? "+" : ""}${pct}% to prices below ${TARGET_MARGIN}% margin?`,
                    async () => {
                      const ids = new Set(belowMargin.map((b) => b._id));
                      const next = (products || []).map((p) =>
                        ids.has(p._id)
                          ? { ...p, unitPrice: Number((p.unitPrice * (1 + pct / 100)).toFixed(2)) }
                          : p
                      );
                      setProducts(next);
                      showPopup("Adjusted below-margin items (preview).", "success");
                    }
                  )
                }
              />
              <button
                className="module-action-btn module-edit-btn"
                onClick={() => setPreviewRows([])} // open modal first
              >
                Bulk CSV
              </button>
            </div>

            {previewRows !== null && (
              <BulkUploadModal
                preview={previewRows}
                onClose={() => setPreviewRows(null)}
                onPreview={(rows) => setPreviewRows(rows)}
                onApply={async (rows) => {
                  try {
                    const res = await fetch(`${API_BASE}/api/pricing/bulk/apply`, {
                      method: "POST",
                      headers: authHeaders,
                      body: JSON.stringify({ rows, list: activeList }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      showPopup(data.message || "Bulk changes applied.", "success");
                      setPreviewRows(null);
                      fetchProducts();
                    } else {
                      showPopup(data.message || "Failed to apply bulk changes.", "error");
                    }
                  } catch {
                    showPopup("Failed to apply bulk changes.", "error");
                  }
                }}
              />
            )}
          </section>
        )}
      </main>

      {/* Modals */}
      {editItem && (
        <EditPriceModal
          item={editItem}
          includeTax={includeTax}
          onClose={() => setEditItem(null)}
          onSave={(changes) => saveEdit(editItem, changes)}
        />
      )}
      {historyItemId && <HistoryModal itemId={historyItemId} onClose={() => setHistoryItemId(null)} />}

      {/* lightweight styles used by modals (scoped) */}
      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index: 1000; }
        .modal-container { width: min(920px, 92vw); background:#fff; border-radius: 12px; padding: 16px; }
        .modal-grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .modal-grid .span-2 { grid-column: span 2; }
        .modal-grid label { display:flex; flex-direction:column; gap:4px; font-size: 14px; }
        .modal-grid input, .modal-grid select { padding: 8px 10px; border:1px solid #ddd; border-radius: 6px; }
        .modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top: 12px; }

        .report-card { background:#fff; border:1px solid #eee; border-radius: 10px; padding: 12px 14px; min-width: 160px; }

        @media (max-width: 768px) {
          .modal-container { width: 96vw; }
          .modal-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
};

function PercentageAdjustor({ label, onApply }) {
  const [val, setVal] = useState(5);
  return (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center", background: "#fff", padding: "8px 10px", borderRadius: 8, border: "1px solid #eee" }}>
      <strong>{label}</strong>
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        style={{ width: 80 }}
      />
      <span>%</span>
      <button className="module-action-btn module-edit-btn" onClick={() => onApply(val)}>
        Apply
      </button>
    </div>
  );
}

export default PricingManagement;
