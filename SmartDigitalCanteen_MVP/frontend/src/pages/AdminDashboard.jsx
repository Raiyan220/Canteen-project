import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api, adminHeaders } from "../api/api";
import { useUX } from "../contexts/UXContext";
import Navbar from "../components/Navbar";
import AdminOrdersTable from "../components/AdminOrdersTable";

const CATEGORIES = ["Breakfast", "Lunch", "Drinks", "Snacks"];
const IMAGE_PRESETS = [
  { label: "Burger", url: "/images/burger.svg" },
  { label: "Pancakes", url: "/images/pancake.svg" },
  { label: "Iced Tea", url: "/images/tea.svg" },
  { label: "Fries", url: "/images/fries.svg" },
  { label: "Default", url: "/images/placeholder.svg" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category: "Lunch",
  stock: "-1",
  prepTimeMinutes: "8",
  imageUrl: "/images/burger.svg",
  isSpecial: false,
};

export default function AdminDashboard() {
  const { notify } = useUX();

  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [passkeyInput, setPasskeyInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState("ACTIVE");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const [feedbackList, setFeedbackList] = useState([]);
  const [dailyReport, setDailyReport] = useState(null);

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [salesStart, setSalesStart] = useState(todayISO);
  const [salesEnd, setSalesEnd] = useState(todayISO);
  const [salesReport, setSalesReport] = useState(null);

  const [editingItemId, setEditingItemId] = useState(null);
  const [menuForm, setMenuForm] = useState(EMPTY_FORM);
  const [savingMenu, setSavingMenu] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const verifyStoredKey = useCallback(async () => {
    const existing = localStorage.getItem("ADMIN_KEY");
    if (!existing) {
      setCheckingAuth(false);
      return;
    }
    try {
      await api.post("/api/admin/verify", {}, adminHeaders());
      setAuthorized(true);
    } catch {
      localStorage.removeItem("ADMIN_KEY");
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    verifyStoredKey();
  }, [verifyStoredKey]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setAuthError("");
    if (!passkeyInput.trim()) {
      setAuthError("Enter the kitchen/admin passkey.");
      return;
    }
    setVerifying(true);
    try {
      localStorage.setItem("ADMIN_KEY", passkeyInput.trim());
      await api.post("/api/admin/verify", {}, adminHeaders());
      setAuthorized(true);
      setPasskeyInput("");
      notify("Admin dashboard unlocked", { type: "success" });
    } catch (err) {
      localStorage.removeItem("ADMIN_KEY");
      setAuthError(err.response?.data?.error || "Incorrect admin passkey.");
    } finally {
      setVerifying(false);
    }
  };

  const handleLock = () => {
    localStorage.removeItem("ADMIN_KEY");
    setAuthorized(false);
    notify("Admin session locked", { type: "info" });
  };

  const fetchOrders = useCallback(async () => {
    if (!authorized) return;
    try {
      const qs =
        orderFilter === "ACTIVE"
          ? ""
          : `?status=${encodeURIComponent(orderFilter)}`;
      const { data } = await api.get(`/api/admin/orders${qs}`, adminHeaders());
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      // Non-fatal
    }
  }, [authorized, orderFilter]);

  const fetchAllData = useCallback(async () => {
    if (!authorized) return;
    try {
      const [menuRes, fbRes, dailyRes] = await Promise.all([
        api.get("/api/admin/menu", adminHeaders()),
        api.get("/api/admin/feedback", adminHeaders()),
        api.get("/api/admin/report/daily", adminHeaders()),
      ]);
      setMenuItems(Array.isArray(menuRes.data) ? menuRes.data : []);
      setFeedbackList(Array.isArray(fbRes.data) ? fbRes.data : []);
      setDailyReport(dailyRes.data || null);
    } catch (err) {
      if (err.response?.status === 403) {
        handleLock();
      }
    }
    fetchOrders();
  }, [authorized, fetchOrders]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (!authorized || !autoRefresh) return;
    const id = setInterval(fetchAllData, 10000);
    return () => clearInterval(id);
  }, [authorized, autoRefresh, fetchAllData]);

  const handleStatusChange = async (orderId, nextStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const { data } = await api.patch(
        `/api/admin/orders/${orderId}/status`,
        { status: nextStatus },
        adminHeaders()
      );
      setOrders((prev) =>
        orderFilter === "ACTIVE" && ["Collected", "Cancelled"].includes(nextStatus)
          ? prev.filter((o) => o._id !== orderId)
          : prev.map((o) => (o._id === orderId ? data : o))
      );
      notify(`Order updated to ${nextStatus}`, { type: "success" });
    } catch (err) {
      notify("Update failed", {
        type: "error",
        description: err.response?.data?.error || "Could not update order status.",
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSaveDish = async (e) => {
    e.preventDefault();
    setSavingMenu(true);
    try {
      const payload = {
        name: menuForm.name.trim(),
        description: menuForm.description.trim(),
        price: Number(menuForm.price),
        category: menuForm.category,
        stock: Number(menuForm.stock),
        prepTimeMinutes: Number(menuForm.prepTimeMinutes || 5),
        imageUrl: menuForm.imageUrl.trim() || "/images/placeholder.svg",
        isSpecial: Boolean(menuForm.isSpecial),
      };

      if (editingItemId) {
        await api.put(`/api/admin/menu/${editingItemId}`, payload, adminHeaders());
        notify("Dish updated", { type: "success" });
      } else {
        await api.post("/api/admin/menu", payload, adminHeaders());
        notify("Dish added to menu", { type: "success" });
      }

      setEditingItemId(null);
      setMenuForm(EMPTY_FORM);
      fetchAllData();
    } catch (err) {
      notify("Could not save dish", {
        type: "error",
        description: err.response?.data?.error || "Verify all dish fields.",
      });
    } finally {
      setSavingMenu(false);
    }
  };

  const handleEditDish = (item) => {
    setEditingItemId(item._id);
    setMenuForm({
      name: item.name || "",
      description: item.description || "",
      price: String(item.price ?? ""),
      category: item.category || "Lunch",
      stock: String(item.stock ?? -1),
      prepTimeMinutes: String(item.prepTimeMinutes ?? 5),
      imageUrl: item.imageUrl || "/images/placeholder.svg",
      isSpecial: Boolean(item.isSpecial),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleStockFlag = async (item) => {
    const currentlyOut = item.isOutOfStock || Number(item.stock ?? -1) === 0;
    const nextStock = currentlyOut ? -1 : 0;
    try {
      await api.put(
        `/api/admin/menu/${item._id}`,
        { stock: nextStock, isOutOfStock: !currentlyOut },
        adminHeaders()
      );
      notify(`${item.name} marked ${currentlyOut ? "In Stock" : "Sold Out"}`, {
        type: "info",
      });
      fetchAllData();
    } catch {
      notify("Failed to update availability", { type: "error" });
    }
  };

  const handleDeleteDish = async (itemId) => {
    try {
      await api.delete(`/api/admin/menu/${itemId}`, adminHeaders());
      setConfirmDeleteId(null);
      notify("Dish removed", { type: "info" });
      fetchAllData();
    } catch (err) {
      notify("Delete failed", {
        type: "error",
        description: err.response?.data?.error || "Could not remove item.",
      });
    }
  };

  const handleRunSalesReport = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.get(
        `/api/admin/report/sales?start=${salesStart}&end=${salesEnd}`,
        adminHeaders()
      );
      setSalesReport(data);
    } catch (err) {
      notify("Report query failed", {
        type: "error",
        description: err.response?.data?.error || "Check date range.",
      });
    }
  };

  const handleDownloadCSV = (reportData, filenamePrefix) => {
    if (!reportData) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Orders", reportData.totalOrders],
      ["Revenue (BDT)", Number(reportData.revenue || 0).toFixed(0)],
      [],
      ["Top Selling Item", "Quantity"],
      ...(reportData.topSelling || []).map((t) => [t.name, t.qty]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenamePrefix}-${todayISO}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const avgRating = useMemo(() => {
    if (!feedbackList.length) return "—";
    const sum = feedbackList.reduce((acc, f) => acc + Number(f.rating || 0), 0);
    return (sum / feedbackList.length).toFixed(1);
  }, [feedbackList]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-base">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm font-semibold text-ink-muted">Checking admin session...</p>
        </main>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-base">
        <Navbar />
        <main
          id="main-content"
          className="flex-1 flex items-center justify-center px-4 py-12"
        >
          <div className="w-full max-w-md rounded-3xl border border-line bg-surface-card p-8 shadow-card">
            <span className="inline-block rounded-full bg-crimson-600/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-crimson-600">
              Kitchen Staff Access
            </span>
            <h1 className="mt-3 text-2xl font-extrabold text-ink-primary">
              Unlock Kitchen &amp; Admin
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Enter your server-configured passkey to manage live orders, dishes, and sales
              reports.
            </p>

            <form onSubmit={handleUnlock} className="mt-6 space-y-4">
              {authError && (
                <div
                  role="alert"
                  className="rounded-xl border border-crimson-500/40 bg-crimson-500/10 px-4 py-2.5 text-xs font-semibold text-crimson-600"
                >
                  {authError}
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-passkey"
                  className="block text-xs font-bold text-ink-secondary mb-1.5"
                >
                  Admin Passkey
                </label>
                <input
                  id="admin-passkey"
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter passkey"
                  className="w-full rounded-xl border border-line bg-surface-base px-4 py-3 text-sm text-ink-primary focus:border-crimson-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full rounded-xl bg-crimson-600 py-3 text-sm font-bold text-white shadow-crimson hover:bg-crimson-700 disabled:opacity-60 transition"
              >
                {verifying ? "Verifying..." : "Unlock Console"}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      <Navbar />

      <main
        id="main-content"
        className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      >
        {/* Top bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink-primary">
              Kitchen &amp; Admin Console
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Manage queue stages, inventory, customer ratings, and daily revenue.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface-card px-3 py-2 text-xs font-semibold text-ink-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="accent-crimson-600"
              />
              Auto-sync (10s)
            </label>
            <button
              type="button"
              onClick={fetchAllData}
              className="rounded-xl border border-line bg-surface-card px-3.5 py-2 text-xs font-semibold text-ink-secondary hover:border-crimson-600"
            >
              Refresh Now
            </button>
            <button
              type="button"
              onClick={handleLock}
              className="rounded-xl border border-crimson-600/40 px-3.5 py-2 text-xs font-bold text-crimson-600 hover:bg-crimson-600 hover:text-white transition"
            >
              Lock Console
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Admin sections"
          className="flex flex-wrap gap-2 border-b border-line pb-3"
        >
          {[
            { id: "overview", label: "Overview" },
            { id: "orders", label: `Live Orders (${orders.length})` },
            { id: "menu", label: `Menu (${menuItems.length})` },
            { id: "feedback", label: `Feedback (${feedbackList.length})` },
            { id: "reports", label: "Sales Reports" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === tab.id
                  ? "bg-crimson-600 text-white shadow-crimson"
                  : "border border-line bg-surface-card text-ink-secondary hover:border-crimson-500/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-line bg-surface-card p-5 shadow-card">
                <p className="text-xs font-semibold text-ink-muted">Today&apos;s Revenue</p>
                <p className="mt-2 font-mono text-3xl font-extrabold text-crimson-600 tabular-nums">
                  ৳{Number(dailyReport?.revenue || 0).toFixed(0)}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-surface-card p-5 shadow-card">
                <p className="text-xs font-semibold text-ink-muted">Orders Today</p>
                <p className="mt-2 font-mono text-3xl font-extrabold text-ink-primary tabular-nums">
                  {dailyReport?.totalOrders ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-surface-card p-5 shadow-card">
                <p className="text-xs font-semibold text-ink-muted">Orders in Queue</p>
                <p className="mt-2 font-mono text-3xl font-extrabold text-ink-primary tabular-nums">
                  {orders.filter((o) => ["Pending", "Preparing", "Ready"].includes(o.status)).length}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-surface-card p-5 shadow-card">
                <p className="text-xs font-semibold text-ink-muted">Customer Rating</p>
                <p className="mt-2 font-mono text-3xl font-extrabold text-ink-primary tabular-nums">
                  {avgRating} <span className="text-base text-crimson-600">★</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-ink-primary">Active Kitchen Queue</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-bold text-crimson-600 hover:underline"
                  >
                    Open Full Orders View →
                  </button>
                </div>
                <AdminOrdersTable
                  orders={orders.slice(0, 6)}
                  onStatusChange={handleStatusChange}
                  updatingId={updatingOrderId}
                />
              </div>

              <div className="lg:col-span-4 rounded-2xl border border-line bg-surface-card p-5 shadow-card space-y-4">
                <h2 className="text-lg font-extrabold text-ink-primary">Top Dishes Today</h2>
                {dailyReport?.topSelling?.length ? (
                  <ul className="space-y-3">
                    {dailyReport.topSelling.map((entry, idx) => (
                      <li key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-ink-primary">{entry.name}</span>
                          <span className="font-mono text-crimson-600">{entry.qty} sold</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
                          <div
                            className="h-full rounded-full bg-crimson-600"
                            style={{
                              width: `${Math.min(
                                100,
                                (entry.qty / Math.max(1, dailyReport.topSelling[0].qty)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-ink-muted">No completed orders recorded today yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: ORDERS */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {["ACTIVE", "Pending", "Preparing", "Ready", "Collected", "Cancelled"].map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderFilter(st)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      orderFilter === st
                        ? "bg-crimson-600 text-white"
                        : "border border-line bg-surface-card text-ink-secondary hover:border-crimson-500/50"
                    }`}
                  >
                    {st === "ACTIVE" ? "Active Queue" : st}
                  </button>
                )
              )}
            </div>

            <AdminOrdersTable
              orders={orders}
              onStatusChange={handleStatusChange}
              updatingId={updatingOrderId}
            />
          </div>
        )}

        {/* TAB: MENU MANAGEMENT */}
        {activeTab === "menu" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            <form
              onSubmit={handleSaveDish}
              className="lg:col-span-5 rounded-2xl border border-line bg-surface-card p-6 shadow-card space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-ink-primary">
                  {editingItemId ? "Edit Dish" : "Add New Dish"}
                </h2>
                {editingItemId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItemId(null);
                      setMenuForm(EMPTY_FORM);
                    }}
                    className="text-xs font-semibold text-crimson-600 hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div>
                <label htmlFor="dish-name" className="block text-xs font-bold text-ink-secondary mb-1">
                  Dish Name
                </label>
                <input
                  id="dish-name"
                  type="text"
                  required
                  value={menuForm.name}
                  onChange={(e) => setMenuForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Spicy Crimson Chicken Wrap"
                  className="w-full rounded-xl border border-line bg-surface-base px-3.5 py-2.5 text-sm text-ink-primary focus:border-crimson-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dish-price" className="block text-xs font-bold text-ink-secondary mb-1">
                    Price (৳)
                  </label>
                  <input
                    id="dish-price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={menuForm.price}
                    onChange={(e) => setMenuForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full rounded-xl border border-line bg-surface-base px-3.5 py-2.5 text-sm font-mono text-ink-primary focus:border-crimson-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="dish-category" className="block text-xs font-bold text-ink-secondary mb-1">
                    Category
                  </label>
                  <select
                    id="dish-category"
                    value={menuForm.category}
                    onChange={(e) => setMenuForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl border border-line bg-surface-base px-3 py-2.5 text-sm text-ink-primary focus:border-crimson-600 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dish-stock" className="block text-xs font-bold text-ink-secondary mb-1">
                    Stock (-1 = Unlimited)
                  </label>
                  <input
                    id="dish-stock"
                    type="number"
                    value={menuForm.stock}
                    onChange={(e) => setMenuForm((f) => ({ ...f, stock: e.target.value }))}
                    className="w-full rounded-xl border border-line bg-surface-base px-3.5 py-2.5 text-sm font-mono text-ink-primary focus:border-crimson-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="dish-prep" className="block text-xs font-bold text-ink-secondary mb-1">
                    Prep Time (min)
                  </label>
                  <input
                    id="dish-prep"
                    type="number"
                    min="1"
                    value={menuForm.prepTimeMinutes}
                    onChange={(e) =>
                      setMenuForm((f) => ({ ...f, prepTimeMinutes: e.target.value }))
                    }
                    className="w-full rounded-xl border border-line bg-surface-base px-3.5 py-2.5 text-sm font-mono text-ink-primary focus:border-crimson-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dish-desc" className="block text-xs font-bold text-ink-secondary mb-1">
                  Description
                </label>
                <textarea
                  id="dish-desc"
                  rows={2}
                  value={menuForm.description}
                  onChange={(e) => setMenuForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short, appetizing summary..."
                  className="w-full rounded-xl border border-line bg-surface-base px-3.5 py-2 text-xs text-ink-primary focus:border-crimson-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="dish-image" className="block text-xs font-bold text-ink-secondary mb-1">
                  Image URL or Built-in Preset
                </label>
                <input
                  id="dish-image"
                  type="text"
                  value={menuForm.imageUrl}
                  onChange={(e) => setMenuForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-surface-base px-3.5 py-2 text-xs font-mono text-ink-primary focus:border-crimson-600 focus:outline-none"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setMenuForm((f) => ({ ...f, imageUrl: preset.url }))}
                      className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                        menuForm.imageUrl === preset.url
                          ? "border-crimson-600 bg-crimson-600 text-white"
                          : "border-line bg-surface-base text-ink-muted hover:border-line-strong"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-ink-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={menuForm.isSpecial}
                  onChange={(e) => setMenuForm((f) => ({ ...f, isSpecial: e.target.checked }))}
                  className="h-4 w-4 accent-crimson-600 rounded"
                />
                Highlight as Chef Special
              </label>

              <button
                type="submit"
                disabled={savingMenu}
                className="w-full rounded-xl bg-crimson-600 py-3 text-sm font-bold text-white shadow-crimson hover:bg-crimson-700 disabled:opacity-60 transition"
              >
                {savingMenu
                  ? "Saving..."
                  : editingItemId
                  ? "Save Dish Changes"
                  : "Create Dish"}
              </button>
            </form>

            <div className="lg:col-span-7 space-y-3">
              {menuItems.map((item) => {
                const isOut = item.isOutOfStock || Number(item.stock ?? -1) === 0;
                return (
                  <div
                    key={item._id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface-card p-4 shadow-card"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <img
                        src={item.imageUrl || "/images/placeholder.svg"}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.src = "/images/placeholder.svg";
                        }}
                        className="h-14 w-14 rounded-xl bg-surface-elevated p-1.5 object-contain shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-ink-primary truncate">{item.name}</h3>
                          {item.isSpecial && (
                            <span className="rounded-full bg-crimson-600/15 px-2 py-0.5 text-[10px] font-bold uppercase text-crimson-600">
                              Special
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-muted font-mono">
                          ৳{Number(item.price).toFixed(0)} • {item.category} •{" "}
                          {Number(item.stock ?? -1) < 0 ? "Unlimited" : `Stock: ${item.stock}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStockFlag(item)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                          isOut
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                            : "border-amber-500/40 bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {isOut ? "Restock" : "Mark Sold Out"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditDish(item)}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-primary hover:border-crimson-600"
                      >
                        Edit
                      </button>

                      {confirmDeleteId === item._id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteDish(item._id)}
                            className="rounded-lg bg-crimson-600 px-2.5 py-1.5 text-xs font-bold text-white"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg px-2 py-1.5 text-xs text-ink-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item._id)}
                          className="rounded-lg border border-crimson-600/40 px-2.5 py-1.5 text-xs font-bold text-crimson-600 hover:bg-crimson-600 hover:text-white"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: FEEDBACK */}
        {activeTab === "feedback" && (
          <div className="space-y-4">
            {feedbackList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line-strong bg-surface-card p-10 text-center">
                <p className="text-sm font-bold text-ink-primary">No customer ratings yet</p>
                <p className="mt-1 text-xs text-ink-muted">
                  Customers can rate completed orders directly from Order History.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {feedbackList.map((fb) => (
                  <article
                    key={fb._id}
                    className="rounded-2xl border border-line bg-surface-card p-5 shadow-card space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-ink-secondary">
                        {fb.orderId?.customerName || "Customer"} • #
                        {String(fb.orderId?._id || fb.orderId || "").slice(-6).toUpperCase()}
                      </span>
                      <span className="rounded-full bg-crimson-600 px-2.5 py-0.5 text-xs font-bold text-white">
                        {fb.rating}/5 ★
                      </span>
                    </div>
                    <p className="text-sm text-ink-primary">
                      {fb.comment || "No written comment provided."}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {fb.createdAt ? new Date(fb.createdAt).toLocaleString() : ""}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: REPORTS */}
        {activeTab === "reports" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface-card p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-ink-primary">Daily Summary</h2>
                {dailyReport && (
                  <button
                    type="button"
                    onClick={() => handleDownloadCSV(dailyReport, "daily-report")}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-crimson-600 hover:bg-surface-elevated"
                  >
                    Export CSV
                  </button>
                )}
              </div>
              <p className="text-xs text-ink-muted">Date: {dailyReport?.date || todayISO}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-base p-4 border border-line">
                  <span className="text-xs text-ink-muted">Orders</span>
                  <p className="font-mono text-2xl font-extrabold text-ink-primary">
                    {dailyReport?.totalOrders ?? 0}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-base p-4 border border-line">
                  <span className="text-xs text-ink-muted">Revenue</span>
                  <p className="font-mono text-2xl font-extrabold text-crimson-600">
                    ৳{Number(dailyReport?.revenue || 0).toFixed(0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface-card p-6 shadow-card space-y-4">
              <h2 className="text-lg font-extrabold text-ink-primary">Custom Sales Range</h2>
              <form onSubmit={handleRunSalesReport} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label htmlFor="sales-start" className="block text-xs font-bold text-ink-secondary mb-1">
                    Start Date
                  </label>
                  <input
                    id="sales-start"
                    type="date"
                    value={salesStart}
                    onChange={(e) => setSalesStart(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface-base px-3 py-2 text-xs text-ink-primary"
                  />
                </div>
                <div>
                  <label htmlFor="sales-end" className="block text-xs font-bold text-ink-secondary mb-1">
                    End Date
                  </label>
                  <input
                    id="sales-end"
                    type="date"
                    value={salesEnd}
                    onChange={(e) => setSalesEnd(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface-base px-3 py-2 text-xs text-ink-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-crimson-600 py-2.5 text-xs font-bold text-white hover:bg-crimson-700"
                >
                  Generate
                </button>
              </form>

              {salesReport && (
                <div className="border-t border-line pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-primary">
                      {salesReport.start} to {salesReport.end}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadCSV(salesReport, "sales-report")}
                      className="text-xs font-bold text-crimson-600 hover:underline"
                    >
                      Download CSV
                    </button>
                  </div>
                  <p className="text-sm font-mono font-bold text-ink-primary">
                    {salesReport.totalOrders} orders • ৳{Number(salesReport.revenue || 0).toFixed(0)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
