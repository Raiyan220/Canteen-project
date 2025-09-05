import { useState, useEffect } from "react";
import { api, adminHeaders } from "../api/api";

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");

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

  const [activeOrders, setActiveOrders] = useState([]);
  const [dailyReport, setDailyReport] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [salesRange, setSalesRange] = useState({ start: "", end: "" });

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "12345";

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

  const fetchMenuItems = async () => {
    try {
      const res = await api.get("/api/menu", adminHeaders());
      setMenuItems(res.data);
    } catch (err) {
      console.error(err);
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
      } else {
        const res = await api.post("/api/admin/menu", form, adminHeaders());
        setMenuItems([res.data, ...menuItems]);
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
      console.error(err);
      alert("Error saving menu item");
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
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/api/admin/menu/${id}`, adminHeaders());
      setMenuItems(menuItems.filter((item) => item._id !== id));
    } catch (err) {
      console.error(err);
      alert("Error deleting item");
    }
  };

  const toggleDailySpecial = async (item) => {
    try {
      const updated = { ...item, isSpecial: !item.isSpecial };
      const res = await api.put(`/api/admin/menu/${item._id}`, updated, adminHeaders());
      setMenuItems(menuItems.map((i) => (i._id === item._id ? res.data : i)));
    } catch (err) {
      console.error(err);
      alert("Error updating Daily Special status");
    }
  };

  // NEW: Toggle Out of Stock Status
  const toggleOutOfStock = async (item) => {
    try {
      const updated = { ...item, isOutOfStock: !item.isOutOfStock };
      const res = await api.put(`/api/admin/menu/${item._id}`, updated, adminHeaders());
      setMenuItems(menuItems.map((i) => (i._id === item._id ? res.data : i)));
      
      const status = updated.isOutOfStock ? "OUT OF STOCK" : "BACK IN STOCK";
      alert(`✅ ${item.name} marked as ${status}`);
    } catch (err) {
      console.error(err);
      alert("Error updating stock status");
    }
  };

  const fetchActiveOrders = async () => {
    try {
      const res = await api.get("/api/admin/orders", adminHeaders());
      setActiveOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/api/admin/orders/${orderId}/status`, { status: newStatus }, adminHeaders());
      fetchActiveOrders();
    } catch (err) {
      console.error(err);
      alert("Error updating order status");
    }
  };

  const fetchDailyReport = async () => {
    try {
      const res = await api.get("/api/admin/report/daily", adminHeaders());
      setDailyReport(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSalesReport = async () => {
    try {
      if (!salesRange.start || !salesRange.end) {
        alert("Please select both start and end dates.");
        return;
      }
      const res = await api.get(`/api/admin/report/sales?start=${salesRange.start}&end=${salesRange.end}`, adminHeaders());
      setSalesReport(res.data);
    } catch (err) {
      console.error(err);
      alert("Error fetching sales report");
    }
  };

  const handleSalesRangeChange = (e) => {
    const { name, value } = e.target;
    setSalesRange((prev) => ({ ...prev, [name]: value }));
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={() => setIsLoggedIn(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Logout
            </button>
          </div>

          <div className="space-y-8">
            {/* Menu Management Section */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Menu Management</h2>
                
                {/* Menu Form */}
                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Item Name"
                      className="border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="Price"
                      className="border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-md px-3 py-2"
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
                      className="border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Description"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows="3"
                  />
                  <input
                    type="url"
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleChange}
                    placeholder="Image URL"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  <div className="flex space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isSpecial"
                        checked={form.isSpecial}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Daily Special
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isOutOfStock"
                        checked={form.isOutOfStock}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="text-red-600 font-medium">Mark as Out of Stock</span>
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    {editingItem ? "Update Item" : "Add Item"}
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
                      className="ml-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                    >
                      Cancel Edit
                    </button>
                  )}
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
                              {item.isSpecial ? "Special" : "Regular"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => toggleDailySpecial(item)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Toggle Special
                            </button>
                            {/* NEW: Stock Toggle Button */}
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
                </div>
              </div>
            </div>

            {/* Active Orders Section */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Active Orders</h2>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.items.map(it => `${it.name} x${it.qty}`).join(", ")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">৳{order.total}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.status}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                            {order.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => updateOrderStatus(order._id, "Preparing")}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                                >
                                  Start Preparing
                                </button>
                                <button
                                  onClick={() => updateOrderStatus(order._id, "Cancelled")}
                                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            
                            {order.status === "Preparing" && (
                              <>
                                <button
                                  onClick={() => updateOrderStatus(order._id, "Ready")}
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                                >
                                  Mark Ready
                                </button>
                                <button
                                  onClick={() => updateOrderStatus(order._id, "Cancelled")}
                                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            
                            {order.status === "Ready" && (
                              <button
                                onClick={() => updateOrderStatus(order._id, "Collected")}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs"
                              >
                                Mark Collected
                              </button>
                            )}
                            
                            {(order.status === "Collected" || order.status === "Cancelled") && (
                              <span className="text-gray-500 text-xs">Complete</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Reports Section */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Daily Report */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Daily Report</h2>
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
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Top Selling Items:</h3>
                        <ul className="space-y-1">
                          {dailyReport.topSelling.map((item, index) => (
                            <li key={index} className="text-sm text-gray-600">
                              {item.name}: {item.qty} sold
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sales Report */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Custom Sales Report</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="date"
                        name="start"
                        value={salesRange.start}
                        onChange={handleSalesRangeChange}
                        className="border border-gray-300 rounded-md px-3 py-2"
                      />
                      <input
                        type="date"
                        name="end"
                        value={salesRange.end}
                        onChange={handleSalesRangeChange}
                        className="border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <button
                      onClick={fetchSalesReport}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                    >
                      Generate Report
                    </button>
                    {salesReport && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">Total Orders:</p>
                          <p className="text-2xl font-bold text-blue-600">{salesReport.totalOrders}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-green-900">Revenue:</p>
                          <p className="text-2xl font-bold text-green-600">৳{salesReport.revenue}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-2">Top Selling Items:</h3>
                          <ul className="space-y-1">
                            {salesReport.topSelling.map((item, index) => (
                              <li key={index} className="text-sm text-gray-600">
                                {item.name}: {item.qty} sold
                              </li>
                            ))}
                          </ul>
                        </div>
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
