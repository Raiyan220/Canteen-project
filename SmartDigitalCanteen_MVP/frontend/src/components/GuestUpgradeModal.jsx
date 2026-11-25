import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useUX } from "../contexts/UXContext";
import { guestManager } from "../utils/GuestManager";

export default function GuestUpgradeModal({ open, onClose }) {
  const { setSession } = useAuth();
  const { notify } = useUX();
  const [username, setUsername] = useState(guestManager.getDisplayName() || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const data = await guestManager.upgradeToRegisteredUser({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      if (data?.user && data?.token) {
        setSession(data.user, data.token);
      }
      notify("Account upgraded", {
        type: "success",
        description: "Your guest favorites and order history are now saved to your profile.",
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Could not complete account upgrade.");
    } finally {
      setLoading(false);
    }
  };

  const handleLater = () => {
    guestManager.dismissUpgradePrompt();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-line-strong bg-surface-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block rounded-full bg-crimson-600/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-crimson-600">
              Save Your History
            </span>
            <h2 id="upgrade-modal-title" className="mt-2 text-xl font-extrabold text-ink-primary">
              Keep your favorites & orders
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Turn this guest session into a campus account to sync orders and quick-reorder across
              devices.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLater}
            aria-label="Close upgrade dialog"
            className="rounded-lg px-2 py-1 text-sm text-ink-muted hover:bg-surface-elevated"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-crimson-500/40 bg-crimson-500/10 px-3.5 py-2.5 text-xs font-semibold text-crimson-600"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="upgrade-username" className="block text-xs font-semibold text-ink-secondary mb-1">
              Full name or handle
            </label>
            <input
              id="upgrade-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Raiyan"
              className="w-full rounded-xl border border-line bg-surface-base px-3.5 py-2.5 text-sm text-ink-primary focus:border-crimson-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="upgrade-email" className="block text-xs font-semibold text-ink-secondary mb-1">
              Campus or personal email
            </label>
            <input
              id="upgrade-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="w-full rounded-xl border border-line bg-surface-base px-3.5 py-2.5 text-sm text-ink-primary focus:border-crimson-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="upgrade-password" className="block text-xs font-semibold text-ink-secondary mb-1">
              Password (6+ characters)
            </label>
            <input
              id="upgrade-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full rounded-xl border border-line bg-surface-base px-3.5 py-2.5 text-sm text-ink-primary focus:border-crimson-600 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleLater}
              className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink-secondary hover:bg-surface-elevated transition"
            >
              Maybe later
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-crimson-600 py-2.5 text-sm font-bold text-white shadow-crimson hover:bg-crimson-700 disabled:opacity-60 transition"
            >
              {loading ? "Saving..." : "Save Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
