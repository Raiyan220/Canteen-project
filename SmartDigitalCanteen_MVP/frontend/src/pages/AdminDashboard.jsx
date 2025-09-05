import { useState, useEffect } from "react";
import { api, adminHeaders } from "../api/api";

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");

  // Menu management state
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

  // Active orders state
  const [activeOrders, setActiveOrders] = useState([]);

  // Daily report state
  const [dailyReport, setDailyReport] = useState(null);

  // Sales report state
  const [salesReport, setSalesReport] = useState(null);
  const [salesRange, setSalesRange] = useState({ start: "", end: "" });

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "12345";

  /** LOGIN */
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

  /** MENU MANAGEMENT */
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
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // FIXED: Toggle Out of Stock Status with proper React state management
  const toggleOutOfStock = async (item) => {
    try {
      console.log("Toggling stock status for:", item.name, "Current isOutOfStock:", item.isOutOfStock);
      
      const updated = { ...item, isOutOfStock: !item.isOutOfStock };
      const res = await api.put(`/api/admin/menu/${item._id}`, updated, adminHeaders());
      
      console.log("Server response:", res.data);
      
      // FIXED: Proper state update to trigger re-render
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

  /** ACTIVE ORDERS MANAGEMENT */
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

  /** DAILY REPORT */
  const fetchDailyReport = async () => {
    try {
      const res = await api.get("/api/admin/report/daily", adminHeaders());
      setDailyReport(res.data);
    } catch (err) {
      console.error("Error fetching daily report:", err);
    }
  };

  /** SALES REPORT */
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

  // Auto-refresh orders every 30 seconds
  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(fetchActiveOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  /** LOGIN SCREEN */
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Admin Dashboard
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter admin password to continue
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎯 Admin Dashboard</h1>
              <p className="text-gray-600 text-sm">Manage menu items, active orders & reports</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={fetchActiveOrders}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
              >
                🔄 Refresh Orders
              </button>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {/* MENU MANAGEMENT SECTION */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">📋 Menu Management</h2>
                
                {/* Menu Form */}
                <form onSubmit={handleSubmit} className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Item Name *"
                      className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="Price *"
                      min="0"
                      step="0.01"
                      className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Drinks">Drinks</option>
                      <option value="Snacks">Snacks</option>
                    </select>
                    <input
                      type="number"
                      name="stock"
                      value={form.stock}
                      onChange={handleChange}
                      placeholder="Stock (-1 for unlimited)"
                      className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Description"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                  <input
                    type="url"
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleChange}
                    placeholder="Image URL"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isSpecial"
                        checked={form.isSpecial}
                        onChange={handleChange}
                        className="mr-2 text-blue-600"
                      />
                      <span className="text-yellow-600 font-medium">⭐ Daily Special</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isOutOfStock"
                        checked={form.isOutOfStock}
                        onChange={handleChange}
                        className="mr-2 text-red-600"
                      />
                      <span className="text-red-600 font-medium">❌ Mark as Out of Stock</span>
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200"
                    >
                      {editingItem ? "✅ Update Item" : "➕ Add Item"}
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
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition duration-200"
                      >
                        ❌ Cancel Edit
                      </button>
                    )}
                  </div>
                </form>

                {/* Menu Items Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Special</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {menuItems.map((item) => (
                        <tr key={item._id} className={item.isOutOfStock ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ৳{item.price}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {/* FIXED: Proper stock status display */}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.isSpecial ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.isSpecial ? "⭐ Special" : "Regular"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit item"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete item"
                            >
                              🗑️ Delete
                            </button>
                            <button
                              onClick={() => toggleDailySpecial(item)}
                              className="text-green-600 hover:text-green-900"
                              title="Toggle Daily Special"
                            >
                              ⭐ Toggle Special
                            </button>
                            {/* FIXED: Stock Toggle Button with proper functionality */}
                            <button
                              onClick={() => toggleOutOfStock(item)}
                              className={`font-medium ${
                                item.isOutOfStock 
                                  ? 'text-green-600 hover:text-green-900' 
                                  : 'text-red-600 hover:text-red-900'
                              }`}
                              title={item.isOutOfStock ? 'Mark as Available' : 'Mark as Out of Stock'}
                            >
                              {item.isOutOfStock ? '✅ Stock In' : '❌ Stock Out'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {menuItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🍽️</div>
                      <p>No menu items found. Add some items to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ACTIVE ORDERS SECTION */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">🍽️ Active Orders</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {activeOrders.length} Active
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activeOrders.map((order) => (
                        <tr key={order._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order._id.slice(-6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.items.map(it => `${it.name} x${it.qty}`).join(", ")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ৳{order.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'Preparing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'Ready' ? 'bg-green-100 text-green-800' :
                              order.status === 'Collected' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                            {/* WORKFLOW-BASED BUTTON LOGIC */}
                            {order.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => updateOrderStatus(order._id, "Preparing")}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium"
                                >
                                  👨‍🍳 Start Preparing
                                </button>
                                <button
                                  onClick={() => updateOrderStatus(order._id, "Cancelled")}
                                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium"
                                >
                                  ❌ Cancel
                                </button>
                              </>
                            )}
                            
                            {order.status === "Preparing" && (
                              <>
                                <button
                                  onClick={() => updateOrderStatus(order._id, "Ready")}
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium"
                                >
                                  ✅ Mark Ready
                                </button>
                                <button
                                  onClick={() => updateOrderStatus(order._id, "Cancelled")}
                                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium"
                                >
                                  ❌ Cancel
                                </button>
                              </>
                            )}
                            
                            {order.status === "Ready" && (
                              <button
                                onClick={() => updateOrderStatus(order._id, "Collected")}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs font-medium"
                              >
                                📦 Mark Collected
                              </button>
                            )}
                            
                            {(order.status === "Collected" || order.status === "Cancelled") && (
                              <span className="text-gray-500 text-xs italic">
                                {order.status === "Collected" ? "✅ Complete" : "❌ Cancelled"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {activeOrders.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📋</div>
                      <p>No active orders found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* REPORTS SECTION */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Daily Report */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">📊 Daily Report</h2>
                  
                  <button
                    onClick={fetchDailyReport}
                    className="mb-4 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    🔄 Refresh Report
                  </button>
                  
                  {dailyReport && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">Total Orders:</p>
                        <p className="text-2xl font-bold text-blue-600">{dailyReport.totalOrders}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-green-900">Revenue:</p>
                        <p className="text-2xl font-bold text-green-600">৳{dailyReport.revenue}</p>
                      </div>
                      {dailyReport.topSelling && dailyReport.topSelling.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-2">🏆 Top Selling Items:</h3>
                          <ul className="space-y-1">
                            {dailyReport.topSelling.map((item, index) => (
                              <li key={index} className="text-sm text-gray-600 flex justify-between">
                                <span>{item.name}</span>
                                <span className="font-medium">{item.qty} sold</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!dailyReport && (
                    <div className="text-center py-4 text-gray-500">
                      Click refresh to load today's report
                    </div>
                  )}
                </div>
              </div>

              {/* Sales Report */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">📈 Custom Sales Report</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          name="start"
                          value={salesRange.start}
                          onChange={handleSalesRangeChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          name="end"
                          value={salesRange.end}
                          onChange={handleSalesRangeChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={fetchSalesReport}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition duration-200"
                    >
                      📊 Generate Report
                    </button>
                    
                    {salesReport && (
                      <div className="space-y-4 mt-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">Total Orders:</p>
                          <p className="text-2xl font-bold text-blue-600">{salesReport.totalOrders}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-green-900">Revenue:</p>
                          <p className="text-2xl font-bold text-green-600">৳{salesReport.revenue}</p>
                        </div>
                        {salesReport.topSelling && salesReport.topSelling.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-2">🏆 Top Selling Items:</h3>
                            <ul className="space-y-1">
                              {salesReport.topSelling.map((item, index) => (
                                <li key={index} className="text-sm text-gray-600 flex justify-between">
                                  <span>{item.name}</span>
                                  <span className="font-medium">{item.qty} sold</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
