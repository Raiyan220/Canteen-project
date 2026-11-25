import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { useUX } from "../contexts/UXContext";

export default function Login() {
  const { login } = useAuth();
  const { notify } = useUX();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter both your email address and password.");
      return;
    }

    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);

    if (res.success) {
      notify("Welcome back!", {
        type: "success",
        description: "Your campus profile and order history are synced.",
      });
      navigate(redirectTo, { replace: true });
    } else {
      setError(res.error || "Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      <Navbar />

      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-md rounded-3xl border border-line bg-surface-card p-7 sm:p-8 shadow-card">
          <div className="text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-crimson-600 to-crimson-800 text-lg font-extrabold text-white shadow-crimson">
              CB
            </span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink-primary">
              Sign in to CrimsonBite
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Track past campus orders, save favorite meals, and check out faster.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-crimson-500/40 bg-crimson-500/10 px-4 py-3 text-xs font-semibold text-crimson-600"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-ink-secondary mb-1.5"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full rounded-xl border border-line bg-surface-base px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-crimson-600 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="text-xs font-bold text-ink-secondary"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-xs font-semibold text-crimson-600 hover:underline"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-line bg-surface-base px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-crimson-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-crimson-600 py-3 text-sm font-bold text-white shadow-crimson hover:bg-crimson-700 disabled:opacity-60 transition"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 border-t border-line pt-5 text-center space-y-2 text-xs text-ink-muted">
            <p>
              New to CrimsonBite?{" "}
              <Link to="/register" className="font-bold text-crimson-600 hover:underline">
                Create a student account
              </Link>
            </p>
            <p>
              Just grabbing lunch?{" "}
              <Link to="/" className="font-semibold text-ink-primary hover:text-crimson-600">
                Continue as Guest →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
