import React from "react";

const STATUS_BADGE = {
  Pending: "border-crimson-500/40 bg-crimson-500/10 text-crimson-600",
  Preparing: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  Ready: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  Collected: "border-line bg-surface-subtle text-ink-secondary",
  Cancelled: "border-line bg-surface-base text-ink-muted line-through",
};

const NEXT_STAGE = {
  Pending: { next: "Preparing", label: "Start Prep" },
  Preparing: { next: "Ready", label: "Mark Ready" },
  Ready: { next: "Collected", label: "Collected" },
};

export default function AdminOrdersTable({
  orders = [],
  onStatusChange,
  updatingId = null,
}) {
  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong bg-surface-card p-10 text-center">
        <p className="text-sm font-bold text-ink-primary">No orders match the current filter</p>
        <p className="mt-1 text-xs text-ink-muted">
          New customer orders will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-subtle text-xs font-bold uppercase tracking-wider text-ink-muted">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Dishes</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((order) => {
              const step = NEXT_STAGE[order.status];
              const busy = updatingId === order._id;
              return (
                <tr key={order._id} className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="px-4 py-3 align-top">
                    <span className="font-mono text-xs font-bold text-ink-primary">
                      #{String(order._id || "").slice(-6).toUpperCase()}
                    </span>
                    <div className="mt-0.5 text-[11px] text-ink-muted">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-ink-primary">{order.customerName}</p>
                    <p className="text-[11px] text-ink-muted">
                      Pickup: {order.pickupSlot || "ASAP"}
                    </p>
                    {order.notes && (
                      <p className="mt-1 max-w-xs rounded bg-surface-subtle px-2 py-1 text-[11px] text-ink-secondary">
                        {order.notes}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3 align-top">
                    <ul className="space-y-0.5 text-xs text-ink-secondary">
                      {(order.items || []).map((it, idx) => (
                        <li key={idx}>
                          <span className="font-mono font-bold text-crimson-600">{it.qty}×</span>{" "}
                          {it.name}
                        </li>
                      ))}
                    </ul>
                  </td>

                  <td className="px-4 py-3 align-top font-mono font-bold text-ink-primary tabular-nums">
                    ৳{Number(order.total ?? order.totalAmount ?? 0).toFixed(0)}
                  </td>

                  <td className="px-4 py-3 align-top">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                        STATUS_BADGE[order.status] || STATUS_BADGE.Pending
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-top text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-2">
                      {step && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onStatusChange(order._id, step.next)}
                          className="rounded-lg bg-crimson-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-crimson-700 disabled:opacity-60 transition"
                        >
                          {busy ? "..." : step.label}
                        </button>
                      )}
                      <label className="sr-only" htmlFor={`status-${order._id}`}>
                        Change status for order {order._id}
                      </label>
                      <select
                        id={`status-${order._id}`}
                        disabled={busy}
                        value={order.status}
                        onChange={(e) => onStatusChange(order._id, e.target.value)}
                        className="rounded-lg border border-line bg-surface-base px-2.5 py-1.5 text-xs font-semibold text-ink-primary focus:border-crimson-600 focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        <option value="Collected">Collected</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
