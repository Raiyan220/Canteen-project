import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { useUX } from "../contexts/UXContext";

function computeStrength(pw) {
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { score, label: pw ? labels[score] : "Enter a password" };
}

export default function Register() {
  const { register } = useAuth();
  const { notify } = useUX();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = useMemo(() => computeStrength(password), [password]);
  const passwordsMatch = !confirmPassword || password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (username.trim().length < 2) {
      setError("Please enter a username (at least 2 characters).");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await register({
      username: username.trim(),
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (res.success) {
      notify("Account created!", {
        type: "success",
        description: "Welcome to CrimsonBite. Ready for your first order.",
      });
      navigate("/", { replace: true });
    } else {
      setError(res.error || "Could not create account.");
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
              Join CrimsonBite
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Save favorite dishes, view receipts, and skip counter queues.
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
                htmlFor="reg-username"
                className="block text-xs font-bold text-ink-secondary mb-1.5"
              >
                Display Name
              </label>
              <input
                id="reg-username"
                type="text"
                autoComplete="name"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Raiyan"
                className="w-full rounded-xl border border-line bg-surface-base px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-crimson-600 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-bold text-ink-secondary mb-1.5"
              >
                Email Address
              </label>
              <input
                id="reg-email"
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
                  htmlFor="reg-password"
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
                id="reg-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-line bg-surface-base px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-crimson-600 focus:outline-none"
              />
              {/* Strength bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1" aria-hidden="true">
                  {[1, 2, 3, 4].map((level) => (
                    <span
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition ${
                        strength.score >= level
                          ? strength.score >= 3
                            ? "bg-emerald-500"
                            : "bg-crimson-500"
                          : "bg-line"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-ink-muted">
                  {strength.label}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-confirm"
                className="block text-xs font-bold text-ink-secondary mb-1.5"
              >
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className={`w-full rounded-xl border bg-surface-base px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none ${
                  passwordsMatch
                    ? "border-line focus:border-crimson-600"
                    : "border-crimson-600"
                }`}
              />
              {!passwordsMatch && (
                <p className="mt-1 text-xs font-semibold text-crimson-600">
                  Passwords do not match yet.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-crimson-600 py-3 text-sm font-bold text-white shadow-crimson hover:bg-crimson-700 disabled:opacity-60 transition"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 border-t border-line pt-5 text-center space-y-2 text-xs text-ink-muted">
            <p>
              Already registered?{" "}
              <Link to="/login" className="font-bold text-crimson-600 hover:underline">
                Sign in here
              </Link>
            </p>
            <p>
              <Link to="/" className="font-semibold text-ink-primary hover:text-crimson-600">
                Back to Menu →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
