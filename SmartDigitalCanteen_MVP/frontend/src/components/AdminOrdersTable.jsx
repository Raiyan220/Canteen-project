import { useEffect, useState } from "react";
import { api, adminHeaders } from "../api/api";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminOrdersTable() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");

  const load = () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    api.get("/api/admin/orders", { params, ...adminHeaders() }).then(res => setOrders(res.data));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [statusFilter]);

  const update = (id, status) => {
    api.patch(`/api/admin/orders/${id}/status`, { status }, adminHeaders()).then(load);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <h2 className="font-semibold text-xl text-gray-800">Active Orders</h2>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All</option>
          <option>Pending</option>
          <option>Preparing</option>
          <option>Ready</option>
          <option>Collected</option>
          <option>Cancelled</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-3 text-left font-medium">Order</th>
              <th className="py-2 px-3 text-left font-medium">Customer</th>
              <th className="py-2 px-3 text-left font-medium">Items</th>
              <th className="py-2 px-3 text-left font-medium">Total</th>
              <th className="py-2 px-3 text-left font-medium">Status</th>
              <th className="py-2 px-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {orders.map(o => (
                <motion.tr
                  key={o._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-2 px-3">#{o._id.slice(-6)}</td>
                  <td className="py-2 px-3">{o.customerName}</td>
                  <td className="py-2 px-3">{o.items.map(i => i.name + "×" + i.qty).join(", ")}</td>
                  <td className="py-2 px-3">৳ {o.total}</td>
                  <td className="py-2 px-3 font-medium">{o.status}</td>
                  <td className="py-2 px-3 flex flex-wrap gap-1">
                    {["Pending", "Preparing", "Ready", "Collected", "Cancelled"].map(s => (
                      <button
                        key={s}
                        onClick={() => update(o._id, s)}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm hover:bg-blue-50 transition"
                      >
                        {s}
                      </button>
                    ))}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
