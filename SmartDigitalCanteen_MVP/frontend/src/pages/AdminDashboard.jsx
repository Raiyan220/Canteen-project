import { useState, useEffect } from "react";
import { api, adminHeaders } from "../api/api";

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");

  // Menu management state (PRESERVED)
  const [menuItems, setMenuItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Breakfast",
    imageUrl: "",
    stock: -1,
    isOutOfStock: false,
    isSpecial: false,
  });

  // Active orders state (PRESERVED)
  const [activeOrders, setActiveOrders] = useState([]);

  // Daily report state (PRESERVED)
  const [dailyReport, setDailyReport] = useState(null);

  // Sales report state (PRESERVED)
  const [salesReport, setSalesReport] = useState(null);
  const [salesRange, setSalesRange] = useState({ start: "", end: "" });

  // NEW: Active tab for better UX
  const [activeTab, setActiveTab] = useState("overview");

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "12345";

  /** LOGIN (PRESERVED LOGIC) */
  const handleLogin = (e) => {
    e.preventDefault();
    if (password.trim() === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setError("");
      fetchMenuItems();
      fetchActiveOrders();
      fetchDailyReport();
    } else {
      setError("Invalid password. Try again.");
    }
  };

  /** MENU MANAGEMENT (ALL PRESERVED) */
  const fetchMenuItems = async () => {
    try {
      const res = await api.get("/api/menu", adminHeaders());
      console.log("Fetched menu items:", res.data);
      setMenuItems(res.data);
    } catch (err) {
      console.error("Error fetching menu items:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const res = await api.put(`/api/admin/menu/${editingItem._id}`, form, adminHeaders());
        setMenuItems(menuItems.map((item) => (item._id === editingItem._id ? res.data : item)));
        setEditingItem(null);
        alert(`✅ ${form.name} updated successfully!`);
      } else {
        const res = await api.post("/api/admin/menu", form, adminHeaders());
        setMenuItems([res.data, ...menuItems]);
        alert(`✅ ${form.name} added successfully!`);
      }
      setForm({
        name: "",
        description: "",
        price: "",
        category: "Breakfast",
        imageUrl: "",
        stock: -1,
        isOutOfStock: false,
        isSpecial: false,
      });
    } catch (err) {
      console.error("Error saving menu item:", err);
      alert("❌ Error saving menu item: " + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl,
      stock: item.stock,
      isOutOfStock: item.isOutOfStock,
      isSpecial: item.isSpecial,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveTab("menu"); // Switch to menu tab when editing
  };

  const handleDelete = async (id) => {
    const item = menuItems.find(i => i._id === id);
    if (!confirm(`Are you sure you want to delete "${item?.name}"? This action cannot be undone.`)) return;
    
    try {
      await api.delete(`/api/admin/menu/${id}`, adminHeaders());
      setMenuItems(menuItems.filter((item) => item._id !== id));
      alert(`✅ ${item?.name} deleted successfully!`);
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("❌ Error deleting item: " + (err.response?.data?.error || err.message));
    }
  };

  const toggleDailySpecial = async (item) => {
    try {
      const updated = { ...item, isSpecial: !item.isSpecial };
      const res = await api.put(`/api/admin/menu/${item._id}`, updated, adminHeaders());
      setMenuItems(menuItems.map((i) => (i._id === item._id ? res.data : i)));
      
      const status = updated.isSpecial ? "DAILY SPECIAL" : "REGULAR ITEM";
      alert(`✅ ${item.name} marked as ${status}`);
    } catch (err) {
      console.error("Error updating special status:", err);
      alert("❌ Error updating Daily Special status");
    }
  };

  // PRESERVED: Toggle Out of Stock Status with proper React state management
  const toggleOutOfStock = async (item) => {
    try {
      console.log("Toggling stock status for:", item.name, "Current isOutOfStock:", item.isOutOfStock);
      
      const updated = { ...item, isOutOfStock: !item.isOutOfStock };
      const res = await api.put(`/api/admin/menu/${item._id}`, updated, adminHeaders());
      
      console.log("Server response:", res.data);
      
      // PRESERVED: Proper state update to trigger re-render
      setMenuItems(prevItems => {
        const newItems = prevItems.map(i => 
          i._id === item._id ? res.data : i
        );
        console.log("Updated menu items:", newItems);
        return newItems;
      });
      
      const status = res.data.isOutOfStock ? "OUT OF STOCK" : "BACK IN STOCK";
      alert(`✅ ${item.name} marked as ${status}`);
    } catch (err) {
      console.error("Error updating stock status:", err);
      alert("❌ Failed to update stock status. Please try again.");
    }
  };

  /** ACTIVE ORDERS MANAGEMENT (ALL PRESERVED) */
  const fetchActiveOrders = async () => {
    try {
      const res = await api.get("/api/admin/orders", adminHeaders());
      setActiveOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/api/admin/orders/${orderId}/status`, { status: newStatus }, adminHeaders());
      fetchActiveOrders();
      alert(`✅ Order status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("❌ Error updating order status: " + (err.response?.data?.error || err.message));
    }
  };

  /** DAILY REPORT (PRESERVED) */
  const fetchDailyReport = async () => {
    try {
      const res = await api.get("/api/admin/report/daily", adminHeaders());
      setDailyReport(res.data);
    } catch (err) {
      console.error("Error fetching daily report:", err);
    }
  };

  /** SALES REPORT (PRESERVED) */
  const fetchSalesReport = async () => {
    try {
      if (!salesRange.start || !salesRange.end) {
        alert("Please select both start and end dates.");
        return;
      }
      const res = await api.get(`/api/admin/report/sales?start=${salesRange.start}&end=${salesRange.end}`, adminHeaders());
      setSalesReport(res.data);
    } catch (err) {
      console.error("Error fetching sales report:", err);
      alert("❌ Error fetching sales report");
    }
  };

  const handleSalesRangeChange = (e) => {
    const { name, value } = e.target;
    setSalesRange((prev) => ({ ...prev, [name]: value }));
  };

  // PRESERVED: Auto-refresh orders every 30 seconds
  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(fetchActiveOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  /** PROFESSIONAL LOGIN SCREEN */
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iLjEiPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjIiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="relative max-w-md w-full mx-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-3xl shadow-2xl mb-6 transform rotate-3">
              <svg className="w-10 h-10 text-white transform -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">🛡️ Admin Portal</h2>
            <p className="text-slate-400 text-lg mb-4">Restaurant Management System</p>
            
            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-6 text-sm text-slate-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Secure Access</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Encrypted</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Authorized Only</span>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-semibold mb-3">
                  🔐 Administrator Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter secure admin password"
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 backdrop-blur-sm transition-all duration-200 focus:bg-white/20"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                🔓 Secure Login
              </button>
            </form>

            <div className="mt-8 text-center">
              <a href="/" className="text-slate-400 hover:text-white text-sm transition-colors inline-flex items-center space-x-2 group">
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Customer Portal</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Professional Header */}
      <header className="bg-white shadow-lg border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Section */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">🛡️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-slate-500 font-medium">Restaurant Management Portal</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{menuItems.length}</div>
                <div className="text-xs text-slate-500 font-medium">Menu Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{activeOrders.length}</div>
                <div className="text-xs text-slate-500 font-medium">Active Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{dailyReport?.totalOrders || 0}</div>
                <div className="text-xs text-slate-500 font-medium">Today's Orders</div>
              </div>
            </div>

            {/* Admin Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchActiveOrders}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'menu', label: 'Menu Management', icon: '🍽️' },
              { id: 'orders', label: 'Order Management', icon: '📋' },
              { id: 'reports', label: 'Analytics & Reports', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Total Menu Items</p>
                    <p className="text-2xl font-bold text-slate-900">{menuItems.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Active Orders</p>
                    <p className="text-2xl font-bold text-slate-900">{activeOrders.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Today's Orders</p>
                    <p className="text-2xl font-bold text-slate-900">{dailyReport?.totalOrders || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Today's Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">৳{dailyReport?.revenue || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('menu')}
                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 p-4 rounded-lg transition-colors text-left"
                >
                  <div className="text-2xl mb-2">➕</div>
                  <div className="font-medium">Add New Menu Item</div>
                  <div className="text-sm text-blue-600">Create a new dish or beverage</div>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 p-4 rounded-lg transition-colors text-left"
                >
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-medium">Manage Orders</div>
                  <div className="text-sm text-green-600">Update order statuses</div>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 p-4 rounded-lg transition-colors text-left"
                >
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-medium">View Reports</div>
                  <div className="text-sm text-purple-600">Analyze sales data</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Menu Management Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            {/* Menu Form */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">
                {editingItem ? '✏️ Edit Menu Item' : '➕ Add New Menu Item'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g., Chicken Biriyani"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Price (৳) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    >
                      <option value="Breakfast">🍳 Breakfast</option>
                      <option value="Lunch">🍽️ Lunch</option>
                      <option value="Drinks">🥤 Drinks</option>
                      <option value="Snacks">🍿 Snacks</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={form.stock}
                      onChange={handleChange}
                      placeholder="-1 for unlimited"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    />
                    <p className="text-sm text-slate-500 mt-1">Use -1 for unlimited stock</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the dish, ingredients, or special features..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isSpecial"
                      checked={form.isSpecial}
                      onChange={handleChange}
                      className="w-5 h-5 text-yellow-600 border-slate-300 rounded focus:ring-yellow-500"
                    />
                    <span className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                      <span>⭐</span>
                      <span>Mark as Daily Special</span>
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isOutOfStock"
                      checked={form.isOutOfStock}
                      onChange={handleChange}
                      className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                      <span>❌</span>
                      <span>Mark as Out of Stock</span>
                    </span>
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{editingItem ? 'Update Item' : 'Add Item'}</span>
                  </button>
                  
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setForm({
                          name: "",
                          description: "",
                          price: "",
                          category: "Breakfast",
                          imageUrl: "",
                          stock: -1,
                          isOutOfStock: false,
                          isSpecial: false,
                        });
                      }}
                      className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Cancel Edit</span>
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Menu Items Table */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">🍽️ Menu Items ({menuItems.length})</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stock Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Special</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {menuItems.map((item) => (
                      <tr key={item._id} className={`hover:bg-slate-50 transition-colors ${item.isOutOfStock ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center mr-3">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <span className="text-slate-500">🍽️</span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900">{item.name}</div>
                              <div className="text-sm text-slate-500 truncate max-w-xs">{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                          ৳{item.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.isOutOfStock || item.stock === 0 ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              ❌ Out of Stock
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              ✅ In Stock ({item.stock === -1 ? '∞' : item.stock})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.isSpecial ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {item.isSpecial ? "⭐ Special" : "Regular"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            title="Edit item"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                            title="Delete item"
                          >
                            🗑️
                          </button>
                          <button
                            onClick={() => toggleDailySpecial(item)}
                            className="text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 px-2 py-1 rounded transition-colors"
                            title="Toggle Daily Special"
                          >
                            ⭐
                          </button>
                          <button
                            onClick={() => toggleOutOfStock(item)}
                            className={`px-2 py-1 rounded transition-colors ${
                              item.isOutOfStock 
                                ? 'text-green-600 hover:text-green-900 hover:bg-green-50' 
                                : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                            }`}
                            title={item.isOutOfStock ? 'Mark as Available' : 'Mark as Out of Stock'}
                          >
                            {item.isOutOfStock ? '✅' : '❌'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {menuItems.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4 text-slate-300">🍽️</div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No menu items found</h3>
                    <p className="text-slate-500">Add your first menu item to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders Management Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-8">
            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">📋 Active Orders ({activeOrders.length})</h3>
                <button
                  onClick={fetchActiveOrders}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {activeOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">#{order._id.slice(-6)}</div>
                          <div className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">{order.customerName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">
                            {order.items.map(it => `${it.name} x${it.qty}`).join(", ")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-900">৳{order.total}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'Preparing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'Ready' ? 'bg-green-100 text-green-800' :
                            order.status === 'Collected' ? 'bg-slate-100 text-slate-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {order.status === "Pending" && (
                            <>
                              <button
                                onClick={() => updateOrderStatus(order._id, "Preparing")}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                              >
                                👨‍🍳 Start
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order._id, "Cancelled")}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                              >
                                ❌ Cancel
                              </button>
                            </>
                          )}
                          
                          {order.status === "Preparing" && (
                            <>
                              <button
                                onClick={() => updateOrderStatus(order._id, "Ready")}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                              >
                                ✅ Ready
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order._id, "Cancelled")}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                              >
                                ❌ Cancel
                              </button>
                            </>
                          )}
                          
                          {order.status === "Ready" && (
                            <button
                              onClick={() => updateOrderStatus(order._id, "Collected")}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                            >
                              📦 Collected
                            </button>
                          )}
                          
                          {(order.status === "Collected" || order.status === "Cancelled") && (
                            <span className="text-slate-500 text-xs italic">
                              {order.status === "Collected" ? "✅ Complete" : "❌ Cancelled"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {activeOrders.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4 text-slate-300">📋</div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No active orders</h3>
                    <p className="text-slate-500">Orders from customers will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            {/* Reports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Report */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">📊 Daily Report</h3>
                  <button
                    onClick={fetchDailyReport}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                </div>
                
                {dailyReport ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Total Orders</p>
                        <p className="text-2xl font-bold text-blue-600">{dailyReport.totalOrders}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-green-900 mb-1">Revenue</p>
                        <p className="text-2xl font-bold text-green-600">৳{dailyReport.revenue}</p>
                      </div>
                    </div>
                    
                    {dailyReport.topSelling && dailyReport.topSelling.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 mb-3">🏆 Top Selling Items</h4>
                        <div className="space-y-2">
                          {dailyReport.topSelling.map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                              <span className="text-sm text-slate-600">{item.name}</span>
                              <span className="text-sm font-medium text-slate-900">{item.qty} sold</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-slate-400 mb-2">📊</div>
                    <p className="text-slate-500">Click refresh to load today's report</p>
                  </div>
                )}
              </div>

              {/* Sales Report */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">📈 Custom Sales Report</h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        name="start"
                        value={salesRange.start}
                        onChange={handleSalesRangeChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                      <input
                        type="date"
                        name="end"
                        value={salesRange.end}
                        onChange={handleSalesRangeChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={fetchSalesReport}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Generate Report</span>
                  </button>
                  
                  {salesReport && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 mb-1">Total Orders</p>
                          <p className="text-2xl font-bold text-blue-600">{salesReport.totalOrders}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-green-900 mb-1">Revenue</p>
                          <p className="text-2xl font-bold text-green-600">৳{salesReport.revenue}</p>
                        </div>
                      </div>
                      
                      {salesReport.topSelling && salesReport.topSelling.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-900 mb-3">🏆 Top Selling Items</h4>
                          <div className="space-y-2">
                            {salesReport.topSelling.map((item, index) => (
                              <div key={index} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                                <span className="text-sm text-slate-600">{item.name}</span>
                                <span className="text-sm font-medium text-slate-900">{item.qty} sold</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
