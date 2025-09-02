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

  // Sales report state (Feature 13)
  const [salesReport, setSalesReport] = useState(null);
  const [salesRange, setSalesRange] = useState({ start: "", end: "" });

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "12345";

  /** LOGIN */
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
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

  /** ACTIVE ORDERS MANAGEMENT */
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

  /** DAILY REPORT */
  const fetchDailyReport = async () => {
    try {
      const res = await api.get("/api/admin/report/daily", adminHeaders());
      setDailyReport(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  /** SALES REPORT (Feature 13) */
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

  /** LOGIN SCREEN */
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
          <button type="submit" className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700">
            Login
          </button>
        </form>
      </div>
    );
  }

  /** DASHBOARD */
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-gray-600">Manage menu items, active orders & reports 🎉</p>

      {/* Menu Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Item Name" className="border rounded px-3 py-2" required />
        <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Price" className="border rounded px-3 py-2" required />
        <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="border rounded px-3 py-2 col-span-2" />
        <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Image URL" className="border rounded px-3 py-2 col-span-2" />
        <select name="category" value={form.category} onChange={handleChange} className="border rounded px-3 py-2">
          <option>Breakfast</option>
          <option>Lunch</option>
          <option>Drinks</option>
          <option>Snacks</option>
        </select>
        <input name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="Stock (-1 for unlimited)" className="border rounded px-3 py-2" />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isSpecial" checked={form.isSpecial} onChange={handleChange} /> Daily Special
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isOutOfStock" checked={form.isOutOfStock} onChange={handleChange} /> Out of Stock
        </label>
        <button type="submit" className="bg-blue-600 text-white rounded-xl py-2 col-span-2 hover:bg-blue-700">
          {editingItem ? "Update Item" : "Add Item"}
        </button>
      </form>

      {/* Menu Table */}
      <div className="overflow-x-auto bg-white shadow rounded-2xl p-4">
        <table className="w-full table-auto mb-6">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">Price</th>
              <th className="py-2 px-3">Category</th>
              <th className="py-2 px-3">Stock</th>
              <th className="py-2 px-3">Special</th>
              <th className="py-2 px-3">Out of Stock</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map((item) => (
              <tr key={item._id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">{item.name}</td>
                <td className="py-2 px-3">৳ {item.price}</td>
                <td className="py-2 px-3">{item.category}</td>
                <td className="py-2 px-3">{item.stock === -1 ? "Unlimited" : item.stock}</td>
                <td className="py-2 px-3">
                  {item.isSpecial ? "Yes" : "No"}
                  <button onClick={() => toggleDailySpecial(item)} className="ml-2 px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs">
                    Toggle
                  </button>
                </td>
                <td className="py-2 px-3">{item.isOutOfStock ? "Yes" : "No"}</td>
                <td className="py-2 px-3 flex gap-2">
                  <button onClick={() => handleEdit(item)} className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500">Edit</button>
                  <button onClick={() => handleDelete(item._id)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active Orders Table */}
      <div className="overflow-x-auto bg-white shadow rounded-2xl p-4">
        <h2 className="text-xl font-semibold mb-4">Active Orders</h2>
        <table className="w-full table-auto mb-6">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 px-3">Order ID</th>
              <th className="py-2 px-3">Customer</th>
              <th className="py-2 px-3">Items</th>
              <th className="py-2 px-3">Total</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeOrders.map((order) => (
              <tr key={order._id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">{order._id}</td>
                <td className="py-2 px-3">{order.customerName}</td>
                <td className="py-2 px-3">{order.items.map(it => `${it.name} x${it.qty}`).join(", ")}</td>
                <td className="py-2 px-3">৳ {order.total}</td>
                <td className="py-2 px-3">{order.status}</td>
                <td className="py-2 px-3 flex gap-2 flex-wrap">
                  {["Pending", "Preparing", "Ready"].includes(order.status) && (
                    <>
                      {order.status !== "Preparing" && <button onClick={() => updateOrderStatus(order._id, "Preparing")} className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500">Preparing</button>}
                      {order.status !== "Ready" && <button onClick={() => updateOrderStatus(order._id, "Ready")} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Ready</button>}
                      {order.status !== "Collected" && <button onClick={() => updateOrderStatus(order._id, "Collected")} className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">Collected</button>}
                      {order.status !== "Cancelled" && <button onClick={() => updateOrderStatus(order._id, "Cancelled")} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Cancel</button>}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Daily Report */}
      {dailyReport && (
        <div className="bg-white shadow rounded-2xl p-4">
          <h2 className="text-xl font-semibold mb-4">Daily Report ({dailyReport.date})</h2>
          <p>Total Orders: <strong>{dailyReport.totalOrders}</strong></p>
          <p>Revenue: <strong>৳ {dailyReport.revenue}</strong></p>
          <h3 className="font-semibold mt-3">Top Selling Items:</h3>
          <ul className="list-disc ml-5">
            {dailyReport.topSelling.map((item) => (
              <li key={item.name}>{item.name} x {item.qty}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Sales Report (Feature 13) */}
      <div className="bg-white shadow rounded-2xl p-4">
        <h2 className="text-xl font-semibold mb-4">Sales Report</h2>
        <div className="flex gap-2 mb-3 flex-wrap">
          <label>
            Start Date:{" "}
            <input type="date" name="start" value={salesRange.start} onChange={handleSalesRangeChange} className="border rounded px-2 py-1" />
          </label>
          <label>
            End Date:{" "}
            <input type="date" name="end" value={salesRange.end} onChange={handleSalesRangeChange} className="border rounded px-2 py-1" />
          </label>
          <button onClick={fetchSalesReport} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
            Fetch Report
          </button>
        </div>

        {salesReport && (
          <div>
            <p>Total Orders: <strong>{salesReport.totalOrders}</strong></p>
            <p>Revenue: <strong>৳ {salesReport.revenue}</strong></p>
            <h3 className="font-semibold mt-2">Top Selling Items:</h3>
            <ul className="list-disc ml-5">
              {salesReport.topSelling.map((item) => (
                <li key={item.name}>{item.name} x {item.qty}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
