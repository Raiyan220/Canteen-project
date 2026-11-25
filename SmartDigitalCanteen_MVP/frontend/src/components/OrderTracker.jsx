import React, { useState } from "react";
import { Link } from "react-router-dom";

const STEPS = [
  { key: "Pending", label: "Order Placed", hint: "Queued for kitchen" },
  { key: "Preparing", label: "Preparing", hint: "Chef is cooking" },
  { key: "Ready", label: "Ready", hint: "Collect at counter" },
  { key: "Collected", label: "Collected", hint: "Enjoy your meal!" },
];

export default function OrderTracker({ order, onCancel, cancelling = false }) {
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!order) return null;

  const isCancelled = order.status === "Cancelled";
  const currentIdx = STEPS.findIndex((s) => s.key === order.status);
  const total = Number(order.total ?? order.totalAmount ?? 0);
  const canCancel = order.status === "Pending" && typeof onCancel === "function";

  const etaMinutes = order.estimatedReadyAt
    ? Math.max(1, Math.round((new Date(order.estimatedReadyAt).getTime() - Date.now()) / 60000))
    : null;

  return (
    <section
      aria-label="Live order status tracker"
      className="rounded-2xl border border-line-strong bg-surface-card p-5 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isCancelled
                  ? "bg-ink-muted"
                  : order.status === "Ready"
                  ? "bg-emerald-500 animate-ping"
                  : "bg-crimson-600 animate-pulse"
              }`}
            />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-crimson-600">
              Live Order #{String(order._id || "").slice(-6).toUpperCase()}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-extrabold text-ink-primary">
            {isCancelled ? "Order Cancelled" : STEPS[currentIdx]?.label || order.status}
          </h3>
          <p className="text-xs text-ink-muted">
            {order.customerName}
            {order.pickupSlot ? ` • Pickup: ${order.pickupSlot}` : ""}
            {!isCancelled && etaMinutes ? ` • ~${etaMinutes} min remaining` : ""}
          </p>
        </div>

        <div className="text-right">
          <span className="font-mono text-lg font-extrabold text-ink-primary tabular-nums">
            ৳{total.toFixed(0)}
          </span>
          <div className="mt-1">
            <Link to="/history" className="text-xs font-semibold text-crimson-600 hover:underline">
              View in History →
            </Link>
          </div>
        </div>
      </div>

      {/* Stepper */}
      {!isCancelled ? (
        <ol className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {STEPS.map((step, idx) => {
            const done = idx < currentIdx;
            const current = idx === currentIdx;
            return (
              <li
                key={step.key}
                className={`rounded-xl border px-3 py-2.5 transition ${
                  current
                    ? "border-crimson-600 bg-crimson-600/10"
                    : done
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-line bg-surface-base opacity-65"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span
                    className={
                      current
                        ? "text-crimson-600"
                        : done
                        ? "text-emerald-600"
                        : "text-ink-muted"
                    }
                  >
                    {idx + 1}. {step.label}
                  </span>
                  {done && <span className="text-emerald-600">✓</span>}
                </div>
                <p className="mt-0.5 text-[11px] text-ink-muted">{step.hint}</p>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="mt-4 rounded-xl border border-line bg-surface-subtle px-4 py-3 text-xs text-ink-secondary">
          This order has been cancelled and stock has been returned to the kitchen.
        </div>
      )}

      {/* Items & Notes */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex flex-wrap gap-1.5">
          {(order.items || []).map((item, idx) => (
            <span
              key={idx}
              className="rounded-lg border border-line bg-surface-base px-2.5 py-1 text-xs font-medium text-ink-secondary"
            >
              <span className="font-mono font-bold text-crimson-600">{item.qty}×</span>{" "}
              {item.name}
            </span>
          ))}
        </div>

        {canCancel && (
          <div className="flex items-center gap-2">
            {!confirmCancel ? (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="rounded-xl border border-crimson-600/40 px-3 py-1.5 text-xs font-bold text-crimson-600 hover:bg-crimson-600 hover:text-white transition"
              >
                Cancel Order
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-xl border border-crimson-600 bg-crimson-600/10 px-2.5 py-1">
                <span className="text-xs font-semibold text-ink-primary">Cancel?</span>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => {
                    onCancel(order._id);
                    setConfirmCancel(false);
                  }}
                  className="rounded-lg bg-crimson-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-crimson-700 disabled:opacity-60"
                >
                  {cancelling ? "..." : "Yes, Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-ink-secondary hover:bg-surface-card"
                >
                  Keep
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {order.notes && (
        <p className="mt-2 text-xs text-ink-muted">
          <span className="font-semibold text-ink-secondary">Note:</span> {order.notes}
        </p>
      )}
    </section>
  );
}
