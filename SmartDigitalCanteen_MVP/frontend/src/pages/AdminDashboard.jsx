import { useState } from "react";

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");

  // Admin password from .env
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "12345";

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setError("");
    } else {
      setError("Invalid password. Try again.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-sm mx-auto bg-white shadow p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4 text-center">Admin Access</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded p-2"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  // Dashboard view after login
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-gray-600">Welcome, Admin! 🎉</p>
      {/* Later: Add order management, analytics, etc. */}
    </div>
  );
}
