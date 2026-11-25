import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useUX } from "../contexts/UXContext";

export default function Navbar({
  cartCount = 0,
  onCartClick = null,
  activeOrderStatus = null,
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, textScale, setTextScale, reducedMotion, setReducedMotion, notify } =
    useUX();
  const location = useLocation();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prefsRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (prefsRef.current && !prefsRef.current.contains(e.target)) {
        setPrefsOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setPrefsOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: "/", label: "Menu", match: (p) => p === "/" },
    {
      to: "/history",
      label: "Orders",
      match: (p) => p === "/history" || p === "/order-history",
    },
    { to: "/admin", label: "Kitchen & Admin", match: (p) => p.startsWith("/admin") },
  ];

  const handleLogout = () => {
    logout();
    notify("Signed out", { type: "info", description: "You can keep browsing as a guest." });
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-surface-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            to="/"
            className="group flex items-center gap-2.5 rounded-xl py-1 pr-2 transition"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-crimson-600 to-crimson-800 text-white shadow-crimson font-extrabold tracking-tight text-lg">
              CB
            </span>
            <div className="leading-tight">
              <span className="block text-base font-extrabold tracking-tight text-ink-primary group-hover:text-crimson-600 transition-colors">
                CrimsonBite
              </span>
              <span className="hidden sm:block text-[11px] font-medium text-ink-muted">
                Smart Digital Canteen
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = item.match(location.pathname);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-crimson-600 text-white shadow-sm"
                      : "text-ink-secondary hover:bg-surface-elevated hover:text-crimson-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {activeOrderStatus && (
              <Link
                to="/history"
                className="hidden sm:inline-flex items-center gap-2 rounded-full border border-crimson-500/30 bg-crimson-500/10 px-3 py-1.5 text-xs font-semibold text-crimson-600 hover:bg-crimson-500/15"
              >
                <span className="h-2 w-2 rounded-full bg-crimson-600 animate-pulse" />
                <span>Order: {activeOrderStatus}</span>
              </Link>
            )}

            {/* Display & Accessibility Preferences */}
            <div className="relative" ref={prefsRef}>
              <button
                type="button"
                onClick={() => setPrefsOpen((v) => !v)}
                aria-expanded={prefsOpen}
                aria-haspopup="dialog"
                aria-label="Display preferences"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-surface-card px-3 text-xs font-semibold text-ink-secondary hover:border-line-strong hover:bg-surface-elevated transition"
              >
                <span aria-hidden="true">{theme === "dark" ? "◐" : "☀"}</span>
                <span className="hidden sm:inline">Display</span>
              </button>

              {prefsOpen && (
                <div
                  role="dialog"
                  aria-label="Display and readability settings"
                  className="absolute right-0 mt-2 w-72 rounded-2xl border border-line-strong bg-surface-card p-4 shadow-xl z-50"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <h2 className="text-sm font-bold text-ink-primary">Display & Comfort</h2>
                    <button
                      type="button"
                      onClick={() => setPrefsOpen(false)}
                      aria-label="Close display menu"
                      className="rounded-lg px-2 py-0.5 text-xs text-ink-muted hover:bg-surface-elevated"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-3 space-y-4">
                    {/* Theme toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-ink-primary">Surface Mode</p>
                        <p className="text-[11px] text-ink-muted">
                          {theme === "dark" ? "Crimson Dark" : "Warm Daylight"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="rounded-lg border border-line-strong bg-surface-elevated px-3 py-1.5 text-xs font-bold text-crimson-700 dark:text-crimson-300 hover:bg-crimson-600 hover:text-white transition"
                      >
                        {theme === "dark" ? "Use Light" : "Use Dark"}
                      </button>
                    </div>

                    {/* Text scale */}
                    <div>
                      <p className="text-xs font-semibold text-ink-primary mb-1.5">Text Size</p>
                      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Text size">
                        {[
                          { id: "normal", label: "Standard" },
                          { id: "large", label: "Large" },
                          { id: "xl", label: "Extra" },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setTextScale(opt.id)}
                            aria-pressed={textScale === opt.id}
                            className={`rounded-lg py-1.5 text-xs font-semibold border transition ${
                              textScale === opt.id
                                ? "border-crimson-600 bg-crimson-600 text-white"
                                : "border-line bg-surface-base text-ink-secondary hover:border-line-strong"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reduced motion */}
                    <label className="flex items-center justify-between cursor-pointer pt-1">
                      <div>
                        <span className="block text-xs font-semibold text-ink-primary">
                          Reduce Motion
                        </span>
                        <span className="block text-[11px] text-ink-muted">
                          Minimize card & drawer animations
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={reducedMotion}
                        onChange={(e) => setReducedMotion(e.target.checked)}
                        className="h-4 w-4 accent-crimson-600 rounded"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Cart button (when provided on Home) */}
            {onCartClick && (
              <button
                type="button"
                onClick={onCartClick}
                aria-label={`Open tray with ${cartCount} items`}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-crimson-600 px-3.5 text-sm font-bold text-white shadow-crimson hover:bg-crimson-700 transition"
              >
                <span>Tray</span>
                <span className="rounded-md bg-white/20 px-1.5 py-0.5 font-mono text-xs tabular-nums">
                  {cartCount}
                </span>
              </button>
            )}

            {/* Auth controls */}
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="max-w-[130px] truncate rounded-xl border border-line bg-surface-elevated px-3 py-2 text-xs font-semibold text-ink-primary">
                  {user?.username || user?.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="h-10 rounded-xl border border-line px-3 text-xs font-semibold text-ink-secondary hover:border-crimson-600 hover:text-crimson-600 transition"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="inline-flex h-10 items-center rounded-xl border border-line px-3 text-xs font-semibold text-ink-secondary hover:border-line-strong hover:bg-surface-elevated transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-10 items-center rounded-xl bg-ink-primary px-3 text-xs font-semibold text-surface-base hover:opacity-90 transition"
                >
                  Join
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink-primary md:hidden"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-line bg-surface-card px-4 py-3 md:hidden space-y-2">
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = item.match(location.pathname);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
                      active
                        ? "bg-crimson-600 text-white"
                        : "text-ink-secondary hover:bg-surface-elevated"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-line pt-2 flex items-center justify-between gap-2">
              {isAuthenticated ? (
                <>
                  <span className="text-xs font-semibold text-ink-secondary truncate">
                    Signed in as {user?.username || user?.email}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-crimson-600"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex-1 rounded-xl border border-line py-2 text-center text-xs font-semibold text-ink-primary"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 rounded-xl bg-crimson-600 py-2 text-center text-xs font-semibold text-white"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
