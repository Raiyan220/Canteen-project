import React from "react";

const PICKUP_SLOTS = ["ASAP", "In 15 mins", "In 30 mins", "Lunch Break (1:00 PM)"];

export default function Cart({
  items = [],
  onInc,
  onDec,
  onRemove,
  onClear,
  onPlaceOrder,
  placing = false,
  customerName = "",
  onCustomerNameChange,
  isAuthenticated = false,
  pickupSlot = "ASAP",
  onPickupSlotChange,
  notes = "",
  onNotesChange,
  onCloseDrawer = null,
}) {
  const total = items.reduce((sum, entry) => sum + Number(entry.price || 0) * entry.qty, 0);
  const totalCount = items.reduce((sum, entry) => sum + entry.qty, 0);
  const maxPrep = items.reduce(
    (max, entry) => Math.max(max, Number(entry.prepTimeMinutes || 5)),
    0
  );

  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-surface-card shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h2 className="text-lg font-extrabold text-ink-primary flex items-center gap-2">
            Your Tray
            {totalCount > 0 && (
              <span className="rounded-full bg-crimson-600 px-2 py-0.5 font-mono text-xs text-white tabular-nums">
                {totalCount}
              </span>
            )}
          </h2>
          <p className="text-xs text-ink-muted">
            {items.length > 0 ? `Estimated kitchen prep ~${maxPrep} mins` : "Add dishes to begin"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-ink-muted hover:bg-surface-elevated hover:text-crimson-600 transition"
            >
              Clear
            </button>
          )}
          {onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              aria-label="Close tray drawer"
              className="rounded-lg border border-line px-2.5 py-1 text-xs font-bold text-ink-secondary hover:bg-surface-elevated"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {items.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-crimson-600/10 text-lg font-bold text-crimson-600">
              +
            </div>
            <p className="mt-3 text-sm font-bold text-ink-primary">Your tray is empty</p>
            <p className="mt-1 text-xs text-ink-muted">
              Select dishes from the menu to customize pickup time and kitchen notes.
            </p>
          </div>
        ) : (
          <>
            <ul className="space-y-3" aria-label="Items in tray">
              {items.map((item) => (
                <li
                  key={item.menuItemId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-base p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink-primary">{item.name}</p>
                    <p className="font-mono text-xs text-ink-muted tabular-nums">
                      ৳{Number(item.price).toFixed(0)} each
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onDec(item.menuItemId)}
                      aria-label={`Remove one ${item.name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface-card text-sm font-bold text-ink-primary hover:border-crimson-600"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-mono text-xs font-bold tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onInc(item.menuItemId)}
                      aria-label={`Add one more ${item.name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface-card text-sm font-bold text-ink-primary hover:border-crimson-600"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(item.menuItemId)}
                      aria-label={`Remove ${item.name} from tray`}
                      className="ml-1 rounded-lg px-1.5 py-1 text-xs text-ink-muted hover:text-crimson-600"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pickup details (inline, zero modal prompt) */}
            <div className="space-y-3 border-t border-line pt-4">
              {!isAuthenticated && (
                <div>
                  <label
                    htmlFor="guest-pickup-name"
                    className="block text-xs font-semibold text-ink-secondary mb-1"
                  >
                    Pickup Name
                  </label>
                  <input
                    id="guest-pickup-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => onCustomerNameChange(e.target.value)}
                    placeholder="Enter name called at counter"
                    maxLength={40}
                    className="w-full rounded-xl border border-line bg-surface-base px-3 py-2 text-sm text-ink-primary focus:border-crimson-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <span className="block text-xs font-semibold text-ink-secondary mb-1.5">
                  Pickup Window
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {PICKUP_SLOTS.map((slot) => {
                    const active = pickupSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => onPickupSlotChange(slot)}
                        aria-pressed={active}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "border-crimson-600 bg-crimson-600 text-white"
                            : "border-line bg-surface-base text-ink-secondary hover:border-line-strong"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="order-kitchen-notes"
                    className="text-xs font-semibold text-ink-secondary"
                  >
                    Kitchen Notes (optional)
                  </label>
                  <span className="font-mono text-[10px] text-ink-muted">
                    {notes.length}/240
                  </span>
                </div>
                <textarea
                  id="order-kitchen-notes"
                  rows={2}
                  maxLength={240}
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Less spicy, no onions, extra napkins..."
                  className="w-full resize-none rounded-xl border border-line bg-surface-base px-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:border-crimson-600 focus:outline-none"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Checkout CTA */}
      {items.length > 0 && (
        <div className="border-t border-line bg-surface-subtle/70 px-5 py-4 space-y-3 rounded-b-2xl">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink-secondary">Total</span>
            <span className="font-mono text-xl font-extrabold text-crimson-600 tabular-nums">
              ৳{total.toFixed(0)}
            </span>
          </div>

          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={placing}
            className="w-full rounded-xl bg-crimson-600 py-3 text-sm font-bold text-white shadow-crimson hover:bg-crimson-700 disabled:opacity-60 transition"
          >
            {placing ? "Sending to Kitchen..." : `Place Order • ৳${total.toFixed(0)}`}
          </button>
        </div>
      )}
    </div>
  );
}
