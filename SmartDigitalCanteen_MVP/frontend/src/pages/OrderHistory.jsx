import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import { useUX } from "../contexts/UXContext";
import { guestManager } from "../utils/GuestManager";
import Navbar from "../components/Navbar";

const STATUS_STYLE = {
  Pending: "border-crimson-500/40 bg-crimson-500/10 text-crimson-600",
  Preparing: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  Ready: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  Collected: "border-line bg-surface-subtle text-ink-secondary",
  Cancelled: "border-line bg-surface-base text-ink-muted",
};

export default function OrderHistory() {
  const { user, isAuthenticated } = useAuth();
  const { notify } = useUX();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lookupName, setLookupName] = useState(
    () => guestManager.getDisplayName() || ""
  );
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const [feedbackMap, setFeedbackMap] = useState({});
  const [ratingTarget, setRatingTarget] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      let collected = [];

      if (isAuthenticated) {
        const { data } = await api.get("/api/orders");
        collected = Array.isArray(data) ? data : [];
      } else {
        const guestOrders = guestManager.getOrders();
        const byIds = await Promise.all(
          guestOrders
            .slice(0, 15)
            .map((g) =>
              api
                .get(`/api/orders/${g.orderId}`)
                .then((r) => r.data)
                .catch(() => null)
            )
        );
        const map = new Map();
        byIds.filter(Boolean).forEach((o) => map.set(o._id, o));

        if (lookupName.trim()) {
          const { data } = await api.get(
            `/api/orders?customerName=${encodeURIComponent(lookupName.trim())}`
          );
          (Array.isArray(data) ? data : []).forEach((o) => map.set(o._id, o));
        }
        collected = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      }

      setOrders(collected);

      try {
        const { data: fbList } = await api.get("/api/feedback");
        const nextFb = {};
        (Array.isArray(fbList) ? fbList : []).forEach((fb) => {
          const oid = typeof fb.orderId === "object" ? fb.orderId?._id : fb.orderId;
          if (oid) nextFb[oid] = fb;
        });
        setFeedbackMap(nextFb);
      } catch {
        // Feedback optional
      }
    } catch (err) {
      notify("Failed to load orders", {
        type: "error",
        description: err.response?.data?.error || "Could not reach order service.",
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, lookupName, notify]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter === "ACTIVE") {
        if (!["Pending", "Preparing", "Ready"].includes(order.status)) return false;
      } else if (statusFilter !== "ALL" && order.status !== statusFilter) {
        return false;
      }

      if (q) {
        const itemText = (order.items || []).map((i) => i.name).join(" ");
        const hay = `${order._id} ${order.customerName} ${itemText}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      const { data } = await api.patch(`/api/orders/${orderId}/cancel`);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data : o)));
      setConfirmCancelId(null);
      notify("Order cancelled", {
        type: "info",
        description: "Kitchen stock has been restored.",
      });
    } catch (err) {
      notify("Unable to cancel", {
        type: "error",
        description: err.response?.data?.error || "Order is already being prepared.",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const openFeedbackForm = (order) => {
    const existing = feedbackMap[order._id];
    setRatingTarget(order._id);
    setRatingValue(existing?.rating || 5);
    setRatingComment(existing?.comment || "");
  };

  const handleSubmitFeedback = async (e, orderId) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const { data } = await api.post("/api/feedback", {
        orderId,
        rating: ratingValue,
        comment: ratingComment.trim(),
      });
      setFeedbackMap((prev) => ({ ...prev, [orderId]: data }));
      setRatingTarget(null);
      notify("Thank you for your feedback!", {
        type: "success",
        description: `Saved ${ratingValue}/5 rating.`,
      });
    } catch (err) {
      notify("Could not save feedback", {
        type: "error",
        description: err.response?.data?.error || "Please try again.",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleReorder = (order) => {
    navigate("/", { state: { reorderItems: order.items } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      <Navbar />

      <main
        id="main-content"
        className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink-primary">
              Order History
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {isAuthenticated
                ? `Orders synced for ${user?.username || user?.email}.`
                : "Recent orders on this browser or look up by pickup name."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadOrders}
              className="rounded-xl border border-line bg-surface-card px-3.5 py-2 text-xs font-semibold text-ink-secondary hover:border-crimson-600 transition"
            >
              Refresh
            </button>
            <Link
              to="/"
              className="rounded-xl bg-crimson-600 px-4 py-2 text-xs font-bold text-white shadow-crimson hover:bg-crimson-700 transition"
            >
              + New Order
            </Link>
          </div>
        </div>

        {/* Lookup by name for guest users */}
        {!isAuthenticated && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              guestManager.setDisplayName(lookupName);
              loadOrders();
            }}
            className="flex flex-col sm:flex-row gap-2.5 rounded-2xl border border-line bg-surface-card p-4"
          >
            <div className="flex-1">
              <label htmlFor="guest-lookup-name" className="block text-xs font-bold text-ink-secondary mb-1">
                Find Guest Orders by Pickup Name
              </label>
              <input
                id="guest-lookup-name"
                type="text"
                value={lookupName}
                onChange={(e) => setLookupName(e.target.value)}
                placeholder="Enter name used at checkout"
                className="w-full rounded-xl border border-line bg-surface-base px-3.5 py-2 text-sm text-ink-primary focus:border-crimson-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="sm:self-end rounded-xl bg-crimson-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-crimson-700 transition"
            >
              Look Up Orders
            </button>
          </form>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Order status filters">
            {[
              { id: "ALL", label: "All" },
              { id: "ACTIVE", label: "Active" },
              { id: "Collected", label: "Collected" },
              { id: "Cancelled", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  statusFilter === tab.id
                    ? "bg-crimson-600 text-white"
                    : "border border-line bg-surface-card text-ink-secondary hover:border-crimson-500/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter loaded orders"
            placeholder="Filter by dish or order #..."
            className="w-full sm:w-64 rounded-xl border border-line bg-surface-card px-3.5 py-2 text-xs text-ink-primary focus:border-crimson-600 focus:outline-none"
          />
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-32 rounded-2xl border border-line bg-surface-card animate-pulse"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong bg-surface-card p-10 text-center">
            <p className="text-base font-bold text-ink-primary">No orders found</p>
            <p className="mt-1 text-sm text-ink-muted">
              Place your first order from the canteen menu to track it here.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-xl bg-crimson-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-crimson-700"
            >
              Browse Today&apos;s Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const total = Number(order.totalAmount ?? order.total ?? 0);
              const existingFb = feedbackMap[order._id];
              const editingFb = ratingTarget === order._id;

              return (
                <article
                  key={order._id}
                  className="rounded-2xl border border-line bg-surface-card p-5 shadow-card space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ink-primary">
                          #{String(order._id).slice(-6).toUpperCase()}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                            STATUS_STYLE[order.status] || STATUS_STYLE.PLACED
                          }`}
                        >
                          {order.status}
                        </span>
                        {order.pickupSlot && (
                          <span className="rounded-full border border-line bg-surface-base px-2.5 py-0.5 text-[11px] font-medium text-ink-muted">
                            Pickup: {order.pickupSlot}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">
                        {order.customerName} •{" "}
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-lg font-extrabold text-crimson-600 tabular-nums">
                        ৳{total.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Ordered items */}
                  <div className="flex flex-wrap gap-2">
                    {(order.items || []).map((item, idx) => (
                      <span
                        key={idx}
                        className="rounded-xl border border-line bg-surface-base px-3 py-1.5 text-xs font-medium text-ink-secondary"
                      >
                        <span className="font-mono font-bold text-crimson-600">
                          {item.qty}×
                        </span>{" "}
                        {item.name}
                      </span>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-xs text-ink-muted">
                      <span className="font-semibold text-ink-secondary">Kitchen note:</span>{" "}
                      {order.notes}
                    </p>
                  )}

                  {/* Actions row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReorder(order)}
                        className="rounded-xl border border-line-strong bg-surface-elevated px-3.5 py-1.5 text-xs font-bold text-crimson-700 dark:text-crimson-300 hover:bg-crimson-600 hover:text-white transition"
                      >
                        Reorder
                      </button>

                      {order.status === "Collected" && (
                        <button
                          type="button"
                          onClick={() => openFeedbackForm(order)}
                          className="rounded-xl border border-line px-3.5 py-1.5 text-xs font-semibold text-ink-secondary hover:border-crimson-600 transition"
                        >
                          {existingFb ? `Rated ${existingFb.rating}/5 ★ (Edit)` : "Rate Meal"}
                        </button>
                      )}
                    </div>

                    {order.status === "Pending" && (
                      <div>
                        {confirmCancelId === order._id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-ink-primary">
                              Cancel order?
                            </span>
                            <button
                              type="button"
                              disabled={cancellingId === order._id}
                              onClick={() => handleCancelOrder(order._id)}
                              className="rounded-lg bg-crimson-600 px-3 py-1.5 text-xs font-bold text-white"
                            >
                              {cancellingId === order._id ? "..." : "Yes, Cancel"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmCancelId(null)}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-muted"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(order._id)}
                            className="rounded-xl border border-crimson-600/40 px-3.5 py-1.5 text-xs font-bold text-crimson-600 hover:bg-crimson-600 hover:text-white transition"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline Feedback Form */}
                  {editingFb && (
                    <form
                      onSubmit={(e) => handleSubmitFeedback(e, order._id)}
                      className="rounded-xl border border-line-strong bg-surface-base p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink-primary">
                          How was your order?
                        </span>
                        <div className="flex items-center gap-1" role="group" aria-label="Star rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingValue(star)}
                              aria-label={`Rate ${star} out of 5`}
                              className={`h-8 w-8 rounded-lg font-bold text-sm transition ${
                                star <= ratingValue
                                  ? "bg-crimson-600 text-white"
                                  : "border border-line bg-surface-card text-ink-muted"
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="Share quick feedback for our kitchen..."
                        className="w-full rounded-xl border border-line bg-surface-card px-3 py-2 text-xs text-ink-primary focus:border-crimson-600 focus:outline-none"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRatingTarget(null)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-muted"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingFeedback}
                          className="rounded-lg bg-crimson-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-crimson-700 disabled:opacity-60"
                        >
                          {submittingFeedback ? "Saving..." : "Submit Rating"}
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
