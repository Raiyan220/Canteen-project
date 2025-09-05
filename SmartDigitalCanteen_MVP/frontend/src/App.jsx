// frontend/src/App.jsx (UPDATED - add new routes and context)
import { Route, Routes, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext"; // NEW
import Home from "./pages/Home.jsx";
import OrderHistory from "./pages/OrderHistory.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Login from "./pages/Login.jsx"; // NEW
import Register from "./pages/Register.jsx"; // NEW

function AppContent() {
  const { user, logout, isAuthenticated } = useAuth(); // NEW

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-blue-600">
            Smart Digital Canteen
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            <Link to="/history" className="hover:underline">
              Order History
            </Link>
            <Link to="/admin" className="hover:underline">
              Admin
            </Link>
            
            {/* NEW: Authentication links */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Hello, {user?.username}!
                </span>
                <button
                  onClick={logout}
                  className="text-sm hover:underline text-red-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="hover:underline">
                  Login
                </Link>
                <Link to="/register" className="hover:underline">
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<OrderHistory />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} /> {/* NEW */}
          <Route path="/register" element={<Register />} /> {/* NEW */}
        </Routes>
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 py-6">
        © {new Date().getFullYear()} Smart Digital Canteen
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider> {/* NEW: Wrap with AuthProvider */}
      <AppContent />
    </AuthProvider>
  );
}
